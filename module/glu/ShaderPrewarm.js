// GLUniverse Dice: shader prewarm (ROADMAP M2).
//
// three.js compiles a material's shader program the first time it renders, so the first throw
// with a new appearance hitches while the GPU driver compiles. Once Dice3D has loaded fonts,
// presets and the dice library, build the current user's dice once (through the same
// DiceFactory.create path a throw uses, so the materials land in the factory's caches), and let
// renderer.compileAsync build their programs off the critical path.
//
// Called once from the end of Dice3D.init's load chain. It never throws.
import { MODULE_ID } from './LegacyIdentity.js';
import { DsnSettings } from '../settings/DsnSettings.js';

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
        const appearances = DsnSettings.APPEARANCE(game.user);
        const added = [];
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
            //compileAsync ignores the frustum; keep it out of sight anyway in case a frame
            //renders while the programs compile
            mesh.position.set(0, -1000, 0);
            scene.add(mesh);
            added.push(mesh);
        }
        try {
            if (added.length) await renderer.compileAsync(scene, camera);
        } finally {
            //the materials and geometries are the factory's caches: remove, don't dispose
            for (const mesh of added) scene.remove(mesh);
        }
        const result = { ms: Math.round(performance.now() - t0), programs: (renderer.info.programs?.length ?? 0) - before };
        console.debug(`${MODULE_ID} | shader prewarm: ${added.length} dice, ${result.programs} new programs, ${result.ms} ms`);
        return result;
    } catch (err) {
        console.warn(`${MODULE_ID} | shader prewarm skipped`, err);
        return null;
    }
}
