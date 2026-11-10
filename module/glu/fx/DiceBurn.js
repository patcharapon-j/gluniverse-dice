// GLUniverse Dice: how long thrown dice stay, and how they leave (ROADMAP M5 follow-up).
//
// - World setting `diceLinger`: seconds the thrown dice stay on the table before they leave,
//   for every client (Dice So Nice's own "time before hide" is per user). 0 keeps each user's
//   Dice So Nice setting.
// - Client setting `burnAway`: the dice dissolve into light instead of Dice So Nice's fade or
//   instant hide. Each die burns away in blotches: holes open at a few spots, spread and merge,
//   loosely from the top of the screen down, behind a torn white-hot edge; the surface just
//   ahead of it bleaches toward white. The forged result number (DiceFx's overlay) burns with
//   the same front, so it goes where the face under it goes. No flame colours, no particles.
//
// Hook: Dice3D._afterShow, the hide timer (hideDelayMs for its delay, burnAwayDice in place of
// its hide). Persistent dice never burn. Each burning die gets its own copy of its material:
// DSN shares materials between dice, and its own fade changes the shared opacity. While it
// burns, the die is on layer 1 so DSN's selective bloom catches the white edge.
import { Color, Group, Mesh, MeshDepthMaterial, RGBADepthPacking, Vector3 } from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';
import { renderBoard, warnFrameOnce } from '../RenderBoard.js';
import { retireMaterial } from '../ProgramKeeper.js';

export const LINGER_SETTING = "diceLinger";
export const BURN_SETTING = "burnAway";

//seconds for one die to burn away
const SWEEP_S = 1.9;
//dice don't all go at once; the order is random, the gaps small
const STAGGER_S = 0.3;
//the shadow goes when this much of the burn is done, if its depth pass could not be patched
const SHADOW_OFF = 0.62;
//the front's range: the burn time gluN spans about 0..1, a little past it with the crackle
const FRONT_FROM = -0.12, FRONT_TO = 1.12;
//the warm-up frame: a front this far back burns nothing and lights nothing
const FRONT_IDLE = -10;

