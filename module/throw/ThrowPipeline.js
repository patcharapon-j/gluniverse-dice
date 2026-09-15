import { DsnSettings } from '../settings/DsnSettings.js';
import { DiceNotation } from '../DiceNotation.js';
import { InitiativeMask } from '../ui/InitiativeMask.js';
import { CompanionLink } from '../CompanionLink.js';
import { HideRules } from '../HideRules.js';

//the roll pipeline: chat message to throws, queued animation, then the reveal of the message
export class ThrowPipeline {

    constructor({ queue, pendingThrows }) {
        this.queue = queue;
        this.pendingThrows = pendingThrows;
        this.box = null;
        this.factory = null;

        //game.dice3d.messageHookDisabled, disables the chat message interception on this client
        this.messageHookDisabled = false;
        //css selector of the elements hidden during a message update animation
        this.messageUpdateHideSelector = ".dice-roll";
    }

    attach(box, factory) {
        this.box = box;
        this.factory = factory;
    }

    /**
     * Add metadata to dice with roll dependencies (ie 1d(1d4)) so they can be sorted into the same bucket and
     * rolled after their dependencies resolve, without dragging those dependencies into the same bucket and causing them to roll together.
     */
    _assignDependentRollOrder(rolls) {
        const DiceTerm = foundry.dice.terms.DiceTerm;
        const RollClass = foundry.dice.Roll;
        const ParentheticalTerm = foundry.dice.terms.ParentheticalTerm;
        const PoolTerm = foundry.dice.terms.PoolTerm;
        const FunctionTerm = foundry.dice.terms.FunctionTerm;

        //collect the immediate dice contained in a roll-term subtree without descending
        //into die _number/_faces
        const collectTopDice = (term, out) => {
            if (!term) return;
            if (term instanceof DiceTerm) { out.push(term); return; }
            if (term instanceof ParentheticalTerm && term.roll) {
                for (const t of term.roll.terms ?? []) collectTopDice(t, out);
                return;
            }
            if ((term instanceof PoolTerm || term instanceof FunctionTerm) && term.rolls) {
                for (const r of term.rolls)
                    for (const t of r.terms ?? []) collectTopDice(t, out);
            }
        };

        //recursively visit a die: mark inner dependency dice and return this die depth
        const visitDie = (die) => {
            let innerMax = -1;
            for (const sub of [die._number, die._faces]) {
                if (sub instanceof RollClass) {
                    const innerDice = [];
                    for (const t of sub.terms ?? []) collectTopDice(t, innerDice);
                    for (const innerDie of innerDice) {
                        if (!innerDie.options) innerDie.options = {};
                        innerDie.options.dsnDependentBucket = true;
                        const d = visitDie(innerDie);
                        if (d > innerMax) innerMax = d;
                    }
                }
            }
            const myDepth = innerMax + 1;
            if (!die.options) die.options = {};
            if (myDepth > 0) die.options.dsnDependentBucket = true;
            if (die.options.dsnDependentBucket) {
                //compose with any pre-existing rollOrder
                const existing = die.options.hasOwnProperty("rollOrder") ? die.options.rollOrder : 0;
                die.options.rollOrder = existing + myDepth;
            }
            return myDepth;
        };

        for (const roll of rolls ?? []) {
            const tops = [];
            for (const t of roll.terms ?? []) collectTopDice(t, tops);
            for (const die of tops) visitDie(die);
        }
    }

    //post-order so a parent scope never overwrites a more specific child stamp
    _walkRollScopes(roll, cb) {
        if (!roll) return;
        const ParentheticalTerm = foundry.dice.terms.ParentheticalTerm;
        const PoolTerm = foundry.dice.terms.PoolTerm;
        const FunctionTerm = foundry.dice.terms.FunctionTerm;
        for (const term of roll.terms ?? []) {
            if ((term instanceof PoolTerm || term instanceof FunctionTerm) && term.rolls) {
                for (const sub of term.rolls) this._walkRollScopes(sub, cb);
            } else if (term instanceof ParentheticalTerm && term.roll) {
                this._walkRollScopes(term.roll, cb);
            }
        }
        cb(roll);
    }

