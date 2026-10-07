---
title: Flags, options and hooks
description: Every message flag, roll option, CSS hook and hook name Dice So Nice! reads, with a link to its documentation.
---

## Message flags

Set them in `flags['dice-so-nice']` when you create the chat message.

| Flag | What it does |
|------|--------------|
| `skip: true` | No 3D animation for this message. [More](/foundryvtt-dice-so-nice/api/roll/#skip-animation-for-a-specific-message-recommended) |
| `linkedTo: messageId` | Keeps this message hidden until the dice of that roll message land. [More](/foundryvtt-dice-so-nice/api/companion-messages/) |
| `interactive: true` or `false` | Asks for an interactive throw, or refuses it. [More](/foundryvtt-dice-so-nice/api/interactive-throws/#request-flags) |

## Roll and dice options

| Option | Set on | What it does |
|--------|--------|--------------|
| `rollOrder` | `roll.options` or `term.options` | Plays the dice in groups, in ascending order. [More](/foundryvtt-dice-so-nice/api/integration/#step-4-select-roll-order-for-multiple-rolls) |
| `actorId` | `roll.data` | Uses the look of that character's player. [More](/foundryvtt-dice-so-nice/api/integration/#step-5-per-roll-appearance-in-multi-actor-messages) |
| `appearance` | `roll.options` or `term.options` | Colorset, colors, texture, material, font or system of these dice. [More](/foundryvtt-dice-so-nice/api/customization/#changing-the-appearance-of-dice-in-a-roll-programmatically) |
| `dsnRole` | `term.options` | The role of the die (`hope`, `fire`...). [More](/foundryvtt-dice-so-nice/api/roles/#tagging-dice-explicitly) |
| `type`, `flavor` | `roll.options` or `term.options` | Detected as a role, or a colorset name. [More](/foundryvtt-dice-so-nice/api/roles/) |
| `sfx` | `term.options` | Activates a special effect trigger, or forces an effect. [More](/foundryvtt-dice-so-nice/api/sfx/#activating-a-trigger) |
| `hidden` | a result in `term.results` | This die is not shown. [More](/foundryvtt-dice-so-nice/api/roll/#from-the-roll-object) |
| `getDSNProperties()` | your Roll class | Tells where the role of its dice lives. [More](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties) |

In a formula, a flavor like `1d6[fire]` sets the colorset or role of that die, and `1d6[die:Fire Oracle]` rolls a die from the Dice Library.

## In your chat HTML

| Markup | What it does |
|--------|--------------|
| `inline-dsn-hidden` class on an inline roll | Dice So Nice! ignores this inline roll. [More](/foundryvtt-dice-so-nice/api/roll/#from-inline-rolls) |
| `data-message-id="<roll message id>"` | Hidden until the dice of that message land. [More](/foundryvtt-dice-so-nice/api/roll/#showing-a-roll-result-inside-another-message) |

## Hooks

| Hook | When |
|------|------|
| `diceSoNiceInit` | Dice So Nice! starts its initialization |
| `diceSoNiceReady` | Dice So Nice! is ready: register your dice here |
| `diceSoNiceMessagePreProcess` | A message is checked, before the animation is decided |
| `diceSoNiceMessageProcessed` | The decision is final |
| `diceSoNiceRollStart` | The dice of a roll are about to be thrown |
| `diceSoNiceRollComplete` | The dice of a chat roll landed |
| `diceSoNicePendingThrowOpened`, `diceSoNicePendingSlotsBound`, `diceSoNicePendingThrowClosed` | An interactive throw opens, a die lands, the throw ends |

See [Hooks](/foundryvtt-dice-so-nice/api/hooks/) and [Interactive Throws](/foundryvtt-dice-so-nice/api/interactive-throws/#lifecycle-hooks).
