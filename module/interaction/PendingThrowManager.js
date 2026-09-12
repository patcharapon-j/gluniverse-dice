import { DiceNotation, COMPOUND_DICE } from '../DiceNotation.js';
import { Dice3D } from '../Dice3D.js';
import { InitiativeMask } from '../ui/InitiativeMask.js';

//holds all the pending interactive throw state on this client: the registry, the slot model, the final reveal
export class PendingThrowManager {

    //flag a dev can set on the message: true = force an interactive throw, false = never interactive
    static REQUEST_FLAG = "interactive";
    static STATE_FLAG = "interactiveThrow";

    constructor(dice3d) {
        this.dice3d = dice3d;
        this.pending = new Map();
    }

    isPending(messageId) {
        return this.pending.has(messageId);
    }

    get(messageId) {
        return this.pending.get(messageId);
    }

    shouldStampInteractive(message) {
        if (!game.dice3d || game.dice3d.messageHookDisabled) return false;
        if (!game.dice3d.isEnabled()) return false;

        const state = Dice3D.interactiveThrowsState();
        if (state === "disabled") return false;

        //false always wins (bulk NPC rolls, sweeps); true works unless the feature is fully disabled
        const request = message.getFlag("dice-so-nice", PendingThrowManager.REQUEST_FLAG);
        if (request === false) return false;
        if (state !== "on" && request !== true) return false;

        const rolls = Dice3D.rollsFromMessage(message);
        if (!rolls.length || !rolls[0].dice.length) return false;

        //private rolls stay on the existing secret/ghost path
        if (message.whisper?.length || message.blind) return false;

        if (message.getFlag("dice-so-nice", "persistent") || message.getFlag("dice-so-nice", "skip")) return false;

        const rollTableId = message.getFlag("core", "RollTable");
        if (rollTableId) {
            if (!game.settings.get("dice-so-nice", "animateRollTable")) return false;
            if (!(game.tables.get(rollTableId)?.displayRoll ?? true)) return false;
        }
        if (message.getFlag("core", "initiativeRoll") && game.settings.get("dice-so-nice", "disabledForInitiative")) return false;
        if (game.settings.get("dice-so-nice", "hideNpcRolls")) {
            const actor = ChatMessage.getSpeakerActor(message.speaker);
            if (actor && !actor.hasPlayerOwner) return false;
        }

        //messages DSN splits per actor (group initiative) are not eligible
        const ownerSetting = game.settings.get("dice-so-nice", "forceCharacterOwnerAppearance");
        const shouldResolveOwner = ownerSetting === "2" || (ownerSetting === "1" && message.getFlag("core", "initiativeRoll"));
        const actorIdSet = new Set(message.rolls.filter(r => r.data?.actorId).map(r => r.data.actorId));
        if (actorIdSet.size > 1 && shouldResolveOwner) return false;

        const model = this._buildSlotModel(message, rolls);
        return model.groups.some(group => group.slots.some(slot => !slot.prebound));
    }

    shouldOpenPending(message) {
        if (message.getFlag("dice-so-nice", PendingThrowManager.STATE_FLAG)?.state !== "pending") return false;
        if (this.pending.has(message.id)) return false;
        return true;
    }

    openPending(message, rolls = Dice3D.rollsFromMessage(message)) {
        const model = this._buildSlotModel(message, rolls);
        const record = {
            messageId: message.id,
            userId: message.author?.id ?? null,
            groups: model.groups,
            overCapCount: model.overCapCount,
            cardMessageId: null
        };
        this.pending.set(message.id, record);
        if (record.userId === game.user.id) {
            this._createCard(record).catch(err => console.error("[Dice So Nice] pending card creation failed:", err));
            if (Dice3D.CONFIG().interactiveThrowsAutoSpawn)
                this.spawnGuests(record).catch(err => console.error("[Dice So Nice] guest auto-spawn failed:", err));
        }
        this.refreshEligibility();
        Hooks.callAll("diceSoNicePendingThrowOpened", message.id);
    }

    revealPending(messageId) {
        const record = this.pending.get(messageId);
        if (!record) return;
        this.pending.delete(messageId);
        this._deleteCard(record);
        this._clearGuests(messageId);
        const message = game.messages.get(messageId);
        if (message) {
            this.dice3d._revealMessage(message);
        } else {
            InitiativeMask.release(messageId);
            Hooks.callAll("diceSoNiceRollComplete", messageId, []);
        }
        this.refreshEligibility();
        Hooks.callAll("diceSoNicePendingThrowClosed", messageId);
    }

