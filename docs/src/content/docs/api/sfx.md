---
title: Special Effects API
description: API for interacting with the Dice So Nice Special Effects manager, including triggers and custom SFX classes.
---

Developers can interact with the Special Effects manager from Dice So Nice.
It is possible to directly trigger an effect or to add a trigger that can be customized by users.

## Adding a type of trigger
This is useful for systems where basic rolls are made of more than one die. For example, a system based on 3d6 may wish to add a type of trigger that will be activated when the three D6 roll a specific total.

Triggers should be added in the `diceSoNiceReady` [hook](/foundryvtt-dice-so-nice/api/hooks/).

```javascript
/**
 * Add a new type of SFX trigger that can be customized by users.
 * This trigger can then be pulled by a system, a module or a macro
 * @param {String} id : Identifier of the trigger, ex: fate4df
 * @param {String} name : Localized name of the trigger, ex: Fate Roll
 * @param {Array(String|Object)} results : Array of possible results for this trigger, 
 *        ie: ["-3","3","0"]
 *        A result can also be an object with a localized name,
 *        ie: [{id: "hope", name: "With Hope"}]
 * @returns
 */
game.dice3d.addSFXTrigger(id, name, results);
```

### Example
```javascript
game.dice3d.addSFXTrigger('fate4df', 'Fate Roll', [
    '-4','-3','-2','-1','0','1','2','3','4'
]);
```

