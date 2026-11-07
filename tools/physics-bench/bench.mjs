// Physics engine benchmark: cannon-es worker vs Rapier worker, same inputs.
//
//   npm run bench                    # default: 200 trials per scenario
//   npm run bench -- --trials 50 --json out.json
//   npm run bench -- --tuning '{"diceFriction":0.5}'   # Rapier tuning override
//
// Throw vectors reproduce ThrowEngine.startUnifiedBatch / getVectors (medium force, 1920x1080
// board, autoscale) with a seeded RNG, so both engines get identical spawn data per trial.
import { loadWorker } from './harness.mjs';
import { DiceShapeLibrary } from '../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry, readFace } from '../../module/web-workers/rapier/shapeGeometry.js';
import fs from 'node:fs';

const args = process.argv.slice(2);
const arg = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : def;
};
const TRIALS = Number(arg('trials', 200));
const JSON_OUT = arg('json', null);
const TUNING = arg('tuning', null) ? JSON.parse(arg('tuning')) : null;
const ENGINES = (arg('engines', 'cannon,rapier')).split(',');
const SCENARIOS_ARG = arg('scenarios', null);

// --- the board, as DiceScene computes it for a 1920x1080 canvas, no margin ---
const LEGACY_TO_METERS = 0.016 / 50;
const PX_W = 1920, PX_H = 1080;
const containerWidth = PX_W * LEGACY_TO_METERS;
const containerHeight = PX_H * LEGACY_TO_METERS;
const innerWidth = containerWidth, innerHeight = containerHeight;
const displayScale = Math.sqrt(containerWidth ** 2 + containerHeight ** 2) / 13; // autoscale, scale 75
const MARGIN = { top: 0, bottom: 0, left: 0, right: 0 };

// DicePreset defaults (mass 300, inertia 13, scale 1) overridden by DiceDefaultPresets.js
const PRESETS = {
    d2: { shape: 'd2', mass: 400, inertia: 8, scale: 0.9 },
    d4: { shape: 'd4', mass: 300, inertia: 5, scale: 1.2 },
    d6: { shape: 'd6', mass: 300, inertia: 13, scale: 0.9 },
    d8: { shape: 'd8', mass: 300, inertia: 13, scale: 1 },
    d10: { shape: 'd10', mass: 450, inertia: 9, scale: 0.9 },
    d12: { shape: 'd12', mass: 450, inertia: 8, scale: 0.9 },
    d20: { shape: 'd20', mass: 500, inertia: 6, scale: 1 }
};

const SCENARIOS = {
    '10d6': Array(10).fill('d6'),
    '10 mixed': ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd20', 'd10', 'd8', 'd6'],
    '2d20': ['d20', 'd20'],
    '3 coins (d2)': ['d2', 'd2', 'd2']
};

