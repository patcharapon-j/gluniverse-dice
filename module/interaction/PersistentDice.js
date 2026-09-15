import { DsnSettings } from '../settings/DsnSettings.js';
import { DiceLibrary } from '../engine/DiceLibrary.js';
import { SpawnLayout } from './SpawnLayout.js';
import { Utils } from '../Utils.js';

//persistent dice feature: local api, remote sync, flag persistence and disconnect cleanup
//the mesh side lives in PersistentDiceManager, which the box builds
export class PersistentDice {

    constructor({ pendingThrows, canvasVisibility, queue }) {
        this.pendingThrows = pendingThrows;
        this.canvasVisibility = canvasVisibility;
        this.queue = queue;
        this.box = null;
        this.factory = null;

        //local user's persistent dice data, keyed by persistentId
        this._persistentDiceData = new Map();
        this._restoringDice = false;
    }

    //called on every box build. the manager callbacks can only be set once the box finished initializing
    async attach(box, factory) {
        this.box = box;
        this.factory = factory;
        if (!box.ready) return;
        await box.ready;
        //a rebuild replaced the box while we waited
        if (this.box !== box) return;
        const manager = box.persistentDiceManager;
        manager.onPersistentEvent = (type, data) => this._emitPersistentEvent(type, data);
        manager.sfxListForUser = (user) => DsnSettings.ALL_CUSTOMIZATION(user).specialEffects || [];
        manager.onQueueThrow = (throwData) => this.queue.enqueuePersistent(throwData);
    }

    //spawn a persistent die on the tabletop
    async spawn(type, position = null, opts = {}, synchronize = true) {
        const user = opts.ownerUserId ? game.users.get(opts.ownerUserId) : game.user;
        //raw appearances for socket sync and flag persistence
        const rawAppearances = opts._rawAppearances || DsnSettings.APPEARANCE(user);
        const role = opts.role || "basic";
        const rawRoleScopes = opts._rawRoleScopes || (role !== "basic" ? DsnSettings.ROLE_APPEARANCE(user) : null);
        const appearance = opts.appearance || this.factory.getAppearanceForDice(rawAppearances, type, DsnSettings._roleNotation(role), this._persistentRoleContext(user, rawRoleScopes));
        const diceLibrary = opts.diceLibrary ?? DiceLibrary.getLibraryForUser(user);
        if (!position) {
            const config = DsnSettings.CONFIG(user);
            const count = this.box.persistentDiceManager?.countPersistentDiceByOwner(user.id) ?? 0;
            position = SpawnLayout.computeSpawnPosition(count, count + 1, config.persistentDiceSpawnLocation, this._computeSpawnBounds());
        }
        this.canvasVisibility.show();
        const mesh = await this.box.spawnPersistentDie(type, appearance, position, diceLibrary, opts);
        if (mesh && synchronize) {
            this._emitPersistentEvent("create", {
                data: {
                    persistentId: mesh.userData.persistentId,
                    dieType: type,
                    positionPct: position || this._toPositionPct(
                        mesh.parent.position.x,
                        mesh.parent.position.z
                    ),
                    linkGroupId: opts.linkGroupId || null,
                    linkGroupSecondary: opts.linkGroupSecondary || false,
                    digitPlace: opts.digitPlace ?? null,
                    appearances: rawAppearances,
                    role,
                    roleScopes: rawRoleScopes,
                    diceLibrary: diceLibrary,
                    guest: opts.guest || null
                }
            });
        }
        if (mesh && !opts.guest && mesh.userData.ownerUserId === game.user?.id) {
            this._persistentDiceData.set(mesh.userData.persistentId, {
                persistentId: mesh.userData.persistentId,
                dieType: type,
                appearances: rawAppearances,
                role,
                roleScopes: rawRoleScopes,
                diceLibrary,
                linkGroupId: opts.linkGroupId || null,
                linkGroupSecondary: opts.linkGroupSecondary || false,
                digitPlace: opts.digitPlace ?? null
            });
            this._savePersistentDiceToFlags();
        }
        return mesh;
    }

