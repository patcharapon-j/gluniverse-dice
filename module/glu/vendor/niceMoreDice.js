// Nice more Dice 1.4.2 by LyncsCwtsh, bundled in GLUniverse Dice (ROADMAP M3).
// https://github.com/LyncsCwtsh/fvtt-module-nice-more-dice (commit 9f01afd)
// Licence: Creative Commons Attribution 4.0 International (see
// module/textures/glu/nice-more-dice/LICENSE). Third-party sources used in the textures and faces
// are listed in "Used Assets Credits.txt" next to it, and in CREDITS.md.
//
// Changes from the original script: wrapped in a function instead of its own diceSoNiceReady
// listener; asset paths point at this module's copy; skipped when the real Nice more Dice
// module is active, so nothing is registered twice. Every call, id and name is unchanged.
import { MODULE_ID } from '../LegacyIdentity.js';

const BASE = `modules/${MODULE_ID}/textures/glu/nice-more-dice/`;

export function registerNiceMoreDice(dice3d) {
  if (game.modules.get("nice-more-dice")?.active) return;


	dice3d.addTexture("colourdifference", {
	    name: "⁂ Colour Dodge",
	    composite: "difference",
	    source: BASE + "textures/bark.webp",
        bump: BASE + "textures/barkb.webp"
	});

    dice3d.addTexture("Blood", {
	    name: "⁂ Black Blood",
	    composite: "multiply",
	    source: BASE + "textures/bwblood.webp"
	});
	
    dice3d.addTexture("ccorn", {
	    name: "⁂ Candy Corn",
	    composite: "multiply",
	    source: BASE + "textures/candycorn.webp"
	});	

    dice3d.addTexture("cosmic", {
	    name: "⁂ Cosmic",
	    composite: "multiply",
	    source: BASE + "textures/cosmic.webp"
	});

 	dice3d.addTexture("Claws", {
	    name: "⁂ Claws",
	    composite: "difference",
	    source: BASE + "textures/claws.webp",
        bump: BASE + "textures/clawsb.webp"
	});

 	dice3d.addTexture("Gears", {
	    name: "⁂ Gears",
	    composite: "multiply",
	    source: BASE + "textures/gears.webp",
        bump: BASE + "textures/gearsb.webp"
	});

  dice3d.addTexture("Grid", {
	    name: "⁂ Grid",
	    composite: "difference",
	    source: BASE + "textures/grid.webp"
	});

	dice3d.addTexture("GoldenBranches", {
	    name: "⁂ Golden Branches",
	    composite: "multiply",
	    source: BASE + "textures/goldenbranches.webp"
	});

 	dice3d.addTexture("Hex", {
	    name: "⁂ Hex",
	    composite: "hard-light",
	    source: BASE + "textures/hex.webp"
	});

    dice3d.addTexture("Hearts", {
	    name: "⁂ Hearts",
	    composite: "difference",
	    source: BASE + "textures/hearts.webp",
        bump: BASE + "textures/heartsb.webp"
	});

	dice3d.addTexture("Lavash", {
	    name: "⁂ Lavash",
	    composite: "multiply",
	    source: BASE + "textures/lavash.webp"
	});

 	dice3d.addTexture("Leafage", {
	    name: "⁂ Leafage",
	    composite: "multiply",
	    source: BASE + "textures/leafage.webp",
        bump: BASE + "textures/leafageb.webp"
	});

    dice3d.addTexture("orbs", {
	    name: "⁂ Orbs",
	    composite: "multiply",
	    source: BASE + "textures/orbs.webp"
	});

 	dice3d.addTexture("paws", {
	    name: "⁂ Paws",
	    composite: "difference",
	    source: BASE + "textures/paws.webp",
        bump: BASE + "textures/pawsb.webp"
	});

    dice3d.addTexture("redwave", {
	    name: "⁂ Redwave",
	    composite: "multiply",
	    source: BASE + "textures/redwave.webp"
	});

    dice3d.addTexture("Rainbow", {
	    name: "⁂ Rainbow",
	    composite: "difference",
	    source: BASE + "textures/rainbow.webp"
	});
	
    dice3d.addTexture("rbmarb", {
	    name: "⁂ Roman Superiority Marble",
	    composite: "multiply",
	    source: BASE + "textures/rbmarb.webp"
	});

  dice3d.addSystem({id:"Dragon20",name:"⁂ Dragon20 (d20, 20 best)"},false);

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      'No','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19',
      BASE + 'faces/dragon20.webp'
    ],
    system:"Dragon20"
  });

  dice3d.addSystem({id:"Dragon1",name:"⁂ Dragon1 (d20, 1 best)"},false);

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/dragon20.webp','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19',
      'No'
    ],
    system:"Dragon1"
  });

  dice3d.addSystem({id:"OoFYeah",name:"⁂ OoFYeah (d20, 20 best)"},false);

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/oof.webp','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19',
      BASE + 'faces/fuckyeah.webp'
    ],
    system:"OoFYeah"
  });

  dice3d.addSystem({id:"YeahOof",name:"⁂ YeahOof (d20, 1 best)"},false);

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/fuckyeah.webp','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19',
      BASE + 'faces/oof.webp'
    ],
    system:"YeahOof"
  });

  dice3d.addSystem({id:"scriblemotions",name:"⁂ Scriblemotions (d6, special)"},false);

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/scriblemotions/d6-1.webp',
      BASE + 'faces/scriblemotions/d6-2.webp',
      BASE + 'faces/scriblemotions/d6-3.webp',
      BASE + 'faces/scriblemotions/d6-4.webp',
      BASE + 'faces/scriblemotions/d6-5.webp',
      BASE + 'faces/scriblemotions/d6-6.webp'
    ],
	system:"scriblemotions"
  });

 dice3d.addSystem({id:"Hex",name:"⁂ Hex (df)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/hex/dfm.webp',
      BASE + 'faces/hex/df.webp',
      BASE + 'faces/hex/dfp.webp'
    ],
    bumpMaps:[
      BASE + 'faces/hex/dfmb.webp',
      BASE + 'faces/hex/dfb.webp',
      BASE + 'faces/hex/dfpb.webp'
    ],
	system:"Hex"
  });

 dice3d.addSystem({id:"CL",name:"⁂ Celtic Lynx (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/celticlynx/dfm.webp',
      BASE + 'faces/celticlynx/df.webp',
      BASE + 'faces/celticlynx/dfp.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/dfmb.webp',
      BASE + 'faces/celticlynx/dfb.webp',
      BASE + 'faces/celticlynx/dfpb.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/celticlynx/d2-1.webp',
      BASE + 'faces/celticlynx/d2-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d2-1b.webp',
      BASE + 'faces/celticlynx/d2-2b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/celticlynx/dc-1.webp',
      BASE + 'faces/celticlynx/dc-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/dc-1b.webp',
      BASE + 'faces/celticlynx/dc-2b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/celticlynx/d4-1.webp',
      BASE + 'faces/celticlynx/d4-2.webp',
      BASE + 'faces/celticlynx/d4-3.webp',
      BASE + 'faces/celticlynx/d4-4.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/celticlynx/d6-1.webp',
      BASE + 'faces/celticlynx/d6-2.webp',
      BASE + 'faces/celticlynx/d6-3.webp',
      BASE + 'faces/celticlynx/d6-4.webp',
      BASE + 'faces/celticlynx/d6-5.webp',
      BASE + 'faces/celticlynx/d6-6.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d6-1b.webp',
      BASE + 'faces/celticlynx/d6-2b.webp',
      BASE + 'faces/celticlynx/d6-3b.webp',
      BASE + 'faces/celticlynx/d6-4b.webp',
      BASE + 'faces/celticlynx/d6-5b.webp',
      BASE + 'faces/celticlynx/d6-6b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/celticlynx/d8-1.webp',
      BASE + 'faces/celticlynx/d8-2.webp',
      BASE + 'faces/celticlynx/d8-3.webp',
      BASE + 'faces/celticlynx/d8-4.webp',
      BASE + 'faces/celticlynx/d8-5.webp',
      BASE + 'faces/celticlynx/d8-6.webp',
      BASE + 'faces/celticlynx/d8-7.webp',
      BASE + 'faces/celticlynx/d8-8.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d8-1b.webp',
      BASE + 'faces/celticlynx/d8-2b.webp',
      BASE + 'faces/celticlynx/d8-3b.webp',
      BASE + 'faces/celticlynx/d8-4b.webp',
      BASE + 'faces/celticlynx/d8-5b.webp',
      BASE + 'faces/celticlynx/d8-6b.webp',
      BASE + 'faces/celticlynx/d8-7b.webp',
      BASE + 'faces/celticlynx/d8-8b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/celticlynx/d10-1.webp',
      BASE + 'faces/celticlynx/d10-2.webp',
      BASE + 'faces/celticlynx/d10-3.webp',
      BASE + 'faces/celticlynx/d10-4.webp',
      BASE + 'faces/celticlynx/d10-5.webp',
      BASE + 'faces/celticlynx/d10-6.webp',
      BASE + 'faces/celticlynx/d10-7.webp',
      BASE + 'faces/celticlynx/d10-8.webp',
      BASE + 'faces/celticlynx/d10-9.webp',
      BASE + 'faces/celticlynx/d10-10.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d10-1b.webp',
      BASE + 'faces/celticlynx/d10-2b.webp',
      BASE + 'faces/celticlynx/d10-3b.webp',
      BASE + 'faces/celticlynx/d10-4b.webp',
      BASE + 'faces/celticlynx/d10-5b.webp',
      BASE + 'faces/celticlynx/d10-6b.webp',
      BASE + 'faces/celticlynx/d10-7b.webp',
      BASE + 'faces/celticlynx/d10-8b.webp',
      BASE + 'faces/celticlynx/d10-9b.webp',
      BASE + 'faces/celticlynx/d10-10b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/celticlynx/d12-1.webp',
      BASE + 'faces/celticlynx/d12-2.webp',
      BASE + 'faces/celticlynx/d12-3.webp',
      BASE + 'faces/celticlynx/d12-4.webp',
      BASE + 'faces/celticlynx/d12-5.webp',
      BASE + 'faces/celticlynx/d12-6.webp',
      BASE + 'faces/celticlynx/d12-7.webp',
      BASE + 'faces/celticlynx/d12-8.webp',
      BASE + 'faces/celticlynx/d12-9.webp',
      BASE + 'faces/celticlynx/d12-10.webp',
      BASE + 'faces/celticlynx/d12-11.webp',
      BASE + 'faces/celticlynx/d12-12.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d12-1b.webp',
      BASE + 'faces/celticlynx/d12-2b.webp',
      BASE + 'faces/celticlynx/d12-3b.webp',
      BASE + 'faces/celticlynx/d12-4b.webp',
      BASE + 'faces/celticlynx/d12-5b.webp',
      BASE + 'faces/celticlynx/d12-6b.webp',
      BASE + 'faces/celticlynx/d12-7b.webp',
      BASE + 'faces/celticlynx/d12-8b.webp',
      BASE + 'faces/celticlynx/d12-9b.webp',
      BASE + 'faces/celticlynx/d12-10b.webp',
      BASE + 'faces/celticlynx/d12-11b.webp',
      BASE + 'faces/celticlynx/d12-12b.webp'
	 ],
      system:"CL"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/celticlynx/d100-10.webp',
      BASE + 'faces/celticlynx/d100-20.webp',
      BASE + 'faces/celticlynx/d100-30.webp',
      BASE + 'faces/celticlynx/d100-40.webp',
      BASE + 'faces/celticlynx/d100-50.webp',
      BASE + 'faces/celticlynx/d100-60.webp',
      BASE + 'faces/celticlynx/d100-70.webp',
      BASE + 'faces/celticlynx/d100-80.webp',
      BASE + 'faces/celticlynx/d100-90.webp',
      BASE + 'faces/celticlynx/d100-100.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d100-10b.webp',
      BASE + 'faces/celticlynx/d100-20b.webp',
      BASE + 'faces/celticlynx/d100-30b.webp',
      BASE + 'faces/celticlynx/d100-40b.webp',
      BASE + 'faces/celticlynx/d100-50b.webp',
      BASE + 'faces/celticlynx/d100-60b.webp',
      BASE + 'faces/celticlynx/d100-70b.webp',
      BASE + 'faces/celticlynx/d100-80b.webp',
      BASE + 'faces/celticlynx/d100-90b.webp',
      BASE + 'faces/celticlynx/d100-100b.webp'
    ],
	system:"CL"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/celticlynx/d20-1.webp',
      BASE + 'faces/celticlynx/d20-2.webp',
      BASE + 'faces/celticlynx/d20-3.webp',
      BASE + 'faces/celticlynx/d20-4.webp',
      BASE + 'faces/celticlynx/d20-5.webp',
      BASE + 'faces/celticlynx/d20-6.webp',
      BASE + 'faces/celticlynx/d20-7.webp',
      BASE + 'faces/celticlynx/d20-8.webp',
      BASE + 'faces/celticlynx/d20-9.webp',
      BASE + 'faces/celticlynx/d20-10.webp',
      BASE + 'faces/celticlynx/d20-11.webp',
      BASE + 'faces/celticlynx/d20-12.webp',
      BASE + 'faces/celticlynx/d20-13.webp',
      BASE + 'faces/celticlynx/d20-14.webp',
      BASE + 'faces/celticlynx/d20-15.webp',
      BASE + 'faces/celticlynx/d20-16.webp',
      BASE + 'faces/celticlynx/d20-17.webp',
      BASE + 'faces/celticlynx/d20-18.webp',
      BASE + 'faces/celticlynx/d20-19.webp',
      BASE + 'faces/celticlynx/d20-20.webp'
    ],
    bumpMaps:[
      BASE + 'faces/celticlynx/d20-1b.webp',
      BASE + 'faces/celticlynx/d20-2b.webp',
      BASE + 'faces/celticlynx/d20-3b.webp',
      BASE + 'faces/celticlynx/d20-4b.webp',
      BASE + 'faces/celticlynx/d20-5b.webp',
      BASE + 'faces/celticlynx/d20-6b.webp',
      BASE + 'faces/celticlynx/d20-7b.webp',
      BASE + 'faces/celticlynx/d20-8b.webp',
      BASE + 'faces/celticlynx/d20-9b.webp',
      BASE + 'faces/celticlynx/d20-10b.webp',
      BASE + 'faces/celticlynx/d20-11b.webp',
      BASE + 'faces/celticlynx/d20-12b.webp',
      BASE + 'faces/celticlynx/d20-13b.webp',
      BASE + 'faces/celticlynx/d20-14b.webp',
      BASE + 'faces/celticlynx/d20-15b.webp',
      BASE + 'faces/celticlynx/d20-16b.webp',
      BASE + 'faces/celticlynx/d20-17b.webp',
      BASE + 'faces/celticlynx/d20-18b.webp',
      BASE + 'faces/celticlynx/d20-19b.webp',
      BASE + 'faces/celticlynx/d20-20b.webp'
    ],
    system:"CL"
  });

