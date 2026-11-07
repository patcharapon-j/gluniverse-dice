// M8: tags, emphasis and the settle plan (module/glu/fx/DicePresentation.js).
import './foundryStubs.mjs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
    TERM_KEY, SETTLE_HOOK, GAIN, readTag, tagTerm, emphasiseHighest, planPresentation, presentationOrder, settlePresentation
} from '../module/glu/fx/DicePresentation.js';

beforeEach(() => {
    Hooks._hooks[SETTLE_HOOK] = [];
    globalThis.game = { settings: { get: () => 'die' } };
});

test('tagTerm stamps term.options and merges', () => {
    const term = { options: { colorset: 'dh-hope-d12' } };
    tagTerm(term, { tag: 'hope' });
    tagTerm(term, { emphasis: true });
    assert.deepEqual(term.options[TERM_KEY], { tag: 'hope', emphasis: true });
    assert.equal(term.options.colorset, 'dh-hope-d12', 'other options are kept');
    tagTerm(term, { emphasis: null });
    assert.deepEqual(term.options[TERM_KEY], { tag: 'hope' }, 'null clears a key');
    const bare = tagTerm({}, { tag: 'fear' });
    assert.deepEqual(bare.options[TERM_KEY], { tag: 'fear' });
    assert.equal(tagTerm(null, { tag: 'x' }), null);
    //plain JSON: survives the roll's serialisation to other clients
    assert.deepEqual(JSON.parse(JSON.stringify(term)).options[TERM_KEY], term.options[TERM_KEY]);
});

test('readTag normalises', () => {
    assert.deepEqual(readTag(undefined), { tag: null, glow: null, emphasis: null });
    assert.deepEqual(readTag({ [TERM_KEY]: { tag: '', emphasis: 'yes' } }), { tag: null, glow: null, emphasis: null });
    assert.deepEqual(readTag({ [TERM_KEY]: { tag: 'hope', glow: false, emphasis: false } }), { tag: 'hope', glow: false, emphasis: false });
});

test('emphasiseHighest: Hope beats Fear, ties are both, other dice untouched', () => {
    const dice = [{ tag: 'hope', result: 9 }, { tag: 'fear', result: 4 }, { tag: 'advantage', result: 6 }, { tag: null, result: 12 }];
    emphasiseHighest(dice, ['hope', 'fear']);
    assert.deepEqual(dice.map(d => d.emphasis), [true, false, undefined, undefined]);
    const crit = [{ tag: 'hope', result: 7 }, { tag: 'fear', result: 7 }];
    emphasiseHighest(crit, ['hope', 'fear']);
    assert.deepEqual(crit.map(d => d.emphasis), [true, true]);
    //one die alone is not emphasised
    const one = [{ tag: 'hope', result: 3 }];
    emphasiseHighest(one);
    assert.equal(one[0].emphasis, undefined);
});

test('planPresentation: gain by emphasis, glow:false is no glow, order lead first', () => {
    const plan = planPresentation([
        { tag: 'fear', emphasis: false, background: '#7b4fc0' },
        { tag: 'hope', emphasis: true, background: '#d4a72c' },
        { tag: 'advantage', glow: false, background: '#dfe6ee' },
        { tag: null, background: '#dfe6ee' }
    ]);
    assert.deepEqual(plan.map(p => p.rank), ['quiet', 'lead', 'plain', 'plain']);
    assert.deepEqual(plan.map(p => p.gain), [GAIN.quiet, GAIN.lead, GAIN.plain, GAIN.plain]);
    assert.equal(plan[2].tint, null);
    assert.deepEqual(plan[3].tint, [1, 1, 1]);
    assert.ok(plan[1].tint[0] > plan[1].tint[2], 'Hope glows gold');
    assert.deepEqual(presentationOrder(plan).map(p => p.index), [1, 2, 3, 0]);
    const white = planPresentation([{ background: '#d4a72c' }], { mode: 'white' });
    assert.deepEqual(white[0].tint, [1, 1, 1]);
});

function mesh(options, result, background) {
    return { options, forcedResult: result, notation: { type: 'd12' }, material: { userData: { materialData: { background } } } };
}

test('settlePresentation reads mesh.options, runs the hook, maps each mesh', () => {
    const hope = mesh({ [TERM_KEY]: { tag: 'hope' } }, 10, '#d4a72c');
    const fear = mesh({ [TERM_KEY]: { tag: 'fear' } }, 3, '#7b4fc0');
    const other = mesh({}, 5, '#ffffff');
    let seen;
    Hooks.on(SETTLE_HOOK, (dice, ctx) => {
        seen = dice.map(d => [d.tag, d.result, d.type]);
        ctx.emphasiseHighest(dice, ['hope', 'fear']);
    });
    const looks = settlePresentation([hope, fear, other]);
    assert.deepEqual(seen, [['hope', 10, 'd12'], ['fear', 3, 'd12'], [null, 5, 'd12']]);
    assert.equal(looks.get(hope).rank, 'lead');
    assert.equal(looks.get(fear).rank, 'quiet');
    assert.equal(looks.get(other).rank, 'plain');
    assert.deepEqual(looks.get(other).tint, [1, 1, 1]);
});

test('settlePresentation: term data alone is enough, a throwing hook does not break the settle', () => {
    const a = mesh({ [TERM_KEY]: { tag: 'hope', emphasis: true, glow: '#00ff00' } }, 2, '#d4a72c');
    Hooks.on(SETTLE_HOOK, () => { throw new Error('boom'); });
    const warn = console.warn; console.warn = () => {};
    try {
        const looks = settlePresentation([a]);
        assert.equal(looks.get(a).rank, 'lead');
        assert.ok(looks.get(a).tint[1] > looks.get(a).tint[0], 'override colour');
    } finally { console.warn = warn; }
    assert.equal(settlePresentation([]).size, 0);
});
