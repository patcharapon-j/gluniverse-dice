// GLUniverse Dice: grab and roll (ROADMAP M5).
//
// A roll that Dice So Nice would hold for an interactive throw (its rule: the GM world setting,
// the user's own setting, the `dice-so-nice.interactive` flag) is held in the roller's hand
// instead, when the roller's client setting `grabAndRoll` is on:
//
// - The roller's client shows the dice floating above the table next to where the pointer was
//   when the roll was made (bottom centre with no recent pointer), turning slowly. They are
//   visual only: no physics body, nothing sent to the other clients, no chat card.
// - Every other client holds the message without showing anything.
// - The roller throws the hand: a click throws it towards the open table, a flick throws it the
//   way it was flicked, a shake throws it hard in the shaken direction. A slow release puts the
//   hand down where it is. Escape throws it.
// - The throw (start pose, velocity and spin of each die, in board units) goes to every client
//   by socket, and each one plays the message through DSN's normal pipeline
//   (ThrowPipeline.renderRolls) with those start vectors. Foundry's result is unchanged and
//   swapDiceFace forces it, as for any roll. Completion (diceSoNiceRollComplete, the chat
//   message, waitFor3DAnimationByMessageID) waits for that animation.
// - If the roller disconnects, or the hand is held for HOLD_LIMIT_MS, the roll plays normally.
//
// Hooks: main.js preCreateChatMessage (holdInHand) and createChatMessage (interceptHeld),
// ThrowEngine.startUnifiedBatch (applyHandThrow).
import { Group, Plane, Quaternion, Vector2, Vector3 } from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';
import { DiceNotation } from '../../DiceNotation.js';
import { DsnSettings } from '../../settings/DsnSettings.js';
import { LEGACY_TO_METERS, TARGET_D6_EDGE_METERS } from '../../engine/SceneConstants.js';

export const HAND_SETTING = "grabAndRoll";
const FLAG = "hand";
const SOCKET_TYPE = "gluHandThrow";
//one id per page load: the same user logged in twice holds the hand in one session only
const SESSION = Math.random().toString(36).slice(2, 12);

//a pointer older than this is not "where the player is": use the default spot
const POINTER_FRESH_MS = 20000;
//the hand floats a little above the pointer, so the button just clicked stays clickable
const HAND_ABOVE_POINTER_PX = 80;
const DEFAULT_SPOT_Y = 0.78;
//sizes in die sizes (DiceFactory.baseScale: DSN scales the dice to the board)
const HAND_SPACING = 1.75;
//centre to centre, in diameters of the largest die of the hand (its bounding sphere): loose
//while the hand floats, pulled together while it is held (still clear of each other, so the
//throw never starts with two dice inside one another)
const LOOSE = 1.4;
const CUPPED = 1.06;
const HOVER_HEIGHT = 1.6;
const GRAB_HEIGHT = 2.4;
const BOB = 0.12;
//a release this quick and this still is a click
const CLICK_MS = 350;
const CLICK_PX = 8;
//a drag whose last sample is older than this had stopped before the release
const FLICK_STALE_MS = 90;
//board widths per second
const FLICK_MIN = 0.7;
const THROW_MIN = 1.3;
const THROW_CLICK = 1.9;
const THROW_MAX = 4.0;
const LOFT = 0.55;
//direction reversals while held that make a shake
const SHAKE_REVERSALS = 3;
const SHAKE_STROKE_MS = 300;
const HOLD_LIMIT_MS = 10 * 60 * 1000;
//after the release the hand flies on as the simulation will (both workers: gravity
//-9.8 * 800 legacy units/s^2, damping 0.1), until the replay takes over; it never flies longer
//than this, nor into the desk or a wall, where the two would part
const GRAVITY = -9.8 * 800 * LEGACY_TO_METERS;
const DAMPING = -Math.log(0.9);
const FLIGHT_MAX = 0.6;

const _plane = new Plane(new Vector3(0, 1, 0), 0);
const _hit = new Vector3();
const _q = new Quaternion();
const _axis = new Vector3();

let lastPointer = null;
//messageId -> { message, rolls, authorId, mine, timer }
const held = new Map();
//messageId -> throw payload, consumed by applyHandThrow
const throws = new Map();
//throw payloads that arrived before their message did
const early = new Map();
//the open hand on this client (one at a time; later rolls wait their turn)
let hand = null;
const queue = [];
let grab = null;
let loopId = 0;

