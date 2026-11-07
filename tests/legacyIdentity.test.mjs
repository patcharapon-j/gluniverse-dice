// LegacyIdentity: game.modules.get("dice-so-nice") answers with GLUniverse Dice unless the real
// Dice So Nice is active too. A disabled DSN left installed on the server must not win.
import { test } from 'node:test';
import assert from 'node:assert/strict';

let n = 0;
async function load(modules) {
    globalThis.Hooks = { once() {}, on() {} };
    globalThis.CONFIG = {};
    globalThis.game = { modules };
    //a fresh copy of the module each time: it installs once per load
    return import(`../module/glu/LegacyIdentity.js?case=${n++}`);
}
const ours = { id: 'gluniverse-dice', active: true };

test('no Dice So Nice installed: the legacy id resolves to us', async () => {
    const modules = new Map([['gluniverse-dice', ours]]);
    const m = await load(modules);
    assert.equal(modules.get('dice-so-nice'), ours);
    assert.equal(modules.has('dice-so-nice'), true);
    assert.equal(m.isLegacyConflict(), false);
});

test('Dice So Nice installed but disabled: the legacy id still resolves to us', async () => {
    const dsn = { id: 'dice-so-nice', active: false };
    const modules = new Map([['gluniverse-dice', ours], ['dice-so-nice', dsn]]);
    const m = await load(modules);
    assert.equal(modules.get('dice-so-nice'), ours);
    assert.equal(modules.get('dice-so-nice').active, true);
    assert.equal(m.isLegacyConflict(), false);
    //iteration is untouched: both packages are still listed once each
    assert.deepEqual([...modules.keys()], ['gluniverse-dice', 'dice-so-nice']);
});

test('Dice So Nice active as well: no shadowing, conflict reported', async () => {
    const dsn = { id: 'dice-so-nice', active: true };
    const modules = new Map([['gluniverse-dice', ours], ['dice-so-nice', dsn]]);
    const m = await load(modules);
    assert.equal(modules.get('dice-so-nice'), dsn);
    assert.equal(m.isLegacyConflict(), true);
});
