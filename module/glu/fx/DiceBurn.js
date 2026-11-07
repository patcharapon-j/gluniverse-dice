// GLUniverse Dice: how long thrown dice stay, and how they leave (ROADMAP M5 follow-up).
//
// - World setting `diceLinger`: seconds the thrown dice stay on the table before they leave,
//   for every client (Dice So Nice's own "time before hide" is per user). 0 keeps each user's
//   Dice So Nice setting.
// - Client setting `burnAway`: the dice dissolve into light instead of Dice So Nice's fade or
//   instant hide. A jagged white front sweeps down through each die; the surface ahead of it
//   bleaches toward white, a thin white-hot line marks the edge, and what it passes is gone.
//   The forged result number (DiceFx's overlay) flares as the top goes, hangs in the air while
//   the body burns away beneath it, then goes out last. No flame colours, no particles.
//
// Hook: Dice3D._afterShow, the hide timer (hideDelayMs for its delay, burnAwayDice in place of
// its hide). Persistent dice never burn. Each burning die gets its own copy of its material:
// DSN shares materials between dice, and its own fade changes the shared opacity. While it
// burns, the die is on layer 1 so DSN's selective bloom catches the white edge.
import { Color, Group, Mesh, MeshDepthMaterial, RGBADepthPacking, Vector3 } from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';

export const LINGER_SETTING = "diceLinger";
export const BURN_SETTING = "burnAway";

//seconds: the sweep through the body, then the number alone going out
const SWEEP_S = 1.75;
const NUMBER_S = 0.55;
//dice don't all go at once; the order is random, the gaps small
const STAGGER_S = 0.28;
//the shadow goes when this much of the sweep is done (the shadow pass does not burn)
const SHADOW_OFF = 0.62;
//the front starts just above the die and ends just below it (the noise reaches +-0.2)
const FRONT_FROM = -0.2, FRONT_TO = 1.24;

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
vec3 gluBurnGlow = vec3(0.0);
`;
// before <opaque_fragment>. gluN is when this point goes: 0 at the top of the die, 1 at the
// bottom, made jagged by domain-warped noise plus a fine crackle so the front has a torn edge.
const BURN_FRONT = /* glsl */`
    vec3 gluP = (vGluBurnW - gluBurnCentre) / gluBurnRadius;
    vec3 gluQ = gluP * 2.2 + vec3(gluBurnSeed);
    vec3 gluWarp = vec3(gluBFbm(gluQ), gluBFbm(gluQ + vec3(5.2, 1.3, 7.7)), gluBFbm(gluQ + vec3(2.9, 8.1, 4.4))) - 0.5;
    float gluN = dot(gluP, gluBurnDown) * 0.5 + 0.5
        + (gluBFbm(gluQ * 1.3 + gluWarp * 1.8) - 0.5) * 0.36
        + (gluBNoise(gluP * 19.0 + vec3(gluBurnSeed)) - 0.5) * 0.045;
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
            gluBurn: { value: FRONT_FROM },
            gluBurnSeed: { value: Math.random() * 40 },
            gluBurnCentre: { value: centre },
            gluBurnRadius: { value: (geo?.boundingSphere?.radius || 1) * scale },
            gluBurnDown: { value: down },
            gluBurnBloom: bloom
        };
        const state = { patched: false };
        const originals = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const clones = originals.map(m => m ? burnMaterial(m, uniforms, state) : m);
        const glows = mesh.children.filter(c => c.name === 'gluniverse-dice-glow');
        const depth = burnDepthMaterial(uniforms, state);
        entries.push({
            mesh, originals, clones, uniforms, state, calm, glows,
            glowFrom: glows.map(g => ({ i: g.material?.uniforms?.uIntensity?.value ?? 0, s: g.material?.uniforms?.uSpread?.value ?? 0 })),
            container: mesh.parent,
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
    });

    const start = () => {
        const now = performance.now();
        for (const e of entries) {
            e.mesh.material = Array.isArray(e.mesh.material) ? e.clones : e.clones[0];
            e.mesh.layers.enable(1);
            e.mesh.customDepthMaterial = e.depth;
            e.t0 = now + e.delay * 1000;
            burning.push(e);
        }
        startLoop(dice3d);
    };
    const renderer = box.renderer;
    const camera = box.diceScene?.camera;
    if (renderer?.compileAsync && camera) renderer.compileAsync(proxies, camera, box.scene).then(start, start);
    else start();
    return true;
}

