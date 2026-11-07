// GLUniverse Dice: Rapier physics worker. Answers the same webworker-promise operations as
// PhysicsWorker.js (cannon-es); see FORK.md "Physics worker contract".
// Built as its own bundle (dist/workers/rapier-physics-worker.js) by tools/rollup-glu.js.
import RAPIER from '@dimforge/rapier3d-compat';
import RegisterPromise from 'webworker-promise/lib/register';
import { RapierPhysicsEngine } from './rapier/RapierPhysicsEngine.js';

const OPERATIONS = [
    'init', 'addConstraint', 'removeConstraint', 'updateConstraint', 'createShape', 'getDiceValue',
    'createDice', 'createDiceBatch', 'removeDice', 'addDice', 'applyImpulse', 'getBodyQuaternion',
    'setBodyPosition', 'setBodyPositions', 'playStep', 'simulateThrow', 'updateBarriers',
    'getWorldInfo', 'setCollisionResponse'
];

class RapierPhysicsWorker {
    constructor() {
        const host = RegisterPromise();
        this.engine = new RapierPhysicsEngine(RAPIER, {
            emit: (event, data) => host.emit(event, data),
            transferable: (data, list) => new RegisterPromise.TransferableResponse(data, list)
        });

        //wasm init is async: queue every operation behind it so call order is preserved
        let ready = false;
        let failure = null;
        const readyPromise = RAPIER.init().then(() => { ready = true; }, (err) => { failure = err; throw err; });

        const wrap = (name) => (data) => {
            const run = () => this.engine[name](data);
            if (ready) return run();
            if (failure) throw failure;
            return readyPromise.then(run);
        };
        for (const name of OPERATIONS) host.operation(name, wrap(name));

        //handshake used by createPhysicsWorker to fall back to cannon-es if this worker cannot start
        host.operation('ping', () => readyPromise.then(() => ({ engine: 'rapier', version: RAPIER.version?.() ?? null })));
        host.operation('getRestInfo', wrap('getRestInfo'));
    }
}

new RapierPhysicsWorker();