export function registerHandSetting() {
    game.settings.register(MODULE_ID, HAND_SETTING, {
        name: "GLUDICE.Settings.GrabAndRoll.Name",
        hint: "GLUDICE.Settings.GrabAndRoll.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true
    });
    Hooks.once("ready", () => {
        game.socket.on(`module.${MODULE_ID}`, (request) => {
            if (request?.type === SOCKET_TYPE) onRemoteThrow(request);
        });
    });
    Hooks.on("userConnected", (user, connected) => {
        if (connected) return;
        for (const [id, entry] of [...held]) if (!entry.mine && entry.authorId === user.id) release(id, null);
    });
    Hooks.on("deleteChatMessage", (message) => {
        const entry = held.get(message.id);
        if (!entry) return;
        held.delete(message.id);
        clearTimeout(entry.timer);
        const i = queue.indexOf(message.id);
        if (i !== -1) queue.splice(i, 1);
        if (hand?.messageId === message.id) closeHand();
    });
}

// Pointer tracking and the hand's own input. Registered when this file loads, before Dice So
// Nice adds its window listeners, so a press on the hand never reaches DSN or the Foundry canvas.
function installInput() {
    const note = (event) => {
        lastPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
    };
    window.addEventListener("pointermove", note, { capture: true, passive: true });
    window.addEventListener("pointerdown", note, { capture: true, passive: true });
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointermove", onPointerMove, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && hand?.ready && !hand.thrown) throwHand(clickThrow());
    }, true);
}
if (typeof window !== "undefined") installInput();

function reducedMotion() {
    try {
        return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    } catch {
        return false;
    }
}

export function handEnabled() {
    try {
        return game.settings.get(MODULE_ID, HAND_SETTING) !== false;
    } catch {
        return false;
    }
}

/**
 * preCreateChatMessage, on the roller's client, once DSN has decided the roll is interactive:
 * hold it in the hand instead of DSN's pending throw. True when the hand takes it.
 */
export function holdInHand(message) {
    if (!handEnabled() || !game.dice3d?.box) return false;
    message.updateSource({ [`flags.${MODULE_ID}.${FLAG}`]: { state: "held", session: SESSION } });
    return true;
}

/**
 * createChatMessage, on every client, where DSN would animate or open its pending throw:
 * true when the message is held in a hand, so DSN leaves it hidden and waits.
 */
export function interceptHeld(message, rolls) {
    const flag = message.flags?.[MODULE_ID]?.[FLAG];
    if (flag?.state !== "held") return false;
    if (held.has(message.id)) return true;
    const entry = { message, rolls, authorId: message.author?.id ?? null, mine: flag.session === SESSION };
    entry.timer = setTimeout(() => release(message.id, null), HOLD_LIMIT_MS);
    held.set(message.id, entry);
    const sent = early.get(message.id);
    if (sent) {
        early.delete(message.id);
        release(message.id, sent);
    } else if (entry.mine) {
        queue.push(message.id);
        if (!hand) openNext();
    }
    return true;
}

// ---------------------------------------------------------------------------------------------
// The hand on screen

function board() {
    return game.dice3d?.box ?? null;
}

function dieSize() {
    return game.dice3d?.DiceFactory?.baseScale || TARGET_D6_EDGE_METERS;
}

// The board's rectangle on screen, as Dice3D's mouseNDC maps the pointer. The board can be
// hidden (display: none) when a roll comes in, so fall back to its inline size.
function boardRect() {
    const el = document.getElementById("dice-box-canvas");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width && r.height) return { left: r.left, top: r.top, width: r.width, height: r.height };
    const width = parseFloat(el.style.width), height = parseFloat(el.style.height);
    if (!width || !height) return null;
    return { left: parseFloat(el.style.left) || 0, top: parseFloat(el.style.top) || 0, width, height };
}

function ndcOf(rect, clientX, clientY) {
    return new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
}

// The point at height y under a screen position, in world meters.
function pointAt(box, clientX, clientY, y) {
    const rect = boardRect();
    const scene = box?.diceScene;
    if (!rect || !scene?.camera || !scene.raycaster) return null;
    scene.raycaster.setFromCamera(ndcOf(rect, clientX, clientY), scene.camera);
    _plane.constant = -y;
    const hit = scene.raycaster.ray.intersectPlane(_plane, _hit);
    return hit ? { x: hit.x, z: hit.z } : null;
}

