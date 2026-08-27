import { TEXTURELIST, COLORSETS } from './engine/DiceColors.js';
import { DiceLibrary } from './engine/DiceLibrary.js';
import { Dice3D } from './Dice3D.js';

/**
 * Generic utilities class...
 */
export class Utils {

    static removeTicker(fn) {
        let ticker = canvas.app.ticker;
        let listener = ticker._head.next;

        while (listener) {
            if (listener.fn === fn) {
                listener = listener.destroy();
            }
            else {
                listener = listener.next;
            }
        }

        if (!ticker._head.next) {
            ticker._cancelIfNeeded();
        }
        return ticker;
    }

    static DATA_FORMAT_VERSION = "6.3";
    static RELOAD_REQUIRED_IF_MODIFIED = ["canvasZIndex", "bumpMapping", "useHighDPI", "glow", "antialiasing", "rollingArea", "advancedGlass", "ambiance", "visibility"];

    /**
     * Check if the user's version is less than a specific target version.
     * @param {string} userVersion - The user's version string (e.g., "2.1").
     * @param {string} targetVersion - The target version string to compare against (e.g., "2.3").
     * @returns {boolean} True if userVersion < targetVersion, else false.
     */
    static isVersionLessThan(userVersion, targetVersion) {
        const segments1 = userVersion.split('.').map(Number);
        const segments2 = targetVersion.split('.').map(Number);
        const length = Math.max(segments1.length, segments2.length);

        for (let i = 0; i < length; i++) {
            const num1 = segments1[i] || 0;
            const num2 = segments2[i] || 0;

            if (num1 < num2) return true;
            if (num1 > num2) return false;
            // If equal, continue to next segment
        }

        // Versions are equal
        return false;
    }


