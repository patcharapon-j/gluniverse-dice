---
title: Ship a dice set players can pick
description: Register a dice system, make it the look of new players, and keep it fast to load.
---

A dice system is a set of dice presets that players pick in their dice settings. Register it from the `diceSoNiceReady` hook, then add its presets. `setRoleDefaults('basic')` makes it the look new players start with.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', async (dice3d) => {
    const pack = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
    pack.setRoleDefaults('basic');
    dice3d.addSystem(pack);
    dice3d.addDicePreset({ type: 'd20', labels: [/* ... */], system: 'my-dice' });

    // presets players may never select: load them now to avoid lag on the first roll
    await dice3d.preloadPresets('my-dice');
});
```

## Next steps

- Players who already saved their dice settings keep their own look.
- Limit a system to some roles with `includeRoles` and `excludeRoles`.
- Add your own options to the dice settings (colors, toggles, files) with the system settings.
- If your dice use the extra types (d3, d5, d7, d14, d16, d24, d30), show them by default with `dice3d.showExtraDiceByDefault()`.

## Full documentation

- [Dice Systems](/foundryvtt-dice-so-nice/api/dice-systems/)
- [System Settings](/foundryvtt-dice-so-nice/api/system-settings/)
- [Show all extra dice by default for new users](/foundryvtt-dice-so-nice/api/customization/#show-all-extra-dice-by-default-for-new-users)
