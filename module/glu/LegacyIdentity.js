// GLUniverse Dice: keep the Dice So Nice package identity reachable after the rename.
//
// The package id is "gluniverse-dice", but systems and modules that integrate DSN look it up
// as "dice-so-nice":
//   - game.modules.get("dice-so-nice")?.active   (feature gates, version checks)
//   - document.getFlag("dice-so-nice", ...)       (throws unless the scope is an active package)
// Settings, flags, keybindings, hooks and CSS classes keep the "dice-so-nice" namespace, so they
// need no shim and existing DSN worlds keep their settings. See FORK.md "Identity".
//
// This file must be the first import of main.js: it installs before any init hook can run.

export const MODULE_ID = "gluniverse-dice";
export const LEGACY_ID = "dice-so-nice";

let installed = false;
let legacyConflict = false;

/** True when the real Dice So Nice is also active. The shim then stands down. */
export function isLegacyConflict() {
    return legacyConflict;
}

function installModulesAlias(modules) {
    const self = modules.get(MODULE_ID);
    if (!self) return;
    const real = modules.get(LEGACY_ID);
    //the real DSN active as well: the two conflict, never shadow it. Installed but disabled (a
    //server that switched over and kept DSN on disk) it must not win the lookup: integrations
    //asking get("dice-so-nice")?.active would see false, and DSN's settings would be filed under
    //the disabled package's own tab instead of ours.
    if (real?.active) {
        legacyConflict = !!self.active;
        return;
    }
    //instance-level overrides only: iteration (module lists, flag scopes) is untouched, so the
    //package never appears twice in the UI.
    const get = modules.get;
    const has = modules.has;
    modules.get = function (key, ...rest) {
        return get.call(this, key === LEGACY_ID ? MODULE_ID : key, ...rest);
    };
    modules.has = function (key) {
        return has.call(this, key === LEGACY_ID ? MODULE_ID : key);
    };
}

function installFlagScope() {
    const backend = globalThis.CONFIG?.DatabaseBackend;
    if (!backend || typeof backend.getFlagScopes !== "function") return;
    const getFlagScopes = backend.getFlagScopes;
    backend.getFlagScopes = function () {
        const scopes = getFlagScopes.call(this);
        //the cached array is returned by reference: adding once is enough, but stay idempotent
        if (!legacyConflict && scopes.includes(MODULE_ID) && !scopes.includes(LEGACY_ID)) scopes.push(LEGACY_ID);
        return scopes;
    };
}

function install(game) {
    if (installed || !game?.modules) return;
    installed = true;
    installModulesAlias(game.modules);
}

function trapGameAssignment() {
    //Foundry runs `globalThis.game = await Game.create(view)` and then `game.initialize()` (which
    //fires init). Package scripts are evaluated before that, so trap the assignment: game.modules
    //exists by the time the setter runs, and no package code has observed it yet.
    const desc = Object.getOwnPropertyDescriptor(globalThis, "game");
    if (desc && !desc.configurable) return false;
    let value = desc ? (desc.get ? desc.get.call(globalThis) : desc.value) : undefined;
    Object.defineProperty(globalThis, "game", {
        configurable: true,
        enumerable: true,
        get() { return value; },
        set(v) {
            value = v;
            install(v);
            //once the real game object is in, step out of the way
            if (v?.modules) Object.defineProperty(globalThis, "game", { value: v, writable: true, configurable: true, enumerable: true });
        }
    });
    return true;
}

export function installLegacyIdentity() {
    installFlagScope();
    if (globalThis.game?.modules) install(globalThis.game);
    else if (!trapGameAssignment()) Hooks.once("init", () => install(globalThis.game));
    //fallback for any path where the trap did not fire (e.g. another package replaced game)
    Hooks.once("init", () => {
        install(globalThis.game);
        if (legacyConflict) {
            console.error(`GLUniverse Dice | Dice So Nice is also active. The two modules conflict: disable one of them.`);
        }
    });
    Hooks.once("ready", () => {
        if (legacyConflict) ui.notifications?.error("GLUniverse Dice and Dice So Nice are both active. Disable one of them.", { permanent: true });
    });
}

installLegacyIdentity();
