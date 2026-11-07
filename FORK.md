# GLUniverse Dice: fork notes

## Notice (AGPL-3.0 section 5)

**GLUniverse Dice is a modified version of [Dice So Nice!](https://gitlab.com/riccisi/foundryvtt-dice-so-nice)
by Simone (riccisi) and JDW.** It was forked from Dice So Nice 6.4.5 (upstream commit `b365efc`) on
2026-11-07 and is distributed under the same licence, the GNU Affero General Public License v3
([LICENSE.md](./LICENSE.md)). Every upstream copyright notice and credit is kept; see
[README.md](./README.md) and [CREDITS.md](./CREDITS.md).

Changes from Dice So Nice, newest last:

| Date | Change |
|---|---|
| 2026-11-07 | Package renamed to `gluniverse-dice` / "GLUniverse Dice", declared as conflicting with `dice-so-nice`. The `dice-so-nice` identity stays reachable (see [Identity](#identity)). |
| 2026-11-07 | Optional Rapier physics backend (`module/web-workers/RapierPhysicsWorker.js`), chosen by a world setting. cannon-es stays the default. |

The AGPL requires the corresponding source to be offered to everyone who receives the module.
The repository is private until the first release: make it public, or publish the source next
to the release zip, **before** the first build leaves the table.

Licence field: upstream's `package.json` says `"AGPL"` without a version, and LICENSE.md is the
v3 text. We kept `"AGPL"`. Choosing between `AGPL-3.0-only` and `AGPL-3.0-or-later` is a
licensing decision for the maintainer, not a refactor.

## The rule: new files, minimal hooks

We keep Dice So Nice's public API whole (`game.dice3d`, every `diceSoNice*` hook, colorsets,
roles, `term.options.colorset` / `appearance`), so every system and module that integrates DSN
works unchanged. To keep rebasing onto upstream cheap:

1. **New behaviour goes in new files**: `module/glu/`, `module/web-workers/rapier/`, `tools/`,
   `tests/`. Never inline a feature into an upstream file.
2. **Upstream files get hooks, not features.** A hook is one import plus one call, marked
   `//GLUniverse Dice`. If a feature needs more than a handful of lines in an upstream file,
   add a seam (an overridable method, an event) and put the logic in our file.
3. **Generic work stays generic.** The Rapier backend has no GLUniverse dependency, so it can be
   offered upstream as its own merge request.
4. **Every upstream file we touch is listed below**, with the reason. Update the table in the
   same commit.

### Upstream files we touch

| File | Change | Why |
|---|---|---|
| `module/main.js` | Line 1: `import "./glu/index.js";` | Entry for everything we add. Must stay the first import so the identity shim installs before any init hook. |
| `module/engine/DiceFactory.js` | One import; the `physicsWorker` getter calls `createPhysicsWorker(() => <upstream construction>)` | The single place the physics worker is created, so the engine choice lives in one spot. |
| `module/module.json` | id, title, description, authors (GLUniverse added, DSN authors kept), URLs, `relationships.conflicts`, extra `lang/glu-en.json` entry | Package identity. |
| `rollup.config.js` | Import `tools/rollup-glu.js`; add `gluIdentityReplace()`; export `[config, rapierWorkerConfig]`; GitHub download URL | Build-time id rewrite and the Rapier worker bundle. |
| `package.json`, `package-lock.json` | name, version, repository URLs, scripts; deps `@dimforge/rapier3d-compat`, `@rollup/plugin-replace` | Package metadata and the two new dependencies. |
| `README.md` | Fork section at the top; Rapier added to "Built on" | AGPL notice and credits. Everything upstream wrote is kept. |
| `.gitignore` | `tools/physics-bench/.build/` | Benchmark scratch bundles. |

Files that are entirely ours: `FORK.md`, `ROADMAP.md`, `CREDITS.md`, `CLAUDE.md`, `module/glu/*`,
`module/lang/glu-en.json`, `module/web-workers/RapierPhysicsWorker.js`,
`module/web-workers/rapier/*`, `tools/*`, `tests/*`, `docs/fork/*`, `docs/mocks/*`.
`docs/mocks/` holds design mocks. They are not part of the module: the build copies only
`module/` into `dist/`, and the release zip is made from `dist/`.

## Identity

The module id is `gluniverse-dice`. Systems and modules that integrate Dice So Nice find it as
`dice-so-nice` in three ways, each handled differently:

| Lookup | Example | What we do |
|---|---|---|
| Package lookup | `game.modules.get("dice-so-nice")?.active`; the user's `gluniverse-foundry-modules` gates Spotlight Roll, Combat Intro, PF2e FX and the stream dice wait on it, and checks `version` major ≥ 6 | `module/glu/LegacyIdentity.js` overrides `get`/`has` **on the `game.modules` instance** to map `dice-so-nice` to our package. Iteration is untouched, so the package is never listed twice. Our version stays `6.x` (`6.4.5-glu.N`) so major-version gates pass. |
| Flag scope | `user.getFlag("dice-so-nice", "settings")` throws unless the scope is an active package id | The shim adds `dice-so-nice` to `CONFIG.DatabaseBackend.getFlagScopes()`. The server does not validate flag scopes. |
| Namespaces that are only strings | `game.settings.get("dice-so-nice", …)`, keybindings, tours, CSS classes `.dice-so-nice`, flags written as data, hook names | **Unchanged on purpose.** Foundry does not validate settings, keybinding or tour namespaces against package ids (checked in v14.370 `client-settings.mjs`, `client-keybindings.mjs`, and the server `Setting` document). Keeping them means an existing DSN world keeps every setting, appearance and role when it switches to GLUniverse Dice. The settings UI files them under our package because its category lookup goes through `game.modules.get`. |
| Socket channel and asset URLs | `module.dice-so-nice`, `modules/dice-so-nice/sounds/…` | These **must** follow the real id: the server only relays `module.<id>`, and serves files at `modules/<id>/`. `tools/rollup-glu.js` rewrites both strings at bundle time, so the ~110 upstream source lines stay untouched. |

**Timing.** Foundry evaluates system scripts before module scripts, then runs
`globalThis.game = await Game.create()` and fires `init`. A system's `init` listener therefore
runs before ours. The shim does not wait for `init`: at script evaluation it traps the
`globalThis.game` assignment and installs the moment `game.modules` exists, before any package
code can look. An `init` fallback covers anything unusual.

**Conflict.** If the real Dice So Nice is installed, the shim never shadows it. If both are
active, it logs an error and shows a permanent notification. `relationships.conflicts` makes
Foundry warn at activation.

Options considered:

1. *Keep the id `dice-so-nice`.* No shim needed, but it cannot coexist with DSN, and Foundry's
   package browser and The Forge would treat us as DSN. Rejected: the brief asks for a rename.
2. *Insert a second entry under `dice-so-nice` into `game.modules`.* Every iteration (module
   list, flag scopes, compatibility checks) would see the package twice. Rejected.
3. *Instance-level `get`/`has` alias plus flag scope, string namespaces unchanged* (chosen).
   It is invisible to iteration and needs zero edits in other packages. Residual risk: code that
   iterates `game.modules` looking for the id `dice-so-nice` will not find it. None of the
   user's packages do this.
4. *Ask every integrating package to also check `gluniverse-dice`.* Works for the user's own
   packages, not for the ecosystem. Keep it as a belt-and-braces change in
   `gluniverse-foundry-modules` later; it is not required.

The remaining residue: the tour selectors in `DiceTourMain.js` that target
`[data-tab="dice-so-nice"]` in the settings window now see the tab id `gluniverse-dice`
(SettingsConfig names a category by `module.id`). The guided tour's settings steps need a check in
a running Foundry.

## Build and load

Requires Node 20+ (22 used here). No `cwebp` is needed unless a texture atlas is added as PNG.

```sh
npm ci
npm run build          # = npx rollup -c   (dev build, sourcemaps, writes dist/)
npm run build:prod     # minified
npm test               # shape parity + worker contract tests (both engines)
npm run bench          # physics benchmark, see docs/fork/PHYSICS_BENCH.md
```

`dist/` is the module folder. Load it in Foundry by linking it into the user data directory.
On this machine that is `/home/frostnoxia/.local/share/FoundryVTT` (from
`~/.local/share/FoundryVTT/Config/options.json`, `dataPath`):

```sh
ln -s "$PWD/dist" ~/.local/share/FoundryVTT/Data/modules/gluniverse-dice
```

The folder name must equal the id, `gluniverse-dice`. Restart Foundry (`~/foundryvtt/foundryvtt`),
enable **GLUniverse Dice** in the world, and keep **Dice So Nice!** disabled. During development,
`npx rollup -c -w` rebuilds the JS. Watch mode skips the static copy, so run a full build after
changing templates, CSS or assets.

Foundry versions: upstream 6.4.5 declares `compatibility.minimum: 14` (verified 14.370), and so do
we. **Foundry v13 is not supported by this code base.** DSN 6.x relies on v14 APIs. Running on
v13 means forking an older DSN 5.x line, which this fork does not do. The installed app is
v14.370.

Physics engine: world setting **GLUniverse Dice › Physics engine** (cannon-es / Rapier). It
needs a reload. If the Rapier worker fails to load or answer within 20 s, the client falls back to
cannon-es and shows a warning.

## Rebase procedure

`upstream-master` mirrors DSN `master`. Never commit to it, never push to `upstream`.

```sh
git fetch upstream
git branch -f upstream-master upstream/master
git push origin upstream-master             # keep the private mirror current
git switch -c rebase/<dsn-version> main
git rebase upstream-master                  # or: git merge upstream-master, if history is shared
```

Then:

1. Resolve conflicts. They should only be in the files of the table above.
2. Run `grep -rn "dice-so-nice" module --include='*.js' | grep -v "settings\.\|Flag\|flags"` and
   check new upstream strings: new asset paths and socket emits are rewritten by the build, but a
   new *kind* of id use (for example a package lookup of its own id) needs a decision here.
3. Diff `module/web-workers/PhysicsWorker.js` against the previous upstream version. **Every
   change to the worker contract must be mirrored in `RapierPhysicsEngine.js`**, and
   `tests/workerContract.test.mjs` extended.
4. `npm ci && npm test && npm run build`, then a manual roll in Foundry with each engine.
5. Bump `version` in `package.json` to `<dsn-version>-glu.1` (the build copies it to module.json).

## Physics worker contract

The main thread talks to the physics worker only through
[webworker-promise](https://github.com/kwolfy/webworker-promise): `worker.exec(op, payload)`
returns a promise, and the worker can `emit(event, data)`. Both workers implement exactly this.
All lengths are **meters**, velocities m/s, angular velocities rad/s, and quaternions `{x,y,z,w}`.
The cannon-es worker converts to its internal legacy scale (×3125); the Rapier worker runs in
meters natively.

### Operations

| Op | Payload | Returns | Callers |
|---|---|---|---|
| `init` | `{ muteSoundSecretRolls, height, width, margin:{top,bottom,left,right} }` (container size, not half-size) | – | `DiceBox.initialize` (board only) |
| `createShape` | `{ name, radius, definition }`, where `definition` = `DiceShapeLibrary.getWorkerDefinition(name)`: `{type:"ConvexPolyhedron", vertices, faces, skipLastFaceIndex, faceValues}` or `{type:"Cylinder", radiusTop, radiusBottom, height, numSegments, faceValues}` | – | `DiceFactory.create` for board/persistent dice, every time (a fresh worker learns every shape) |
| `createDice` | `{ id, shape, material, vectordata:{type,pos,velocity,angle,axis:{x,y,z,a}}, mass, startAtIteration, options:{secret?, persistent?} }` | – | `PersistentDiceManager` |
| `createDiceBatch` | array of `createDice` payloads; bodies with `startAtIteration === 0` enter the world now | – | `ThrowEngine.spawnDice`, `startUnifiedBatch` |
| `addDice` | `id` | – | `PersistentDiceManager` |
| `removeDice` | `ids[]`; also drops their constraints and wakes the survivors | – | `ThrowEngine.clearAll`, `DiceBox`, `PersistentDiceManager` |
| `setBodyPositions` | `{ updates:[{id, position}] }`; zeroes velocities | – | `ThrowEngine` (held dice before a throw), `DiceBox` |
| `setBodyPosition` | `{ id, position }` | – | no in-repo caller |
| `setCollisionResponse` | `{ ids, enabled }`: ghost a die (contacts detected, no forces, no sounds) | – | `ThrowEngine`, `DiceBox`, `PersistentDiceManager` |
| `addConstraint` | `{ id, pos }`: grab. Persistent dice pivot on their centre and the anchor keeps the die's xz; ephemeral dice pivot at the click point | – | `InputHandler`, `PersistentDiceManager` |
| `updateConstraint` | `{ positions: { [id]: pos } }` (string keys) | – | `InputHandler`, `PersistentDiceManager` (per frame) |
| `removeConstraint` | `{ ids? }`, all when omitted; restores the sleep policy | – | `InputHandler`, `PersistentDiceManager` |
| `applyImpulse` | `{ id, velocity, angularVelocity }` (sets velocities, makes the body dynamic) | – | no in-repo caller |
| `getBodyQuaternion` | `id` | `{x,y,z,w}` or `null` | no in-repo caller |
| `getDiceValue` | `id` | face value (cached until the die moves again) or `null` | `dicemesh.getValue()` (public, no in-repo caller) |
| `playStep` | `{ time_diff }` in seconds; fixed 1/60 s steps with an accumulator, at most 10 per call; ignored while a throw is simulating | `{ ids, quaternionsBuffers: ArrayBuffer, positionsBuffers: ArrayBuffer, worldAsleep }`: flat Float32 arrays, 4 resp. 3 floats per id, dead dice excluded; `ids` empty when `worldAsleep` | `DiceBox.animateThrow`, every frame while no replay is playing |
| `simulateThrow` | `{ minIterations, nbIterationsBetweenRolls, framerate, canBeFlipped, impulses: {[id]: {velocity, angularVelocity}} \| null }` | see below | `ThrowEngine.startUnifiedBatch` |
| `updateBarriers` | same shape as `init`'s size | – | `DiceBox` on resize |
| `getWorldInfo` | – | logs the world | debugging only |

Event: **`collide`** `{ source: "dice"\|"table", type, material, strength }`, emitted only
outside `simulateThrow`, consumed by `SoundManager.eventCollide`.

### `simulateThrow` in detail

The worker runs the whole throw up front, up to 1000 steps of `framerate` (1/60 s), and returns
the trajectory. The main thread then **replays** it; it never steps physics during a replay.

1. Impulses are applied first: the recipients become dynamic and awake, with their cached result cleared.
2. *Primary dice*, which decide when the throw ends, are the impulse recipients plus every
   non-persistent die, including dead dice from earlier throws.
3. Tracking starts for every awake dynamic die that is already in the world. A die whose
   `startAtIteration` comes up (only on multiples of `nbIterationsBetweenRolls`) is added and
   tracked from that frame. A sleeping bystander that gets knocked awake is tracked from the
   frame it wakes. Frames before tracking starts are back-filled with the die's resting or
   spawn pose.
4. The loop ends when `iteration >= minIterations` and every primary die is asleep, or at 1000.
5. Afterwards: each tracked die's face value is read (the face whose normal is closest to +Y,
   or −Y for the d4, ignoring faces whose value is 0) and its final quaternion stored. Unless
   `canBeFlipped`, **every non-persistent die becomes static** (`mass = 0`), so later throws
   bounce off it without moving it, and gets `dead = iterationsNeeded`.

Returns (buffers are transferred, not copied):

```
{ ids: number[],                       // tracked dice, buffer order
  positionsBuffers: ArrayBuffer[],     // Float32Array(1001*3) per id, meters, frame i at i*3
  quaternionsBuffers: ArrayBuffer[],   // Float32Array(1001*4) per id
  deads: (number|false)[],             // iterationsNeeded for dice made static, else false
  iterationsNeeded: number,            // last simulated frame
  detectedCollides: Array(1000),       // sparse, by frame: ["dice", type, material, strength] | ["table", null, null, strength]
  faceValues: {[id]: number},          // physical face up, before any correction
  finalQuaternions: {[id]: {x,y,z,w}} }
```

How `ThrowEngine` consumes it:

- **Ephemeral dice:** `dicemesh.sim = { dead, stepPositions, stepQuaternions }`. Then
  `swapDiceFace(mesh, faceValues[id])` rotates the *mesh inside its parent group*, using the
  shape's `rotationCombinations`, so the face Foundry rolled ends up where the physical
  `faceValues[id]` landed. The physics result never decides the roll; it only decides which way
  the mesh is turned.
- **Thrown persistent dice:** the same swap is computed, then baked into every replay quaternion
  (`bakeSwapIntoQuaternionBuffer`). At the end the parent takes `finalQuaternions[id]`, the raw
  physics pose, and the mesh keeps the swap.
- **Struck bystanders**, tracked but in neither group, replay their buffers.
- **Replay:** `updateThrowPlayback(neededSteps)` advances `iteration` by
  `floor(time_diff / framerate) * speed` per rendered frame and copies frame `iteration` into
  each parent's position and quaternion. Dice spawn when `iteration` reaches their
  `startAtIteration`. There is **no interpolation** between frames; see ROADMAP M2.
- `detectedCollides` becomes sound cues played when the replay reaches that frame
  (`SoundManager.generateCollisionSounds`).

### Determinism: what the network needs

Nobody shares physics state. For a normal roll each client receives the roll (chat message, or a
socket `show`/`animateRoll` payload), builds its own spawn vectors with `Math.random()` in
`ThrowEngine.getVectors`, and simulates locally. The face swap makes every client show Foundry's
result, so trajectories differ between clients and always have. Persistent-dice throws send
`velocityPct` and the forced results (`persistent-throw`), and each client re-simulates against
its own board size. Settled persistent positions are never synced afterwards: they diverge
already with cannon-es.

**Rapier's `enhanced-determinism` build is not required.** Nothing compares simulations across
machines. Same-machine reproducibility is not needed either, because inputs are random. The
standard `@dimforge/rapier3d-compat` package is used.

## Rapier backend

`module/web-workers/rapier/RapierPhysicsEngine.js` implements the contract above. The worker entry
(`RapierPhysicsWorker.js`) awaits `RAPIER.init()` and queues calls in order until it resolves. It is
bundled separately (`dist/workers/rapier-physics-worker.js`, 4.4 MB, because rapier3d-compat
inlines its wasm as base64) and is fetched only when the setting selects Rapier, so cannon users
download nothing extra.

Mapping and deliberate differences:

- **Colliders** are convex hulls of exactly the vertices the cannon worker receives, scaled by
  `radius`. This includes custom `addDiceShape` shapes. The d2 is the same octagonal prism cannon
  builds. Face normals reproduce cannon's formula, so face reading matches cannon on every shape,
  including custom ones (`tests/shapeGeometry.test.mjs`: 500 random orientations per shape).
- **Desk and walls are thick boxes**, not `HalfSpace`. With Rapier 0.21.0, a hull vertex that
  crossed a half-space within one step stayed inside it: a d12 came to rest with one vertex 12.6 mm
  below the desk, and the d2 hull sank 11 mm while lying still. Boxes show neither problem.
- **Sleep.** Rapier's sleep thresholds are not exposed to JS, and its time-to-sleep is 2 s. The
  worker declares a die *settled* after 0.25 s below 0.02 m/s and 0.35 rad/s. That is what
  `simulateThrow` and `playStep` test where cannon tests `sleepState`. It never forces
  `body.sleep()`: putting one die of an awake contact island to sleep makes Rapier integrate it
  without contacts, and it falls through the desk.
- **Spin friction**, which Rapier does not model: a slow die loses its spin about the vertical
  axis at 8/s. Without it a coin or a flat d6 could spin in place until the 1000-frame cap.
- **Materials.** Rapier has per-collider coefficients with a combine rule, not cannon's
  per-pair contact materials. cannon's friction 0.01 relies on its own friction model; in Rapier
  dice would slide forever. The current values (`DEFAULT_TUNING`) are a first fit and are the
  main lever for "feel" in M2.
- **Grab** is a spherical impulse joint to a kinematic anchor (cannon: `PointToPointConstraint`
  to a mass-0 body). The anchor moves through `setNextKinematicTranslation`, so a held die is
  pulled rather than teleported.
- **`worldAsleep`** really becomes true when every die is settled. cannon's desk never sleeps,
  so with cannon `playStep` never reported asleep.
- Collision sounds use the die's speed *before* the step, as cannon's narrowphase event does,
  with the same thresholds converted to m/s.

Benchmark: [docs/fork/PHYSICS_BENCH.md](./docs/fork/PHYSICS_BENCH.md).

Reference mock: [docs/mocks/drama3d.html](./docs/mocks/drama3d.html). It is a standalone page
(three.js r184 and Rapier 0.21 from jsDelivr), made for the parked "Moments of drama" ideas
(ROADMAP, Later). It is also a compact working example of what this backend and M2 build toward:

- **Simulate, then replay**: the whole throw is run in Rapier before anything is shown, then
  played back. That is the same model as `simulateThrow` and `updateThrowPlayback`.
- **Box colliders** for the tray floor and walls, which agrees with the half-space finding above.
- **Interpolated playback**: recorded at 120 Hz, sampled with lerp and slerp per display frame.
  That is the M2 replay interpolation, in about ten lines (`sample()`).
- **Face remapping** by swapping labels on the atlas, so the face Rapier landed up shows the
  wanted result. DSN instead rotates the mesh inside its parent (`swapDiceFace`). Both show
  Foundry's result; ours keeps the textures fixed, so keep DSN's approach.
- **Contact-force events** (`CONTACT_FORCE_EVENTS` with a threshold, merged within 8 steps) give
  each impact a strength, which drives the dust. This is a better input for M4's impact particles
  than the collision-start events the worker uses for sounds.
- Its own settle rule (a run of slow frames), not `body.sleep()`, like this worker.

It is a single die in its own world with its own scale, gravity and materials. Its numbers are
not DSN's tuning; use it for technique, not parameters.

**Not yet verified in a running Foundry:** rendering of the replay, grab-and-throw of persistent
dice with the joint, the settings UI entry, the fallback notice, and the worker URL under a route
prefix. All of it is exercised in Node through the real worker code and message protocol, but not
in a browser.
