// Rapier physics backend for Dice So Nice / GLUniverse Dice.
//
// Implements the exact message contract of module/web-workers/PhysicsWorker.js (cannon-es),
// documented in FORK.md "Physics worker contract". ThrowEngine, DiceBox, PersistentDiceManager
// and InputHandler talk to either engine without knowing which one they have.
//
// Unlike the cannon-es worker, this runs natively in meters (1 unit = 1 m), so the only I/O
// conversion is none at all. Velocities, thresholds and gravity that cannon-es expresses at
// legacy scale are converted once in DEFAULT_TUNING.
//
// Licence: AGPL-3.0, like the rest of the module. Rapier itself is Apache-2.0.

import { buildShapeGeometry, readFace } from './shapeGeometry.js';
import { RAPIER_GRAVITY } from './gravity.js';

// legacy (cannon-es worker) units per meter: TARGET_D6_EDGE_METERS / 50
const LEGACY_TO_METERS = 0.016 / 50;
const L = LEGACY_TO_METERS;

export const DEFAULT_TUNING = Object.freeze({
    // twice the cannon-es worker's gravity, for weight (gravity.js)
    gravity: RAPIER_GRAVITY,
    // Rapier tolerances scale with this. Dice are ~3-6 cm across.
    lengthUnit: 0.05,
    solverIterations: 8,
    pgsIterations: 1,
    // cannon-es damping 0.1 means v *= 0.9 per second; Rapier uses v /= (1 + dt*c), c = -ln(0.9)
    linearDamping: -Math.log(0.9),
    angularDamping: -Math.log(0.9),
    // materials. Rapier has per-collider coefficients plus a combine rule (Max > Multiply > Min > Average)
    // The desk grips (desk-die friction 1.0, Max rule) and dice slip on each other (0.3). With
    // DSN's light legacy gravity (~2.5 m/s^2) friction only slows a die by mu*g, so at 0.4 dice
    // skidded flat across the board: 66% of their desk travel was sliding, and the d6 faces came
    // out uneven (bench chi^2 114). These values: 25% sliding, chi^2 8.7, fewer cocked dice.
    diceFriction: 0.3,
    diceRestitution: 0.6,
    deskFriction: 1.0,
    deskRestitution: 0.5,
    deskFrictionRule: "max",
    barrierFriction: 0,
    barrierRestitution: 0.85,
    // continuous collision detection for fast throws
    ccd: true,
    // settle detector, used where cannon-es tests sleepState (end of throw, bystanders).
    // Rapier's own sleep thresholds are not exposed to JS and its time-to-sleep is 2 s, which
    // would add ~120 dead frames to every replay. A die is "settled" after sleepTime under both
    // thresholds. It is NOT put to sleep by hand: forcing body.sleep() on a die whose contact
    // island is awake makes Rapier integrate it without contacts and it falls through the desk.
    sleepLinear: 0.02,      // m/s
    sleepAngular: 0.35,     // rad/s
    sleepTime: 0.25,        // s spent under both thresholds
    // torsional friction: below spinSpeed (m/s), spin about the vertical decays at spinFriction /s
    spinFriction: 8,
    spinSpeed: 0.1,
    // rolling resistance, which Rapier does not model either: a real die's edges catch on the
    // table, so a slow die stops within a face or two, while a hull (a d20 most of all, being
    // nearly round) rolls on and creeps for a second. Below rollSpeed (m/s, horizontal, with
    // little vertical motion), linear and angular velocity decay at up to rollDrag /s, more the
    // slower the die goes. 0 turns it off.
    rollDrag: 0,
    rollSpeed: 0.25,
    // d2: octagonal hull like cannon-es (true cylinders roll on their edge far longer)
    coinAsHull: true,
    // d2 only. A thin hull lying on the desk gets angular kicks from the contact solver every
    // few steps (up to ~1.4 rad/s about a horizontal axis at < 1 deg of tilt), so it never passes
    // the angular settle test and the throw runs to the frame cap. And the octagonal hull has
    // flat facets, so a slow coin can stand on its edge. Below coinSlowSpeed (m/s):
    //  - tilt under coinFlatAngle (rad): settles on the linear test alone
    //  - tilt over coinEdgeAngle for coinToppleDelay s: a kick of coinToppleKick rad/s toward flat,
    //    at most coinToppleTries times per die and throw; the direction alternates per try in
    //    case a wall or another die blocks the first one
    coinSlowSpeed: 0.15,
    coinFlatAngle: 0.15,
    coinEdgeAngle: 0.7,
    coinToppleDelay: 0.3,
    coinToppleKick: 2.5,
    coinToppleTries: 4,
    // optional rounded edges (meters). 0 = exact DSN hull
    borderRadius: 0,
    maxSubSteps: 10
});

// collision sound thresholds of the cannon-es worker, converted to m/s
const DICE_SOUND_MIN_SPEED = 250 * L;
const DICE_SOUND_MAX_SPEED = 550 * L;
const TABLE_SOUND_MIN_SPEED = 100 * L;
const TABLE_SOUND_MAX_SPEED = 500 * L;

