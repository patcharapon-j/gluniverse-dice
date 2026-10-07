---
title: Give dice a meaning, like hope, fear or fire
description: Register dice roles so each kind of die in your game gets its own look.
---

A role is what a die means in your game: `hope`, `fear`, `fire`... Each role gets its own appearance, so a `hope` d12 can look different from a regular d12. Register your roles from the `diceSoNiceReady` hook, then tag the dice.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addRole({
        id: 'hope',
        label: 'Hope',
        group: 'My Game',
        customizable: true,
        defaults: { global: { colorset: 'radiant' } }
    }, { package: 'my-system' });
});

// then, on a roll
let r = await new Roll('1d12 + 1d12').evaluate();
r.dice[0].options.dsnRole = 'hope';
r.toMessage();
```

## Next steps

- Instead of tagging each die, a role can be detected from a modifier, a denomination, or the type or flavor of the roll.
- A Roll class can declare where its role lives with `getDSNProperties()`.
- The built-in damage types (`fire`, `acid`, `cold`...) are roles already.

## Full documentation

- [Dice Roles](/foundryvtt-dice-so-nice/api/roles/)
- [Declaring Roll properties with getDSNProperties](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties)
