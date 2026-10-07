---
title: Players see the dice of a secret roll
description: The API calls that decide who sees the dice of a GM or blind roll.
---

First rule out the table's settings, see [Players see my secret rolls](/foundryvtt-dice-so-nice/troubleshooting/user/secret-rolls/).

1. **The roll is shown with `showForRoll` and `synchronize`.** The calling client decides for everybody, and only the users list you pass hides the dice from others. Use [animateRoll](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/) instead: each client applies the same rules as for a chat roll.
2. **You changed `context.users` in `diceSoNiceRollStart`.** It is only read by `showForRoll` with `synchronize`. To hide a roll on one client, set `context.blind = true`, see [Before a roll plays](/foundryvtt-dice-so-nice/api/quick/react/before-a-roll/).

## Full documentation

- [Animating a roll without a chat message](/foundryvtt-dice-so-nice/api/roll/#animating-a-roll-without-a-chat-message)
- [Using the FVTT Roll class](/foundryvtt-dice-so-nice/api/roll/#using-the-fvtt-roll-class)
