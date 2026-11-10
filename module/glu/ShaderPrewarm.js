// GLUniverse Dice: shader prewarm (ROADMAP M2).
//
// three.js compiles a material's shader program the first time it renders, so the first throw
// with a new appearance hitches while the GPU driver compiles. Once Dice3D has loaded fonts,
// presets and the dice library, build the current user's dice once (through the same
// DiceFactory.create path a throw uses, so the materials land in the factory's caches), let
// renderer.compileAsync build their programs off the critical path, then draw one unseen frame
// of them, for the texture uploads and the post-processing passes.
//
// Called once from the end of Dice3D.init's load chain. It never throws.
import { MODULE_ID } from './LegacyIdentity.js';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { DsnSettings } from '../settings/DsnSettings.js';
import { compileForBoard, renderBoard } from './RenderBoard.js';

export const PREWARM_SETTING = "shaderPrewarm";
const TYPES = ["d4", "d6", "d8", "d10", "d12", "d20"];

export function registerPrewarmSetting() {
    game.settings.register(MODULE_ID, PREWARM_SETTING, {
        name: "GLUDICE.Settings.ShaderPrewarm.Name",
        hint: "GLUDICE.Settings.ShaderPrewarm.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });
}

function enabled() {
    try {
        return game.settings.get(MODULE_ID, PREWARM_SETTING) !== false;
    } catch {
        return false;
    }
}

/**
 * @param {object} dice3d game.dice3d
 * @returns {Promise<{ms:number, programs:number}|null>}
 */
export async function prewarmBoard(dice3d) {
    try {
        if (!enabled()) return null;
        const box = dice3d?.box;
        if (!box?.ready) return null;
        await box.ready;
        const renderer = box.renderer;
        const scene = box.scene;
        const camera = box.camera;
        const factory = dice3d.DiceFactory;
        if (!renderer?.compileAsync || !scene || !camera || !factory) return null;

        const t0 = performance.now();
        const before = renderer.info.programs?.length ?? 0;
        const size = factory.baseScale || 0.016;
        const appearances = DsnSettings.APPEARANCE(game.user);
        const added = [];
        const group = new Group();
        for (const type of TYPES) {
            let appearance;
            try {
                appearance = factory.getAppearanceForDice(appearances, type);
            } catch {
                continue;
            }
            if (!factory.resolvePreset(type, appearance)) continue;
            const mesh = await factory.create(renderer.scopedTextureCache, type, appearance);
            if (!mesh) continue;
            //in a row on the desk, in view of the camera for the unseen frame below
            mesh.position.set((added.length - TYPES.length / 2) * size * 3, size, 0);
            group.add(mesh);
            added.push(mesh);
        }
        //something glowing, so the frame below also builds the bloom chain
        const glow = new Mesh(new BoxGeometry(size, size, size), new MeshStandardMaterial({ emissive: 0xffffff }));
        glow.layers.enable(1);
        glow.position.set(0, size, size * 3);
        group.add(glow);
        try {
            if (added.length) {
                //compiled detached, against the board's lights: nothing of it is in the scene
                //while this waits, in case the board draws meanwhile (persistent dice, a roll)
                await compileForBoard(box, group, scene);
                //one real frame of them: it uploads the dice textures and compiles every pass,
                //which compileAsync does not, so the first roll doesn't. The board is drawn
                //again without them in the same task, so the screen only shows that frame.
                if (!box.throwEngine?.rolling) {
                    scene.add(group);
                    try {
                        renderBoard(box);
                    } finally {
                        scene.remove(group);
                        renderBoard(box);
                    }
                }
            }
        } finally {
            //the dice materials and geometries are the factory's caches: don't dispose them
            glow.geometry.dispose();
            glow.material.dispose();
        }
        const result = { ms: Math.round(performance.now() - t0), programs: (renderer.info.programs?.length ?? 0) - before };
        console.debug(`${MODULE_ID} | shader prewarm: ${added.length} dice, ${result.programs} new programs, ${result.ms} ms`);
        return result;
    } catch (err) {
        console.warn(`${MODULE_ID} | shader prewarm skipped`, err);
        return null;
    }
}
