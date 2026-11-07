# Credits and bundled asset audit

GLUniverse Dice is a modified version of **Dice So Nice!** by **Simone** (riccisi) and **JDW**,
with contributions from Aioros, Steve Barnett, Greewi (d10 geometry) and many others. See the
[upstream contributors](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/graphs/master) and
the credits in [README.md](./README.md), which this fork keeps unchanged.

All bundled assets ship **as they are in Dice So Nice 6.4.5**. Nothing is removed, replaced or
gated. Dice So Nice's README says the textures and themes come from artists who gave **Dice So
Nice** permission to include them, and that extra sounds come from zapsplat.com. That permission
was given to DSN. Whether it extends to a fork is being confirmed with the owners: **the
maintainer is handling it**. This table is the list for those conversations. The repository and
its releases have been public since 2026-11-07, by the maintainer's decision, with the
permissions below still pending.

"Source" is what the repository itself shows: the README credits, git history, and file
headers. Where it says *likely*, it is an inference to confirm with the owner.

## Textures and themes

| Path (repo) | Shipped as | Contents | Source / credit | Status |
|---|---|---|---|---|
| `src/textures/bronze01-04*.webp` → `module/textures/standard.webp` | atlas `standard.webp` + `.json` | Thylean Bronze theme textures | **Spencer Thayer** (README: "Thylean Bronze theme") | permission pending (user handling) |
| `src/textures/*.webp` (alienrock, astral, brick, cheetah, cloudy, dragon, feather, fiber, fire, fuel, glitter, hell, ice, lava, leopard, lizard, marble, metal, noise, paper, portal, radial, skulls, speckles, stainedglass, stars, stone, tiger, tile, water, watercolor, wood, and their `_bump` maps) → `standard.webp` | atlas | DSN's built-in themes and colorset textures | **MajorVictory** (README: "all the other themes"). DSN v2 grew out of Anton Natarov's public-domain roller via MajorVictory's fork. Some images may have third-party origins of their own; ask MajorVictory. | permission pending (user handling) |
| `src/textures/spectrumdice/` → `spectrum-0.webp`, `spectrum-1.webp` | atlases | Spectrum dice system faces (d2-d20, d100, dc, df) | **LyncsCwtsh** (README: "Spectrum system") | permission pending (user handling) |
| `src/textures/dot/` → `module/textures/dot.webp` | atlas | pip faces for the Dot / Dot Black systems | likely DSN authors (JDW) | permission pending (user handling) |
| `src/textures/coin/` → `module/textures/coin/heads*, tail*` | webp | coin faces | not credited; likely MajorVictory or DSN authors | permission pending (user handling) |
| `module/textures/foundry_vtt/foundrynat20*.webp`, `module/fonts/foundryvtt.woff2` | webp, woff2 | Foundry VTT logo face and glyph font for the "Foundry VTT" preset | **Foundry VTT** (README: "FVTT Logo"). It is a trademark of Foundry Gaming LLC; DSN is an official partner, and a fork is not | permission pending (user handling) |
| `src/textures/pbr_maps/` → `module/textures/pbr-maps.webp` | atlas | normal and roughness maps per material (metal, stone, velvet, wood, glass, …) | not credited; added by JDW (2024). Origin unknown, possibly a CC0 library | permission pending (user handling) |
| `module/textures/equirectangular/{foyer,shanghai_bund,warm_restaurant_night}_1k.hdr` | hdr | environment lighting ("ambiance") | not credited. `shanghai_bund` and `warm_restaurant_night` match Poly Haven HDRI names (CC0); `foyer` was added 2026-04-26, origin not recorded | permission pending (user handling) |
| `module/textures/cubemap/{p,n}{x,y,z}.webp` | webp | legacy environment cube map | not credited | permission pending (user handling) |
| `module/textures/noise-thin-film.webp` | webp | iridescence noise lookup | added with `libs/ThinFilmFresnelMap.js` (MIT, David Lenaerts); the texture's own origin is not recorded | permission pending (user handling) |
| `module/images/moretheme.webp` | webp | "more themes" button art | DSN UI | permission pending (user handling) |
| `module/sfx/textures/{glassimpact_color,glow_point_red_gold,magic01,sparks_core}.webp` | webp | particle sprites for special effects | not credited (added with the SFX system, 2021) | permission pending (user handling) |
| `src/textures/texturepacker_projects/` | not shipped | TexturePacker project files | DSN build sources | DSN project file (AGPL with the code) |

## Bundled third-party add-on: Nice more Dice (M3)