    _stampRole(roll) {
        this._walkRollScopes(roll, (scope) => {
            const props = scope.getDSNProperties?.();
            const path = typeof props?.role === "string" ? props.role : (typeof props?.damageType === "string" ? props.damageType : null);
            //stamp the marker even when the value is empty so the dice opt out of legacy detection
            if (path !== null) {
                const value = foundry.utils.getProperty(scope, path);
                for (const die of scope.dice ?? []) {
                    if (!die.options) die.options = {};
                    die.options.dsnRoleManaged = true;
                    if (value != null && value !== "" && die.options.dsnRole == null)
                        die.options.dsnRole = value;
                }
                return;
            }
            //the top scope reproduces the old flat broadcast; deeper scopes win, so never overwrite a die's own value
            if (scope.options?.type || scope.options?.flavor) {
                for (const die of scope.dice ?? []) {
                    if (!die.options) die.options = {};
                    if (!die.options.type && scope.options.type)
                        die.options.type = scope.options.type;
                    if (!die.options.flavor && scope.options.flavor)
                        die.options.flavor = scope.options.flavor;
                }
            }
        });
    }

    _stampAppearance(roll) {
        this._walkRollScopes(roll, (scope) => {
            if (!scope.options?.appearance) return;
            //post-order walk: inner scopes merge first, outer scopes win, all win over the die's own appearance
            for (const die of scope.dice ?? []) {
                if (!die.options) die.options = {};
                if (!die.options.appearance) die.options.appearance = {};
                die.options.appearance = foundry.utils.mergeObject(die.options.appearance, scope.options.appearance);
            }
        });
    }

    /**
     * Returns a die with _number/_faces Roll dependencies that have been collapsed to their primitive values.
     * Returns the original die unchanged when no dependencies are present.
     */
    _stripDependencyRolls(die) {
        const RollClass = foundry.dice.Roll;
        if (!(die._number instanceof RollClass) && !(die._faces instanceof RollClass)) return die;
        //shallow clone preserving prototype so instanceof checks (Die / DiceTerm) still pass
        const clone = Object.assign(Object.create(Object.getPrototypeOf(die)), die);
        clone.options = { ...die.options };
        if (die._number instanceof RollClass) clone._number = die.number;
        if (die._faces instanceof RollClass) clone._faces = die.faces;
        return clone;
    }

    //a system can show the result of message X inside another message (ie: dnd5e summary cards)
    //we hides those parts based on [data-message-id] whenever they get rendered
    _hideNestedParts(messageId) {
        if (this.messageHookDisabled || game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) return;
        const id = CSS.escape(messageId);
        HideRules.add(`nested:${messageId}`, `.chat-message:not([data-message-id="${id}"]) [data-message-id="${id}"]`);
    }

    _showNestedParts(messageId) {
        HideRules.remove(`nested:${messageId}`);
    }

