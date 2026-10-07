---
title: Let players throw the dice by hand
description: Ask for an interactive throw on an important roll, or refuse it on bulk rolls.
---

With interactive throws, a player rolls by picking up the 3D dice on the tabletop and throwing them. Foundry still decides the result. The GM and each player choose in their settings when it happens, and your code can ask for it, or refuse it, on a given roll with the `dice-so-nice.interactive` flag.

```javascript
let r = await new Roll('1d20').evaluate();
await r.toMessage({
    flags: { 'dice-so-nice': { interactive: true } }
});
```

`interactive: false` refuses it, for bulk NPC rolls where nobody wants to throw dice by hand. The flag is read once, when the message is created.

## Hooks

Your automation is not delayed, because the roll is evaluated before the throw starts. When something must wait for the dice, use `game.dice3d.waitFor3DAnimationByMessageID` or the `diceSoNiceRollComplete` hook, which wait for the last thrown die.

```javascript
//a pending throw opened for this message
Hooks.on('diceSoNicePendingThrowOpened', (messageId) => {});
//the pending throw ended on this client
Hooks.on('diceSoNicePendingThrowClosed', (messageId) => {});
```

## Next steps

- A player at "never", or a world with interactive throws disabled, always refuses.
- The roll must be public and contain dice Dice So Nice! can show in 3D.

## Full documentation

- [Interactive Throws](/foundryvtt-dice-so-nice/api/interactive-throws/)
