---
title: The result shows before the dice land
description: Why a message or a result can appear while the dice are still rolling, and how to keep it hidden.
---

First rule out the table's settings, see [The result shows before the dice land](/foundryvtt-dice-so-nice/troubleshooting/user/too-early/).

1. **The result is in another message.** Link that message to the roll message with a [companion link](/foundryvtt-dice-so-nice/api/quick/rolls/several-messages/), and create the roll message first.
2. **The result is in a part of another chat message.** Wrap it in an element with a `data-message-id` attribute, see [Hide a result shown in another chat message](/foundryvtt-dice-so-nice/api/quick/rolls/result-in-another-message/).
3. **The roll was added to an existing message, and your chat message doesn't use `.dice-roll`.** During a message update, Dice So Nice! only hides the elements matching `.dice-roll`. Tell it your own selector:

```javascript
Hooks.on("diceSoNiceInit", (dice3d) => {
    dice3d.setMessageUpdateHideSelector(".dice-result");
});
```

4. **The message was never animated.** Everything in [My roll shows no dice](/foundryvtt-dice-so-nice/troubleshooting/dev/no-dice/) also leaves the message visible.

## Full documentation

- [Customizing which elements are hidden during a message update](/foundryvtt-dice-so-nice/api/roll/#customizing-which-elements-are-hidden-during-a-message-update)
- [Companion Messages](/foundryvtt-dice-so-nice/api/companion-messages/)
