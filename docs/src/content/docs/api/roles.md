---
title: Dice Roles
description: Detect what each die means in your game (hope, fear, fire...) and give each role its own appearance.
---

A **role** is what a die means in your game: `hope`, `wild`, `fire`, `acid`... Every die has exactly one role. `basic` is the default and is what a player's regular appearance settings describe. Every other role resolves to its own appearance, so a `hope` d12 can use a different preset and theme than a basic d12.

Detection runs in this order and the first match wins:

1. **Explicit role** set by the system: `term.options.dsnRole` on a die term, or a `role` path declared through [`getDSNProperties()`](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties) on the Roll class.
2. **Modifier token** declared by a role (`detectors.modifiers`). The token is matched exactly against the modifier command: `h` matches `h` and `h2`, not `hp`.
3. **`term.options.type`** then **`term.options.flavor`** matched against `detectors.types` of every role, then against the built-in damage type ids. `Roll.options.type` and `Roll.options.flavor` are merged down into each contained die term, so a system can set them once at the roll level.

Dice that match nothing are `basic`. A player who turns off the **Apply optional dice role appearances** preference sends every *optional* role back to `basic`, whichever way it was detected: built-in damage types and roles created by the GM are optional, registered roles are not unless they say so.

## Tagging dice explicitly

```javascript
// on a die term
let r = await new Roll('1d12 + 1d12').evaluate();
r.dice[0].options.dsnRole = 'hope';
r.dice[1].options.dsnRole = 'fear';
r.toMessage();

// from the Roll class, resolved per roll scope
class DamageRoll extends Roll {
    getDSNProperties() {
        return { role: 'options.damageType' };
    }
}
```

Declaring `role` through `getDSNProperties()` makes Dice So Nice! ignore `.type` and `.flavor` for that roll's dice and trust the declared path only. See [Declaring Roll properties with `getDSNProperties`](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties) for the full convention.

## Registering a role

Systems and modules register roles from the `diceSoNiceReady` hook with `dice3d.addRole(role, { package })`. The package id is optional. Registering an id that already exists merges into it. When two packages set the same default field, the last one wins.

Registering `basic` with `defaults` gives regular dice a default look for new players, see [Basic dice](#basic-dice).

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    // detected through a roll modifier declared by the system's own die term
    dice3d.addRole({
        id: 'hope',
        label: 'Hope',
        group: 'My Game',
        customizable: true,
        dieTypes: ['d6', 'd12', 'd20'],
        defaults: { global: { colorset: 'radiant' } },
        detectors: { modifiers: ['h'] }
    }, { package: 'my-system' });

    // a damage type detected through the type or flavor of the roll
    dice3d.addRole({
        id: 'sacred',
        label: 'Sacred',
        group: 'DICESONICE.DamageTypes',
        optional: true,
        detectors: { types: ['sacred', 'holy'] },
        defaults: { global: { colorset: 'radiant' } }
    }, { package: 'my-system' });
});
```

A role record has the following fields:

- **id** - role id (`hope`, `fire`).
- **label** - display name, can be a localization key.
- **group** - group shown in the UIs (the name of your game, `"DICESONICE.DamageTypes"`...), can be a localization key.
- **customizable** - when `true`, players can pick this role in their dice settings and give it their own look. The GM can flip any role from the Dice Roles table.
- **optional** - when `true`, the player preference "Apply optional dice role appearances" turns this role off. Defaults to `false`: set it on roles that are a coloring convention laid over the player's dice (damage types) rather than dice of their own. The GM can flip it from the Dice Roles table.
- **dieTypes** - optional die type whitelist (`["d6", "d12"]`). Only narrows what the player settings show for this role; it does not affect detection or resolution.
- **defaults** - the default appearance of the role: `{ global?: {...}, d4?: {...}, d12?: {...} }`. Each slot accepts the same fields as a player appearance (`colorset`, `system`, `texture`, `material`, `font`, `labelColor`, `diceColor`, `outlineColor`, `edgeColor`...). Missing fields are inherited.
- **detectors** - `{ modifiers?: [...], types?: [...] }`. `modifiers` are roll modifier tokens declared by the system's own dice term class, `types` are matched against the type or flavor of the roll.

## Roles and dice systems

A `DiceSystem` can make itself the default for roles with `setRoleDefaults`, and be listed only for some roles with `includeRoles` and `excludeRoles`. This is how a dice set ships a different 3D model for some roles. See [Making a system the default for a role](/foundryvtt-dice-so-nice/api/dice-systems/#making-a-system-the-default-for-a-role) and [Limiting a system to some roles](/foundryvtt-dice-so-nice/api/dice-systems/#limiting-a-system-to-some-roles).

## Appearance resolution

For a die in a role, each appearance field is resolved separately and the first value found wins:

1. the player's own appearance for that role, when the role is customizable
2. the world appearance set by the GM in the Dice Roles table
3. the defaults registered with `addRole` or `setRoleDefaults`
4. the player's basic global appearance

At each step the slot of the die type is read before the global slot. Per-actor appearance and the "Force roll appearance to owner" setting apply to roles the same way they apply to basic dice. A die's own `options.appearance`, when a system sets one, is merged last and wins over the whole role resolution.

Role appearances can also reference a die from the [Dice Library](/foundryvtt-dice-so-nice/guide/dice-library/). World appearances reference dice from the world library, which the GM edits and every client can read.

### Basic dice

Basic dice don't follow this list: they use the player's own settings. Defaults registered for `basic` are only the look a player starts with.

## Built-in roles

The following damage types are built-in roles in the "Damage Types" group: `fire`, `acid`, `cold`, `radiant`, `poison`, `thunder`, `lightning`, `air`, `water`, `earth`, `force`, `psychic`, `necrotic`, `ice`. Each is detected through its id and defaults to the matching colorset.
