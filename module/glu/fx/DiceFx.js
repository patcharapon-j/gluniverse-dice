// GLUniverse Dice: impact particles and the settle glow (ROADMAP M4).
//
// Impacts come from the simulation's collision timeline: both workers append the contact
// position (meters) as the 5th element of each `detectedCollides` entry. ThrowEngine replaces
// its own copy with the sound list, so noteSimulation() keeps the raw one. While a throw
// replays, every frame spawns the impacts of the frames it passed. When the replay reaches its
// last frame, each die gets a glow on the face that landed up (its label lights up most) and a
// small burst of sparkles in its label colour.
//
// Everything here is drawn by our own objects in the board scene: no dice material is changed,
// so it works with every system, preset and material. tick() is driven from Smoothness.shouldRender.
import {
    AdditiveBlending, BufferAttribute, BufferGeometry, Color, Mesh, Points, ShaderMaterial, Vector3, Matrix3
} from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';

export const PARTICLES_SETTING = "impactParticles";
export const GLOW_SETTING = "settleGlow";

const MAX_PARTICLES = 768;
const GRAVITY = -2.2;          // m/s^2, light sparks
const GLOW_TIME = 2.6;         // s, total glow time
const UP = new Vector3(0, 1, 0);

export function registerFxSettings() {
    for (const [key, i18n] of [[PARTICLES_SETTING, "ImpactParticles"], [GLOW_SETTING, "SettleGlow"]]) {
        game.settings.register(MODULE_ID, key, {
            name: `GLUDICE.Settings.${i18n}.Name`,
            hint: `GLUDICE.Settings.${i18n}.Hint`,
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        });
    }
}

function setting(key) {
    try {
        return game.settings.get(MODULE_ID, key) !== false;
    } catch {
        return false;
    }
}

// === particle pool =========================================================================

const POINTS_VERTEX = /* glsl */`
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
uniform float uPixelRatio;
void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * 900.0 / max(-mv.z, 0.01);
}`;

const POINTS_FRAGMENT = /* glsl */`
varying float vAlpha;
varying vec3 vColor;
void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d) * 4.0;
    float a = vAlpha * smoothstep(1.0, 0.0, r);
    a *= a;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * a, a);
}`;

class ParticlePool {
    constructor() {
        const n = MAX_PARTICLES;
        this.pos = new Float32Array(n * 3);
        this.vel = new Float32Array(n * 3);
        this.col = new Float32Array(n * 3);
        this.size = new Float32Array(n);
        this.alpha = new Float32Array(n);
        this.life = new Float32Array(n);
        this.maxLife = new Float32Array(n);
        this.drag = new Float32Array(n);
        this.next = 0;
        this.alive = 0;
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(this.pos, 3));
        g.setAttribute('aColor', new BufferAttribute(this.col, 3));
        g.setAttribute('aSize', new BufferAttribute(this.size, 1));
        g.setAttribute('aAlpha', new BufferAttribute(this.alpha, 1));
        this.material = new ShaderMaterial({
            vertexShader: POINTS_VERTEX,
            fragmentShader: POINTS_FRAGMENT,
            uniforms: { uPixelRatio: { value: 1 } },
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending
        });
        this.points = new Points(g, this.material);
        this.points.frustumCulled = false;
        this.points.renderOrder = 10;
        this.points.name = 'gluniverse-dice-fx';
    }

    spawn(x, y, z, vx, vy, vz, color, size, life, drag = 1.5) {
        const i = this.next;
        this.next = (this.next + 1) % MAX_PARTICLES;
        this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
        this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
        this.col[i * 3] = color.r; this.col[i * 3 + 1] = color.g; this.col[i * 3 + 2] = color.b;
        this.size[i] = size;
        this.life[i] = life;
        this.maxLife[i] = life;
        this.drag[i] = drag;
        this.alpha[i] = 1;
        this.spawned = true;
    }

    /** @returns {boolean} any particle alive */
    update(dt) {
        if (!this.alive && !this.spawned) return false;
        this.spawned = false;
        let alive = 0;
        for (let i = 0; i < MAX_PARTICLES; i++) {
            if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
            this.life[i] -= dt;
            if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
            alive++;
            const k = Math.exp(-this.drag[i] * dt);
            this.vel[i * 3] *= k; this.vel[i * 3 + 2] *= k;
            this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * k + GRAVITY * dt;
            this.pos[i * 3] += this.vel[i * 3] * dt;
            this.pos[i * 3 + 1] = Math.max(0.001, this.pos[i * 3 + 1] + this.vel[i * 3 + 1] * dt);
            this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
            const t = this.life[i] / this.maxLife[i];
            this.alpha[i] = Math.min(1, t * 2.5);
        }
        const g = this.points.geometry;
        for (const name of ['position', 'aColor', 'aSize', 'aAlpha']) g.attributes[name].needsUpdate = true;
        this.alive = alive;
        return alive > 0;
    }
}

