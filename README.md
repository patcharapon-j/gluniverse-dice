# GLUniverse Dice

3D dice for Foundry VTT v14: a modified version (soft fork) of **Dice So Nice!** by Simone and
JDW, forked from 6.4.5. It keeps Dice So Nice's public API (`game.dice3d`, the `diceSoNice*`
hooks, colorsets, roles and the `dice-so-nice` settings), so systems and modules built for Dice
So Nice work unchanged, and a world switching over keeps its dice settings.

## Install

In Foundry's setup screen: **Add-on Modules → Install Module**, paste this manifest URL into
**Manifest URL**, then **Install**:

```
https://github.com/patcharapon-j/gluniverse-dice/releases/latest/download/module.json
```

Enable **GLUniverse Dice** in the world and keep **Dice So Nice!** disabled (the two declare a
conflict). Foundry v14 only. Updates arrive through Foundry's normal update check.

## What it adds to Dice So Nice

- **Grab and roll.** An interactive roll waits in the roller's hand: the dice float spread out
  next to the pointer, above the sheet the roll came from, slowly turning. Grab them and they
  gather into a pile that jostles with your hand; flick to throw, click to throw, or shake.
  Nobody else sees the dice, or the result, until they are thrown, and there is no extra chat
  card. Which rolls wait is Dice So Nice's own interactive-throw rule.
- **Burn away.** After the dice have been on the table for a world-set time (default 5 s), they
  burn away in spreading, white-edged holes, the glowing result number with them.
- **Result glow and impact sparks.** The result face lights up when the dice settle (it ignites,
  flashes, cools and stays lit), in the die's own colour; hard hits throw sparks.
- **Rapier physics (optional).** A second physics engine, chosen by a world setting, with dice
  that roll rather than skid and settle a little sooner. cannon-es stays the default.
- **Smoother motion.** Interpolated replay and live dice, real frame timing, idle frames skipped,
  shaders compiled at load.
- **Materials.** Gemstone, inner-galaxy and pearlescent materials, enhanced versions of the
  built-in ones, and the Nice more Dice texture pack bundled (CC BY 4.0, LyncsCwtsh).
- **For streams.** `game.dice3d.rollArea` sets, previews and applies a client's dice roll area
  live, and lets a GM drive it on another user's client (a stream capture login).
- **For systems.** Dice can be tagged and emphasised (`term.options.gluDice`, hook
  `gluDiceSettle`), so a system can say which die matters; the glow follows.

[FORK.md](./FORK.md) says what changed and how, [ROADMAP.md](./ROADMAP.md) what is planned, and
[CREDITS.md](./CREDITS.md) lists the bundled assets and their credits. Licence: AGPL-3.0, like
Dice So Nice; the full source is this repository.

---

> Everything below is Dice So Nice's own README, kept as written, including its credits. Its
> install instructions are for Dice So Nice itself; to install GLUniverse Dice use the manifest
> URL above.

