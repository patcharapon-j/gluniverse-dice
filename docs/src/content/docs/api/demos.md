---
title: Demos
description: Examples of systems, modules, and macros integrating the Dice So Nice API.
---

Here are listed multiple systems, modules and macros integrating the 'Dice So Nice!' API. This list is intended for developers as a way to better understand how the 'Dice So Nice!' API works.

If you are instead looking for a list of modules expanding 'Dice So Nice!', please see the [Link page](/foundryvtt-dice-so-nice/addons/)

## Systems

### Warhammer Fantasy Roleplay
This system use the Roll API in order to deal with its multi-part custom roll messages.

https://github.com/moo-man/WFRP4e-FoundryVTT/blob/master/src/system/rolls/test-wfrp4e.js

### 13th Age
This system adds a customized d20 face and rolls some actions with some determined color schemes (like a special color for the damage die). Note: this project is archived (read-only).

https://gitlab.com/asacolips-projects/foundry-mods/archmage/-/blob/master/module/archmage.js#L300

### Starwars-FFG
This system has a lot of special dice and integrates DsN with some custom webfonts, custom colorsets and custom die terms.

https://github.com/StarWarsFoundryVTT/StarWarsFFG/pull/258/files

### Alien RPG
This system use two custom terms and fully customized dice.

https://github.com/pwatson100/alienrpg

## Modules

### Szimfonia Dice Roller
This module only purpose is to add a custom special die for the TTRPG **Szimfonia**. This is a good example on how to add a custom term and integrate it with 'Dice So Nice!'

https://github.com/JiDW/FVTT-Szimfonia

### Vampire 5th Dice Roller
Adds the ability to roll a Vampire: The Masquerade 5th die.

https://github.com/Musrha/vampire-5th-dice-roller

## Macros

### Simple roll with DsN support
#### Chat
```
/r 2d20
```
#### Chat with "Inline rolls"
```
[[1d20]]
```
#### Script
```javascript
let r = await new Roll('2d20').evaluate();
r.toMessage();
```

### Sequencer animation under a die
A macro for the [Macro special effect](/foundryvtt-dice-so-nice/guide/special-effects/#macro) that plays a [JB2A](https://foundryvtt.com/packages/JB2A_DnD5e) animation under the die, with [Sequencer](https://foundryvtt.com/packages/sequencer). Create it as a script macro, then pick it in a special effects line.

`game.dice3d.getScreenPosition` gives the position of the die on the screen. Sequencer's screen space plays the animation at that position, under the 3D dice, and in screen pixels so the canvas zoom doesn't change its size.

```javascript
const { dicemesh } = scope;
const pos = game.dice3d.getScreenPosition(dicemesh);
if (!pos) return;

// size of the die on screen: project a copy of it moved one radius to the right
if (!dicemesh.geometry.boundingSphere) dicemesh.geometry.computeBoundingSphere();
const edge = dicemesh.clone(false);
dicemesh.getWorldPosition(edge.position).x += dicemesh.geometry.boundingSphere.radius * dicemesh.getWorldScale(edge.scale).x;
const dieSize = 2 * (game.dice3d.getScreenPosition(edge).x - pos.x);

new Sequence()
    .effect()
        .file("jb2a.particle_burst.01.circle.bluepurple")
        .screenSpace()
        .screenSpaceAnchor({ x: 0, y: 0 }) // pos is measured from the top left corner of the screen
        .screenSpacePosition(pos)
        .size(dieSize * 3)
        .locally() // every client runs the macro with its own screen position
    .play();
```