`module/textures/glu/nice-more-dice/` (959 webp, 13 MB) and `module/glu/vendor/niceMoreDice.js`
are **Nice more Dice 1.4.2 by LyncsCwtsh**
([repository](https://github.com/LyncsCwtsh/fvtt-module-nice-more-dice), commit `9f01afd`,
also on [itch.io](https://lyncscwtsh.itch.io/nice-more-dice)), bundled at the maintainer's
request. Its licence is **Creative Commons Attribution 4.0 International**; the LICENSE, README
and "Used Assets Credits.txt" are copied next to the assets unchanged. Every texture, system and
preset keeps its original id and its ⁂-marked name. The script is the original, wrapped in a
function, with paths pointing at our copy. It is skipped when the real `nice-more-dice` module
is active.

The author's credits file names the sources inside the art:

| Source | Used in | Licence | Status |
|---|---|---|---|
| game-icons.net (lorc, delapouite, sbed, darkzaitzev, caro-asercion, starseeker, carl-olsen, skoll) | Gears texture; Flamestalker, GM Dice, Maze, Grifter, Halloween sets | CC BY 3.0, credited in the credits file | OK with attribution |
| Unsplash (Bruno Ramos, Max Kleinen, Pawel Czerwinski, Ray Mallick, Alex Perez, Susan Wilkinson, Daniel Olah, NASA, Neven Krcmarek, Solen Feyissa, New York Public Library, Yu Kato, Raimond Klavins, Gioele Fazzeri) | Bark, BwBlood, Lavash, Orbs, Rainbow, Redwave, Cosmic, Roman marble textures; Planetary and Roman Superiority sets | Unsplash License (free use, no attribution required; no selling unmodified copies, no compiling into a competing service) | OK as modified art |
| brusheezy.com brushes | Claws texture | varies per brush pack | permission pending (user handling) |
| obsidiandawn.com brushes | Paws texture | obsidiandawn terms (free use, credit requested) | permission pending (user handling) |
| Celtic Border Brushes by Nathies-stock (DeviantArt) | Celtic Lynx set | stock artist's own terms | permission pending (user handling) |

## Sounds

| Path | Contents | Source / credit | Status |
|---|---|---|---|
| `module/sounds/dicehit.mp3` + `.json` (sources in `src/sounds/dicehit/`) | dice-on-dice hit sprite (per material) | not credited per file; README: "Additional sound effects from zapsplat.com". Zapsplat's standard licence allows use in projects but not redistribution of the raw files, and an open repository redistributes them | permission pending (user handling) |
| `module/sounds/surfaces.mp3` + `.json` (sources in `src/sounds/surfaces/`) | dice-on-surface sprite (felt, wood, metal, …) | as above (zapsplat likely) | permission pending (user handling) |
| `module/sfx/sounds/{bright,darkness,doublespiral,epic_fail,epic_win,hit_glass,sparkles,vortex}.mp3` | special-effect sounds | as above (zapsplat likely) | permission pending (user handling) |
| `module/sfx/sounds/thormund.mp3` | "Thormund TTE" effect sound | not credited | permission pending (user handling) |

## Models

| Path | Contents | Source / credit | Status |
|---|---|---|---|
| `module/sfx/models/thormund.glb` | animated character for the "Thormund TTE" effect | not credited (added 2021-01-06). "TTE" suggests a third-party character or community member; ask JDW | permission pending (user handling) |
| `models/*.blend`, `models/uvs/*.jpg` (not shipped) | Blender sources and UV layouts of the dice | DSN authors; Steve Barnett (d14, d16, d24, d30), Greewi (d10 maths) | DSN project files (AGPL with the code) |
| `module/engine/DiceModels.js` | dice geometry as JSON | DSN authors (same as above) | AGPL code |

## Repository media (not shipped in the module zip)

`banner.jpg`, `cover.jpg`, `screenshot1.jpg`, `screenshot2.jpg`, `dice-so-nice.gif`,
`dsnloop-360.webm`: Dice So Nice branding and screenshots. `module.json`'s `media` entries still
point at upstream's copies on GitLab. **Replace them with GLUniverse media before a public
release**, so the package page does not present itself as Dice So Nice.

## Code libraries (all compatible with AGPL-3.0)

| Library | Licence | Where |
|---|---|---|
| three.js | MIT | npm, bundled; `dist/libs/three*.min.js` |
| cannon-es (JiDW fork) | MIT | npm (GitHub), bundled into the cannon worker |
| @dimforge/rapier3d-compat 0.21.0 | Apache-2.0 | npm, bundled into `dist/workers/rapier-physics-worker.js` |
| three.proton 0.2.0 | MIT (ajiemath / drawcall) | `module/libs/three.proton.js` |
| ThinFilmFresnelMap | MIT (David Lenaerts) | `module/libs/ThinFilmFresnelMap.js` |
| Draco decoder | Apache-2.0 (Google, via three.js) | `dist/libs/draco_*` |
| slim-select | MIT | npm, bundled + CSS |
| stats-gl | MIT | npm, bundled |
| webworker-promise | MIT | npm, bundled |
| Online 3D dice roller (Anton Natarov) | public domain | the original basis of DSN v1/v2 |
