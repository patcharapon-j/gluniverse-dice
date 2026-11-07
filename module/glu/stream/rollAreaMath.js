// GLUniverse Dice: roll area validation and conversion (M7). Pure functions, no Foundry, so
// tests/rollArea.test.mjs can run them under node. See RollArea.js and FORK.md "Stream roll area".
//
// A roll area is DSN's own `rollingArea` shape: { left, top, width, height } in CSS pixels of the
// client's window (the same numbers RollableAreaConfig saves). The API also accepts fractions of
// the window ({ units: "fraction" }), converted here against the client's viewport.

/** Smallest side in CSS px. DSN's own editor uses 200; a stream overlay corner can be smaller. */
export const MIN_SIDE_PX = 64;

const KEYS = ["left", "top", "width", "height"];

/** @returns {boolean} true when every value is a finite number */
function finite(...values) {
    return values.every(v => typeof v === "number" && Number.isFinite(v));
}

/**
 * Validate a viewport ({ width, height } in CSS px).
 * @returns {{width:number,height:number}}
 */
export function normalizeViewport(viewport) {
    if (!viewport || !finite(viewport.width, viewport.height) || viewport.width <= 0 || viewport.height <= 0)
        throw new RangeError("roll area: viewport must have a positive width and height");
    return { width: viewport.width, height: viewport.height };
}

/**
 * Turn user input into a pixel rect that fits the viewport, or throw.
 *
 * - `units: "px"` (default): `rect` is `{ left, top, width, height }` in CSS px.
 * - `units: "fraction"`: the same keys as fractions of the viewport, each in [0, 1].
 *
 * Non-numbers, NaN, negative or zero sizes, and fractions outside [0, 1] are rejected. A rect
 * that overflows the viewport is moved and then shrunk to fit; sides are kept at least
 * MIN_SIDE_PX (or the viewport, if smaller). Values are rounded to whole pixels.
 *
 * @param {object} rect
 * @param {{width:number,height:number}} viewport
 * @param {{units?: "px"|"fraction"}} [options]
 * @returns {{left:number,top:number,width:number,height:number}}
 */
export function normalizeRect(rect, viewport, { units = "px" } = {}) {
    const vp = normalizeViewport(viewport);
    if (!rect || typeof rect !== "object") throw new TypeError("roll area: rect must be an object");
    if (units !== "px" && units !== "fraction") throw new RangeError(`roll area: unknown units "${units}"`);
    const values = KEYS.map(k => rect[k]);
    if (!finite(...values)) throw new TypeError("roll area: left, top, width and height must be finite numbers");
    let [left, top, width, height] = values;
    if (width <= 0 || height <= 0) throw new RangeError("roll area: width and height must be positive");
    if (units === "fraction") {
        if (values.some(v => v < 0 || v > 1)) throw new RangeError("roll area: fractions must be between 0 and 1");
        left *= vp.width;
        width *= vp.width;
        top *= vp.height;
        height *= vp.height;
    } else if (left < 0 || top < 0) {
        throw new RangeError("roll area: left and top must not be negative");
    }
    const minW = Math.min(MIN_SIDE_PX, vp.width);
    const minH = Math.min(MIN_SIDE_PX, vp.height);
    width = Math.min(Math.max(width, minW), vp.width);
    height = Math.min(Math.max(height, minH), vp.height);
    left = Math.min(left, vp.width - width);
    top = Math.min(top, vp.height - height);
    return {
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height)
    };
}

/**
 * A pixel rect as fractions of the viewport (rounded to 4 decimals).
 * @returns {{left:number,top:number,width:number,height:number}}
 */
export function toFractions(rect, viewport) {
    const vp = normalizeViewport(viewport);
    const r = (v) => Math.round(v * 10000) / 10000;
    return {
        left: r(rect.left / vp.width),
        top: r(rect.top / vp.height),
        width: r(rect.width / vp.width),
        height: r(rect.height / vp.height)
    };
}

/** DSN stores `rollingArea: false` for "the whole window"; anything else must be a full rect. */
export function isRect(value) {
    return !!value && typeof value === "object" && finite(...KEYS.map(k => value[k]));
}

/** Equal pixel rects (both "none" counts as equal). */
export function sameRect(a, b) {
    const ra = isRect(a), rb = isRect(b);
    if (!ra || !rb) return ra === rb;
    return KEYS.every(k => Math.round(a[k]) === Math.round(b[k]));
}

/** Copy only DSN's four keys, so nothing extra lands in the `dice-so-nice.settings` flag. */
export function pickRect(value) {
    return isRect(value) ? Object.fromEntries(KEYS.map(k => [k, value[k]])) : false;
}

/**
 * Validate a remote request read from the `gluniverse-dice.rollAreaRequest` user flag.
 * @returns {{action:"set"|"clear"|"preview", rect?:object, units:"px"|"fraction", persist:boolean, on:boolean}|null}
 */
export function parseRequest(request) {
    if (!request || typeof request !== "object") return null;
    const { action } = request;
    if (action === "preview") return { action, on: request.on === true, units: "px", persist: false };
    if (action === "clear") return { action, persist: request.persist !== false, units: "px", on: false };
    if (action === "set") {
        if (!request.rect || typeof request.rect !== "object") return null;
        const units = request.units === "fraction" ? "fraction" : request.units === undefined || request.units === "px" ? "px" : null;
        if (!units) return null;
        return { action, rect: pickRect(request.rect) || request.rect, units, persist: request.persist !== false, on: false };
    }
    return null;
}
