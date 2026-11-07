// GLUniverse Dice: frame smoothness hooks for DiceBox.animateThrow (ROADMAP M2).
//
// Upstream renders the board only on frames where at least one whole 1/60 s step elapsed, and
// copies whole recorded frames into the dice. On displays faster than 60 Hz that shows as
// stutter. These helpers:
//  - blend the replay between recorded frames (ReplayInterpolator),
//  - give the live playStep a real per-frame delta plus `interpolate: true`, so the worker
//    returns a pose blended between its last two fixed steps,
//  - render on every frame something moved, and skip rendering while the board is idle.
import { MODULE_ID } from './LegacyIdentity.js';
import { interpolateReplay } from './ReplayInterpolator.js';
import { DiceSFXManager } from '../sfx/DiceSFXManager.js';

const LIVE_DT_CAP = 0.25;      // s: after a hidden tab or a long hitch, don't fast-forward the world
const INPUT_AWAKE_MS = 750;    // keep rendering this long after any pointer, wheel or key input
const SLEEP_GRACE_MS = 250;    // keep rendering this long after the world reports asleep

let lastInput = 0;
let inputListening = false;

export const IDLE_SETTING = "idleRenderSkip";

export function registerSmoothnessSettings() {
    game.settings.register(MODULE_ID, IDLE_SETTING, {
        name: "GLUDICE.Settings.IdleRenderSkip.Name",
        hint: "GLUDICE.Settings.IdleRenderSkip.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });
}

function idleSkipEnabled() {
    try {
        return game.settings.get(MODULE_ID, IDLE_SETTING) !== false;
    } catch {
        return false;
    }
}

function listenForInput() {
    if (inputListening || typeof window === "undefined") return;
    inputListening = true;
    const mark = () => { lastInput = performance.now(); };
    for (const type of ["pointermove", "pointerdown", "pointerup", "wheel", "keydown", "keyup", "resize"])
        window.addEventListener(type, mark, { passive: true, capture: true });
    mark();
}

/**
 * Called once per animateThrow tick, after upstream's replay step.
 * @returns {boolean} true if the replayed dice moved and the frame should be rendered
 */
export function smoothFrame(box, time_diff, neededSteps) {
    const engine = box.throwEngine;
    if (!engine?.rolling) return false;
    //a throw is replaying: the live clock restarts when live stepping resumes
    box._gluLastLiveFrame = 0;
    box._gluAsleepSince = 0;
    const remainder = time_diff - neededSteps * engine.framerate;
    return interpolateReplay(engine, box.scene.children, remainder);
}

/**
 * Payload for the live playStep. `time_diff` is kept for workers that don't know `frame_dt`.
 * Upstream passes time_diff (time since the last whole step) every frame; that re-counts the
 * remainder on each frame and over-advances the worker's accumulator on > 60 Hz displays.
 */
export function livePlayStepPayload(box, time_diff) {
    const now = performance.now();
    const last = box._gluLastLiveFrame;
    box._gluLastLiveFrame = now;
    let frame_dt = last ? (now - last) / 1000 : (box.throwEngine?.framerate ?? 1 / 60);
    frame_dt = Math.max(0, Math.min(LIVE_DT_CAP, frame_dt));
    return { time_diff, frame_dt, interpolate: true };
}

/** Records whether the worker world is asleep, from a playStep result. */
export function noteLiveResult(box, result) {
    if (result?.worldAsleep) {
        if (!box._gluAsleepSince) box._gluAsleepSince = performance.now();
    } else {
        box._gluAsleepSince = 0;
    }
}

function boardIsIdle(box) {
    const now = performance.now();
    if (box.throwEngine?.rolling || box._preparingThrow) return false;
    if (!box._gluAsleepSince || now - box._gluAsleepSince < SLEEP_GRACE_MS) return false;
    if (now - lastInput < INPUT_AWAKE_MS) return false;
    if (DiceSFXManager.renderQueue.length || box.fadingDice?.length) return false;
    if (box.diceScene?.animatedDiceDetected) return false;
    for (const d of box.persistentDiceList ?? []) {
        if (d.persistentThrow || d.userData?.remotePreRoll || d.userData?.remoteMoveTarget || d.userData?.constrained) return false;
    }
    return true;
}

/**
 * Replaces upstream's render condition.
 * @param {boolean} upstreamWants upstream's own condition (without isVisible)
 * @param {boolean} moved          smoothFrame's result
 */
export function shouldRender(box, upstreamWants, moved) {
    if (moved) return true;
    if (!upstreamWants) return false;
    if (!idleSkipEnabled()) return true;
    listenForInput();
    return !boardIsIdle(box);
}
