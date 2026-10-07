---
title: Use your own 3D dice models
description: Import glTF models made in Blender as the dice of your system.
---

A dice preset can use a glTF model (`.glb` or `.gltf`) instead of labels. Model your die with the same size, position and number layout as the Dice So Nice! models, export it from Blender, then point the preset to the file.

```javascript
dice3d.addDicePreset({
    type: 'd6',
    modelFile: 'modules/my_module/d6model.glb',
    system: 'my_system'
});
```

## Next steps

- Start from the Dice So Nice! models as templates, so your die lands on the right face.
- A model whose shape is not the standard one (a rhombic d12, say) needs its own physics shape, registered with `addDiceShape`.
- Large label sets load faster from a TexturePacker sprite sheet (the `atlas` field of a preset).
- The first animation track of the model plays in a loop. Other tracks can be started from the dice events.

## Full documentation

- [Custom 3D models](/foundryvtt-dice-so-nice/api/3d-models/)
- [Adding a custom physics shape](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-physics-shape)
- [TexturePacker/Spritesheet support](/foundryvtt-dice-so-nice/api/texturepacker/)
