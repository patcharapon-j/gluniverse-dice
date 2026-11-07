// GLUniverse Dice entry point, imported first by main.js (the only line main.js gains).
// Order matters: LegacyIdentity installs before any init hook runs.
import "./LegacyIdentity.js";
import { registerPhysicsEngineSetting } from "./PhysicsEngine.js";

Hooks.once("init", () => {
    registerPhysicsEngineSetting();
});
