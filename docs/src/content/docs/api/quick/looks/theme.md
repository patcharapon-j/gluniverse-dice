---
title: Add a dice theme
description: Register a colorset so players can pick your colors, and optionally make it the look of new players.
---

A colorset (a "theme" for players) bundles the colors of the labels, the dice, the outline and the edges, with an optional texture, material and font. Register it from the `diceSoNiceReady` hook and it shows up in the players' theme list.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addColorset({
        name: 'my-colorful-theme',
        description: 'My Colorful Theme',
        category: 'My Module',
        foreground: '#FFFFFF',
        background: '#A00000',
        outline: 'black',
        edge: '#600000',
        material: 'metal'
    });
});
```

## Next steps

- Attributes you leave out follow each player's own settings. Set them all to lock the look.
- To give new players this theme, register it as a `basic` default: `dice3d.addRole({ id: 'basic', defaults: { global: { colorset: 'my-colorful-theme' } } }, { package: 'my-module' })`.
- Add your own background images with `dice3d.addTexture`.

## Full documentation

- [Adding a custom colorset (theme)](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-colorset-theme)
- [Adding a custom texture](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-texture)
