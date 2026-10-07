---
title: Choose who sees the dice yourself
description: With showForRoll, you decide which users see the dice of a roll, and every client plays the same animation.
---

`game.dice3d.showForRoll` is the low-level method: you decide who sees what, and every client plays the same animation. For most rolls without a chat message, [animateRoll](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/) is simpler, and each client applies the same rules as for a chat roll.

```javascript
const roll = await new Roll('2d6').evaluate();
// show it to the current user and to the GMs
const gms = game.users.filter(user => user.isGM).map(user => user.id);
await game.dice3d.showForRoll(roll, game.user, true, [game.user.id, ...gms]);
```

The third argument (`synchronize`) sends the animation to the other clients. The fourth is the list of users who can see it, `null` for everyone.

## Next steps

- Pass a `speaker` (seventh argument) so the hidden NPC rolls setting applies.
- The promise resolves when the animation ends, with `true` if the dice were shown.

## Full documentation

- [Using the FVTT Roll class](/foundryvtt-dice-so-nice/api/roll/#using-the-fvtt-roll-class)