    //reveal a held chat message; with animId only the elements tagged with that animation, else the whole message
    //while the message still has a live pending throw, the notification, initiative release and
    //completion hook are skipped: the final reveal of the pending throw fires them
    _revealMessage(chatMessage, animId = null) {
        const stillPending = this.pendingThrows?.isPending(chatMessage.id);
        let messageElement = window.ui.chat.element.querySelector(`.message[data-message-id="${chatMessage.id}"]`);
        let messageElementPopout;
        if (window.ui.sidebar.popouts.chat) {
            messageElementPopout = window.ui.sidebar.popouts.chat.element.querySelector(`.message[data-message-id="${chatMessage.id}"]`);
        }

        if (!stillPending) {
            // Guard the fallback with _shouldShowNotifications() to avoid double-firing the notification pip (#538).
            const notificationElement = document.querySelector(`#chat-notifications .message[data-message-id="${chatMessage.id}"]`);
            if (notificationElement) {
                notificationElement.classList.remove("dsn-hide");
                notificationElement._lifeSpan = 0;
            } else if (ui.chat._shouldShowNotifications()) {
                ui.chat.notify(chatMessage, { newMessage: true, existing: ui.chat.element.querySelector(`[data-message-id="${chatMessage.id}"]`) });
            }
        }

        if (chatMessage._dice3dMessageHidden && !animId) {
            // initial rolls done, reveal the entire message
            chatMessage._dice3dMessageHidden = false;
            if (messageElement) messageElement.classList.remove("dsn-hide");
            if (messageElementPopout) messageElementPopout.classList.remove("dsn-hide");
        }

        if (animId) {
            // update rolls done, reveal elements tagged with this animation id
            if (!chatMessage._dice3dMessageHidden) {
                if (messageElement) messageElement.classList.remove("dsn-hide");
                if (messageElementPopout) messageElementPopout.classList.remove("dsn-hide");
            }

            const revealSelector = `${this.messageUpdateHideSelector}.dsn-hide[data-dsn-anim-id="${animId}"]`;
            if (!chatMessage._dice3dExistingRollFingerprints)
                chatMessage._dice3dExistingRollFingerprints = [];
            if (messageElement) {
                const toReveal = messageElement.querySelectorAll(revealSelector);
                toReveal.forEach(el => {
                    chatMessage._dice3dExistingRollFingerprints.push(el.textContent.trim());
                });
                toReveal.forEach(el => {
                    el.classList.remove("dsn-hide");
                    el.removeAttribute("data-dsn-anim-id");
                });
            }

            if (messageElementPopout) {
                messageElementPopout.querySelectorAll(revealSelector).forEach(el => {
                    el.classList.remove("dsn-hide");
                    el.removeAttribute("data-dsn-anim-id");
                });
            }

            if (chatMessage._dice3dAnimFingerprints) {
                delete chatMessage._dice3dAnimFingerprints[animId];
            }
        }

        if (!stillPending)
            InitiativeMask.release(chatMessage.id);

        chatMessage._dice3dPendingRenders = (chatMessage._dice3dPendingRenders || 1) - 1;
        let companionIds = [];
        if (chatMessage._dice3dPendingRenders <= 0) {
            chatMessage._dice3dPendingRenders = 0;
            delete chatMessage._dice3danimating;
            this._showNestedParts(chatMessage.id);
            delete chatMessage._dice3dCountNewRolls;
            delete chatMessage._dice3dExistingRollFingerprints;
            delete chatMessage._dice3dAnimFingerprints;
            delete chatMessage._dice3dCurrentAnimId;
            delete chatMessage._dice3dAnimIdCounter;
            companionIds = CompanionLink.release(chatMessage.id);
        }

        if (!stillPending)
            Hooks.callAll("diceSoNiceRollComplete", chatMessage.id, companionIds);

        if (window.ui.chat.isAtBottom || chatMessage.author?.id === game.user.id)
            window.ui.chat.scrollBottom({ popout: false });
        if (window.ui.sidebar.popouts.chat && (window.ui.sidebar.popouts.chat.isAtBottom || chatMessage.author?.id === game.user.id))
            window.ui.sidebar.popouts.chat.scrollBottom();
    }

    //group dice terms from a set of rolls into ordered rollOrder buckets, one Roll per bucket
    _buildRollList(rollsToProcess) {
        const plus = new foundry.dice.terms.OperatorTerm({ operator: "+" });
        if (!plus._evaluated)
            plus.evaluate();

        let orderedDiceList = [[]];
        rollsToProcess.forEach(roll => {
            roll.dice.forEach(diceTerm => {
                let index = 0;

                //backfill rollOrder from roll options so you don't have to set it on every dice term
                if (roll.options?.rollOrder != null) {
                    if (!diceTerm.options) diceTerm.options = {};
                    if (!diceTerm.options.hasOwnProperty("rollOrder"))
                        diceTerm.options.rollOrder = roll.options.rollOrder;
                }

                if (diceTerm.options?.hasOwnProperty("rollOrder")) {
                    index = diceTerm.options.rollOrder;
                    if (orderedDiceList[index] == null) {
                        orderedDiceList[index] = [];
                    }
                }

                if (roll.data?.actorId) {
                    if (!diceTerm.options) diceTerm.options = {};
                    if (!diceTerm.options.dsnActorId)
                        diceTerm.options.dsnActorId = roll.data.actorId;
                }

                orderedDiceList[index].push(diceTerm);
            });
        });
        orderedDiceList = orderedDiceList.filter(el => el != null);

        let rollList = [];
        orderedDiceList.forEach(dice => {
            //add a "plus" between each term
            if (Array.isArray(dice) && dice.length) {
                //strip dependency rolls from each die so the per-bucket Roll's flat .dice
                //list contains only this bucket's dice - otherwise a (1d4)d6 d6 in bucket 1
                //would re-render the d4 alongside it via Roll.dice's recursive walk
                const cleanDice = dice.map(this._stripDependencyRolls);
                let termList = [...cleanDice].map((e, i) => i < cleanDice.length - 1 ? [e, plus] : [e]).reduce((a, b) => a.concat(b));
                //We use the Roll class registered in the CONFIG constant in case the system overwrites it (eg: HeXXen)
                rollList.push(CONFIG.Dice.rolls[0].fromTerms(termList));
            }
        });
        return rollList;
    }