    async _writeResolution(messageId, state) {
        const message = game.messages.get(messageId);
        if (!message) return;
        if (message.getFlag("dice-so-nice", PendingThrowManager.STATE_FLAG)?.state !== "pending") return;
        await message.update({ "flags.dice-so-nice.interactiveThrow": { state } })
            .catch(err => {
                console.error("[Dice So Nice] resolution transition failed:", err);
                ui.notifications?.warn("Dice So Nice: failed to resolve the interactive throw (see console).");
            });
    }

    async onResolutionTransition(message, state) {
        const record = this.pending.get(message.id);
        if (!record) {
            this._clearGuests(message.id);
            return;
        }
        if (record.resolving) return;

        if (state === "complete") {
            //everything was thrown: finish when the local replay of the last dice lands
            if (!this._hasClaimedUnboundSlot(record)) {
                record.resolving = true;
                this.revealPending(message.id);
            } else {
                record.resolution = "complete";
            }
            return;
        }

        if (state === "abandon" || state === "skip") {
            //reload, disconnect or animation skip: reveal directly, no replay
            record.resolving = true;
            this.revealPending(message.id);
            return;
        }

        //escape or force: the remaining dice are rolled with a normal ephemeral throw
        record.resolving = true;
        this.refreshEligibility();
        try {
            await this._animateRemaining(message, record);
        } catch (err) {
            console.error("[Dice So Nice] escape replay failed:", err);
        } finally {
            this.revealPending(message.id);
        }
    }

    async _animateRemaining(message, record) {
        if (!this.dice3d.box?.initialized) return;
        if (!record.groups.some(g => g.slots.some(s => !s.bound))) return;
        const bound = new Set();
        for (const group of record.groups) {
            for (const slot of group.slots) {
                if (!slot.bound && !slot.claimed) continue;
                for (const member of slot.members)
                    bound.add(`${slot.bucketIndex}:${member.termIndex}:${member.resultIndex}`);
            }
        }
        const rolls = Dice3D.rollsFromMessage(message);
        this.dice3d._assignDependentRollOrder(rolls);
        const buckets = this.dice3d._buildRollList(rolls);
        const author = message.author ?? game.user;
        for (let bi = 0; bi < buckets.length; bi++) {
            let clone;
            try {
                clone = CONFIG.Dice.rolls[0].fromJSON(JSON.stringify(buckets[bi].toJSON()));
            } catch (err) {
                console.error("[Dice So Nice] escape replay clone failed:", err);
                continue;
            }
            let anyVisible = false;
            clone.dice.forEach((term, ti) => {
                term.results.forEach((r, ri) => {
                    if (bound.has(`${bi}:${ti}:${ri}`)) r.hidden = true;
                    else if (!r.hidden) anyVisible = true;
                });
            });
            if (!anyVisible) continue;
            await this.dice3d.showForRoll(clone, author, false, null, false, message.id, message.speaker);
        }
    }

    onUserDisconnected(userId) {
        if (game.user !== game.users.activeGM) return;
        for (const record of [...this.pending.values()]) {
            if (record.userId === userId) this._writeResolution(record.messageId, "abandon");
        }
    }

    onMessageDeleted(message) {
        if (this.pending.has(message.id)) {
            this.revealPending(message.id);
            return;
        }
        const realId = message.getFlag("dice-so-nice", "pendingCard");
        if (realId) {
            const record = this.pending.get(realId);
            if (record && record.cardMessageId === message.id) {
                record.cardMessageId = null;
                if (record.userId === game.user.id && !record.resolving)
                    this._createCard(record).catch(err => console.error("[Dice So Nice] pending card recreation failed:", err));
            }
        }
    }