// Keep a point inside the board's walls, as PersistentDice._computeSpawnBounds places them
// (the sidebar's margin comes off the right).
function clampToWalls(display, p, margin) {
    const cW = display.containerWidth ?? display.innerWidth / 2;
    const cH = display.containerHeight ?? display.innerHeight / 2;
    const right = display.containerMargin?.right || 0;
    const minX = -cW * 0.97 + margin, maxX = (cW - 2 * right) * 0.97 - margin;
    const minZ = -cH * 0.97 + margin, maxZ = cH * 0.97 - margin;
    return {
        x: minX < maxX ? Math.max(minX, Math.min(maxX, p.x)) : (minX + maxX) / 2,
        z: minZ < maxZ ? Math.max(minZ, Math.min(maxZ, p.z)) : 0
    };
}

function clampToBoard(box, p, margin) {
    return clampToWalls(box.diceScene.display, p, margin);
}

// Hex rings around the centre: 0 is the centre, then 6 around it, then 12, ...
function ringOffset(index) {
    if (index === 0) return { x: 0, z: 0 };
    let ring = 1;
    let first = 1;
    while (index >= first + 6 * ring) {
        first += 6 * ring;
        ring++;
    }
    const k = index - first;
    const side = Math.floor(k / ring);
    const f = (k % ring) / ring;
    const corner = (s) => ({ x: Math.cos(s * Math.PI / 3) * ring, z: Math.sin(s * Math.PI / 3) * ring });
    const a = corner(side), b = corner(side + 1);
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
}

// The dice a message will throw, in the order DSN's notation lists them, with the appearance
// the throw will use (term colorsets, roles and the speaker's actor included).
function handDice(entry) {
    const pipeline = game.dice3d.pipeline;
    const factory = game.dice3d.DiceFactory;
    const message = entry.message;
    const user = message.author ?? game.user;
    const actor = ChatMessage.getSpeakerActor(message.speaker);
    const config = DsnSettings.ALL_CONFIG(user, actor);
    const custom = DsnSettings.ALL_CUSTOMIZATION(user, factory, actor);
    //work on copies: DSN stamps and flattens the rolls it animates
    const rolls = entry.rolls.map(r => foundry.dice.Roll.fromData(JSON.parse(JSON.stringify(r))));
    for (const roll of rolls) {
        pipeline._stampRole(roll);
        pipeline._stampAppearance(roll);
    }
    const out = [];
    for (const roll of pipeline._buildRollList(rolls)) {
        const notation = new DiceNotation(roll, config, user);
        for (const t of notation.throws) {
            for (const die of t.dice) {
                const appearance = factory.getAppearanceForDice(custom.appearance, die.type, die, custom.roleContext);
                out.push({ type: die.type, appearance, diceLibrary: custom.diceLibrary });
            }
        }
    }
    return out;
}

async function openNext() {
    while (queue.length && !hand) {
        const messageId = queue.shift();
        const entry = held.get(messageId);
        if (!entry) continue;
        try {
            await openHand(messageId, entry);
        } catch (err) {
            console.error(`${MODULE_ID} | the hand could not open, rolling normally`, err);
            if (hand?.messageId === messageId) closeHand();
            release(messageId, null);
        }
    }
}