![Banner](./banner.jpg?raw=true)  
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdice-so-nice&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=dice-so-nice)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdice-so-nice%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/dice-so-nice/)
[![Foundry Hub Comments](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdice-so-nice%2Fshield%2Fcomments)](https://www.foundryvtt-hub.com/package/dice-so-nice/)
[![Translation status](https://weblate.foundryvtt-hub.com/widgets/dice-so-nice/-/main/svg-badge.svg)](https://weblate.foundryvtt-hub.com/engage/dice-so-nice/)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/E1E43RA5Z)

This module for Foundry VTT adds the ability to show a 3D dice simulation when dice are rolled.

![Preview](./dice-so-nice.gif?raw=true)

[[_TOC_]]

# Installation

To install, search for "Dice So Nice" in the module browser inside Foundry VTT.

Alternatively, you can manually install the module by following these steps:

1. Inside Foundry, select the Game Modules tab in the Configuration and Setup menu.
2. Click the Install Module button and enter the following URL: https://gitlab.com/riccisi/foundryvtt-dice-so-nice/raw/master/module/module.json
3. Click Install and wait for installation to complete.

Dice So Nice! is also available on [The Forge](https://forge-vtt.com/bazaar#package=dice-so-nice).

# Documentation

<!-- TODO: replace with actual GitLab Pages URLs once the static site is deployed -->

- **[User Guide](https://riccisi.gitlab.io/foundryvtt-dice-so-nice/guide/getting-started/)** — Settings, customization, special effects, and everything you need to get the most out of your 3D dice.
- **[Developer & API Docs](https://riccisi.gitlab.io/foundryvtt-dice-so-nice/api/integration/)** — API reference, custom presets, dice systems, hooks, and integration guide for module and system developers.

# Compatibility

Compatible with Foundry VTT v14 and later.

If you need to use an older Foundry version, please [download a compatible older version](https://foundryvtt.com/packages/dice-so-nice/).

# Development and Contributing

Dice So Nice! is a free and open source project. You can contribute by submitting a [merge request](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/merge_requests) or by opening a [GitLab issue](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/issues).

Translations are managed on the Foundry Hub Weblate. Check the [Weblate page](https://weblate.foundryvtt-hub.com/engage/dice-so-nice/) to contribute.

[![Translation status](https://weblate.foundryvtt-hub.com/widgets/dice-so-nice/-/multi-auto.svg)](https://weblate.foundryvtt-hub.com/engage/dice-so-nice/)

## Build instructions

```
npm install
npx rollup -c -w
```

# Contributors

A huge thank you to everyone who has contributed code, models, translations, and feedback over the years.

- **[JDW](https://gitlab.com/JiDW)** — Main developer and maintainer since v2.
- **[Simone](https://gitlab.com/riccisi)** — Creator of the project. Entire v1, co-developed v2 and many features.
- **[Aioros](https://gitlab.com/Aioros)** — AppV2 migration, manual throws, d4 custom label support, and many bug fixes.
- **[Steve Barnett](https://gitlab.com/mooped)** — d14, d16, d24, and d30 geometries. Developer on the [DCC system](https://www.foundryvtt-hub.com/package/dcc/).

[View all contributors](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/graphs/master)

# Sponsors and partners

Dice So Nice! is free and open source, and some of its development has been funded by companies who chose to invest in a tool the whole community gets to use. Thank you.

- **[Foundry VTT](https://foundryvtt.com)** — Official partner since 2022. Foundry VTT supports the ongoing development of Dice So Nice! and works with us on the rolling API that makes deep 3D dice integration possible.
- **[Metamorphic Digital](https://www.metamorphic-digital.com/)** — Sponsored the custom physics shape API (`addDiceShape`, v6.3.0), which lets custom 3D models roll on their own collider.

# Acknowledgment

Based on the "Online 3D dice roller" by Anton Natarov, published under public domain.

> "You can assume that it has the MIT license (or that else) if you wish so. I do not love any licenses at all and prefer to simply say that it is completely free =)" - Anton Natarov

v2 of "Dice So Nice" was based on Anton's fork from MajorVictory, with his direct consent.

d10 geometry created by Greewi who did all the maths for our custom "Pentagonal Trapezohedron". You can find his homebrewed (French) TTRPG Feerie/Solaires here: https://feerie.net

Built on [Three.js](https://threejs.org/), [cannon-es](https://pmndrs.github.io/cannon-es/), and [Proton](https://github.com/drawcall/three.proton). GLUniverse Dice adds an optional [Rapier](https://rapier.rs/) physics backend (Apache-2.0). It also bundles [Nice more Dice](https://github.com/LyncsCwtsh/fvtt-module-nice-more-dice) by LyncsCwtsh (textures and dice faces, CC BY 4.0); see [CREDITS.md](./CREDITS.md) for the sources inside it.

## Theme and model credits

- **Spencer Thayer:** `Thylean Bronze` theme
- **Foundry VTT:** For the FVTT Logo in the `Foundry VTT` preset.
- **LyncsCwtsh:** For the `Spectrum` system.
- **MajorVictory:** For all the other themes in this module!
- Additional sound effects from https://www.zapsplat.com

Many thanks to the people who continue to support us on Discord, to the amazing system and module developers who integrate our module, and to the artists who have let us integrate their textures in Dice So Nice!

# Feedback

Every suggestion and feedback is appreciated. Please contact JDW (`@jidw`) on Discord.

To report a bug, please open a new issue [in our tracker](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/issues).

# License

FoundryVTT Dice So Nice is a module for Foundry VTT by Simone and JDW and is licensed under [GNU AFFERO GENERAL PUBLIC LICENSE](./LICENSE.md).

The Foundry VTT platform integration is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development](https://foundryvtt.com/article/license/).