dice3d.addSystem({id:"PurpleMagic",name:"⁂ Purple Magic (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/purplemagic/dfm.webp',
      BASE + 'faces/purplemagic/df.webp',
      BASE + 'faces/purplemagic/dfp.webp',
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/purplemagic/d2-1.webp',
      BASE + 'faces/purplemagic/d2-2.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/purplemagic/dc-1.webp',
      BASE + 'faces/purplemagic/dc-2.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/purplemagic/d4-1.webp',
      BASE + 'faces/purplemagic/d4-2.webp',
      BASE + 'faces/purplemagic/d4-3.webp',
      BASE + 'faces/purplemagic/d4-4.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/purplemagic/d6-1.webp',
      BASE + 'faces/purplemagic/d6-2.webp',
      BASE + 'faces/purplemagic/d6-3.webp',
      BASE + 'faces/purplemagic/d6-4.webp',
      BASE + 'faces/purplemagic/d6-5.webp',
      BASE + 'faces/purplemagic/d6-6.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/purplemagic/d8-1.webp',
      BASE + 'faces/purplemagic/d8-2.webp',
      BASE + 'faces/purplemagic/d8-3.webp',
      BASE + 'faces/purplemagic/d8-4.webp',
      BASE + 'faces/purplemagic/d8-5.webp',
      BASE + 'faces/purplemagic/d8-6.webp',
      BASE + 'faces/purplemagic/d8-7.webp',
      BASE + 'faces/purplemagic/d8-8.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/purplemagic/d10-1.webp',
      BASE + 'faces/purplemagic/d10-2.webp',
      BASE + 'faces/purplemagic/d10-3.webp',
      BASE + 'faces/purplemagic/d10-4.webp',
      BASE + 'faces/purplemagic/d10-5.webp',
      BASE + 'faces/purplemagic/d10-6.webp',
      BASE + 'faces/purplemagic/d10-7.webp',
      BASE + 'faces/purplemagic/d10-8.webp',
      BASE + 'faces/purplemagic/d10-9.webp',
      BASE + 'faces/purplemagic/d10-10.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/purplemagic/d12-1.webp',
      BASE + 'faces/purplemagic/d12-2.webp',
      BASE + 'faces/purplemagic/d12-3.webp',
      BASE + 'faces/purplemagic/d12-4.webp',
      BASE + 'faces/purplemagic/d12-5.webp',
      BASE + 'faces/purplemagic/d12-6.webp',
      BASE + 'faces/purplemagic/d12-7.webp',
      BASE + 'faces/purplemagic/d12-8.webp',
      BASE + 'faces/purplemagic/d12-9.webp',
      BASE + 'faces/purplemagic/d12-10.webp',
      BASE + 'faces/purplemagic/d12-11.webp',
      BASE + 'faces/purplemagic/d12-12.webp'
    ],
	system:"PurpleMagic"
  });


  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/purplemagic/d100-10.webp',
      BASE + 'faces/purplemagic/d100-20.webp',
      BASE + 'faces/purplemagic/d100-30.webp',
      BASE + 'faces/purplemagic/d100-40.webp',
      BASE + 'faces/purplemagic/d100-50.webp',
      BASE + 'faces/purplemagic/d100-60.webp',
      BASE + 'faces/purplemagic/d100-70.webp',
      BASE + 'faces/purplemagic/d100-80.webp',
      BASE + 'faces/purplemagic/d100-90.webp',
      BASE + 'faces/purplemagic/d100-100.webp'
    ],
	system:"PurpleMagic"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/purplemagic/d20-1.webp',
      BASE + 'faces/purplemagic/d20-2.webp',
      BASE + 'faces/purplemagic/d20-3.webp',
      BASE + 'faces/purplemagic/d20-4.webp',
      BASE + 'faces/purplemagic/d20-5.webp',
      BASE + 'faces/purplemagic/d20-6.webp',
      BASE + 'faces/purplemagic/d20-7.webp',
      BASE + 'faces/purplemagic/d20-8.webp',
      BASE + 'faces/purplemagic/d20-9.webp',
      BASE + 'faces/purplemagic/d20-10.webp',
      BASE + 'faces/purplemagic/d20-11.webp',
      BASE + 'faces/purplemagic/d20-12.webp',
      BASE + 'faces/purplemagic/d20-13.webp',
      BASE + 'faces/purplemagic/d20-14.webp',
      BASE + 'faces/purplemagic/d20-15.webp',
      BASE + 'faces/purplemagic/d20-16.webp',
      BASE + 'faces/purplemagic/d20-17.webp',
      BASE + 'faces/purplemagic/d20-18.webp',
      BASE + 'faces/purplemagic/d20-19.webp',
      BASE + 'faces/purplemagic/d20-20.webp'
    ],
    system:"PurpleMagic"
  });