async function openHand(messageId, entry) {
    const box = board();
    if (!box?.throwEngine || !box.scene) throw new Error("no dice board");
    const size = dieSize();
    const dice = handDice(entry);
    if (!dice.length) throw new Error("no dice to hold");
    const h = { messageId, group: new Group(), dice: [], size, t: 0, thrown: false, ready: false };
    hand = h;
    h.group.name = "gluniverse-dice-hand";

    const fresh = lastPointer && performance.now() - lastPointer.time < POINTER_FRESH_MS;
    const rect = boardRect();
    const sx = fresh ? lastPointer.x : rect ? rect.left + rect.width / 2 : 0;
    const sy = fresh ? lastPointer.y - HAND_ABOVE_POINTER_PX : rect ? rect.top + rect.height * DEFAULT_SPOT_Y : 0;
    //the hand may reach past the walls while it floats; the throw starts each die inside them
    const at = pointAt(box, sx, sy, size * HOVER_HEIGHT) ?? { x: 0, z: 0 };
    const centre = clampToBoard(box, at, size);
    //centre the cluster on its middle, not on its first die
    const offsets = dice.map((_, i) => ringOffset(i));
    const mid = offsets.reduce((m, o) => ({ x: m.x + o.x / offsets.length, z: m.z + o.z / offsets.length }), { x: 0, z: 0 });
    h.group.position.set(centre.x, size * HOVER_HEIGHT, centre.z);
    h.target = new Vector3().copy(h.group.position);

    for (let i = 0; i < dice.length; i++) {
        const d = dice[i];
        const made = await box.throwEngine.createDiceMesh(d.type, d.appearance, d.diceLibrary);
        if (hand !== h) return; //closed while loading
        if (!made) continue;
        const holder = new Group();
        const off = offsets[i];
        holder.position.set((off.x - mid.x) * size * HAND_SPACING, 0, (off.z - mid.z) * size * HAND_SPACING);
        if (made.dicemesh.userData?.modelScale) holder.scale.setScalar(made.dicemesh.userData.modelScale);
        const geo = made.dicemesh.geometry;
        if (geo && !geo.boundingSphere) geo.computeBoundingSphere();
        const radius = (geo?.boundingSphere?.radius ?? size * 0.6) * holder.scale.x;
        holder.quaternion.random();
        holder.add(made.dicemesh);
        h.group.add(holder);
        h.dice.push({
            holder,
            mesh: made.dicemesh,
            index: i,
            off: { x: off.x - mid.x, z: off.z - mid.z },
            radius,
            spinAxis: new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
            spin: 0.5 + Math.random() * 0.4,
            phase: Math.random() * Math.PI * 2
        });
    }
    if (!h.dice.length) throw new Error("no dice meshes");
    h.diameter = 2 * Math.max(...h.dice.map(d => d.radius));
    h.spacing = h.diameter * LOOSE;
    for (const d of h.dice) d.holder.position.set(d.off.x * h.spacing, 0, d.off.z * h.spacing);
    box.scene.add(h.group);
    h.ready = true;
    showBoard();
    startLoop();
}

function closeHand() {
    if (!hand) return;
    //the meshes come from the factory's caches: remove them, don't dispose
    hand.group.removeFromParent();
    for (const d of hand.dice) d.holder.removeFromParent();
    hand = null;
    grab = null;
    document.documentElement.style.removeProperty("cursor");
    board()?.renderScene?.();
    if (queue.length) openNext();
}

function showBoard() {
    const dice3d = game.dice3d;
    if (!dice3d?.canvas) return;
    if (dice3d.canvas.style.display === "none" || dice3d.canvas.style.opacity === "0") dice3d._beforeShow?.();
}

function startLoop() {
    if (loopId) return;
    let last = performance.now();
    const step = (now) => {
        loopId = 0;
        if (!hand?.ready) return;
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
        last = now;
        animateHand(dt);
        if (!hand.thrown) showBoard();
        board()?.renderScene?.();
        loopId = requestAnimationFrame(step);
    };
    loopId = requestAnimationFrame(step);
}

// The hand has weight: it follows on a spring (held: stiff, a touch of overshoot; floating:
// soft, no overshoot), leans into the way it is moving, and the cupped dice slosh against the
// hand's acceleration a little, each by its own amount.
const SPRING_HELD = { k: 260, zeta: 0.72 };
const SPRING_FLOAT = { k: 42, zeta: 1 };
const LEAN_MAX = 0.42;
const SLOSH = 0.0011;
const SLOSH_MAX = 0.06;
const _acc = new Vector3();
const _goal = new Vector3();
const _v = new Vector3();
const _lean = new Quaternion();
const _yaw = new Quaternion();
const _inv = new Quaternion();
const UP_AXIS = new Vector3(0, 1, 0);

