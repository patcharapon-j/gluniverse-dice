---
title: Wait until Dice So Nice is ready
description: Register your dice, themes and roles from the diceSoNiceReady hook.
---

Every registration (systems, presets, colorsets, roles, effects) goes in the `diceSoNiceReady` hook. It gives you the main class, ready to use.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    //register your dice here
});
```

## Next steps

- `diceSoNiceInit` fires earlier, at the start of the module initialization, when the main class is not ready yet. Registrations made there fail.
- Dice So Nice! may not run at all on some clients (no 3D canvas, for example), so check `game.dice3d` before calling it from your own code.

## Full documentation

- [Hooks](/foundryvtt-dice-so-nice/api/hooks/#dicesoniceready)