    async setVisibility(mode) {
        if (mode !== "all" && mode !== "mine" && mode !== "none") return;
        const oldMode = DsnSettings.CONFIG().visibility;
        const settings = game.user.getFlag("dice-so-nice", "settings") || {};
        await game.user.setFlag("dice-so-nice", "settings", { ...settings, visibility: mode });

        const crossingNone = (oldMode === "none") !== (mode === "none");
        if (crossingNone) {
            foundry.applications.settings.SettingsConfig.reloadConfirm();
            return;
        }

        this.box?.applyVisibility(mode);
    }

    async setProtected(enabled) {
        const settings = game.user.getFlag("dice-so-nice", "settings") || {};
        await game.user.setFlag("dice-so-nice", "settings", { ...settings, protectPersistent: !!enabled });
    }

    //remove a persistent die from the tabletop
    async remove(persistentId, synchronize = true) {
        await this._waitForThrowFinalize();
        const wasLocal = this._persistentDiceData.has(persistentId);
        await this.box.removePersistentDie(persistentId);
        if (this.box.persistentDiceList.length === 0 && !this.box.rolling) {
            this.canvasVisibility.hide();
        }
        if (synchronize) {
            this._emitPersistentEvent("remove", {
                data: { persistentId }
            });
        }
        if (wasLocal) {
            this._persistentDiceData.delete(persistentId);
            this._savePersistentDiceToFlags();
        }
    }

    //fast-forward a throw mid-replay so handlePersistentThrowCompletion fires
    //before the dice get removed, otherwise pt.roll.toMessage never runs and
    //the chat card is lost
    async _waitForThrowFinalize() {
        const box = this.box;
        if (!box?.rolling) return;
        const engine = box.throwEngine;
        engine.iteration = Math.max(engine.iterationsNeeded || 0, engine.minIterations || 0) + 1;
        await new Promise(resolve => {
            const poll = () => {
                if (!box.rolling) resolve();
                else requestAnimationFrame(poll);
            };
            poll();
        });
    }

    //dismiss all ephemeral (non-persistent) dice currently on the board, true if something was dismissed
    async dismissEphemeralDice() {
        const box = this.box;
        if (!box) return false;

        await this._waitForThrowFinalize();

        const engine = box.throwEngine;
        const hasEphemeral = (engine?.diceList?.length > 0) || (engine?.deadDiceList?.length > 0);
        if (!hasEphemeral) return false;

        await box.clearAll();
        if (box.persistentDiceList.length === 0) {
            this.canvasVisibility.hideNow();
        }
        return true;
    }

    //clear persistent dice. pass { ownerUserId } to limit to one user
    async clear(opts = {}, synchronize = true) {
        await this._waitForThrowFinalize();
        await this.box.clearPersistentDice(opts);
        if (!this.box.rolling) {
            this.canvasVisibility.hide();
        }
        if (synchronize) {
            this._emitPersistentEvent("clear", {
                data: { ownerUserId: opts.ownerUserId || null }
            });
        }
        //update local tracking if we cleared our own dice
        const clearedLocal = !opts.ownerUserId || opts.ownerUserId === game.user?.id;
        if (clearedLocal) {
            this._persistentDiceData.clear();
            this._savePersistentDiceToFlags();
        }
    }

    //remove selected persistent dice (respects ownership)
    async removeSelected() {
        await this._waitForThrowFinalize();
        const removedPids = await this.box.removeSelectedPersistentDice();
        if (!this.box.rolling && this.box.persistentDiceList.length === 0) {
            this.canvasVisibility.hide();
        }
        let localChanged = false;
        for (const pid of removedPids) {
            this._emitPersistentEvent("remove", { data: { persistentId: pid } });
            if (this._persistentDiceData.delete(pid)) localChanged = true;
        }
        if (localChanged) this._savePersistentDiceToFlags();
        return removedPids.size;
    }

    //"move" uses volatile delivery, everything else reliable
    _emitPersistentEvent(type, data) {
        const msg = { type: `persistent-${type}`, user: game.user.id, ...data };
        if (type === "move") {
            game.socket.volatile.emit("module.dice-so-nice", msg);
        } else {
            game.socket.emit("module.dice-so-nice", msg);
        }
        this.pendingThrows?.onTableEvent(type, game.user.id);
    }

    _findPersistentMeshById(persistentId) {
        return this.box.persistentDiceList.find(
            m => m.userData.persistentId === persistentId
        ) || null;
    }

    _toPositionPct(worldX, worldZ) {
        return this.box.toPositionPct(worldX, worldZ);
    }