    /**
     * Parse, sort and add the dice animation to the queue for a chat message and an array of Roll
     * Used internally by the message Hooks. Not meant to be used outside of the module.
     * Please use the showForRoll method instead.
     * @param {ChatMessage} chatMessage
     * @param {Array<Roll>} rolls
     */
    renderRolls(chatMessage, rolls) {
        //sequence dependent dice like (1d4)d6 so the inner roll resolves before the outer one spawns
        this._assignDependentRollOrder(rolls);

        //must stamp before buildRollList flattens the pool structure away
        for (const roll of rolls ?? []) {
            this._stampRole(roll);
            this._stampAppearance(roll);
        }

        const animId = chatMessage._dice3dCurrentAnimId;
        const showMessage = () => this._revealMessage(chatMessage, animId);

        if (game.view == "stream" && !(game.modules.get("0streamutils")?.active || game.modules.get("obs-utils")?.active)) {
            setTimeout(showMessage, 2500, chatMessage);
        } else {
            //1- We create a list of all 3D rolls, ordered ASC
            //2- We create a Roll object with the correct formula and results
            //3- We queue the showForRoll calls and then show the message

            const resolveOwnerForActor = (actor) => {
                if (!actor?.hasPlayerOwner) return null;
                let ownerUser = game.users.find(user => !user.isGM && user.character?.id == actor.id);
                if (!ownerUser) {
                    const ownership = { ...actor.ownership };
                    if (ownership.default != CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
                        delete ownership.default;
                        const playerOwners = Object.keys(ownership).filter(key => game.users.get(key) && !game.users.get(key).isGM);
                        if (playerOwners.length == 1) {
                            ownerUser = game.users.get(playerOwners[0]);
                        }
                    }
                }
                return ownerUser || null;
            };

            //chain rollList entries sequentially (for rollOrder), then call done
            const showRollList = (rollList, author, speaker, done, rollTotal) => {
                const recurse = (index) => {
                    this.showForRoll(rollList[index], author, false, null, false, chatMessage.id, speaker, { originalRollTotal: rollTotal }).then(() => {
                        if (rollList[index + 1] != null)
                            recurse(index + 1);
                        else
                            done();
                    });
                };
                if (rollList.length > 0) recurse(0);
                else done();
            };

            const ownerAppearanceSetting = game.settings.get("dice-so-nice", "forceCharacterOwnerAppearance");
            const shouldResolveOwner = ownerAppearanceSetting === "2"
                || (ownerAppearanceSetting === "1" && chatMessage.getFlag("core", "initiativeRoll"));

            // When multiple actors contributed rolls and owner resolution is active,
            // group by actorId so each group gets the correct owner appearance.
            // Otherwise treat all rolls as a single group.
            const actorIdSet = new Set(rolls.filter(r => r.data?.actorId).map(r => r.data.actorId));
            const shouldSplitByActor = actorIdSet.size > 1 && shouldResolveOwner;

            const groups = new Map();
            if (shouldSplitByActor) {
                rolls.forEach(roll => {
                    const aid = roll.data?.actorId || "";
                    if (!groups.has(aid)) groups.set(aid, []);
                    groups.get(aid).push(roll);
                });
            } else {
                groups.set(null, rolls);
            }

            const promises = [];
            for (const [actorId, groupRolls] of groups) {
                const rollList = this._buildRollList(groupRolls);
                if (rollList.length === 0) continue;

                let author = chatMessage.author;
                let speaker = chatMessage.speaker;

                if (shouldResolveOwner) {
                    let resolvedActorId = actorId || rollList[0].dice?.[0]?.options?.dsnActorId;
                    let actor;
                    if (resolvedActorId) {
                        actor = game.actors.get(resolvedActorId);
                    }
                    if (!actor && chatMessage.speaker) {
                        actor = ChatMessage.getSpeakerActor(chatMessage.speaker);
                    }
                    const ownerUser = resolveOwnerForActor(actor);
                    if (ownerUser) {
                        author = ownerUser;
                        if (resolvedActorId) speaker = { actor: resolvedActorId };
                    }
                }

                const groupRollTotal = groupRolls.reduce((sum, r) => sum + (r.total ?? 0), 0);
                promises.push(new Promise(resolve => showRollList(rollList, author, speaker, resolve, groupRollTotal)));
            }

            if (promises.length > 0)
                Promise.all(promises).then(() => showMessage());
            else
                showMessage();
        }
    }

