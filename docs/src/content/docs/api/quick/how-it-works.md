---
title: How Dice So Nice works
description: What Dice So Nice! does with your rolls, and the places where your code can step in.
---

Once enabled, Dice So Nice! watches new chat messages. When a message carries rolls (its `rolls` array is not empty), it hides the message, throws 3D dice that land on the results Foundry already rolled, then shows the message when the dice stop.

Foundry always decides the result, and Dice So Nice! only shows it. The dice bounce with real physics, then the face on top is turned to match the result.

So for most systems and modules there is nothing to do. Post your roll with `roll.toMessage()` and the dice show up:

```javascript
let r = await new Roll('1d20').evaluate();
r.toMessage();
```

Each client decides what it shows, with the same rules as the chat message:

- a whispered or blind roll shows ghost dice, or no dice, depending on the world settings
- the dice use the look of the player who rolled, or of the player who owns the character
- each player can turn the 3D dice off, or only see their own dice

## Where your code steps in

- **Before the dice:** change, hide or cancel a roll with hooks. See [Before a roll plays](/foundryvtt-dice-so-nice/api/quick/react/before-a-roll/).
- **The dice themselves:** colors, faces, roles, 3D models and effects. See [Start here](/foundryvtt-dice-so-nice/api/start/#looks).
- **After the dice:** wait for them to land before you show something. See [After the dice land](/foundryvtt-dice-so-nice/api/quick/react/after-the-dice-land/).
- **No chat message:** show the dice of a roll that never goes to the chat. See [Animate a roll without a chat message](/foundryvtt-dice-so-nice/api/quick/rolls/animate-roll/).

## Full documentation

- [Integration](/foundryvtt-dice-so-nice/api/integration/)
- [Roll API](/foundryvtt-dice-so-nice/api/roll/)
