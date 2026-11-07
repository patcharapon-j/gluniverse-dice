// M7 roll area: validation and conversion (module/glu/stream/rollAreaMath.js). No Foundry needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRect, normalizeViewport, toFractions, sameRect, pickRect, isRect, parseRequest, MIN_SIDE_PX } from '../module/glu/stream/rollAreaMath.js';

const VP = { width: 1920, height: 1080 };

test('px rect inside the viewport passes through, rounded', () => {
    assert.deepEqual(normalizeRect({ left: 100.4, top: 50.6, width: 800, height: 600 }, VP), { left: 100, top: 51, width: 800, height: 600 });
});

test('fractions convert against the viewport', () => {
    assert.deepEqual(normalizeRect({ left: 0.5, top: 0.25, width: 0.5, height: 0.5 }, VP, { units: 'fraction' }), { left: 960, top: 270, width: 960, height: 540 });
    assert.deepEqual(normalizeRect({ left: 0, top: 0, width: 1, height: 1 }, VP, { units: 'fraction' }), { left: 0, top: 0, width: 1920, height: 1080 });
});

test('fractions round-trip through toFractions', () => {
    const f = { left: 0.1, top: 0.2, width: 0.3, height: 0.4 };
    assert.deepEqual(toFractions(normalizeRect(f, VP, { units: 'fraction' }), VP), f);
});

test('an overflowing rect is moved, then shrunk, to fit', () => {
    assert.deepEqual(normalizeRect({ left: 1800, top: 1000, width: 400, height: 300 }, VP), { left: 1520, top: 780, width: 400, height: 300 });
    assert.deepEqual(normalizeRect({ left: 10, top: 10, width: 5000, height: 5000 }, VP), { left: 0, top: 0, width: 1920, height: 1080 });
});

test('tiny sides grow to the minimum, or to the viewport when that is smaller', () => {
    const r = normalizeRect({ left: 0, top: 0, width: 1, height: 2 }, VP);
    assert.equal(r.width, MIN_SIDE_PX);
    assert.equal(r.height, MIN_SIDE_PX);
    assert.deepEqual(normalizeRect({ left: 0, top: 0, width: 1, height: 1 }, { width: 40, height: 30 }), { left: 0, top: 0, width: 40, height: 30 });
});

test('bad input is rejected', () => {
    const bad = [
        null, 'rect', 42, {},
        { left: 0, top: 0, width: 100 },
        { left: '0', top: 0, width: 100, height: 100 },
        { left: NaN, top: 0, width: 100, height: 100 },
        { left: 0, top: 0, width: Infinity, height: 100 },
        { left: 0, top: 0, width: 0, height: 100 },
        { left: 0, top: 0, width: 100, height: -5 },
        { left: -1, top: 0, width: 100, height: 100 }
    ];
    for (const rect of bad) assert.throws(() => normalizeRect(rect, VP), undefined, JSON.stringify(rect));
    assert.throws(() => normalizeRect({ left: 0, top: 0, width: 1.5, height: 0.5 }, VP, { units: 'fraction' }));
    assert.throws(() => normalizeRect({ left: -0.1, top: 0, width: 0.5, height: 0.5 }, VP, { units: 'fraction' }));
    assert.throws(() => normalizeRect({ left: 0, top: 0, width: 10, height: 10 }, VP, { units: 'percent' }));
});

test('viewport must be positive and finite', () => {
    assert.throws(() => normalizeViewport(null));
    assert.throws(() => normalizeViewport({ width: 0, height: 10 }));
    assert.throws(() => normalizeViewport({ width: 10, height: NaN }));
    assert.deepEqual(normalizeViewport({ width: 10, height: 20, extra: 1 }), { width: 10, height: 20 });
});

test('sameRect, isRect and pickRect follow DSN\'s `rollingArea: false` convention', () => {
    assert.ok(sameRect(false, null));
    assert.ok(sameRect({ left: 1, top: 2, width: 3, height: 4 }, { left: 1.2, top: 2, width: 3, height: 4, x: 9 }));
    assert.ok(!sameRect(false, { left: 1, top: 2, width: 3, height: 4 }));
    assert.ok(!isRect({ left: 1, top: 2, width: 3 }));
    assert.equal(pickRect(false), false);
    assert.deepEqual(pickRect({ left: 1, top: 2, width: 3, height: 4, evil: true }), { left: 1, top: 2, width: 3, height: 4 });
});

test('parseRequest accepts the three actions and nothing else', () => {
    assert.deepEqual(parseRequest({ action: 'preview', on: true }), { action: 'preview', on: true, units: 'px', persist: false });
    assert.equal(parseRequest({ action: 'preview', on: 'yes' }).on, false);
    assert.deepEqual(parseRequest({ action: 'clear', persist: false }), { action: 'clear', persist: false, units: 'px', on: false });
    const set = parseRequest({ action: 'set', rect: { left: 0, top: 0, width: 0.5, height: 0.5, junk: 1 }, units: 'fraction', at: 1 });
    assert.deepEqual(set, { action: 'set', rect: { left: 0, top: 0, width: 0.5, height: 0.5 }, units: 'fraction', persist: true, on: false });
    assert.equal(parseRequest({ action: 'set', rect: null }), null);
    assert.equal(parseRequest({ action: 'set', rect: {}, units: 'em' }), null);
    assert.equal(parseRequest({ action: 'rebuild' }), null);
    assert.equal(parseRequest(null), null);
});
