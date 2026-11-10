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

const warned = new Set();

/** Log a loop's frame error once per loop, so a broken frame neither stops it nor floods the console. */
export function warnFrameOnce(loop, err) {
    if (warned.has(loop)) return;
    warned.add(loop);
    console.warn(`${MODULE_ID} | ${loop}: a frame failed, the animation goes on`, err);
}
