// Runs the real physics worker sources (module/web-workers/*.js) in-process under Node, behind the
// same webworker-promise protocol the browser uses. Each worker is bundled with rollup first
// (the sources import CJS sub-paths Node's ESM loader cannot resolve on its own).
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import WebworkerPromise from 'webworker-promise';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'tools/physics-bench/.build');

export const WORKERS = {
    cannon: 'module/web-workers/PhysicsWorker.js',
    rapier: 'module/web-workers/RapierPhysicsWorker.js'
};

async function bundle(name) {
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, `${name}-worker.mjs`);
    const build = await rollup({
        input: path.join(root, WORKERS[name]),
        plugins: [nodeResolve({ browser: false, preferBuiltins: true }), commonjs({ include: /node_modules/ })],
        onwarn() {}
    });
    await build.write({ file, format: 'es' });
    await build.close();
    return file;
}

/** A Worker-like pair: `client` is what WebworkerPromise wraps, `scope` stands in for `self`. */
function createChannel() {
    const scopeListeners = [];
    const deliver = (fn, data, transfer) => {
        const copy = structuredClone(data, { transfer: transfer || [] });
        setImmediate(() => fn(copy));
    };
    const client = {
        onmessage: null,
        postMessage(data, transfer) {
            deliver((d) => scopeListeners.forEach(l => l({ data: d })), data, transfer);
        },
        terminate() {}
    };
    const scope = {
        addEventListener(type, fn) { if (type === 'message') scopeListeners.push(fn); },
        postMessage(data, transfer) {
            deliver((d) => client.onmessage && client.onmessage({ data: d }), data, transfer);
        }
    };
    return { client, scope };
}

/** Load a worker by engine name; returns a WebworkerPromise exactly like DiceFactory gets. */
export async function loadWorker(name) {
    const file = await bundle(name);
    const { client, scope } = createChannel();
    const previous = globalThis.self;
    globalThis.self = scope;
    //cache-bust so each call gets a fresh module instance (fresh RegisterPromise bound to this scope)
    await import(pathToFileURL(file).href + `?t=${Date.now()}-${Math.random()}`);
    globalThis.self = previous;
    return new WebworkerPromise(client);
}
