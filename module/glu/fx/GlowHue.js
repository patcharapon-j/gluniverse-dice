// GLUniverse Dice: the colour of the settle glow (ROADMAP M8, "face glow in the die's own hue").
//
// M4's result-number glow cooled to one fixed white. It can now cool to the die's own colour:
// the colorset background, or a per-die override (`term.options.gluDice.glow`, see
// DicePresentation.js). An additive glow in a dark or grey colour is no glow at all, so the hue
// is kept and the lightness lifted; a die with no real hue (white, grey, black dice) keeps the
// white glow.
//
// Pure: no three.js, no Foundry globals, so node --test can check it (tests/glowHue.test.mjs).

export const WHITE = Object.freeze([1, 1, 1]);

//below this chroma (max - min channel) a colour reads as grey or pastel-white: the glow stays
//white. Chroma, not HSL saturation, which calls a near-white like #dfe6ee "saturated".
const MIN_CHROMA = 0.12;
//the glow is additive: its lightness is lifted into this band so it shows on the face
const MIN_LIGHTNESS = 0.6;
const MAX_LIGHTNESS = 0.8;

/**
 * Parse the colour forms colorsets and API callers use.
 * @param {string|number|number[]|{r:number,g:number,b:number}|null|undefined} value
 *        "#rgb", "#rrggbb", "#rrggbbaa", "rgb(r, g, b)", 0xrrggbb, [r, g, b] (0..1),
 *        {r, g, b} (0..1, such as a THREE.Color). An array of colorset choices takes the first.
 * @returns {number[]|null} [r, g, b] in 0..1, or null when it is not a colour
 */
export function parseColor(value) {
    if (value == null || value === false) return null;
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0) return null;
        const n = Math.floor(value) & 0xffffff;
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }
    if (Array.isArray(value)) {
        if (value.length === 3 && value.every(v => typeof v === 'number' && Number.isFinite(v)))
            return value.map(v => Math.max(0, Math.min(1, v)));
        return value.length ? parseColor(value[0]) : null;
    }
    if (typeof value === 'object') {
        const { r, g, b } = value;
        return [r, g, b].every(v => typeof v === 'number' && Number.isFinite(v))
            ? [r, g, b].map(v => Math.max(0, Math.min(1, v))) : null;
    }
    if (typeof value !== 'string') return null;
    const s = value.trim().toLowerCase();
    let m = s.match(/^#([0-9a-f]{3,4})$/);
    if (m) return [0, 1, 2].map(i => parseInt(m[1][i] + m[1][i], 16) / 255);
    m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/);
    if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255);
    m = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/);
    if (m) return [m[1], m[2], m[3]].map(v => Math.max(0, Math.min(1, Number(v) / 255)));
    return null;
}

/** @returns {number[]} [h 0..1, s 0..1, l 0..1] */
export function rgbToHsl([r, g, b]) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
}

/** @returns {number[]} [r, g, b] in 0..1 */
export function hslToRgb([h, s, l]) {
    if (s === 0) return [l, l, l];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}

/**
 * The glow colour for a die colour: same hue, lightness lifted so an additive glow shows.
 * @returns {number[]|null} [r, g, b], or null when the colour has no hue to keep
 */
export function glowTintOf(color) {
    const rgb = parseColor(color);
    if (!rgb) return null;
    if (Math.max(...rgb) - Math.min(...rgb) < MIN_CHROMA) return null;
    const [h, s, l] = rgbToHsl(rgb);
    return hslToRgb([h, Math.min(1, s * 1.1), Math.max(MIN_LIGHTNESS, Math.min(MAX_LIGHTNESS, l))]);
}

/**
 * Pick the glow colour of one die.
 * @param {object} p
 * @param {*} [p.override] per-die colour from the API; wins whatever the mode
 * @param {*} [p.background] the colorset background (the die's body colour)
 * @param {*} [p.edge] the colorset edge colour, tried when the background has no hue
 * @param {"die"|"white"} [p.mode="die"] the client setting
 * @returns {number[]} [r, g, b] in 0..1
 */
export function resolveGlowTint({ override, background, edge, mode = 'die' } = {}) {
    //an explicit override is taken as given, only lifted when it is too dark to show
    const own = parseColor(override);
    if (own) return glowTintOf(own) ?? (Math.max(...own) < 0.35 ? [...WHITE] : own);
    if (mode === 'white') return [...WHITE];
    return glowTintOf(background) ?? glowTintOf(edge) ?? [...WHITE];
}
