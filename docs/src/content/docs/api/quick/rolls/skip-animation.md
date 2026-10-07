---
title: Don't animate a roll
description: Keep a whole message, one die or one inline roll out of the 3D animation.
---

Pick the smallest scope you need.

**A whole message:** set the `dice-so-nice.skip` flag when you create it. This works on every client.

```javascript
let r = await new Roll('2d6').evaluate();
await ChatMessage.create({
    rolls: [r],
    flags: { 'dice-so-nice': { skip: true } }
});
```

**One die of a roll:** set `hidden` on its result. The other dice still roll.

```javascript
let r = await new Roll('1d20+1d6').evaluate();
//only show the d6
r.dice[0].results[0].hidden = true;
r.toMessage();
```

**One inline roll:** add the `inline-dsn-hidden` CSS class to the inline roll element.

**Decided by your code at the last moment:** use the `diceSoNiceMessagePreProcess` hook, see [Before a roll plays](/foundryvtt-dice-so-nice/api/quick/react/before-a-roll/).

## Next steps

- `game.dice3d.messageHookDisabled = true` turns the detection off on the current client only. Other players still see the dice, so prefer the flag.

## Full documentation

- [Disabling/Enabling the 3D animation programmatically](/foundryvtt-dice-so-nice/api/roll/#disablingenabling-the-3d-animation-programmatically)
- [Hiding a dice from a roll animation](/foundryvtt-dice-so-nice/api/roll/#hiding-a-dice-from-a-roll-animation)
