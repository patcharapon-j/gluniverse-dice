// The 6.4.5-glu.7 performance sweep: frame pacing of our loops, the normal-map memo and the
// material texture budget. Each test fails on the code before the sweep.
import './foundryStubs.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CanvasTexture, MeshStandardMaterial } from 'three';
import { frameDue } from '../module/glu/RenderBoard.js';
import { memoizeNormalMaps } from '../module/glu/NormalMapMemo.js';
import { trimMaterialCache } from '../module/glu/MaterialBudget.js';

test('our loops keep to Foundry\'s Max FPS, without halving a matching screen rate', () => {
    globalThis.canvas = { app: { ticker: { maxFPS: 30 } } };
    let drawn = 0;
    //a 120 Hz screen for one second
    for (let i = 0; i < 120; i++) if (frameDue('t120', i * (1000 / 120))) drawn++;
    assert.ok(drawn >= 29 && drawn <= 31, `drew ${drawn} frames at a 30 FPS cap`);
    globalThis.canvas.app.ticker.maxFPS = 60;
    drawn = 0;
    //a 60 Hz screen with frames arriving a little early or late
    for (let i = 0; i < 60; i++) if (frameDue('t60', i * 16.6 + (i % 2 ? 0.4 : -0.4))) drawn++;
    assert.ok(drawn >= 59, `a 60 Hz screen at a 60 FPS cap drew ${drawn} frames`);
    globalThis.canvas.app.ticker.maxFPS = 0;
    assert.equal(frameDue('t0', 1), true, 'no cap, no skipping');
    delete globalThis.canvas;
});

function bumpCanvas(fill) {
    const data = new Uint8ClampedArray(8 * 8 * 4).fill(fill);
    return { width: 8, height: 8, getContext: () => ({ getImageData: () => ({ data }) }) };
}

test('a normal map is built once per engraving, whatever the colours', () => {
    let builds = 0;
    const factory = { normalMapStrength: 1, heightCanvasToNormalCanvas() { builds++; return { built: builds }; } };
    memoizeNormalMaps(factory);
    memoizeNormalMaps(factory); //installed twice by two initializeMaterials: still one memo
    const a = factory.heightCanvasToNormalCanvas(bumpCanvas(200));
    const b = factory.heightCanvasToNormalCanvas(bumpCanvas(200));
    assert.equal(builds, 1);
    assert.equal(a, b);
    factory.heightCanvasToNormalCanvas(bumpCanvas(90));
    assert.equal(builds, 2, 'a different engraving builds its own');
    factory.heightCanvasToNormalCanvas(bumpCanvas(200), 2);
    assert.equal(builds, 3, 'and so does another strength');
});

function material(px) {
    const mat = new MeshStandardMaterial();
    mat.map = new CanvasTexture({ width: px, height: px });
    mat.map.generateMipmaps = false;
    let disposed = false;
    mat.map.addEventListener('dispose', () => { disposed = true; });
    mat.isDisposed = () => disposed;
    return mat;
}

test('past the texture budget the oldest unused board materials go, never one on screen or new', async () => {
    const onScreen = material(8192); //256 MB each
    const mats = { old: material(8192), onScreen, showcase: material(8192), recent: material(8192) };
    const scene = { traverse: (fn) => fn({ material: onScreen }) };
    globalThis.game = { dice3d: { box: { scene, throwEngine: { diceList: [], deadDiceList: [] } } } };
    const factory = { baseMaterialCache: {
        boardd6old: mats.old, boardd6screen: mats.onScreen, showcased6: mats.showcase
    } };
    //old enough to be evicted
    const realNow = performance.now.bind(performance);
    let now = realNow();
    performance.now = () => now;
    try {
        trimMaterialCache(factory, 'boardd6old');
        trimMaterialCache(factory, 'boardd6screen');
        now += 20000;
        factory.baseMaterialCache.boardd6recent = mats.recent;
        trimMaterialCache(factory, 'boardd6recent');
        factory.baseMaterialCache.boardd6more = material(8192);
        trimMaterialCache(factory, 'boardd6more');
    } finally {
        performance.now = realNow;
        delete globalThis.game;
    }
    const left = Object.keys(factory.baseMaterialCache);
    assert.ok(!left.includes('boardd6old'), 'the oldest unused one is evicted');
    assert.ok(mats.old.isDisposed(), 'and its textures are freed');
    assert.ok(left.includes('boardd6screen') && !onScreen.isDisposed(), 'a material on screen stays');
    assert.ok(left.includes('showcased6'), 'only board materials count');
    assert.ok(left.includes('boardd6recent') && left.includes('boardd6more'), 'materials still being built stay');
});
