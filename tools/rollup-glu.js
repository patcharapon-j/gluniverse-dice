// GLUniverse Dice build additions, kept out of rollup.config.js so the upstream config diff stays small.
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export const MODULE_ID = 'gluniverse-dice';

// Upstream source hardcodes the package id in two places that must follow the real id:
//  - asset/template URLs "modules/dice-so-nice/..." (Foundry serves the package at modules/<id>/)
//  - the socket channel "module.dice-so-nice" (the server only relays module.<id> for the real id)
// Rewriting them at build time keeps ~110 upstream lines untouched. Everything else that says
// "dice-so-nice" (settings, flags, keybindings, CSS classes, hooks) stays as-is on purpose: see FORK.md.
export function gluIdentityReplace() {
  return replace({
    preventAssignment: false,
    delimiters: ['', ''],
    values: {
      'modules/dice-so-nice/': `modules/${MODULE_ID}/`,
      'module.dice-so-nice': `module.${MODULE_ID}`
    }
  });
}

// The Rapier worker is a separate classic-worker bundle (dist/workers/rapier-physics-worker.js).
// rapier3d-compat inlines ~4 MB of base64 wasm: inlining that into main.js would make every client
// download and parse it even when the cannon-es engine is selected. It is fetched only on demand.
export function rapierWorkerConfig({ isProduction }) {
  return {
    input: 'module/web-workers/RapierPhysicsWorker.js',
    output: {
      file: 'dist/workers/rapier-physics-worker.js',
      format: 'iife',
      sourcemap: !isProduction
    },
    plugins: [
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs({ include: /node_modules/ }),
      isProduction && terser({ ecma: 2020, keep_fnames: true, compress: { drop_console: false } })
    ].filter(Boolean)
  };
}
