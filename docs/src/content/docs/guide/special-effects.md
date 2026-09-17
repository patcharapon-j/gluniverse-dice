---
title: Special Effects
description: Add animations, sounds, and macros triggered by specific dice results.
---

Special Effects (SFX) let you attach reactions to dice rolls. When a die lands on a result that matches your trigger condition, Dice So Nice plays an animation, a sound, or runs a macro.

With **Macro** effects you can go further: run any Foundry macro when a trigger fires. The macro receives the full roll context, so you can build game-system-specific logic like critical hit detection, post chat messages, or chain multiple visual effects. Combined with **Advanced mode** formulas, you can target precise conditions like "3 or more dice exploded" or "the kept die on an advantage roll shows 20".

## Setting Up an Effect

Open the **3D Dice Settings** dialog and go to the **Special Effects** tab.

![Special Effects tab](../../../assets/special-effects-tab.webp)

Each SFX row has a **trigger condition** (which dice and results to match) and an **effect** (what happens). Click **+** to add a new row. The gear icon opens per-effect options when available.

The **Show other players' special effects** checkbox controls whether SFX from other players play on your screen.

## Basic Triggers

By default, each SFX row uses Basic mode: pick a dice type and one or more results from dropdown menus.

The result dropdown includes numeric face values and modifier-based triggers:

| Trigger | Matches |
|---------|---------|
| **Keep Highest / Advantage** | The kept die in a kh/advantage roll |
| **Keep Lowest / Disadvantage** | The kept die in a kl/disadvantage roll |
| **Drop Highest** | The non-dropped dice in a dh roll |
| **Drop Lowest** | The non-dropped dice in a dl roll |
| **Counting Success** | Dice that count as a success (cs modifier) |
| **Counting Failure** | Dice that count as a failure (cf modifier) |
| **Exploded** | Dice that triggered an explosion |
| **Rerolled** | Dice that were rerolled |

Selecting multiple values works as OR: the effect triggers if any of the selected conditions match. Use Advanced mode if you need to combine conditions.

## Advanced Triggers (Formulas)

Click the toggle button on any SFX row to switch to Advanced mode. This replaces the dropdowns with a formula input.

If the formula is invalid, a red error icon appears inside the input - hover over it for details.

### Per-die Matching

Match individual dice by result. Omit the count to match each die independently.

```
d20 == 20
d20 == 1,20
d6 >= 5
```

### Aggregate Matching

Prefix with a die count to match the sum of a specific term.

```
2d6 >= 10
4d6kh >= 15
*d6 > 20
```

### Roll Total

Match against the total of the entire roll.

```
total >= 30
total == 100
```

### Count Keywords

Count dice with a specific flag: `success`, `failure`, `discarded`, `rerolled`, `exploded`.

```
success(d6cs=3) > 2
failure(d10cf<3)
exploded(d6) >= 3
rerolled(d20)
discarded(2d20kh)
```

Use `!` to negate (match dice without the flag):

```
!discarded(2d20kh)
!discarded(4d6dl)
```

Without an operator, the effect triggers on each matching die. With an operator, it checks the count and triggers on all matching dice only if the condition is met.

### Count of Matching Dice

Use `count(...)` to fire when at least N dice in a specific term satisfy a per-die condition. Useful for "two of three d20s rolled a 20" cases that the keywords above can't express without a roll-side modifier.

```
count(3d20 == 20) >= 2
count(3d20 == 1,20) >= 2
count(*d20 == 20) >= 2
count(4d6 >= 5) > 2
count(3d20kh == 20) >= 1
```

The inner expression must include a dice count (`3d20`) or wildcard (`*d20`) and a comparison. Matching is term-scoped: `count(3d20 == 20) >= 2` only fires on a `3d20` term, not on a `2d20` or `4d20` term. Use `*d20` to match any pool size.

The effect plays only on the dice that pass the inner condition. In a `3d20` roll of [20, 20, 5], only the two 20s receive the effect.

### Dice Roles

