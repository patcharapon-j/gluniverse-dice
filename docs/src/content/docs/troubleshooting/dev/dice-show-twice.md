---
title: My dice show twice
description: The usual reasons the same roll is animated twice, and how to fix each one.
---

1. **The roll is shown by the API, then posted to the chat.** Dice So Nice! animates every chat message with rolls, so the dice play a second time. Post the message with the `dice-so-nice.skip` flag, or don't call the API for a roll you post.
2. **The API is called on every client.** `animateRoll` and `showForRoll` with `synchronize` already send the dice to the other players. When your code runs on every client (a hook like `updateActor`, for example), call it from one client only, like the user who made the change.
3. **The chat message shows the roll as an inline roll too.** The inline rolls of a message are animated with its rolls. Add the `inline-dsn-hidden` CSS class to the inline roll element.

## Full documentation

- [Skip animation for a specific message](/foundryvtt-dice-so-nice/api/roll/#skip-animation-for-a-specific-message-recommended)
- [From Inline Rolls](/foundryvtt-dice-so-nice/api/roll/#from-inline-rolls)