    //open slots of the current group not covered by the roller's own dice on the table (a d100 pair counts once)
    _missingDiceForCurrentGroup(record, excludeMeshes = null) {
        const gi = this.currentGroupIndex(record);
        if (gi === -1) return [];
        const needed = new Map();
        for (const slot of record.groups[gi].slots) {
            if (slot.bound) continue;
            const entry = needed.get(slot.type) ?? { type: slot.type, compositeType: slot.compositeType, count: 0 };
            entry.count++;
            needed.set(slot.type, entry);
        }
        const box = this.dice3d.box;
        if (box?.initialized) {
            for (const mesh of box.persistentDiceList) {
                if (mesh.userData?.linkGroupSecondary) continue;
                if (mesh.userData?.ownerUserId !== record.userId) continue;
                if (excludeMeshes?.has(mesh)) continue;
                const entry = needed.get(mesh.notation?.type);
                if (entry) entry.count--;
            }
        }
        return [...needed.values()].filter(entry => entry.count > 0);
    }

    async spawnGuests(record) {
        if (record.userId !== game.user.id) return;
        if (record.spawningGuests) return;
        record.spawningGuests = true;
        try {
            const missing = this._missingDiceForCurrentGroup(record);
            const maxDiceNumber = game.settings.get("dice-so-nice", "maxDiceNumber");
            const guest = { pendingId: record.messageId, reservedForUserId: record.userId };
            let refused = false;
            for (const entry of missing) {
                const places = entry.compositeType ? COMPOUND_DICE[parseInt(entry.compositeType.slice(1))] : null;
                for (let i = 0; i < entry.count; i++) {
                    const room = maxDiceNumber - (this.dice3d.box?.persistentDiceList.length ?? 0);
                    if (room < (places ? places.length : 1)) { refused = true; break; }
                    if (places) {
                        const linkGroupId = foundry.utils.randomID();
                        const primary = await this.dice3d.spawnPersistentDie(places[0].type, null, { linkGroupId, digitPlace: 0, guest });
                        if (!primary) { refused = true; break; }
                        for (let p = 1; p < places.length; p++)
                            await this.dice3d.spawnPersistentDie(places[p].type, null, { linkGroupId, linkGroupSecondary: true, digitPlace: p, guest });
                    } else {
                        const mesh = await this.dice3d.spawnPersistentDie(entry.type, null, { guest });
                        if (!mesh) { refused = true; break; }
                    }
                }
                if (refused) break;
            }
            record.spawnRefused = refused;
            this.refreshCard(record.messageId);
        } finally {
            record.spawningGuests = false;
        }
    }

    //claim open slots for a persistent throw, before its Roll would be created
    //returns null when the throw is not intercepted, else the forced results and the socket payload
    claimThrow(heldDice, primaries, secondariesByLinkGroup) {
        const myPendings = [...this.pending.values()].filter(r => r.userId === game.user.id);
        const holdsGuest = heldDice.some(m => m.userData?.guest);
        if (!myPendings.length && !holdsGuest) return null;

        const forcedByMesh = new Map();
        const results = [];
        const touched = new Set();
        const claim = (mesh, forcedResult, bind = null) => {
            forcedByMesh.set(mesh, forcedResult);
            results.push({ persistentId: mesh.userData.persistentId, forcedResult, bind });
        };

        for (const primary of primaries) {
            const type = primary.notation.type;
            const faces = parseInt(type.slice(1));
            const places = COMPOUND_DICE[faces];
            const linked = primary.userData?.linkGroupId ? (secondariesByLinkGroup.get(primary.userData.linkGroupId) || []) : [];
            const claimed = myPendings.length ? this._claimSlot(type) : null;
            if (claimed) {
                const { record, groupIndex, slotIndex, slot } = claimed;
                touched.add(record);
                const bind = { messageId: record.messageId, groupIndex, slotIndex };
                if (slot.compositeType && places) {
                    claim(primary, slot.members[0]?.result ?? 0, bind);
                    primary.notation.compositeResult = slot.result;
                    primary.notation.compositeType = slot.compositeType;
                    for (const sec of linked) {
                        const member = sec.userData?.digitPlace != null ? slot.members[sec.userData.digitPlace] : null;
                        if (member) claim(sec, member.result);
                        sec.notation.compositeResult = slot.result;
                        sec.notation.compositeType = slot.compositeType;
                    }
                } else {
                    claim(primary, slot.result, bind);
                }
                primary.userData.pendingBind = bind;
            } else {
                if (places && primary.userData?.linkGroupId) {
                    const rawResult = Math.floor(Math.random() * faces) + 1;
                    DiceNotation.applyCompoundResult(primary, linked, rawResult, places, claim);
                } else {
                    claim(primary, this._randomFaceValue(primary));
                }
            }
        }

        this.refreshEligibility();
        for (const record of touched) this.refreshCard(record.messageId);
        return { forcedByMesh, results };
    }

