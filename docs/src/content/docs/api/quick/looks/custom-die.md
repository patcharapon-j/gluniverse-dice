---
title: Add a new kind of die
description: Create a custom die term for your system and give it its own faces in 3D.
---

First, check what your die is:

- **Numbers on a regular die, with a special meaning** (a `1dq8` that is a d8 with the look of your system). You don't need new faces. List its denomination in a [dice role](/foundryvtt-dice-so-nice/api/quick/looks/dice-roles/) and it rolls as a regular d8 with the look of that role.
- **Symbols or images on the faces.** Create a die term, then give it a dice preset. The [Custom terms](/foundryvtt-dice-so-nice/api/terms/) tutorial walks through it.

In short, register the term in Foundry during `init`, then its faces once Dice So Nice! is ready.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('init', () => {
    CONFIG.Dice.terms['s'] = DieSzimfonia;
});

Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSystem(new DiceSystem('szimfonia', 'Szimfonia'));
    dice3d.addDicePreset({
        type: 'ds',
        labels: ['modules/my-module/images/1.png', /* one image per face */],
        system: 'szimfonia'
    });
});
```

## Next steps

- Give every custom die type a preset, so Dice So Nice! knows what to show.
- GMs can also create dice terms in the game without code, see [Custom Dice Terms](/foundryvtt-dice-so-nice/guide/custom-dice-terms/).

## Full documentation

- [Custom terms](/foundryvtt-dice-so-nice/api/terms/)
- [Giving a role to a Die class](/foundryvtt-dice-so-nice/api/roles/#giving-a-role-to-a-die-class)
