# CLAUDE.md: GLUniverse Dice

A soft fork of the Foundry VTT module Dice So Nice (DSN) 6.4.5. Read [FORK.md](./FORK.md) before
changing anything. [ROADMAP.md](./ROADMAP.md) is the plan; [CREDITS.md](./CREDITS.md) is the asset audit.

## Hard rules

- **Keep DSN's public API** exactly: `game.dice3d`, every `diceSoNice*` hook, colorsets, roles,
  `term.options.colorset` / `appearance`, the `dice-so-nice` settings, flags and keybindings
  namespace. Systems and modules (including `~/gluniverse-daggerheart` and
  `~/gluniverse-foundry-modules`) integrate through them.
- **New files plus minimal hooks.** Our code lives in `module/glu/`, `module/web-workers/rapier/`,
  `tools/`, `tests/`. An upstream file gets one import plus one call, marked `//GLUniverse Dice`,
  and goes in FORK.md's "Upstream files we touch" table **in the same commit**.
- **Never touch `upstream-master`, never push to `upstream`** (its push URL is disabled on purpose).
  Work on a branch and open a PR to `origin/main`. `origin` is private: keep it private.
- **Assets ship as-is.** Do not remove, replace or gate any texture, sound, model or font.
  Permission is pending with the owners (CREDITS.md).
- AGPL-3.0: no code from incompatible licences. Keep every upstream copyright notice and credit.
- **Do not write `"dice-so-nice"` asset paths or socket channels by hand** in new code: import
  `MODULE_ID` from `module/glu/LegacyIdentity.js`. Upstream's literal `modules/dice-so-nice/` and
  `module.dice-so-nice` strings are rewritten at build time (`tools/rollup-glu.js`).
- `module/glu/index.js` must stay the **first import** of `module/main.js`.
- The physics worker contract (FORK.md) is shared by `PhysicsWorker.js` (cannon-es) and
  `rapier/RapierPhysicsEngine.js`. A change to one must be made to the other, with
  `tests/workerContract.test.mjs` updated.
- Keep `module/web-workers/rapier/` free of GLUniverse-specific imports: it is meant to go
  upstream as its own merge request.

## Commands

```sh
npm ci
npm run build        # rollup -c → dist/ (main bundle + dist/workers/rapier-physics-worker.js)
npm test             # node --test tests/*.test.mjs (shape parity vs cannon-es, worker contract)
npm run bench        # physics benchmark (tools/physics-bench); --trials N --json out.json --tuning '{…}'
```

This machine has no system Node. Install one, or put a Node 22 binary on `PATH` (FORK.md
"Build and load"). GitLab rate-limits its API, so read DSN from the local checkout, not the web.

## Testing in Foundry

Foundry v14 app: `~/foundryvtt`. User data: `~/.local/share/FoundryVTT` (`Data/modules/`).
Link `dist/` as `Data/modules/gluniverse-dice`. Anything that renders, uses sockets or touches
the UI can only be confirmed in a running Foundry: say so rather than claiming it works.

## Where things are

- Throw flow: `throw/ThrowPipeline.js` → `rendering/DiceBox.js` → `engine/ThrowEngine.js`
  (simulate in the worker, then replay buffers, `swapDiceFace` forces Foundry's result).
- Physics workers: `web-workers/PhysicsWorker.js` (cannon-es, legacy scale ×3125 internally),
  `web-workers/RapierPhysicsWorker.js` + `web-workers/rapier/` (meters). Engine choice:
  `glu/PhysicsEngine.js`, world setting `gluniverse-dice.physicsEngine`.
- Interactive throws and persistent dice: `interaction/`; docs in
  `docs/src/content/docs/api/interactive-throws.md`.
- Scene units: meters, +Y up, desk at y = 0 (`engine/SceneConstants.js`).