dice3d.addSystem({id:"Maze",name:"⁂ Maze (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/maze/df/dfm.webp',
      BASE + 'faces/maze/df/df.webp',
      BASE + 'faces/maze/df/dfp.webp'
    ],
	system:"Maze"
  });

dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/maze/dc/dc-1.webp',
      BASE + 'faces/maze/dc/dc-2.webp'
    ],
	system:"Maze"
  });

dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/maze/d2/d2-1.webp',
      BASE + 'faces/maze/d2/d2-2.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/maze/d4/d4-1.webp',
      BASE + 'faces/maze/d4/d4-2.webp',
      BASE + 'faces/maze/d4/d4-3.webp',
      BASE + 'faces/maze/d4/d4-4.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/maze/d6/d6-1.webp',
      BASE + 'faces/maze/d6/d6-2.webp',
      BASE + 'faces/maze/d6/d6-3.webp',
      BASE + 'faces/maze/d6/d6-4.webp',
      BASE + 'faces/maze/d6/d6-5.webp',
      BASE + 'faces/maze/d6/d6-6.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/maze/d8/d8-1.webp',
      BASE + 'faces/maze/d8/d8-2.webp',
      BASE + 'faces/maze/d8/d8-3.webp',
      BASE + 'faces/maze/d8/d8-4.webp',
      BASE + 'faces/maze/d8/d8-5.webp',
      BASE + 'faces/maze/d8/d8-6.webp',
      BASE + 'faces/maze/d8/d8-7.webp',
      BASE + 'faces/maze/d8/d8-8.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/maze/d10/d10-1.webp',
      BASE + 'faces/maze/d10/d10-2.webp',
      BASE + 'faces/maze/d10/d10-3.webp',
      BASE + 'faces/maze/d10/d10-4.webp',
      BASE + 'faces/maze/d10/d10-5.webp',
      BASE + 'faces/maze/d10/d10-6.webp',
      BASE + 'faces/maze/d10/d10-7.webp',
      BASE + 'faces/maze/d10/d10-8.webp',
      BASE + 'faces/maze/d10/d10-9.webp',
      BASE + 'faces/maze/d10/d10-10.webp'
    ],
	system:"Maze"
  });

     dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/maze/d12/d12-1.webp',
      BASE + 'faces/maze/d12/d12-2.webp',
      BASE + 'faces/maze/d12/d12-3.webp',
      BASE + 'faces/maze/d12/d12-4.webp',
      BASE + 'faces/maze/d12/d12-5.webp',
      BASE + 'faces/maze/d12/d12-6.webp',
      BASE + 'faces/maze/d12/d12-7.webp',
      BASE + 'faces/maze/d12/d12-8.webp',
      BASE + 'faces/maze/d12/d12-9.webp',
      BASE + 'faces/maze/d12/d12-10.webp',
      BASE + 'faces/maze/d12/d12-11.webp',
      BASE + 'faces/maze/d12/d12-12.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/maze/d100/d100-10.webp',
      BASE + 'faces/maze/d100/d100-20.webp',
      BASE + 'faces/maze/d100/d100-30.webp',
      BASE + 'faces/maze/d100/d100-40.webp',
      BASE + 'faces/maze/d100/d100-50.webp',
      BASE + 'faces/maze/d100/d100-60.webp',
      BASE + 'faces/maze/d100/d100-70.webp',
      BASE + 'faces/maze/d100/d100-80.webp',
      BASE + 'faces/maze/d100/d100-90.webp',
      BASE + 'faces/maze/d100/d100-100.webp'
    ],
	system:"Maze"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/maze/d20/d20-1.webp',
      BASE + 'faces/maze/d20/d20-2.webp',
      BASE + 'faces/maze/d20/d20-3.webp',
      BASE + 'faces/maze/d20/d20-4.webp',
      BASE + 'faces/maze/d20/d20-5.webp',
      BASE + 'faces/maze/d20/d20-6.webp',
      BASE + 'faces/maze/d20/d20-7.webp',
      BASE + 'faces/maze/d20/d20-8.webp',
      BASE + 'faces/maze/d20/d20-9.webp',
      BASE + 'faces/maze/d20/d20-10.webp',
      BASE + 'faces/maze/d20/d20-11.webp',
      BASE + 'faces/maze/d20/d20-12.webp',
      BASE + 'faces/maze/d20/d20-13.webp',
      BASE + 'faces/maze/d20/d20-14.webp',
      BASE + 'faces/maze/d20/d20-15.webp',
      BASE + 'faces/maze/d20/d20-16.webp',
      BASE + 'faces/maze/d20/d20-17.webp',
      BASE + 'faces/maze/d20/d20-18.webp',
      BASE + 'faces/maze/d20/d20-19.webp',
      BASE + 'faces/maze/d20/d20-20.webp'
    ],
    system:"Maze"
  });