function animateHand(dt) {
    const h = hand;
    h.t += dt;
    if (h.flight) return flyHand(h);
    const size = h.size;
    const pos = h.group.position;
    h.vel ??= new Vector3();
    h.leanQ ??= new Quaternion();
    h.yaw ??= 0;
    _goal.copy(h.target);
    if (!grab) _goal.y = size * HOVER_HEIGHT + Math.sin(h.t * 1.7) * size * BOB;
    const spring = grab ? SPRING_HELD : SPRING_FLOAT;
    const damping = 2 * Math.sqrt(spring.k) * spring.zeta;
    //semi-implicit Euler in small steps: stable at any frame rate
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
        _acc.copy(_goal).sub(pos).multiplyScalar(spring.k).addScaledVector(h.vel, -damping);
        h.vel.addScaledVector(_acc, sdt);
        pos.addScaledVector(h.vel, sdt);
    }

    //lean into the motion: the top tips toward where the hand is going
    const vx = h.vel.x, vz = h.vel.z;
    const speed = Math.hypot(vx, vz);
    h.calm ??= reducedMotion();
    if (speed > 1e-5 && !h.calm) {
        _axis.set(vz / speed, 0, -vx / speed);
        _lean.setFromAxisAngle(_axis, LEAN_MAX * Math.tanh(speed / (size * 18)));
    } else {
        _lean.identity();
    }
    h.leanQ.slerp(_lean, 1 - Math.exp(-dt * 12));
    h.yaw += dt * (grab ? 0.9 : 0.25);
    _yaw.setFromAxisAngle(UP_AXIS, h.yaw);
    h.group.quaternion.copy(h.leanQ).multiply(_yaw);

    //held, the dice are pulled together and turn faster; a shake makes them tumble
    const energy = grab ? 2.5 + Math.min(8, grab.reversals * 2.2) : 1;
    const spacing = h.diameter * (grab ? CUPPED : LOOSE);
    h.spacing += (spacing - h.spacing) * (1 - Math.exp(-dt * (grab ? 16 : 4)));
    //slosh, in the hand's own frame: against the acceleration, capped so cupped dice never touch
    _inv.copy(h.group.quaternion).invert();
    _v.copy(_acc).multiplyScalar(h.calm ? 0 : -SLOSH * size).applyQuaternion(_inv);
    const cap = SLOSH_MAX * h.diameter;
    if (_v.length() > cap) _v.setLength(cap);
    for (const d of h.dice) {
        _q.setFromAxisAngle(d.spinAxis, d.spin * energy * dt);
        d.holder.quaternion.premultiply(_q);
        d.slosh ??= new Vector3();
        d.sloshGain ??= 0.7 + Math.random() * 0.6;
        d.slosh.lerp(_v.clone().multiplyScalar(d.sloshGain), 1 - Math.exp(-dt * 14));
        d.holder.position.set(
            d.off.x * h.spacing + d.slosh.x,
            Math.sin(h.t * 2.1 + d.phase) * size * (grab ? 0.02 : 0.06) + d.slosh.y * 0.5,
            d.off.z * h.spacing + d.slosh.z
        );
    }
}

// ---------------------------------------------------------------------------------------------
// Input

function hitHand(event) {
    if (!hand?.ready || hand.thrown) return false;
    const box = board();
    const rect = boardRect();
    if (!box || !rect) return false;
    box.diceScene.raycaster.setFromCamera(ndcOf(rect, event.clientX, event.clientY), box.diceScene.camera);
    return box.diceScene.raycaster.intersectObject(hand.group, true).length > 0;
}

function onPointerDown(event) {
    if (event.button !== 0 || (event.pointerType && event.pointerType !== "mouse")) return;
    if (!hitHand(event)) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    try {
        document.documentElement.setPointerCapture?.(event.pointerId);
    } catch { /* best effort */ }
    grab = { x: event.clientX, y: event.clientY, time: performance.now(), samples: [], reversals: 0, lastDir: null };
    followPointer(event);
    document.documentElement.style.cursor = "grabbing";
}

function followPointer(event) {
    const box = board();
    const p = pointAt(box, event.clientX, event.clientY, hand.size * GRAB_HEIGHT);
    if (!p) return;
    const c = clampToBoard(box, p, hand.size);
    hand.target.set(c.x, hand.size * GRAB_HEIGHT, c.z);
    const now = performance.now();
    const s = grab.samples;
    const prev = s[s.length - 1];
    if (!prev || now - prev.t >= 12) {
        s.push({ x: c.x, z: c.z, t: now });
        if (s.length > 12) s.shift();
    }
    //shake: count sharp reversals of the drag direction, measured over each stroke of at least
    //a third of a die so the pointer's event rate doesn't matter. A slow stroke (moving the hand
    //around) is not part of a shake.
    const from = grab.strokeFrom ?? (grab.strokeFrom = { x: c.x, z: c.z, t: now });
    const dx = c.x - from.x, dz = c.z - from.z;
    const len = Math.hypot(dx, dz);
    if (len < hand.size * 0.33) return;
    const dir = { x: dx / len, z: dz / len };
    if (now - from.t > SHAKE_STROKE_MS) grab.reversals = 0;
    else if (grab.lastDir && dir.x * grab.lastDir.x + dir.z * grab.lastDir.z < -0.4) grab.reversals++;
    grab.lastDir = dir;
    grab.strokeFrom = { x: c.x, z: c.z, t: now };
}

