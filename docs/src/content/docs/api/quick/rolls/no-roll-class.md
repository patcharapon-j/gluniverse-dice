---
title: Show dice without the Roll class
description: Animate results from your own random system with game.dice3d.show and the raw throw data.
---

If your system does not use Foundry's `Roll` class, call `game.dice3d.show` with the dice to throw and their results.

```javascript
const data = {
    throws: [{
        dice: [
            { result: 7, resultLabel: 7, type: 'd20', vectors: [], options: {} },
            { result: 3, resultLabel: 3, type: 'd6', vectors: [], options: {} }
        ]
    }]
};
game.dice3d.show(data).then((displayed) => {
    // do your stuff after the animation
});
```

## Next steps

- If you can build a Foundry `Roll` from your results, [animateRoll](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/) also applies the chat rules (secret rolls, the dice look of each player).

## Full documentation

- [Using a custom Roll system](/foundryvtt-dice-so-nice/api/roll/#using-a-custom-roll-system)