dice3d.addSystem({id:"Flamestalker",name:"⁂ Flame Stalker (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/flamestalker/dfm.webp',
      BASE + 'faces/flamestalker/df.webp',
      BASE + 'faces/flamestalker/dfp.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/dfmb.webp',
      BASE + 'faces/flamestalker/dfb.webp',
      BASE + 'faces/flamestalker/dfpb.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/flamestalker/d2-1.webp',
      BASE + 'faces/flamestalker/d2-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d2-1b.webp',
      BASE + 'faces/flamestalker/d2-2b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/flamestalker/dc-1.webp',
      BASE + 'faces/flamestalker/dc-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/dc-1b.webp',
      BASE + 'faces/flamestalker/dc-2b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/flamestalker/d4-1.webp',
      BASE + 'faces/flamestalker/d4-2.webp',
      BASE + 'faces/flamestalker/d4-3.webp',
      BASE + 'faces/flamestalker/d4-4.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/flamestalker/d6-1.webp',
      BASE + 'faces/flamestalker/d6-2.webp',
      BASE + 'faces/flamestalker/d6-3.webp',
      BASE + 'faces/flamestalker/d6-4.webp',
      BASE + 'faces/flamestalker/d6-5.webp',
      BASE + 'faces/flamestalker/d6-6.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d6-1b.webp',
      BASE + 'faces/flamestalker/d6-2b.webp',
      BASE + 'faces/flamestalker/d6-3b.webp',
      BASE + 'faces/flamestalker/d6-4b.webp',
      BASE + 'faces/flamestalker/d6-5b.webp',
      BASE + 'faces/flamestalker/d6-6b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/flamestalker/d8-1.webp',
      BASE + 'faces/flamestalker/d8-2.webp',
      BASE + 'faces/flamestalker/d8-3.webp',
      BASE + 'faces/flamestalker/d8-4.webp',
      BASE + 'faces/flamestalker/d8-5.webp',
      BASE + 'faces/flamestalker/d8-6.webp',
      BASE + 'faces/flamestalker/d8-7.webp',
      BASE + 'faces/flamestalker/d8-8.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d8-1b.webp',
      BASE + 'faces/flamestalker/d8-2b.webp',
      BASE + 'faces/flamestalker/d8-3b.webp',
      BASE + 'faces/flamestalker/d8-4b.webp',
      BASE + 'faces/flamestalker/d8-5b.webp',
      BASE + 'faces/flamestalker/d8-6b.webp',
      BASE + 'faces/flamestalker/d8-7b.webp',
      BASE + 'faces/flamestalker/d8-8b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/flamestalker/d10-1.webp',
      BASE + 'faces/flamestalker/d10-2.webp',
      BASE + 'faces/flamestalker/d10-3.webp',
      BASE + 'faces/flamestalker/d10-4.webp',
      BASE + 'faces/flamestalker/d10-5.webp',
      BASE + 'faces/flamestalker/d10-6.webp',
      BASE + 'faces/flamestalker/d10-7.webp',
      BASE + 'faces/flamestalker/d10-8.webp',
      BASE + 'faces/flamestalker/d10-9.webp',
      BASE + 'faces/flamestalker/d10-10.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d10-1b.webp',
      BASE + 'faces/flamestalker/d10-2b.webp',
      BASE + 'faces/flamestalker/d10-3b.webp',
      BASE + 'faces/flamestalker/d10-4b.webp',
      BASE + 'faces/flamestalker/d10-5b.webp',
      BASE + 'faces/flamestalker/d10-6b.webp',
      BASE + 'faces/flamestalker/d10-7b.webp',
      BASE + 'faces/flamestalker/d10-8b.webp',
      BASE + 'faces/flamestalker/d10-9b.webp',
      BASE + 'faces/flamestalker/d10-10b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/flamestalker/d12-1.webp',
      BASE + 'faces/flamestalker/d12-2.webp',
      BASE + 'faces/flamestalker/d12-3.webp',
      BASE + 'faces/flamestalker/d12-4.webp',
      BASE + 'faces/flamestalker/d12-5.webp',
      BASE + 'faces/flamestalker/d12-6.webp',
      BASE + 'faces/flamestalker/d12-7.webp',
      BASE + 'faces/flamestalker/d12-8.webp',
      BASE + 'faces/flamestalker/d12-9.webp',
      BASE + 'faces/flamestalker/d12-10.webp',
      BASE + 'faces/flamestalker/d12-11.webp',
      BASE + 'faces/flamestalker/d12-12.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d12-1b.webp',
      BASE + 'faces/flamestalker/d12-2b.webp',
      BASE + 'faces/flamestalker/d12-3b.webp',
      BASE + 'faces/flamestalker/d12-4b.webp',
      BASE + 'faces/flamestalker/d12-5b.webp',
      BASE + 'faces/flamestalker/d12-6b.webp',
      BASE + 'faces/flamestalker/d12-7b.webp',
      BASE + 'faces/flamestalker/d12-8b.webp',
      BASE + 'faces/flamestalker/d12-9b.webp',
      BASE + 'faces/flamestalker/d12-10b.webp',
      BASE + 'faces/flamestalker/d12-11b.webp',
      BASE + 'faces/flamestalker/d12-12b.webp'
	 ],
      system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/flamestalker/d100-10.webp',
      BASE + 'faces/flamestalker/d100-20.webp',
      BASE + 'faces/flamestalker/d100-30.webp',
      BASE + 'faces/flamestalker/d100-40.webp',
      BASE + 'faces/flamestalker/d100-50.webp',
      BASE + 'faces/flamestalker/d100-60.webp',
      BASE + 'faces/flamestalker/d100-70.webp',
      BASE + 'faces/flamestalker/d100-80.webp',
      BASE + 'faces/flamestalker/d100-90.webp',
      BASE + 'faces/flamestalker/d100-100.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d100-10b.webp',
      BASE + 'faces/flamestalker/d100-20b.webp',
      BASE + 'faces/flamestalker/d100-30b.webp',
      BASE + 'faces/flamestalker/d100-40b.webp',
      BASE + 'faces/flamestalker/d100-50b.webp',
      BASE + 'faces/flamestalker/d100-60b.webp',
      BASE + 'faces/flamestalker/d100-70b.webp',
      BASE + 'faces/flamestalker/d100-80b.webp',
      BASE + 'faces/flamestalker/d100-90b.webp',
      BASE + 'faces/flamestalker/d100-100b.webp'
    ],
	system:"Flamestalker"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/flamestalker/d20-1.webp',
      BASE + 'faces/flamestalker/d20-2.webp',
      BASE + 'faces/flamestalker/d20-3.webp',
      BASE + 'faces/flamestalker/d20-4.webp',
      BASE + 'faces/flamestalker/d20-5.webp',
      BASE + 'faces/flamestalker/d20-6.webp',
      BASE + 'faces/flamestalker/d20-7.webp',
      BASE + 'faces/flamestalker/d20-8.webp',
      BASE + 'faces/flamestalker/d20-9.webp',
      BASE + 'faces/flamestalker/d20-10.webp',
      BASE + 'faces/flamestalker/d20-11.webp',
      BASE + 'faces/flamestalker/d20-12.webp',
      BASE + 'faces/flamestalker/d20-13.webp',
      BASE + 'faces/flamestalker/d20-14.webp',
      BASE + 'faces/flamestalker/d20-15.webp',
      BASE + 'faces/flamestalker/d20-16.webp',
      BASE + 'faces/flamestalker/d20-17.webp',
      BASE + 'faces/flamestalker/d20-18.webp',
      BASE + 'faces/flamestalker/d20-19.webp',
      BASE + 'faces/flamestalker/d20-20.webp'
    ],
    bumpMaps:[
      BASE + 'faces/flamestalker/d20-1b.webp',
      BASE + 'faces/flamestalker/d20-2b.webp',
      BASE + 'faces/flamestalker/d20-3b.webp',
      BASE + 'faces/flamestalker/d20-4b.webp',
      BASE + 'faces/flamestalker/d20-5b.webp',
      BASE + 'faces/flamestalker/d20-6b.webp',
      BASE + 'faces/flamestalker/d20-7b.webp',
      BASE + 'faces/flamestalker/d20-8b.webp',
      BASE + 'faces/flamestalker/d20-9b.webp',
      BASE + 'faces/flamestalker/d20-10b.webp',
      BASE + 'faces/flamestalker/d20-11b.webp',
      BASE + 'faces/flamestalker/d20-12b.webp',
      BASE + 'faces/flamestalker/d20-13b.webp',
      BASE + 'faces/flamestalker/d20-14b.webp',
      BASE + 'faces/flamestalker/d20-15b.webp',
      BASE + 'faces/flamestalker/d20-16b.webp',
      BASE + 'faces/flamestalker/d20-17b.webp',
      BASE + 'faces/flamestalker/d20-18b.webp',
      BASE + 'faces/flamestalker/d20-19b.webp',
      BASE + 'faces/flamestalker/d20-20b.webp'
    ],
    system:"Flamestalker"
  });

