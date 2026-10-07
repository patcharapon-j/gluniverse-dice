---
title: Rolls of several characters in one message
description: Give each roll of a group check the dice look of its own character's player.
---

When one message holds the rolls of several characters (a group skill check, for example), set `actorId` in the data of each Roll. Each roll then uses the dice look of that character's player, instead of the look of the message author.

```javascript
const rolls = [];
for (const actor of selectedActors) {
    const roll = await new Roll("1d20").evaluate();
    roll.data.actorId = actor.id;
    rolls.push(roll);
}
ChatMessage.create({ rolls });
```

## Next steps

- This follows the world setting that uses the character owner's dice look.

## Full documentation

- [Per-roll appearance in multi-actor messages](/foundryvtt-dice-so-nice/api/integration/#step-5-per-roll-appearance-in-multi-actor-messages)