let hoverCheck = 0;
function onPointerMove(event) {
    if (grab) {
        event.stopImmediatePropagation();
        if (hand) followPointer(event);
        return;
    }
    if (!hand?.ready || hand.thrown) return;
    const now = performance.now();
    if (now - hoverCheck < 50) return;
    hoverCheck = now;
    if (hitHand(event)) document.documentElement.style.cursor = "grab";
    else document.documentElement.style.removeProperty("cursor");
}

function onPointerUp(event) {
    if (!grab) return;
    event.stopImmediatePropagation();
    const g = grab;
    grab = null;
    document.documentElement.style.removeProperty("cursor");
    if (!hand || hand.thrown) return;
    const now = performance.now();
    const moved = Math.hypot(event.clientX - g.x, event.clientY - g.y);
    if (now - g.time < CLICK_MS && moved < CLICK_PX) return throwHand(clickThrow());

    const W = board().diceScene.display.innerWidth;
    const v = dragVelocity(g.samples, now);
    const speed = v ? Math.hypot(v.x, v.z) : 0;
    if (g.reversals >= SHAKE_REVERSALS) {
        //a shake: throw hard, the way the last stroke went (towards the table when it stopped)
        const dir = speed > 1e-6 ? { x: v.x / speed, z: v.z / speed } : towardsTable();
        return throwHand(velocityFrom(dir, W * (THROW_MIN + 0.6 + Math.min(1.2, g.reversals * 0.15)), g.reversals));
    }
    if (speed > W * FLICK_MIN) {
        const throwSpeed = Math.min(W * THROW_MAX, Math.max(W * THROW_MIN, speed * 1.15));
        return throwHand(velocityFrom({ x: v.x / speed, z: v.z / speed }, throwSpeed, 0));
    }
    //a slow release puts the hand down where it is
    hand.target.y = hand.size * HOVER_HEIGHT;
}

// World velocity over the last ~80 ms of the drag, or null when the drag had stopped.
function dragVelocity(samples, now) {
    const last = samples[samples.length - 1];
    if (!last || now - last.t > FLICK_STALE_MS) return null;
    let first = last;
    for (let i = samples.length - 2; i >= 0 && last.t - samples[i].t <= 80; i--) first = samples[i];
    const dt = (last.t - first.t) / 1000;
    if (dt < 0.008) return null;
    return { x: (last.x - first.x) / dt, z: (last.z - first.z) / dt };
}

// From the hand towards the board's centre, give or take 30 degrees; anywhere near the centre.
function towardsTable() {
    const p = hand.group.position;
    const W = board().diceScene.display.innerWidth;
    let angle = Math.hypot(p.x, p.z) > W * 0.12 ? Math.atan2(-p.z, -p.x) : Math.random() * Math.PI * 2;
    angle += (Math.random() - 0.5) * (Math.PI / 3);
    return { x: Math.cos(angle), z: Math.sin(angle) };
}

function clickThrow() {
    const W = board().diceScene.display.innerWidth;
    return velocityFrom(towardsTable(), W * THROW_CLICK * (0.9 + Math.random() * 0.2), 0);
}

function velocityFrom(dir, speed, reversals) {
    //DSN's throwing force setting scales these throws the way it scales its own
    const force = { weak: 0.6, strong: 1.5 }[DsnSettings.CONFIG().throwingForce] ?? 1;
    const W = board().diceScene.display.innerWidth;
    return { dir, speed: speed * force, loft: W * LOFT, tumble: 1 + Math.min(1.5, reversals * 0.25) };
}

// ---------------------------------------------------------------------------------------------
// The throw

