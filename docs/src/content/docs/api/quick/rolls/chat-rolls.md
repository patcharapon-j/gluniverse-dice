---
title: Show dice for rolls posted in the chat
description: A chat message with Roll objects is animated by Dice So Nice! with no code on your side.
---

If your roll ends up in a chat message with a `rolls` array, Dice So Nice! detects it and animates it on its own. This is the case of `roll.toMessage()` and of `ChatMessage.create` with rolls. There is nothing to call.

```javascript
let r = await new Roll('1d20').evaluate();
ChatMessage.create({
    rolls: [r],
    content: 'My HTML Content'
});
```

The message stays hidden while the dice roll, and shows up when they land.

## Next steps

- Several rolls in one message animate together. To play some after the others, see [Roll order](/foundryvtt-dice-so-nice/api/quick/rolls/roll-order/).
- To keep one message out of it, see [Don't animate a roll](/foundryvtt-dice-so-nice/api/quick/rolls/skip-animation/).

## Full documentation

- [Integration](/foundryvtt-dice-so-nice/api/integration/#step-3-create-a-chat-message-with-the-required-data)
