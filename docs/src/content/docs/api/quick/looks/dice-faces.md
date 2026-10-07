---
title: Put your own text, images or icons on the faces
description: Register a dice system and its presets to change what is printed on each face.
---

What a die shows on each face is a dice preset. Presets belong to a dice system, which players pick in their settings. Register both from the `diceSoNiceReady` hook.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSystem(new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack'));
    dice3d.addDicePreset({
        type: 'd6',
        labels: ['1', '2', '3', '4', '5', 'modules/my-module/images/six.webp'],
        system: 'my-dice'
    });
});
```

A label is text (any Unicode character, emojis included) or a path to a PNG, JPG, GIF or WebP image. Images should be 256x256 pixels.

## Next steps

- Font Awesome icons work too. Set `font: '"Font Awesome 7 Pro"'` and use the icon's Unicode character as the label.
- Make your system the look of new players, see [A dice set](/foundryvtt-dice-so-nice/api/quick/looks/dice-set/).

## Full documentation

- [Adding a custom DicePreset (dice faces)](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-dicepreset-dice-faces)
- [Using Font Awesome icons as labels](/foundryvtt-dice-so-nice/api/customization/#using-font-awesome-icons-as-labels)
