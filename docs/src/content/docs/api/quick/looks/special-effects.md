---
title: Play effects when a result comes up
description: Add special effect triggers for your rolls, give new players default effects, or write your own effect.
---

Players bind special effects (sounds, glow, explosions...) to dice results in their settings. Your package can add to that in three ways, all from the `diceSoNiceReady` hook.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    // a trigger for your own results, that players can bind effects to
    dice3d.addSFXTrigger('duality', 'Duality Dice', [
        { id: 'hope', name: 'With Hope' },
        { id: 'fear', name: 'With Fear' }
    ]);

    // default effect lines for new players
    dice3d.addSFXDefaults([
        { diceType: 'd20', onResult: ['20'], specialEffect: 'PlaySoundEpicWin' }
    ]);
});

// then, on a roll, tell which result of the trigger came up
let r = await new Roll('2d12').evaluate();
r.dice[0].options.sfx = { id: 'duality', result: 'hope' };
r.toMessage();
```

## Next steps

- `options.sfx` can also force an effect on a roll, whatever the players' settings.
- `dice3d.getSFXModes()` lists the effect ids.
- Write a new effect by extending `DiceSFX` and registering it with `dice3d.addSFXMode`.

## Full documentation

- [Special Effects API](/foundryvtt-dice-so-nice/api/sfx/)