dice3d.addSystem({id:"Grifter",name:"⁂ Grifter (Set)"},false);

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/grifter/dc/dc-1.webp',
      BASE + 'faces/grifter/dc/dc-2.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/grifter/d2/d2-1.webp',
      BASE + 'faces/grifter/d2/d2-2.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/grifter/d4/d4-1.webp',
      BASE + 'faces/grifter/d4/d4-2.webp',
      BASE + 'faces/grifter/d4/d4-3.webp',
      BASE + 'faces/grifter/d4/d4-4.webp',
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/grifter/df/dfm.webp',
      BASE + 'faces/grifter/df/df.webp',
      BASE + 'faces/grifter/df/dfp.webp'
    ],
	system:"Grifter"
  });

dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/grifter/d6/d6-1.webp',
      BASE + 'faces/grifter/d6/d6-2.webp',
      BASE + 'faces/grifter/d6/d6-3.webp',
      BASE + 'faces/grifter/d6/d6-4.webp',
      BASE + 'faces/grifter/d6/d6-5.webp',
      BASE + 'faces/grifter/d6/d6-6.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/grifter/d8/d8-1.webp',
      BASE + 'faces/grifter/d8/d8-2.webp',
      BASE + 'faces/grifter/d8/d8-3.webp',
      BASE + 'faces/grifter/d8/d8-4.webp',
      BASE + 'faces/grifter/d8/d8-5.webp',
      BASE + 'faces/grifter/d8/d8-6.webp',
      BASE + 'faces/grifter/d8/d8-7.webp',
      BASE + 'faces/grifter/d8/d8-8.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/grifter/d10/d10-1.webp',
      BASE + 'faces/grifter/d10/d10-2.webp',
      BASE + 'faces/grifter/d10/d10-3.webp',
      BASE + 'faces/grifter/d10/d10-4.webp',
      BASE + 'faces/grifter/d10/d10-5.webp',
      BASE + 'faces/grifter/d10/d10-6.webp',
      BASE + 'faces/grifter/d10/d10-7.webp',
      BASE + 'faces/grifter/d10/d10-8.webp',
      BASE + 'faces/grifter/d10/d10-9.webp',
      BASE + 'faces/grifter/d10/d10-10.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/grifter/d12/d12-1.webp',
      BASE + 'faces/grifter/d12/d12-2.webp',
      BASE + 'faces/grifter/d12/d12-3.webp',
      BASE + 'faces/grifter/d12/d12-4.webp',
      BASE + 'faces/grifter/d12/d12-5.webp',
      BASE + 'faces/grifter/d12/d12-6.webp',
      BASE + 'faces/grifter/d12/d12-7.webp',
      BASE + 'faces/grifter/d12/d12-8.webp',
      BASE + 'faces/grifter/d12/d12-9.webp',
      BASE + 'faces/grifter/d12/d12-10.webp',
      BASE + 'faces/grifter/d12/d12-11.webp',
      BASE + 'faces/grifter/d12/d12-12.webp'
    ],
	system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/grifter/d20/d20-1.webp',
      BASE + 'faces/grifter/d20/d20-2.webp',
      BASE + 'faces/grifter/d20/d20-3.webp',
      BASE + 'faces/grifter/d20/d20-4.webp',
      BASE + 'faces/grifter/d20/d20-5.webp',
      BASE + 'faces/grifter/d20/d20-6.webp',
      BASE + 'faces/grifter/d20/d20-7.webp',
      BASE + 'faces/grifter/d20/d20-8.webp',
      BASE + 'faces/grifter/d20/d20-9.webp',
      BASE + 'faces/grifter/d20/d20-10.webp',
      BASE + 'faces/grifter/d20/d20-11.webp',
      BASE + 'faces/grifter/d20/d20-12.webp',
      BASE + 'faces/grifter/d20/d20-13.webp',
      BASE + 'faces/grifter/d20/d20-14.webp',
      BASE + 'faces/grifter/d20/d20-15.webp',
      BASE + 'faces/grifter/d20/d20-16.webp',
      BASE + 'faces/grifter/d20/d20-17.webp',
      BASE + 'faces/grifter/d20/d20-18.webp',
      BASE + 'faces/grifter/d20/d20-19.webp',
      BASE + 'faces/grifter/d20/d20-20.webp'
    ],
    system:"Grifter"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/grifter/d100/d100-10.webp',
      BASE + 'faces/grifter/d100/d100-20.webp',
      BASE + 'faces/grifter/d100/d100-30.webp',
      BASE + 'faces/grifter/d100/d100-40.webp',
      BASE + 'faces/grifter/d100/d100-50.webp',
      BASE + 'faces/grifter/d100/d100-60.webp',
      BASE + 'faces/grifter/d100/d100-70.webp',
      BASE + 'faces/grifter/d100/d100-80.webp',
      BASE + 'faces/grifter/d100/d100-90.webp',
      BASE + 'faces/grifter/d100/d100-00.webp'
    ],
	system:"Grifter"
  });

 dice3d.addSystem({id:"planetary",name:"⁂ Planetary (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/planetary/dfm.webp',
      BASE + 'faces/planetary/df.webp',
      BASE + 'faces/planetary/dfp.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/planetary/d2-1.webp',
      BASE + 'faces/planetary/d2-2.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/planetary/dc-1.webp',
      BASE + 'faces/planetary/dc-2.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/planetary/d4-1.webp',
      BASE + 'faces/planetary/d4-2.webp',
      BASE + 'faces/planetary/d4-3.webp',
      BASE + 'faces/planetary/d4-4.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/planetary/d6-1.webp',
      BASE + 'faces/planetary/d6-2.webp',
      BASE + 'faces/planetary/d6-3.webp',
      BASE + 'faces/planetary/d6-4.webp',
      BASE + 'faces/planetary/d6-5.webp',
      BASE + 'faces/planetary/d6-6.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/planetary/d8-1.webp',
      BASE + 'faces/planetary/d8-2.webp',
      BASE + 'faces/planetary/d8-3.webp',
      BASE + 'faces/planetary/d8-4.webp',
      BASE + 'faces/planetary/d8-5.webp',
      BASE + 'faces/planetary/d8-6.webp',
      BASE + 'faces/planetary/d8-7.webp',
      BASE + 'faces/planetary/d8-8.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/planetary/d10-1.webp',
      BASE + 'faces/planetary/d10-2.webp',
      BASE + 'faces/planetary/d10-3.webp',
      BASE + 'faces/planetary/d10-4.webp',
      BASE + 'faces/planetary/d10-5.webp',
      BASE + 'faces/planetary/d10-6.webp',
      BASE + 'faces/planetary/d10-7.webp',
      BASE + 'faces/planetary/d10-8.webp',
      BASE + 'faces/planetary/d10-9.webp',
      BASE + 'faces/planetary/d10-10.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/planetary/d12-1.webp',
      BASE + 'faces/planetary/d12-2.webp',
      BASE + 'faces/planetary/d12-3.webp',
      BASE + 'faces/planetary/d12-4.webp',
      BASE + 'faces/planetary/d12-5.webp',
      BASE + 'faces/planetary/d12-6.webp',
      BASE + 'faces/planetary/d12-7.webp',
      BASE + 'faces/planetary/d12-8.webp',
      BASE + 'faces/planetary/d12-9.webp',
      BASE + 'faces/planetary/d12-10.webp',
      BASE + 'faces/planetary/d12-11.webp',
      BASE + 'faces/planetary/d12-12.webp'
    ],
      system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/planetary/d100-10.webp',
      BASE + 'faces/planetary/d100-20.webp',
      BASE + 'faces/planetary/d100-30.webp',
      BASE + 'faces/planetary/d100-40.webp',
      BASE + 'faces/planetary/d100-50.webp',
      BASE + 'faces/planetary/d100-60.webp',
      BASE + 'faces/planetary/d100-70.webp',
      BASE + 'faces/planetary/d100-80.webp',
      BASE + 'faces/planetary/d100-90.webp',
      BASE + 'faces/planetary/d100-100.webp'
    ],
	system:"planetary"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/planetary/d20-1.webp',
      BASE + 'faces/planetary/d20-2.webp',
      BASE + 'faces/planetary/d20-3.webp',
      BASE + 'faces/planetary/d20-4.webp',
      BASE + 'faces/planetary/d20-5.webp',
      BASE + 'faces/planetary/d20-6.webp',
      BASE + 'faces/planetary/d20-7.webp',
      BASE + 'faces/planetary/d20-8.webp',
      BASE + 'faces/planetary/d20-9.webp',
      BASE + 'faces/planetary/d20-10.webp',
      BASE + 'faces/planetary/d20-11.webp',
      BASE + 'faces/planetary/d20-12.webp',
      BASE + 'faces/planetary/d20-13.webp',
      BASE + 'faces/planetary/d20-14.webp',
      BASE + 'faces/planetary/d20-15.webp',
      BASE + 'faces/planetary/d20-16.webp',
      BASE + 'faces/planetary/d20-17.webp',
      BASE + 'faces/planetary/d20-18.webp',
      BASE + 'faces/planetary/d20-19.webp',
      BASE + 'faces/planetary/d20-20.webp'
    ],
    system:"planetary"
  });	
	
 dice3d.addSystem({id:"roman",name:"⁂ Roman Superiority (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/roman/dfm.webp',
      BASE + 'faces/roman/df.webp',
      BASE + 'faces/roman/dfp.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/dfmb.webp',
      BASE + 'faces/roman/dfb.webp',
      BASE + 'faces/roman/dfpb.webp'
    ],
	system:"roman"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/roman/d2-1.webp',
      BASE + 'faces/roman/d2-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d2-1b.webp',
      BASE + 'faces/roman/d2-2b.webp'
    ],
	system:"roman"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/roman/dc-1.webp',
      BASE + 'faces/roman/dc-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/dc-1b.webp',
      BASE + 'faces/roman/dc-2b.webp'
    ],
	system:"roman"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      'I','II','III','IV'
    ],
    system:"roman"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/roman/d6-1.webp',
      BASE + 'faces/roman/d6-2.webp',
      BASE + 'faces/roman/d6-3.webp',
      BASE + 'faces/roman/d6-4.webp',
      BASE + 'faces/roman/d6-5.webp',
      BASE + 'faces/roman/d6-6.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d6-1b.webp',
      BASE + 'faces/roman/d6-2b.webp',
      BASE + 'faces/roman/d6-3b.webp',
      BASE + 'faces/roman/d6-4b.webp',
      BASE + 'faces/roman/d6-5b.webp',
      BASE + 'faces/roman/d6-6b.webp'
    ],
	system:"roman"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/roman/d8-1.webp',
      BASE + 'faces/roman/d8-2.webp',
      BASE + 'faces/roman/d8-3.webp',
      BASE + 'faces/roman/d8-4.webp',
      BASE + 'faces/roman/d8-5.webp',
      BASE + 'faces/roman/d8-6.webp',
      BASE + 'faces/roman/d8-7.webp',
      BASE + 'faces/roman/d8-8.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d8-1b.webp',
      BASE + 'faces/roman/d8-2b.webp',
      BASE + 'faces/roman/d8-3b.webp',
      BASE + 'faces/roman/d8-4b.webp',
      BASE + 'faces/roman/d8-5b.webp',
      BASE + 'faces/roman/d8-6b.webp',
      BASE + 'faces/roman/d8-7b.webp',
      BASE + 'faces/roman/d8-8b.webp'
    ],
	system:"roman"
  });

   dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/roman/d10-1.webp',
      BASE + 'faces/roman/d10-2.webp',
      BASE + 'faces/roman/d10-3.webp',
      BASE + 'faces/roman/d10-4.webp',
      BASE + 'faces/roman/d10-5.webp',
      BASE + 'faces/roman/d10-6.webp',
      BASE + 'faces/roman/d10-7.webp',
      BASE + 'faces/roman/d10-8.webp',
      BASE + 'faces/roman/d10-9.webp',
      BASE + 'faces/roman/d10-10.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d10-1b.webp',
      BASE + 'faces/roman/d10-2b.webp',
      BASE + 'faces/roman/d10-3b.webp',
      BASE + 'faces/roman/d10-4b.webp',
      BASE + 'faces/roman/d10-5b.webp',
      BASE + 'faces/roman/d10-6b.webp',
      BASE + 'faces/roman/d10-7b.webp',
      BASE + 'faces/roman/d10-8b.webp',
      BASE + 'faces/roman/d10-9b.webp',
      BASE + 'faces/roman/d10-10b.webp'
    ],
	system:"roman"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/roman/d12-1.webp',
      BASE + 'faces/roman/d12-2.webp',
      BASE + 'faces/roman/d12-3.webp',
      BASE + 'faces/roman/d12-4.webp',
      BASE + 'faces/roman/d12-5.webp',
      BASE + 'faces/roman/d12-6.webp',
      BASE + 'faces/roman/d12-7.webp',
      BASE + 'faces/roman/d12-8.webp',
      BASE + 'faces/roman/d12-9.webp',
      BASE + 'faces/roman/d12-10.webp',
      BASE + 'faces/roman/d12-11.webp',
      BASE + 'faces/roman/d12-12.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d12-1b.webp',
      BASE + 'faces/roman/d12-2b.webp',
      BASE + 'faces/roman/d12-3b.webp',
      BASE + 'faces/roman/d12-4b.webp',
      BASE + 'faces/roman/d12-5b.webp',
      BASE + 'faces/roman/d12-6b.webp',
      BASE + 'faces/roman/d12-7b.webp',
      BASE + 'faces/roman/d12-8b.webp',
      BASE + 'faces/roman/d12-9b.webp',
      BASE + 'faces/roman/d12-10b.webp',
      BASE + 'faces/roman/d12-11b.webp',
      BASE + 'faces/roman/d12-12b.webp'
	 ],
      system:"roman"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/roman/d20-1.webp',
      BASE + 'faces/roman/d20-2.webp',
      BASE + 'faces/roman/d20-3.webp',
      BASE + 'faces/roman/d20-4.webp',
      BASE + 'faces/roman/d20-5.webp',
      BASE + 'faces/roman/d20-6.webp',
      BASE + 'faces/roman/d20-7.webp',
      BASE + 'faces/roman/d20-8.webp',
      BASE + 'faces/roman/d20-9.webp',
      BASE + 'faces/roman/d20-10.webp',
      BASE + 'faces/roman/d20-11.webp',
      BASE + 'faces/roman/d20-12.webp',
      BASE + 'faces/roman/d20-13.webp',
      BASE + 'faces/roman/d20-14.webp',
      BASE + 'faces/roman/d20-15.webp',
      BASE + 'faces/roman/d20-16.webp',
      BASE + 'faces/roman/d20-17.webp',
      BASE + 'faces/roman/d20-18.webp',
      BASE + 'faces/roman/d20-19.webp',
      BASE + 'faces/roman/d20-20.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d20-1b.webp',
      BASE + 'faces/roman/d20-2b.webp',
      BASE + 'faces/roman/d20-3b.webp',
      BASE + 'faces/roman/d20-4b.webp',
      BASE + 'faces/roman/d20-5b.webp',
      BASE + 'faces/roman/d20-6b.webp',
      BASE + 'faces/roman/d20-7b.webp',
      BASE + 'faces/roman/d20-8b.webp',
      BASE + 'faces/roman/d20-9b.webp',
      BASE + 'faces/roman/d20-10b.webp',
      BASE + 'faces/roman/d20-11b.webp',
      BASE + 'faces/roman/d20-12b.webp',
      BASE + 'faces/roman/d20-13b.webp',
      BASE + 'faces/roman/d20-14b.webp',
      BASE + 'faces/roman/d20-15b.webp',
      BASE + 'faces/roman/d20-16b.webp',
      BASE + 'faces/roman/d20-17b.webp',
      BASE + 'faces/roman/d20-18b.webp',
      BASE + 'faces/roman/d20-19b.webp',
      BASE + 'faces/roman/d20-20b.webp'
    ],
    system:"roman"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/roman/d100-10.webp',
      BASE + 'faces/roman/d100-20.webp',
      BASE + 'faces/roman/d100-30.webp',
      BASE + 'faces/roman/d100-40.webp',
      BASE + 'faces/roman/d100-50.webp',
      BASE + 'faces/roman/d100-60.webp',
      BASE + 'faces/roman/d100-70.webp',
      BASE + 'faces/roman/d100-80.webp',
      BASE + 'faces/roman/d100-90.webp',
      BASE + 'faces/roman/d100-100.webp'
    ],
    bumpMaps:[
      BASE + 'faces/roman/d100-10b.webp',
      BASE + 'faces/roman/d100-20b.webp',
      BASE + 'faces/roman/d100-30b.webp',
      BASE + 'faces/roman/d100-40b.webp',
      BASE + 'faces/roman/d100-50b.webp',
      BASE + 'faces/roman/d100-60b.webp',
      BASE + 'faces/roman/d100-70b.webp',
      BASE + 'faces/roman/d100-80b.webp',
      BASE + 'faces/roman/d100-90b.webp',
      BASE + 'faces/roman/d100-100b.webp'
    ],
	system:"roman"
  });	
	
  dice3d.addSystem({id:"GMDice",name:"⁂ GM Dice (d20)"},false);

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/gmdice/d20/d20-ehhmaybe.webp',
      BASE + 'faces/gmdice/d20/d20-skull1.webp',
      BASE + 'faces/gmdice/d20/d20-skull2.webp',
      BASE + 'faces/gmdice/d20/d20-skull3.webp',
      BASE + 'faces/gmdice/d20/d20-skull1.webp',
      BASE + 'faces/gmdice/d20/d20-skull2.webp',
      BASE + 'faces/gmdice/d20/d20-death.webp',
      BASE + 'faces/gmdice/d20/d20-nottoday.webp',
      BASE + 'faces/gmdice/d20/d20-playerdeath.webp',
      BASE + 'faces/gmdice/d20/d20-skull3.webp',
      BASE + 'faces/gmdice/d20/d20-skull1.webp',
      BASE + 'faces/gmdice/d20/d20-skull2.webp',
      BASE + 'faces/gmdice/d20/d20-skull3.webp',
      BASE + 'faces/gmdice/d20/d20-skull1.webp',
      BASE + 'faces/gmdice/d20/d20-20.webp',
      BASE + 'faces/gmdice/d20/d20-25.webp',
      BASE + 'faces/gmdice/d20/d20-77.webp',
      BASE + 'faces/gmdice/d20/d20-66.webp',
      BASE + 'faces/gmdice/d20/d20-tpk.webp',
      BASE + 'faces/gmdice/d20/d20-youdie.webp'
    ],
    system:"GMDice"
  });

