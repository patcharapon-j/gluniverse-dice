---
title: Animate a roll without a chat message
description: Show the 3D dice of a roll that never becomes a chat message, with the same visibility rules as a chat roll.
---

When a roll never becomes a chat message (a reroll inside an existing chat message, a saving throw stored in the flags of a message...), use `game.dice3d.animateRoll`. It works like `roll.toMessage(messageData, { messageMode })`, but it only shows the dice, on every connected client.

```javascript
// a reroll made from a chat message, shown to the users who can see that message
const message = game.messages.get(messageId);
const roll = await new Roll("1d20 + 5").evaluate();
await game.dice3d.animateRoll(roll, message);
```

The second argument is the chat message the roll belongs to. Only its author, speaker, whisper and blind are read. You can also pass plain data with these fields: add a `speaker` then, so the NPC and character owner settings apply.

## With a chat mode

Without a chat message, pass the chat mode instead, like you would with `toMessage`:

```javascript
const roll = await new Roll("1d20").evaluate();
const speaker = ChatMessage.getSpeaker({ actor });
await game.dice3d.animateRoll(roll, { speaker }, { messageMode: "gm" });
```

## Next steps

- The promise resolves when the dice land on this client.
- Don't post the same roll to the chat afterwards, or the dice show twice.

## Full documentation

- [Animating a roll without a chat message](/foundryvtt-dice-so-nice/api/roll/#animating-a-roll-without-a-chat-message)