//nearly linear, so the front is legible all the way: a short ease at each end only
//(quadratic ends matched in value and slope to the line between them)
const sweepEase = (x) => x < 0.15 ? 3.9216 * x * x : x > 0.85 ? 1 - 3.9216 * (1 - x) * (1 - x) : 0.0882 + 1.1765 * (x - 0.15);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function updateEntry(e, now) {
    const sweepS = e.calm ? SWEEP_S * 0.6 : SWEEP_S;
    const s = Math.max(0, (now - e.t0) / 1000);
    const t = s / sweepS;
    const front = FRONT_FROM + (FRONT_TO - FRONT_FROM) * sweepEase(clamp01(t));
    e.uniforms.gluBurn.value = front;
    if (e.state.patched === false && t > 0) {
        //a material we could not patch: fade it, so it still leaves smoothly
        for (const c of e.clones) if (c) { c.transparent = true; c.opacity = 1 - clamp01(t); }
    }
    //a shadow we could not burn goes partway through instead
    if (!e.state.shadowPatched && t > SHADOW_OFF) e.mesh.castShadow = false;

    //the number: flares as the light takes the top, hangs while the body goes, then goes out,
    //its halo opening as it fades (reduced motion: it simply fades with the die)
    const tail = (s - sweepS) / NUMBER_S;
    e.glows.forEach((g, i) => {
        const u = g.material?.uniforms;
        if (!u?.uIntensity) return;
        const from = e.glowFrom[i];
        if (e.calm) {
            u.uIntensity.value = from.i * (1 - clamp01(t));
            return;
        }
        const flare = 1 + 0.75 * easeOutCubic(clamp01(t / 0.3));
        const out = tail > 0 ? 1 - easeOutCubic(clamp01(tail)) : 1;
        u.uIntensity.value = from.i * flare * out;
        if (u.uSpread) u.uSpread.value = Math.min(1, from.s + 0.3 * easeOutCubic(clamp01(t / 0.3)) + 0.4 * clamp01(tail));
    });
    const done = e.calm || !e.glows.length ? t >= 1 : tail >= 1;
    if (!done) return false;
    e.container?.removeFromParent();
    e.mesh.material = Array.isArray(e.mesh.material) ? e.originals : e.originals[0];
    e.mesh.castShadow = e.castShadow;
    e.mesh.customDepthMaterial = e.depthBefore;
    e.depth.dispose();
    if (!e.layer1) e.mesh.layers.disable(1);
    for (const c of e.clones) c?.dispose();
    return true;
}

function startLoop(dice3d) {
    if (loopId) return;
    const step = () => {
        loopId = 0;
        const box = dice3d.box;
        const now = performance.now();
        for (let i = burning.length - 1; i >= 0; i--) {
            if (updateEntry(burning[i], now)) burning.splice(i, 1);
        }
        box?.renderScene?.();
        if (burning.length) {
            loopId = requestAnimationFrame(step);
            return;
        }
        //the last die is gone: hide the board as DSN would, unless something else uses it now
        const te = box.throwEngine;
        const busy = te.rolling || te.diceList.length || te.deadDiceList.length || box.persistentDiceList.length
            || box.fadingDice?.length || box.scene.getObjectByName('gluniverse-dice-hand');
        if (!busy) {
            box.clearAll?.();
            dice3d.canvas.style.display = "none";
        }
    };
    loopId = requestAnimationFrame(step);
}