### Example with named results
When the results are not numbers, you can give each one a localized name. The `name` is what users see in the special effects settings. The `id` is what `options.sfx.result` must match when [activating the trigger](#activating-a-trigger).

```javascript
game.dice3d.addSFXTrigger('duality', 'Duality Dice', [
    { id: 'hope', name: 'With Hope' },
    { id: 'fear', name: 'With Fear' },
    { id: 'critical', name: 'Critical' }
]);
```

## Activating a trigger
To activate a trigger, you have to pass it as options on the targeted DiceTerm in your roll.

```javascript
let r = await new Roll('4df').evaluate();
r.dice[0].options.sfx = { id: 'fate4df', result: r.result };
r.toMessage();
```

## Default special effects
Your package can give new players default special effect lines. Players find them in their **Special Effects** settings and can edit or delete them like their own lines.

With a `DiceSystem`, add one line per call with `addSFXDefault`:

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

Hooks.once('diceSoNiceReady', (dice3d) => {
    const pack = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
    pack.addSFXDefault({ diceType: 'd20', onResult: ['20'], specialEffect: 'PlayAnimationParticleSparkles' });
    dice3d.addSystem(pack);
});
```

Without a `DiceSystem`, use `dice3d.addSFXDefaults`:

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSFXDefaults([
        { diceType: 'd20', onResult: ['20'], specialEffect: 'PlaySoundEpicWin' },
        { mode: 'advanced', formula: 'd20 == 1', specialEffect: 'PlaySoundEpicFail' }
    ]);
});
```

A line has the same fields as a line in the settings:

- **diceType** - a die type (`"d20"`) or the id of a [custom trigger](#adding-a-type-of-trigger).
- **onResult** - the results that play the effect (`["20"]`, `["critical"]`).
- **specialEffect** - the effect id, see [`getSFXModes()`](#listing-available-special-effects).
- **options** (optional) - the effect options, for example `{ path: 'modules/my-module/sounds/crit.ogg' }` for `PlaySoundCustom`.

For an advanced line, replace `diceType` and `onResult` with `mode: 'advanced'` and a [formula](/foundryvtt-dice-so-nice/guide/special-effects/#advanced-triggers-formulas).

:::note[Players who already saved their settings]
Default lines only go to players who never saved their special effects.
:::

## Triggering a special effect
You can also pass a fully defined special effect to a roll that will be played regardless of the users' settings.
We recommend to system developers to add a setting for users to disable these automated effects if they wish to.
Note that some special effects may need additional arguments, like when playing a custom sound.

```javascript
let r = await new Roll('3df').evaluate();
r.dice[0].options.sfx = {
    specialEffect: 'PlaySoundCustom',
    options: { path: 'systems/fate/sounds/fanfare.mp3' }
};
r.toMessage();
```

### Playlist Support for PlaySoundCustom

Instead of specifying a file path, you can provide a Foundry playlist ID. A random sound from that playlist will be played each time the effect triggers.

```javascript
let r = await new Roll('3df').evaluate();
r.dice[0].options.sfx = {
    specialEffect: 'PlaySoundCustom',
    options: { playlistId: 'PLAYLIST_ID' }
};
r.toMessage();
```

If both `path` and `playlistId` are provided, the playlist takes priority.

## Listing available special effects
You can retrieve the list of available SFX modes (id -> localized name) from Dice So Nice.

```javascript
const sfxModes = game.dice3d.getSFXModes();
```

## Add a new type of Special Effect

You need a couple of things to create a new type of special effect. First is to make your own Special Effect class by extending the `DiceSFX` class from Dice So Nice.

For this, you need to import it from the `api.js` file in the `dice-so-nice` module folder.

Then, you need to override at least the `init` and `play` methods.
Please check our [Special Effects classes](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/tree/master/module/sfx?ref_type=heads) to see what is currently possible.

It is also possible to import the ThreeJS library to directly interact with the 3D engine and create whatever you can imagine.

Finally, you need to register your class to the Dice So Nice module using this API call:

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    dice3d.addSFXMode(PlayMyCustomSFX);
});
```

Below is a demo of a custom Special Effect class that plays a video file on top of the dice triggering the sfx.

```javascript
import { DiceSFX } from '../dice-so-nice/api.js';
import {
    VideoTexture,
    MeshBasicMaterial,
    PlaneGeometry,
    Mesh
} from '../dice-so-nice/libs/three.module.min.js';

/********************************
 * SFX: PlayMyCustomSFX
 *******************************/
class PlayMyCustomSFX extends DiceSFX {
    static id = 'PlayMyCustomSFX';
    static specialEffectName = 'My Custom SFX';
    static videoFile = 'modules/my-module/assets/my-super-video.webm';
    static videoTexture = null;
    static videoMaterial = null;

    constructor(box, dicemesh) {
        super(box, dicemesh);
        this.enableGC = true;
    }

    static async init() {
        const video = document.createElement('video');
        video.src = this.videoFile;
        video.crossOrigin = 'anonymous';
        video.loop = false;
        video.muted = false;
        video.playsInline = true;

        this.videoTexture = new VideoTexture(video);
        this.videoMaterial = new MeshBasicMaterial({
            map: this.videoTexture,
            transparent: true
        });
    }

    async play() {
        const geometry = new PlaneGeometry(720, 1024);

        // Move the geometry's origin to the bottom center
        geometry.translate(-35, 512 - 30, 0);

        this.plane = new Mesh(geometry, PlayMyCustomSFX.videoMaterial);
        let scale = (this.box.dicefactory.baseScale / 100) * 0.3;
        this.plane.scale.set(scale, scale, scale);

        // Position the plane
        this.plane.position.copy(this.dicemesh.parent.position);

        // Adjust Z position to be just above the dice
        this.plane.position.z += this.dicemesh.geometry.boundingSphere.radius;

        this.box.scene.add(this.plane);
        const video = PlayMyCustomSFX.videoTexture.image;
        video.currentTime = 0;
        video.play();

        // Set up a listener for when the video ends
        video.onended = () => {
            this.destroy();
        };
    }
    destroy() {
        if (this.plane) {
            this.box.scene.remove(this.plane);
            this.plane.geometry.dispose();
        }
        const video = PlayMyCustomSFX.videoTexture.image;
        video.pause();
        video.currentTime = 0;
        this.destroyed = true;
    }
}
```
