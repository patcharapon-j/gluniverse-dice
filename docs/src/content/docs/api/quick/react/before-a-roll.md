---
title: Change, hide or cancel a roll before it plays
description: The two hooks that let your code decide about a roll before its dice are thrown.
---

Two hooks run before the dice are thrown.

**`diceSoNiceMessagePreProcess`** decides if a chat message is animated at all. Flip `willTrigger3DRoll` to force or suppress the animation.

```javascript
Hooks.on('diceSoNiceMessagePreProcess', (messageId, interception) => {
    // suppress the 3D animation for this message
    interception.willTrigger3DRoll = false;
});
```

**`diceSoNiceRollStart`** runs when the dice are about to be thrown, on each client that shows them. Change the roll in `context`, hide it on this client with `context.blind`, or put another roll to show in `context.dsnRoll` without touching the real one.

```javascript
Hooks.on('diceSoNiceRollStart', (messageId, context) => {
    //hide this roll on this client
    context.blind = true;
});
```

## Next steps

- `messageId` is `null` for `animateRoll`, and for `showForRoll` unless you pass it a message ID.
- To skip one message from the start, the `dice-so-nice.skip` flag is simpler, see [Don't animate a roll](/foundryvtt-dice-so-nice/api/quick/rolls/skip-animation/).

## Full documentation

- [diceSoNiceMessagePreProcess](/foundryvtt-dice-so-nice/api/hooks/#dicesonicemessagepreprocess)
- [diceSoNiceRollStart](/foundryvtt-dice-so-nice/api/hooks/#dicesonicerollstart)