    *_openSlots(userId) {
        for (const record of this.pending.values()) {
            if (record.userId !== userId) continue;
            if (record.resolving) continue;
            const gi = this.currentGroupIndex(record);
            if (gi === -1) continue;
            const group = record.groups[gi];
            for (let si = 0; si < group.slots.length; si++) {
                const slot = group.slots[si];
                if (slot.bound || slot.claimed) continue;
                yield { record, groupIndex: gi, slotIndex: si, slot };
            }
        }
    }

    _claimSlot(type) {
        for (const open of this._openSlots(game.user.id)) {
            if (open.slot.type !== type) continue;
            open.slot.claimed = true;
            return open;
        }
        return null;
    }

    _randomFaceValue(mesh) {
        const diceobj = this.dice3d.box?.dicefactory?.get(mesh.notation.type);
        const values = diceobj?.values;
        if (Array.isArray(values) && values.length) return values[Math.floor(Math.random() * values.length)];
        const faces = parseInt(mesh.notation.type.slice(1));
        return Number.isFinite(faces) && faces > 0 ? Math.floor(Math.random() * faces) + 1 : 1;
    }

    //a remote throw with bound dice started its replay: show those slots as rolling on the card
    noteBindsInFlight(binds) {
        const touched = new Set();
        for (const bind of binds) {
            const record = this.pending.get(bind.messageId);
            if (!record) continue;
            const slot = record.groups[bind.groupIndex]?.slots[bind.slotIndex];
            if (!slot || slot.bound || slot.claimed) continue;
            slot.claimed = true;
            touched.add(record);
        }
        for (const record of touched) this.refreshCard(record.messageId);
    }

    noteBindsLanded(binds) {
        const touched = new Set();
        for (const bind of binds) {
            const record = this.pending.get(bind.messageId);
            if (!record) continue;
            const slot = record.groups[bind.groupIndex]?.slots[bind.slotIndex];
            if (!slot || slot.bound) continue;
            slot.bound = true;
            delete slot.claimed;
            touched.add(record);
        }
        for (const record of touched) {
            const groupIndex = this.currentGroupIndex(record);
            if (groupIndex !== -1) this.refreshCard(record.messageId);
            if (record.userId === game.user.id && groupIndex !== -1
                && Dice3D.CONFIG().interactiveThrowsAutoSpawn && this._missingDiceForCurrentGroup(record).length)
                this.spawnGuests(record).catch(err => console.error("[Dice So Nice] guest auto-spawn failed:", err));
            if (record.resolution === "complete" && !record.resolving && !this._hasClaimedUnboundSlot(record)) {
                //the transition arrived before our last replay landed: finish now
                record.resolving = true;
                this.revealPending(record.messageId);
            } else if (groupIndex === -1 && record.userId === game.user.id) {
                this._writeResolution(record.messageId, "complete");
            }
            Hooks.callAll("diceSoNicePendingSlotsBound", record.messageId);
        }
        if (touched.size) this.refreshEligibility();
    }

    refreshEligibility() {
        const box = this.dice3d.box;
        if (!box?.initialized) return;
        const openTypes = new Set();
        for (const { slot } of this._openSlots(game.user.id)) openTypes.add(slot.type);
        let meshes = [];
        if (openTypes.size) {
            meshes = box.persistentDiceList.filter(m => {
                if (m.userData?.linkGroupSecondary) return false;
                if (!openTypes.has(m.notation?.type)) return false;
                return !box.inputHandler?._isPersistentGrabBlocked(m);
            });
            //linked secondaries glow with their primary so the whole d100 group looks eligible
            const linkGroups = new Set(meshes.filter(m => m.userData?.linkGroupId).map(m => m.userData.linkGroupId));
            if (linkGroups.size) {
                for (const m of box.persistentDiceList) {
                    if (m.userData?.linkGroupSecondary && linkGroups.has(m.userData.linkGroupId)) meshes.push(m);
                }
            }
        }
        box.updateEligibleOutlines(meshes);
    }

