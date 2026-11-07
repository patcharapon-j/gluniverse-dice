// GLUniverse Dice: smooth throw replay (ROADMAP M2).
//
// ThrowEngine.updateThrowPlayback copies whole simulation frames (60 Hz) into the dice, and
// DiceBox only renders when at least one whole frame elapsed. On a 120/144 Hz display the dice
// therefore move at 60 Hz with an uneven cadence. This blends between recorded frames i and i+1
// by the time left over since the last whole frame, every display frame.
//
// It only touches the dice *parents* (the group the replay drives). swapDiceFace rotates the
// child mesh, so the forced result is unaffected.
import { Quaternion, Vector3 } from 'three';

const qa = new Quaternion();
const qb = new Quaternion();
const va = new Vector3();
const vb = new Vector3();

/**
 * @param {object} throwEngine   ThrowEngine instance
 * @param {object[]} children    scene children (dice parents)
 * @param {number} remainder     seconds elapsed since the last whole simulation frame
 * @returns {boolean} true if anything was moved (a frame should be rendered)
 */
export function interpolateReplay(throwEngine, children, remainder) {
    if (!throwEngine?.rolling) return false;
    const end = throwEngine.iterationsNeeded;
    const i = throwEngine.iteration;
    //the replay is over (or not started): upstream already placed the final frame, and
    //throwFinished() may have zeroed the buffers by now
    if (!(end > 0) || i >= end) return false;

    const speed = throwEngine.speed || 1;
    const step = throwEngine.framerate || 1 / 60;
    const ahead = Math.max(0, Math.min(speed, (remainder / step) * speed));
    const f = Math.min(end, i + ahead);
    let moved = false;

    for (const child of children) {
        const mesh = child.children && child.children.length ? child.children[0] : null;
        const sim = mesh?.sim;
        if (!sim?.stepPositions) continue;
        if (mesh.userData?.constrained) continue;
        //never blend from before the die spawned (its buffer starts at the hidden origin)
        if (mesh.startAtIteration > i) continue;
        //same filter as updateThrowPlayback: dice that died before this frame stay where they are
        if (sim.dead && sim.dead <= i) continue;
        const last = sim.dead ? Math.min(end, sim.dead) : end;
        const ff = Math.min(f, last);
        const i0 = Math.floor(ff);
        const i1 = Math.min(last, i0 + 1);
        const u = ff - i0;
        const P = sim.stepPositions;
        const Q = sim.stepQuaternions;
        //zeroed or unrecorded frames (a resting die is never at y = 0)
        if (!P[i0 * 3 + 1] || !P[i1 * 3 + 1]) continue;
        va.fromArray(P, i0 * 3);
        vb.fromArray(P, i1 * 3);
        child.position.lerpVectors(va, vb, u);
        qa.fromArray(Q, i0 * 4);
        qb.fromArray(Q, i1 * 4);
        child.quaternion.slerpQuaternions(qa, qb, u);
        moved = true;
    }
    return moved;
}
