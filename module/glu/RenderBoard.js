// GLUniverse Dice: draw the board from one of our own animation loops (the hand, the burn).
//
// Right after Dice3D.resizeAndRebuild, game.dice3d.box is a new DiceBox whose async initialize()
// has not set its camera yet; rendering it then throws inside three.js. A loop that let that
// throw escape stopped scheduling frames: the hand froze on screen and could no longer be thrown,
// a burn stopped halfway and the board never hid. Until the board is ready, skip the frame.
import { MODULE_ID } from './LegacyIdentity.js';

/** @returns {boolean} the board was drawn */
export function renderBoard(box) {
    if (!box?.diceScene?.camera || !box.renderScene) return false;
    box.renderScene();
    return true;
}

/**
 * renderer.compileAsync for the board: real frames draw into the composer's render target
 * (linear, no tone mapping), and the program variant depends on that. Compiling against the
 * screen built a variant no frame used. Returns compileAsync's promise.
 */
export function compileForBoard(box, object, scene = box.scene) {
    const renderer = box.renderer;
    const previous = renderer.getRenderTarget();
    //compileAsync builds the programs synchronously, then waits for the driver
    renderer.setRenderTarget(box.diceScene?.composerTarget ?? previous);
    try {
        return renderer.compileAsync(object, box.diceScene?.camera ?? box.camera, scene);
    } finally {
        renderer.setRenderTarget(previous);
    }
}

const nextDue = new Map();

/**
 * Our loops run on requestAnimationFrame, which fires at the screen's refresh rate (120, 144,
 * 240 Hz), while Dice So Nice's own ticker and the rest of Foundry keep to the Max FPS setting.
 * True when a loop's next frame is due under that cap; each skipped frame is no work at all.
 */
export function frameDue(loop, now) {
    const fps = Number(globalThis.canvas?.app?.ticker?.maxFPS) || 0;
    if (fps <= 0) return true;
    const interval = 1000 / fps;
    const due = nextDue.get(loop) ?? 0;
    //a frame a little early still counts, or a 60 Hz screen capped at 60 would draw at 30
    if (now < due - 2) return false;
    nextDue.set(loop, now - due > interval ? now + interval : due + interval);
    return true;
}

const warned = new Set();

/** Log a loop's frame error once per loop, so a broken frame neither stops it nor floods the console. */
export function warnFrameOnce(loop, err) {
    if (warned.has(loop)) return;
    warned.add(loop);
    console.warn(`${MODULE_ID} | ${loop}: a frame failed, the animation goes on`, err);
}
