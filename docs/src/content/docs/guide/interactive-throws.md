---
title: Interactive Throws
description: Reveal your rolls by throwing the 3D dice yourself on the tabletop.
---

Interactive throws let a player reveal a roll by picking up the 3D dice on the tabletop and throwing them. Foundry still decides the result when the roll is made: the throw only shows it, and each die lands on the number Foundry already picked.

## Enabling It (GM)

Interactive throws are built on [persistent dice](/foundryvtt-dice-so-nice/guide/persistent-dice/). In the module settings, the GM needs:

- **Allow interaction with rolled dice** enabled.
- **Enable persistent dice on tabletop** enabled.
- **Display chat message immediately** disabled.
- **Interactive dice throws** set to one of:
  - **Disabled** - No interactive throws in this world.
  - **Allowed (off by default)** - Players who choose it throw their own dice. Other rolls stay normal unless the game system asks for a throw.
  - **Allowed (on by default)** - Every eligible roll waits for a throw, unless the player opts out.

World `Interactive dice throws` setting is also available from the GM [Dice So Nice! sidebar tab](/foundryvtt-dice-so-nice/guide/getting-started/#sidebar-tab).

## Player Settings

Each player picks their own behavior in the [Preferences](/foundryvtt-dice-so-nice/guide/preferences/#interactive-throws) tab or in the sidebar tab:

- **Interactive throws** - World default, Never, Only when requested, or Whenever possible.
- **Auto-spawn missing dice** - Spawns the dice you need on the tabletop as soon as one of your rolls waits for a throw.

Only public rolls can be interactive. Whispered and blind rolls always play the normal 3D animation.

## Throwing Your Dice

When one of your rolls becomes interactive, its chat message is held back and a card appears in the chat for everyone: *"{name} needs to roll the following dice:"*. Each die of the roll has an empty slot on the card.

1. Pick up a matching die on the tabletop, or click **Spawn dice** to add the dice you are missing.
2. Shake or swirl it to throw it (see [Persistent Dice](/foundryvtt-dice-so-nice/guide/persistent-dice/#throw)). You can throw several selected dice at once.
3. Each thrown die fills a slot. When every slot is filled, the roll's chat message appears as usual.

Some rolls are done in several steps, like exploding dice: the card then asks for the next dice once the first ones have landed.

## Ending a Throw Early

The card has a few buttons:

- **Just roll it** (roller) - The dice you have not thrown yet play a normal 3D roll.
- **Force resolve** (GM, on another player's roll) - Same as *Just roll it*, for a player who is away.
- **Skip** (roller or GM, the fast-forward icon) - Skips the 3D animation and shows the result right away.

If the roller reloads or disconnects, the throw is abandoned and the result is revealed.

:::note[For developers]
Game systems and modules can ask for, or refuse, an interactive throw on a given roll. See [Interactive Throws](/foundryvtt-dice-so-nice/api/interactive-throws/) in the Developer Guide.
:::
