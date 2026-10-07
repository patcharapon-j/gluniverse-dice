---
title: Change the look of one roll or one die
description: Color the dice of a single roll, from a flavor or from the roll options.
---

To color the dice of one roll, either put a colorset name in the flavor of the formula, or set an `appearance` on the roll or on one of its dice.

```javascript
// with the flavor
let r1 = await new Roll('1d6[black]+1d6[white]').evaluate();
r1.toMessage();

// with the options, if you keep the flavor for something else
let r2 = await new Roll('2d20').evaluate();
r2.dice[0].options.appearance = { colorset: 'fire' };
r2.dice[1].options.appearance = { colorset: 'ice' };
r2.toMessage();
```

An `appearance` can also set single fields: `foreground`, `background`, `outline`, `edge`, `texture`, `material`, `font`, `system`.

## Next steps

- If the color means something in your game, a [dice role](/foundryvtt-dice-so-nice/api/quick/looks/dice-roles/) lets players and the GM change it.
- A flavor starting with `die:` rolls a die from the Dice Library instead.

## Full documentation

- [Changing the appearance of dice in a Roll programmatically](/foundryvtt-dice-so-nice/api/customization/#changing-the-appearance-of-dice-in-a-roll-programmatically)