const STATIC_BOX_HALF_THICKNESS = 1;   // m
const STATIC_BOX_HALF_EXTENT = 50;     // m, effectively infinite like cannon's planes

const ALL_GROUPS = 0xFFFFFFFF;
const NO_GROUPS = 0;

export class RapierPhysicsEngine {

    /**
     * @param {object} RAPIER  an initialised @dimforge/rapier3d-compat namespace
     * @param {{ emit: (event: string, data: any) => void, transferable?: (data: any, list: ArrayBuffer[]) => any }} host
     */
    constructor(RAPIER, host) {
        this.R = RAPIER;
        this.host = host;
        this.shapeList = new Map();   //name -> geometry
        this.shapeDefs = new Map();   //name -> definition
        this.diceList = new Map();    //id -> die entry
        this.diceConstraints = new Map();
        this.colliderOwner = new Map(); //collider handle -> { die } | { table: true }
        this.tuning = { ...DEFAULT_TUNING };
        this.world = null;
    }

    _transferable(data, list) {
        return this.host.transferable ? this.host.transferable(data, list) : data;
    }

    // === world ===

    init(data) {
        const R = this.R;
        if (data.tuning) Object.assign(this.tuning, data.tuning);
        const t = this.tuning;

        if (this.world) this._disposeWorld();

        this.world = new R.World({ x: 0, y: t.gravity, z: 0 });
        this.world.lengthUnit = t.lengthUnit;
        this.world.numSolverIterations = t.solverIterations;
        if ('numInternalPgsIterations' in this.world) this.world.numInternalPgsIterations = t.pgsIterations;
        this.world.timestep = 1 / 60;
        this.eventQueue = new R.EventQueue(true);

        this.soundDelay = 2;
        this.animstate = 'throw';
        this.muteSoundSecretRolls = data.muteSoundSecretRolls;
        this.framerate = 1 / 60;
        this.accumulator = 0;
        this.stepnumber = 0;

        //bodies created by a previous init belong to the freed world
        for (const die of this.diceList.values()) { die.body = null; die.collider = null; }
        this.diceConstraints.clear();
        this.colliderOwner.clear();

        this._addDesk();
        this._addBarriers(data.height, data.width, this._margin(data.margin));
        this.reset();
        //reset sets animstate='simulate' but no sim is running after init, so allow playStep
        this.animstate = 'throw';
    }

    _disposeWorld() {
        try { this.world.free(); } catch (e) { /* already freed */ }
        try { this.eventQueue?.free(); } catch (e) { /* already freed */ }
        this.world = null;
    }

    _margin(m) {
        return { top: m?.top || 0, bottom: m?.bottom || 0, left: m?.left || 0, right: m?.right || 0 };
    }

