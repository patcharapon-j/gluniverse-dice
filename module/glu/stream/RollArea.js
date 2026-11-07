// GLUniverse Dice: the roll area API for the Stream Client (M7).
//
// DSN already has a per-client roll area: `rollingArea` in the user flag `dice-so-nice.settings`,
// edited by RollableAreaConfig and read by Dice3D._buildCanvas / _computeDimensions. DSN applies
// it only after a reload. This file makes it scriptable and live:
//
//   game.dice3d.rollArea.get()                          state of this client
//   game.dice3d.rollArea.set(rect, { units, persist })   apply here, live
//   game.dice3d.rollArea.clear({ persist })              back to the whole window
//   game.dice3d.rollArea.preview(on)                     outline the area on this client
//   game.dice3d.rollArea.setFor(userId, rect, opts)      GM: the same, on another user's client
//   game.dice3d.rollArea.clearFor(userId, opts)          GM
//   game.dice3d.rollArea.previewFor(userId, on)          GM
//   game.dice3d.rollArea.query(userId, { timeout })      ask a connected client for its state
//
// Live apply uses DSN's own window-resize path, Dice3D.resizeAndRebuild(), after the animation
// queue is idle: it rebuilds the canvas, renderer, camera and physics walls from CONFIG(). A
// transient area (persist: false) reaches that rebuild through the one seam in
// DsnSettings.CONFIG (applyRollAreaOverride).
//
// Remote writes are server-attested: the GM writes a request into the target user's flag
// `gluniverse-dice.rollAreaRequest`, and the target client acts on `updateUser` only when the
// author Foundry reports is a GM (or itself). Reads go over the module socket, which is not
// attested, and carry no authority. Docs: docs/src/content/docs/api/roll-area.md.

import { MODULE_ID, LEGACY_ID } from "../LegacyIdentity.js";
import { prewarmBoard } from "../ShaderPrewarm.js";
import { normalizeRect, normalizeViewport, toFractions, sameRect, pickRect, isRect, parseRequest } from "./rollAreaMath.js";

export const ROLL_AREA_CHANGED_HOOK = "gluDiceRollAreaChanged";
export const ROLL_AREA_REPORT_HOOK = "gluDiceRollAreaReport";
export const REQUEST_FLAG = "rollAreaRequest";
const SOCKET_QUERY = "gluRollAreaQuery";
const SOCKET_STATE = "gluRollAreaState";
const APPLY_DEBOUNCE_MS = 150;

//transient area for this client (persist: false); undefined = none, false = whole window
let override;
//the rollingArea the board was last built with by us
let applied;
let previewOn = false;
let previewEl = null;
let applyTimer = null;
let applyChain = Promise.resolve();
const pendingQueries = new Map();

const socketName = () => `module.${MODULE_ID}`;

function bodyTop() {
    return parseInt(window.getComputedStyle(document.body).top, 10) || 0;
}

/** The client's window in CSS px, as Dice3D._buildCanvas sizes the full-window board. */
export function viewport() {
    return { width: window.innerWidth, height: window.innerHeight - bodyTop() };
}

function storedArea(user = game.user) {
    return pickRect(user?.getFlag(LEGACY_ID, "settings")?.rollingArea);
}

function configuredArea() {
    return override !== undefined ? override : storedArea();
}

/**
 * The one seam in DsnSettings.CONFIG: a transient area replaces the stored one for this client.
 * Returns the config it was given.
 */
export function applyRollAreaOverride(config, user) {
    if (override !== undefined && config && (!user || user.id === globalThis.game?.user?.id))
        config.rollingArea = override ? { ...override } : false;
    return config;
}

function effectiveRect() {
    const el = game.dice3d?.canvas;
    if (!el) return null;
    return {
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth || parseInt(el.style.width) || 0,
        height: el.offsetHeight || parseInt(el.style.height) || 0
    };
}

/** @returns {RollAreaState} */
export function get() {
    const vp = viewport();
    const rect = configuredArea() || null;
    return {
        userId: game.user.id,
        rect,
        fractions: rect ? toFractions(rect, vp) : null,
        effective: effectiveRect(),
        viewport: vp,
        persisted: storedArea() || null,
        transient: override !== undefined,
        preview: previewOn
    };
}

/**
 * Set this client's roll area and apply it live.
 * @param {{left:number,top:number,width:number,height:number}} rect CSS px, or fractions with units "fraction"
 * @param {{units?: "px"|"fraction", persist?: boolean}} [options] persist (default true) saves it in DSN's `rollable-area` setting
 * @returns {Promise<RollAreaState>} once the board has been rebuilt
 */
export async function set(rect, { units = "px", persist = true } = {}) {
    const px = normalizeRect(rect, viewport(), { units });
    return write(px, persist);
}

