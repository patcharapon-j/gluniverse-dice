---
title: Dice Systems
description: Register a DiceSystem, give dice roles a default look, limit it to some roles, and preload its presets.
---

Register systems from the [`diceSoNiceReady` hook](/foundryvtt-dice-so-nice/api/hooks/). The faces of each die type are added to a system with [DicePresets](/foundryvtt-dice-so-nice/api/customization/#adding-a-custom-dicepreset-dice-faces).

## Adding a custom model system (aka dice face preset)
A system (or "Dice Presets" for players) allows you to store a list of custom dice model and customize it with settings, animations or custom shaders.
```javascript
import { DiceSystem } from '../dice-so-nice/api.js';
/**
 * Register a new system
 * The id is to be used with the addDicePreset method
 * The name can be a localized string
 * (legacy) The third argument is the mode: keep it on "default"
 * The group is a string used to group systems in the list.
 *   Could be the name of the brand or a collection.
 * @param {DiceSystem} mySystem
 */
const mySystem = new DiceSystem(id, name, 'default', group);
dice3d.addSystem(mySystem);
```

Adding a system makes it a choice in the players' dice settings. To make it the look new players start with, use [`setRoleDefaults`](#making-a-system-the-default-for-a-role).

:::note[Legacy]
Older code may pass `"preferred"` as the mode, or as the second argument of `dice3d.addSystem`. It still works, but new code should use `setRoleDefaults`.
:::

### More info
You can do a lot more with "Dice So Nice" systems. Check [Custom shaders](/foundryvtt-dice-so-nice/api/shaders/) and [System settings](/foundryvtt-dice-so-nice/api/system-settings/) to find more.

### Examples
```javascript
const HDSystem = new DiceSystem(
    'trs-housedivided',
    'A House Divided',
    'default',
    'The Rollsmith'
);
dice3d.addSystem(HDSystem);
```

## Making a system the default for a role

Use `setRoleDefaults(roleId)` to make your system the default for a [dice role](/foundryvtt-dice-so-nice/api/roles/). The `basic` role is the look of regular dice: set it to give new players your dice right away.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', (dice3d) => {
    const pack = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
    // regular dice
    pack.setRoleDefaults('basic');
    // with a matching colorset
    pack.setRoleDefaults('my-role1', { global: { colorset: 'my-dark-theme' } });
    // only the d20 of this role
    pack.setRoleDefaults('my-role2', { d20: {} });
    dice3d.addSystem(pack);
});
```

The second argument is optional. Its `global` slot and die type slots (`d4`, `d20`...) accept `colorset`, `texture`, `material`, `font`, `labelColor`, `diceColor`, `outlineColor`, `edgeColor` and `systemSettings`. Every slot you give uses your system.

:::note
When two packages set the same field of the same role, the last one wins.
:::

:::note[Players who already saved their settings]
The `basic` look is only a starting point: players who already saved their dice settings keep their own look.
:::

To set a role's look without a system of your own, like a colorset from a theme module, use [`addRole`](/foundryvtt-dice-so-nice/api/roles/#registering-a-role): `dice3d.addRole({ id: 'basic', defaults: { global: { colorset: 'my-colorful-theme' } } }, { package: 'my-module' })`.

To also give new players a special effect, see [Default special effects](/foundryvtt-dice-so-nice/api/sfx/#default-special-effects).

## Limiting a system to some roles

By default a system is listed for every role in the players' dice settings. Two methods change that:

- `includeRoles(...roleIds)`: list the system only for these roles.
- `excludeRoles(...roleIds)`: hide the system from these roles.

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', (dice3d) => {
    const base = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
    base.includeRoles('basic');
    base.setRoleDefaults('basic');

    const variant = new DiceSystem('my-dice-role1', 'My Dice', 'default', 'My Dice Pack');
    variant.includeRoles('my-role1');
    variant.setRoleDefaults('my-role1');

    dice3d.addSystem(base);
    dice3d.addSystem(variant);
    // then add the presets of each system with dice3d.addDicePreset
});
```

These lists only change what players can pick.

## Preloading Presets

If your system registers internal presets that users may never select in their settings, you can force-preload them to avoid a lag on the first roll that uses them. Call this once after registering your presets from the `diceSoNiceReady` hook.

```javascript
/**
 * Force preload of every dice preset registered under a given system id.
 * Useful for systems that register internal presets users may never select
 * in their settings, avoiding first-roll lag.
 * @param {String} systemId
 * @returns {Promise<void>}
 */
dice3d.preloadPresets(systemId);
```

### Example
```javascript
Hooks.once('diceSoNiceReady', async (dice3d) => {
    // Register your system and presets first...
    dice3d.addSystem(mySystem);
    dice3d.addDicePreset({ type: "d6", labels: [...], system: "my-system" });

    // Then preload them
    await dice3d.preloadPresets("my-system");
});
```
