---
title: Tags and Emphasis
description: Tag the dice of a throw, pick the one that matters, and choose the colour its result number glows in. A GLUniverse Dice addition.
---

:::note[GLUniverse Dice only]
This page describes an addition of GLUniverse Dice, the fork of Dice So Nice!. Dice So Nice! itself ignores everything here, so a system can use it unconditionally: without the fork the data is an unread property on the roll.
:::

Some rolls are not a pile of interchangeable dice. A Daggerheart duality roll is a Hope d12 against a Fear d12, and the answer is which one came up higher. GLUniverse Dice lets a system say so on the dice:

- **tag** a die (`"hope"`, `"fear"`, `"advantage"`, any string),
- **emphasise** one die (it glows brighter when the dice stop) and quieten the one that lost,
- pick the **colour** its result number glows in.

When the dice stop, the number on each die's top face lights up (the settle glow). That glow now cools to the die's own colour instead of white, unless the player picks white in the module settings ("Glowing number colour"). The emphasis changes its strength. The tags and the emphasis are also what the result showcase (planned, ROADMAP M6) will use to group and order dice.

## The data: `term.options.gluDice`

Put an object on the Foundry dice term, after the roll is evaluated and before its message is created:

```js
term.options.gluDice = {
  tag: "hope",          // any non-empty string
  glow: "#d4a72c",      // optional: the glow colour, or false for no glow on this die
  emphasis: true        // optional: true = the die to look at, false = the one that lost
};
```

| Key | Values | Effect |
|---|---|---|
| `tag` | string | Read back in the `gluDiceSettle` hook and by the showcase. No visual effect by itself. |
| `glow` | `"#rrggbb"`, `"#rgb"`, `"rgb(r, g, b)"`, `0xrrggbb`, `[r, g, b]` (0 to 1), `false` | The colour the number glows in once it has cooled. Wins over the player's setting. `false`: this die does not glow. Unset: the die's colorset background (or edge) colour, lifted so an additive glow shows, or white when the die has no real colour (white, grey, black dice). |
| `emphasis` | `true`, `false` | `true`: brighter glow (×1.45). `false`: quieter glow (×0.5). Unset: a plain die. |

`options` is serialised with the roll, so every client sees the same data, and Dice So Nice! copies it onto each die it builds (`mesh.options`). A d100 is two dice; both get the term's data.

Merge into what is there rather than replacing it. The module offers a helper that does this:

```js
const api = game.modules.get("gluniverse-dice")?.api?.presentation;
api?.tagTerm(term, { tag: "hope" });
api?.tagTerm(term, { emphasis: hope > fear });   // later, merged
api?.tagTerm(term, { emphasis: null });          // null removes a key
```

`game.modules.get("dice-so-nice")` returns the same module, so either id works.

## Deciding at the settle moment: `gluDiceSettle`

When the dice of a throw stop, every client calls:

```js
Hooks.callAll("gluDiceSettle", dice, context);
```

`dice` has one entry per die of the throw, in throw order. Change `glow` or `emphasis` on an entry and the glow uses the new value. The entries:

| Field | |
|---|---|
| `tag`, `glow`, `emphasis` | from `options.gluDice`, normalised (`null` when unset) |
| `result` | the face value the die shows |
| `type` | the die type (`"d12"`, …) |
| `background`, `edge`, `foreground` | the colours the die was built with |
| `options` | the die's options (read-only in spirit: the roll is already stored) |
| `mesh` | the three.js mesh, for advanced use |

`context.emphasiseHighest(dice, tags)` marks the highest result among the dice whose tag is in `tags` with `emphasis: true` (all of them on a tie) and the others `false`; dice with another tag or none are untouched. It is also on the API object.

```js
Hooks.on("gluDiceSettle", (dice, { emphasiseHighest }) => {
  emphasiseHighest(dice, ["hope", "fear"]);
});
```

A throw can hold dice of several rolls at once (simultaneous rolls are batched), so a handler should only touch dice it tagged. The hook runs on each client separately and must decide the same way everywhere: decide from `result` and the tags, not from local state. When the result is known before the message is posted, setting `emphasis` on the term is simpler and needs no hook.

The hook runs whether or not the player has the glow turned on.

## API object

`game.modules.get("gluniverse-dice").api.presentation`:

| Member | |
|---|---|
| `TERM_KEY` | `"gluDice"` |
| `SETTLE_HOOK` | `"gluDiceSettle"` |
| `tagTerm(term, data)` | merge `data` into `term.options.gluDice`; `null` removes a key |
| `readTag(options)` | `{ tag, glow, emphasis }` from a die's or term's options |
| `emphasiseHighest(dice, tags?)` | see above |
| `planPresentation(dice, { mode })` | per die: `{ index, tag, tint, gain, rank }`, `rank` being `"lead"`, `"plain"` or `"quiet"`; `tint` is `[r, g, b]` or `null` (no glow) |
| `presentationOrder(plan)` | the plan sorted lead, plain, quiet (throw order within each): the order the showcase will lay dice out in |
| `resolveGlowTint({ override, background, edge, mode })` | the glow colour one die gets |

## Example: Daggerheart duality

```js
// after evaluation, where the system already paints its terms
function tag(term, role, emphasis) {
  if (!term) return;
  term.options.gluDice = { ...(term.options.gluDice ?? {}), tag: role, emphasis };
}
tag(hopeTerm, "hope", h >= f);   // a tie (critical) emphasises both
tag(fearTerm, "fear", f >= h);
tag(advTerm, adv < 0 ? "disadvantage" : "advantage");
```

Hope and Fear then glow gold and violet (their colorset backgrounds), the higher one brighter, the lower one quieter. The pale and dark advantage d6s have no real hue and glow white.

## Materials and `diceSoNiceOnMaterialReady`

GLUniverse Dice's materials (gemstone, galaxy, pearlescent, and the enhanced built-ins) are applied before `diceSoNiceOnMaterialReady` fires, so a system still patches the finished material there. `frosted` and `velvet` keep their ids, maps and transmission mask. A system may draw into `mat.emissiveMap.image` and wrap `onBeforeCompile` (chaining the previous one) as before: the settle glow reads its own copy of the label canvas, taken before the hook, so art drawn into the emissive map does not glow as if it were the number.
