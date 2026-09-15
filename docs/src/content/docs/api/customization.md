---
title: Colors & Themes
description: API for adding custom dice colors, textures, colorsets, and face presets to Dice So Nice.
---

'Dice So Nice' exposes an API for systems and modules to add their own customization.
You can either:
- Customize core FVTT dice
- Create a custom die based on an existing 3D shape
- Import a custom 3D model with animation support

This page describes how to add colors and textures to any already **existing** die.

If you wish to create your own special die (i.e., not numbered faces), please see [Custom Terms](/foundryvtt-dice-so-nice/api/terms/).
If you wish to import your own 3D models, see [Custom 3D Models](/foundryvtt-dice-so-nice/api/3d-models/).

## Key Concepts

Before diving into the API, here is how the customization layers fit together:

- **DicePreset** (faces) - Defines what appears on each face of a die: text labels, images, or icons. A preset is tied to a die type (d6, d20, etc.) and a System.
- **Texture** - A background image drawn on each face behind the label. Textures can use different canvas blending modes.
- **ColorSet** (theme) - A named color scheme that bundles foreground, background, outline, and edge colors together with a default texture, material, and font. Players select these as "Themes" in the settings.
- **System** - A named collection of DicePresets. When a player selects a system, all its presets activate at once. Systems can also include custom shaders, event listeners, and settings UI.
- **Material** - The rendering style of the dice surface (plastic, metal, glass, wood, chrome, stone, velvet, resin, frosted, pristine, iridescent).

A typical integration registers a System, adds DicePresets to it for each die type, and optionally provides matching ColorSets and Textures.

## What is customizable
- **Colors**: Single color or an array of colors to use at random for every supported element: background, label, outline, and edges.
- **Background texture**: Either a single texture file or an array of random texture files for every dices with a custom-defined blending mode
- **Faces**: Each dice can have custom faces. A face can be a string or an image file. The font and its size can be changed, and any Unicode character is supported (even symbols like emojis)

:::note[Supported image formats]
When a label, bump map, emissive map, or background entry is a file path, DsN supports the following formats: **PNG**, **JPG/JPEG**, **GIF**, and **WebP**. SVG files are not supported. Texture files should be **256x256 pixels**.
:::

## Listening to DiceSoNiceReady hook
Before using the customization API, you must ensure that "Dice So Nice" is ready. Please refer to the [Hooks](/foundryvtt-dice-so-nice/api/hooks/) section.
Your package should also be using es6 modules to be able to import "Dice So Nice" APIs

## Adding a custom model system (aka dice face preset)
A system (or "Dice Presets" for players) allows you to store a list of custom dice model and customize it with settings, animations or custom shaders.
```javascript
import { DiceSystem } from '../dice-so-nice/api.js';
/**
 * Register a new system
 * The id is to be used with the addDicePreset method
 * The name can be a localized string
 * The group is a string used to group systems in the list.
 *   Could be the name of the brand or a collection.
 * The mode: "preferred" or "default".
 *   "preferred" enables this system by default until
 *   a user changes it. "default" adds it as a choice.
 * @param {DiceSystem} mySystem
 */
const mySystem = new DiceSystem(id, name, mode, group);
dice3d.addSystem(mySystem);
```
### More info
You can do a lot more with "Dice So Nice" systems. Check [Custom shaders](/foundryvtt-dice-so-nice/api/shaders/) and [System settings](/foundryvtt-dice-so-nice/api/system-settings/) to find more.

### Examples
```javascript
const HDSystem = new DiceSystem(
    'trs-housedivided',
    'A House Divided',
    'default',
    'The Rollsmith'
);
dice3d.addSystem(HDSystem);
```
## Adding a custom DicePreset (dice faces)
A custom DicePreset will override a default dice type when its system is selected in the "Dice So Nice" settings.
Note: the texture files size have to be **256*256 pixels**