export function registerBurnSettings() {
    game.settings.register(MODULE_ID, LINGER_SETTING, {
        name: "GLUDICE.Settings.DiceLinger.Name",
        hint: "GLUDICE.Settings.DiceLinger.Hint",
        scope: "world",
        config: true,
        type: Number,
        range: { min: 0, max: 60, step: 1 },
        default: 5
    });
    game.settings.register(MODULE_ID, BURN_SETTING, {
        name: "GLUDICE.Settings.BurnAway.Name",
        hint: "GLUDICE.Settings.BurnAway.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });
}

function setting(key, fallback) {
    try {
        return game.settings.get(MODULE_ID, key);
    } catch {
        return fallback;
    }
}

function reducedMotion() {
    try {
        return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    } catch {
        return false;
    }
}

/** Dice3D._afterShow: the delay before the thrown dice leave, in ms. */
export function hideDelayMs(upstreamMs) {
    const s = Number(setting(LINGER_SETTING, 5));
    return s > 0 ? s * 1000 : upstreamMs;
}

const BURN_VERTEX_PARS = /* glsl */`
varying vec3 vGluBurnW;
`;
// after <project_vertex>: `transformed` is final there (DSN's model scale included)
const BURN_VERTEX = /* glsl */`
vGluBurnW = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;
const BURN_FRAGMENT_PARS = /* glsl */`
uniform float gluBurn;
uniform float gluBurnSeed;
uniform vec3 gluBurnCentre;
uniform float gluBurnRadius;
uniform vec3 gluBurnDown;
uniform float gluBurnBloom;
varying vec3 vGluBurnW;
float gluBHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float gluBNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(gluBHash(i), gluBHash(i + vec3(1, 0, 0)), f.x), mix(gluBHash(i + vec3(0, 1, 0)), gluBHash(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(gluBHash(i + vec3(0, 0, 1)), gluBHash(i + vec3(1, 0, 1)), f.x), mix(gluBHash(i + vec3(0, 1, 1)), gluBHash(i + vec3(1, 1, 1)), f.x), f.y),
        f.z);
}
float gluBFbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
        s += a * gluBNoise(p);
        p = p * 2.07 + vec3(1.7, 9.2, 3.1);
        a *= 0.5;
    }
    return s;
}
float gluBFbm2(vec3 p) {
    return gluBNoise(p) * 0.65 + gluBNoise(p * 2.03 + vec3(4.1, 7.3, 1.9)) * 0.35;
}
vec3 gluBurnGlow = vec3(0.0);
`;
// gluN is when this point goes, 0 first, 1 last. Mostly blotches (warped noise: a few holes
// open, spread and merge), a third of it the screen's top-to-bottom, so the die still reads as
// going from the top; a fine crackle tears the edge. Shared by the die, its shadow and its
// number, in world space, so all three burn as one.
const BURN_FRONT = /* glsl */`
    vec3 gluP = (vGluBurnW - gluBurnCentre) / gluBurnRadius;
    vec3 gluQ = gluP * 1.9 + vec3(gluBurnSeed);
    vec3 gluWarp = vec3(gluBFbm2(gluQ), gluBFbm2(gluQ + vec3(5.2, 1.3, 7.7)), gluBFbm2(gluQ + vec3(2.9, 8.1, 4.4))) - 0.5;
    float gluBlot = clamp((gluBFbm(gluQ * 1.35 + gluWarp * 2.2) - 0.28) / 0.44, 0.0, 1.0);
    float gluN = (dot(gluP, gluBurnDown) * 0.5 + 0.5) * 0.34 + gluBlot * 0.66
        + (gluBNoise(gluP * 21.0 + vec3(gluBurnSeed)) - 0.5) * 0.05;
    float gluEdge = gluN - gluBurn;
    if (gluEdge < 0.0) discard;
`;
const BURN_FRAGMENT = /* glsl */`
{
${BURN_FRONT}
    //white light, never fire: a hairline core, a soft halo with a breath of lavender, and the
    //surface ahead bleaching toward white as the light reaches it
    float gluCore = exp(-gluEdge / 0.012);
    float gluHalo = exp(-gluEdge / 0.05);
    float gluBleach = 1.0 - smoothstep(0.0, 0.1, gluEdge);
    vec3 gluWhite = vec3(1.0, 0.985, 1.0);
    vec3 gluLavender = vec3(0.84, 0.8, 1.0);
    outgoingLight = mix(outgoingLight, gluWhite, gluBleach * gluBleach * 0.28);
    gluBurnGlow = gluWhite * gluCore * 2.6 + mix(gluLavender, gluWhite, gluHalo) * gluHalo * 0.7;
    outgoingLight += gluBurnGlow;
}
`;
// end of main, after DSN's selective bloom override: in the bloom pass only the edge glows
const BURN_BLOOM = /* glsl */`
if (gluBurnBloom > 0.5) gl_FragColor.rgb = max(gl_FragColor.rgb, gluBurnGlow * gluBurnGlow.r * 0.12);
`;

// DiceFx's number overlay: the same front, and its strokes flare white as the edge crosses them.
const GLOW_BURN = /* glsl */`
{
${BURN_FRONT}
    float gluFlare = exp(-gluEdge / 0.03);
    col = col * (1.0 + gluFlare * 2.0) + vec3(gluFlare * 0.6) * a;
    a = min(1.0, a * (1.0 + gluFlare));
}
`;

function burnGlowMaterial(mat, uniforms, state) {
    const upstream = mat.onBeforeCompile;
    mat.onBeforeCompile = function (shader, renderer) {
        upstream?.call(this, shader, renderer);
        const fs = shader.fragmentShader, vs = shader.vertexShader;
        const at = 'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);';
        if (!vs.includes(at) || !fs.includes('#include <logdepthbuf_fragment>') || !fs.includes('uniform sampler2D uMask;')) return;
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = `${BURN_VERTEX_PARS}\n` + vs.replace(at, `${at}\nvGluBurnW = (modelMatrix * vec4(position, 1.0)).xyz;`);
        shader.fragmentShader = fs
            .replace('uniform sampler2D uMask;', `uniform sampler2D uMask;\n${BURN_FRAGMENT_PARS}`)
            .replace('#include <logdepthbuf_fragment>', `${GLOW_BURN}\n#include <logdepthbuf_fragment>`);
        state.glowPatched = true;
    };
    mat.customProgramCacheKey = () => 'glu-glow-burn';
    mat.needsUpdate = true;
}