Add a role tag in brackets right after the faces to match only dice carrying that [dice role](/foundryvtt-dice-so-nice/guide/preferences/#dice-roles) (a damage type, a special system die...). Untagged terms match every role, as before. The tag goes before any modifier and also works inside `count(...)` and the count keywords. Unknown role ids are rejected by the formula validator; hover the formula input for the list of available roles.

```
d12[hope] == 12
d12[fear] == 1
d6[fire] >= 5
success(d6[hope]cs=3) > 2
count(2d12[hope] == 12) >= 1
```

### Any Faces, Max and Min

Use `*` as the faces to match a die of any size, and the keywords `max` / `min` to compare against the extreme values of the die (its number of faces and 1). On an aggregate term, `max` and `min` are the extreme totals of the term.

```
d* == max
d*[hope] == max
d20 == min,max
2d6 == max
```

`max` and `min` are not accepted after `total`.

### Modifiers

Formulas can include Foundry dice modifiers: `kh`, `kl`, `dh`, `dl`, `cs`, `cf`. Modifiers can include a comparison: `cs=3`, `cf<3`, `kh>=5`. DnD 5e `adv`/`dis` modifiers are recognized automatically.

### Operators

`==` (supports comma-separated values), `>=`, `<=`, `>`, `<`.

### Quick Reference

| Formula | Matches |
|---------|---------|
| `d20 == 20` | Natural 20 on any d20 |
| `d20 == 1,20` | Natural 1 or 20 |
| `2d6 >= 10` | 2d6 term totaling 10+ |
| `total >= 30` | Entire roll totaling 30+ |
| `!discarded(2d20kh)` | The kept die on advantage |
| `success(d6cs=3) > 2` | More than 2 successes |
| `exploded(d6) >= 3` | 3+ dice exploded |
| `d20kh == 20` | Nat 20 on a keep-highest d20 |
| `count(3d20 == 20) >= 2` | 2+ of three d20s show a 20 |
| `d12[hope] == 12` | A Hope die showing a 12 |
| `d* == max` | Any die showing its highest face |
| `d*[fear] == min` | Any Fear die showing a 1 |

## Effects

### Macro

Executes a Foundry macro when the trigger fires. The macro receives a context object:

| Property | Description |
|----------|-------------|
| `messageId` | The chat message ID for this roll |
| `roll` | The Foundry Roll object |
| `dsnDie` | The triggering die (`type`, `result`, `options`) |
| `dicemesh` | The Three.js mesh of the triggering die |
| `playSFX(sfxId)` | Trigger another visual effect on the same die |

#### Example: Critical Hit Celebration

Trigger: `d20 == 20`. Effect: Macro.

```javascript
const { messageId, roll, dsnDie, playSFX } = scope;

playSFX("PlayAnimationBright");

const actor = game.messages.get(messageId)?.speaker?.actor;
const name = game.actors.get(actor)?.name ?? "Someone";
ChatMessage.create({
    content: `<h2>${name} rolled a critical hit!</h2>`,
    whisper: []
});
```

#### Example: System-Specific Critical Detection

Some systems define criticals as a percentage of a skill value. A macro can implement this:

```javascript
const { roll, dsnDie, playSFX } = scope;

const skillValue = roll.options?.skillValue;
if (skillValue && dsnDie.result <= Math.ceil(skillValue * 0.05)) {
    playSFX("PlayConfettiStrength3");
}
```

#### Example: Playing an effect at the die position

`dicemesh` gives access to the 3D object of the die. Use `game.dice3d.getScreenPosition(dicemesh)` to convert it to viewport coordinates, for example to play an animation from another module on top of the die.

```javascript
const { dicemesh } = scope;

const pos = game.dice3d.getScreenPosition(dicemesh);
if (pos) {
    // pos.x and pos.y are in CSS pixels, relative to the viewport
    console.log(`The die landed at ${Math.round(pos.x)}, ${Math.round(pos.y)}`);
}
```

#### playSFX IDs

`PlayAnimationBright`, `PlayAnimationDark`, `PlayAnimationOutline`, `PlayAnimationImpact`, `PlayAnimationThormund`, `PlayAnimationParticleSpiral`, `PlayAnimationParticleSparkles`, `PlayAnimationParticleVortex`, `PlayConfettiStrength1`, `PlayConfettiStrength2`, `PlayConfettiStrength3`, `PlaySoundEpicWin`, `PlaySoundEpicFail`.

### Animations

| Effect | Description |
|--------|-------------|
| **Bright** | A flash of bright light radiating from the die |
| **Dark** | A dark aura emanating from the die |
| **Impact** | A shockwave ripple expanding from the die |
| **Outline** | A glowing outline effect around the die |
| **Sparkles** | Sparkles of light radiating from the die |
| **Spiral** | A spinning spiral pattern around the die |
| **Vortex** | A swirling vortex of particles |
| **Thormund** | A custom character animation |

<details>
<summary>Animation previews</summary>

**Bright**
![Bright effect](../../../assets/wiki/bright.gif)

**Impact**
![Impact effect](../../../assets/wiki/impact.gif)

**Dark**
![Dark effect](../../../assets/wiki/dark.gif)

**Sparkles**
![Sparkles effect](../../../assets/wiki/sparkles.gif)

**Spiral**
![Spiral effect](../../../assets/wiki/spiral.gif)

**Vortex**
![Vortex effect](../../../assets/wiki/vortex.gif)

**Thormund**
<video controls width="320">
  <source src="/foundryvtt-dice-so-nice/wiki/thormund.mp4" type="video/mp4">
</video>

</details>

### Sounds

| Effect | Description |
|--------|-------------|
| **Epic Win** | Built-in victory sound |
| **Epic Fail** | Built-in failure sound |
| **Custom** | A custom audio file or Foundry playlist (random track each trigger) |

### Confetti

Three intensity levels. Requires the [Celebrate](https://foundryvtt.com/packages/celebrate) module.

:::note
Modules can register additional custom effects via the [SFX API](/foundryvtt-dice-so-nice/api/sfx/).
:::