/** Back to DSN's default, the whole window minus the sidebar. */
export async function clear({ persist = true } = {}) {
    return write(false, persist);
}

async function write(px, persist) {
    if (persist) {
        override = undefined;
        if (!sameRect(storedArea(), px)) await game.user.setFlag(LEGACY_ID, "settings", { rollingArea: px });
    } else {
        override = px;
    }
    updatePreview(px);
    return scheduleApply();
}

/** Show or hide an outline of the roll area on this client. */
export function preview(on = true) {
    previewOn = !!on;
    updatePreview();
    return previewOn;
}

function updatePreview(rect) {
    if (!previewOn) {
        previewEl?.remove();
        previewEl = null;
        return;
    }
    if (!previewEl) {
        previewEl = document.createElement("div");
        previewEl.className = "glu-dice-roll-area-preview";
        previewEl.style.cssText = "position:absolute;box-sizing:border-box;pointer-events:none;z-index:10000;" +
            "border:3px dashed #ffb347;background:rgba(255,179,71,0.08);box-shadow:0 0 0 1px rgba(0,0,0,0.6) inset;";
        const label = document.createElement("div");
        label.style.cssText = "position:absolute;left:6px;top:4px;font:600 13px/1.2 sans-serif;color:#ffb347;" +
            "text-shadow:0 0 3px #000;white-space:nowrap;";
        previewEl.append(label);
        document.body.append(previewEl);
    }
    //the requested area while a rebuild is pending, otherwise the board as built
    const area = rect !== undefined ? (rect || fullWindow()) : (effectiveRect() || configuredArea() || fullWindow());
    Object.assign(previewEl.style, {
        left: area.left + "px",
        top: area.top + "px",
        width: area.width + "px",
        height: area.height + "px"
    });
    previewEl.firstChild.textContent = `${game.i18n.localize("GLUDICE.RollArea.Preview")} ${Math.round(area.width)} × ${Math.round(area.height)}`;
}

function fullWindow() {
    const vp = viewport();
    return { left: 0, top: 0, width: vp.width, height: vp.height };
}

//coalesce rapid sets (a director dragging) into one rebuild, after the dice in flight land.
//every caller waiting on a coalesced apply is resolved by the rebuild that replaced it
let applyWaiters = [];
function scheduleApply() {
    return new Promise((resolve) => {
        applyWaiters.push(resolve);
        clearTimeout(applyTimer);
        applyTimer = setTimeout(() => {
            const waiters = applyWaiters;
            applyWaiters = [];
            applyChain = applyChain.then(rebuild).catch(err => console.error("GLUniverse Dice | roll area apply failed", err));
            applyChain.then(() => { const state = get(); for (const w of waiters) w(state); });
        }, APPLY_DEBOUNCE_MS);
    });
}

async function rebuild() {
    const dice3d = game.dice3d;
    if (!dice3d?.box) return;
    await dice3d.queue?.idle();
    const target = configuredArea();
    if (sameRect(applied, target)) {
        updatePreview();
        return;
    }
    if (dice3d.box.initialized) {
        dice3d.resizeAndRebuild();
        prewarmBoard(dice3d);
    }
    applied = target;
    updatePreview();
    const state = get();
    Hooks.callAll(ROLL_AREA_CHANGED_HOOK, state);
    game.socket.emit(socketName(), { type: SOCKET_STATE, from: game.user.id, requestId: null, state });
}

// --- remote: GM side ---------------------------------------------------------------------------

function requireTarget(userId) {
    const user = game.users.get(userId);
    if (!user) throw new Error(`roll area: no user ${userId}`);
    if (!game.user.isGM) throw new Error("roll area: only a GM can change another user's roll area");
    return user;
}

async function sendRequest(userId, request) {
    if (userId === game.user.id) return applyRequest(request);
    const user = requireTarget(userId);
    //every key present each time: a flag update merges objects, so a missing key would linger
    const full = { action: request.action, rect: request.rect ?? null, units: request.units ?? "px",
        persist: request.persist !== false, on: request.on === true, at: Date.now(), by: game.user.id };
    await user.setFlag(MODULE_ID, REQUEST_FLAG, full);
    return full;
}

/** GM: set the roll area on `userId`'s client (applied there, live; persisted in that user's DSN settings by default). */
export function setFor(userId, rect, { units = "px", persist = true } = {}) {
    //validate here too, so a GM script fails fast; the target re-validates against its own viewport
    if (units === "px") normalizeRect(rect, { width: 1e6, height: 1e6 }, { units });
    else normalizeRect(rect, { width: 1, height: 1 }, { units });
    return sendRequest(userId, { action: "set", rect: pickRect(rect), units, persist });
}