    //the documented entry point, see Dice3D.showForRoll
    showForRoll(roll, user = game.user, synchronize, users = null, blind, messageID = null, speaker = null, options = { ghost: false, secret: false }) {
        let context = {
            roll: roll,
            user: user,
            users: users,
            blind: blind
        };

        if (options.ghost) {
            context.roll.ghost = true;
        }

        if (options.secret) {
            context.roll.secret = true;
        }

        //direct API callers skip renderRolls, so stamp here on the original roll
        this._stampRole(context.roll);
        this._stampAppearance(context.roll);

        if (speaker) {
            let actor = ChatMessage.getSpeakerActor(speaker);
            const isNpc = actor ? !actor.hasPlayerOwner : false;
            if (isNpc && game.settings.get("dice-so-nice", "hideNpcRolls")) {
                return Promise.resolve(false);
            }
        }

        if (DsnSettings.CONFIG().visibility === "mine" && user !== game.user) {
            return Promise.resolve(false);
        }

        let chatMessage = game.messages.get(messageID);
        if (chatMessage) {
            const hide3dDiceOnSecretRolls = game.settings.get("dice-so-nice", "hide3dDiceOnSecretRolls");
            if (chatMessage.whisper.length > 0 && hide3dDiceOnSecretRolls)
                context.roll.secret = true;
            if (!chatMessage.isContentVisible && hide3dDiceOnSecretRolls)
                context.roll.ghost = true;
        }


        //can be skipped in the middle of an interactive roll
        if (!options.skipRollStartHook)
            Hooks.callAll("diceSoNiceRollStart", messageID, context);
        //We allow the hook to modify the roll to be shown without altering the original roll reference
        //This is useful for example to show a different roll than the one made by the user without relying on the manual showForRoll method
        let hookedRoll = context.dsnRoll || context.roll;
        let actor = ChatMessage.getSpeakerActor(speaker);
        let notation = new DiceNotation(hookedRoll, DsnSettings.ALL_CONFIG(user, actor), user);
        notation.rollTotal = options.originalRollTotal ?? hookedRoll.total ?? null;
        notation.messageId = messageID;
        return this.show(notation, context.user, synchronize, context.users, context.blind, speaker);
    }

    //the documented entry point, see Dice3D.show
    show(data, user = game.user, synchronize = false, users = null, blind, speaker = null) {
        return new Promise((resolve, reject) => {

            if (!data.throws) throw new Error("Roll data should be not null");

            if (!data.throws.length || !DsnSettings.isEnabled()) {
                resolve(false);
            } else {
                let actor = ChatMessage.getSpeakerActor(speaker);

                if (synchronize) {
                    users = users && users.length > 0 ? (users[0]?.id ? users.map(user => user.id) : users) : users;
                    game.socket.emit("module.dice-so-nice", { type: "show", data: data, user: user.id, users: users, speaker: speaker });
                }

                if (!blind) {
                    if (window.document.hidden) {
                        if (DsnSettings.CONFIG().skipAnimationOnInactiveTab) {
                            resolve(false);
                        } else {
                            this.queue.deferHidden(data, DsnSettings.ALL_CUSTOMIZATION(user, this.factory, actor)).then(resolve);
                        }
                    } else {
                        this.queue.enqueue(data, DsnSettings.ALL_CUSTOMIZATION(user, this.factory, actor)).then(displayed => {
                            resolve(displayed);
                        });
                    }
                } else {
                    resolve(false);
                }
            }
            if (game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) {
                resolve();
            }
        });
    }
}