    //Desk and walls are thick boxes whose inner face sits where cannon-es puts its planes.
    //Not Rapier HalfSpace: measured with 0.21.0, a die vertex that crosses a half-space within one
    //step is not pushed back out (a d12 came to rest with one vertex 12.6 mm under the desk, the d2
    //hull sank 11 mm at rest). Box-vs-hull contacts do not show either problem.
    _addStaticPlane(normal, position, friction, restitution, frictionRule, restitutionRule) {
        const R = this.R;
        const T = STATIC_BOX_HALF_THICKNESS;
        const E = STATIC_BOX_HALF_EXTENT;
        const center = { x: position.x - normal.x * T, y: position.y - normal.y * T, z: position.z - normal.z * T };
        const half = {
            x: normal.x !== 0 ? T : E,
            y: normal.y !== 0 ? T : E,
            z: normal.z !== 0 ? T : E
        };
        const body = this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(center.x, center.y, center.z));
        const desc = R.ColliderDesc.cuboid(half.x, half.y, half.z)
            .setFriction(friction)
            .setRestitution(restitution)
            .setFrictionCombineRule(frictionRule)
            .setRestitutionCombineRule(restitutionRule);
        const collider = this.world.createCollider(desc, body);
        this.colliderOwner.set(collider.handle, { table: true });
        body.userData = { normal };
        return body;
    }

    _addDesk() {
        const R = this.R;
        const t = this.tuning;
        //deskFrictionRule "max": desk-die contact takes the larger friction, so the desk can grip
        //(dice roll instead of skidding) while die-on-die contact keeps diceFriction.
        //"min": the smaller one wins (the desk value when it is the lower one).
        const frictionRule = t.deskFrictionRule === "max" ? R.CoefficientCombineRule.Max : R.CoefficientCombineRule.Min;
        this.desk = this._addStaticPlane({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0 }, t.deskFriction, t.deskRestitution,
            frictionRule, R.CoefficientCombineRule.Min);
    }

    _barrierPositions(height, width, margin) {
        const s = this.barriersScale;
        return [
            { x: 0, y: 0, z: (height - margin.top * 2) * s },
            { x: 0, y: 0, z: (-height + margin.bottom * 2) * s },
            { x: (width - margin.right * 2) * s, y: 0, z: 0 },
            { x: (-width + margin.left * 2) * s, y: 0, z: 0 }
        ];
    }

    //four walls around the desk, same placement as the cannon-es worker
    _addBarriers(height, width, margin) {
        const R = this.R;
        const t = this.tuning;
        this.barriersScale = 0.97;
        const normals = [{ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }, { x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }];
        const positions = this._barrierPositions(height, width, margin);
        //Min friction (0 wins), Max restitution (bouncy walls win)
        this.barriers = normals.map((n, i) => this._addStaticPlane(n, positions[i], t.barrierFriction, t.barrierRestitution,
            R.CoefficientCombineRule.Min, R.CoefficientCombineRule.Max));
    }

    updateBarriers({ height, width, margin }) {
        if (!this.barriers) return;
        const positions = this._barrierPositions(height, width, this._margin(margin));
        const T = STATIC_BOX_HALF_THICKNESS;
        positions.forEach((p, i) => {
            const n = this.barriers[i].userData.normal;
            this.barriers[i].setTranslation({ x: p.x - n.x * T, y: p.y - n.y * T, z: p.z - n.z * T }, true);
        });
    }

    reset() {
        this.lastSoundType = '';
        this.lastSoundStep = 0;
        this.lastSound = 0;
        this.detectedCollides = new Array(1000);
        this.iterationsNeeded = 0;
        this.animstate = 'simulate';
        this.iteration = 0;
    }

    // === shapes ===

    createShape({ name, radius, definition }) {
        this.shapeList.set(name, buildShapeGeometry(definition, radius));
        this.shapeDefs.set(name, definition);
    }

    // === dice ===

    createDice({ id, shape, material, vectordata, mass, startAtIteration, options }) {
        const geometry = this.shapeList.get(shape);
        if (!geometry) throw new Error(`[Rapier] createDice: unknown shape "${shape}"`);
        const a = vectordata.axis;
        //cannon setFromAxisAngle does not normalise the axis; normalise the result instead
        const s = Math.sin(a.a * Math.PI * 2 * 0.5);
        const q = { x: a.x * s, y: a.y * s, z: a.z * s, w: Math.cos(a.a * Math.PI * 2 * 0.5) };
        const ql = Math.hypot(q.x, q.y, q.z, q.w) || 1;
        //replacing an existing id (cannon overwrites the map entry, leaving the old body behind)
        const previous = this.diceList.get(id);
        if (previous) this._destroyBody(previous);
        this.diceList.set(id, {
            id,
            geometry,
            mass,
            initial: {
                pos: { ...vectordata.pos },
                quat: { x: q.x / ql, y: q.y / ql, z: q.z / ql, w: q.w / ql },
                linvel: { ...vectordata.velocity },
                angvel: { ...vectordata.angle }
            },
            body: null,
            collider: null,
            diceType: vectordata.type,
            diceShape: shape,
            diceMaterial: material,
            secretRoll: options?.secret ?? false,
            persistent: options?.persistent ?? false,
            startAtIteration,
            result: null,
            dead: undefined,
            fixed: false,
            allowSleep: true,
            collisionResponse: true,
            rest: 0,
            settled: false,
            preSpeed: 0
        });
    }

    createDiceBatch(specs) {
        const addToWorld = [];
        for (const spec of specs) {
            this.createDice(spec);
            if (spec.startAtIteration === 0) addToWorld.push(spec.id);
        }
        for (const id of addToWorld) this.addDice(id);
    }

    addDice(id) {
        const die = this.diceList.get(id);
        if (!die || die.body) return;
        const R = this.R;
        const t = this.tuning;
        const { pos, quat, linvel, angvel } = die.initial;
        const bodyDesc = R.RigidBodyDesc.dynamic()
            .setTranslation(pos.x, pos.y, pos.z)
            .setRotation(quat)
            .setLinvel(linvel.x, linvel.y, linvel.z)
            .setAngvel(angvel)
            .setLinearDamping(t.linearDamping)
            .setAngularDamping(t.angularDamping)
            .setCcdEnabled(t.ccd)
            .setCanSleep(true);
        die.body = this.world.createRigidBody(bodyDesc);

        let colliderDesc = null;
        const shape = die.geometry.collider;
        if (shape?.kind === "cylinder" && !t.coinAsHull) {
            colliderDesc = t.borderRadius > 0 && t.borderRadius < shape.halfHeight
                ? R.ColliderDesc.roundCylinder(shape.halfHeight - t.borderRadius, shape.radius - t.borderRadius, t.borderRadius)
                : R.ColliderDesc.cylinder(shape.halfHeight, shape.radius);
        } else if (t.borderRadius > 0) {
            //shrink the hull by the border so the rounded die keeps its outer size
            const pts = die.geometry.points;
            const shrunk = new Float32Array(pts.length);
            for (let i = 0; i < pts.length; i += 3) {
                const l = Math.hypot(pts[i], pts[i + 1], pts[i + 2]) || 1;
                const k = Math.max(0.1, (l - t.borderRadius) / l);
                shrunk[i] = pts[i] * k; shrunk[i + 1] = pts[i + 1] * k; shrunk[i + 2] = pts[i + 2] * k;
            }
            colliderDesc = R.ColliderDesc.roundConvexHull(shrunk, t.borderRadius);
        }
        if (!colliderDesc) colliderDesc = R.ColliderDesc.convexHull(die.geometry.points);
        if (!colliderDesc) throw new Error(`[Rapier] convex hull failed for shape "${die.diceShape}"`);
        colliderDesc
            .setMass(Math.max(die.mass, 1e-6))
            .setFriction(t.diceFriction)
            .setRestitution(t.diceRestitution)
            .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS)
            .setSolverGroups(die.collisionResponse ? ALL_GROUPS : NO_GROUPS);
        die.collider = this.world.createCollider(colliderDesc, die.body);
        this.colliderOwner.set(die.collider.handle, { die });
        die.rest = 0;
        die.settled = false;
        die.fixed = false;
    }

    _destroyBody(die) {
        if (!die.body) return;
        if (die.collider) this.colliderOwner.delete(die.collider.handle);
        //removing the body also removes its colliders and joints
        this.world.removeRigidBody(die.body);
        die.body = null;
        die.collider = null;
    }

    removeDice(ids) {
        for (const id of ids) {
            this._removeConstraintEntry(id);
            const die = this.diceList.get(id);
            if (!die) continue;
            this._destroyBody(die);
            this.diceList.delete(id);
        }
        //wake survivors so they react to removed supports
        for (const die of this.diceList.values()) if (die.body && !die.fixed) die.body.wakeUp();
    }

    _setDynamic(die) {
        if (die.fixed && die.body) {
            die.body.setBodyType(this.R.RigidBodyType.Dynamic, true);
            die.fixed = false;
        }
    }

    applyImpulse({ id, velocity, angularVelocity }) {
        const die = this.diceList.get(id);
        if (!die) return;
        die.result = null;
        if (!die.body) {
            die.initial.linvel = { ...velocity };
            die.initial.angvel = { ...angularVelocity };
            return;
        }
        this._setDynamic(die);
        die.body.wakeUp();
        die.rest = 0;
        die.settled = false;
        die.body.setLinvel(velocity, true);
        die.body.setAngvel(angularVelocity, true);
    }

    getBodyQuaternion(id) {
        const die = this.diceList.get(id);
        if (!die) return null;
        const q = die.body ? die.body.rotation() : die.initial.quat;
        return { x: q.x, y: q.y, z: q.z, w: q.w };
    }

    _setBodyPosition(die, position) {
        if (!die.body) {
            die.initial.pos = { ...position };
            die.initial.linvel = { x: 0, y: 0, z: 0 };
            die.initial.angvel = { x: 0, y: 0, z: 0 };
            return;
        }
        die.body.setTranslation(position, true);
        die.prevPose = null; //a teleport is not interpolated
        die.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        die.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        die.rest = 0;
        die.settled = false;
    }

    setBodyPosition({ id, position }) {
        const die = this.diceList.get(id);
        if (die) this._setBodyPosition(die, position);
    }

    //batch setBodyPosition to avoid N worker messages per frame
    setBodyPositions({ updates }) {
        for (const { id, position } of updates) {
            const die = this.diceList.get(id);
            if (die) this._setBodyPosition(die, position);
        }
    }

    setCollisionResponse({ ids, enabled }) {
        for (const id of ids) {
            const die = this.diceList.get(id);
            if (!die) continue;
            die.collisionResponse = enabled;
            die.collider?.setSolverGroups(enabled ? ALL_GROUPS : NO_GROUPS);
        }
    }

    _bodyQuat(die) {
        return die.body ? die.body.rotation() : die.initial.quat;
    }

    getDiceValue(id) {
        const die = this.diceList.get(id);
        if (!die) return null;
        if (die.result) return die.result;
        die.result = readFace(die.geometry, die.diceShape, this._bodyQuat(die)).value;
        return die.result;
    }

    /** benchmark helper, not part of the cannon contract: angle (rad) between the read face and up */
    getRestInfo(id) {
        const die = this.diceList.get(id);
        if (!die) return null;
        const q = this._bodyQuat(die);
        const r = readFace(die.geometry, die.diceShape, q);
        const p = die.body ? die.body.translation() : die.initial.pos;
        return { value: r.value, tilt: r.angle, position: { x: p.x, y: p.y, z: p.z }, quaternion: { x: q.x, y: q.y, z: q.z, w: q.w }, sleeping: this._isSettled(die) };
    }

    // === constraints (grab) ===

    addConstraint({ id, pos }) {
        const die = this.diceList.get(id);
        if (!die || !die.body) return;

        //idempotent: already constrained, just reposition
        if (this.diceConstraints.has(id)) {
            return this.updateConstraint({ positions: { [id]: pos } });
        }

        const R = this.R;
        const prevAllowSleep = die.allowSleep;
        die.allowSleep = false;
        die.body.wakeUp();

        const bp = die.body.translation();
        let pivot;
        let anchorPos;
        if (die.persistent) {
            pivot = { x: 0, y: 0, z: 0 };
            //keep current xz so pickup doesn't teleport, lift to caller's y
            anchorPos = { x: bp.x, y: pos.y, z: bp.z };
        } else {
            //click point in body-local coordinates
            const q = die.body.rotation();
            const inv = { x: -q.x, y: -q.y, z: -q.z, w: q.w };
            const local = rotate([pos.x - bp.x, pos.y - bp.y, pos.z - bp.z], inv);
            pivot = { x: local[0], y: local[1], z: local[2] };
            anchorPos = { x: pos.x, y: pos.y, z: pos.z };
        }

        const joint = this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(anchorPos.x, anchorPos.y, anchorPos.z));
        const constraint = this.world.createImpulseJoint(R.JointData.spherical(pivot, { x: 0, y: 0, z: 0 }), die.body, joint, true);
        this.diceConstraints.set(id, { joint, constraint, prevAllowSleep });
    }

    updateConstraint(payload) {
        if (this.diceConstraints.size === 0) return;
        const positions = payload?.positions;
        if (!positions) return;
        for (const [id, pos] of Object.entries(positions)) {
            //Object.entries gives string keys, Map uses numbers
            const key = this.diceConstraints.has(Number(id)) ? Number(id) : id;
            const entry = this.diceConstraints.get(key);
            if (!entry) continue;
            entry.joint.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: pos.z });
            const die = this.diceList.get(key);
            if (die?.body) die.body.wakeUp();
        }
    }

    _removeConstraintEntry(id) {
        const entry = this.diceConstraints.get(id);
        if (!entry) return;
        //removing the anchor body removes the joint with it
        this.world.removeRigidBody(entry.joint);
        const die = this.diceList.get(id);
        if (die) {
            die.allowSleep = entry.prevAllowSleep ?? true;
            die.rest = 0;
            die.settled = false;
            die.body?.wakeUp();
        }
        this.diceConstraints.delete(id);
    }

    //remove constraints for given ids (or all), restore sleep policy
    removeConstraint(payload) {
        const ids = payload?.ids ?? Array.from(this.diceConstraints.keys());
        for (const id of ids) this._removeConstraintEntry(id);
    }

    // === stepping ===

    _isSettled(die) {
        if (die.fixed) return true;
        if (!die.body) return false;
        return die.settled || die.body.isSleeping();
    }

    _step(dt) {
        //speed before the step: cannon-es samples collision sounds before the solver bounces the die
        for (const die of this.diceList.values()) {
            if (!die.body || die.fixed) { die.preSpeed = 0; continue; }
            const v = die.body.linvel();
            die.preSpeed = Math.hypot(v.x, v.y, v.z);
        }
        this.world.timestep = dt;
        this.world.step(this.eventQueue);
        this.stepnumber++;
        this.eventQueue.drainCollisionEvents((h1, h2, started) => {
            if (started) this._onCollisionStarted(h1, h2);
        });
        this._settleTick(dt);
    }

    //own sleep policy: Rapier's thresholds are not configurable from JS and its default
    //time-to-sleep (2 s) would add ~120 dead frames to every replay
    _settleTick(dt) {
        const t = this.tuning;
        const lin2 = t.sleepLinear * t.sleepLinear;
        const ang2 = t.sleepAngular * t.sleepAngular;
        for (const die of this.diceList.values()) {
            const body = die.body;
            if (!body || die.fixed) continue;
            if (body.isSleeping()) { die.rest = t.sleepTime; die.settled = true; continue; }
            if (!die.allowSleep) { die.rest = 0; die.settled = false; continue; }
            const v = body.linvel();
            let w = body.angvel();
            //torsional (spin) friction, which Rapier does not model: a die sliding slowly on the
            //table loses its spin about the vertical axis. Without it a d2 or a flat d6 can spin
            //in place for the whole 1000-frame cap.
            if (t.spinFriction > 0 && v.x * v.x + v.y * v.y + v.z * v.z < t.spinSpeed * t.spinSpeed && Math.abs(w.y) > 0) {
                const k = Math.exp(-t.spinFriction * dt);
                w = { x: w.x, y: w.y * k, z: w.z };
                body.setAngvel(w, false);
            }
            if (t.rollDrag > 0 && Math.abs(v.y) < t.rollSpeed * 0.5) {
                const sp = Math.sqrt(v.x * v.x + v.z * v.z);
                if (sp < t.rollSpeed) {
                    const k = Math.exp(-t.rollDrag * dt * (1 - sp / t.rollSpeed));
                    w = { x: w.x * k, y: w.y * k, z: w.z * k };
                    body.setAngvel(w, false);
                    body.setLinvel({ x: v.x * k, y: v.y, z: v.z * k }, false);
                }
            }
            die.coinFlat = false;
            if (die.geometry.collider?.kind === "cylinder") w = this._coinTick(die, body, v, w, dt);
            //a coin lying flat counts as at rest despite contact jitter on its face (see coinFlatAngle)
            if (v.x * v.x + v.y * v.y + v.z * v.z < lin2 && (die.coinFlat || w.x * w.x + w.y * w.y + w.z * w.z < ang2)) {
                die.rest += dt;
                if (die.rest >= t.sleepTime) die.settled = true;
            } else {
                die.rest = 0;
                die.settled = false;
            }
        }
    }

    _coinTick(die, body, v, w, dt) {
        const t = this.tuning;
        if (v.x * v.x + v.y * v.y + v.z * v.z > t.coinSlowSpeed * t.coinSlowSpeed) { die.tipping = 0; return w; }
        const r = readFace(die.geometry, die.diceShape, body.rotation());
        if (r.angle < t.coinFlatAngle) {
            die.tipping = 0;
            die.coinFlat = true;
        } else if (r.angle > t.coinEdgeAngle && t.coinToppleKick > 0 && r.normal && (die.topples || 0) < t.coinToppleTries) {
            die.tipping = (die.tipping || 0) + dt;
            if (die.tipping > t.coinToppleDelay) {
                //one kick about n x up, which turns the face normal n toward +Y. The direction
                //alternates per try, in case a wall or another die blocks the first one.
                const n = r.normal;
                const l = Math.hypot(n[2], n[0]);
                if (l > 1e-6) {
                    const a = t.coinToppleKick * (die.topples % 2 ? -1 : 1) / l;
                    w = { x: w.x - n[2] * a, y: w.y, z: w.z + n[0] * a };
                    body.setAngvel(w, true);
                    die.rest = 0;
                    die.settled = false;
                }
                die.tipping = 0;
                die.topples = (die.topples || 0) + 1;
            }
        } else {
            die.tipping = 0;
        }
        return w;
    }

    // === collision sounds (same policy as the cannon-es worker) ===

    _onCollisionStarted(h1, h2) {
        const o1 = this.colliderOwner.get(h1);
        const o2 = this.colliderOwner.get(h2);
        if (!o1 || !o2) return;
        //cannon dispatches 'collide' to each body of the pair; only dice listen
        if (o1.die) this._eventCollide(o2, o1.die);
        if (o2.die) this._eventCollide(o1, o2.die);
    }

    _eventCollide(other, target) {
        //skip phantom collisions involving ghostified (no collision response) bodies
        if (target.collisionResponse === false || (other.die && other.die.collisionResponse === false)) return;
        //cannon's test is body.mass > 0: a die made static after a throw counts as table
        const otherIsDie = !!(other.die && !other.die.fixed);
        const now = this.stepnumber;
        const currentSoundType = otherIsDie ? 'dice' : 'table';
        if (this._shouldSkipSound(now, currentSoundType)) return;
        if (otherIsDie) this._handleDiceCollision(other.die, target);
        else this._handleTableCollision(target);
        this.lastSoundStep = now;
        this.lastSound = now + this.soundDelay;
    }

    _shouldSkipSound(now, currentSoundType) {
        const soundPlayedThisStep = this.lastSoundStep === now;
        const notEnoughDelay = this.lastSound > now;
        if (soundPlayedThisStep || notEnoughDelay) {
            const sameSoundType = currentSoundType === 'dice' && this.lastSoundType === 'dice';
            return !(currentSoundType !== 'dice') || sameSoundType;
        }
        return false;
    }

    _strength(speed, maxSpeed, minStrength) {
        return Math.max(Math.min(speed / maxSpeed, 1), minStrength);
    }

    _handleDiceCollision(body, target) {
        const speed = body.preSpeed;
        if (speed < DICE_SOUND_MIN_SPEED) return;
        const strength = this._strength(speed, DICE_SOUND_MAX_SPEED, 0.2);
        const shouldMute = this.muteSoundSecretRolls && (body.secretRoll || target.secretRoll);
        const finalStrength = shouldMute ? 0 : strength;
        if (this.animstate === "simulate") {
            const a = body.body.translation(), b = target.body.translation();
            //5th element: contact position in meters (midpoint of the two dice)
            this.detectedCollides[this.iteration] = ["dice", body.diceType, body.diceMaterial, finalStrength, [(a.x + b.x) * 0.5, (a.y + b.y) * 0.5, (a.z + b.z) * 0.5]];
        } else {
            this.host.emit("collide", { source: "dice", type: body.diceType, material: body.diceMaterial, strength: finalStrength });
        }
        this.lastSoundType = 'dice';
    }

    _handleTableCollision(target) {
        const speed = target.preSpeed;
        if (speed < TABLE_SOUND_MIN_SPEED) return;
        const strength = this._strength(speed, TABLE_SOUND_MAX_SPEED, 0.2);
        const shouldMute = this.muteSoundSecretRolls && target.secretRoll;
        const finalStrength = shouldMute ? 0 : strength;
        if (this.animstate === "simulate") {
            const p = target.body.translation();
            //5th element: the die's position in meters
            this.detectedCollides[this.iteration] = ["table", null, null, finalStrength, [p.x, p.y, p.z]];
        } else {
            this.host.emit("collide", { source: "table", type: null, material: null, strength: finalStrength });
        }
        this.lastSoundType = 'table';
    }

    // === throw simulation ===

    simulateThrow({ minIterations, nbIterationsBetweenRolls, framerate, canBeFlipped, impulses }) {
        this.reset();
        this.minIterations = minIterations;
        this.nbIterationsBetweenRolls = nbIterationsBetweenRolls;
        this.framerate = framerate;
        this.canBeFlipped = canBeFlipped;
        for (const die of this.diceList.values()) { die.topples = 0; die.tipping = 0; }

        //apply impulses atomically before the first world step
        const impulseIds = new Set();
        if (impulses) {
            for (const [impId, imp] of Object.entries(impulses)) {
                const numId = Number(impId);
                const key = this.diceList.has(numId) ? numId : impId;
                const die = this.diceList.get(key);
                if (!die || !imp) continue;
                impulseIds.add(key);
                this.applyImpulse({ id: key, velocity: imp.velocity, angularVelocity: imp.angularVelocity });
            }
        }

        //primary dice determine when the sim ends:
        //impulse recipients + non-persistent dice (ephemeral, including dead from prior throws)
        const primary = [];
        for (const [id, die] of this.diceList) {
            if (impulseIds.has(id) || !die.persistent) primary.push(die);
        }

        const MAX_FRAMES = 1001;
        const maxIterations = 1000;
        const tracked = new Map();

        //snapshot sleeping dice for backfill (taken after impulses so recipients are awake)
        const restingSnapshots = new Map();
        for (const [id, die] of this.diceList) {
            if (die.body && this._isSettled(die)) {
                const p = die.body.translation();
                const q = die.body.rotation();
                restingSnapshots.set(id, { p: [p.x, p.y, p.z], q: [q.x, q.y, q.z, q.w] });
            }
        }

        const startTracking = (id, die, frame) => {
            const posBuffer = new Float32Array(MAX_FRAMES * 3);
            const quatBuffer = new Float32Array(MAX_FRAMES * 4);
            const snap = restingSnapshots.get(id);
            let bfPos, bfQuat;
            if (snap) {
                bfPos = snap.p; bfQuat = snap.q;
            } else if (die.body) {
                const p = die.body.translation(); const q = die.body.rotation();
                bfPos = [p.x, p.y, p.z]; bfQuat = [q.x, q.y, q.z, q.w];
            } else {
                const p = die.initial.pos; const q = die.initial.quat;
                bfPos = [p.x, p.y, p.z]; bfQuat = [q.x, q.y, q.z, q.w];
            }
            for (let f = 0; f <= frame; f++) {
                posBuffer.set(bfPos, f * 3);
                quatBuffer.set(bfQuat, f * 4);
            }
            tracked.set(id, { die, posBuffer, quatBuffer });
        };

        //seed: track awake dynamic dice already in the world (skip stagger-pending and sleeping bystanders)
        for (const [id, die] of this.diceList) {
            if (die.startAtIteration > 0) continue;
            if (!die.body || die.fixed) continue;
            if (this._isSettled(die)) continue;
            startTracking(id, die, 0);
        }

        while (this.iteration < maxIterations) {
            ++this.iteration;

            //stagger: add bodies at their designated iteration
            if (!(this.iteration % nbIterationsBetweenRolls)) {
                for (const [id, die] of this.diceList) {
                    if (die.startAtIteration === this.iteration) {
                        this.addDice(id);
                        if (!tracked.has(id)) startTracking(id, die, this.iteration);
                    }
                }
            }

            this._step(framerate);

            for (const entry of tracked.values()) {
                const b = entry.die.body;
                if (!b) continue;
                const p = b.translation();
                const q = b.rotation();
                const pi = this.iteration * 3;
                const qi = this.iteration * 4;
                entry.posBuffer[pi] = p.x; entry.posBuffer[pi + 1] = p.y; entry.posBuffer[pi + 2] = p.z;
                entry.quatBuffer[qi] = q.x; entry.quatBuffer[qi + 1] = q.y; entry.quatBuffer[qi + 2] = q.z; entry.quatBuffer[qi + 3] = q.w;
            }

            //pick up any die that woke this frame (collision knocked a bystander)
            for (const [id, die] of this.diceList) {
                if (tracked.has(id)) continue;
                if (!die.body || die.fixed) continue;
                if (this._isSettled(die)) continue;
                startTracking(id, die, this.iteration);
            }

            //exit when all primary dice have settled
            if (this.iteration >= (minIterations || 0)) {
                let allSettled = true;
                for (const die of primary) {
                    if (!this._isSettled(die)) { allSettled = false; break; }
                }
                if (allSettled) break;
            }
        }

        this.iterationsNeeded = this.iteration;

        //post-sim: cache face values for all tracked dice, make ephemerals static
        const faceValues = {};
        const finalQuaternions = {};
        for (const [id, die] of this.diceList) {
            if (tracked.has(id)) {
                die.result = null;
                faceValues[id] = this.getDiceValue(id);
                const q = this._bodyQuat(die);
                finalQuaternions[id] = { x: q.x, y: q.y, z: q.z, w: q.w };
            }
            if (!die.persistent && !canBeFlipped) {
                if (!die.result) die.result = this.getDiceValue(id);
                if (die.body && !die.fixed) {
                    die.body.setBodyType(this.R.RigidBodyType.Fixed, false);
                }
                die.fixed = true;
                die.dead = this.iterationsNeeded;
            }
        }

        this.animstate = 'throw';

        const ids = [];
        const quaternionsBuffers = [];
        const positionsBuffers = [];
        const deads = [];
        for (const [id, entry] of tracked) {
            ids.push(id);
            quaternionsBuffers.push(entry.quatBuffer.buffer);
            positionsBuffers.push(entry.posBuffer.buffer);
            deads.push(entry.die.dead ?? false);
        }

        return this._transferable({
            ids,
            quaternionsBuffers,
            positionsBuffers,
            detectedCollides: this.detectedCollides,
            deads,
            iterationsNeeded: this.iterationsNeeded,
            faceValues,
            finalQuaternions
        }, [...quaternionsBuffers, ...positionsBuffers]);
    }

    _snapshotPoses() {
        for (const die of this.diceList.values()) {
            if (!die.body || die.dead) continue;
            const p = die.body.translation();
            const q = die.body.rotation();
            const prev = die.prevPose || (die.prevPose = { p: { x: 0, y: 0, z: 0 }, q: { x: 0, y: 0, z: 0, w: 1 } });
            prev.p.x = p.x; prev.p.y = p.y; prev.p.z = p.z;
            prev.q.x = q.x; prev.q.y = q.y; prev.q.z = q.z; prev.q.w = q.w;
            prev.step = this.stepnumber;
        }
    }

    //time_diff: upstream's time since the last whole step (re-counts the remainder each frame).
    //frame_dt: the real time since the previous playStep; used when given.
    //interpolate: return the pose blended between the last two fixed steps by the leftover time.
    playStep({ time_diff, frame_dt, interpolate }) {
        if (this.animstate == 'simulate') return;
        const ids = [];
        let worldAsleep = this.diceConstraints.size === 0;
        if (worldAsleep) {
            for (const die of this.diceList.values()) {
                if (die.body && !this._isSettled(die)) { worldAsleep = false; break; }
            }
        }
        let quaternions = new Float32Array(0);
        let positions = new Float32Array(0);
        if (!worldAsleep) {
            //fixed timestep with accumulator, like cannon-es World.step(dt, timeSinceLastCalled, maxSubSteps)
            const dt = this.framerate;
            this.accumulator += Math.max(0, (frame_dt ?? time_diff) || 0);
            let substeps = 0;
            while (this.accumulator >= dt && substeps < this.tuning.maxSubSteps) {
                if (interpolate) this._snapshotPoses();
                this._step(dt);
                this.accumulator -= dt;
                substeps++;
            }
            this.accumulator = this.accumulator % dt;

            quaternions = new Float32Array(this.diceList.size * 4);
            positions = new Float32Array(this.diceList.size * 3);
            for (const [id, die] of this.diceList) {
                if (die.dead || !die.body) continue;
                let p = die.body.translation();
                let q = die.body.rotation();
                if (interpolate && die.prevPose?.step === this.stepnumber - 1) ({ p, q } = blendPose(die.prevPose, p, q, this.accumulator / dt));
                ids.push(id);
                const n = ids.length - 1;
                quaternions[n * 4] = q.x; quaternions[n * 4 + 1] = q.y; quaternions[n * 4 + 2] = q.z; quaternions[n * 4 + 3] = q.w;
                positions[n * 3] = p.x; positions[n * 3 + 1] = p.y; positions[n * 3 + 2] = p.z;
            }
        }
        return this._transferable({ ids, quaternionsBuffers: quaternions.buffer, positionsBuffers: positions.buffer, worldAsleep }, [quaternions.buffer, positions.buffer]);
    }

    //debug function to get the state of the world
    getWorldInfo() {
        console.log(`[Rapier] World step: ${this.stepnumber}, bodies: ${this.world?.bodies.len?.() ?? '?'}, dice: ${this.diceList.size}, constraints: ${this.diceConstraints.size}`);
        for (const die of this.diceList.values()) {
            console.log(die.id, die.diceShape, die.body ? die.body.translation() : 'pending', { fixed: die.fixed, sleeping: die.body?.isSleeping(), persistent: die.persistent });
        }
    }
}