/** GM: back to the whole window on `userId`'s client. */
export function clearFor(userId, { persist = true } = {}) {
    return sendRequest(userId, { action: "clear", persist });
}

/** GM: show or hide the outline on `userId`'s client. */
export function previewFor(userId, on = true) {
    return sendRequest(userId, { action: "preview", on: !!on });
}

/**
 * Ask a connected client for its state. Resolves with RollAreaState, or null after `timeout` ms.
 * Read-only, so it is not restricted to GMs.
 */
export function query(userId, { timeout = 3000 } = {}) {
    if (userId === game.user.id) return Promise.resolve(get());
    const requestId = foundry.utils.randomID();
    return new Promise((resolve) => {
        const timer = setTimeout(() => { pendingQueries.delete(requestId); resolve(null); }, timeout);
        pendingQueries.set(requestId, (state) => { clearTimeout(timer); resolve(state); });
        game.socket.emit(socketName(), { type: SOCKET_QUERY, to: userId, from: game.user.id, requestId });
    });
}

// --- remote: target side -----------------------------------------------------------------------

async function applyRequest(raw) {
    const request = parseRequest(raw);
    if (!request) {
        console.warn("GLUniverse Dice | ignored an invalid roll area request", raw);
        return null;
    }
    try {
        if (request.action === "preview") return preview(request.on);
        if (request.action === "clear") return await clear({ persist: request.persist });
        return await set(request.rect, { units: request.units, persist: request.persist });
    } catch (err) {
        console.warn("GLUniverse Dice | rejected a roll area request:", err.message, raw);
        return null;
    }
}

function onUpdateUser(user, changed, options, userId) {
    if (user.id !== game.user.id) return;
    const request = changed?.flags?.[MODULE_ID]?.[REQUEST_FLAG];
    if (request) {
        //userId is the author as the server reports it; the payload's `by` is informational
        const author = game.users.get(userId);
        if (author?.isGM || userId === game.user.id) applyRequest(user.getFlag(MODULE_ID, REQUEST_FLAG));
        else console.warn("GLUniverse Dice | ignored a roll area request from a non-GM user", userId);
    }
    const settings = changed?.flags?.[LEGACY_ID]?.settings;
    //DSN's own settings changed (our persist, a GM edit, DSN's dialog): rebuild if the area moved
    if (settings && "rollingArea" in settings && override === undefined && !sameRect(applied, storedArea())) {
        updatePreview(storedArea());
        scheduleApply();
    }
}

function onSocket(request) {
    if (!request || typeof request !== "object") return;
    if (request.type === SOCKET_QUERY) {
        if (request.to !== game.user.id || typeof request.requestId !== "string") return;
        game.socket.emit(socketName(), { type: SOCKET_STATE, from: game.user.id, requestId: request.requestId, state: get() });
    } else if (request.type === SOCKET_STATE) {
        if (!isState(request.state)) return;
        const resolve = request.requestId && pendingQueries.get(request.requestId);
        if (resolve) {
            pendingQueries.delete(request.requestId);
            resolve(request.state);
        }
        Hooks.callAll(ROLL_AREA_REPORT_HOOK, request.state, request.from);
    }
}

function isState(state) {
    if (!state || typeof state !== "object" || typeof state.userId !== "string") return false;
    try {
        normalizeViewport(state.viewport);
    } catch {
        return false;
    }
    return state.rect === null || isRect(state.rect);
}

export const rollArea = Object.freeze({ get, set, clear, preview, setFor, clearFor, previewFor, query, viewport });

/** Wire the API: game.dice3d.rollArea (additive), the updateUser listener and the socket. */
export function registerRollArea() {
    Hooks.on("diceSoNiceInit", (dice3d) => {
        dice3d.rollArea = rollArea;
    });
    Hooks.once("ready", () => {
        const pkg = game.modules.get(MODULE_ID);
        if (pkg) pkg.api = { ...(pkg.api ?? {}), rollArea };
        applied = storedArea();
        game.socket.on(socketName(), onSocket);
        Hooks.on("updateUser", onUpdateUser);
    });
}

/**
 * @typedef {object} RollAreaState
 * @property {string} userId
 * @property {{left:number,top:number,width:number,height:number}|null} rect configured area in CSS px; null = whole window
 * @property {{left:number,top:number,width:number,height:number}|null} fractions the same as fractions of the viewport
 * @property {{left:number,top:number,width:number,height:number}|null} effective the dice canvas as built now
 * @property {{width:number,height:number}} viewport the client's window in CSS px
 * @property {{left:number,top:number,width:number,height:number}|null} persisted the area saved in DSN's setting
 * @property {boolean} transient a persist:false area is in effect
 * @property {boolean} preview the outline is showing
 */