    _fromPositionPct(pct) {
        return this.box.fromPositionPct(pct);
    }

    _computeSpawnBounds() {
        const display = this.box.diceScene.display;
        const cW = display.containerWidth;
        const cH = display.containerHeight;
        const iW = display.innerWidth;
        const iH = display.innerHeight;
        const barriersScale = 0.97;
        const sidebarMargin = display.containerMargin?.right || 0;

        const bLeft = -cW * barriersScale;
        const bRight = (cW - 2 * sidebarMargin) * barriersScale;
        const bTop = -cH * barriersScale;
        const bBot = cH * barriersScale;

        return {
            minX: bLeft / iW + 0.5,
            maxX: bRight / iW + 0.5,
            minY: -(bBot / iH) + 0.5,
            maxY: -(bTop / iH) + 0.5
        };
    }

    //remote persistent message, already filtered by the socket listener (never our own)
    async handleMessage(request) {
        if (!this.box.initialized) {
            if (request.type === "persistent-throw") this._settleOrphanBinds(request.data?.results);
            return;
        }
        if (!request.data) return;
        switch (request.type) {
            case "persistent-create": return this._onRemotePersistentCreate(request);
            case "persistent-remove": return this._onRemotePersistentRemove(request);
            case "persistent-clear": return this._onRemotePersistentClear(request);
            case "persistent-pickup": return this._onRemotePersistentPickup(request);
            case "persistent-move": return this._onRemotePersistentMove(request);
            case "persistent-release": return this._onRemotePersistentRelease(request);
            case "persistent-preroll": return this._onRemotePersistentPreroll(request);
            case "persistent-throw": return this._onRemotePersistentThrow(request);
        }
    }

    //locked dice would stay stuck otherwise
    onUserDisconnected(userId) {
        this._cleanupDisconnectedUser(userId);
        this.box.clearPersistentDice({ ownerUserId: userId });
    }

    onUserConnected(userId) {
        this._restorePersistentDiceFromFlags(userId, false);
    }

    async _cleanupDisconnectedUser(userId) {
        const lockedMeshes = [];
        for (const mesh of this.box.persistentDiceList) {
            if (mesh.userData?.lockedBy === userId) {
                delete mesh.userData.lockedBy;
                delete mesh.userData.remotePreRoll;
                delete mesh.userData.preRollRates;
                delete mesh.userData.remoteMoveTarget;
                delete mesh.userData.remoteMoveSmoothed;
                delete mesh.userData.pendingReplay;
                lockedMeshes.push(mesh);
            }
        }
        if (lockedMeshes.length > 0) {
            await this.box.persistentDiceManager.removeRemoteConstraints(lockedMeshes);
            this.box.updateSelectionOutlines();
        }
        this.box.removeRemoteOutlinePass(userId);
    }

    //fresh role context for a persistent die, with the raw player scopes it was created with (flag or socket) when we have them
    _persistentRoleContext(user, rawRoleScopes) {
        const context = DsnSettings.ROLE_CONTEXT(user);
        if (rawRoleScopes && typeof rawRoleScopes === "object") {
            const scopes = Utils.sanitizeRoleScopes(foundry.utils.duplicate(rawRoleScopes), user);
            for (const [id, scope] of Object.entries(scopes)) {
                if (context[id]) context[id].player = scope;
            }
        }
        return context;
    }

    //save local user's persistent dice to flags
    _savePersistentDiceToFlags() {
        if (!game.user || this._restoringDice) return;
        const data = Array.from(this._persistentDiceData.values());
        game.user.setFlag("dice-so-nice", "persistentDice", data);
    }

