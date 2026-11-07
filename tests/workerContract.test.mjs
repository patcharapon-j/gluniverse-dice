// Both physics workers answer the same message contract (FORK.md "Physics worker contract").
// Drives every operation the main thread uses, through the real webworker-promise protocol, and
// checks the Rapier worker returns the same shapes as the cannon-es worker.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { loadWorker } from '../tools/physics-bench/harness.mjs';
import { DiceShapeLibrary } from '../module/engine/DiceShapeLibrary.js';

const W = 1920 * 0.016 / 50, H = 1080 * 0.016 / 50;
const workers = {};

before(async () => {
    for (const engine of ['cannon', 'rapier']) workers[engine] = await loadWorker(engine);
});

function spec(id, x, opts = {}) {
    return {
        id, shape: 'd6', material: 'plastic', mass: 300, startAtIteration: opts.start ?? 0, options: opts.options ?? {},
        vectordata: { type: 'd6', pos: { x, y: 0.1, z: 0 }, velocity: { x: opts.vx ?? 1, y: 0, z: 0.3 }, angle: { x: 4, y: 0, z: 3 }, axis: { x: 0, y: 0, z: 0, a: 0 } }
    };
}

const keysOf = (o) => Object.keys(o).sort();

for (const engine of ['cannon', 'rapier']) {
    test(`${engine}: full contract round-trip`, async () => {
        const w = workers[engine];
        const collides = [];
        w.on('collide', (d) => collides.push(d));

        await w.exec('init', { muteSoundSecretRolls: false, height: H, width: W, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        await w.exec('createShape', { name: 'd6', radius: 0.0488, definition: DiceShapeLibrary.getWorkerDefinition('d6') });

        //ephemeral throw with a staggered second group
        await w.exec('createDiceBatch', [spec(1, -0.3), spec(2, -0.2), spec(3, -0.1, { start: 15 })]);
        const res = await w.exec('simulateThrow', { minIterations: 15, nbIterationsBetweenRolls: 15, framerate: 1 / 60, canBeFlipped: false, impulses: null });
        assert.deepEqual(keysOf(res), ['deads', 'detectedCollides', 'faceValues', 'finalQuaternions', 'ids', 'iterationsNeeded', 'positionsBuffers', 'quaternionsBuffers']);
        assert.deepEqual([...res.ids].sort(), [1, 2, 3]);
        assert.ok(res.iterationsNeeded >= 15 && res.iterationsNeeded <= 1000);
        for (let i = 0; i < res.ids.length; i++) {
            assert.equal(res.positionsBuffers[i].byteLength, 1001 * 3 * 4);
            assert.equal(res.quaternionsBuffers[i].byteLength, 1001 * 4 * 4);
            assert.equal(res.deads[i], res.iterationsNeeded, 'ephemeral dice die at the end of the sim');
            //staggered die is backfilled with its spawn pose before frame 15
            if (res.ids[i] === 3) {
                const p = new Float32Array(res.positionsBuffers[i]);
                assert.ok(Math.abs(p[0] - -0.1) < 1e-6 && Math.abs(p[14 * 3] - -0.1) < 1e-6);
            }
        }
        for (const id of [1, 2, 3]) {
            assert.ok([1, 2, 3, 4, 5, 6].includes(res.faceValues[id]));
            assert.deepEqual(keysOf(res.finalQuaternions[id]), ['w', 'x', 'y', 'z']);
            assert.equal(await w.exec('getDiceValue', id), res.faceValues[id]);
        }
        assert.ok(Array.isArray(res.detectedCollides));
        for (const c of res.detectedCollides.filter(Boolean)) {
            assert.ok(c[0] === 'dice' || c[0] === 'table');
            //[source, type, material, strength, [x, y, z] in meters] (5th element: ROADMAP M4)
            assert.equal(c.length, 5);
            assert.equal(c[4].length, 3);
            assert.ok(c[4].every(Number.isFinite), 'contact position is finite');
            assert.ok(Math.abs(c[4][0]) < W && c[4][1] > -0.01 && c[4][1] < 1 && Math.abs(c[4][2]) < H, `contact position ${c[4]} lies on the board`);
        }

        //persistent die: created, added, grabbed, moved, released, thrown by impulse
        await w.exec('createDice', { ...spec(10, 0.2, { options: { persistent: true }, vx: 0 }) });
        await w.exec('addDice', 10);
        for (let i = 0; i < 90; i++) await w.exec('playStep', { time_diff: 1 / 60 });
        await w.exec('addConstraint', { id: 10, pos: { x: 0.2, y: 0.08, z: 0 } });
        for (let i = 0; i < 20; i++) {
            await w.exec('updateConstraint', { positions: { 10: { x: 0.2 + i * 0.002, y: 0.08, z: 0 } } });
            const step = await w.exec('playStep', { time_diff: 1 / 60 });
            assert.deepEqual(keysOf(step), ['ids', 'positionsBuffers', 'quaternionsBuffers', 'worldAsleep']);
            assert.equal(step.worldAsleep, false, 'a held die keeps the world awake');
            assert.ok(step.ids.includes(10));
        }
        const held = await w.exec('playStep', { time_diff: 1 / 60 });
        const hp = new Float32Array(held.positionsBuffers);
        const hi = held.ids.indexOf(10);
        assert.ok(hp[hi * 3 + 1] > 0.05, `held die is lifted (y=${hp[hi * 3 + 1]})`);
        await w.exec('removeConstraint', { ids: [10] });

        await w.exec('setBodyPositions', { updates: [{ id: 10, position: { x: 0, y: 0.1, z: 0 } }] });
        await w.exec('setCollisionResponse', { ids: [10], enabled: false });
        await w.exec('setCollisionResponse', { ids: [10], enabled: true });
        const q = await w.exec('getBodyQuaternion', 10);
        assert.deepEqual(keysOf(q), ['w', 'x', 'y', 'z']);
        assert.equal(await w.exec('getBodyQuaternion', 999), null);

        const thrown = await w.exec('simulateThrow', {
            minIterations: 0, nbIterationsBetweenRolls: 15, framerate: 1 / 60, canBeFlipped: false,
            impulses: { 10: { velocity: { x: 0.8, y: 0.5, z: 0.2 }, angularVelocity: { x: 10, y: 2, z: -6 } } }
        });
        assert.ok(thrown.ids.includes(10), 'impulse recipient is tracked');
        const di = thrown.ids.indexOf(10);
        assert.equal(thrown.deads[di], false, 'persistent dice never die');
        assert.ok(thrown.faceValues[10] >= 1 && thrown.faceValues[10] <= 6);

        await w.exec('updateBarriers', { height: H * 0.8, width: W * 0.8, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        await w.exec('applyImpulse', { id: 10, velocity: { x: 0, y: 0.5, z: 0 }, angularVelocity: { x: 0, y: 0, z: 0 } });
        for (let i = 0; i < 60; i++) await w.exec('playStep', { time_diff: 1 / 60 });
        assert.ok(collides.length > 0, 'live (non-simulated) collisions are emitted as "collide" events');
        for (const c of collides) assert.deepEqual(keysOf(c), ['material', 'source', 'strength', 'type']);

        await w.exec('removeDice', [1, 2, 3, 10]);
        assert.equal(await w.exec('getDiceValue', 1), null);
        const idle = await w.exec('playStep', { time_diff: 1 / 60 });
        assert.deepEqual(idle.ids, []);
    });
}

//ROADMAP M2: playStep takes an optional real frame delta (frame_dt) and interpolate flag
for (const engine of ['cannon', 'rapier']) {
    test(`${engine}: playStep frame_dt, interpolate and sleep`, async () => {
        const w = await loadWorker(engine);
        await w.exec('init', { muteSoundSecretRolls: false, height: H, width: W, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        await w.exec('createShape', { name: 'd6', radius: 0.0488, definition: DiceShapeLibrary.getWorkerDefinition('d6') });
        await w.exec('createDice', { ...spec(1, 0, { options: { persistent: true }, vx: 0 }), vectordata: { type: 'd6', pos: { x: 0, y: 0.5, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, angle: { x: 0, y: 0, z: 0 }, axis: { x: 0, y: 0, z: 0, a: 0 } } });
        await w.exec('addDice', 1);
        const y = (r) => new Float32Array(r.positionsBuffers)[r.ids.indexOf(1) * 3 + 1];

        for (let i = 0; i < 10; i++) await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 1 / 60 });
        const raw = await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 1 / 120 });
        const blended = await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 0, interpolate: true });
        assert.deepEqual(keysOf(blended), ['ids', 'positionsBuffers', 'quaternionsBuffers', 'worldAsleep']);
        //falling: the blended pose lies between the previous fixed step (higher) and the current one
        assert.ok(y(blended) >= y(raw) - 1e-6, `blended ${y(blended)} is not below the current step ${y(raw)}`);
        assert.ok(y(blended) - y(raw) < 0.02, 'blended pose is within one step of the current one');

        //frame_dt wins over time_diff: one frame's fall, not ten substeps
        const before = y(await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 0 }));
        const after = y(await w.exec('playStep', { time_diff: 10, frame_dt: 1 / 60 }));
        assert.ok(before - after < 0.03, `fell ${before - after} m in one frame`);

        //a teleport is not interpolated
        await w.exec('setBodyPositions', { updates: [{ id: 1, position: { x: 0.1, y: 0.3, z: 0 } }] });
        const tp = await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 0, interpolate: true });
        assert.ok(Math.abs(y(tp) - 0.3) < 1e-4, `teleported die reported at y=${y(tp)}`);

        //the die lands and the world reports asleep (cannon: static bodies are ignored)
        let asleep = false;
        for (let i = 0; i < 900 && !asleep; i++) asleep = (await w.exec('playStep', { time_diff: 1 / 60, frame_dt: 1 / 60, interpolate: true })).worldAsleep;
        assert.equal(asleep, true, 'world reports asleep once the die rests');
    });
}
