// GLUniverse Dice: what a system can say about the dice of a throw (ROADMAP M8, Daggerheart pass).
//
// A system tags dice and picks which one matters, and the settle moment shows it:
//
//   term.options.gluDice = { tag: "hope", glow: "#d4a72c", emphasis: true }
//
//   - tag       a free string ("hope", "fear", "advantage"…). Read back in the gluDiceSettle hook
//               and, later, by the M6 showcase to group and order dice.
//   - glow      the colour the result number glows in (any form GlowHue.parseColor takes), or
//               false for no glow on this die. Unset: the client setting decides (die colour or
//               white).
//   - emphasis  true: this die is the one to look at (brighter glow). false: it is the one that
//               lost (quieter glow). Unset: a plain die.
//
// The data sits in the term's `options`, which Foundry serialises with the roll, so every client
// sees the same tags, and Dice So Nice copies it onto each die (`mesh.options`). A system that
// would rather decide at the settle moment uses the `gluDiceSettle` hook instead, or as well; see
// docs/src/content/docs/api/dice-presentation.md.
//
// Called from DiceFx's settle branch (settlePresentation). Everything that decides is pure
// (readTag, planPresentation, emphasiseHighest); tests/dicePresentation.test.mjs covers it.
import { MODULE_ID } from '../LegacyIdentity.js';
import { resolveGlowTint } from './GlowHue.js';

/** The key in `term.options` (and so in `mesh.options`). */
export const TERM_KEY = 'gluDice';
/** Hook: `Hooks.callAll("gluDiceSettle", dice, context)`, once per settled throw, per client. */
export const SETTLE_HOOK = 'gluDiceSettle';
export const GLOW_HUE_SETTING = 'glowHue';

//glow strength by emphasis: the lead die flares brighter, the die that lost goes quiet
export const GAIN = Object.freeze({ lead: 1.45, plain: 1, quiet: 0.5 });

export function registerPresentationSettings() {
    game.settings.register(MODULE_ID, GLOW_HUE_SETTING, {
        name: 'GLUDICE.Settings.GlowHue.Name',
        hint: 'GLUDICE.Settings.GlowHue.Hint',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            die: 'GLUDICE.Settings.GlowHue.Die',
            white: 'GLUDICE.Settings.GlowHue.White'
        },
        default: 'die'
    });
}

function glowHueMode() {
    try {
        return game.settings.get(MODULE_ID, GLOW_HUE_SETTING) === 'white' ? 'white' : 'die';
    } catch {
        return 'die';
    }
}

/**
 * The tag data of one die (or term) options, normalised.
 * @returns {{tag: string|null, glow: *, emphasis: boolean|null}}
 */
export function readTag(options) {
    const raw = options?.[TERM_KEY];
    const data = raw && typeof raw === 'object' ? raw : {};
    return {
        tag: typeof data.tag === 'string' && data.tag ? data.tag : null,
        glow: data.glow === undefined ? null : data.glow,
        emphasis: typeof data.emphasis === 'boolean' ? data.emphasis : null
    };
}

/**
 * Stamp a Foundry term (or any object with `options`). Merges into what is there, so a caller
 * can tag at one moment and set the emphasis at another.
 * @returns {object} the term
 */
export function tagTerm(term, data = {}) {
    if (!term || typeof term !== 'object') return term;
    if (!term.options || typeof term.options !== 'object') term.options = {};
    const prev = term.options[TERM_KEY] && typeof term.options[TERM_KEY] === 'object' ? term.options[TERM_KEY] : {};
    const next = { ...prev };
    for (const key of ['tag', 'glow', 'emphasis']) {
        if (data[key] === undefined) continue;
        if (data[key] === null) delete next[key];
        else next[key] = data[key];
    }
    term.options[TERM_KEY] = next;
    return term;
}

/**
 * Mark the highest result among the dice carrying one of `tags`: emphasis true on the highest
 * (all of them on a tie, such as a Daggerheart critical), false on the rest. Dice without one of
 * the tags are not touched. Works on gluDiceSettle entries, or anything with {tag, result}.
 * @param {Array<{tag:string|null, result:number, emphasis?:boolean|null}>} dice
 * @param {string[]} [tags] default: every tagged die
 * @returns {Array} the dice that were compared
 */
