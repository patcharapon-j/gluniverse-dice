import { Utils } from '../Utils.js';
import { DiceLibrary } from '../engine/DiceLibrary.js';

//resolves the effective dsn settings of a user: options, appearance, role scopes and special effects
//reads game.dice3d lazily for the factory defaults and the box, so it works before the facade exists
export class DsnSettings {

    static get DEFAULT_OPTIONS() {
        const quality = {};
        switch (game.settings.get("core", "performanceMode")) {
            case 0:
                quality.bumpMapping = false;
                quality.shadowQuality = "low";
                quality.glow = false;
                quality.antialiasing = "none";
                quality.useHighDPI = false;
                quality.imageQuality = "low";
                quality.persistentDiceOutlines = false;
                quality.advancedGlass = false;
                break;
            case 1:
                quality.bumpMapping = true;
                quality.shadowQuality = "low";
                quality.glow = false;
                quality.antialiasing = "none";
                quality.useHighDPI = false;
                quality.imageQuality = "medium";
                quality.persistentDiceOutlines = false;
                quality.advancedGlass = false;
                break;
            case 2:
            case 3:
                quality.bumpMapping = true;
                quality.shadowQuality = "high";
                quality.glow = true;
                quality.antialiasing = game.canvas.app.renderer.context.webGLVersion === 2 ? "msaa" : "smaa";
                quality.useHighDPI = true;
                quality.imageQuality = "high";
                quality.persistentDiceOutlines = true;
                quality.advancedGlass = true;
                break;
        }
        return {
            visibility: "all",
            protectPersistent: false,
            showExtraDice: game.dice3d && game.dice3d.hasOwnProperty("defaultShowExtraDice") ? game.dice3d.defaultShowExtraDice : false,
            hideAfterRoll: true,
            timeBeforeHide: 2000,
            hideFX: 'fadeOut',
            autoscale: true,
            scale: 75,
            speed: 1,
            imageQuality: quality.imageQuality,
            shadowQuality: quality.shadowQuality,
            bumpMapping: quality.bumpMapping,
            sounds: true,
            soundsSurface: 'felt',
            soundsVolume: 0.5,
            canvasZIndex: 'auto',
            throwingForce: 'medium',
            useHighDPI: quality.useHighDPI,
            antialiasing: quality.antialiasing,
            glow: quality.glow,
            persistentDiceOutlines: quality.persistentDiceOutlines,
            advancedGlass: quality.advancedGlass,
            ambiance: "foyer_1k",
            showOthersSFX: true,
            immersiveDarkness: true,
            muteSoundSecretRolls: false,
            enableFlavorColorset: true,
            skipAnimationOnInactiveTab: false,
            rollingArea: false,
            persistentDiceSpawnLocation: "center",
            interactiveThrowsUser: "default",
            interactiveThrowsAutoSpawn: false
        };
    }

    //3d dice are enabled from the settings and not paused by a combat
    static isEnabled() {
        let combatEnabled = (!game.combat || !game.combat.started) || (game.combat && game.combat.started && !game.settings.get("dice-so-nice", "disabledDuringCombat"));
        return DsnSettings.CONFIG().visibility !== "none" && combatEnabled;
    }

    static interactiveThrowsAvailable() {
        return game.settings.get("dice-so-nice", "allowInteractivity") &&
            game.settings.get("dice-so-nice", "persistentDice") &&
            !game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages") &&
            !!game.dice3d?.box &&
            DsnSettings.CONFIG().visibility !== "none";
    }

    //effective interactive-throws state for the current user: "disabled", "off" or "on"
    //"disabled" cannot be overridden; "off" needs a per-roll request; "on" is interactive by default
    static interactiveThrowsState() {
        if (!DsnSettings.interactiveThrowsAvailable()) return "disabled";
        const world = game.settings.get("dice-so-nice", "interactiveThrows");
        if (world === "0") return "disabled";
        const user = DsnSettings.CONFIG().interactiveThrowsUser;
        if (user === "default") return world === "2" ? "on" : "off";
        return user;
    }

    static hasInlineRoll(message) {
        return game.settings.get("dice-so-nice", "animateInlineRoll") && !!message.content?.includes("inline-roll");
    }

    //the rolls dsn animates for a message: its own rolls, plus the inline rolls of its content merged into one pool
    static rollsFromMessage(message) {
        const rolls = message.isRoll ? message.rolls : [];
        if (!DsnSettings.hasInlineRoll(message)) return rolls;
        const temp = document.createElement("div");
        temp.innerHTML = message.content;
        const sequenceInlineRolls = !game.settings.get("dice-so-nice", "enabledSimultaneousRollForMessage");
        let maxRollOrder = message.isRoll ? 0 : -1;
        const inlineRolls = [];
        temp.querySelectorAll(".inline-roll.inline-result:not(.inline-dsn-hidden)").forEach(el => {
            //the Roll class registered in CONFIG in case the system overwrites it (eg: HeXXen)
            const roll = CONFIG.Dice.rolls[0].fromJSON(unescape(el.dataset.roll));
            if (sequenceInlineRolls) {
                maxRollOrder++;
                roll.dice.forEach(term => {
                    if (!term.options.hasOwnProperty("rollOrder"))
                        term.options.rollOrder = maxRollOrder;
                });
            }
            inlineRolls.push(roll);
        });
        if (!inlineRolls.length) return rolls;
        const pool = foundry.dice.terms.PoolTerm.fromRolls([...rolls, ...inlineRolls]);
        return [CONFIG.Dice.rolls[0].fromTerms([pool])];
    }

