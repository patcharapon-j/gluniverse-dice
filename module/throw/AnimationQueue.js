import { DsnSettings } from '../settings/DsnSettings.js';
import { Accumulator } from '../Accumulator.js';
import { DiceNotation } from '../DiceNotation.js';
import { isHandThrow } from '../glu/hand/HandOfDice.js'; //GLUniverse Dice

//serializes the 3d animations: accumulates the queued rolls into batches and plays them one after the other
export class AnimationQueue {

    constructor({ canvasVisibility, pendingThrows }) {
        this.canvasVisibility = canvasVisibility;
        this.pendingThrows = pendingThrows;
        this.box = null;

        this.queue = [];
        this._currentAnimation = Promise.resolve();
        //rolls received while the tab was hidden, replayed on the next visibility change
        this.hiddenAnimationQueue = [];
        this.nextAnimation = null;
        this._nextAnimationHandler();
    }

    attach(box) {
        this.box = box;
    }

    get length() {
        return this.queue.length;
    }

    idle() {
        return this._currentAnimation;
    }

    enqueue(notation, dsnConfig) {
        notation.dsnConfig = dsnConfig;
        const immediate = isHandThrow(notation.messageId) && this.queue.length === 0 && !this.box?.running; //GLUniverse Dice: M5 no merge wait for a throw from the hand
        return new Promise((resolve, reject) => {
            this.nextAnimation.addItem({
                params: notation,
                resolve: resolve
            }, { immediate });
        });
    }

    enqueuePersistent(throwData) {
        throwData.queuedAt = Date.now();
        const idle = this.queue.length === 0 && !this.box.running;
        return new Promise((resolve) => {
            this.nextAnimation.addItem({
                type: "persistent",
                params: throwData,
                resolve: resolve
            }, { immediate: idle });
        });
    }

    deferHidden(data, config) {
        return new Promise((resolve) => {
            this.hiddenAnimationQueue.push({
                data: data,
                config: config,
                timestamp: (new Date()).getTime(),
                resolve: resolve
            });
        });
    }

    flushHidden() {
        if (!this.hiddenAnimationQueue.length) return;
        let now = (new Date()).getTime();
        for (let i = 0; i < this.hiddenAnimationQueue.length; i++) {
            let anim = this.hiddenAnimationQueue[i];
            if (now - anim.timestamp > 10000) {
                anim.resolve(false);
            } else {
                this.enqueue(anim.data, anim.config).then(displayed => {
                    anim.resolve(displayed);
                });
            }
        }
        this.hiddenAnimationQueue = [];
    }

    //make sure an interactive roll doesn't get stuck when something unexpected happens before completion
    _settleDroppedBinds(items) {
        const binds = [];
        for (const item of items) {
            if (item.type !== "persistent") continue;
            for (const mesh of item.params.heldDice ?? []) {
                if (!mesh.userData?.pendingBind) continue;
                binds.push(mesh.userData.pendingBind);
                delete mesh.userData.pendingBind;
            }
        }
        if (binds.length) this.pendingThrows?.noteBindsLanded(binds);
    }

    //each animation in the queue is executed one at a time in sequence
    async _processQueue() {
        if (this.queue.length === 0) return;

        const animate = this.queue.shift();
        await animate();

        if (this.queue.length > 0) {
            await this._processQueue();
        }
    }

    async _nextAnimationHandler() {
        const timing = game.settings.get("dice-so-nice", "enabledSimultaneousRolls") ? 400 : 0;

        this.nextAnimation = new Accumulator(timing, async (items) => {
            const overloaded = this.queue.length >= 10;
            if (!DsnSettings.isEnabled() || (overloaded && !items.some(i => i.type === "persistent"))) {
                this._settleDroppedBinds(items);
                items.forEach(item => item.resolve(false));
                if (this.box.inputHandler) this.box.inputHandler.clearPendingThrowDice();
                return;
            }
            if (overloaded) {
                items.filter(i => i.type !== "persistent").forEach(item => item.resolve(false));
                items = items.filter(i => i.type === "persistent");
            }

            //partition items by type
            const ephemeralItems = items.filter(i => i.type !== "persistent");
            const persistentItems = items.filter(i => i.type === "persistent");

            const commands = ephemeralItems.length > 0 ? DiceNotation.mergeQueuedRollCommands(ephemeralItems) : [];

            //merge persistent items into a single throwData for the unified batch
            let mergedPersistentData = null;
            if (persistentItems.length > 0) {
                const allHeldDice = [];
                const mergedForcedByMesh = new Map();
                let roll = null, primaries = null, sfxList = [], queuedAt = Infinity;
                for (const item of persistentItems) {
                    const p = item.params;
                    allHeldDice.push(...p.heldDice);
                    for (const [mesh, val] of p.forcedByMesh) {
                        mergedForcedByMesh.set(mesh, val);
                    }
                    if (!roll && p.roll) { roll = p.roll; primaries = p.primaries; }
                    if (p.sfxList) sfxList.push(...p.sfxList);
                    if (p.queuedAt) queuedAt = Math.min(queuedAt, p.queuedAt);
                }
                mergedPersistentData = {
                    heldDice: allHeldDice,
                    velocity: persistentItems[0].params.velocity,
                    forcedByMesh: mergedForcedByMesh,
                    roll,
                    primaries,
                    sfxList: sfxList.length > 0 ? sfxList : undefined,
                    queuedAt: Number.isFinite(queuedAt) ? queuedAt : Date.now()
                };
            }

            //each throw index (explosion level) becomes a separate sequential batch
            const batches = commands.length > 0 ? [...commands] : [];
            if (batches.length === 0 && mergedPersistentData) batches.push([]);

            if (batches.length === 0) {
                items.forEach(item => item.resolve(false));
                return;
            }

            let remainingAnimations = batches.length;
            const batchDone = () => {
                remainingAnimations--;
                if (remainingAnimations === 0) {
                    items.forEach(item => item.resolve(true));
                    this.canvasVisibility.hide();
                }
            };

            this._currentAnimation = this._currentAnimation.then(async () => {
                for (let ci = 0; ci < batches.length; ci++) {
                    //persistent data is attached to the first throw group
                    const persistentData = ci === 0 ? mergedPersistentData : null;
                    this.queue.push(() => new Promise(async (resolve) => {
                        this.canvasVisibility.show();
                        try {
                            //a window resize may occur and will rebuild the box between two batches, wait for the new one
                            await this.box.ready;
                            await this.box.startUnifiedBatch(batches[ci], persistentData, () => {
                                batchDone();
                                resolve();
                            });
                        } catch (err) {
                            //in case of an unexpected broken batch, we make sure tu unstuck the queue
                            console.error("[Dice So Nice] animation batch failed", err);
                            items.forEach(item => item.resolve(false));
                            batchDone();
                            resolve();
                        }
                    }));
                }

                return this._processQueue();
            });

            await this._currentAnimation;
        });
    }
}
