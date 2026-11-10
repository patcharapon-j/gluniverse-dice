// GLUniverse Dice: let go of a board that Dice So Nice is about to replace.
//
// Dice3D.resizeAndRebuild (a window resize, browser zoom, a move to another screen, M7's roll
// area) builds a new canvas, renderer, DiceFactory and DiceBox, and drops the old ones. Upstream
// never terminates the old factory's physics worker. A live worker is a GC root: its 'collide'
// listener holds the old DiceBox, which holds the old renderer, canvas, WebGL context and every
// texture and render target on it, and the worker itself (with Rapier, its own WASM heap). Each
// rebuild added one more; past ~16 contexts Chrome starts dropping the oldest ones.
//
// Hooked from Dice3D.resizeAndRebuild, before the old board is torn down.
import { retirePhysicsWorker } from './PhysicsEngine.js';

export function retireBoard(dice3d) {
    retirePhysicsWorker(dice3d?.DiceFactory?._physicsWorker);
    //free the old context now rather than whenever the canvas is collected
    try {
        dice3d?.dice3dRenderers?.board?.forceContextLoss?.();
    } catch { /* already lost */ }
}
