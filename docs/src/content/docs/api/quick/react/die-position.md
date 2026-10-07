---
title: Get the position of a die on screen
description: Where a die is on the screen, in CSS pixels.
---

`game.dice3d.getScreenPosition` gives the position of a die on the screen, in CSS pixels. It returns `null` when the 3D canvas is not ready.

```javascript
const pos = game.dice3d.getScreenPosition(dicemesh);
if (pos) {
    //pos.x and pos.y, in CSS pixels
}
```

The die mesh comes with the dice events, or with the Macro special effect, which runs a macro when a result comes up.

## Next steps

- For example, the demos page has a macro that plays a JB2A animation under the die with Sequencer.

## Full documentation

- [Getting the screen position of a die](/foundryvtt-dice-so-nice/api/roll/#getting-the-screen-position-of-a-die)
- [Sequencer animation under a die](/foundryvtt-dice-so-nice/api/demos/#sequencer-animation-under-a-die)