```javascript
/**
 * Register a new dice preset
 * @param {Object} data: The informations on the new dice preset (see below)
 * @param {String} (Optional) shape: should be explicit when using a custom die term.
 *        Supported shapes are d2,d4,d6,d8,d10,d12,d14,d16,d20,d24,d30,
 *        or the name of a custom physics shape registered with addDiceShape
 *        (requires a modelFile, see "Adding a custom physics shape" below)
 */
dice3d.addDicePreset(data, (shape = null));
```
The `data` parameter has the following attributes:
- **type** should be a registered dice term
- **labels** contains either string (Unicode) or a path to a texture (png, gif, jpg, webp)
- **system** should be a system ID previously registered
- (Optional) **colorset** is the name of a colorset (either a custom one or from the DsN colorset list)
- (Optional) **font** is the name of the font family. This can be a Webfont too. (ex: Arial, monospace, etc). This setting overwrites the colorset font setting
- (Optional) **fontScale** is the scale of the font size (default: 1). This setting overwrite the colorset fontScale setting
- (Optional) **bumpMaps** is an array of bumpMap textures that should follow the exact same order as labels
- (Optional) **values** is an object with the min and max value on the die
- (Optional) **emissiveMaps** is an array of emissive textures that should follow the exact same order as labels
- (Optional) **emissive** is the color of the light (hexa code) emited by the dice. Default: `0x000000` (no light)
- (Optional) **atlas** a TexturePacker JSON spritesheet containing labels/bumps/emissiveMaps. Can be shared across multiple types for a single spritesheet per dice set.
- (Optional) **backgrounds** an array of background image paths (one per face), drawn behind the label as a background layer.
- (Optional) **labelScale** scales the label image size (default: 1). Values > 1 make labels larger, < 1 smaller.
- (Optional) **scaleModifier** multiplier for the 3D mesh scale (default: 1). Useful for slightly larger or smaller dice.
### Examples
```javascript
dice3d.addDicePreset({
    type: 'd20',
    labels: [
        '1','2','3','4','5','6','7','8','9','10',
        '11','12','13','14','15','16','17','18','19',
        'systems/archmage/images/nat20.png'
    ],
    bumpMaps: [
        ,,,,,,,,,,,,,,,,,,,'systems/archmage/images/nat20_BUMP.png'
    ],
    system: '13A'
});

dice3d.addDicePreset(
    {
        type: 'da',
        labels: ['', 's', 's', 's\ns', 'a', 's', 's\na', 'a\na'],
        font: 'SWRPG-Symbol-Regular',
        colorset: 'green',
        system: 'swffg'
    },
    'd8'
);

dice3d.addDicePreset({
    type: 'd6',
    labels: ['1', '2', '3', '4', '5', '6'],
    backgrounds: [
        'modules/my-module/img/bg-1.webp',
        'modules/my-module/img/bg-2.webp',
        'modules/my-module/img/bg-3.webp',
        'modules/my-module/img/bg-4.webp',
        'modules/my-module/img/bg-5.webp',
        'modules/my-module/img/bg-6.webp'
    ],
    labelScale: 0.8,
    scaleModifier: 1.1,
    system: 'my-system'
});

dice3d.addDicePreset(
    {
        type: 'df',
        labels: [
            'eye','1','2','3','4','5','6','7','8','9','10','fleur-de-lis'
        ],
        values: { min: 0, max: 11 },
        system: 'qwerty'
    },
    'd12'
);

dice3d.addDicePreset(
    {
        type: 'df',
        atlas: 'modules/dice-so-nice/textures/spectrum-0.json',
        labels: ['df-m.webp', 'df-0.webp', 'df-p.webp'],
        emissiveMaps: ['df-m.webp', 'df-0.webp', 'df-p.webp'],
        emissive: 0xffffff,
        colorset: 'spectrum_default',
        system: 'spectrum'
    },
    'd6'
);
```

### Using Font Awesome icons as labels

Foundry VTT ships with **Font Awesome 7 Pro**. You can use any FA icon as a die face label by setting the `font` property and passing the icon's Unicode character in the `labels` array.