    //a guest still needed by another pending of the same roller moves to it, the rest despawn with the ephemeral dice
    _clearGuests(messageId) {
        const box = this.dice3d.box;
        if (!box?.initialized) return;
        const guests = box.persistentDiceList.filter(m => m.userData?.guestPendingId === messageId);
        if (!guests.length) return;
        const leaving = new Set();
        const secondariesByGroup = new Map();
        for (const mesh of guests) {
            if (!mesh.userData?.linkGroupSecondary) continue;
            const list = secondariesByGroup.get(mesh.userData.linkGroupId) ?? [];
            list.push(mesh);
            secondariesByGroup.set(mesh.userData.linkGroupId, list);
        }
        for (const mesh of guests) {
            if (mesh.userData?.linkGroupSecondary) continue;
            const linked = mesh.userData?.linkGroupId ? (secondariesByGroup.get(mesh.userData.linkGroupId) ?? []) : [];
            let target = null;
            for (const record of this.pending.values()) {
                if (record.userId !== mesh.userData.reservedForUserId) continue;
                const missing = this._missingDiceForCurrentGroup(record, new Set([mesh, ...leaving]));
                if (missing.some(entry => entry.type === mesh.notation?.type)) { target = record; break; }
            }
            if (target) {
                mesh.userData.guestPendingId = target.messageId;
                for (const sec of linked) sec.userData.guestPendingId = target.messageId;
            } else {
                leaving.add(mesh);
                for (const sec of linked) leaving.add(sec);
            }
        }
        if (!leaving.size) return;
        const input = box.inputHandler;
        if (input) {
            const gripped = new Set([...input.mouse.heldPersistentDice, ...input.mouse.pendingThrowDice]);
            for (const mesh of leaving) {
                if (gripped.has(mesh)) mesh.userData.yielded = true;
            }
        }
        setTimeout(() => {
            for (const mesh of leaving) {
                box.fadeOutPersistentDie(mesh.userData.persistentId, 1000)
                    .catch(err => console.error("[Dice So Nice] guest despawn failed:", err));
            }
        }, Dice3D.CONFIG().timeBeforeHide);
    }

    async _createCard(record) {
        const rollerName = game.users.get(record.userId)?.name ?? "?";
        const shell = `<div class="dice-so-nice dsn-pending-card" data-dsn-pending-card="${record.messageId}">`
            + `<div class="dsn-pending-body"><p class="dsn-pending-shell">${game.i18n.format("DICESONICE.pendingCardShell", { name: foundry.utils.escapeHTML(rollerName) })}</p></div></div>`;
        const card = await ChatMessage.implementation.create({
            content: shell,
            speaker: { alias: "Dice So Nice!" },
            flags: { "dice-so-nice": { skip: true, pendingCard: record.messageId } }
        });
        //in case the createChatMessage hook ran before this record existed
        if (card && this.pending.has(record.messageId)) record.cardMessageId = card.id;
    }

    registerCard(cardMessage) {
        const realId = cardMessage.getFlag("dice-so-nice", "pendingCard");
        const record = this.pending.get(realId);
        if (record) record.cardMessageId = cardMessage.id;
    }

    async injectCard(cardMessage, html) {
        const body = html.querySelector(".dsn-pending-body");
        if (!body) return;
        const wasAtBottom = ui.chat.isAtBottom;
        body.innerHTML = await this._renderCardBody(cardMessage);
        if (wasAtBottom) ui.chat.scrollBottom({ popout: true });
    }

    async refreshCard(messageId) {
        const record = this.pending.get(messageId);
        if (!record?.cardMessageId) return;
        const cardMessage = game.messages.get(record.cardMessageId);
        if (!cardMessage) return;
        const wasAtBottom = ui.chat.isAtBottom;
        const content = await this._renderCardBody(cardMessage);
        document.querySelectorAll(`.message[data-message-id="${record.cardMessageId}"] .dsn-pending-body`)
            .forEach(body => { body.innerHTML = content; });
        if (wasAtBottom) ui.chat.scrollBottom({ popout: true });
    }