function throwHand(v) {
    const h = hand;
    if (!h?.ready || h.thrown) return;
    h.thrown = true;
    const box = board();
    const W = box.diceScene.display.innerWidth;
    h.group.updateMatrixWorld(true);
    const dice = [];
    for (const d of h.dice) {
        const wp = d.mesh.getWorldPosition(new Vector3());
        const wq = d.mesh.getWorldQuaternion(new Quaternion());
        //small differences per die, so the dice don't fly in formation
        const a = (Math.random() - 0.5) * 0.35;
        const s = 1 + (Math.random() - 0.5) * 0.2;
        const vx = (v.dir.x * Math.cos(a) - v.dir.z * Math.sin(a)) * v.speed * s;
        const vz = (v.dir.x * Math.sin(a) + v.dir.z * Math.cos(a)) * v.speed * s;
        //spin about the axis the die would roll on, plus some wobble
        const spin = new Vector3(vz, 0, -vx).normalize().multiplyScalar((10 + Math.random() * 8) * v.tumble)
            .add(new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(8));
        dice.push({
            index: d.index,
            pos: box.toPositionPct(wp.x, wp.z),
            y: wp.y / W,
            vel: { x: vx / W, y: (v.loft * (0.85 + Math.random() * 0.3)) / W, z: vz / W },
            spin: { x: spin.x, y: spin.y, z: spin.z },
            q: [wq.x, wq.y, wq.z, wq.w]
        });
    }
    startFlight(h, dice, W);
    const payload = { type: SOCKET_TYPE, messageId: h.messageId, user: game.user.id, dice };
    game.socket.emit(`module.${MODULE_ID}`, payload);
    release(h.messageId, payload);
}

// From the release, each die of the hand flies on as the simulation starts it: the same
// position, velocity, spin and gravity. Each die leaves the hand's group for the scene so it
// moves in world space. tMax: before the first die could reach the desk or a wall.
function startFlight(h, dice, W) {
    const box = board();
    const display = box.diceScene.display;
    const size = h.size;
    let tMax = FLIGHT_MAX;
    const flying = [];
    h.group.updateMatrixWorld(true);
    for (let i = 0; i < h.dice.length; i++) {
        const d = h.dice[i];
        const sent = dice[i];
        const p0 = d.mesh.getWorldPosition(new Vector3());
        const q0 = d.mesh.getWorldQuaternion(new Quaternion());
        const v = new Vector3(sent.vel.x * W, sent.vel.y * W, sent.vel.z * W);
        const w = new Vector3(sent.spin.x, sent.spin.y, sent.spin.z);
        //desk: y = p0.y + v.y t + g t^2 / 2 reaches the die's radius
        const floor = size * 0.75;
        const a = GRAVITY / 2, b = v.y, c = p0.y - floor;
        const disc = b * b - 4 * a * c;
        if (disc > 0) tMax = Math.min(tMax, (-b - Math.sqrt(disc)) / (2 * a));
        //walls: the centre reaches them less half a die
        const inside = clampToWalls(display, { x: p0.x + v.x * 10, z: p0.z + v.z * 10 }, size * 0.6);
        if (Math.abs(v.x) > 1e-6) tMax = Math.min(tMax, Math.abs((inside.x - p0.x) / v.x));
        if (Math.abs(v.z) > 1e-6) tMax = Math.min(tMax, Math.abs((inside.z - p0.z) / v.z));
        //world pose; the holder keeps the mesh's model scale
        d.holder.removeFromParent();
        d.holder.position.copy(p0);
        d.holder.quaternion.copy(q0);
        box.scene.add(d.holder);
        flying.push({ holder: d.holder, p0, q0, v, w, wLen: w.length() });
    }
    h.flight = { t0: performance.now(), tMax: Math.max(0, tMax), dice: flying };
}

function flyHand(h) {
    const f = h.flight;
    const t = Math.min(f.tMax, (performance.now() - f.t0) / 1000);
    //linear damping integrates to (1 - e^-ct) / c; gravity is left undamped (a small error)
    const k = DAMPING > 0 ? (1 - Math.exp(-DAMPING * t)) / DAMPING : t;
    for (const d of f.dice) {
        d.holder.position.set(d.p0.x + d.v.x * k, d.p0.y + d.v.y * k + GRAVITY * t * t / 2, d.p0.z + d.v.z * k);
        if (d.wLen > 1e-6) {
            _axis.copy(d.w).divideScalar(d.wLen);
            _q.setFromAxisAngle(_axis, d.wLen * k);
            d.holder.quaternion.copy(d.q0).premultiply(_q);
        }
    }
}

function onRemoteThrow(request) {
    if (!request?.messageId) return;
    if (held.has(request.messageId)) {
        release(request.messageId, request);
    } else {
        early.set(request.messageId, request);
        //nothing ever came for it (whispered elsewhere, 3D off): forget it
        setTimeout(() => early.delete(request.messageId), 60000);
    }
}

