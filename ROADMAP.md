# GLUniverse Dice roadmap

Each milestone follows the fork rule in [FORK.md](./FORK.md): new files plus the smallest hook
into upstream, and every touched upstream file listed there. "Seams" below are the upstream
places a feature has to hook into. Line numbers are as of DSN 6.4.5.

Order: **M0 fork hygiene ✔ → M1 Rapier ✔ (experimental) → M2 smoothness → M3 materials →
M4 glow + particles → M5 grab and roll → M6 showcase → M7 stream client → M8 Daggerheart →
M9 dice that connect to the suite → M10 rolling together → M11 dice forge.**
M11 depends only on M3 and M4, so it can move up to right after M4 if it is wanted sooner. Ideas
still being decided are under [Under review](#under-review), and deferred ones under [Later](#later).
This is the suggested order, with two adjustments the code argues for:

- A **compatibility smoke test** with `gluniverse-daggerheart` and the Stream Client moves into M2.
  The rename (M0) is the biggest compatibility risk and is cheap to check early. Waiting until M8
  would hide a broken `diceSoNiceRollComplete` wait for six milestones.
- **M6 (showcase) must be designed with M7's roll area in mind.** "Centre of the screen" on a
  stream capture is the roll area, not the window. Design the showcase's target rectangle as an
  input, so M7 only supplies it.

---

## M1 Rapier physics: done, behind a setting

Delivered: the Rapier worker answers the full cannon contract, with a world setting and
automatic fallback, contract and shape-parity tests, and a benchmark
([docs/fork/PHYSICS_BENCH.md](./docs/fork/PHYSICS_BENCH.md)).
Open items, carried into M2: coins can roll on their edge until the 1000-frame cap (6 of 200
throws); tune feel in Foundry; verify grab-and-throw in a browser; decide the default engine.

## M2 Smoothness

Goal: dice move at the display's refresh rate, no first-roll hitch, no idle cost.

| Item | Seam | Notes |
|---|---|---|
| Interpolated replay | `ThrowEngine.updateThrowPlayback` (copies frame `iteration` verbatim), `DiceBox.animateThrow` (`neededSteps = floor(time_diff/framerate)`; renders only when a whole step elapsed, `last_time += neededSteps*framerate`) | Keep the 60 Hz sim; render every display frame, lerp positions and slerp quaternions between frame `i` and `i+1` with `alpha = remainder/framerate`. On 120/144 Hz screens dice now update at 60 Hz with uneven cadence. Put it in a new `glu/ReplayInterpolator.js`, hooked from `updateThrowPlayback`. Make sure `swapDiceFace` stays on the child mesh and interpolation stays on the parent. |
| Interpolated live dice | `DiceBox.animateThrow` → `playStep` result applied when the promise resolves (one frame late, at worker cadence) | Keep two worker snapshots and interpolate the same way. This matters for held and persistent dice. |
| Fixed timestep audit | `playStep` accumulator (both workers), `speed` multiplier in `updateThrowPlayback` | `speed > 1` skips frames, so interpolation must use the effective step. |
| Shader prewarm | `DiceFactory.create` builds materials lazily; `DiceScene` render | After presets and colorsets load (`diceSoNiceReady`), build one hidden mesh per (material type × system) in use and call `renderer.compileAsync(scene, camera)`. three r184 has `compileAsync`. Measure the first-throw hitch before and after. |
| Idle loop | `DiceBox` adds `animateThrow` to `canvas.app.ticker` and removes it when nothing moves; with Rapier, `worldAsleep` really becomes true | Stop calling `playStep` and rendering when everything is asleep and no SFX run. cannon-es never reported asleep, because its desk body never sleeps. |
| Rapier feel and coins | `DEFAULT_TUNING` in `RapierPhysicsEngine.js`; `tools/physics-bench` | Fix the d2 edge-rolling case, tune friction, restitution and settle time side by side with cannon in Foundry, then decide whether Rapier becomes the default. |
| Compatibility smoke | `gluniverse-daggerheart` `src/module/dice/dsn.ts` (`diceSoNiceReady`, `diceSoNiceMessagePreProcess`, `diceSoNiceRollComplete`); `gluniverse-foundry-modules` `stream/dice-wait.js`, `spotlight-roll/dsn-host.mjs` (`game.modules.get("dice-so-nice")`, `getFlag("dice-so-nice","settings")`, version major ≥ 6) | Roll duality dice and a plain roll, and confirm the chat plate waits, colorsets and roles apply, and Spotlight Roll still enables. This is the first check in a running Foundry. |

Risks: interpolation across the face-swap frame (the swap is applied once to the child, so it
is safe), and across a die's spawn frame (do not interpolate from the hidden origin).

## M3 Materials, shaders, textures

| Item | Seam |
|---|---|
| Material pipeline | `DiceFactory.createMaterial`, `initializeMaterials`, `generateMaterialData`; `ShaderUtils.applyDiceSoNiceShader` (`onBeforeCompile`); `DiceSystem.processMaterial` (system hook, used by Daggerheart's frosted dice); `diceSoNiceOnMaterialReady` |
| PBR maps | `module/textures/pbr-maps.json` atlas (normal and roughness per material); `material_options` |
| Environment | `DiceScene` PMREM + `AMBIANCE_LIST` HDRIs; post-processing in `DiceBox.setupPostProcessing` |

Plan: add new material types and shader chunks in `glu/materials/`, registered alongside
upstream's, and keep every existing material id rendering as it does today. Third-party presets
and colorsets reference them. Systems patch materials through `processMaterial` and
`diceSoNiceOnMaterialReady`, so keep calling both.
Risks: shader cost on low-end GPUs (measure against the existing quality settings), program
cache keys (`customProgramCacheKey`), and the M2 prewarm needing to know the new variants.

## M4 Face glow on settle; particles on impact and settle

| Item | Seam |
|---|---|
| "The dice settled" moment | `DiceBox.animateThrow` → `throwEngine.throwFinished()` → `fireResultEvents()` (`DiceSystem.DICE_EVENT_TYPE.RESULT` per die) |
| Which face shows the result | after `swapDiceFace` the rolled value is on the face `faceValues[id]` points at. Store the world-space face normal or index in the worker result, or recompute it from `DiceShapeLibrary` + the final quaternion. |
| Glow | labels are drawn into per-die canvas textures with optional emissive maps (`_d4Sources.emissiveMaps`, `glowingInDarkness`). Add a per-face emissive mask uniform rather than re-drawing atlases. Bloom exists in `setupPostProcessing`. |
| Impact particles | `detectedCollides` (per-frame sound cues) is the impact timeline, but it has **no contact position**. Extend both workers to append the position as a 5th tuple element. `SoundManager.generateCollisionSounds` destructures only the first four, so it stays compatible. |
| Particle engine | Proton (`module/libs/three.proton.js`) as used by `sfx/PlayAnimationParticle*.js` and `DiceSFX`; render through `DiceSFXManager.renderSFX` |

Risks: changing the worker tuple is a contract change that both workers must make. Particle
budget with many dice: pool emitters.

## M5 Grab and roll

Extend DSN's interactive throws; don't rebuild them. Docs:
`docs/src/content/docs/api/interactive-throws.md`.

| Item | Seam |
|---|---|
| Hold the roll | `PendingThrowManager` (pending registry, slot model, `dice-so-nice.interactive` flag, chat progress card, "Just roll it", GM force-resolve, disconnect handling) |
| Dice "in hand" | Guest dice: `PersistentDice.spawn(..., { guest: { pendingId, reservedForUserId } })`; `SpawnLayout` |
| Grab and flick | `InputHandler` (constraints, pre-roll wobble `updatePreRoll`, release velocity), `PersistentDiceManager.buildImpulseMap`, `ThrowEngine.startUnifiedBatch(persistentThrowData)` |
| Click to throw | new: a click on the hand cluster calls the same release path with a generated velocity |
| Remote viewers | socket `persistent-pickup/move/release/throw`; remotes re-simulate from `velocityPct` |

What is new: dice that gather in a visible "hand" group for every roll (not only for persistent
dice), and click-to-throw. Risks: completion timing for integrations (`diceSoNiceRollComplete`,
`waitFor3DAnimationByMessageID`); the Stream Client and Daggerheart wait on these. The hand must
also time out for AFK players (`PendingThrowManager` already has the end conditions).

## M6 Result showcase

| Item | Seam |
|---|---|
| When | after M4's settle moment, per throw; `AnimationQueue` serialises throws per message |
| Multiple rollers | `ThrowPipeline` queues by message and user; `ThrowEngine.startUnifiedBatch` merges simultaneous throws into one simulation; dice of different rollers carry `userData`/`options` (owner, message) |
| Move dice | after the replay ends, dice are static (`dead`) and their parents are free to animate. Tween parent transforms toward a layout in front of the camera; scaling the parent keeps the swap. |
| Layout target | an input rectangle (window by default, roll area in M7), grouped by roller and message |
| Returning | fade out or dismiss through the existing paths (`fadingDice`, `dismissEphemeralDice` keybinding) |

New file `glu/ResultShowcase.js`. Risks: persistent dice must **not** be moved (their pose is
state), and a showcase in progress when the next throw starts.

## M7 Stream client roll area

Findings so far:

- `ThrowPipeline.renderRolls` skips 3D dice when `game.view == "stream"` unless `0streamutils` or
  `obs-utils` is active. The GLUniverse Stream Client is a normal *game* view login (dedicated
  user, UI hidden), so that branch does not apply to it.
- `RollableAreaConfig` (`ui/RollableAreaConfig.js`, setting `rollable-area`) already defines a
  per-client roll area, and `DiceScene`/`DiceBox` take margins (`containerMargin`), which feed
  the physics walls (`updateBarriers`).
- The Stream Client waits on `game.dice3d.waitFor3DAnimationByMessageID` or
  `diceSoNiceRollComplete` (`stream/dice-wait.js`).

Plan: a small API (`game.dice3d` addition in a new file, documented) to get, set and preview the
roll area from another module. The Stream Control Room then shows and edits it visibly on the
capture client. Feed the area to M6's showcase. Risks: the capture client's canvas size versus
the configured area; remote clients simulate against their own board size (FORK.md
determinism), which is fine.

## M8 Daggerheart pass

`gluniverse-daggerheart` `src/module/dice/dsn.ts` registers colorsets (Hope gold / Fear violet,
frosted; advantage d6s velvet), textures, roles, and a material hook (`diceSoNiceOnMaterialReady`,
shader-applied inner glow). It skips through `diceSoNiceMessagePreProcess` and posts its chat plate
after `diceSoNiceRollComplete`.

Plan: duality-aware showcase (Hope vs Fear side by side, the higher one emphasised), face glow in
the die's own hue, and a check that M3's materials keep `frosted`/`velvet` and the system's
shader hook working. Most of this belongs in the system repository, using hooks this module
exposes; this module only adds the hooks.

## M9 Dice that connect to the rest of the suite

Three effects that carry a settled die beyond the tray. They share one **generic, documented
API**, so nothing in this module knows about Hope, Fear or a particular card: a system or module
describes, per message, what should happen to which die after it settles. Sketch, in a new
`glu/SettleChoreography.js`, exposed on `game.dice3d` next to the existing API:

```js
// called by a system for a message it is about to post (or from a hook carrying the messageId)
game.dice3d.choreograph(messageId, [
  { die: { roll: 0, term: 0, index: 0 }, action: "flare" },
  { die: { roll: 0, term: 1, index: 0 }, action: "dim" },
  { die: { roll: 0, term: 0, index: 0 }, action: "flyLight", target: () => el, color: "#e8b54a" },
  { die: "all", action: "flyToSlot", target: (die) => cardEl.querySelector(`[data-die="${die.ref}"]`) }
]);
```

Die references use roll, term and result indices, so they survive the `buildRollList` flattening
(`ThrowPipeline`) and match what systems already know. Targets are callbacks resolved at flight
time, because the chat card does not exist until DSN reveals the message.

| Part | What | Seams | Depends on |
|---|---|---|---|
| **Hope/Fear clash** | after a duality roll settles, the winner flares and the loser dims; the winner's light flies to the GM's Fear strip (one Fear pip) or the roller's Hope gems; on a tie (critical) both burst | M4's settle moment (`throwFinished` → `fireResultEvents`); M4's per-face emissive uniform for flare and dim; a screen-space flight layer: project the die's world position through `DiceScene.camera` to client coordinates, then animate a light sprite to the target element's `getBoundingClientRect()` in a DOM or canvas layer **above** both the dice canvas and Foundry's UI. Daggerheart side, in its own repo: `src/module/fear-hud.ts` (pip diffing; `design/ember.js` ember layer for the arrival burst) and `src/module/bottom-hud.ts` (`.bh-hope .gems`, `ui/gem.js` `setPool`) | M4 (glow), M6 (settle timing per message) |
| **Dice fly into the card** | after settling, dice shrink and fly into their slot on the chat card, or on the Stream Client's roll card | `ThrowPipeline._revealMessage` / `renderRolls` (the card appears only after the animation); `diceSoNiceRollComplete`; the flight layer above. Slots: Daggerheart's plate renders `<i class="die …">` (`src/module/dice/plate.ts`) and needs a per-die `data-` attribute; the Stream Client cards live in `gluniverse-foundry-modules` `scripts/features/stream-cards/cards/` | M6 (showcase ends where the flight starts) and M7 (stream card target) |
| **Roller's portrait behind the showcase** | the face-framed portrait of whoever rolled sits behind M6's grouped dice | the face locator is the suite's (`gluniverse-foundry-modules` `scripts/core/face-frame.mjs`: `frameImage(img, frame)`, world cache `core.faceFrameCache`, analysis by the GM client). This module must not import it: M6 exposes a **backdrop slot** (`game.dice3d` hook or callback returning an element or image for `{ userId, speaker, messageId }`), and the suite fills it | M6, M7 |

**Completion timing.** `diceSoNiceRollComplete` and `waitFor3DAnimationByMessageID` keep meaning
"the dice have landed and the message is revealed". The flights run *after* that and are not
waited on. Daggerheart's plate and the Stream Client's dice wait must not get slower. The
flight to a card slot starts when the slot exists, so it is the one effect that has to follow the
reveal.

Risks: the flight layer's z-order against Foundry's UI and the Stream Client's hidden-UI mode;
a target that is missing or off-screen (skip the flight, never block); hidden and blind dice must
never fly to a visible element (see M10's GM screen); persistent dice stay put (their pose is
state); reduced-motion users get the end state without the flight. Many dice in one message need
a budget: one light per die at most, and a stagger.

## M10 Rolling together

Builds on M5's hand. Throws stay cosmetic: every result is a Foundry `Roll` evaluated by its
owner, and the throw only shows it, as in `PendingThrowManager` today.

### Shared in-hand state

M5's hand is local, and DSN's guest dice (`PersistentDice.spawn(..., { guest })`, the
`persistent-*` socket messages, `PendingThrowManager`) already model dice reserved for a user.
M10 makes the hand a **shared object**: `hand-open { handId, ownerUserId, messageId, accepts }`,
`hand-add { handId, helperUserId, dieType, appearance, forcedResult }`, `hand-remove`,
`hand-release { handId, velocityPct }`, `hand-close`, on the module socket (renamed
`module.gluniverse-dice` at build). Rules:

- **Ownership:** the hand belongs to its roller; each die keeps `userData.ownerUserId` (already set
  by `PersistentDiceManager`), so it renders in its owner's appearance (`DsnSettings.APPEARANCE`).
- **Who releases:** only the hand's owner. A helper only adds.
- **Disconnects and timeouts:** reuse DSN's existing end conditions (`userConnected` cleanup in
  `main.js` and `PersistentDice`; roller reload; "Just roll it"; GM force-resolve). A helper who
  leaves before release takes their die out; a hand left open past a timeout throws itself.
- **Late joiners** get the current hand state from the owner on connect.

### Help an Ally

Another player tosses one of their own dice into the held hand. It joins the throw in the
helper's colours and appearance, and the helper is credited on the result.

- **System API**, not Daggerheart code: when the system opens the roll it says what the hand
  accepts and what a contribution means, e.g.
  `game.dice3d.hands.accept(messageId, { label, dice: ["1d6"], max: 1, onContribute: async ({ helper, roll }) => … })`.
  The helper's client evaluates the `Roll` (the helper owns it), and the system merges it into
  its own message: for Daggerheart, `rolls.ts` adds it as an advantage d6 and the plate's crossed-off
  advantage dice already draw the rest. This module only carries the die, its forced result and
  the credit (`helperUserId`) through to `diceSoNiceRollComplete` context.
- Seams: `PendingThrowManager` (slot model; a helper die is an extra slot), `InputHandler` (a
  helper's grab-and-toss aims at the hand), `SpawnLayout` (hand cluster), `ThrowEngine.startUnifiedBatch`
  (`persistentThrowData` with dice of two owners and `forcedByMesh`).

### Tag-team throws

Two players release together and their dice collide in one tray.

- One message from the system says the rolls are combined (Daggerheart: a tag-team roll is a
  combined roll; again via `hands.accept`/a `combine` option, so it is system-defined).
- **Release sync:** the first `hand-release` opens a short window (about 1.5 s). If the partner
  releases inside it, the coordinator, which is the first releaser's client, sends one
  `tag-release { hands:[…], velocities:[…] }`, and every client simulates both throws in
  **one** `simulateThrow`. The unified batch already merges several throws into one simulation.
  Otherwise each throws alone.
- Each client simulates locally, so the collision looks different per client (FORK.md
  "Determinism"). That is fine because results are forced.

### GM screen

Secret and blind GM dice fall behind a 3D screen. Players see shadows and hear the clatter, and
never see the faces.

- Seams: `RollRules.visibility` (`ghost`, `secret`, `hide3dDiceOnSecretRolls`, `showGhostDice`),
  `ThrowPipeline.renderRolls` / `showForRoll` / `show`, `DiceNotation` (`options.ghost`;
  `DiceFactory.create` already falls back to the standard die for ghost rolls), `DiceScene` (a
  screen mesh that casts shadows, at the tray edge from M7's roll area).
- **Strictness is the whole feature, and today's paths leak.** The `show` socket message carries
  the notation *with results* to every client, and the `users` filter is applied by the
  *receiver* (`Dice3D` socket handler). A player's client therefore receives values it is not
  meant to show. The GM screen must send players a **cosmetic payload without values**: die
  types and appearance only, and faces chosen locally by the receiving client (the screen hides
  them anyway). Values go only to clients that may see them.
- **To verify in a running Foundry first:** whether a player's client receives the roll data of
  a blind or whispered `ChatMessage` from core at all. If it does, that leak is Foundry's and not
  ours to fix. Document it, and make sure this module adds no second one.
- Sounds: collision cues come from the local simulation, so no values are needed.

Risks: socket ordering and races (a helper adding while the owner releases: the owner's
release is authoritative; a late `hand-add` is refused with a notice); the existing
`persistent-pickup` grab tiebreak shows the pattern. Completion timing: the hand stays open
until release, so integrations wait on `diceSoNiceRollComplete` as they do for interactive
throws today. Stream Client: the capture user sees the hand and the GM screen like any player.

## M11 Dice forge

An in-game dice designer with a live 3D preview: material, engraving depth, inlay glow and its
colour, and numeral font, including any Google Font. Saved designs are **ordinary DSN colorsets or
appearances**, so roles, presets, `term.options.colorset`, systems and the dice library all keep
working.

Map it onto what DSN already has, rather than a parallel tool:

| Need | Existing DSN piece |
|---|---|
| Per-user appearance editing (system, colorset, texture, material, font, label/dice/outline/edge colours) | `ui/DiceConfig.js` (appearance tabs, `Utils.prepareFontList()`), `settings/DsnSettings.js` |
| Face-by-face custom dice with a live 3D preview | `ui/DiceEditor.js` + `rendering/DiceEditorPreview.js` (template `dice-editor.hbs`) |
| Saved designs | `engine/DiceLibrary.js` (user flag `dice-so-nice.diceLibrary`), `ui/DiceLibraryDialog.js`; `DiceColors` colorsets (`addColorset`) |
| Fonts | `CONFIG.fontDefinitions`. The user's **gluniverse-google-font** module (`github.com/patcharapon-j/gluniverse-google-font`) adds any Google Font to `CONFIG.fontDefinitions` with its `@font-face` data, so DSN's font list offers it (`Utils.prepareFontList` reads `FontConfig.getAvailableFontChoices()`). On `diceSoNiceReady` it sets `preset.font` for presets without one, and it gates on `game.modules.get("dice-so-nice")?.active`, which the M0 shim satisfies. |

New, mostly M3 and M4 shader parameters exposed as fields: **engraving depth** (bump or normal
strength per label: `normalMapStrength`, label bump maps in `generateMaterialData`), **inlay glow
and colour** (M4's per-face emissive uniform; `glowingInDarkness`), and the material from M3.
Where a field has no colorset equivalent, store it in the appearance as a namespaced extension
key that upstream ignores, and document it, so a saved design still loads (minus that field) in
plain DSN.

Risks: the font must be loaded before label textures render (fonts load asynchronously:
`DiceFactory.fontLoadingPromises`); preview cost; a design that uses a Google Font on a client
without the font module installed must fall back cleanly.

---

## Under review

Not milestones yet. The user is reviewing a mock.

**Moments of drama:** the clutch cam (slow-motion and a push-in on the deciding die),
per-system crit and fumble reactions, instant replay from a second camera, and auto-saved highlight
clips. Notes for the clutch cam, if approved:

- Feasible because a throw is simulated before playback: from the returned buffers we know which
  die settles last and at which frame, before anything is shown.
- Slow-motion is a playback-rate curve over `updateThrowPlayback`'s `iteration` (it pairs with
  M2's interpolation); the push-in is a `DiceScene.camera` move, eased back afterwards.
- Which die decides comes from the system: a hook or `game.dice3d` call marking deciding dice and
  how close the outcome is (Daggerheart: the Hope/Fear pair, strongest on a near tie; d20
  systems: the d20 against a known Difficulty).
- Reduced-motion users get none of it.
- Completion timing: proposed that the slow-motion **counts** toward the animation that
  `diceSoNiceRollComplete` waits on, because the outcome is not shown until the die lands, with a
  hard cap of about +1.5 s. The Stream Client races `waitFor3DAnimationByMessageID` against 10 s
  and its hook fallback times out at 5 s (`stream/dice-wait.js`), so the cap has to keep a long
  throw under both.

## Later

Personal dice beyond the forge: **a dice bag with history**, **dice jail**, and **wear**.

---

## Cross-cutting risks

- **Contract drift:** any upstream change to `PhysicsWorker.js` must be mirrored in the Rapier
  worker (FORK.md rebase step 3).
- **Upstream merge requests:** keep `module/web-workers/rapier/` free of GLUniverse imports so it
  can go upstream as one MR (it only needs `DiceShapeLibrary` definitions and the contract).
- **Assets:** shipped as-is; permission is pending with the owners (CREDITS.md). Not a blocker.