    async _renderCardBody(cardMessage) {
        const realId = cardMessage.getFlag("dice-so-nice", "pendingCard");
        const record = this.pending.get(realId);
        const live = !!record;
        const rollerId = record?.userId ?? cardMessage.author?.id;
        const isRoller = live && rollerId === game.user.id;
        const isGM = game.user.isGM;
        const context = {
            live,
            rollerName: game.users.get(rollerId)?.name ?? "?",
            isRoller,
            isGM,
            canSpawn: isRoller && this._missingDiceForCurrentGroup(record).length > 0,
            canEscape: isRoller,
            canForce: isGM && !isRoller,
            canSkip: live && (isRoller || isGM),
            overCapCount: record?.overCapCount || 0,
            spawnRefused: !!record?.spawnRefused
        };
        context.hasActions = context.canSpawn || context.canEscape || context.canForce || context.canSkip;
        if (live) {
            const currentIndex = this.currentGroupIndex(record);
            const revealedCount = currentIndex === -1 ? record.groups.length : currentIndex + 1;
            const echoSlots = this._heldEchoSlots(record);
            const realMessage = game.messages.get(realId);
            context.formula = realMessage ? Dice3D.rollsFromMessage(realMessage).map(r => r.formula).join(" + ") : "";
            context.groups = record.groups.slice(0, revealedCount).map((group, gi) => {
                const chips = [];
                const byTerm = new Map();
                for (const slot of group.slots) {
                    const key = `${slot.bucketIndex}:${slot.members[0].termIndex}:${slot.type}`;
                    let chip = byTerm.get(key);
                    if (!chip) {
                        chip = { type: slot.type, labelType: slot.compositeType ?? slot.type, cells: [] };
                        byTerm.set(key, chip);
                        chips.push(chip);
                    }
                    chip.cells.push({
                        bound: slot.bound,
                        rolling: !slot.bound && !!slot.claimed,
                        held: echoSlots.has(slot),
                        display: this._slotDisplay(slot)
                    });
                }
                for (const chip of chips)
                    chip.label = chip.cells.length > 1 ? `${chip.cells.length}${chip.labelType}` : chip.labelType;
                return { chips };
            });
            context.hiddenGroups = record.groups.length - revealedCount;
        }
        return foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/pending-throw-card.hbs", context);
    }

