---
title: Play some dice after others
description: Use rollOrder to animate the rolls of one message one group after the other.
---

The rolls of one message animate together. Set a `rollOrder` on a Roll, or on one of its dice terms, to play them in groups: the same value animates together, the groups play in ascending order.

```javascript
let attack = await new Roll('d20').evaluate();
attack.options.rollOrder = 1;

let damage = await new Roll('2d6').evaluate();
damage.options.rollOrder = 2; // animates after the attack

ChatMessage.create({ rolls: [attack, damage] });
```

## Next steps

- A value set on a dice term wins over the value of its Roll.
- Dice with no `rollOrder` animate in the first group.

## Full documentation

- [Select roll order for multiple rolls](/foundryvtt-dice-so-nice/api/integration/#step-4-select-roll-order-for-multiple-rolls)