function mulberry32(seed) {
    return () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// verbatim math of ThrowEngine (vectorRand / getVectors / startUnifiedBatch), Math.random -> rand
function buildThrow(types, rand, idBase) {
    const vectorRand = ({ x, y }) => {
        const angle = rand() * Math.PI / 5 - Math.PI / 5 / 2;
        const vec = { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
        if (vec.x == 0) vec.x = 0.01;
        if (vec.y == 0) vec.y = 0.01;
        return vec;
    };
    const SPAWN_HEIGHT_MIN = 200 * LEGACY_TO_METERS, SPAWN_HEIGHT_RANGE = 200 * LEGACY_TO_METERS;
    const SPAWN_DROP_VELOCITY = -10 * LEGACY_TO_METERS, COIN_LIFT_VELOCITY = 3000 * LEGACY_TO_METERS;
    const SPAWN_PLANAR_JITTER = 100 * LEGACY_TO_METERS;

    const vector = { x: (rand() * 2 - 0.5) * innerWidth, y: -(rand() * 2 - 0.5) * innerHeight };
    const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    const boost = ((rand() + 3) * 0.8) * dist;

    return types.map((type, i) => {
        const p = PRESETS[type];
        const vec = vectorRand(vector);
        vec.x /= dist; vec.y /= dist;
        const W = innerWidth, H = innerHeight;
        const pos = {
            x: W * (vec.x > 0 ? -1 : 1) * 0.9 + (rand() * 2 - 1) * SPAWN_PLANAR_JITTER,
            y: rand() * SPAWN_HEIGHT_RANGE + SPAWN_HEIGHT_MIN,
            z: H * (vec.y > 0 ? -1 : 1) * 0.9 + (rand() * 2 - 1) * SPAWN_PLANAR_JITTER
        };
        const projector = Math.abs(vec.x / vec.y);
        if (projector > 1.0) pos.z /= projector; else pos.x *= projector;
        const velvec = vectorRand(vector);
        velvec.x /= dist; velvec.y /= dist;
        let velocity, angle, axis;
        if (p.shape != 'd2') {
            velocity = { x: velvec.x * boost, y: SPAWN_DROP_VELOCITY, z: velvec.y * boost };
            angle = { x: -(rand() * vec.y * 5 + p.inertia * vec.y), y: 0, z: rand() * vec.x * 5 + p.inertia * vec.x };
            axis = { x: 0, y: 0, z: 0, a: 0 };
        } else {
            velocity = { x: velvec.x * boost / 10, y: COIN_LIFT_VELOCITY, z: velvec.y * boost / 10 };
            angle = { x: 12 * p.inertia, y: 0, z: 1 * p.inertia };
            axis = { x: 1, y: rand(), z: 1, a: rand() };
        }
        return {
            id: idBase + i,
            shape: p.shape,
            material: 'plastic',
            vectordata: { type, pos, velocity, angle, axis },
            mass: p.mass,
            startAtIteration: 0,
            options: {}
        };
    });
}

const quantile = (arr, q) => {
    const s = [...arr].sort((a, b) => a - b);
    return s.length ? s[Math.min(s.length - 1, Math.floor(q * s.length))] : NaN;
};
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const DEG = 180 / Math.PI;

const geometries = new Map();
for (const p of Object.values(PRESETS)) {
    if (!geometries.has(p.shape)) geometries.set(p.shape, buildShapeGeometry(DiceShapeLibrary.getWorkerDefinition(p.shape), 1));
}

// motion of a die over the last `frames` frames of its replay buffer
function tailMotion(pos, quat, last, frames) {
    let path = 0, rot = 0;
    for (let f = Math.max(1, last - frames + 1); f <= last; f++) {
        path += Math.hypot(pos[f * 3] - pos[f * 3 - 3], pos[f * 3 + 1] - pos[f * 3 - 2], pos[f * 3 + 2] - pos[f * 3 - 1]);
        const dot = Math.abs(quat[f * 4] * quat[f * 4 - 4] + quat[f * 4 + 1] * quat[f * 4 - 3] + quat[f * 4 + 2] * quat[f * 4 - 2] + quat[f * 4 + 3] * quat[f * 4 - 1]);
        rot += 2 * Math.acos(Math.min(1, dot));
    }
    return { path, rot };
}

// sliding on the desk: per frame while the die is low (on or just over the desk), the horizontal
// distance it moved beyond what its rotation accounts for (rolling covers rot * radius)
function deskSlide(pos, quat, last, radius) {
    let path = 0, slide = 0;
    for (let f = 1; f <= last; f++) {
        if (pos[f * 3 + 1] > radius * 1.4) continue;
        const d = Math.hypot(pos[f * 3] - pos[f * 3 - 3], pos[f * 3 + 2] - pos[f * 3 - 1]);
        const dot = Math.abs(quat[f * 4] * quat[f * 4 - 4] + quat[f * 4 + 1] * quat[f * 4 - 3] + quat[f * 4 + 2] * quat[f * 4 - 2] + quat[f * 4 + 3] * quat[f * 4 - 1]);
        const rot = 2 * Math.acos(Math.min(1, dot));
        path += d;
        slide += Math.max(0, d - rot * radius);
    }
    return { path, slide };
}

async function runEngine(engine, scenarioName, types) {
    const worker = await loadWorker(engine);
    await worker.exec('init', {
        muteSoundSecretRolls: false, height: containerHeight, width: containerWidth, margin: MARGIN,
        ...(engine === 'rapier' && TUNING ? { tuning: TUNING } : {})
    });
    for (const p of Object.values(PRESETS)) {
        await worker.exec('createShape', { name: p.shape, radius: p.scale * displayScale, definition: DiceShapeLibrary.getWorkerDefinition(p.shape) });
    }

    const out = { simMs: [], frames: [], hitMax: 0, dice: 0, tilted5: 0, cocked15: 0, outOfBounds: 0, tailPathMm: [], tailRotDeg: [], deskPathMm: [], slideMm: [], restDriftMm: [], restRotDeg: [], sounds: [], faces: {}, cockedList: [] };
    const halfX = containerWidth * 0.97, halfZ = containerHeight * 0.97;

    for (let trial = 0; trial < TRIALS; trial++) {
        const rand = mulberry32(1000 + trial);
        const specs = buildThrow(types, rand, 1 + trial * 100);
        await worker.exec('createDiceBatch', specs);
        const t0 = performance.now();
        const res = await worker.exec('simulateThrow', { minIterations: 0, nbIterationsBetweenRolls: 15, framerate: 1 / 60, canBeFlipped: true, impulses: null });
        out.simMs.push(performance.now() - t0);
        out.frames.push(res.iterationsNeeded);
        if (res.iterationsNeeded >= 1000) out.hitMax++;
        out.sounds.push(res.detectedCollides.filter(Boolean).length);

        const finals = new Map();
        res.ids.forEach((id, idx) => {
            const pos = new Float32Array(res.positionsBuffers[idx]);
            const quat = new Float32Array(res.quaternionsBuffers[idx]);
            const last = res.iterationsNeeded;
            const spec = specs.find(s => s.id === id);
            const q = { x: quat[last * 4], y: quat[last * 4 + 1], z: quat[last * 4 + 2], w: quat[last * 4 + 3] };
            const ql = Math.hypot(q.x, q.y, q.z, q.w) || 1;
            const r = readFace(geometries.get(spec.shape), spec.shape, { x: q.x / ql, y: q.y / ql, z: q.z / ql, w: q.w / ql });
            const px = pos[last * 3], py = pos[last * 3 + 1], pz = pos[last * 3 + 2];
            out.dice++;
            if (r.angle * DEG > 5) out.tilted5++;
            if (r.angle * DEG > 15) {
                out.cocked15++;
                if (process.env.BENCH_DEBUG) out.cockedList.push({ trial, id, shape: spec.shape, tilt: +(r.angle * DEG).toFixed(1), p: [px, py, pz] });
            }
            if (py < -0.005 || Math.abs(px) > halfX + 0.01 || Math.abs(pz) > halfZ + 0.01) { out.outOfBounds++; if (process.env.BENCH_DEBUG) console.log(engine, "OOB", trial, id, px.toFixed(3), py.toFixed(3), pz.toFixed(3), "start", JSON.stringify(spec.vectordata.pos), "frames", last); }
            const tm = tailMotion(pos, quat, last, 30);
            if (process.env.BENCH_DEBUG && last >= 1000) console.log(engine, 'capped', trial, id, spec.shape, 'tilt', (r.angle * DEG).toFixed(1), 'height mm', (py * 1000).toFixed(0), 'last-0.5s path mm', (tm.path * 1000).toFixed(1), 'rot', (tm.rot * DEG).toFixed(0));
            out.tailPathMm.push(tm.path * 1000);
            const ds = deskSlide(pos, quat, last, PRESETS[spec.shape].scale * displayScale);
            out.deskPathMm.push(ds.path * 1000);
            out.slideMm.push(ds.slide * 1000);
            out.tailRotDeg.push(tm.rot * DEG);
            out.faces[spec.shape] ??= {};
            const fv = res.faceValues[id];
            out.faces[spec.shape][fv] = (out.faces[spec.shape][fv] || 0) + 1;
            finals.set(id, { p: [px, py, pz], q });
        });

        //resting jitter: dice were left dynamic (canBeFlipped), now idle the world for 2 s
        //through playStep like DiceBox's idle loop and measure how far each die creeps
        const drift = new Map();
        for (let s = 0; s < 120; s++) {
            const step = await worker.exec('playStep', { time_diff: 1 / 60 });
            if (!step || step.worldAsleep || !step.ids.length) continue;
            const P = new Float32Array(step.positionsBuffers), Q = new Float32Array(step.quaternionsBuffers);
            step.ids.forEach((id, i) => {
                const f = finals.get(id);
                if (!f) return;
                const d = Math.hypot(P[i * 3] - f.p[0], P[i * 3 + 1] - f.p[1], P[i * 3 + 2] - f.p[2]);
                const dot = Math.abs(Q[i * 4] * f.q.x + Q[i * 4 + 1] * f.q.y + Q[i * 4 + 2] * f.q.z + Q[i * 4 + 3] * f.q.w) / (Math.hypot(f.q.x, f.q.y, f.q.z, f.q.w) || 1);
                const prev = drift.get(id) || { d: 0, r: 0 };
                drift.set(id, { d: Math.max(prev.d, d), r: Math.max(prev.r, 2 * Math.acos(Math.min(1, dot))) });
            });
        }
        if (process.env.BENCH_DEBUG) {
            for (const c of out.cockedList.filter(c => c.trial === trial)) {
                if (engine === 'rapier') console.log('  live', JSON.stringify(await worker.exec('getRestInfo', c.id)));
                let nearest = Infinity;
                for (const [oid, f] of finals) if (oid !== c.id) nearest = Math.min(nearest, Math.hypot(f.p[0] - c.p[0], f.p[1] - c.p[1], f.p[2] - c.p[2]));
                const wall = Math.min(halfX - Math.abs(c.p[0]), halfZ - Math.abs(c.p[2]));
                console.log(engine, 'cocked', c.shape, 'tilt', c.tilt, 'nearest die mm', (nearest * 1000).toFixed(0), 'wall mm', (wall * 1000).toFixed(0), 'height mm', (c.p[1] * 1000).toFixed(0));
            }
        }
        for (const id of finals.keys()) {
            const d = drift.get(id) || { d: 0, r: 0 };
            out.restDriftMm.push(d.d * 1000);
            out.restRotDeg.push(d.r * DEG);
        }
        await worker.exec('removeDice', specs.map(s => s.id));
    }
    return out;
}

function summarize(o) {
    return {
        'sim ms (median)': +quantile(o.simMs, 0.5).toFixed(1),
        'sim ms (p95)': +quantile(o.simMs, 0.95).toFixed(1),
        'replay s (median)': +(quantile(o.frames, 0.5) / 60).toFixed(2),
        'replay s (p95)': +(quantile(o.frames, 0.95) / 60).toFixed(2),
        'throws hitting 1000-frame cap': `${o.hitMax}/${TRIALS}`,
        'dice tilted >5°': `${(100 * o.tilted5 / o.dice).toFixed(1)}%`,
        'dice cocked >15°': `${(100 * o.cocked15 / o.dice).toFixed(1)}%`,
        'dice out of bounds': o.outOfBounds,
        'last-0.5s path mm (median)': +quantile(o.tailPathMm, 0.5).toFixed(2),
        'last-0.5s path mm (p95)': +quantile(o.tailPathMm, 0.95).toFixed(2),
        'last-0.5s rotation ° (p95)': +quantile(o.tailRotDeg, 0.95).toFixed(2),
        'idle 2s drift mm (p95)': +quantile(o.restDriftMm, 0.95).toFixed(3),
        'idle 2s drift mm (max)': +Math.max(...o.restDriftMm).toFixed(3),
        'idle 2s rotation ° (max)': +Math.max(...o.restRotDeg).toFixed(3),
        'sound events / throw': +mean(o.sounds).toFixed(1),
        'desk path mm (median)': +quantile(o.deskPathMm, 0.5).toFixed(0),
        'sliding mm (median)': +quantile(o.slideMm, 0.5).toFixed(0),
        'sliding share of desk path': `${(100 * o.slideMm.reduce((a, b) => a + b, 0) / Math.max(1e-9, o.deskPathMm.reduce((a, b) => a + b, 0))).toFixed(0)}%`
    };
}

function chiSquare(counts, faces) {
    const total = faces.reduce((a, f) => a + (counts[f] || 0), 0);
    const e = total / faces.length;
    return faces.reduce((a, f) => a + ((counts[f] || 0) - e) ** 2 / e, 0);
}

const results = {};
const scenarioNames = SCENARIOS_ARG ? SCENARIOS_ARG.split(',') : Object.keys(SCENARIOS);
console.log(`Board ${PX_W}x${PX_H}px, die radius d6 ${(PRESETS.d6.scale * displayScale * 1000).toFixed(1)} mm, ${TRIALS} trials per scenario, Node ${process.version}`);
if (TUNING) console.log('Rapier tuning override:', TUNING);
for (const name of scenarioNames) {
    results[name] = {};
    const table = {};
    for (const engine of ENGINES) {
        const raw = await runEngine(engine, name, SCENARIOS[name]);
        results[name][engine] = { summary: summarize(raw), faces: raw.faces };
        table[engine] = results[name][engine].summary;
    }
    console.log(`\n=== ${name} ===`);
    console.table(table);
    if (name === '10d6') {
        for (const engine of ENGINES) {
            const c = results[name][engine].faces.d6 || {};
            console.log(`${engine} d6 faces`, JSON.stringify(c), `chi² (5 dof, 11.07 = p 0.05): ${chiSquare(c, [1, 2, 3, 4, 5, 6]).toFixed(2)}`);
        }
    }
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ trials: TRIALS, tuning: TUNING, node: process.version, results }, null, 2));
process.exit(0);
