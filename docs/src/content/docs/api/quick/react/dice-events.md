---
title: React when a die spawns, lands or is clicked
description: Listen to dice events on your dice system.
---

Dice So Nice! sends three events for the dice of a system: when a die spawns, when it finishes rolling, and when it is clicked. Add listeners on your `DiceSystem`.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', (dice3d) => {
    const mySystem = new DiceSystem('my-dice-system', 'My Dice System', 'default', 'My Name');
    dice3d.addSystem(mySystem);

    mySystem.on(DiceSystem.DICE_EVENT_TYPE.RESULT, (event) => {
        console.log(event.dice);
    });
});
```

## Next steps

- The other types are `DiceSystem.DICE_EVENT_TYPE.SPAWN` and `DiceSystem.DICE_EVENT_TYPE.CLICK`. A click event also has the `position`.
- Remove a listener with `.off`.
- Events are a good place to start the extra animations of a 3D model.

## Full documentation

- [Events API](/foundryvtt-dice-so-nice/api/events/)
