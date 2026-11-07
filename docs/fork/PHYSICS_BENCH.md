# Physics benchmark: cannon-es vs Rapier (M1)

Produced by `npm run bench -- --trials 200 --json docs/fork/physics-bench-m1.json` on 2026-11-07:
Node v22.21.1, Intel i9-13900K, Rapier 0.21.0, cannon-es (JiDW fork) as locked in `package-lock.json`.
Raw numbers: [physics-bench-m1.json](./physics-bench-m1.json).

## Method

`tools/physics-bench/bench.mjs` bundles **the real worker files** (`module/web-workers/PhysicsWorker.js`,
`module/web-workers/RapierPhysicsWorker.js`) and talks to them in-process through the same
webworker-promise protocol the browser uses (`tools/physics-bench/harness.mjs`). Each trial:

1. builds spawn vectors with the verbatim math of `ThrowEngine.getVectors` / `startUnifiedBatch`
   (1920x1080 board, autoscale, medium force), using a seeded RNG, so both engines get identical inputs;
2. `createDiceBatch`, then `simulateThrow` (`canBeFlipped: true`, so dice stay dynamic afterwards);
3. idles the world for 2 s through `playStep`, like DiceBox's idle loop;
4. `removeDice`.

The die radius is 48.8 mm for the d6 (DSN scale: meters, d6 radius = 0.9 x board diagonal / 13).

Metrics:

- **sim ms**: round-trip of the `simulateThrow` message, which is what `ThrowEngine` waits for before the
  dice appear. Includes structured-clone and transfer cost.
- **replay s**: `iterationsNeeded / 60`, the length of the animation the player watches.
- **hitting 1000-frame cap**: throws where some die never settled. The replay then lasts 16.7 s.
- **tilted >5° / cocked >15°**: the angle between the up vector and the normal of the face that is
  read as the result, at the last frame. A die lying flat is 0°. Above 15° the die is visibly
  leaning on another die, a wall, or an edge.
- **out of bounds**: final centre under the desk or beyond the walls.
- **last-0.5s path / rotation**: how much the die moved over the last 30 frames of the replay.
  This is *not* jitter. It shows how soon after the last motion the replay ends: cannon-es only
  sleeps after 0.9 s of near-rest, Rapier dice are declared settled after 0.25 s.
- **idle 2s drift / rotation**: **resting jitter.** The largest displacement of a settled die
  while the world keeps stepping for 2 s.
- **sound events / throw**: collision sounds queued by the simulation.

Not measured: physical face fairness. Upstream spawns every non-coin die at the identity
orientation with spin only about x and z, so the physical result is biased in both engines.
It does not matter because `swapDiceFace` always shows Foundry's result.

## Results

### 10d6

| metric | cannon-es | Rapier |
|---|---:|---:|
| sim ms (median) | 7.9 | 7.5 |
| sim ms (p95) | 9.9 | 11 |
| replay s (median) | 2.58 | 1.7 |
| replay s (p95) | 3.35 | 2.58 |
| throws hitting 1000-frame cap | 0/200 | 0/200 |
| dice tilted >5° | 0.9% | 0.8% |
| dice cocked >15° | 0.9% | 0.8% |
| dice out of bounds | 0 | 0 |
| last-0.5s path mm (median) | 0 | 0 |
| last-0.5s path mm (p95) | 0 | 34.09 |
| last-0.5s rotation ° (p95) | 1.06 | 30.68 |
| idle 2s drift mm (p95) | 0 | 0 |
| idle 2s drift mm (max) | 0 | 0 |
| idle 2s rotation ° (max) | 0.032 | 0 |
| sound events / throw | 53.9 | 33.5 |

### 10 mixed

| metric | cannon-es | Rapier |
|---|---:|---:|
| sim ms (median) | 14.4 | 9.1 |
| sim ms (p95) | 24.5 | 13.2 |
| replay s (median) | 3.62 | 2.17 |
| replay s (p95) | 4.6 | 3 |
| throws hitting 1000-frame cap | 0/200 | 0/200 |
| dice tilted >5° | 4.5% | 5.8% |
| dice cocked >15° | 2.6% | 3.5% |
| dice out of bounds | 0 | 0 |
| last-0.5s path mm (median) | 0 | 0 |
| last-0.5s path mm (p95) | 0.01 | 16.16 |
| last-0.5s rotation ° (p95) | 1.07 | 16.86 |
| idle 2s drift mm (p95) | 0 | 0 |
| idle 2s drift mm (max) | 0 | 0 |
| idle 2s rotation ° (max) | 0.033 | 0 |
| sound events / throw | 76.9 | 36 |

### 2d20

| metric | cannon-es | Rapier |
|---|---:|---:|
| sim ms (median) | 1.7 | 2.1 |
| sim ms (p95) | 3.3 | 3.5 |
| replay s (median) | 3.15 | 1.83 |
| replay s (p95) | 3.9 | 2.97 |
| throws hitting 1000-frame cap | 0/200 | 0/200 |
| dice tilted >5° | 1.5% | 1.5% |
| dice cocked >15° | 0.3% | 1.3% |
| dice out of bounds | 0 | 0 |
| last-0.5s path mm (median) | 0 | 11.93 |
| last-0.5s path mm (p95) | 0.01 | 32.43 |
| last-0.5s rotation ° (p95) | 0.82 | 23.94 |
| idle 2s drift mm (p95) | 0 | 0 |
| idle 2s drift mm (max) | 0 | 0 |
| idle 2s rotation ° (max) | 0.031 | 0 |
| sound events / throw | 26.3 | 14.4 |

