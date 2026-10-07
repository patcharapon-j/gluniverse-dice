---
title: Roll dice from a macro
description: "The few calls a macro needs: roll with 3D dice, wait for them, roll a library die, skip the animation."
---

In a macro, post the roll to the chat like in any other code, and the dice show up. To do something after they land, wait for them:

```javascript
let r = await new Roll('d12').evaluate();
let msg = await r.toMessage();
await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
console.log('Animation ended, do something now');
```

## Next steps

- Roll a die from your Dice Library by name with the `die:` flavor: `new Roll('1d6[die:Fire Oracle]')`.
- Load a saved dice appearance with `game.dice3d.loadSaveFile(name)`.
- To roll without 3D dice, see [Don't animate a roll](/foundryvtt-dice-so-nice/api/quick/rolls/skip-animation/).

## Full documentation

- [Macros](/foundryvtt-dice-so-nice/guide/macros/)
- [Rolling a library die by name](/foundryvtt-dice-so-nice/guide/dice-library/#rolling-a-library-die-by-name)
