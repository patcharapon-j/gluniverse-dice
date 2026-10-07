---
title: My roll shows no dice
description: The reasons in your code a roll shows no 3D dice, in the order you can check them.
---

First rule out the table's settings, see [No dice, or not all of them](/foundryvtt-dice-so-nice/troubleshooting/user/no-dice/). Then check these in order.

1. **The roll never goes to the chat.** Dice So Nice! only watches chat messages. Show the dice yourself with [animateRoll](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/).
2. **The roll has no dice.** A roll like `new Roll("5")` has nothing to throw.
3. **Something turned it off for this message.** The `dice-so-nice.skip` flag, a module setting `willTrigger3DRoll` to `false` in `diceSoNiceMessagePreProcess`, or `game.dice3d.messageHookDisabled` on this client.
4. **Only the other players see no dice.** `showForRoll` without `synchronize` only plays on the screen that calls it. Pass `true`, or use [animateRoll](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/), which always sends the dice to the others.
5. **Dice So Nice! can't show this die.** A die with an unusual number of faces (a d9, a d13...) is left out.

## Next steps

- `game.dice3d` doesn't exist on clients where Dice So Nice! doesn't run (the stream view, or with the 3D canvas turned off). Check it before calling the API.

## Full documentation

- [Disabling/Enabling the 3D animation programmatically](/foundryvtt-dice-so-nice/api/roll/#disablingenabling-the-3d-animation-programmatically)
- [diceSoNiceMessagePreProcess](/foundryvtt-dice-so-nice/api/hooks/#dicesonicemessagepreprocess)