    static DEFAULT_APPEARANCE(user = game.user) {
        return {
            global: {
                labelColor: Utils.contrastOf(user.color.toString()),
                diceColor: user.color.toString(),
                outlineColor: user.color.toString(),
                edgeColor: user.color.toString(),
                texture: "none",
                material: "auto",
                font: "auto",
                colorset: "custom",
                system: "standard"
            }
        };
    }

    static ALL_DEFAULT_OPTIONS(user = game.user) {
        let options = foundry.utils.mergeObject(DsnSettings.DEFAULT_OPTIONS, { appearance: DsnSettings.DEFAULT_APPEARANCE(user) }, { applyOperators: true });
        options.appearance.global.system = game.dice3d.DiceFactory.preferredSystem;
        options.appearance.global.colorset = game.dice3d.DiceFactory.preferredColorset;
        return options;
    }

    static CONFIG(user = game.user) {
        let userSettings = user.getFlag("dice-so-nice", "settings") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "settings")) : {};
        let config = foundry.utils.mergeObject(DsnSettings.DEFAULT_OPTIONS, userSettings, { applyOperators: true });
        delete config.appearance;
        delete config.sfxLine;
        return config;
    }

    static APPEARANCE(user = game.user, actor = null) {
        let userAppearance = user.getFlag("dice-so-nice", "appearance") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "appearance")) : {};
        let appearance = foundry.utils.mergeObject(DsnSettings.DEFAULT_APPEARANCE(user), userAppearance, { applyOperators: true });
        delete appearance.dimensions;
        if (actor) {
            let actorAppearance = actor.getFlag("dice-so-nice", "appearance");
            if (actorAppearance) {
                actorAppearance = foundry.utils.duplicate(actorAppearance);
                appearance = foundry.utils.mergeObject(appearance, actorAppearance, { applyOperators: true });
            }
        }
        return Utils.sanitizeAppearance(appearance, user);
    }

    static ROLE_APPEARANCE(user = game.user, actor = null) {
        const userScopes = user.getFlag("dice-so-nice", "roleAppearance");
        let scopes = userScopes ? foundry.utils.duplicate(userScopes) : {};
        if (actor) {
            const actorScopes = actor.getFlag("dice-so-nice", "roleAppearance");
            if (actorScopes) {
                scopes = foundry.utils.mergeObject(scopes, foundry.utils.duplicate(actorScopes), { applyOperators: true });
            }
        }
        return Utils.sanitizeRoleScopes(scopes, user);
    }

    static ROLE_CONTEXT(user = game.user, actor = null) {
        const player = DsnSettings.ROLE_APPEARANCE(user, actor);
        let world = {};
        try {
            world = foundry.utils.duplicate(game.settings.get("dice-so-nice", "roleScopes") ?? {});
        } catch (e) {
            world = {};
        }
        Utils.sanitizeRoleScopes(world);
        const dicefactory = game.dice3d?.DiceFactory;
        const ids = new Set([...Object.keys(player), ...Object.keys(world)]);
        if (dicefactory) for (const role of dicefactory.getRoles()) ids.add(role.id);
        const context = {};
        for (const id of ids) {
            if (id === "basic") continue;
            const role = dicefactory?.getRole(id);
            if (role?.deleted) continue;
            context[id] = {
                userId: user.id,
                customizable: !!role?.customizable,
                player: player[id] ?? {},
                world: world[id] ?? {},
                defaults: role?.defaults ? foundry.utils.duplicate(role.defaults) : {}
            };
        }
        return context;
    }

    static SFX(user = game.user) {
        let sfxArray;
        if (DsnSettings.CONFIG().showOthersSFX || user.id == game.user.id)
            sfxArray = user.getFlag("dice-so-nice", "sfxList") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "sfxList")) : [];
        else
            sfxArray = [];
        if (!Array.isArray(sfxArray)) {
            sfxArray = [];
        }
        return sfxArray;
    }

    /**
     * Get the full customizations settings for the animation queue
     */
    static ALL_CUSTOMIZATION(user = game.user, dicefactory = null, actor = null) {
        let specialEffects = DsnSettings.SFX(user) || [];
        game.users.forEach((other) => {
            if (other.isGM && other.id != user.id) {
                let GMSFX = DsnSettings.SFX(other);
                if (Array.isArray(GMSFX)) {
                    GMSFX = GMSFX.filter(sfx => sfx.options && sfx.options.isGlobal);
                    specialEffects = specialEffects.concat(GMSFX);
                }
            }
        });
        let config = foundry.utils.mergeObject({ appearance: DsnSettings.APPEARANCE(user, actor) }, { specialEffects: specialEffects }, { applyOperators: true });
        if (dicefactory && !user.getFlag("dice-so-nice", "appearance") && !actor?.getFlag("dice-so-nice", "appearance")) {
            if (dicefactory.preferredSystem != "standard")
                config.appearance.global.system = dicefactory.preferredSystem;
            if (dicefactory.preferredColorset != "custom")
                config.appearance.global.colorset = dicefactory.preferredColorset;
        }
        config.diceLibrary = DiceLibrary.getLibraryForUser(user);
        config.roleContext = DsnSettings.ROLE_CONTEXT(user, actor);
        return config;
    }

    static ALL_CONFIG(user = game.user, actor = null) {
        let ret = foundry.utils.mergeObject(DsnSettings.CONFIG(user), { appearance: DsnSettings.APPEARANCE(user, actor) }, { applyOperators: true });
        ret.specialEffects = DsnSettings.SFX(user);
        ret.roleContext = DsnSettings.ROLE_CONTEXT(user, actor);
        return ret;
    }

    static _roleNotation(role) {
        return (!role || role === "basic") ? null : { role, options: {} };
    }
}
