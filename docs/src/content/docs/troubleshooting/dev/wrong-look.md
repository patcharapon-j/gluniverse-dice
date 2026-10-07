---
title: The dice don't have the look I expect
description: Why dice can use another character's look, ignore a flavor color, or roll as a plain numbered die.
---

First rule out the table's settings, see [The dice don't look like mine](/foundryvtt-dice-so-nice/troubleshooting/user/wrong-look/).

1. **A message holds the rolls of several characters.** With "Use character owner's dice appearance", all its rolls use the look of the speaker's player. Set `roll.data.actorId` on each roll, see [Rolls of several characters](/foundryvtt-dice-so-nice/api/quick/rolls/rolls-for-several-actors/).
2. **No speaker was passed to the API.** `animateRoll` and `showForRoll` need a `speaker` for the character owner's look and the per-actor appearance.
3. **A flavor color is ignored.** A player who turns off "Apply optional dice role appearances" sees no flavor colors. Use `options.appearance` for a look that must always apply, see [One roll, one look](/foundryvtt-dice-so-nice/api/quick/looks/per-roll-appearance/).
4. **A custom die rolls as a plain numbered die.** It has no dice preset, or its denomination is listed in a dice role: it then rolls as the regular die of its size. Give it its own dice preset, see [A new kind of die](/foundryvtt-dice-so-nice/api/quick/looks/custom-die/).

## Full documentation

- [Per-roll appearance in multi-actor messages](/foundryvtt-dice-so-nice/api/integration/#step-5-per-roll-appearance-in-multi-actor-messages)
- [Appearance resolution](/foundryvtt-dice-so-nice/api/roles/#appearance-resolution)