const BLACK = new Color(0, 0, 0);

// The die's material with the burn added on top of everything upstream (and our materials) do.
function burnMaterial(mat, uniforms, state) {
    //Material.copy JSON-clones userData, which would serialise our canvas textures
    const userData = mat.userData;
    mat.userData = {};
    let clone;
    try {
        clone = mat.clone();
    } finally {
        mat.userData = userData;
    }
    clone.userData = userData;
    //DSN only runs its bloom pass when some visible material has a non-black emissive
    if (clone.emissive?.equals?.(BLACK)) clone.emissive.setScalar(1e-4);
    const upstream = mat.onBeforeCompile;
    const upstreamKey = mat.customProgramCacheKey?.bind(mat);
    clone.onBeforeCompile = function (shader, renderer) {
        upstream?.call(this, shader, renderer);
        const fs = shader.fragmentShader, vs = shader.vertexShader;
        if (!fs.includes('#include <opaque_fragment>') || !vs.includes('#include <project_vertex>') || !/}\s*$/.test(fs)) return;
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = vs
            .replace('#include <common>', `#include <common>\n${BURN_VERTEX_PARS}`)
            .replace('#include <project_vertex>', `#include <project_vertex>\n${BURN_VERTEX}`);
        shader.fragmentShader = fs
            .replace('#include <common>', `#include <common>\n${BURN_FRAGMENT_PARS}`)
            .replace('#include <opaque_fragment>', `${BURN_FRAGMENT}\n#include <opaque_fragment>`)
            .replace(/}\s*$/, `${BURN_BLOOM}\n}`);
        state.patched = true;
    };
    clone.customProgramCacheKey = () => (upstreamKey ? upstreamKey() : '') + '|glu-burn';
    return clone;
}