export function emphasiseHighest(dice, tags = null) {
    const pool = (dice ?? []).filter(d => d?.tag && (!tags || tags.includes(d.tag)) && Number.isFinite(d.result));
    if (pool.length < 2) return pool;
    const top = Math.max(...pool.map(d => d.result));
    for (const d of pool) d.emphasis = d.result === top;
    return pool;
}

/**
 * What each die gets at the settle moment: glow colour and strength, and the order M6 can lay
 * them out in (lead first, then plain, then quiet; throw order within each).
 * @param {Array<{tag:string|null, glow:*, emphasis:boolean|null, background?:*, edge?:*}>} dice
 * @param {{mode?: "die"|"white"}} [opts]
 * @returns {Array<{index:number, tag:string|null, tint:number[]|null, gain:number, rank:"lead"|"plain"|"quiet"}>}
 *          per die in the same order; `tint` null means no glow on that die
 */
export function planPresentation(dice, { mode = 'die' } = {}) {
    return (dice ?? []).map((d, index) => {
        const rank = d?.emphasis === true ? 'lead' : d?.emphasis === false ? 'quiet' : 'plain';
        const tint = d?.glow === false ? null
            : resolveGlowTint({ override: d?.glow, background: d?.background, edge: d?.edge, mode });
        return { index, tag: d?.tag ?? null, tint, gain: GAIN[rank], rank };
    });
}

/** Presentation order for a plan: lead, plain, quiet. For M6's side-by-side layout. */
export function presentationOrder(plan) {
    const weight = { lead: 0, plain: 1, quiet: 2 };
    return [...(plan ?? [])].sort((a, b) => weight[a.rank] - weight[b.rank] || a.index - b.index);
}

function materialDataOf(mesh) {
    const mat = Array.isArray(mesh?.material) ? mesh.material[0] : mesh?.material;
    return mat?.userData?.materialData ?? null;
}

/**
 * The settle moment of one throw (DiceFx calls it when the replay reaches its last frame).
 * Builds one entry per die, lets systems change it through the gluDiceSettle hook, and returns
 * the plan for each mesh.
 * @param {object[]} meshes `throwEngine.diceList`
 * @returns {Map<object, {tint:number[]|null, gain:number, rank:string, tag:string|null}>}
 */
export function settlePresentation(meshes, context = {}) {
    const list = (meshes ?? []).filter(Boolean);
    const dice = list.map((mesh, index) => {
        const md = materialDataOf(mesh);
        const result = mesh.forcedResult ?? mesh.result;
        return {
            index,
            ...readTag(mesh.options),
            result: typeof result === 'number' ? result : Number(result),
            type: mesh.notation?.type ?? null,
            background: md?.background ?? null,
            edge: md?.edge ?? null,
            foreground: md?.foreground ?? null,
            options: mesh.options ?? {},
            mesh
        };
    });
    if (dice.length) {
        try {
            Hooks.callAll(SETTLE_HOOK, dice, { ...context, emphasiseHighest });
        } catch (err) {
            console.warn(`${MODULE_ID} | a ${SETTLE_HOOK} handler failed`, err);
        }
    }
    const plan = planPresentation(dice, { mode: glowHueMode() });
    const out = new Map();
    plan.forEach((p, i) => out.set(list[i], p));
    return out;
}

/** `game.modules.get("gluniverse-dice").api.presentation` (also reachable as "dice-so-nice"). */
export const presentationApi = Object.freeze({
    TERM_KEY, SETTLE_HOOK, tagTerm, readTag, emphasiseHighest, planPresentation, presentationOrder, resolveGlowTint
});

export function exposePresentationApi() {
    const mod = game.modules?.get?.(MODULE_ID);
    if (!mod) return;
    mod.api = { ...(mod.api ?? {}), presentation: presentationApi };
}