    //restore a user's persistent dice from flags
    async _restorePersistentDiceFromFlags(userId, synchronize = false) {
        const user = game.users.get(userId);
        if (!user) return;
        const saved = user.getFlag("dice-so-nice", "persistentDice");
        if (!Array.isArray(saved) || saved.length === 0) return;

        if (userId !== game.user?.id) {
            DiceLibrary.preloadAssets(userId);
            this.factory.preloadPresets(false, userId);
        }

        const count = saved.length;
        const spawnLocation = DsnSettings.CONFIG(user).persistentDiceSpawnLocation;
        const bounds = this._computeSpawnBounds();
        for (let i = 0; i < count; i++) {
            const entry = saved[i];
            const { x, y } = SpawnLayout.computeSpawnPosition(i, count, spawnLocation, bounds);
            const appearances = entry.appearances || DsnSettings.APPEARANCE(user);
            const role = entry.role || "basic";
            const roleScopes = entry.roleScopes || null;
            const appearance = this.factory.getAppearanceForDice(appearances, entry.dieType, DsnSettings._roleNotation(role), this._persistentRoleContext(user, roleScopes));
            await this.spawn(entry.dieType, { x, y }, {
                ownerUserId: userId,
                remotePersistentId: entry.persistentId,
                appearance,
                _rawAppearances: appearances,
                role,
                _rawRoleScopes: roleScopes,
                diceLibrary: entry.diceLibrary,
                linkGroupId: entry.linkGroupId || null,
                linkGroupSecondary: entry.linkGroupSecondary || false,
                digitPlace: entry.digitPlace ?? null
            }, synchronize);
        }
    }

    //restore all connected users' persistent dice
    async restoreAll() {
        //wait for DiceBox to finish initializing (materials, renderer, etc.)
        if (this.box.ready) await this.box.ready;
        this._restoringDice = true;
        try {
            for (const user of game.users) {
                if (!user.active) continue;
                await this._restorePersistentDiceFromFlags(user.id, user.id === game.user?.id);
            }
        } finally {
            this._restoringDice = false;
        }
    }

    _settleOrphanBinds(results) {
        const binds = (results ?? []).map(entry => entry.bind).filter(Boolean);
        if (binds.length) this.pendingThrows?.noteBindsLanded(binds);
    }

    async _onRemotePersistentCreate(request) {
        const { persistentId, dieType, positionPct, linkGroupId, linkGroupSecondary, digitPlace, appearances, diceLibrary, guest } = request.data;
        const role = request.data.role || "basic";
        const roleScopes = request.data.roleScopes || null;
        const user = game.users.get(request.user);
        if (!user) return;

        //skip if already restored from flags
        if (this._findPersistentMeshById(persistentId)) return;

        DiceLibrary.preloadAssets(request.user);
        this.factory.preloadPresets(false, request.user);

        const resolvedAppearance = this.factory.getAppearanceForDice(
            appearances || DsnSettings.APPEARANCE(user), dieType, DsnSettings._roleNotation(role), this._persistentRoleContext(user, roleScopes)
        );

        await this.spawn(dieType, positionPct, {
            ownerUserId: request.user,
            remotePersistentId: persistentId,
            linkGroupId,
            linkGroupSecondary,
            digitPlace: digitPlace ?? null,
            appearance: resolvedAppearance,
            _rawAppearances: appearances,
            role,
            _rawRoleScopes: roleScopes,
            diceLibrary,
            guest: guest || null
        }, false);
    }

    async _onRemotePersistentRemove(request) {
        const { persistentId } = request.data;
        await this.remove(persistentId, false);
    }

    async _onRemotePersistentClear(request) {
        const { ownerUserId } = request.data;
        await this.clear(ownerUserId ? { ownerUserId } : {}, false);
    }

    async _onRemotePersistentPickup(request) {
        const { persistentIds, grabTime: remoteGrabTime } = request.data;
        if (!Array.isArray(persistentIds)) return;

        //yield locally-held dice that the remote player is picking up,
        //but only if the remote grab wins the tiebreak (earlier timestamp,
        //or lower user ID on exact tie). this prevents cross-deadlocks when
        //two players grab the same die simultaneously.
        const inputHandler = this.box.inputHandler;
        if (inputHandler) {
            const locallyHeldIds = [];
            for (const pid of persistentIds) {
                const mesh = this._findPersistentMeshById(pid);
                if (!mesh?.userData?.constrained) continue;
                const localTime = mesh.userData.localGrabTime || 0;
                const remoteTime = remoteGrabTime || 0;
                const remoteWins = remoteTime < localTime
                    || (remoteTime === localTime && request.user < game.user.id);
                if (remoteWins) {
                    locallyHeldIds.push(mesh.id);
                }
            }
            if (locallyHeldIds.length > 0) {
                await inputHandler.yieldHeldDice(locallyHeldIds);
            }
        }

        const meshes = [];
        for (const pid of persistentIds) {
            const mesh = this._findPersistentMeshById(pid);
            if (!mesh) continue;
            //skip dice the local player won the tiebreak for
            if (mesh.userData?.constrained) continue;
            mesh.userData.lockedBy = request.user;
            meshes.push(mesh);
        }
        this.box.updateSelectionOutlines();
        if (meshes.length > 0) {
            await this.box.persistentDiceManager.addRemoteConstraints(meshes);
        }
    }