//lerp positions, nlerp quaternions (shortest arc). Steps are 1/60 s, so nlerp is close to slerp.
function blendPose(prev, p, q, t) {
    const u = Math.max(0, Math.min(1, t));
    const s = prev.q.x * q.x + prev.q.y * q.y + prev.q.z * q.z + prev.q.w * q.w < 0 ? -1 : 1;
    const qx = prev.q.x + (q.x * s - prev.q.x) * u;
    const qy = prev.q.y + (q.y * s - prev.q.y) * u;
    const qz = prev.q.z + (q.z * s - prev.q.z) * u;
    const qw = prev.q.w + (q.w * s - prev.q.w) * u;
    const l = Math.hypot(qx, qy, qz, qw) || 1;
    return {
        p: { x: prev.p.x + (p.x - prev.p.x) * u, y: prev.p.y + (p.y - prev.p.y) * u, z: prev.p.z + (p.z - prev.p.z) * u },
        q: { x: qx / l, y: qy / l, z: qz / l, w: qw / l }
    };
}

function rotate(v, q) {
    const { x, y, z, w } = q;
    const ix = w * v[0] + y * v[2] - z * v[1];
    const iy = w * v[1] + z * v[0] - x * v[2];
    const iz = w * v[2] + x * v[1] - y * v[0];
    const iw = -x * v[0] - y * v[1] - z * v[2];
    return [
        ix * w + iw * -x + iy * -z - iz * -y,
        iy * w + iw * -y + iz * -x - ix * -z,
        iz * w + iw * -z + ix * -y - iy * -x
    ];
}