### 3 coins (d2)

| metric | cannon-es | Rapier |
|---|---:|---:|
| sim ms (median) | 3.3 | 3.5 |
| sim ms (p95) | 4.6 | 9.9 |
| replay s (median) | 3.78 | 2.45 |
| replay s (p95) | 4.68 | 6.3 |
| throws hitting 1000-frame cap | 0/200 | 6/200 |
| dice tilted >5° | 1.7% | 2.0% |
| dice cocked >15° | 1.0% | 1.8% |
| dice out of bounds | 0 | 0 |
| last-0.5s path mm (median) | 0 | 0.52 |
| last-0.5s path mm (p95) | 0 | 43.64 |
| last-0.5s rotation ° (p95) | 1.03 | 74.7 |
| idle 2s drift mm (p95) | 0 | 0 |
| idle 2s drift mm (max) | 0 | 2.498 |
| idle 2s rotation ° (max) | 0.031 | 4.629 |
| sound events / throw | 30.2 | 19.8 |

## Reading

- **Speed.** Simulation cost is a wash for 10d6 (7.5 vs 7.9 ms median) and 2d20. For 10 mixed
  polyhedra Rapier is faster (9.1 vs 14.4 ms median, 13.2 vs 24.5 ms p95). Either way it is well
  under one frame budget on this CPU. Slower machines scale both proportionally.
- **Replays are about 35-40% shorter with Rapier** (10d6: 1.70 vs 2.58 s median). This comes
  from the settle rule (0.25 s instead of cannon's 0.9 s sleep window) and from the higher
  friction the Rapier tuning needs. Whether that feels better is a judgement for M2, in Foundry.
  `sleepTime`, `diceFriction` and the restitution values in `DEFAULT_TUNING` are the knobs.
- **Cocked dice are on par for d6** (0.8% vs 0.9%) and somewhat higher for mixed sets and d20
  (mixed 3.5% vs 2.6%, 2d20 1.3% vs 0.3%). Most are leaning on another die or a wall, which is
  physically legitimate. With 200 trials the run-to-run noise on these percentages is about
  ±1 point.
- **Resting jitter is zero for both** on every polyhedral die. Rapier dice report
  `worldAsleep` once settled, so the idle loop stops stepping.
- **Known gap: coins (fixed in M2, see below).** 6 of 200 three-coin throws reach the 1000-frame
  cap with Rapier (cannon: 0). M1 read this as a coin rolling on its edge. M2 found otherwise: the
  coin lies flat and the contact solver keeps kicking it.
- **Fewer collision sounds** with Rapier (10d6: 33.5 vs 53.9 per throw). Both engines queue a sound
  when a contact pair *starts*, with the same speed thresholds and throttling. The likely reasons
  are shorter replays and fewer bounces, but this run did not isolate the cause. The cues are
  the same, so the result is fewer clicks per throw. Listen in Foundry.

Recommendation: keep cannon-es the default (as the setting does) until M2 has tuned feel and
fixed the coin case in a running Foundry.

## M2: coins

Raw data: [physics-bench-m2.json](./physics-bench-m2.json), same method and seeds, 200 trials.
Only coins changed. The other three scenarios match M1 within noise, because the new rules
apply to cylinder colliders only.

A rerun of the M1 code before any change gave 7 of 200 capped (the M1 table says 6). Tracing a
capped throw showed a coin lying flat, under 1° of tilt and slower than 2 cm/s. It kept
receiving angular velocity spikes of 0.3 to 1.4 rad/s about a horizontal axis, which
reset its settle timer. What did **not** help (capped throws out of 200): coin angular damping
1.5 or 3 (16, 12), rolling damping on a flat coin up to 40/s (5 to 7), `lengthUnit` 0.01 (12),
`pgsIterations` 4 (11), a true cylinder collider (11), desk restitution 0.1 (6).

What shipped: a coin within 0.15 rad of flat and slower than 0.15 m/s settles on the linear
test alone. A coin standing on an edge facet gets up to four topple kicks.

| 3 coins (d2) | cannon-es | Rapier M1 | Rapier M2 |
|---|---:|---:|---:|
| throws hitting 1000-frame cap | 0/200 | 6/200 | **1/200** |
| replay s (median) | 3.78 | 2.45 | 2.42 |
| replay s (p95) | 4.67 | 6.3 | 3.28 |
| dice tilted >5° | 1.7% | 2.0% | 1.0% |
| dice cocked >15° | 1.0% | 1.8% | 0.8% |
| sim ms (p95) | 4.6 | 9.9 | 4.9 |
| idle 2s drift mm (max) | 0 | 2.498 | 1.099 |
| faces 1 / 2 | 295 / 305 | | 296 / 304 |

The remaining capped throw is a coin rocking at about 3°, beyond the flat window, while drifting
a few mm. The topple kick alone (with the flat rule off) left cocked coins at 1.8%; with both,
0.8%.