    _onRemotePersistentMove(request) {
        const { positions } = request.data;
        if (!Array.isArray(positions)) return;
        //store target position, render loop lerps toward it
        for (const entry of positions) {
            if (!entry?.persistentId) continue;
            const mesh = this._findPersistentMeshById(entry.persistentId);
            if (!mesh) continue;
            //ignore late-arriving moves for already-released dice
            if (!mesh.userData?.lockedBy) continue;
            const world = this._fromPositionPct(entry);
            mesh.userData.remoteMoveTarget = { x: world.x, z: world.z };
        }
    }

    async _onRemotePersistentRelease(request) {
        const { persistentIds } = request.data;
        if (!Array.isArray(persistentIds)) return;
        const meshes = [];
        for (const pid of persistentIds) {
            const mesh = this._findPersistentMeshById(pid);
            if (!mesh) continue;
            delete mesh.userData.lockedBy;
            delete mesh.userData.remotePreRoll;
            delete mesh.userData.preRollRates;
            delete mesh.userData.remoteMoveTarget;
            meshes.push(mesh);
        }
        await this.box.persistentDiceManager.removeRemoteConstraints(meshes);
        this.box.updateSelectionOutlines();
    }

    _onRemotePersistentPreroll(request) {
        const { persistentIds } = request.data;
        if (!Array.isArray(persistentIds)) return;
        const rate = () => (Math.random() < 0.5 ? -1 : 1) * (6.3 + Math.random() * 1.8);
        for (const pid of persistentIds) {
            const mesh = this._findPersistentMeshById(pid);
            if (!mesh) continue;
            mesh.userData.remotePreRoll = true;
            //random rotation rates for pre-roll animation
            mesh.userData.preRollRates = {
                x: rate(),
                y: rate(),
                zAmp: 0.35,
                zFreq: 1.2 + Math.random() * 0.4,
                t: 0
            };
        }
    }

    async _onRemotePersistentThrow(request) {
        const { velocityPct, results } = request.data;
        if (!Array.isArray(results) || !velocityPct) return;

        //look up local meshes and map forced results
        const heldDice = [];
        const forcedByMesh = new Map();
        const binds = [];
        const orphans = [];
        for (const entry of results) {
            const mesh = this._findPersistentMeshById(entry.persistentId);
            if (!mesh) {
                orphans.push(entry);
                continue;
            }
            heldDice.push(mesh);
            forcedByMesh.set(mesh, entry.forcedResult);
            if (entry.bind) {
                mesh.userData.pendingBind = entry.bind;
                binds.push(entry.bind);
            }
            //unlock and clear pre-roll state
            delete mesh.userData.lockedBy;
            delete mesh.userData.remotePreRoll;
            delete mesh.userData.preRollRates;
            delete mesh.userData.remoteMoveTarget;
            //block interaction until the queued replay actually starts
            mesh.userData.pendingReplay = true;
        }
        this._settleOrphanBinds(orphans);
        if (heldDice.length === 0) return;

        //the throw is in the air from now on: its slots show as rolling on the card
        if (binds.length) this.pendingThrows?.noteBindsInFlight(binds);

        await this.box.persistentDiceManager.removeRemoteConstraints(heldDice);
        this.box.updateSelectionOutlines();

        //convert velocity from pct to world units
        const velocity = {
            x: velocityPct.x * this.box.display.innerWidth,
            y: velocityPct.y * this.box.display.innerHeight,
            z: velocityPct.z || 0
        };

        //thrower's SFX config for remote playback
        const throwerUser = game.users.get(request.user);
        const sfxList = throwerUser ? DsnSettings.ALL_CUSTOMIZATION(throwerUser).specialEffects || [] : [];

        //route through queue for serialized execution
        await this.box.replayRemoteThrow(heldDice, velocity, forcedByMesh, sfxList);
    }
}