// === state per box ==========================================================================

function fxState(box) {
    if (!box._gluFx) box._gluFx = { pool: null, glows: [], lastTime: 0 };
    return box._gluFx;
}

function pool(box) {
    const s = fxState(box);
    if (!s.pool) s.pool = new ParticlePool();
    if (box.scene && s.pool.points.parent !== box.scene) box.scene.add(s.pool.points);
    s.pool.material.uniforms.uPixelRatio.value = box.renderer?.getPixelRatio?.() ?? 1;
    return s.pool;
}

const IMPACT_DICE = new Color(1.0, 0.85, 0.55);
const IMPACT_TABLE = new Color(0.75, 0.78, 0.85);
const tmpColor = new Color();

function spawnImpact(box, entry) {
    const [source, , , strength, p] = entry;
    if (!p || !(strength > 0)) return;
    const P = pool(box);
    const dice = source === 'dice';
    const n = Math.round((dice ? 6 : 4) + strength * (dice ? 12 : 8));
    const y0 = dice ? p[1] : Math.max(0.002, Math.min(p[1], 0.01));
    for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2;
        const h = Math.random() * 0.8 + 0.2;
        const s = (dice ? 0.35 : 0.18) + Math.random() * (dice ? 0.6 : 0.25) * strength;
        P.spawn(p[0], y0, p[2], Math.cos(a) * s, h * s * (dice ? 1.2 : 0.8), Math.sin(a) * s,
            dice ? IMPACT_DICE : IMPACT_TABLE, (dice ? 0.0035 : 0.005) * (0.6 + Math.random() * 0.8),
            (dice ? 0.28 : 0.45) + Math.random() * 0.2, dice ? 3 : 5);
    }
}

// === settle glow ===========================================================================

const GLOW_VERTEX = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLOW_FRAGMENT = /* glsl */`
uniform vec3 uColor;
uniform float uIntensity;
uniform sampler2D uMask;
uniform float uHasMask;
varying vec2 vUv;
void main() {
    float label = uHasMask > 0.5 ? 1.0 - smoothstep(0.6, 0.9, texture2D(uMask, vUv).r) : 0.0;
    float a = uIntensity * (0.16 + 0.84 * label);
    gl_FragColor = vec4(uColor * a, a);
}`;

function labelColor(mesh) {
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const fg = mat?.userData?.materialData?.foreground;
    try {
        if (fg) {
            const c = new Color(fg);
            const hsl = c.getHSL({});
            //a dark label colour would not glow: brighten it, keeping the hue
            if (hsl.l < 0.55) c.setHSL(hsl.h, Math.max(hsl.s, 0.6), 0.65);
            return c;
        }
    } catch { /* fall through */ }
    return new Color(1, 0.92, 0.7);
}

function upFaceGeometry(mesh) {
    const geo = mesh.geometry;
    const pos = geo?.attributes?.position;
    if (!pos) return null;
    const uv = geo.attributes.uv;
    const index = geo.index;
    const triCount = index ? index.count / 3 : pos.count / 3;
    if (!triCount || triCount > 4000) return null;
    mesh.updateWorldMatrix(true, false);
    const nm = new Matrix3().getNormalMatrix(mesh.matrixWorld);
    const a = new Vector3(), b = new Vector3(), c = new Vector3(), n = new Vector3();
    const dots = new Float32Array(triCount);
    let best = -2;
    const vi = (t, k) => index ? index.getX(t * 3 + k) : t * 3 + k;
    for (let t = 0; t < triCount; t++) {
        a.fromBufferAttribute(pos, vi(t, 0));
        b.fromBufferAttribute(pos, vi(t, 1));
        c.fromBufferAttribute(pos, vi(t, 2));
        n.subVectors(c, b).cross(a.sub(b)).applyMatrix3(nm).normalize();
        dots[t] = n.dot(UP);
        if (dots[t] > best) best = dots[t];
    }
    if (best < 0.7) return null;
    const keep = [];
    for (let t = 0; t < triCount; t++) if (dots[t] > best - 0.02) keep.push(t);
    const out = new Float32Array(keep.length * 9);
    const outUv = uv ? new Float32Array(keep.length * 6) : null;
    keep.forEach((t, j) => {
        for (let k = 0; k < 3; k++) {
            const v = vi(t, k);
            out[j * 9 + k * 3] = pos.getX(v); out[j * 9 + k * 3 + 1] = pos.getY(v); out[j * 9 + k * 3 + 2] = pos.getZ(v);
            if (outUv) { outUv[j * 6 + k * 2] = uv.getX(v); outUv[j * 6 + k * 2 + 1] = uv.getY(v); }
        }
    });
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(out, 3));
    if (outUv) g.setAttribute('uv', new BufferAttribute(outUv, 2));
    return g;
}

