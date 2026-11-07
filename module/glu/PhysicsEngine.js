// GLUniverse Dice: physics engine selection. The single place where the physics worker is created
// (hooked from DiceFactory#physicsWorker). See FORK.md "Physics worker contract".
import WebworkerPromise from 'webworker-promise';
import { MODULE_ID } from './LegacyIdentity.js';

export const PHYSICS_ENGINES = Object.freeze({ CANNON: "cannon", RAPIER: "rapier" });

const RAPIER_WORKER_PATH = `modules/${MODULE_ID}/workers/rapier-physics-worker.js`;
const RAPIER_START_TIMEOUT_MS = 20000;

export function registerPhysicsEngineSetting() {
    game.settings.register(MODULE_ID, "physicsEngine", {
        name: "GLUDICE.Settings.PhysicsEngine.Name",
        hint: "GLUDICE.Settings.PhysicsEngine.Hint",
        scope: "world",
        config: true,
        type: String,
        choices: {
            [PHYSICS_ENGINES.CANNON]: "GLUDICE.Settings.PhysicsEngine.Cannon",
            [PHYSICS_ENGINES.RAPIER]: "GLUDICE.Settings.PhysicsEngine.Rapier"
        },
        default: PHYSICS_ENGINES.CANNON,
        requiresReload: true
    });
}

export function getConfiguredPhysicsEngine() {
    try {
        return game.settings.get(MODULE_ID, "physicsEngine") || PHYSICS_ENGINES.CANNON;
    } catch (e) {
        //setting not registered yet (worker requested before init): keep the upstream engine
        return PHYSICS_ENGINES.CANNON;
    }
}

/** The engine actually running, once known ("cannon" | "rapier"). */
export let activePhysicsEngine = null;

/**
 * Same surface as a WebworkerPromise (exec / on / off), resolving to a Rapier worker or, if it
 * cannot start, to a cannon-es one. Calls made before the choice is settled are queued in order.
 */
class DeferredPhysicsWorker {
    constructor(workerPromise) {
        this._ready = workerPromise;
    }
    exec(operation, data, transferable, onEvent) {
        return this._ready.then(worker => worker.exec(operation, data, transferable, onEvent));
    }
    on(eventName, handler) {
        this._ready.then(worker => worker.on(eventName, handler));
        return this;
    }
    off(eventName, handler) {
        this._ready.then(worker => worker.off(eventName, handler));
        return this;
    }
}

function startRapierWorker() {
    return new Promise((resolve, reject) => {
        let raw;
        try {
            raw = new Worker(foundry.utils.getRoute(RAPIER_WORKER_PATH), { name: "gluniverse-dice-rapier" });
        } catch (err) {
            reject(err);
            return;
        }
        const fail = (err) => {
            clearTimeout(timer);
            try { raw.terminate(); } catch (e) { /* already gone */ }
            reject(err);
        };
        const timer = setTimeout(() => fail(new Error("Rapier worker did not answer in time")), RAPIER_START_TIMEOUT_MS);
        raw.addEventListener("error", (ev) => fail(ev?.error ?? new Error(ev?.message || "Rapier worker failed to load")), { once: true });
        const worker = new WebworkerPromise(raw);
        worker.exec("ping").then((info) => {
            clearTimeout(timer);
            console.info(`GLUniverse Dice | physics engine: Rapier ${info?.version ?? ""}`.trim());
            resolve(worker);
        }, fail);
    });
}

/**
 * @param {() => WebworkerPromise} createCannonWorker  upstream's own worker construction
 */
export function createPhysicsWorker(createCannonWorker) {
    if (getConfiguredPhysicsEngine() !== PHYSICS_ENGINES.RAPIER) {
        activePhysicsEngine = PHYSICS_ENGINES.CANNON;
        //default path: exactly upstream's worker, no wrapper
        return createCannonWorker();
    }
    const workerPromise = startRapierWorker().then((worker) => {
        activePhysicsEngine = PHYSICS_ENGINES.RAPIER;
        return worker;
    }, (err) => {
        console.error("GLUniverse Dice | Rapier physics failed to start, falling back to cannon-es.", err);
        ui.notifications?.warn(game.i18n.localize("GLUDICE.Notifications.RapierFallback"));
        activePhysicsEngine = PHYSICS_ENGINES.CANNON;
        return createCannonWorker();
    });
    return new DeferredPhysicsWorker(workerPromise);
}