// Play the held message through DSN's pipeline, from the hand when a throw is given.
function release(messageId, payload) {
    const entry = held.get(messageId);
    if (!entry) return;
    held.delete(messageId);
    clearTimeout(entry.timer);
    const queued = queue.indexOf(messageId);
    if (queued !== -1) queue.splice(queued, 1);
    const mine = hand?.messageId === messageId;
    if (payload?.dice?.length) {
        throws.set(messageId, { dice: payload.dice, next: 0, mine });
        //a throw that never starts (3D off on this client, skipped) must not linger
        setTimeout(() => {
            throws.delete(messageId);
            if (hand?.messageId === messageId) closeHand();
        }, 30000);
    } else if (mine) {
        closeHand();
    }
    try {
        game.dice3d.pipeline.renderRolls(entry.message, entry.rolls);
    } catch (err) {
        console.error(`${MODULE_ID} | held roll failed to play`, err);
        if (hand?.messageId === messageId) closeHand();
    }
}

/** AnimationQueue.enqueue: a throw from a hand skips the 400 ms wait for simultaneous rolls. */
export function isHandThrow(messageId) {
    return !!messageId && throws.has(messageId);
}

/**
 * ThrowEngine.startUnifiedBatch, after DSN made the start vectors of a notation: a throw from a
 * hand replaces them with the hand's pose and the throw's velocity and spin.
 */
export function applyHandThrow(throwEngine, notation) {
    const data = throws.get(notation?.messageId);
    if (!data) return;
    const display = throwEngine.diceScene.display;
    const W = display.innerWidth;
    for (const die of notation.dice) {
        const d = data.dice[data.next++];
        if (!d || !die.vectors) continue;
        const size = dieSize();
        const p = clampToWalls(display, { x: (d.pos.x - 0.5) * display.innerWidth, z: -(d.pos.y - 0.5) * display.innerHeight }, size * 0.7);
        die.vectors.pos = { x: p.x, y: Math.max(d.y * W, size * 0.8), z: p.z };
        die.vectors.velocity = { x: d.vel.x * W, y: d.vel.y * W, z: d.vel.z * W };
        //a coin keeps DSN's own flip
        if (die.vectors.type === "d2") continue;
        die.vectors.angle = { ...d.spin };
        _q.set(d.q[0], d.q[1], d.q[2], d.q[3]).normalize();
        if (_q.w < 0) _q.set(-_q.x, -_q.y, -_q.z, -_q.w);
        const angle = 2 * Math.acos(Math.min(1, _q.w));
        const s = Math.sqrt(Math.max(0, 1 - _q.w * _q.w));
        if (s > 1e-4) _axis.set(_q.x / s, _q.y / s, _q.z / s);
        else _axis.set(0, 1, 0);
        die.vectors.axis = { x: _axis.x, y: _axis.y, z: _axis.z, a: angle / (Math.PI * 2) };
    }
    if (data.next >= data.dice.length) throws.delete(notation.messageId);
    //on the roller's client the replay starts where the flying hand has got to
    if (data.mine && hand?.messageId === notation.messageId && hand.flight) throwEngine._gluHandSeek = hand;
}

/**
 * ThrowEngine.startUnifiedBatch, once the playback is set up (iteration 0): a throw from this
 * client's hand skips the frames the hand already flew, then the thrown dice replace the hand.
 */
export function seekHandReplay(throwEngine) {
    const h = throwEngine._gluHandSeek;
    if (!h) return;
    delete throwEngine._gluHandSeek;
    if (hand !== h || !h.flight) return;
    const waited = (performance.now() - h.flight.t0) / 1000;
    const t = Math.min(h.flight.tMax, waited);
    const frames = Math.min(Math.round(t / throwEngine.framerate), Math.max(0, (throwEngine.iterationsNeeded ?? 0) - 1));
    console.debug(`${MODULE_ID} | hand throw: replay starts ${Math.round(waited * 1000)} ms after the release, at frame ${frames}`);
    if (frames > 0) {
        //DiceBox adds the first dice only on iteration 0, and updateThrowPlayback the later
        //groups on their iteration: add every die due by now, then start there
        for (const die of throwEngine.diceList) {
            if (die.startAtIteration <= frames && !die.parent?.parent) throwEngine._spawnDiceIntoScene(die);
            //straight to the frame the hand reached, not frame 0 (no flash back)
            const sim = die.sim;
            if (die.parent && sim?.stepPositions?.[frames * 3] !== undefined && !(sim.dead && sim.dead <= frames)) {
                die.parent.position.fromArray(sim.stepPositions, frames * 3);
                die.parent.quaternion.fromArray(sim.stepQuaternions, frames * 4);
            }
        }
        throwEngine.iteration = frames;
    }
    closeHand();
}
