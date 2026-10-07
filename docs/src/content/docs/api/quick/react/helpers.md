---
title: Read what Dice So Nice has loaded
description: List the loaded dice systems, dice roles and special effects, for example to build your own settings screen.
---

These calls list what Dice So Nice! has loaded:

```javascript
// Map<systemId, DiceSystem>
const systems = game.dice3d.getLoadedDiceSystems();

// the dice roles, and one role by its id
const roles = game.dice3d.getRoles();
const hope = game.dice3d.getRole('hope');

// effect id -> localized name
const sfxModes = game.dice3d.getSFXModes();
```

## Next steps

- Use them to build your own dice settings dialog, or to check that a dice system is loaded before you use it.

## Full documentation

- [Accessing the list of Dice Systems](/foundryvtt-dice-so-nice/api/roll/#accessing-the-list-of-dice-systems)
- [Reading roles](/foundryvtt-dice-so-nice/api/roles/#reading-roles)
- [Listing available special effects](/foundryvtt-dice-so-nice/api/sfx/#listing-available-special-effects)
