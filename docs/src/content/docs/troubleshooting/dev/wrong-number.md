---
title: The die shows the wrong number
description: Why a die can land on a face that doesn't match the result, and how to map results to faces.
---

1. **The results of your term aren't 1 to its number of faces.** Dice So Nice! turns each result into the face that shows it. It does it alone for results from 1 to the number of faces, and for a range that starts below 1 (`values: { min: 0, max: 11 }`). For other results, give the dice preset a `valueMap`: each result and its face, counted from 1 in the order of the labels.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    // your term registered as 'e': a d4 numbered 2, 4, 6 and 8
    dice3d.addDicePreset({
        type: 'de',
        labels: ['2', '4', '6', '8'],
        valueMap: { 2: 1, 4: 2, 6: 3, 8: 4 },
        system: 'my-system'
    });
});
```

2. **A result has no face.** The console shows "No dice rotation found" and the die keeps the face it landed on. Check that the preset covers every result your term can give.

## Full documentation

- [Adding a custom DicePreset](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-dicepreset-dice-faces)
- [Custom terms](/foundryvtt-dice-so-nice/api/terms/)
