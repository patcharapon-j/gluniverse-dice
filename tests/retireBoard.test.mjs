// DSN's resizeAndRebuild (a window resize, or M7's roll area) builds a new DiceFactory, and with
// it a new physics worker, and drops the old board. The old worker was never terminated: a live
// worker keeps its 'collide' listener, the listener keeps the old DiceBox, and the old DiceBox
// keeps its renderer, canvas, WebGL context and every texture on it. Each rebuild added one;
// past ~16 Chrome starts dropping contexts. retireBoard lets the old board go.
import './foundryStubs.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import WebworkerPromise from 'webworker-promise';
import { retireBoard } from '../module/glu/RetireBoard.js';
import { DeferredPhysicsWorker } from '../module/glu/PhysicsEngine.js';

class FakeWorker {
    constructor() { this.terminated = false; this.posted = 0; this.listeners = {}; }
    addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
    removeEventListener() {}
    postMessage() { this.posted++; }
    terminate() { this.terminated = true; }
}

function board(worker) {
    const renderer = { lost: false, forceContextLoss() { this.lost = true; } };
    return { DiceFactory: { _physicsWorker: worker }, dice3dRenderers: { board: renderer }, renderer };
}

test('the cannon-es worker of a replaced board is terminated, and later calls fail fast', async () => {
    const raw = new FakeWorker();
    const worker = new WebworkerPromise(raw);
    const dice3d = board(worker);
    //a call already sent when the rebuild comes (a hand opening awaits createShape)
    const inFlight = worker.exec('createShape', {});
    retireBoard(dice3d);
    assert.equal(raw.terminated, true);
    assert.equal(dice3d.renderer.lost, true, 'the old WebGL context is released at once, not at GC');
    await assert.rejects(inFlight, /retired/, 'a call in flight must not hang forever');
    await assert.rejects(worker.exec('createShape', {}), /retired/);
    assert.equal(raw.posted, 1, 'nothing more is posted to a terminated worker');
    //the old box's listeners are gone with it
    assert.doesNotThrow(() => worker.on('collide', () => {}).off('collide'));
});

test('the Rapier worker (deferred) of a replaced board is terminated once it has started', async () => {
    const raw = new FakeWorker();
    const deferred = new DeferredPhysicsWorker(Promise.resolve(new WebworkerPromise(raw)));
    const queued = deferred.exec('createShape', {});
    retireBoard(board(deferred));
    await assert.rejects(queued, /retired/, 'a call queued before the worker started must not hang');
    assert.equal(raw.terminated, true);
    await assert.rejects(deferred.exec('simulateThrow', {}), /retired/);
});

test('a board without a worker or renderer retires quietly', () => {
    assert.doesNotThrow(() => retireBoard({ DiceFactory: { _physicsWorker: null }, dice3dRenderers: {} }));
    assert.doesNotThrow(() => retireBoard(null));
});