// The shadow pass draws the die with its depth material, not ours: without this the die's full
// shadow stayed on the desk under the burnt-away die. Same front, same uniforms.
function burnDepthMaterial(uniforms, state) {
    const mat = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
    mat.onBeforeCompile = (shader) => {
        const fs = shader.fragmentShader, vs = shader.vertexShader;
        if (!fs.includes('#include <clipping_planes_fragment>') || !vs.includes('#include <project_vertex>')) return;
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = vs
            .replace('#include <common>', `#include <common>\n${BURN_VERTEX_PARS}`)
            .replace('#include <project_vertex>', `#include <project_vertex>\n${BURN_VERTEX}`);
        shader.fragmentShader = fs
            .replace('#include <common>', `#include <common>\n${BURN_FRAGMENT_PARS}`)
            .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n{\n${BURN_FRONT}\n}`);
        state.shadowPatched = true;
    };
    mat.customProgramCacheKey = () => 'glu-burn-depth';
    return mat;
}

const burning = [];
let loopId = 0;

/**
 * Dice3D._afterShow, when the hide timer fires: burn the thrown dice away instead of the fade
 * or the instant hide. False leaves the hide to Dice So Nice (setting off, nothing to burn).
 */
export function burnAwayDice(dice3d) {
    if (setting(BURN_SETTING, true) === false) return false;
    const box = dice3d?.box;
    const te = box?.throwEngine;
    if (!te || !box.scene) return false;
    const dice = [...te.diceList, ...te.deadDiceList].filter(d => !d.userData?.persistent && d.parent?.parent);
    if (!dice.length) return false;

    //they leave the throw now, as with DSN's fadeOutEphemeral: a new throw starts clean
    te.diceList = te.diceList.filter(d => d.userData?.persistent);
    te.deadDiceList = te.deadDiceList.filter(d => d.userData?.persistent);
    Promise.resolve(te.physicsWorker?.exec("removeDice", dice.map(d => d.id))).catch(() => { /* the bodies go with the next clear */ });

    const calm = reducedMotion();
    const bloom = game.dice3d?.uniforms?.globalBloom ?? { value: 0 };
    const proxies = new Group();
    const entries = [];
    const order = dice.map((_, i) => i).sort(() => Math.random() - 0.5);
    dice.forEach((mesh, i) => {
        const geo = mesh.geometry;
        if (geo && !geo.boundingSphere) geo.computeBoundingSphere();
        mesh.updateWorldMatrix(true, false);
        const scale = mesh.getWorldScale(new Vector3()).x;
        const centre = mesh.getWorldPosition(new Vector3());
        //the board is seen from above, so "top to bottom" is the screen's: world +z, dipping a
        //little into the die and leaning a little each time so no two dice burn alike
        const down = new Vector3((Math.random() - 0.5) * 0.6, -0.35, 1).normalize();
        const uniforms = {
            gluBurn: { value: FRONT_IDLE },
            gluBurnSeed: { value: Math.random() * 40 },
            gluBurnCentre: { value: centre },
            gluBurnRadius: { value: (geo?.boundingSphere?.radius || 1) * scale },
            gluBurnDown: { value: down },
            gluBurnBloom: bloom
        };
        const state = { patched: false };
        const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const clones = originals.map(m => m ? burnMaterial(m, uniforms, state) : m);
        const glows = mesh.children.filter(c => c.name === 'gluniverse-dice-glow' && c.material?.uniforms?.uMask);
        for (const g of glows) burnGlowMaterial(g.material, uniforms, state);
        const depth = burnDepthMaterial(uniforms, state);
        entries.push({
            mesh, originals, clones, uniforms, state, calm, glows,
            container: mesh.parent,
            renderer: box.renderer,
            delay: order[i] / Math.max(1, dice.length - 1) * STAGGER_S * (dice.length > 1 ? 1 : 0),
            castShadow: mesh.castShadow,
            depth,
            depthBefore: mesh.customDepthMaterial,
            layer1: mesh.layers.isEnabled(1)
        });
        //compile the burn programs before the swap, so the first burning frame doesn't hitch
        const proxy = new Mesh(mesh.geometry, Array.isArray(mesh.material) ? clones : clones[0]);
        proxy.matrixAutoUpdate = false;
        proxy.matrixWorld.copy(mesh.matrixWorld);
        proxies.add(proxy);
        const shadowProxy = new Mesh(mesh.geometry, depth);
        shadowProxy.matrixAutoUpdate = false;
        shadowProxy.matrixWorld.copy(mesh.matrixWorld);
        proxies.add(shadowProxy);
        for (const g of glows) {
            g.updateWorldMatrix(true, false);
            const gp = new Mesh(g.geometry, g.material);
            gp.matrixAutoUpdate = false;
            gp.matrixWorld.copy(g.matrixWorld);
            proxies.add(gp);
        }
    });

    const start = () => {
        for (const e of entries) {
            e.mesh.material = Array.isArray(e.mesh.material) ? e.clones : e.clones[0];
            e.mesh.layers.enable(1);
            e.mesh.customDepthMaterial = e.depth;
        }
        //one frame with the burn idle, while nothing moves: whatever compileAsync could not
        //warm (the shadow pass) compiles here, not on the first frame of the motion
        try {
            box.renderScene?.();
        } catch (err) {
            console.warn(`${MODULE_ID} | burn warm-up render failed`, err);
        }
        //the clock starts on the next frame, from its own timestamp
        requestAnimationFrame((now) => {
            for (const e of entries) {
                e.t0 = now + e.delay * 1000;
                burning.push(e);
            }
            startLoop(dice3d);
        });
    };
    const renderer = box.renderer;
    const camera = box.diceScene?.camera;
    if (renderer?.compileAsync && camera) renderer.compileAsync(proxies, camera, box.scene).then(start, start);
    else start();
    return true;
}

//the blotches open slowly, then the burn takes the rest faster, and the last specks linger a
//moment: ease-in-out, slightly front-loaded
const burnEase = (x) => x < 0.45 ? 2.2222 * x * x : 1 - 1.8182 * (1 - x) * (1 - x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function updateEntry(e, now) {
    const sweepS = e.calm ? SWEEP_S * 0.6 : SWEEP_S;
    const t = Math.max(0, (now - e.t0) / 1000) / sweepS;
    e.uniforms.gluBurn.value = now < e.t0 ? FRONT_IDLE : FRONT_FROM + (FRONT_TO - FRONT_FROM) * burnEase(clamp01(t));
    if (e.state.patched === false && t > 0) {
        //a material we could not patch: fade it, so it still leaves smoothly
        for (const c of e.clones) if (c) { c.transparent = true; c.opacity = 1 - clamp01(t); }
    }
    //a shadow we could not burn goes partway through instead
    if (!e.state.shadowPatched && t > SHADOW_OFF) e.mesh.castShadow = false;
    //a number overlay we could not burn fades with the die
    if (!e.state.glowPatched) {
        for (const g of e.glows) {
            const u = g.material.uniforms;
            g.userData.gluBurnFrom ??= u.uIntensity.value;
            u.uIntensity.value = g.userData.gluBurnFrom * (1 - clamp01(t * 1.4));
        }
    }
    if (t < 1) return false;
    e.container?.removeFromParent();
    e.mesh.material = Array.isArray(e.mesh.material) ? e.originals : e.originals[0];
    e.mesh.castShadow = e.castShadow;
    e.mesh.customDepthMaterial = e.depthBefore;
    if (!e.layer1) e.mesh.layers.disable(1);
    //disposed, but their programs stay compiled for the next roll (ProgramKeeper.js)
    retireMaterial(e.renderer, e.depth);
    for (const c of e.clones) retireMaterial(e.renderer, c);
    return true;
}

function startLoop(dice3d) {
    if (loopId) return;
    const step = (now) => {
        loopId = 0;
        const box = dice3d.box;
        //a failed frame must not stop the burn halfway, with the board never hidden (RenderBoard.js)
        for (let i = burning.length - 1; i >= 0; i--) {
            let done;
            try {
                done = updateEntry(burning[i], now);
            } catch (err) {
                warnFrameOnce("burn", err);
                burning[i].container?.removeFromParent();
                done = true;
            }
            if (done) burning.splice(i, 1);
        }
        try {
            renderBoard(box);
        } catch (err) {
            warnFrameOnce("burn", err);
        }
        if (burning.length) {
            loopId = requestAnimationFrame(step);
            return;
        }
        //the last die is gone: hide the board as DSN would, unless something else uses it now
        const te = box?.throwEngine;
        const busy = te?.rolling || te?.diceList?.length || te?.deadDiceList?.length || box?.persistentDiceList?.length
            || box?.fadingDice?.length || box?.scene?.getObjectByName('gluniverse-dice-hand');
        if (!busy) {
            try {
                box?.clearAll?.();
            } catch (err) {
                warnFrameOnce("burn", err);
            }
            dice3d.canvas.style.display = "none";
        }
    };
    loopId = requestAnimationFrame(step);
}