    _slotDisplay(slot) {
        if (slot.compositeType) return String(slot.result);
        const label = slot.resultLabel;
        if (label == null || /\.(png|jpe?g|webp|gif|svg|avif)(\?|#|$)/i.test(String(label))) return String(slot.result);
        return String(label);
    }

    _heldEchoSlots(record) {
        const echo = new Set();
        const held = this._heldTypesOfRoller(record);
        if (!held.length) return echo;
        for (const { record: r, slot } of this._openSlots(record.userId)) {
            const idx = held.indexOf(slot.type);
            if (idx === -1) continue;
            held.splice(idx, 1);
            if (r === record) echo.add(slot);
            if (!held.length) break;
        }
        return echo;
    }

    _heldTypesOfRoller(record) {
        const box = this.dice3d.box;
        if (!box?.initialized) return [];
        let meshes;
        if (record.userId === game.user.id)
            meshes = box.inputHandler?.mouse.heldPersistentDice ?? [];
        else
            meshes = box.persistentDiceList.filter(m => m.userData?.lockedBy === record.userId);
        return meshes.filter(m => !m.userData?.linkGroupSecondary).map(m => m.notation?.type).filter(Boolean);
    }

    onTableEvent(type, userId) {
        if (!["pickup", "release", "throw", "remove", "clear", "create"].includes(type)) return;
        for (const record of this.pending.values()) {
            if (record.userId === userId) this.refreshCard(record.messageId);
        }
        this.refreshEligibility();
    }

    onCardAction(action, messageId) {
        switch (action) {
            case "spawn": return this.requestGuestSpawn(messageId);
            case "escape": return this.escapePending(messageId);
            case "force": return this.forceResolvePending(messageId);
            case "skip": return this.skipPending(messageId);
        }
    }

    //cancel the 3D animation entirely: no replay, straight to the revealed result
    skipPending(messageId) {
        const record = this.pending.get(messageId);
        if (!game.user.isGM && record?.userId !== game.user.id) return;
        this._writeResolution(messageId, "skip");
    }

    requestGuestSpawn(messageId) {
        const record = this.pending.get(messageId);
        if (!record || record.userId !== game.user.id) return;
        this.spawnGuests(record).catch(err => console.error("[Dice So Nice] guest spawn failed:", err));
    }

    escapePending(messageId) {
        const record = this.pending.get(messageId);
        if (!record || record.userId !== game.user.id) return;
        this._writeResolution(messageId, "escape");
    }

    forceResolvePending(messageId) {
        if (!game.user.isGM) return;
        this._writeResolution(messageId, "force");
    }

    _deleteCard(record) {
        if (!record.cardMessageId) return;
        const card = game.messages.get(record.cardMessageId);
        if (!card) return;
        this._deleteCardMessage(card);
    }

    _deleteCardMessage(card) {
        if (!card.canUserModify(game.user, "delete")) return;
        const isAuthor = card.author?.id === game.user.id;
        const isBackstop = game.user === game.users.activeGM && !card.author?.active;
        if (isAuthor || isBackstop) card.delete().catch(() => { });
    }

    readyCleanup() {
        const isBackstop = game.user === game.users.activeGM;
        for (const msg of game.messages) {
            const isMine = msg.author?.id === game.user.id;
            const authorGone = !msg.author?.active;
            if (msg.getFlag("dice-so-nice", "pendingCard")) {
                if (isMine || (isBackstop && authorGone)) this._deleteCardMessage(msg);
                continue;
            }
            if (msg.getFlag("dice-so-nice", PendingThrowManager.STATE_FLAG)?.state === "pending") {
                if (isMine || (isBackstop && authorGone)) this._writeResolution(msg.id, "abandon");
            }
        }
    }

    currentGroupIndex(record) {
        return record.groups.findIndex(group => group.slots.some(slot => !slot.bound));
    }

    _hasClaimedUnboundSlot(record) {
        return record.groups.some(group => group.slots.some(slot => !slot.bound && slot.claimed));
    }

    //slot model: throw groups matching the rollOrder buckets then DiceNotation's exploded/reroll sequencing
    //a compound group (d100 tens+units and larger) is one slot anchored on its primary die
    //results already handled by fvtt manual fulfillment are pre-bound
    _buildSlotModel(message, rolls) {
        this.dice3d._assignDependentRollOrder(rolls);
        const buckets = this.dice3d._buildRollList(rolls);
        const fulfillmentMethods = CONFIG.Dice.fulfillment?.methods ?? {};
        const maxDiceNumber = game.settings.get("dice-so-nice", "maxDiceNumber");
        const author = message.author ?? game.user;
        const groups = [];
        let overCapCount = 0;

        buckets.forEach((bucketRoll, bucketIndex) => {
            //count the results dropped by the dice cap, must match the DiceNotation counter exactly
            let diceNumber = 0;
            for (const term of bucketRoll.dice) {
                if (!DiceNotation.SUPPORTED_FACES.includes(term.faces)) continue;
                for (let i = 0; i < term.results.length; i++) {
                    if (++diceNumber >= maxDiceNumber) overCapCount++;
                }
            }

            const notation = new DiceNotation(bucketRoll, null, author);
            for (const notationThrow of notation.throws) {
                const slots = [];
                //compound dice share the same fvttResult reference: group them into one slot
                const compoundSlots = new Map();
                for (const die of notationThrow.dice) {
                    if (die.compositeType && compoundSlots.has(die.fvttResult)) {
                        compoundSlots.get(die.fvttResult).members.push(this._slotMember(die));
                        continue;
                    }
                    const term = bucketRoll.dice[die.termIndex];
                    const prebound = fulfillmentMethods[term?.method]?.interactive === true;
                    const slot = {
                        type: die.type,
                        compositeType: die.compositeType ?? null,
                        result: die.compositeType ? die.compositeResult : die.result,
                        resultLabel: die.resultLabel,
                        members: [this._slotMember(die)],
                        bucketIndex,
                        prebound,
                        bound: prebound
                    };
                    if (die.compositeType) compoundSlots.set(die.fvttResult, slot);
                    slots.push(slot);
                }
                if (slots.length) groups.push({ slots });
            }
        });

        return { groups, overCapCount };
    }

    _slotMember(die) {
        return {
            type: die.type,
            result: die.result,
            resultLabel: die.resultLabel,
            termIndex: die.termIndex,
            resultIndex: die.resultIndex
        };
    }
}
