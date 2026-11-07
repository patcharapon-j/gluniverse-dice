// M8: M3's materials keep a system's `frosted` / `velvet` dice and its diceSoNiceOnMaterialReady
// shader hook working. The "system" here repeats what gluniverse-daggerheart's dsn.ts applyGlow
// does: draw into mat.emissiveMap.image, black out mat.emissive, wrap onBeforeCompile and seed
// totalEmissiveRadiance before <emissivemap_fragment>.
import './foundryStubs.mjs';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { ShaderLib } from 'three';
import { decorateMaterial, extendMaterialOptions, snapshotCanvas } from '../module/glu/materials/GluMaterials.js';

class FakeCanvas {
    constructor(w = 512, h = 512) { this.width = w; this.height = h; this.ops = []; }
    getContext() {
        const c = this;
        return {
            drawImage: (src) => c.ops.push(['draw', src.label ?? 'canvas', ...(src.ops ?? [])]),
            save() {}, restore() {}, set globalCompositeOperation(v) { c.ops.push(['comp', v]); }
        };
    }
}

before(() => {
    globalThis.document = { createElement: () => new FakeCanvas() };
    globalThis.game = { settings: { get: () => true } };
});

function systemHook(mat, glowImage) {
    const canvas = mat.emissiveMap?.image;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'lighten';
    ctx.drawImage(glowImage, 0, 0, 256, 256);
    mat.emissive = { hex: 0 };
    const base = mat.onBeforeCompile;
    mat.onBeforeCompile = function (shader, renderer) {
        base?.call(this, shader, renderer);
        const chunk = '#include <emissivemap_fragment>';
        if (!shader.fragmentShader.includes(chunk)) return;
        shader.uniforms.dhLocalEmissiveIntensity = { value: 1 };
        shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', 'uniform float dhLocalEmissiveIntensity;\nvoid main() {')
            .replace(chunk, `totalEmissiveRadiance = vec3(dhLocalEmissiveIntensity);\n${chunk}`);
    };
}

function material(emissiveCanvas) {
    const upstream = function (shader) { shader.dsn = true; };
    return {
        userData: {}, emissiveMap: { image: emissiveCanvas }, onBeforeCompile: upstream,
        customProgramCacheKey() { return 'base'; }
    };
}

const fakeShader = (lib) => ({ uniforms: {}, vertexShader: ShaderLib[lib].vertexShader, fragmentShader: ShaderLib[lib].fragmentShader });

test('the number mask is a copy: a system drawing into the emissive canvas does not light it', () => {
    const emissive = new FakeCanvas();
    emissive.ops.push(['labels']);
    const mat = material(emissive);
    decorateMaterial({ material_options: { frosted: { type: 'physical', options: {} } } }, mat,
        { material: 'frosted', background: '#d4a72c' }, new FakeCanvas(), emissive);
    systemHook(mat, { label: 'hope-glow' });
    const mask = mat.userData.gluNumberMask.image;
    assert.notEqual(mask, emissive, 'not the shared canvas');
    assert.deepEqual(mask.ops, [['draw', 'canvas', ['labels']]], 'labels only, drawn before the hook');
    assert.ok(emissive.ops.some(o => o[1] === 'hope-glow'), 'the system still drew into the real emissive map');
});

test('snapshotCanvas falls back to the source when no copy can be made', () => {
    const src = new FakeCanvas();
    assert.equal(snapshotCanvas(src, () => { throw new Error('no DOM'); }), src);
    assert.equal(snapshotCanvas(src, () => ({ getContext: () => null })), src);
});

test('frosted and velvet keep upstream onBeforeCompile; the system hook still injects its light', () => {
    for (const [id, lib] of [['frosted', 'physical'], ['velvet', 'physical'], ['frosted', 'standard']]) {
        const mat = material(new FakeCanvas());
        const upstream = mat.onBeforeCompile;
        decorateMaterial({ material_options: { [id]: { type: lib, options: {} } } }, mat, { material: id }, new FakeCanvas(), new FakeCanvas());
        assert.equal(mat.onBeforeCompile, upstream, `${id}: no wrapper of ours`);
        systemHook(mat, { label: 'glow' });
        const shader = fakeShader(lib);
        mat.onBeforeCompile(shader);
        assert.ok(shader.dsn, 'upstream shader still runs');
        assert.match(shader.fragmentShader, /totalEmissiveRadiance = vec3\(dhLocalEmissiveIntensity\);\n#include <emissivemap_fragment>/);
    }
});

test('a system wrapping a galaxy/pearlescent material keeps both effects', () => {
    for (const kind of ['galaxy', 'pearlescent']) {
        const flag = kind === 'galaxy' ? { gluGalaxy: true } : { gluPearl: true };
        const mat = material(new FakeCanvas());
        decorateMaterial({ material_options: { [kind]: { type: 'physical', options: {}, ...flag } } }, mat, { material: kind }, new FakeCanvas(), new FakeCanvas());
        systemHook(mat, { label: 'glow' });
        const shader = fakeShader('physical');
        mat.onBeforeCompile(shader);
        assert.ok(shader.dsn && shader.uniforms.gluGalaxyMask && shader.uniforms.dhLocalEmissiveIntensity, kind);
        assert.match(mat.customProgramCacheKey(), /\|glu-/);
    }
});

test('enhanced materials keep frosted/velvet: same ids, upstream maps and transmission mask', () => {
    const upstream = () => ({
        frosted: { type: 'physical', options: { metalness: 1, roughness: 0.3, transmission: 1 }, scopedOptions: { roughnessMap: 'roughnessMap_frosted', envMap: true }, usesTransmissionMask: true },
        velvet: { type: 'physical', options: { metalness: 1, sheen: 0.5, sheenRoughness: 0.8 }, scopedOptions: { roughnessMap: 'roughnessMap_velvet', normalMap: 'normalMap_velvet', envMap: true } }
    });
    for (const advancedGlass of [true, false]) {
        const factory = { realisticLighting: true, advancedGlass, material_options: upstream() };
        extendMaterialOptions(factory);
        const o = factory.material_options;
        assert.equal(o.frosted.type, 'physical');
        assert.equal(o.frosted.usesTransmissionMask, true);
        assert.deepEqual(o.frosted.scopedOptions, upstream().frosted.scopedOptions);
        assert.equal(o.velvet.type, 'physical');
        assert.deepEqual(o.velvet.scopedOptions, upstream().velvet.scopedOptions);
        assert.ok(o.velvet.options.sheen > 0.5, 'velvet: denser sheen');
    }
    //every material type DSN uses for them still has the chunk the system's shader hook patches
    for (const lib of ['physical', 'standard', 'phong'])
        assert.ok(ShaderLib[lib].fragmentShader.includes('#include <emissivemap_fragment>'), lib);
});