dice3d.addSystem({id:"Hallo",name:"⁂ Halloween (Set)"},false);

  dice3d.addDicePreset({
    type:"df",
    labels:[
      BASE + 'faces/halloween/dfm.webp',
      BASE + 'faces/halloween/df.webp',
      BASE + 'faces/halloween/dfp.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/dfmb.webp',
      BASE + 'faces/halloween/dfb.webp',
      BASE + 'faces/halloween/dfpb.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d2",
    labels:[
      BASE + 'faces/halloween/d2-1.webp',
      BASE + 'faces/halloween/d2-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d2-1b.webp',
      BASE + 'faces/halloween/d2-2b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"dc",
    labels:[
      BASE + 'faces/halloween/dc-1.webp',
      BASE + 'faces/halloween/dc-2.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/dc-1b.webp',
      BASE + 'faces/halloween/dc-2b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d4",
    labels:[
      BASE + 'faces/halloween/d4-1.webp',
      BASE + 'faces/halloween/d4-2.webp',
      BASE + 'faces/halloween/d4-3.webp',
      BASE + 'faces/halloween/d4-4.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d6",
    labels:[
      BASE + 'faces/halloween/d6-1.webp',
      BASE + 'faces/halloween/d6-2.webp',
      BASE + 'faces/halloween/d6-3.webp',
      BASE + 'faces/halloween/d6-4.webp',
      BASE + 'faces/halloween/d6-5.webp',
      BASE + 'faces/halloween/d6-6.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d6-1b.webp',
      BASE + 'faces/halloween/d6-2b.webp',
      BASE + 'faces/halloween/d6-3b.webp',
      BASE + 'faces/halloween/d6-4b.webp',
      BASE + 'faces/halloween/d6-5b.webp',
      BASE + 'faces/halloween/d6-6b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d8",
    labels:[
      BASE + 'faces/halloween/d8-1.webp',
      BASE + 'faces/halloween/d8-2.webp',
      BASE + 'faces/halloween/d8-3.webp',
      BASE + 'faces/halloween/d8-4.webp',
      BASE + 'faces/halloween/d8-5.webp',
      BASE + 'faces/halloween/d8-6.webp',
      BASE + 'faces/halloween/d8-7.webp',
      BASE + 'faces/halloween/d8-8.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d8-1b.webp',
      BASE + 'faces/halloween/d8-2b.webp',
      BASE + 'faces/halloween/d8-3b.webp',
      BASE + 'faces/halloween/d8-4b.webp',
      BASE + 'faces/halloween/d8-5b.webp',
      BASE + 'faces/halloween/d8-6b.webp',
      BASE + 'faces/halloween/d8-7b.webp',
      BASE + 'faces/halloween/d8-8b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d10",
    labels:[
      BASE + 'faces/halloween/d10-1.webp',
      BASE + 'faces/halloween/d10-2.webp',
      BASE + 'faces/halloween/d10-3.webp',
      BASE + 'faces/halloween/d10-4.webp',
      BASE + 'faces/halloween/d10-5.webp',
      BASE + 'faces/halloween/d10-6.webp',
      BASE + 'faces/halloween/d10-7.webp',
      BASE + 'faces/halloween/d10-8.webp',
      BASE + 'faces/halloween/d10-9.webp',
      BASE + 'faces/halloween/d10-10.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d10-1b.webp',
      BASE + 'faces/halloween/d10-2b.webp',
      BASE + 'faces/halloween/d10-3b.webp',
      BASE + 'faces/halloween/d10-4b.webp',
      BASE + 'faces/halloween/d10-5b.webp',
      BASE + 'faces/halloween/d10-6b.webp',
      BASE + 'faces/halloween/d10-7b.webp',
      BASE + 'faces/halloween/d10-8b.webp',
      BASE + 'faces/halloween/d10-9b.webp',
      BASE + 'faces/halloween/d10-10b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d12",
    labels:[
      BASE + 'faces/halloween/d12-1.webp',
      BASE + 'faces/halloween/d12-2.webp',
      BASE + 'faces/halloween/d12-3.webp',
      BASE + 'faces/halloween/d12-4.webp',
      BASE + 'faces/halloween/d12-5.webp',
      BASE + 'faces/halloween/d12-6.webp',
      BASE + 'faces/halloween/d12-7.webp',
      BASE + 'faces/halloween/d12-8.webp',
      BASE + 'faces/halloween/d12-9.webp',
      BASE + 'faces/halloween/d12-10.webp',
      BASE + 'faces/halloween/d12-11.webp',
      BASE + 'faces/halloween/d12-12.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d12-1b.webp',
      BASE + 'faces/halloween/d12-2b.webp',
      BASE + 'faces/halloween/d12-3b.webp',
      BASE + 'faces/halloween/d12-4b.webp',
      BASE + 'faces/halloween/d12-5b.webp',
      BASE + 'faces/halloween/d12-6b.webp',
      BASE + 'faces/halloween/d12-7b.webp',
      BASE + 'faces/halloween/d12-8b.webp',
      BASE + 'faces/halloween/d12-9b.webp',
      BASE + 'faces/halloween/d12-10b.webp',
      BASE + 'faces/halloween/d12-11b.webp',
      BASE + 'faces/halloween/d12-12b.webp'
	 ],
      system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d100",
    labels:[
      BASE + 'faces/halloween/d100-10.webp',
      BASE + 'faces/halloween/d100-20.webp',
      BASE + 'faces/halloween/d100-30.webp',
      BASE + 'faces/halloween/d100-40.webp',
      BASE + 'faces/halloween/d100-50.webp',
      BASE + 'faces/halloween/d100-60.webp',
      BASE + 'faces/halloween/d100-70.webp',
      BASE + 'faces/halloween/d100-80.webp',
      BASE + 'faces/halloween/d100-90.webp',
      BASE + 'faces/halloween/d100-100.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d100-10b.webp',
      BASE + 'faces/halloween/d100-20b.webp',
      BASE + 'faces/halloween/d100-30b.webp',
      BASE + 'faces/halloween/d100-40b.webp',
      BASE + 'faces/halloween/d100-50b.webp',
      BASE + 'faces/halloween/d100-60b.webp',
      BASE + 'faces/halloween/d100-70b.webp',
      BASE + 'faces/halloween/d100-80b.webp',
      BASE + 'faces/halloween/d100-90b.webp',
      BASE + 'faces/halloween/d100-100b.webp'
    ],
	system:"Hallo"
  });

  dice3d.addDicePreset({
    type:"d20",
    labels:[
      BASE + 'faces/halloween/d20-1.webp',
      BASE + 'faces/halloween/d20-2.webp',
      BASE + 'faces/halloween/d20-3.webp',
      BASE + 'faces/halloween/d20-4.webp',
      BASE + 'faces/halloween/d20-5.webp',
      BASE + 'faces/halloween/d20-6.webp',
      BASE + 'faces/halloween/d20-7.webp',
      BASE + 'faces/halloween/d20-8.webp',
      BASE + 'faces/halloween/d20-9.webp',
      BASE + 'faces/halloween/d20-10.webp',
      BASE + 'faces/halloween/d20-11.webp',
      BASE + 'faces/halloween/d20-12.webp',
      BASE + 'faces/halloween/d20-13.webp',
      BASE + 'faces/halloween/d20-14.webp',
      BASE + 'faces/halloween/d20-15.webp',
      BASE + 'faces/halloween/d20-16.webp',
      BASE + 'faces/halloween/d20-17.webp',
      BASE + 'faces/halloween/d20-18.webp',
      BASE + 'faces/halloween/d20-19.webp',
      BASE + 'faces/halloween/d20-20.webp'
    ],
    bumpMaps:[
      BASE + 'faces/halloween/d20-1b.webp',
      BASE + 'faces/halloween/d20-2b.webp',
      BASE + 'faces/halloween/d20-3b.webp',
      BASE + 'faces/halloween/d20-4b.webp',
      BASE + 'faces/halloween/d20-5b.webp',
      BASE + 'faces/halloween/d20-6b.webp',
      BASE + 'faces/halloween/d20-7b.webp',
      BASE + 'faces/halloween/d20-8b.webp',
      BASE + 'faces/halloween/d20-9b.webp',
      BASE + 'faces/halloween/d20-10b.webp',
      BASE + 'faces/halloween/d20-11b.webp',
      BASE + 'faces/halloween/d20-12b.webp',
      BASE + 'faces/halloween/d20-13b.webp',
      BASE + 'faces/halloween/d20-14b.webp',
      BASE + 'faces/halloween/d20-15b.webp',
      BASE + 'faces/halloween/d20-16b.webp',
      BASE + 'faces/halloween/d20-17b.webp',
      BASE + 'faces/halloween/d20-18b.webp',
      BASE + 'faces/halloween/d20-19b.webp',
      BASE + 'faces/halloween/d20-20b.webp'
    ],
    system:"Hallo"	
  });
}