Two important details:
1. The font name must include **literal double quotes** around it: `'"Font Awesome 7 Pro"'`. This is needed for correct CSS font parsing with multi-word font names. DsN automatically applies the `900` font weight (solid style) when it detects this font.
2. Labels must be the **Unicode character** for the icon, not the CSS class name. You can find the Unicode value on [the Font Awesome icon page](https://fontawesome.com/icons) (look for the Unicode value, e.g. `f005` for the star icon), then use `\uXXXX` in your JavaScript string.

```javascript
dice3d.addDicePreset({
    type: 'd6',
    labels: [
        '\uf54c',  // skull
        '\uf005',  // star
        '\uf06d',  // fire
        '\uf0e7',  // bolt
        '\uf21e',  // heartbeat
        '\uf6cf'   // dice-d20
    ],
    font: '"Font Awesome 7 Pro"',
    fontScale: 0.8,
    system: 'my-system'
});
```

:::note
This only works with Foundry VTT v14+ which bundles Font Awesome 7 Pro. For older Foundry versions, use the matching font family name (e.g. `'"Font Awesome 6 Pro"'`).
:::


[Check the demo pages for more examples](/foundryvtt-dice-so-nice/api/demos/)

## Adding a custom physics shape

By default, a DicePreset with a custom 3D model inherits the collision shape of its die type: a rhombic dodecahedron model would still tumble and land like the standard d12. `addDiceShape` registers a named collision shape, and a preset with a custom 3D model can reference it through the `shape` argument of `addDicePreset`. The die then rolls on its own collider, lands flush on its own faces, and reads results from them.

```javascript
/**
 * Register a custom physics shape
 * @param {Object} bundle: the fully explicit shape bundle (see below)
 * @returns {Boolean} true if the shape was registered, false if it was rejected
 */
dice3d.addDiceShape(bundle);
```

The `bundle` parameter has the following attributes:
- **name** is the unique shape name. Prefix it with your module or system id (e.g. `mymodule.my_custom_shape`) to avoid collisions
- **type** must be `"ConvexPolyhedron"` for now
- **vertices** is an array of `[x, y, z]` vertex coordinates
- **faces** is an array of faces, each an array of vertex indices wound **counter-clockwise seen from outside** (face normals must point outward)
- (Optional) **skipLastFaceIndex** set to true if each face entry carries a trailing face id that should be ignored (usually false, exist because of DsN historic)
- **faceValues** is the value shown by each face, in face order, read from the **top** face when the die lands. Do not use `0` (it means a non-scoring face) and do not duplicate values
- **rotationCombinations** is the rotation table: for every pair of face values, the Euler angles `[x, y, z]` (in degrees) that rotate one face onto the other, keyed `"low,high"`. Every pair of distinct face values must be covered
- (Optional) **mass**, **inertia**, **scaleModifier** override the physics values inherited from the die type

```javascript
dice3d.addDiceShape({
    name: "mymodule.my_custom_shape",
    type: "ConvexPolyhedron",
    vertices: [[x, y, z], /* ... */],
    faces: [[i0, i1, i2, i3, faceId], /* ... */],
    skipLastFaceIndex: false,
    faceValues: [7, 5, 3, 11, 12, 9, 4, 1, 2, 10, 8, 6],
    rotationCombinations: { "1,2": [x, y, z], /* ... every value pair */ }
});

dice3d.addDicePreset({
    type: "d12",
    modelFile: "modules/mymodule/my_custom_shape.glb",
    system: "mymodule"
}, "mymodule.my_custom_shape");
```

### What is supported

- Custom shapes are for presets with a **custom 3D model** only: the preset must have a `modelFile`, and the shape's `faceValues` must cover every value the die type can produce
- Only **top-read convex polyhedra** are supported.
- **Every rotation in `rotationCombinations` must be a rotational symmetry of the polyhedron.** Dice So Nice applies a single quaternion to the visual mesh to force the rolled result: if a rotation is not a symmetry of the collider, the mesh will visibly clips or floats.

See also [models with a non-standard physical shape](/foundryvtt-dice-so-nice/api/3d-models/#models-with-a-non-standard-physical-shape).

## Adding a custom texture
A background texture is displayed on every face of a die on top of the dice color.
You can use any blending mode supported by HTMLCanvas2D.
[Full list available here](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing/Example)

You can also set `composite` to `'hueshift'`. Instead of a canvas blend, this applies CSS `hue-rotate`, `saturate`, and `brightness` filters derived from the colorset's background color (converted to HSL). This lets you create multiple color variations of the same colored texture across different colorsets without needing separate image files.
```javascript
/**
 * Add a texture to the list of textures and preload it
 * @param {String} textureID
 * @param {Object} textureData {name,composite,source}
 * @returns {Promise}
 */
dice3d.addTexture(textureID, data);
```
### Examples
```javascript
dice3d.addTexture('13Ared', {
    name: '13th Age Red',
    composite: 'source-over',
    source: 'systems/archmage/images/redTexture.png',
    bump: 'systems/archmage/images/redTexture_bump.png' //can be empty
});
```
[Check the demo pages for more examples](/foundryvtt-dice-so-nice/api/demos/)
## Adding a custom colorset (theme)
A `colorset` defines a complete theme, colors texture, and material
You can create custom colorsets either to give more choices to players in the config menu or to create your own color schemes to use when creating custom dice presets.
```javascript
/**
 * Add a colorset (theme)
 * @param {Object} colorset (see below)
 * @param {String} mode= "default","preferred"
 * The "mode" parameter have 2 modes :
 * - "default" only register the colorset
 * - "preferred" apply the colorset if the player didn't already change his dice appearance for this world.
 */
dice3d.addColorset(colorset, mode);
```
The `colorset` parameter has the following attributes:
- **name** A string ID for the colorset
- **description** Localized string for settings
- **category** Used to group the colorsets in the settings
- **foreground** Colors of the labels
- **background** Colors of the dice
- **outline** Colors of the label outline. Can be 'none'.
- **edge** Colors of the edges. Can be 'none'.
- **texture** An array of ID, or a single ID of the texture to use if "None / Auto (Theme)" is selected in the settings.
If it is a custom texture, make sure to call this function after the Promise from "addTexture" is resolved.
- **material** ID of the material to use if "Auto (Theme)" is selected in the settings.
Supported values are **plastic**, **metal**, **glass**, **wood**, **chrome**, **stone**, **velvet**, **resin**, **frosted**, **pristine** and **iridescent**
- **font** is the name of the font family. This can be a Webfont too. (ex: Arial, monospace, etc)
- **fontScale** is an object with per-die-type font scale values. Default scales when omitted:

```javascript
export const DICE_SCALE = {
    d2: 1,
    d4: 1,
    d6: 1.3,
    d8: 1.1,
    d10: 1,
    d12: 1.1,
    d20: 1,
    d3: 1.3,
    d5: 1,
    df: 2,
    d100: 0.75
};
```
- **visibility** Set to 'hidden' if you do not want this colorset to be visible in the players' theme list. Useful for internal colorsets.
- **labelComposite** (Optional) Canvas composite mode applied when drawing label images. Default: `'source-over'` (no recoloring). Supported values: `'source-over'`, `'hueshift'`, `'tint'`, `'multiply'`. The driving color is the colorset's **foreground** (label color). Only affects image-based labels, not text labels.
- **backgroundComposite** (Optional) Canvas composite mode applied when drawing per-face background images. Default: `'source-over'`. Same supported values as `labelComposite`. The driving color is the colorset's **background** (dice color).

These two properties let you ship one set of label or background images and register multiple colorsets that produce visually distinct dice through color alone:
- `'hueshift'` applies CSS hue-rotate, saturate, and brightness filters derived from the driving color (same logic as texture hueshift)
- `'tint'` flat-colorizes the image to the driving color, preserving transparency
- `'multiply'` darkens toward the driving color (works best on opaque source images)

- **textureComposite** (Optional) Canvas blend mode for the colorset's own **texture** (the whole-die texture set in `texture`), overriding the blend mode baked into that texture. This lets you reuse a built-in texture, like `skulls`, with a different blend than its default. Default: the texture's own composite. Accepts any canvas `globalCompositeOperation` value (e.g. `'multiply'`, `'soft-light'`, `'overlay'`, `'screen'`), plus `'hueshift'` (the CSS-filter variant described under "Adding a custom texture"). Note this is distinct from `backgroundComposite`, which recolors per-face background label images.

**Note 1:** If you provide an array of texture ID instead of a single ID, a random texture will be used for each face of the dice.
**Note 2:** If you omit some of these attributes, Dice So Nice! will use the player config instead. For example, omitting "material" uses each player's selected material. This lets users customize slightly even with your colorset. To lock down appearance completely, set every attribute.
### Examples
```javascript
dice3d.addColorset(
    {
        name: '13a',
        description: '13th Age Red/Gold',
        category: '13th Age',
        foreground: '#9F8003',
        background: '#9F8',
        texture: '13Ared',
        edge: '#9F8003',
        material: 'chrome',
        font: 'Arial Black',
        fontScale: {
            d6: 1.1,
            df: 2.5
        },
        visibility: 'visible'
    },
    'preferred'
);

dice3d.addColorset({
    name: 'rainbow',
    description: 'Rainbow',
    category: 'Colors',
    foreground: [
        '#FF5959',
        '#FFA74F',
        '#FFFF56',
        '#59FF59',
        '#2374FF',
        '#00FFFF',
        '#FF59FF'
    ],
    background: [
        '#900000',
        '#CE3900',
        '#BCBC00',
        '#00B500',
        '#00008E',
        '#008282',
        '#A500A5'
    ],
    outline: 'black',
    texture: 'none',
    material: 'plastic'
});

// Same rune labels, two color variants - no duplicate image assets needed
dice3d.addColorset({
    name: 'fire-runes',
    description: 'Fire Runes',
    category: 'Elemental',
    foreground: '#FF4400',
    background: '#1A0500',
    outline: 'none',
    texture: 'none',
    material: 'metal',
    labelComposite: 'tint'
});

dice3d.addColorset({
    name: 'ice-runes',
    description: 'Ice Runes',
    category: 'Elemental',
    foreground: '#00CCFF',
    background: '#000A1A',
    outline: 'none',
    texture: 'none',
    material: 'metal',
    labelComposite: 'tint'
});
```
[Check the demo pages for more examples](/foundryvtt-dice-so-nice/api/demos/)

## Changing the appearance of dice in a Roll programmatically
This can be useful when you want to distinguish between two dice with similar shapes in a single roll, or if you wish to roll a die of a specific color based on your system rules.

You can either pass a full colorset to a DiceTerm or specify a custom appearance.

To pass the colorset to the Roll object, you can either use the 'flavor' feature from FVTT or modify the Roll object before creating the Chat Message.

Check the list of [available colorset here](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/blob/master/module/DiceColors.js#L214) or [create your own](/foundryvtt-dice-so-nice/api/customization/)

### Using the 'flavor' feature
Just pass the ID of a DsN colorset as a flavor parameter
```javascript
let r = new Roll('1d6[black]+1d6[white]').evaluate().then((roll) => {
    roll.toMessage();
});
```

:::note
The `die:` prefix is reserved for [library die resolution](/foundryvtt-dice-so-nice/guide/dice-library/#rolling-a-library-die-by-name). A flavor like `[die:Fire Oracle]` resolves to a named library die instead of a colorset or role. Avoid naming custom colorsets starting with `die:`.
:::
### Modifying the Roll object
If you prefer keep the flavor feature available for other uses, you can add a new attribute to a DiceTerm or Roll object instead.
```javascript
let r = await new Roll('2d20').evaluate();
r.dice[0].options.appearance = { colorset: 'fire' };
r.dice[1].options.appearance = { colorset: 'ice' };
r.toMessage();

let r = await new Roll('3d8').evaluate();
r.options.appearance = { colorset: 'fire' };
r.toMessage();
```

### Specifying a custom appearance
This is useful if you do not wish to register a new colorset or if you have too many possible variations. You can set or omit any of the following parameters.

**You can either attach the appearance object to the DiceTerm options or the Roll options.**

```javascript
let r = await new Roll('d20').evaluate();
r.dice[0].options.appearance = {
    colorset: 'custom',
    foreground: '#FFFFFF',
    background: '#FF0000',
    outline: '#000000',
    edge: '#000000',
    texture: 'fire',
    material: 'metal',
    font: 'Arial Black',
    system: 'standard'
};
r.toMessage();
```

## Dice roles

A **role** is what a die means in your game: `hope`, `wild`, `fire`, `acid`... Every die has exactly one role. `basic` is the default and is what a player's regular appearance settings describe. Every other role resolves to its own appearance, so a `hope` d12 can use a different preset and theme than a basic d12.

Detection runs in this order and the first match wins:

1. **Explicit role** set by the system: `term.options.dsnRole` on a die term, or a `role` path declared through [`getDSNProperties()`](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties) on the Roll class.
2. **Modifier token** declared by a role (`detectors.modifiers`). The token is matched exactly against the modifier command: `h` matches `h` and `h2`, not `hp`.
3. **`term.options.type`** then **`term.options.flavor`** matched against `detectors.types` of every role, then against the built-in damage type ids. `Roll.options.type` and `Roll.options.flavor` are merged down into each contained die term, so a system can set them once at the roll level.

Dice that match nothing are `basic`. A player who turns off the **Apply optional dice role appearances** preference sends every *optional* role back to `basic`, whichever way it was detected: built-in damage types and roles created by the GM are optional, registered roles are not unless they say so.

### Tagging dice explicitly

```javascript
// on a die term
let r = await new Roll('1d12 + 1d12').evaluate();
r.dice[0].options.dsnRole = 'hope';
r.dice[1].options.dsnRole = 'fear';
r.toMessage();

// from the Roll class, resolved per roll scope
class DamageRoll extends Roll {
    getDSNProperties() {
        return { role: 'options.damageType' };
    }
}
```

Declaring `role` through `getDSNProperties()` makes Dice So Nice! ignore `.type` and `.flavor` for that roll's dice and trust the declared path only. See [Declaring Roll properties with `getDSNProperties`](/foundryvtt-dice-so-nice/api/roll/#declaring-roll-properties-with-getdsnproperties) for the full convention.

### Registering a role

Systems and modules register roles from the `diceSoNiceReady` hook with `dice3d.addRole(role, { package })`. The package id is optional and only used in conflict warnings. Registering an id that already exists merges into it.

```javascript
Hooks.once('diceSoNiceReady', (dice3d) => {
    // detected through a roll modifier declared by the system's own die term
    dice3d.addRole({
        id: 'hope',
        label: 'Hope',
        group: 'My Game',
        customizable: true,
        dieTypes: ['d6', 'd12', 'd20'],
        defaults: { global: { colorset: 'radiant' } },
        detectors: { modifiers: ['h'] }
    }, { package: 'my-system' });

    // a damage type detected through the type or flavor of the roll
    dice3d.addRole({
        id: 'sacred',
        label: 'Sacred',
        group: 'DICESONICE.DamageTypes',
        optional: true,
        detectors: { types: ['sacred', 'holy'] },
        defaults: { global: { colorset: 'radiant' } }
    }, { package: 'my-system' });
});
```

A role record has the following fields:

- **id** - role id (`hope`, `fire`).
- **label** - display name, can be a localization key.
- **group** - group shown in the UIs (the name of your game, `"DICESONICE.DamageTypes"`...), can be a localization key.
- **customizable** - when `true`, players can pick this role in their dice settings and give it their own look. The GM can flip any role from the Dice Roles table.
- **optional** - when `true`, the player preference "Apply optional dice role appearances" turns this role off. Defaults to `false`: set it on roles that are a coloring convention laid over the player's dice (damage types) rather than dice of their own. The GM can flip it from the Dice Roles table.
- **dieTypes** - optional die type whitelist (`["d6", "d12"]`). Only narrows what the player settings show for this role; it does not affect detection or resolution.
- **defaults** - the default appearance of the role: `{ global?: {...}, d4?: {...}, d12?: {...} }`. Each slot accepts the same fields as a player appearance (`colorset`, `system`, `texture`, `material`, `font`, `labelColor`, `diceColor`, `outlineColor`, `edgeColor`...). Missing fields are inherited.
- **detectors** - `{ modifiers?: [...], types?: [...] }`. `modifiers` are roll modifier tokens declared by the system's own dice term class, `types` are matched against the type or flavor of the roll.

### Role defaults on a dice preset

A `DiceSystem` can carry role defaults. They are registered when the system is added, with the same merge rule as `addRole`:

```javascript
import { DiceSystem } from '../dice-so-nice/api.js';

const pack = new DiceSystem('my-dice', 'My Dice', 'default', 'My Dice Pack');
pack.roleDefaults = {
    hope: { global: { system: 'my-dice', colorset: 'my-hope-theme' } },
    fear: { global: { system: 'my-dice', colorset: 'my-fear-theme' } }
};
dice3d.addSystem(pack);
```

### Appearance resolution

For a die in a role, each appearance field is resolved separately and the first value found wins:

1. the player's own appearance for that role, when the role is customizable
2. the world appearance set by the GM in the Dice Roles table
3. the defaults registered with `addRole` or `roleDefaults`
4. the player's basic global appearance

At each step the slot of the die type is read before the global slot. Per-actor appearance and the "Force roll appearance to owner" setting apply to roles the same way they apply to basic dice. A die's own `options.appearance`, when a system sets one, is merged last and wins over the whole role resolution.

Role appearances can also reference a die from the [Dice Library](/foundryvtt-dice-so-nice/guide/dice-library/). World appearances reference dice from the world library, which the GM edits and every client can read.

### Built-in roles

The following damage types are built-in roles in the "Damage Types" group: `fire`, `acid`, `cold`, `radiant`, `poison`, `thunder`, `lightning`, `air`, `water`, `earth`, `force`, `psychic`, `necrotic`, `ice`. Each is detected through its id and defaults to the matching colorset.

## Preloading Presets

If your system registers internal presets that users may never select in their settings, you can force-preload them to avoid a lag on the first roll that uses them. Call this once after registering your presets from the `diceSoNiceReady` hook.

```javascript
/**
 * Force preload of every dice preset registered under a given system id.
 * Useful for systems that register internal presets users may never select
 * in their settings, avoiding first-roll lag.
 * @param {String} systemId
 * @returns {Promise<void>}
 */
dice3d.preloadPresets(systemId);
```

### Example
```javascript
Hooks.once('diceSoNiceReady', async (dice3d) => {
    // Register your system and presets first...
    dice3d.addSystem(mySystem);
    dice3d.addDicePreset({ type: "d6", labels: [...], system: "my-system" });

    // Then preload them
    await dice3d.preloadPresets("my-system");
});
```

## Show all extra dice by default for new users
If your system make use of the extra dice type (D3, D5, D7, D14, D16, D24, and D30), you can make them visible by default in the dice settings.
As for other Customization API calls, make this one during the diceSoNiceReady hook.

```javascript
/**
 * Change the default value of the showExtraDice settings
 * @param {Boolean} show
 */
dice3d.showExtraDiceByDefault((show = true));
```
