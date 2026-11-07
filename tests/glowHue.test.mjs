// M8: the settle glow in the die's own hue (module/glu/fx/GlowHue.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, rgbToHsl, hslToRgb, glowTintOf, resolveGlowTint } from '../module/glu/fx/GlowHue.js';

const near = (a, b, eps = 1e-3) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < eps);

test('parseColor takes the forms colorsets and callers use', () => {
    assert.deepEqual(parseColor('#ff0000'), [1, 0, 0]);
    assert.deepEqual(parseColor('#0f0'), [0, 1, 0]);
    assert.deepEqual(parseColor('#0000ff80'), [0, 0, 1]);
    assert.deepEqual(parseColor(0x00ff00), [0, 1, 0]);
    assert.deepEqual(parseColor('rgb(255, 0, 0)'), [1, 0, 0]);
    assert.deepEqual(parseColor([0.5, 0.25, 1]), [0.5, 0.25, 1]);
    assert.deepEqual(parseColor({ r: 1, g: 0.5, b: 0 }), [1, 0.5, 0]);
    //a colorset's random choices: the first
    assert.deepEqual(parseColor(['#ff0000', '#00ff00']), [1, 0, 0]);
    for (const bad of [null, undefined, false, '', 'gold', '#12', NaN, -1, {}, []]) assert.equal(parseColor(bad), null);
});

test('hsl round trip', () => {
    for (const c of [[0.83, 0.65, 0.17], [0.48, 0.31, 0.75], [0.2, 0.9, 0.4], [0.5, 0.5, 0.5]])
        assert.ok(near(hslToRgb(rgbToHsl(c)), c), String(c));
});

test('the die hue is kept and lifted so an additive glow shows', () => {
    //Daggerheart's Hope gold and Fear violet
    for (const hex of ['#d4a72c', '#7b4fc0']) {
        const src = rgbToHsl(parseColor(hex));
        const tint = rgbToHsl(glowTintOf(hex));
        assert.ok(Math.abs(tint[0] - src[0]) < 0.01, `${hex} keeps its hue`);
        assert.ok(tint[2] >= 0.6 - 1e-6 && tint[2] <= 0.8 + 1e-6, `${hex} lightness in the glow band`);
    }
    //a dark saturated die still glows in its hue, brightened
    assert.ok(rgbToHsl(glowTintOf('#400000'))[2] >= 0.6 - 1e-6);
});

test('dice without a hue keep the white glow', () => {
    for (const hex of ['#ffffff', '#000000', '#808080', '#dfe6ee', '#101318'])
        assert.equal(glowTintOf(hex), null, hex);
    assert.deepEqual(resolveGlowTint({ background: '#dfe6ee' }), [1, 1, 1]);
    //the edge colour is tried when the body has no hue
    assert.notDeepEqual(resolveGlowTint({ background: '#000000', edge: '#b498f0' }), [1, 1, 1]);
});

test('resolveGlowTint: override wins, "white" mode is M4 white', () => {
    assert.deepEqual(resolveGlowTint({ background: '#d4a72c', mode: 'white' }), [1, 1, 1]);
    assert.ok(!near(resolveGlowTint({ background: '#d4a72c' }), [1, 1, 1]));
    const red = resolveGlowTint({ override: '#ff0000', background: '#d4a72c', mode: 'white' });
    assert.ok(red[0] > 0.9 && red[1] < 0.3 && red[2] < 0.3, 'override wins over the mode');
    //a grey override is taken as given, a near-black one becomes white
    assert.deepEqual(resolveGlowTint({ override: '#cccccc' }), parseColor('#cccccc'));
    assert.deepEqual(resolveGlowTint({ override: '#111111' }), [1, 1, 1]);
    assert.deepEqual(resolveGlowTint(), [1, 1, 1]);
});
