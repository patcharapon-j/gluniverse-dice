// GLUniverse Dice entry point, imported first by main.js (the only line main.js gains).
// Order matters: LegacyIdentity installs before any init hook runs.
import "./LegacyIdentity.js";
import { registerPhysicsEngineSetting } from "./PhysicsEngine.js";
import { registerSmoothnessSettings } from "./Smoothness.js";
import { registerPrewarmSetting } from "./ShaderPrewarm.js";
import { registerMaterialSettings } from "./materials/GluMaterials.js";
import { registerNiceMoreDice } from "./vendor/niceMoreDice.js";

Hooks.once("init", () => {
    registerPhysicsEngineSetting();
    registerSmoothnessSettings();
    registerPrewarmSetting();
    registerMaterialSettings();
});

//bundled Nice more Dice (CC BY 4.0, LyncsCwtsh); skipped when that module is itself active
Hooks.on("diceSoNiceReady", registerNiceMoreDice);
