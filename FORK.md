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
| 2026-11-07 | Daggerheart pass (M8): dice can be tagged and emphasised (`term.options.gluDice`, hook `gluDiceSettle`, `api.presentation`); the result-number glow cools to the die's own colour (client setting `glowHue`); the M4 number mask is a copy of the emissive canvas, so a system's `diceSoNiceOnMaterialReady` art no longer glows as the number. See [Daggerheart pass](#daggerheart-pass-m8). |
| 2026-11-07 | Grab and roll (M5): an interactive roll waits in the roller's hand, a local floating cluster at the pointer; click, flick or shake throws it; other clients see nothing until the throw, and DSN's pending card is not used. See [Grab and roll](#grab-and-roll-m5). |
| 2026-11-07 | Glow and particles (M4): sparks on impacts, the result number lights up (forged: ignites, flashes, cools) and stays lit. Worker contract: `detectedCollides` entries gain a 5th element, the contact position. See [Glow and particles](#glow-and-particles-m4). |
| 2026-11-07 | Materials (M3): gemstone, inner galaxy and pearlescent materials; "Enhanced materials" client setting for the built-in ones; Nice more Dice 1.4.2 (CC BY 4.0, LyncsCwtsh) bundled. See [Materials](#materials-m3). |
| 2026-11-07 | Smoothness (M2): interpolated replay and live dice, real frame delta for live stepping, idle frames skipped, shader prewarm at load, cannon's `worldAsleep` fixed, Rapier coin settle and topple. See [Smoothness](#smoothness-m2). |

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
| `README.md` | Fork section at the top; Rapier and the bundled Nice more Dice added to "Built on" | AGPL notice and credits. Everything upstream wrote is kept. |
| `.gitignore` | `tools/physics-bench/.build/` | Benchmark scratch bundles. |
| `module/rendering/DiceBox.js` | One import (`glu/Smoothness.js`); in `animateThrow`: a `gluMoved` local, a `smoothFrame` call while a throw replays, the live `playStep` payload from `livePlayStepPayload`, a `noteLiveResult` call in its `.then`, and the render condition wrapped in `shouldRender` | Replay and live interpolation, render every moving frame, skip idle ones. |
| `module/web-workers/PhysicsWorker.js` | `playStep` takes `frame_dt` and `interpolate` (returns `interpolatedPosition`/`Quaternion`); its `worldAsleep` test skips static bodies; `setBodyPosition(s)` also reset `previousPosition`/`interpolatedPosition` | Contract change shared with the Rapier worker. Without the static-body skip the desk kept cannon awake forever. |
| `module/engine/ThrowEngine.js` (M4) | One import; `noteSimulation(this, detectedCollides)` after the sound list replaces the raw collisions | Keeps the impact timeline with positions for the particles. |
| `module/main.js` (M5) | One import; in `preCreateChatMessage`, `if (holdInHand(message)) return;` after DSN's interactive check; in `createChatMessage`, `if (interceptHeld(chatMessage, rolls)) return;` before the pending-throw branch | Holds an interactive roll in the hand instead of DSN's pending throw, on every client. |
| `module/engine/ThrowEngine.js` (M5) | One more import; `applyHandThrow(this, notation)` after `getVectors` in `startUnifiedBatch`; `seekHandReplay(this)` after `this.iteration = 0` | A throw from the hand starts from the hand's pose with the throw's velocity and spin, and the replay picks up where the flying hand is. |
| `module/throw/AnimationQueue.js` (M5) | One import; `enqueue` passes `{ immediate }` to `addItem`, true for a throw from the hand when the queue is idle | Skips the 400 ms wait for simultaneous rolls, as DSN already does for persistent throws. |
| `module/web-workers/PhysicsWorker.js` (M4) | `handleDiceCollision` / `handleTableCollision` append the contact position as the 5th tuple element | Contract change shared with the Rapier worker. |
| `module/engine/DiceFactory.js` (M3) | One more import; `extendMaterialOptions(this)` at the end of `initializeMaterials`; `decorateMaterial(this, mat, materialData, canvasBump)` right after `mat.onBeforeCompile` is set in `createMaterial` | New material ids and the enhanced variants. Runs before `diceSoNiceOnMaterialReady`, so systems still patch the result. |
| `module/ui/DiceConfig.js`, `module/ui/DiceEditor.js` | One import each; `...gluMaterialChoices()` appended to the material picker list | Show the new materials. |
| `module/Dice3D.js` | One import; `prewarmBoard(this)` after `persistent.restoreAll()` at the end of the load chain | Shader prewarm once fonts, presets and the dice library are loaded. |
| `docs/astro.config.mjs` (M8) | One sidebar entry, "Tags and Emphasis" (`api/dice-presentation`), under Dice Systems | The page for the M8 API. |
| `module/Dice3D.js` (M5) | One more import; in `_afterShow`'s hide timer, `if (burnAwayDice(this)) return;` first, and the delay wrapped in `hideDelayMs(…)` | The dice burn away instead of DSN's fade, after the world linger time. |

Files that are entirely ours: `FORK.md`, `ROADMAP.md`, `CREDITS.md`, `CLAUDE.md`, `module/glu/*`,
`module/textures/glu/*` (bundled third-party assets, CREDITS.md),
`module/lang/glu-en.json`, `module/web-workers/RapierPhysicsWorker.js`,
`module/web-workers/rapier/*`, `tools/*`, `tests/*`, `docs/fork/*`, `docs/mocks/*`,
`docs/src/content/docs/api/dice-presentation.md`.
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
| `playStep` | `{ time_diff, frame_dt?, interpolate? }` in seconds; fixed 1/60 s steps with an accumulator, at most 10 per call; ignored while a throw is simulating. `frame_dt`, when given, is the real time since the previous call and is used instead of `time_diff` (see below). `interpolate: true` returns each pose blended between the last two fixed steps by the leftover time; a teleport (`setBodyPosition(s)`) is never blended | `{ ids, quaternionsBuffers: ArrayBuffer, positionsBuffers: ArrayBuffer, worldAsleep }`: flat Float32 arrays, 4 resp. 3 floats per id, dead dice excluded; `ids` empty when `worldAsleep`. `worldAsleep` ignores static bodies | `DiceBox.animateThrow`, every frame while no replay is playing |
| `simulateThrow` (M4 note) | `detectedCollides[i]` is `[source, type, material, strength, [x, y, z]]`: the 5th element (meters) is the midpoint of the two dice for `"dice"`, the die's centre for `"table"`. `SoundManager.generateCollisionSounds` reads the first four only | | |
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

## Smoothness (M2)

`module/glu/Smoothness.js`, `ReplayInterpolator.js`, `ShaderPrewarm.js`.

- **Replay.** Upstream copies whole 60 Hz frames into the dice and renders only on frames where a
  whole step elapsed. While a throw replays, `smoothFrame` blends each die's parent group
  between recorded frames `i` and `i+1` by the leftover time, scaled by `ThrowEngine.speed`,
  every display frame. It skips constrained dice, dice dead before frame `i`, dice not yet
  spawned (`startAtIteration > i`) and zeroed frames, and stops once `iteration` reaches
  `iterationsNeeded`, where upstream has placed the final frame. `swapDiceFace` rotates the
  child mesh, so the forced result is untouched.
- **Live dice.** Upstream passes `time_diff`, the time since the last *whole* step, on every
  frame. That counts the leftover of earlier frames again each frame, so both workers'
  accumulators over-advanced on displays faster than 60 Hz (held and persistent dice ran fast).
  `livePlayStepPayload` adds `frame_dt`, the real time since the previous live call (capped at
  0.25 s), and `interpolate: true`. `time_diff` is still sent. The pre-roll wobble
  (`InputHandler.updatePreRoll`, `updateRemoteAnimations`) still gets upstream's `time_diff`
  and so still spins faster at high refresh rates: not changed.
- **Idle frames.** With interactivity or persistent dice on, upstream renders every frame forever.
  `shouldRender` keeps upstream's condition and skips the frame when the board is idle: no
  replay, the worker has reported `worldAsleep` for 250 ms, no pointer, wheel, key or resize
  event for 750 ms, no SFX, fading or animated dice, and no persistent die that is held,
  replaying, or moved by another player. Client setting `gluniverse-dice.idleRenderSkip`
  (default on) turns it off.
- **Shader prewarm.** At the end of `Dice3D.init`'s load chain, the current user's d4 to d20 are
  built once through `DiceFactory.create` (so the materials land in the factory caches), added
  1 km below the desk, compiled with `renderer.compileAsync`, and removed. Shadow-depth programs
  are not covered; they still compile on the first shadow render. Client setting
  `gluniverse-dice.shaderPrewarm` (default on). The console logs the time and program count.

**Not yet verified in a running Foundry:** all four. The worker side (frame delta, interpolated
pose, teleports, cannon reporting asleep) is covered by `tests/workerContract.test.mjs`; the
DiceBox side and the prewarm only run in a browser. The first-throw hitch before and after has
not been measured.

## Glow and particles (M4)

`module/glu/fx/DiceFx.js`, driven every frame from `Smoothness.shouldRender`, which also keeps
the board rendering while an effect is alive.

- **Impact sparks.** `noteSimulation` keeps the raw collision timeline (ThrowEngine overwrites
  its own copy with the sound list, which is empty when sounds are off). While a throw replays,
  each frame spawns the impacts of every simulation frame it passed. Dice-on-dice impacts are warm
  sparks, table impacts grey puffs, and the count and speed follow the impact strength. Strength
  0, which marks a secret roll with muted sounds, spawns nothing. A replay that jumps more than
  120 frames (fast-forward) skips its impacts.
- **Result number glow.** When the replay reaches its last frame, the dice in
  `throwEngine.diceList` get an additive overlay on the triangles facing up (the result face, since
  `swapDiceFace` has run). It draws **only the number**, in white: a core plus a soft spill just
  around the glyph, masked by DSN's emissive canvas (black, with the text labels in grey), which
  `decorateMaterial` now keeps on every material as `userData.gluNumberMask`. The bump canvas is
  not usable for this: DSN paints the texture's own bump into it, so on textured dice the whole
  face reads as label. Not on d4 (its result reads from the bottom), and not on image faces that
  have no emissive art.
- **The motion** (`glowEnvelope`, "forged"): the number heats like metal. Light ignites at the
  centre of the digit and a bright front races out through the strokes (0.42 s, cubic
  ease-out) while the intensity climbs to a white-hot flash; a warm rim that cools to white over
  the first second; the flash eases down to a steady glow with a slight breath (to
  1.5 s), then settles (by 2.3 s) to a **resting glow that stays lit** while the dice are on the
  table, at 75% intensity with a tighter spill. A resting glow needs no new frames, so the frame
  loop stops. Dice light in a 60 ms cascade, capped at 180 ms. With `prefers-reduced-motion`: no
  front, heat or flash, only a fade in to the resting glow.
- **Bloom.** The overlay is on layer 1 and carries a white `emissive`, which is what makes DSN run
  its selective bloom pass. In that pass (`globalBloom` = 1) it outputs only a dim core and spill:
  at full strength the bloom swallowed the digit.
- **Log depth.** DSN's renderer uses `logarithmicDepthBuffer`, so both custom shaders include
  three's `logdepthbuf` chunks; without them the overlay failed the depth test against its own die
  and was never drawn.
- **Own frame loop.** DiceBox removes its ticker on the frame the result is in, unless something
  else animates, so upstream draws nothing after it. The first build created the glow on that
  frame at intensity 0 and nothing ever showed (found in a live Foundry). While an effect is
  alive and DiceBox has not ticked for 50 ms, DiceFx runs its own `requestAnimationFrame` loop
  that advances the effects and calls `box.renderScene()`, and stops when they end or the board
  hides.
- **Particles** are one pooled `THREE.Points` (768 particles, additive, no depth write) in the board
  scene, not Proton: one draw call whatever the dice count, and no per-emitter objects.
- Client settings `gluniverse-dice.impactParticles` and `gluniverse-dice.settleGlow`, default on.
  No dice material is modified, so every system, preset and material gets the effects.

Checked: both workers emit the position (contract test); in the maintainer's Foundry v14 world
(Daggerheart system), 1d20 + 2d6 throws: the overlay lands on the top face (one triangle on a d20,
with the label mask), glows, pulses and fades over ~2.4 s, sparks finish their flight, and the
extra loop stops. **Not yet verified**: d10/d12 and custom-model faces, persistent dice, cost
with many dice.

## Grab and roll (M5)

`module/glu/hand/HandOfDice.js`, client setting `gluniverse-dice.grabAndRoll` (default on).

- **Which rolls.** DSN's rule, unchanged: `PendingThrowManager.shouldStampInteractive` (world
  setting, the user's own setting, the `dice-so-nice.interactive` flag, public rolls only). When
  it says yes and the roller's hand setting is on, `holdInHand` stamps
  `flags.gluniverse-dice.hand = { state: "held", session }` instead of DSN's `interactiveThrow`,
  so DSN's pending throw, its guest dice and its chat card never start. `session` is random per
  page load: a user logged in twice holds the hand in the session that rolled only.
- **Holding.** `interceptHeld` runs on every client where DSN would animate the message. The
  message is already marked `_dice3danimating`, so it stays hidden and every completion signal
  (`diceSoNiceRollComplete`, `waitFor3DAnimationByMessageID`) waits, exactly as for a normal roll
  that has not finished.
- **The hand** exists only on the roller's client: the dice the throw will use (DSN's
  `DiceNotation` of the rolls, with term colorsets, roles and the speaker's actor), built through
  `ThrowEngine.createDiceMesh`, in a hex cluster that floats 1.6 die sizes above the table next to
  the pointer (80 px above it, so the clicked button stays free; bottom centre when the pointer has
  not moved for 20 s). No physics bodies, no sockets: nobody else sees it. It bobs and each die
  turns slowly; it has its own frame loop and keeps the board shown.
- **Input.** Our window capture listeners are added when the file loads, before DSN's, so a press
  on the hand stops there. Grabbing lifts the hand to 2.4 die sizes and it follows the pointer.
  On release: a click (under 350 ms, under 8 px) throws towards the board's centre, give or take
  30 degrees; a flick (faster than 0.7 board widths per second over the last 80 ms) throws the way
  it went; three quick reversals (strokes under 300 ms) are a shake and throw hard with more
  tumble; a slow release puts the hand down. Escape throws it. DSN's throwing force setting
  scales all of these.
- **The throw.** The roller sends `{ type: "gluHandThrow", messageId, dice }` on the module
  socket: each die's position (board fraction), height and velocity (in board widths) and its
  spin and orientation. Every client, the roller included, then calls
  `ThrowPipeline.renderRolls` for the message, and `applyHandThrow` replaces the start vectors DSN
  made for that message's dice (clamped inside the walls). Coins keep DSN's flip. The result is
  Foundry's, forced by `swapDiceFace` as always; each client simulates on its own, as DSN does.
- **No pause after the release.** DSN waits 400 ms in `AnimationQueue` to merge simultaneous
  rolls, then simulates the whole throw before the replay starts: measured 470 ms from the
  release, with the dice frozen mid-air. Now a hand throw skips that wait when the queue is idle
  (replay starts 8 to 75 ms after the release), the released dice fly on locally exactly as the
  simulation starts them (same velocity, spin, gravity and damping, until they could reach the
  desk or a wall), and `seekHandReplay` starts the replay at the frame the flight has reached, so
  the dice never jump back. Measured gap at the handoff: 6 to 15 mm, under half a frame of motion.
- **Never stuck.** The roller disconnecting makes the other clients play the roll normally;
  deleting the message drops it; after 10 minutes any client plays it normally.
- Verified in a live Foundry with one client: the hand, click, flick, shake, slow release and
  Escape, results matching the roll, completion, no chat card. **Not yet verified:** a second
  user watching (the socket path), and how it feels at full frame rate (the test window ran at
  9 fps).
- **Weight.** The hand follows the pointer on a damped spring (stiff while held, soft while
  floating), leans into its motion (up to 0.42 rad) and turns to face it. Grabbed, the dice pull
  together from 1.4 to 1.06 die diameters apart, and each one sloshes against the hand's
  acceleration with its own gain, so they jostle like dice in a cupped hand. Lean and slosh are
  off with prefers-reduced-motion.

### Burn away

`module/glu/fx/DiceBurn.js`. World setting `gluniverse-dice.diceLinger` (seconds, 0 to 60,
default 5; 0 keeps each player's DSN "time before hiding"); client setting `burnAway` (default
on; off gives DSN's own hide). Instead of DSN's fade, each die dissolves top of screen to bottom
behind a torn white front (domain-warped noise, no particles, no flame): a hot white core, a
lavender-to-white halo through the selective bloom, the surface just ahead bleached. Dice start
0.28 s apart and take 1.75 s. The shadow dissolves with the die (a `customDepthMaterial` carrying
the same front), and the glowing result number goes out last. Dice leave the throw engine's lists
and the physics world when the burn starts; when all are gone the board is cleared and hidden as
DSN does. Shaders are compiled with `compileAsync` before the swap, so it never hitches. Without
a patched shader the die falls back to an opacity fade; reduced motion shortens it to 0.6x.

### Impact shake

`module/glu/fx/ImpactShake.js`, client setting `impactShake` (default on, off with
prefers-reduced-motion). Each impact of the replayed collision timeline (strength 0.35 or more)
adds strength squared to a sideways camera tremor, table hits more than dice on dice, capped at
0.045 die sizes and settling in about a quarter of a second. A camera move by anything else
becomes the new rest position.

## Daggerheart pass (M8)

`module/glu/fx/DicePresentation.js`, `module/glu/fx/GlowHue.js`; two small changes in
`module/glu/fx/DiceFx.js` and one in `module/glu/materials/GluMaterials.js`. Docs:
[Tags and Emphasis](./docs/src/content/docs/api/dice-presentation.md). Generic, not
Daggerheart-specific: any system can use it, and nothing here imports or names the system.

- **Tags on the term.** `term.options.gluDice = { tag, glow, emphasis }`. Foundry serialises
  `options` with the roll and DSN's `DiceNotation` copies it onto each die (`mesh.options`), so
  every client gets it with no socket. Plain JSON, so it also survives the worker message.
  Without this fork it is an unread property: the system needs no feature check.
- **The settle moment.** DiceFx's settle branch (the frame the replay reaches its last frame) now
  calls `settlePresentation(engine.diceList)` first: one entry per die (tag, glow, emphasis,
  result, type, colorset colours, options, mesh), then `Hooks.callAll("gluDiceSettle", dice,
  { emphasiseHighest })`, so a system can decide there instead; then a plan per die (tint, gain,
  rank). It runs whether the glow setting is on or not. A throwing handler is caught and logged.
- **Emphasis** is the glow's strength: `true` ("lead") ×1.45, `false` ("quiet") ×0.5, unset ×1, a
  new `uGain` uniform on the overlay. DiceBurn's flare scales `uIntensity`, so it multiplies
  through. `emphasiseHighest(dice, tags)` marks the highest of the tagged dice (ties: all).
  `presentationOrder(plan)` is lead, plain, quiet: the input M6 will lay dice out from.
- **Glow hue.** The halo now cools to a `uTint` uniform instead of white; the core keeps a white
  heart (35% tint) so the number stays readable, and the hot phase (warm rim, flash) is unchanged.
  The bloom pass gets a 60% tint. `resolveGlowTint`: the per-die `glow` override wins; otherwise,
  with the client setting `gluniverse-dice.glowHue` = `die` (default), the colorset background,
  then the edge colour; the hue is kept and the HSL lightness lifted into 0.6 to 0.8 (an additive
  glow in a dark colour does not show). Colours with a chroma (max minus min channel) under 0.12
  have no hue to keep and glow white: white, grey, black and pastel-white dice look exactly as in
  M4. `glowHue` = `white` is M4's glow unchanged. `glow: false` turns one die's glow off.
- **The number mask is a copy (fix).** M4 made the mask a `CanvasTexture` of DSN's emissive
  canvas, which is also `mat.emissiveMap.image`. Daggerheart's material hook draws its cut's
  glow art into that canvas, after `decorateMaterial` but before the first upload, so the settle
  glow lit the cut as well as the number. `decorateMaterial` now snapshots the canvas
  (`snapshotCanvas`, falls back to the shared canvas if no copy can be made). One more canvas of
  the atlas size per material (1024² for a d12).
- **Checked against the system's hook** (`tests/systemMaterials.test.mjs`, which repeats what
  `gluniverse-daggerheart` `src/module/dice/dsn.ts` `applyGlow` does): `frosted` and `velvet`
  keep upstream's `onBeforeCompile` (we add no wrapper to them); the system's wrapper chains it
  and its `totalEmissiveRadiance` line lands before `<emissivemap_fragment>`, which every material
  type DSN uses for them includes; galaxy/pearlescent keep their effect under a system wrapper;
  enhanced materials keep the two ids, their maps and `usesTransmissionMask`. The system's
  black `emissive` still keeps DSN's bloom compositor off for those dice.

Tests: `tests/glowHue.test.mjs`, `tests/dicePresentation.test.mjs`,
`tests/systemMaterials.test.mjs` (`tests/foundryStubs.mjs` gives them `Hooks`). **Only a running
Foundry can confirm**: the tinted glow and the emphasis on real dice (the overlay shader was not
compiled outside Foundry this time), the Hope/Fear cut no longer glowing at settle, the setting in
the config dialog, and a duality roll seen from a second client.

## Materials (M3)

`module/glu/materials/GluMaterials.js`, `galaxyShader.js`.

- **New ids**: `gemstone` (transmission, IOR 2.0, dispersion 4, tinted by the background colour
  like DSN's resin; a polished non-transmissive fallback without advanced glass), `galaxy` (dark
  clear shell, a nebula and stars inside, sampled in object space at four depths along the view
  ray, so it has parallax and turns with the die; tinted by the background colour), and
  `pearlescent` (clear coat, thin-film iridescence, sheen, plus a "nacre" pastel hue that shifts
  with the viewing angle). Labels are masked with DSN's own bump canvas (white body, darker
  labels, the same mask advanced glass uses), so they keep their colour. All three have phong
  fallbacks for non-realistic lighting.
- Galaxy and pearlescent wrap upstream's `onBeforeCompile` (`applyDiceSoNiceShader` still runs
  first) and extend `customProgramCacheKey` with `|glu-galaxy` / `|glu-pearl`. A system that
  replaces `onBeforeCompile` in `diceSoNiceOnMaterialReady` drops the inner effect; it does not
  break the material.
- **Enhanced materials** (client setting `gluniverse-dice.enhancedMaterials`, default on, reload):
  plastic gets a clear coat (0.5), wood a varnish (0.25), pristine a sharper coat, velvet a denser
  sheen, glass/resin/frosted chromatic dispersion (with advanced glass), metal and chrome
  `envMapIntensity` 1.25. Off renders every upstream id exactly as Dice So Nice does. Only with
  realistic lighting.
- Not changed: `DiceColors`' random-material list (the `random` colorset still picks from DSN's
  eleven), the material ids themselves, colorsets.
- **Nice more Dice** is bundled (CREDITS.md). `module/glu/vendor/niceMoreDice.js` is the original
  script wrapped in a function, registered on `diceSoNiceReady`, skipped when `nice-more-dice` is
  active. Assets in `module/textures/glu/nice-more-dice/`, copied by the existing `textures` rule.

Checked outside Foundry: every new and enhanced material, in all four lighting/glass
combinations, compiles in headless Chromium (three r184, SwiftShader) with no shader errors, and a
test render shows the three new looks. **Not yet verified in a running Foundry**: the looks on
real dice under DSN's lights and HDRIs, GPU cost on low-end hardware, the pickers, and the
bundled Nice more Dice entries.

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
  dice would slide forever. DSN's legacy gravity is light (about 2.5 m/s²) and friction slows a
  die by μ·g, so the first fit (0.4 everywhere) let dice skid flat across the board, and the d6
  faces came out uneven. Now: desk friction 1.0 with the **Max** combine rule (the desk grips),
  dice 0.3 (die on die stays slippery, fewer dice cocked against each other), restitution desk
  0.5, dice 0.6. Bench, 100 trials, 1920x1080: sliding share of desk travel 66% → 25%, d6 face
  chi² 114 → 8.7 (fair below 11.07), mixed dice cocked >15° 3.4% → 3.0%; 2d20 cocked 0% → 3%;
  throws 0.5 s longer (still shorter than cannon). `npm run bench` reports the sliding share.
- **Grab** is a spherical impulse joint to a kinematic anchor (cannon: `PointToPointConstraint`
  to a mass-0 body). The anchor moves through `setNextKinematicTranslation`, so a held die is
  pulled rather than teleported.
- **`worldAsleep`** really becomes true when every die is settled. cannon's desk never sleeps,
  so with cannon `playStep` never reported asleep, until M2 made its test skip static bodies.
- Collision sounds use the die's speed *before* the step, as cannon's narrowphase event does,
  with the same thresholds converted to m/s.

- **Coins** (M2). A thin hull lying on the desk gets angular kicks from the contact solver every
  few steps, up to about 1.4 rad/s about a horizontal axis at under 1° of tilt. So it never passed
  the angular settle test and 7 of 200 three-coin throws ran to the 1000-frame cap. More angular
  damping, a smaller `lengthUnit`, more PGS iterations and a true cylinder collider all left 6 to
  16 throws capped. A coin within `coinFlatAngle` (0.15 rad) of flat, and slower than
  `coinSlowSpeed`, now settles on the linear test alone: **1 of 200** capped. A coin standing on
  an edge facet past `coinEdgeAngle` for `coinToppleDelay` gets a `coinToppleKick` toward flat, at
  most `coinToppleTries` times, with the direction alternating in case a wall blocks it. That
  halves edge-standing coins (cocked 1.8% to 0.8%).

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
