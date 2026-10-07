---
title: Change the shaders and materials of your dice
description: Hook into the Three.js materials and shaders of your dice system, with animated uniforms.
---

A dice system can modify the Three.js material of its dice, and the shader before it compiles. Register the callbacks on your `DiceSystem`.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

const mySystem = new DiceSystem('my-dice-system', 'My Dice System', 'default', 'My Name');

mySystem.registerProcessMaterialCallback((diceType, material, appearance) => {
    //modify the threejs material
});

mySystem.registerBeforeShaderCompileCallback((shader, material, diceType, appearance) => {
    shader.uniforms.time = game.dice3d.uniforms.time;
    //modify the shader fragments
});

Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSystem(mySystem);
});
```

## Next steps

- The `appearance` argument holds the player's settings, including your own system settings.
- Animation mixers found on a mesh or a material are updated in the render loop.

## Full documentation

- [Custom shaders](/foundryvtt-dice-so-nice/api/shaders/)
- [System Settings](/foundryvtt-dice-so-nice/api/system-settings/)