function addGlow(box, mesh) {
    if (!mesh?.isMesh || mesh.shape === 'd4' || mesh.notation?.type === 'd4') return;
    const geo = upFaceGeometry(mesh);
    if (!geo) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const mask = mat?.userData?.gluLabelMask ?? null;
    const color = labelColor(mesh);
    const glowMat = new ShaderMaterial({
        vertexShader: GLOW_VERTEX,
        fragmentShader: GLOW_FRAGMENT,
        uniforms: {
            uColor: { value: color },
            uIntensity: { value: 0 },
            uMask: { value: mask },
            uHasMask: { value: mask ? 1 : 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });
    const overlay = new Mesh(geo, glowMat);
    overlay.name = 'gluniverse-dice-glow';
    overlay.renderOrder = 9;
    mesh.add(overlay);
    fxState(box).glows.push({ overlay, t: 0 });

    //sparkles around the die, in the label colour
    if (setting(PARTICLES_SETTING)) {
        const P = pool(box);
        const wp = new Vector3();
        mesh.getWorldPosition(wp);
        for (let k = 0; k < 14; k++) {
            const a = (k / 14) * Math.PI * 2 + Math.random() * 0.3;
            const r = 0.025 + Math.random() * 0.015;
            tmpColor.copy(color).lerp(new Color(1, 1, 1), 0.35);
            P.spawn(wp.x + Math.cos(a) * r, Math.max(0.004, wp.y - 0.01), wp.z + Math.sin(a) * r,
                Math.cos(a) * 0.05, 0.18 + Math.random() * 0.12, Math.sin(a) * 0.05,
                tmpColor, 0.003 + Math.random() * 0.002, 0.7 + Math.random() * 0.4, 1.2);
        }
    }
}

function glowIntensity(t) {
    if (t < 0.18) return (t / 0.18) * 1.4;
    const decay = (t - 0.18) / (GLOW_TIME - 0.18);
    return Math.max(0, 1.4 * (1 - decay) * (1 - decay) * (0.85 + 0.15 * Math.cos(t * 9)));
}

function updateGlows(box, dt) {
    const s = fxState(box);
    for (let i = s.glows.length - 1; i >= 0; i--) {
        const g = s.glows[i];
        g.t += dt;
        if (!g.overlay.parent || g.t >= GLOW_TIME) {
            g.overlay.removeFromParent();
            g.overlay.geometry.dispose();
            g.overlay.material.dispose();
            s.glows.splice(i, 1);
            continue;
        }
        g.overlay.material.uniforms.uIntensity.value = glowIntensity(g.t);
    }
    return s.glows.length > 0;
}

// === hooks ==================================================================================

/** ThrowEngine, right after a simulation result is received. */
export function noteSimulation(throwEngine, detectedCollides) {
    throwEngine._gluFxThrow = { impacts: detectedCollides || [], iter: -1, settled: false };
}

/**
 * Called once per DiceBox frame (from Smoothness.shouldRender).
 * @returns {boolean} effects are alive and the frame should be rendered
 */
export function tickFx(box) {
    const now = performance.now();
    const s = fxState(box);
    const dt = s.lastTime ? Math.min(0.1, (now - s.lastTime) / 1000) : 1 / 60;
    s.lastTime = now;

    const engine = box.throwEngine;
    const th = engine?._gluFxThrow;
    if (th && engine.rolling) {
        if (setting(PARTICLES_SETTING)) {
            const until = Math.min(engine.iteration, engine.iterationsNeeded);
            //a fast-forwarded replay (hidden tab, stale playback) skips its impacts
            if (until - th.iter > 120) th.iter = until;
            for (let i = th.iter + 1; i <= until; i++) if (th.impacts[i]) spawnImpact(box, th.impacts[i]);
            th.iter = Math.max(th.iter, until);
        }
        if (!th.settled && engine.iterationsNeeded > 0 && engine.iteration >= engine.iterationsNeeded) {
            th.settled = true;
            if (setting(GLOW_SETTING)) for (const mesh of engine.diceList ?? []) addGlow(box, mesh);
        }
    }

    const glowing = updateGlows(box, dt);
    const particles = s.pool ? s.pool.update(dt) : false;
    return glowing || particles;
}
