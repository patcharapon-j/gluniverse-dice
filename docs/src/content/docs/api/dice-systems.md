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
 * The group is a string used to group systems in the list.
 *   Could be the name of the brand or a collection.
 * The mode: "preferred" or "default".
 *   "preferred" enables this system by default until
 *   a user changes it. "default" adds it as a choice.
 * @param {DiceSystem} mySystem
 */
const mySystem = new DiceSystem(id, name, mode, group);
dice3d.addSystem(mySystem);
```
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

## Role defaults on a dice preset

A `DiceSystem` can carry role defaults. They are registered when the system is added, with the same merge rule as [`addRole`](/foundryvtt-dice-so-nice/api/roles/#registering-a-role):

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

const pack = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
pack.roleDefaults = {
    hope: { global: { system: 'my-dice', colorset: 'my-hope-theme' } },
    fear: { global: { system: 'my-dice', colorset: 'my-fear-theme' } }
};
dice3d.addSystem(pack);
```

## Limiting a system to some roles

By default a system is listed in the dice appearance pickers of every role. A `DiceSystem` can narrow that with two lists of role ids (`basic` included):

- `includeRoles`: the system is only listed for these roles.
- `excludeRoles`: the system is never listed for these roles. It wins over `includeRoles`.

A system can only carry one 3D model per die type, so a set with a different model for some roles ships one system per model. The lists keep each one where it belongs, and the systems can share the same name:

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

const base = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
base.includeRoles = ['basic'];

const hope = new DiceSystem('my-dice-hope', 'My Dice', 'default', 'My Dice Pack');
hope.includeRoles = ['hope'];
hope.roleDefaults = { hope: { global: { system: 'my-dice-hope' } } };

const fear = new DiceSystem('my-dice-fear', 'My Dice', 'default', 'My Dice Pack');
fear.includeRoles = ['fear'];
fear.roleDefaults = { fear: { global: { system: 'my-dice-fear' } } };

dice3d.addSystem(base);
dice3d.addSystem(hope);
dice3d.addSystem(fear);
```

The lists only filter the pickers. A system a player already chose for a role stays listed and keeps rendering, and a role left on "Inherit" still takes the basic system, even when that system excludes the role. Point each role at its own system with role defaults, as above.

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
