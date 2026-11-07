// GLUniverse Dice: a small camera shake when dice hit hard (ROADMAP M5, roll feel).
//
// Driven from DiceFx.tickFx: every impact of the replayed collision timeline can add to the
// shake, by its strength squared (DSN's sound strength, 0.2 to 1), so only real hits register.
// The camera moves sideways only (x and z), a few pixels at most, and settles in about a
// quarter of a second. If anything else moves the camera meanwhile (DSN on a resize), that
// becomes the new rest position, so the shake never undoes it. Client setting `impactShake`;
// off with prefers-reduced-motion.
import { Vector3 } from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';
import { TARGET_D6_EDGE_METERS } from '../../engine/SceneConstants.js';

export const SHAKE_SETTING = "impactShake";

//in die sizes; a die is about a twentieth of the board's width
const MAX_AMP = 0.045;
const PER_HIT = 0.03;
//below this strength a hit doesn't shake
const MIN_STRENGTH = 0.35;
//per second
const DECAY = 15;

const state = { amp: 0, t: 0, base: null, written: null, camera: null, phase: [0, 0, 0, 0] };

export function registerShakeSetting() {
    game.settings.register(MODULE_ID, SHAKE_SETTING, {
        name: "GLUDICE.Settings.ImpactShake.Name",
        hint: "GLUDICE.Settings.ImpactShake.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });
}

let calmCache = null;
function enabled() {
    try {
        if (game.settings.get(MODULE_ID, SHAKE_SETTING) === false) return false;
    } catch {
        return false;
    }
    if (calmCache === null) {
        try {
            calmCache = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
        } catch {
            calmCache = false;
        }
    }
    return !calmCache;
}

/** An impact of the replay: source "dice" or "table", strength 0..1. */
export function addShake(box, source, strength) {
    if (!(strength >= MIN_STRENGTH) || !enabled()) return;
    const size = game.dice3d?.DiceFactory?.baseScale || TARGET_D6_EDGE_METERS;
    //table hits read as weight; dice on dice a little lighter
    const hit = strength * strength * PER_HIT * (source === "table" ? 1 : 0.6) * size;
    if (state.amp < 1e-7) state.phase = state.phase.map(() => Math.random() * Math.PI * 2);
    state.amp = Math.min(MAX_AMP * size, state.amp + hit);
}

/** Every frame before the render. True while the camera is still shaking. */
export function applyShake(box, dt) {
    const camera = box?.diceScene?.camera;
    if (!camera) return false;
    if (state.camera !== camera) {
        state.camera = camera;
        state.base = null;
        state.written = null;
    }
    //someone else moved the camera since our last write: that is where it rests now
    if (state.written && !camera.position.equals(state.written)) state.base = camera.position.clone();
    if (state.amp < 1e-7) {
        if (state.base) {
            camera.position.copy(state.base);
            state.base = null;
            state.written = null;
        }
        state.amp = 0;
        return false;
    }
    if (!state.base) state.base = camera.position.clone();
    state.t += dt;
    state.amp *= Math.exp(-DECAY * dt);
    //two incommensurate sines per axis: a tremor, not a wobble
    const t = state.t, p = state.phase;
    const ox = (Math.sin(t * 71 + p[0]) * 0.65 + Math.sin(t * 113 + p[1]) * 0.35) * state.amp;
    const oz = (Math.sin(t * 83 + p[2]) * 0.65 + Math.sin(t * 127 + p[3]) * 0.35) * state.amp;
    camera.position.set(state.base.x + ox, state.base.y, state.base.z + oz);
    state.written = (state.written ?? new Vector3()).copy(camera.position);
    return true;
}
