---
title: Run your code once the dice land
description: Wait for the end of a 3D animation before showing results or applying effects.
---

How you wait depends on how the roll was shown.

**A chat message:** wait for that message.

```javascript
let r = await new Roll('d12').evaluate();
let msg = await r.toMessage();
await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
//the dice landed
```

**Any chat roll, from a hook:** `diceSoNiceRollComplete` gives the message ID, and the IDs of the companion messages revealed with it.

```javascript
Hooks.on('diceSoNiceRollComplete', (messageId, companionIds) => {
    //...
});
```

**The API (`animateRoll`, `showForRoll`, `show`):** wait for the promise it returns. These rolls never fire `diceSoNiceRollComplete`.

## Next steps

- With interactive throws, all of these wait for the last die thrown by the player.
- When the GM turns on "Display chat message immediately", the messages show at once and `waitFor3DAnimationByMessageID` resolves right away.

## Full documentation

- [Detecting the end of a 3D Roll animation](/foundryvtt-dice-so-nice/api/roll/#detecting-the-end-of-a-3d-roll-animation-for-a-specific-message)
- [diceSoNiceRollComplete](/foundryvtt-dice-so-nice/api/hooks/#dicesonicerollcomplete)
