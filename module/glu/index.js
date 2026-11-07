// GLUniverse Dice entry point, imported first by main.js (the only line main.js gains).
// Order matters: LegacyIdentity installs before any init hook runs.
import "./LegacyIdentity.js";
import { registerPhysicsEngineSetting } from "./PhysicsEngine.js";
import { registerSmoothnessSettings } from "./Smoothness.js";
import { registerPrewarmSetting } from "./ShaderPrewarm.js";
import { registerMaterialSettings } from "./materials/GluMaterials.js";
import { registerNiceMoreDice } from "./vendor/niceMoreDice.js";
import { registerFxSettings } from "./fx/DiceFx.js";
import { registerHandSetting } from "./hand/HandOfDice.js";
import { registerRollArea } from "./stream/RollArea.js";
import { registerBurnSettings } from "./fx/DiceBurn.js";
import { registerShakeSetting } from "./fx/ImpactShake.js";

Hooks.once("init", () => {
    registerPhysicsEngineSetting();
    registerSmoothnessSettings();
    registerPrewarmSetting();
    registerMaterialSettings();
    registerFxSettings();
    registerHandSetting();
    registerBurnSettings();
    registerShakeSetting();
});

//M7: game.dice3d.rollArea, live and remote roll area for the Stream Client
registerRollArea();

//bundled Nice more Dice (CC BY 4.0, LyncsCwtsh); skipped when that module is itself active
Hooks.on("diceSoNiceReady", registerNiceMoreDice);