    /**
     * Migrate old setting to latest format.
     */
    static async migrateOldSettings() {
        let formatversion = game.settings.get("dice-so-nice", "formatVersion");

        // We assume a new install. Could be a very very old a, before we had a formatversion
        // But it means 3y or more. Not worth worrying about.
        if (formatversion == "") {
            if (game.user.isGM)
                await game.settings.set("dice-so-nice", "formatVersion", Utils.DATA_FORMAT_VERSION);
            return true;
        }

        if (formatversion == Utils.DATA_FORMAT_VERSION)
            return true;

        if (!game.user.isGM) {
            ui.notifications.warn(game.i18n.localize("DICESONICE.migrateMessageNeedGM"));
            return false;
        }

        let migrated = false;

        if (Utils.isVersionLessThan(formatversion, "3.0")) {
            //migrate settings to flags. This is a scoped migration, no GM needed
            let userSettings = game.settings.get("dice-so-nice", "settings");
            if (userSettings.hasOwnProperty("enabled")) {
                await game.user.setFlag("dice-so-nice", "settings", userSettings);
                await game.settings.set("dice-so-nice", "settings", {});
            }

            migrated = true;
        }

        if (Utils.isVersionLessThan(formatversion, "2.0")) {
            //v1 to v2
            let settings = game.user.getFlag("dice-so-nice", "settings") ? foundry.utils.duplicate(game.user.getFlag("dice-so-nice", "settings")) : {};
            if (settings.diceColor || settings.labelColor) {
                let newSettings = foundry.utils.mergeObject(Dice3D.DEFAULT_OPTIONS, settings, { insertKeys: false, insertValues: false, applyOperators: true });
                let appearance = foundry.utils.mergeObject(Dice3D.DEFAULT_APPEARANCE(), settings, { insertKeys: false, insertValues: false, applyOperators: true });
                delete newSettings.dimensions;
                delete newSettings.fxList;
                await game.settings.set("dice-so-nice", "settings", newSettings);
                await game.user.setFlag("dice-so-nice", "appearance", appearance);
                migrated = true;
            }
        }

        if (Utils.isVersionLessThan(formatversion, "4.0")) {
            //v2 to v4
            await Promise.all(game.users.map(async (user) => {
                let appearance = user.getFlag("dice-so-nice", "appearance") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "appearance")) : null;
                if (appearance && appearance.hasOwnProperty("labelColor")) {
                    let data = {
                        global: appearance
                    };
                    await user.unsetFlag("dice-so-nice", "appearance");
                    await user.setFlag("dice-so-nice", "appearance", data);
                    migrated = true;
                }

                let sfxList = user.getFlag("dice-so-nice", "sfxList") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "sfxList")) : null;

                if (sfxList) {
                    if (!Array.isArray(sfxList))
                        sfxList = Object.values(sfxList);
                    sfxList.forEach((sfx) => {
                        sfx.onResult = [sfx.onResult];
                    });
                    await user.unsetFlag("dice-so-nice", "sfxList");
                    await user.setFlag("dice-so-nice", "sfxList", sfxList);
                    migrated = true;
                }
            }));

            migrated = true;
        }

        if (Utils.isVersionLessThan(formatversion, "4.1")) {
            //v4 to v4.1 (fix)
            //remove the legacy top level appearance properties left over by the 4.0 migration
            const legacyKeys = ["colorset", "diceColor", "edgeColor", "font", "labelColor", "material", "outlineColor", "system", "texture"];
            await Promise.all(game.users.map(async (user) => {
                let appearance = user.getFlag("dice-so-nice", "appearance") ? foundry.utils.duplicate(user.getFlag("dice-so-nice", "appearance")) : null;
                if (appearance && appearance.hasOwnProperty("labelColor")) {
                    let data = Object.fromEntries(legacyKeys.map(k => [k, new foundry.data.operators.ForcedDeletion()]));
                    await user.setFlag("dice-so-nice", "appearance", data);
                }
            }));

            migrated = true;
        }

        if(Utils.isVersionLessThan(formatversion, "4.2")) {
            //v4.1 to v4.2
            //showGhostDice is now a string with 3 values. 0, 1 or 2
            //If the setting was previously false, set it to 0. If it was true, set it to 1
            await game.settings.set("dice-so-nice", "showGhostDice", game.settings.get("dice-so-nice", "showGhostDice") ? '1' : '0');

            migrated = true;
        }

        if(Utils.isVersionLessThan(formatversion, "6.0")) {
            // migrate boolean forceCharacterOwnerAppearanceForInitiative to select forceCharacterOwnerAppearance
            try {
                const oldValue = game.settings.get("dice-so-nice", "forceCharacterOwnerAppearanceForInitiative");
                await game.settings.set("dice-so-nice", "forceCharacterOwnerAppearance", oldValue ? "1" : "0");
            } catch(e) {
                // old setting doesn't exist (fresh install), keep the default
            }

            migrated = true;
        }

        if(Utils.isVersionLessThan(formatversion, "6.1")) {
            // unify enabled + onlyShowOwnDice into a single visibility setting
            const settings = game.user.getFlag("dice-so-nice", "settings");
            if (settings) {
                let visibility = "all";
                if (settings.enabled === false) {
                    visibility = "none";
                } else if (settings.onlyShowOwnDice === true) {
                    visibility = "mine";
                }
                
                const updated = {
                    ...settings,
                    visibility,
                    enabled: new foundry.data.operators.ForcedDeletion(),
                    onlyShowOwnDice: new foundry.data.operators.ForcedDeletion()
                };
                await game.user.setFlag("dice-so-nice", "settings", updated);
            }

            migrated = true;
        }

        if(Utils.isVersionLessThan(formatversion, "6.3")) {
            //damage type mapping becomes world role scopes + custom roles.
            if (!game.settings.get("dice-so-nice", "rolesMigrated")) {
                await Utils.migrateDamageTypeMap();
            }
            migrated = true;
        }

        await game.settings.set("dice-so-nice", "formatVersion", Utils.DATA_FORMAT_VERSION);
        if (migrated)
            ui.notifications.info(game.i18n.format("DICESONICE.migrateMessage", { version: Utils.DATA_FORMAT_VERSION }));
        return true;
    }

    static async migrateDamageTypeMap() {
        const map = game.settings.get("dice-so-nice", "damageTypeMap") ?? {};
        const roleScopes = foundry.utils.deepClone(game.settings.get("dice-so-nice", "roleScopes") ?? {});
        const roles = foundry.utils.deepClone(game.settings.get("dice-so-nice", "roles") ?? {});
        const helpers = {
            getSave: (ownerId, name) => {
                const owner = game.users.get(ownerId);
                if (!owner) return undefined;
                return owner.getFlag("dice-so-nice", "saves")?.[name];
            },
            copyDieToWorld: async (ownerId, dieId) => {
                const die = DiceLibrary.getFromUser(ownerId, dieId);
                if (!die) return null;
                const copy = await DiceLibrary.saveWorldDie({ ...foundry.utils.deepClone(die), id: undefined });
                return copy?.id ?? null;
            },
            isBuiltinDamage: (id) => COLORSETS[id]?.category === "DICESONICE.DamageTypes"
        };
        let count = 0;
        let changed = false;
        for (const [id, entry] of Object.entries(map)) {
            try {
                const result = await Utils.convertDamageTypeEntry(id, entry, helpers);
                result.logs.forEach((line) => console.log(`Dice So Nice! | ${line}`));
                if (result.scope) {
                    roleScopes[id] = result.scope;
                    changed = true;
                }
                if (result.role) {
                    roles[id] = foundry.utils.mergeObject(roles[id] ?? {}, result.role);
                    changed = true;
                }
                count++;
            } catch (e) {
                console.log(`Dice So Nice! | damage type "${id}" could not be migrated, skipped`, e);
            }
        }
        if (changed) {
            await game.settings.set("dice-so-nice", "roleScopes", roleScopes);
            await game.settings.set("dice-so-nice", "roles", roles);
        }
        await game.settings.set("dice-so-nice", "rolesMigrated", true);
        console.log(`Dice So Nice! | migrated ${count} damage type entries to roles`);
    }

    static async convertDamageTypeEntry(id, entry, { getSave, copyDieToWorld, isBuiltinDamage }) {
        const logs = [];
        let scope = null;
        if (entry?.saveName) {
            const save = getSave(entry.saveOwner, entry.saveName);
            if (!save?.appearance) {
                logs.push(`damage type "${id}": save "${entry.saveName}" or its owner no longer exists, appearance dropped`);
            } else {
                scope = structuredClone(save.appearance);
                for (const [slot, data] of Object.entries(scope)) {
                    if (!data?.libraryDieId) continue;
                    const ownerId = data.libraryDieOwner || entry.saveOwner;
                    const newId = await copyDieToWorld(ownerId, data.libraryDieId);
                    if (newId) {
                        data.libraryDieId = newId;
                        data.libraryDieOwner = "world";
                    } else {
                        logs.push(`damage type "${id}": library die "${data.libraryDieId}" on ${slot} no longer exists, reference dropped`);
                        delete data.libraryDieId;
                        delete data.libraryDieOwner;
                    }
                }
            }
        } else {
            const global = {};
            if (entry?.colorset) global.colorset = entry.colorset;
            if (entry?.preset) global.system = entry.preset;
            if (Object.keys(global).length) scope = { global };
        }
        let role = null;
        if (!isBuiltinDamage(id)) {
            role = { customizable: false, detectors: { types: [id] } };
            if (entry?.label) role.label = entry.label;
        }
        return { scope, role, logs };
    }

    /**
     *
     * @param cfg
     * @returns {{}}
     */
    static localize(cfg) {
        return Object.keys(cfg).reduce((i18nCfg, key) => {
            i18nCfg[key] = game.i18n.localize(cfg[key]);
            return i18nCfg;
        }, {}
        );
    };

    /**
     * Get the contrasting color for any hex color.
     *
     * @returns {String} The contrasting color (black or white)
     */
    static contrastOf(color) {

        if (color.slice(0, 1) === '#') {
            color = color.slice(1);
        }

        if (color.length === 3) {
            color = color.split('').map(function (hex) {
                return hex + hex;
            }).join('');
        }

        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);

        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };

    static prepareTextureList() {
        return Object.keys(TEXTURELIST).filter(k => !k.startsWith("custom:")).reduce((i18nCfg, key) => {
            i18nCfg[key] = game.i18n.localize(TEXTURELIST[key].name);
            return i18nCfg;
        }, {}
        );
    };

    static prepareFontList() {
        let fontList = {
            "auto": game.i18n.localize("DICESONICE.FontAuto")
        };
        return foundry.utils.mergeObject(fontList, foundry.applications.settings.menus.FontConfig.getAvailableFontChoices());
    };

    static prepareColorsetList() {
        let colorsetList = Object.entries(COLORSETS).reduce((colorsetObj, [key, colorset]) => {
            if (colorset.visibility !== 'hidden') {
                colorsetObj[key] = Object.assign({}, colorset, { label: game.i18n.localize(colorset.description), group: game.i18n.localize(colorset.category) });
            }
            return colorsetObj;
        }, {});

        return Object.fromEntries(Object.entries(colorsetList).sort((a, b) => a[1].label.localeCompare(b[1].label)));
    };

    static prepareSystemList() {
        let systems = game.dice3d.box.dicefactory.systems;
        return [...systems.values()].sort((systemA, systemB) => {
            // Direct comparison since we're now working directly with the values
            if (systemA.id === "standard") {
                return -1;
            } else if (systemB.id === "standard") {
                return 1;
            } else if (systemA.group === systemB.group) {
                return systemA.name.localeCompare(systemB.name);
            } else if (systemA.group === null) {
                return 1;
            } else if (systemB.group === null) {
                return -1;
            } else {
                return systemA.group.localeCompare(systemB.group);
            }
        }).reduce((i18nCfg, system) => {
            // Use system.id as the key for i18nCfg
            i18nCfg[system.id] = { label: game.i18n.localize(system.name), group: system.group };
            return i18nCfg;
        }, {});
    }

    static filterObject(obj, predicate) {
        return Object.keys(obj)
            .filter(key => predicate(obj[key]))
            .reduce((res, key) => (res[key] = obj[key], res), {});
    }

    static actionSaveAs(name) {
        let savesObject = game.user.getFlag("dice-so-nice", "saves");
        let saves;
        if (!savesObject) {
            saves = new Map();
        } else {
            //workaround for https://gitlab.com/foundrynet/foundryvtt/-/issues/5464
            saves = new Map(Object.entries(savesObject));
        }
        //save current settings first

        let saveObject = {
            appearance: game.user.getFlag("dice-so-nice", "appearance"),
            roleAppearance: game.user.getFlag("dice-so-nice", "roleAppearance") ?? {},
            sfxList: game.user.getFlag("dice-so-nice", "sfxList"),
            settings: game.user.getFlag("dice-so-nice", "settings"),
            diceLibrary: game.user.getFlag("dice-so-nice", "diceLibrary")
        };

        saves.set(name, saveObject);
        game.user.unsetFlag("dice-so-nice", "saves").then(() => {
            game.user.setFlag("dice-so-nice", "saves", Object.fromEntries(saves));
        });
    }

    static async actionDeleteSave(name) {
        let savesObject = game.user.getFlag("dice-so-nice", "saves");
        let saves = new Map(Object.entries(savesObject));
        saves.delete(name);
        game.user.unsetFlag("dice-so-nice", "saves").then(async () => {
            await game.user.setFlag("dice-so-nice", "saves", Object.fromEntries(saves));
            ui.notifications.info(game.i18n.localize("DICESONICE.saveMessage"));
        });
    }

    static async actionLoadSave(name) {
        let savesObject = game.user.getFlag("dice-so-nice", "saves");
        let save = new Map(Object.entries(savesObject)).get(name);

        if (save.appearance) {
            await game.user.unsetFlag("dice-so-nice", "appearance");
            await game.user.setFlag("dice-so-nice", "appearance", save.appearance);
        }
        if (save.roleAppearance !== undefined) {
            await game.user.unsetFlag("dice-so-nice", "roleAppearance");
            if (!foundry.utils.isEmpty(save.roleAppearance)) {
                await game.user.setFlag("dice-so-nice", "roleAppearance", save.roleAppearance);
            }
        }
        if (save.sfxList) {
            await game.user.unsetFlag("dice-so-nice", "sfxList");
            await game.user.setFlag("dice-so-nice", "sfxList", save.sfxList);
        }
        if (save.settings) {
            //For each Utils.RELOAD_REQUIRED_IF_MODIFIED check if the value has changed and reload if so
            let settings = game.user.getFlag("dice-so-nice", "settings");
            let reloadRequired = false;
            Utils.RELOAD_REQUIRED_IF_MODIFIED.forEach(key => {
                if (settings.hasOwnProperty(key) && save.settings.hasOwnProperty(key) && settings[key] != save.settings[key]) {
                    reloadRequired = true;
                }
            });
            await game.user.unsetFlag("dice-so-nice", "settings");
            await game.user.setFlag("dice-so-nice", "settings", save.settings);

            if (reloadRequired) {
                window.location.reload();
            }
        }
        if (save.diceLibrary) {
            await game.user.unsetFlag("dice-so-nice", "diceLibrary");
            await game.user.setFlag("dice-so-nice", "diceLibrary", save.diceLibrary);
            await game.dice3d.diceLibrary.load();
        }
        ui.notifications.info(game.i18n.format("DICESONICE.loadMessage", { name }));
    }

    //reset references to resources that no longer exist
    static sanitizeAppearance(appearance, user = null) {
        const dicefactory = game.dice3d?.DiceFactory;
        if (!dicefactory) return appearance;

        for (const scope in appearance) {
            if (!appearance.hasOwnProperty(scope)) continue;
            const settings = appearance[scope];
            if (!settings || typeof settings !== 'object') continue;

            if (settings.system && !dicefactory.systems.has(settings.system)) {
                settings.system = "standard";
                settings.systemSettings = {};
            }

            if (settings.colorset && settings.colorset !== "custom" && !COLORSETS[settings.colorset]) {
                settings.colorset = "custom";
            }

            if (settings.texture && typeof settings.texture === 'string'
                && settings.texture !== "none" && !settings.texture.startsWith("custom:") && !TEXTURELIST[settings.texture]) {
                settings.texture = "none";
            }

            if (settings.material && settings.material !== "auto" && !dicefactory.material_options[settings.material]) {
                settings.material = "auto";
            }

            if (settings.libraryDieId) {
                if (settings.libraryDieOwner) {
                    const owner = DiceLibrary.resolveOwner(settings.libraryDieOwner);
                    if (!owner || !DiceLibrary.getFromUser(owner, settings.libraryDieId)) {
                        delete settings.libraryDieId;
                        delete settings.libraryDieOwner;
                    }
                } else if (user) {
                    if (!DiceLibrary.getFromUser(user, settings.libraryDieId)) {
                        delete settings.libraryDieId;
                    }
                } else {
                    const library = game.dice3d?.diceLibrary;
                    if (library && !library.get(settings.libraryDieId)) {
                        delete settings.libraryDieId;
                    }
                }
            }
        }
        return appearance;
    }

    static sanitizeRoleScopes(scopes, user = null) {
        if (!scopes || typeof scopes !== "object") return {};
        for (const roleId in scopes) {
            if (!scopes.hasOwnProperty(roleId)) continue;
            const scope = scopes[roleId];
            if (!scope || typeof scope !== "object") {
                delete scopes[roleId];
                continue;
            }
            Utils.sanitizeAppearance(scope, user);
        }
        return scopes;
    }

    //shortcut to instantly dismiss ephemeral dice
    static onDismissEphemeralKeydown(event) {
        if (event.repeat) return;
        const bindings = game.keybindings?.bindings?.get("dice-so-nice.dismissEphemeralDice");
        if (!bindings?.length) return;
        if (!bindings.some(b => Utils._matchesKeybinding(event, b))) return;
        game.dice3d?.dismissEphemeralDice();
    }

    //match a keydown event against a Foundry stored binding {key, modifiers[]}
    static _matchesKeybinding(event, binding) {
        if (event.code !== binding.key) return false;
        const mods = binding.modifiers || [];
        const needsCtrl = mods.includes("Control");
        const needsShift = mods.includes("Shift");
        const needsAlt = mods.includes("Alt");
        if ((event.ctrlKey || event.metaKey) !== needsCtrl) return false;
        if (event.shiftKey !== needsShift) return false;
        if (event.altKey !== needsAlt) return false;
        return true;
    }
}
