// M5: the hand shows the dice of the player the throw will use (module/glu/hand/HandOwner.js),
// with DSN's own RollRules. RollRules imports upstream files with extensionless paths, so it is
// bundled first, like the physics workers in tools/physics-bench/harness.mjs.
import './foundryStubs.mjs';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { handOwner } from '../module/glu/hand/HandOwner.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let RollRules;

const gm = { id: 'gm', name: 'GM', isGM: true };
const alice = { id: 'alice', name: 'Alice', isGM: false, character: null };
const bob = { id: 'bob', name: 'Bob', isGM: false, character: null };
const valeros = { id: 'valeros', hasPlayerOwner: true, ownership: { default: 0, alice: 3 } };
const goblin = { id: 'goblin', hasPlayerOwner: false, ownership: { default: 0 } };
alice.character = valeros;
let ownerSetting = '2';

before(async () => {
    const outDir = path.join(root, 'tools/physics-bench/.build');
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, 'roll-rules.mjs');
    const build = await rollup({ input: path.join(root, 'module/throw/RollRules.js'), plugins: [nodeResolve(), commonjs()], onwarn() {} });
    await build.write({ file, format: 'es' });
    await build.close();
    ({ RollRules } = await import(pathToFileURL(file).href));

    const users = [gm, alice, bob];
    const actors = new Map([[valeros.id, valeros], [goblin.id, goblin]]);
    globalThis.CONST = { DOCUMENT_OWNERSHIP_LEVELS: { OWNER: 3 } };
    globalThis.game = {
        user: gm,
        users: Object.assign(users, { get: (id) => users.find(u => u.id === id) }),
        actors: { get: (id) => actors.get(id) },
        settings: { get: (ns, key) => (ns === 'dice-so-nice' && key === 'forceCharacterOwnerAppearance' ? ownerSetting : undefined) }
    };
    globalThis.ChatMessage = { getSpeakerActor: (speaker) => actors.get(speaker?.actor) ?? null };
});

const message = (author, actorId, flags = {}) => ({
    author,
    speaker: { actor: actorId },
    getFlag: (scope, key) => flags[`${scope}.${key}`]
});
const rolls = (dsnActorId) => [{ dice: [{ options: dsnActorId ? { dsnActorId } : {} }] }];

test('the GM rolling from a player\'s sheet holds that player\'s dice', () => {
    ownerSetting = '2';
    const owner = handOwner(message(gm, 'valeros'), rolls(), RollRules);
    assert.equal(owner.user, alice);
    assert.equal(owner.actor, valeros);
});

test('another player rolling from that sheet holds the owner\'s dice too', () => {
    ownerSetting = '2';
    assert.equal(handOwner(message(bob, 'valeros'), rolls(), RollRules).user, alice);
});

test('the die\'s dsnActorId wins over the speaker, as in animateRolls', () => {
    ownerSetting = '2';
    assert.equal(handOwner(message(gm, 'goblin'), rolls('valeros'), RollRules).user, alice);
});

test('without the owner setting, or for an NPC, the roller keeps their own dice', () => {
    ownerSetting = '0';
    assert.equal(handOwner(message(gm, 'valeros'), rolls(), RollRules).user, gm);
    ownerSetting = '2';
    assert.equal(handOwner(message(gm, 'goblin'), rolls(), RollRules).user, gm);
});

test('"initiative only": only an initiative roll resolves the owner', () => {
    ownerSetting = '1';
    assert.equal(handOwner(message(gm, 'valeros'), rolls(), RollRules).user, gm);
    assert.equal(handOwner(message(gm, 'valeros', { 'core.initiativeRoll': true }), rolls(), RollRules).user, alice);
});
