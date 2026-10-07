import { Dice3D } from './Dice3D.js';
import { DsnSettings } from './settings/DsnSettings.js';
import { DiceConfig } from './ui/DiceConfig.js';
import { RollableAreaConfig } from './ui/RollableAreaConfig.js';
import { DiceRolesConfig } from './ui/DiceRolesConfig.js';
import { CustomDiceTermConfig } from './ui/CustomDiceTermConfig.js';
import { DsnSidebarTab } from './ui/DsnSidebarTab.js';
import { InitiativeMask } from './ui/InitiativeMask.js';
import { CompanionLink } from './CompanionLink.js';
import { RollRules } from './throw/RollRules.js';
import { Utils } from './Utils.js';
import { CustomDiceTerms } from './engine/CustomDiceTerms.js';
import { DiceLibrary } from './engine/DiceLibrary.js';

/**
 * Registers the exposed settings for the various 3D dice options.
 */
Hooks.once('init', () => {
    game.settings.registerMenu("dice-so-nice", "dice-so-nice", {
        name: "DICESONICE.config",
        label: "DICESONICE.configTitle",
        hint: "DICESONICE.configHint",
        icon: "fas fa-dice-d20",
        type: DiceConfig,
        restricted: false
    });

    game.settings.registerMenu("dice-so-nice", "rollable-area", {
        name: "DICESONICE.RollableAreaConfig",
        label: "DICESONICE.RollableAreaConfigTitle",
        hint: "DICESONICE.RollableAreaConfigHint",
        icon: "fas fa-crop-alt",
        type: RollableAreaConfig,
        restricted: false
    });

    game.settings.registerMenu("dice-so-nice", "dice-roles-config", {
        name: "DICESONICE.DiceRolesConfigMenu",
        label: "DICESONICE.DiceRolesConfigMenuLabel",
        hint: "DICESONICE.DiceRolesConfigMenuHint",
        icon: "fas fa-masks-theater",
        type: DiceRolesConfig,
        restricted: true
    });

    game.settings.registerMenu("dice-so-nice", "custom-diceterm-config", {
        name: "DICESONICE.CustomDiceTermConfigMenu",
        label: "DICESONICE.CustomDiceTermConfigMenuLabel",
        hint: "DICESONICE.CustomDiceTermConfigMenuHint",
        icon: "fas fa-dice",
        type: CustomDiceTermConfig,
        restricted: true
    });

    //Not used anymore but kept for compatibility with migration
    game.settings.register("dice-so-nice", "settings", {
        name: "3D Dice Settings",
        scope: "client",
        default: {},
        type: Object,
        config: false
    });

    game.settings.register("dice-so-nice", "formatVersion", {
        scope: "world",
        type: String,
        default: "",
        config: false
    });

    // -- General --

    game.settings.register("dice-so-nice", "maxDiceNumber", {
        name: "DICESONICE.maxDiceNumber",
        hint: "DICESONICE.maxDiceNumberHint",
        scope: "world",
        type: Number,
        default: 20,
        range: {
            min: 20,
            max: 100,
            step: 5
        },
        config: true
    });

    game.settings.register("dice-so-nice", "globalAnimationSpeed", {
        name: "DICESONICE.globalAnimationSpeed",
        hint: "DICESONICE.globalAnimationSpeedHint",
        scope: "world",
        type: String,
        choices: Utils.localize({
            "0": "DICESONICE.PlayerSpeed",
            "1": "DICESONICE.NormalSpeed",
            "2": "DICESONICE.2xSpeed",
            "3": "DICESONICE.3xSpeed"
        }),
        default: "0",
        config: true,
        requiresReload: true
    });

    // -- Animation Behavior --

    game.settings.register("dice-so-nice", "enabledSimultaneousRolls", {
        name: "DICESONICE.enabledSimultaneousRolls",
        hint: "DICESONICE.enabledSimultaneousRollsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        requiresReload: true
    });

    game.settings.register("dice-so-nice", "enabledSimultaneousRollForMessage", {
        name: "DICESONICE.enabledSimultaneousRollForMessage",
        hint: "DICESONICE.enabledSimultaneousRollForMessageHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("dice-so-nice", "diceCanBeFlipped", {
        name: "DICESONICE.diceCanBeFlipped",
        hint: "DICESONICE.diceCanBeFlippedHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("dice-so-nice", "immediatelyDisplayChatMessages", {
        name: "DICESONICE.immediatelyDisplayChatMessages",
        hint: "DICESONICE.immediatelyDisplayChatMessagesHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    // -- Which Rolls Show 3D Dice --

    game.settings.register("dice-so-nice", "disabledDuringCombat", {
        name: "DICESONICE.disabledDuringCombat",
        hint: "DICESONICE.disabledDuringCombatHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("dice-so-nice", "disabledForInitiative", {
        name: "DICESONICE.disabledForInitiative",
        hint: "DICESONICE.disabledForInitiativeHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("dice-so-nice", "disabledForManualRolls", {
        name: "DICESONICE.disabledForManualRolls",
        hint: "DICESONICE.disabledForManualRollsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("dice-so-nice", "hideNpcRolls", {
        name: "DICESONICE.hideNpcRolls",
        hint: "DICESONICE.hideNpcRollsHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("dice-so-nice", "animateRollTable", {
        name: "DICESONICE.animateRollTable",
        hint: "DICESONICE.animateRollTableHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true
    });

    game.settings.register("dice-so-nice", "animateInlineRoll", {
        name: "DICESONICE.animateInlineRoll",
        hint: "DICESONICE.animateInlineRollHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    // -- Privacy --

    game.settings.register("dice-so-nice", "hide3dDiceOnSecretRolls", {
        name: "DICESONICE.hide3dDiceOnSecretRolls",
        hint: "DICESONICE.hide3dDiceOnSecretRollsHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    game.settings.register("dice-so-nice", "showGhostDice", {
        name: "DICESONICE.showGhostDice",
        hint: "DICESONICE.showGhostDiceHint",
        scope: "world",
        type: String,
        choices: Utils.localize({
            "0": "DICESONICE.ghostDiceDisabled",
            "1": "DICESONICE.ghostDiceForAll",
            "2": "DICESONICE.ghostDiceForRollAuthor",
            "3": "DICESONICE.ghostDiceForPlayerRollsOnly"
        }),
        default: "0",
        config: true
    });

    // -- Interaction --

    game.settings.register("dice-so-nice", "allowInteractivity", {
        name: "DICESONICE.allowInteractivity",
        hint: "DICESONICE.allowInteractivityHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        requiresReload: true
    });

    game.settings.register("dice-so-nice", "persistentDice", {
        name: "DICESONICE.persistentDice",
        hint: "DICESONICE.persistentDiceHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
        requiresReload: true
    });

    game.settings.register("dice-so-nice", "interactiveThrows", {
        name: "DICESONICE.interactiveThrows",
        hint: "DICESONICE.interactiveThrowsHint",
        scope: "world",
        type: String,
        choices: Utils.localize({
            "0": "DICESONICE.interactiveThrowsDisabled",
            "1": "DICESONICE.interactiveThrowsAllowedOff",
            "2": "DICESONICE.interactiveThrowsAllowedOn"
        }),
        default: "1",
        config: true
    });

    // -- Appearance --

    game.settings.register("dice-so-nice", "forceCharacterOwnerAppearance", {
        name: "DICESONICE.forceCharacterOwnerAppearance",
        hint: "DICESONICE.forceCharacterOwnerAppearanceHint",
        scope: "world",
        type: String,
        choices: Utils.localize({
            "0": "DICESONICE.forceCharacterOwnerAppearanceDisabled",
            "1": "DICESONICE.forceCharacterOwnerAppearanceInitiative",
            "2": "DICESONICE.forceCharacterOwnerAppearanceAll"
        }),
        default: "2",
        config: true
    });

    // -- UI --

    game.settings.register("dice-so-nice", "hideSidebarTab", {
        name: "DICESONICE.hideSidebarTab",
        hint: "DICESONICE.hideSidebarTabHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        requiresReload: true
    });

    game.settings.register("dice-so-nice", "resetWelcomeMessage", {
        name: "DICESONICE.resetWelcomeMessage",
        hint: "DICESONICE.resetWelcomeMessageHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
        onChange: value => {
            if (value) {
                game.users.forEach(user => {
                    user.setFlag("dice-so-nice", "welcomeMessageShown", false);
                });
                game.settings.set("dice-so-nice", "resetWelcomeMessage", false);
            }
        }
    });

    // -- Internal (config: false) --

    //pre-6.3 damage type mapping, frozen: only read by the roles migration
    game.settings.register("dice-so-nice", "damageTypeMap", {
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });

    //one-shot marker for the damage type to roles migration, see Utils.migrateDamageTypeMap
    game.settings.register("dice-so-nice", "rolesMigrated", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    //GM catalog: custom roles plus per-role overrides { <id>: { label?, group?, customizable?, detectors?, deleted? } }
    game.settings.register("dice-so-nice", "roles", {
        scope: "world",
        config: false,
        type: Object,
        default: {},
        onChange: () => game.dice3d?.DiceFactory?.invalidateRoles()
    });

    //GM world role scopes { <roleId>: { global?, d4?, ... } }, same shape as a user appearance
    game.settings.register("dice-so-nice", "roleScopes", {
        scope: "world",
        config: false,
        type: Object,
        default: {},
        onChange: () => {
            if (!game.dice3d) return;
            DiceLibrary.preloadAssets(game.user.id);
            game.dice3d.DiceFactory.preloadPresets(false);
        }
    });

    //GM-owned dice library, same die shape as the user diceLibrary flag, referenced with libraryDieOwner "world"
    game.settings.register("dice-so-nice", "worldDiceLibrary", {
        scope: "world",
        config: false,
        type: Array,
        default: [],
        onChange: () => {
            game.dice3d?.box?.dicefactory?.disposeCachedMaterials();
            DiceLibrary.preloadAssets(game.user.id);
        }
    });

    CustomDiceTerms.registerSetting();
    CustomDiceTerms.loadAndRegisterAll();

    game.settings.register("dice-so-nice", "documentsForPreload", {
        scope: "world",
        config: false,
        type: Array,
        default: []
    });

    //register sidebar tab unless GM disabled it
    if (!game.settings.get("dice-so-nice", "hideSidebarTab")) {
        CONFIG.ui["dice-so-nice"] = DsnSidebarTab;
        const sidebarClass = CONFIG.ui.sidebar;
        if (sidebarClass?.TABS) {
            const dsnTab = { icon: "fa-solid fa-dice-d20", tooltip: "DICESONICE.sidebarTabTitle" };
            const settingsTab = sidebarClass.TABS.settings;
            if (settingsTab) {
                delete sidebarClass.TABS.settings;
                sidebarClass.TABS["dice-so-nice"] = dsnTab;
                sidebarClass.TABS.settings = settingsTab;
            } else {
                sidebarClass.TABS["dice-so-nice"] = dsnTab;
            }
        }
    }

    //delete key removes selected persistent dice
    if (game.settings.get("dice-so-nice", "persistentDice")) {
        game.keybindings.register("dice-so-nice", "deleteSelectedPersistent", {
            name: "DICESONICE.keybindingDeleteSelected",
            hint: "DICESONICE.keybindingDeleteSelectedHint",
            editable: [
                { key: "Delete" },
                { key: "Backspace" }
            ],
            onDown: () => {
                if (!game.dice3d?.box || game.dice3d.box.selectedPersistentDiceIds.size === 0) return false;
                game.dice3d.persistent.removeSelected();
                return true; // Consume so Foundry's canvas delete doesn't also fire.
            },
            precedence: foundry.CONST.KEYBINDING_PRECEDENCE?.NORMAL ?? 0
        });
    }

    //unbound-by-default shortcut to instantly dismiss ephemeral dice
    //We manually register to window because FVTT only triggers key on focused elements, and 
    //that is the 3D canvas for us, which doesn't work well for dsn since users usually rolls from the chat or character sheets.
    game.keybindings.register("dice-so-nice", "dismissEphemeralDice", {
        name: "DICESONICE.keybindingDismissEphemeral",
        hint: "DICESONICE.keybindingDismissEphemeralHint",
        editable: [],
        onDown: () => { game.dice3d?.persistent.dismissEphemeralDice(); return true; },
        precedence: foundry.CONST.KEYBINDING_PRECEDENCE?.NORMAL ?? 0
    });
    window.addEventListener("keydown", Utils.onDismissEphemeralKeydown);

    Hooks.on("getHeaderControlsActorSheetV2", (app, controls) => {
        if (!app.document.isOwner) return;
        controls.push({
            icon: "fas fa-dice-d20",
            label: "DICESONICE.configTitle",
            action: "dice-so-nice-config",
            onClick: () => {
                new DiceConfig({ document: app.document }).render({ force: true });
            }
        });
    });

});

/**
 * Core Foundry is ready, wait for the sidebar then let's create a new Dice3D!
 */
Hooks.once('ready', () => {
    if (ui.sidebar.rendered) {
        setupDiceSoNice();
    } else {
        ui.sidebar.addEventListener("render", setupDiceSoNice, {once: true})
    }
});

const setupDiceSoNice = () => {
    if (game.view === "stream") {
        logger.warn("Dice So Nice! is disabled in /stream view; chat cards will display without 3D dice animations.");
        return;
    }
    Utils.migrateOldSettings().then((updated) => {
        if (updated) {
            if (!game.settings.get("core", "noCanvas")){
                game.dice3d = new Dice3D();
                game.dice3d.init();
            }
            else
                logger.warn("Dice So Nice! is disabled because the user has activated the 'No-Canvas' mode");
        }
    }).catch((err) => {
        logger.error("Dice So Nice! settings migration failed", err);
        ui.notifications.error(game.i18n.localize("DICESONICE.migrateMessageError"));
    });
};

const shouldInterceptMessage = (chatMessage, options = {dsnCountAddedRoll: 0, dsnIndexAddedRoll: 0}) => {
    //persistent dice handle their own visuals
    if (chatMessage.getFlag("dice-so-nice", "persistent")) return false;

    if (chatMessage.getFlag("dice-so-nice", "skip")) return false;

    const hasInlineRoll = DsnSettings.hasInlineRoll(chatMessage);

    const visibility = RollRules.visibility(chatMessage);
    const shouldAnimateRollTable = game.settings.get("dice-so-nice", "animateRollTable");
    const hasRollTableFlag = chatMessage.getFlag("core", "RollTable");
    
    //The table could be in a compedium pack and foundry does not have an easy way to find the packed table without looping over all compediums
    //In such case, we assume the roll table is displayed
    const rollTableFormulaDisplayed = hasRollTableFlag && (game.tables.get(hasRollTableFlag)?.displayRoll ?? true);

    //Is a roll
    let willTrigger3DRoll = (chatMessage.isRoll || hasInlineRoll) &&
    //If the content is visible or ghost dice should be shown
    visibility.animate &&
    //If dsn is correctly enabled and the message hook is not disabled
    game.dice3d && !game.dice3d.messageHookDisabled &&
    //If it has a roll table, then check if the roll table should be animated and the roll table is displayed
    (!hasRollTableFlag || (shouldAnimateRollTable && rollTableFormulaDisplayed)) &&
    //If there's at least one roll with diceterms (could be a deterministic roll without any dice like Roll("5")) or has an inline roll
    (chatMessage.rolls.slice(options.dsnIndexAddedRoll).some(roll => roll.dice.length > 0) || hasInlineRoll);

    //skip animation when every die in the roll was fulfilled through an interactive method (manual input, physical dice trackers, etc.)
    if (willTrigger3DRoll && chatMessage.isRoll && game.settings.get("dice-so-nice", "disabledForManualRolls")) {
        const fulfillmentMethods = CONFIG.Dice.fulfillment?.methods ?? {};
        const rollsWithDice = chatMessage.rolls.slice(options.dsnIndexAddedRoll).filter(roll => roll.dice.length > 0);
        const allInteractive = rollsWithDice.length > 0 && rollsWithDice.every(roll =>
            roll.dice.every(term => fulfillmentMethods[term.method]?.interactive === true)
        );
        if (allInteractive) willTrigger3DRoll = false;
    }

    const interception = {willTrigger3DRoll: willTrigger3DRoll};

    Hooks.callAll("diceSoNiceMessagePreProcess", chatMessage.id, interception);

    const afterPreProcess = interception.willTrigger3DRoll;
    Hooks.callAll("diceSoNiceMessageProcessed", chatMessage.id, interception);

    if (interception.willTrigger3DRoll !== afterPreProcess) {
        foundry.utils.logCompatibilityWarning(
            "A module mutated willTrigger3DRoll from the 'diceSoNiceMessageProcessed' hook. " +
            "This hook is now for observation only. To change DsN's animation decision, " +
            "listen to 'diceSoNiceMessagePreProcess' instead.",
            {since: "6.0.0", until: "7.0.0"}
        );
    }

    return interception.willTrigger3DRoll;
};

/**
 * Interactive throws are stamped at message creation by the roller's client.
 * Every client then reads the flag at interception; flags added later are ignored.
 */
Hooks.on('preCreateChatMessage', (message) => {
    if (!game.dice3d?.pendingThrows?.shouldStampInteractive(message)) return;
    message.updateSource({ "flags.dice-so-nice.interactiveThrow": { state: "pending" } });
});

/**
 * Intercepts all roll-type messages hiding the content until the animation is finished
 */
Hooks.on('createChatMessage', (chatMessage) => {
    //suppress core dice sound for persistent rolls too
    if (chatMessage.getFlag("dice-so-nice", "persistent")
        && DsnSettings.CONFIG().visibility !== "none"
        && chatMessage.sound === "sounds/dice.wav") {
        delete chatMessage.sound;
    }

    if (chatMessage.getFlag("dice-so-nice", "pendingCard")) {
        game.dice3d?.pendingThrows?.registerCard(chatMessage);
        return;
    }

    // companion message linking: hide non-roll messages tied to an animating primary
    const linkedTo = chatMessage.getFlag("dice-so-nice", "linkedTo");
    if (linkedTo) {
        if (game.dice3d?.messageHookDisabled) return;
        if (game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) return;
        if (chatMessage.isRoll) {
            // has rolls of its own, treat as a normal roll (linkedTo ignored)
        } else {
            const primary = game.messages.get(linkedTo);
            if (primary?._dice3dPendingRenders > 0) {
                CompanionLink.register(chatMessage.id, linkedTo);
            }
            return;
        }
    }

    if (!shouldInterceptMessage(chatMessage)) return;

    const rolls = DsnSettings.rollsFromMessage(chatMessage);

    //Because Better Roll 5e sends an empty roll object sometime
    if (!rolls.some(roll => roll.dice.length > 0))
        return;

    const isInitiativeRoll = chatMessage.getFlag("core", "initiativeRoll");
    if (isInitiativeRoll && game.settings.get("dice-so-nice", "disabledForInitiative"))
        return;

    //Remove the chatmessage sound if it is the core dice sound.
    if (DsnSettings.CONFIG().visibility !== "none" && chatMessage.sound == "sounds/dice.wav") {
        delete chatMessage.sound;
    }
    chatMessage._dice3danimating = true;
    chatMessage._dice3dPendingRenders = (chatMessage._dice3dPendingRenders || 0) + 1;
    game.dice3d.pipeline._hideNestedParts(chatMessage.id);

    if (isInitiativeRoll && !game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages"))
        InitiativeMask.flag(chatMessage);

    //interactive throw: the flag sends every client to the pending flow instead of the animation
    if (game.dice3d.pendingThrows?.shouldOpenPending(chatMessage)) {
        game.dice3d.pendingThrows.openPending(chatMessage, rolls);
        return;
    }

    game.dice3d.pipeline.renderRolls(chatMessage, rolls);
});

Hooks.on("renderCombatTracker", (app, html) => InitiativeMask.apply(html));
Hooks.on("preUpdateCombatant", (combatant, changes) => {
    if (changes.initiative === undefined) return;
    if (game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) return;
    if (game.settings.get("dice-so-nice", "disabledForInitiative")) return;
    InitiativeMask.snapshot(combatant);
});

/**
 * Hide messages which are animating rolls.
 */
Hooks.on("renderChatMessageHTML", (message, html, data) => {
    if (message.getFlag("dice-so-nice", "pendingCard")) {
        game.dice3d?.pendingThrows?.injectCard(message, html);
        return;
    }

    if (game.dice3d && game.dice3d.messageHookDisabled) {
        return;
    }
    if (message._dice3danimating && !game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) {
        // for the first render: hide the entire message (_dice3dMessageHidden)
        // for updates: use textContent fingerprints captured in preUpdateChatMessage to diff which roll elements are new vs existing, and only hide new ones
        if (message._dice3dCountNewRolls){
            const selector = game.dice3d.pipeline.messageUpdateHideSelector;
            const existingFps = [...(message._dice3dExistingRollFingerprints || [])];
            if (!message._dice3dAnimFingerprints) message._dice3dAnimFingerprints = {};
            const animFps = message._dice3dAnimFingerprints;
            // deep copy for matching (originals must persist across re-renders)
            const animFpsCopy = {};
            for (const k in animFps) animFpsCopy[k] = [...animFps[k]];

            const currentAnimId = message._dice3dCurrentAnimId;

            [...html.querySelectorAll(selector)].forEach(el => {
                const fp = el.textContent.trim();

                // old or already-revealed element
                const ei = existingFps.indexOf(fp);
                if (ei !== -1) { existingFps.splice(ei, 1); return; }

                el.classList.add("dsn-hide");

                // in-flight element from a previous animation
                for (const aid in animFpsCopy) {
                    const ai = animFpsCopy[aid].indexOf(fp);
                    if (ai !== -1) {
                        animFpsCopy[aid].splice(ai, 1);
                        el.dataset.dsnAnimId = aid;
                        return;
                    }
                }

                // new element for the current animation
                el.dataset.dsnAnimId = currentAnimId;
                if (!animFps[currentAnimId]) animFps[currentAnimId] = [];
                if (!animFps[currentAnimId].includes(fp))
                    animFps[currentAnimId].push(fp);
            });

            if(message._dice3dMessageHidden)
                html.classList.add("dsn-hide");
        }
        else {
            //first time rendering the message
            html.classList.add("dsn-hide");
            message._dice3dMessageHidden = true;
        }
    }
});

/**
 * Save the number of new rolls in the message before it is updated.
 */
Hooks.on("preUpdateChatMessage", (message, updateData, options) => {
    if (!("rolls" in updateData)) return;
    // We test against the source data in case the system/macro/module has modified the scoped message variable
    const originalRollsArrayLength = message.toObject().rolls.length;
    options.dsnCountAddedRoll = updateData.rolls.length - originalRollsArrayLength;
    options.dsnIndexAddedRoll = originalRollsArrayLength;

    // snapshot existing roll elements so we can diff after re-render
    if (game.dice3d && options.dsnCountAddedRoll > 0) {
        const selector = game.dice3d.pipeline.messageUpdateHideSelector;
        const el = document.querySelector(`.message[data-message-id="${message.id}"]`);
        if (el) {
            message._dice3dExistingRollFingerprints = [...el.querySelectorAll(selector)]
                .filter(e => !e.classList.contains("dsn-hide"))
                .map(e => e.textContent.trim());
        }
    }
});

/**
 * Hide and roll new rolls added in a chat message in a update
 */
Hooks.on("updateChatMessage", (message, updateData, options) => {
    const transition = foundry.utils.getProperty(updateData, "flags.dice-so-nice.interactiveThrow.state");
    if (transition && transition !== "pending")
        game.dice3d?.pendingThrows?.onResolutionTransition(message, transition)
            ?.catch(err => console.error("[Dice So Nice] resolution handling failed:", err));

    if (!("rolls" in updateData)) return;
    if(!shouldInterceptMessage(message, options)) return;

    if (options.dsnCountAddedRoll > 0) {
        message._dice3danimating = true;
        message._dice3dPendingRenders = (message._dice3dPendingRenders || 0) + 1;
        message._dice3dCountNewRolls = options.dsnCountAddedRoll;
        message._dice3dAnimIdCounter = (message._dice3dAnimIdCounter || 0) + 1;
        message._dice3dCurrentAnimId = message._dice3dAnimIdCounter;
        game.dice3d.pipeline._hideNestedParts(message.id);
        game.dice3d.pipeline.renderRolls(message, message.rolls.slice(options.dsnIndexAddedRoll));
    }
});

Hooks.on("deleteChatMessage", (message) => {
    CompanionLink.cleanup(message.id);
    game.dice3d?.pipeline._showNestedParts(message.id);
    game.dice3d?.pendingThrows?.onMessageDeleted(message);
});

Hooks.on("userConnected", (user, connected) => {
    if (!game.dice3d?.box?.initialized) return;
    if (!connected) {
        game.dice3d.persistent.onUserDisconnected(user.id);
        game.dice3d.pendingThrows.onUserDisconnected(user.id);
        return;
    }
    game.dice3d.persistent.onUserConnected(user.id);
});

document.addEventListener("visibilitychange", function () {
    //if there was roll while the tab was hidden
    if (!document.hidden) game.dice3d?.queue?.flushHidden();
});

//Chat Command integration
Hooks.on("chatCommandsReady", commands => {
    commands.register({
        name: "/dice3d",
        module: "dice-so-nice",
        aliases: ["/d3d", "/dsn"],
        description: game.i18n.localize("DICESONICE.ChatCommandDescription"),
        icon: "<i class='fas fa-dice-d20'></i>",
        requiredRole: "NONE",
        callback: async (chat, parameters, messageData) => {
            if (game.dice3d) {
                const dsnRoll = await new Roll(parameters).evaluate();
                game.dice3d.showForRoll(dsnRoll, game.user, true);
            }
            return {};
        },
        autocompleteCallback: (menu, alias, parameters) => [game.chatCommands.createInfoElement(game.i18n.localize("DICESONICE.ChatCommandCompletionDescription"))],
        closeOnComplete: true
    });
});

//re-render sidebar tab once dice3d is ready
Hooks.on("diceSoNiceReady", () => {
    ui["dice-so-nice"]?.render({ force: false });
    game.dice3d?.pendingThrows?.readyCleanup();
});

//pending card action buttons (spawn / escape / force / skip)
document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-dsn-pending-action]");
    if (!btn) return;
    ev.preventDefault();
    const cardEl = btn.closest("[data-dsn-pending-card]");
    if (!cardEl) return;
    game.dice3d?.pendingThrows?.onCardAction(btn.dataset.dsnPendingAction, cardEl.dataset.dsnPendingCard);
});

Hooks.on("collapseSidebar", (sidebar, collapsed) => {
    document.getElementById("sidebar-content").addEventListener("transitionend", () => {
        if (game.dice3d && game.dice3d.box) {
            game.dice3d.resizePlayArea();
        }
    }, { once: true });
});