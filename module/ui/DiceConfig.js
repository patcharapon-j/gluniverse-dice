import { DsnSettings } from '../settings/DsnSettings.js';
import { DiceScene } from '../engine/DiceScene.js';
import { DiceSFXManager } from '../sfx/DiceSFXManager.js';
import { SFXFormulaMatcher } from '../sfx/SFXFormulaMatcher.js';
import { ShowcaseView } from '../rendering/ShowcaseView.js';
import { Utils } from '../Utils.js';
import { DiceNotation, COMPOUND_DICE } from '../DiceNotation.js';
import { DiceColors, DICE_SCALE } from '../engine/DiceColors.js';
import { AMBIANCE_LIST } from '../engine/DiceFactory.js';
import { DiceSystem } from '../DiceSystem.js';
import { DiceLibrary } from '../engine/DiceLibrary.js';
import { DiceLibraryDialog } from './DiceLibraryDialog.js';
import { DiceEditor } from './DiceEditor.js';
import { WorldRoleScopeTarget } from './WorldRoleScopeTarget.js';
import SlimSelect from 'slim-select';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Form application to configure settings of the 3D Dice.
 */
export class DiceConfig extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["dice-so-nice"],
        form: {
            handler: DiceConfig._onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        },
        window: {
            contentClasses: ["standard-form"]
        },
        id: "dice-config",
        position: {
            width: 680,
            height: "auto"
        },
        actions: {
            resetActor: DiceConfig._onResetActor
        }
    };

    constructor(options = {}) {
        super(options);
        this.roleId = options.roleId ?? null;
        this.isWorldRole = !!this.roleId;
        this.document = options.document ?? (this.isWorldRole ? new WorldRoleScopeTarget(this.roleId) : game.user);
        this.isUser = !this.isWorldRole && this.document instanceof User;
        this.isActor = !this.isWorldRole && this.document instanceof Actor;
        this.currentRole = this.roleId ?? "basic";
        this._roleBuffers = {};
        this._roleHiddenSlots = {};
    }

    get isRoleMode() {
        return this.currentRole !== "basic";
    }

    get targetActor() {
        return this.isActor ? this.document : null;
    }

    get noScene() {
        return DsnSettings.CONFIG().visibility === "none";
    }

    get title() {
        if (this.isWorldRole) {
            return game.i18n.format("DICESONICE.configTitleWorldRole", { role: this.document.name });
        }
        if (this.isActor) {
            return `${game.i18n.localize("DICESONICE.configTitle")} - ${this.document.name}`;
        }
        return game.i18n.localize("DICESONICE.configTitle");
    }

    get id() {
        if (this.isWorldRole) return `dice-config-role-${this.roleId}`;
        if (this.isActor) return `dice-config-${this.document.id}`;
        return "dice-config";
    }

    static TABS = {
        "dsn-main": {
            tabs: [
                { id: "general", icon: "fa-solid fa-dice-d20", label: "DICESONICE.settingsAppearance" },
                { id: "preferences", icon: "fa-solid fa-cog", label: "DICESONICE.settingsPreferences" },
                { id: "sfx", icon: "fa-solid fa-meteor", label: "DICESONICE.settingsSpecialEffects" },
                { id: "performance", icon: "fa-solid fa-desktop", label: "DICESONICE.settingsDisplay" },
                { id: "data", icon: "fa-solid fa-database", label: "DICESONICE.settingsProfilesData" }
            ],
            initial: "general"
        },
        "dsn-dice": {
            tabs: [{ id: "global", label: "Global" }],
            initial: "global"
        }
    };

    static PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
        },
        general: {
            template: "modules/dice-so-nice/templates/dice-config-general.hbs",
            scrollable: [""]
        },
        preferences: {
            template: "modules/dice-so-nice/templates/dice-config-preferences.hbs",
            scrollable: [""]
        },
        sfx: {
            template: "modules/dice-so-nice/templates/dice-config-sfx.hbs",
            scrollable: [""]
        },
        performance: {
            template: "modules/dice-so-nice/templates/dice-config-performance.hbs",
            scrollable: [""]
        },
        data: {
            template: "modules/dice-so-nice/templates/dice-config-data.hbs",
            scrollable: [""]
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    async _preparePartContext(partId, context, options) {
        context = await super._preparePartContext(partId, context, options);
        context.tab = context.tabs[partId];
        if (partId === "data") {
            context.isGM = game.user.isGM;
        }
        return context;
    }

    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        if (this.isActor || this.isWorldRole) {
            for (const key of Object.keys(parts)) {
                if (!["general", "footer"].includes(key)) {
                    delete parts[key];
                }
            }
        }
        return parts;
    }

    async _prepareContext(options) {
        let data = foundry.utils.mergeObject({
            fxList: Utils.localize({
                "none": "DICESONICE.None",
                "fadeOut": "DICESONICE.FadeOut"
            }),
            speedList: Utils.localize({
                "1": "DICESONICE.NormalSpeed",
                "2": "DICESONICE.2xSpeed",
                "3": "DICESONICE.3xSpeed"
            }),
            textureList: Utils.prepareTextureList(),
            materialList: Utils.localize({
                "auto": "DICESONICE.MaterialAuto",
                "chrome": "DICESONICE.MaterialChrome",
                "frosted": "DICESONICE.MaterialFrosted",
                "glass": "DICESONICE.MaterialGlass",
                "iridescent": "DICESONICE.MaterialIridescent",
                "metal": "DICESONICE.MaterialMetal",
                "plastic": "DICESONICE.MaterialPlastic",
                "pristine": "DICESONICE.MaterialPristine",
                "resin": "DICESONICE.MaterialResin",
                "stone": "DICESONICE.MaterialStone",
                "velvet": "DICESONICE.MaterialVelvet",
                "wood": "DICESONICE.MaterialWood"
            }),
            fontList: Utils.prepareFontList(),
            colorsetList: Utils.prepareColorsetList(),
            imageQualityList: Utils.localize({
                "low": "DICESONICE.Low",
                "medium": "DICESONICE.Medium",
                "high": "DICESONICE.High",
                "custom": "DICESONICE.Custom"
            }),
            shadowQualityList: Utils.localize({
                "none": "DICESONICE.None",
                "low": "DICESONICE.Low",
                "medium": "DICESONICE.Medium",
                "high": "DICESONICE.High"
            }),
            antialiasingList: Utils.localize({
                "none": "DICESONICE.None",
                "smaa": "DICESONICE.SMAA",
                "msaa": "DICESONICE.MSAA"
            }),
            soundsSurfaceList: Utils.localize({
                "felt": "DICESONICE.SurfaceFelt",
                "wood_table": "DICESONICE.SurfaceWoodTable",
                "wood_tray": "DICESONICE.SurfaceWoodTray",
                "metal": "DICESONICE.SurfaceMetal"
            }),
            ambianceList: Utils.localize(AMBIANCE_LIST),
            canvasZIndexList: Utils.localize({
                "auto": "DICESONICE.CanvasZIndexAuto",
                "over": "DICESONICE.CanvasZIndexOver",
                "under": "DICESONICE.CanvasZIndexUnder",
            }),
            throwingForceList: Utils.localize({
                "weak": "DICESONICE.ThrowingForceWeak",
                "medium": "DICESONICE.ThrowingForceMedium",
                "strong": "DICESONICE.ThrowingForceStrong"
            }),
            spawnLocationList: Utils.localize({
                "center": "DICESONICE.SpawnCenter",
                "topLeft": "DICESONICE.SpawnTopLeft",
                "topRight": "DICESONICE.SpawnTopRight",
                "bottomLeft": "DICESONICE.SpawnBottomLeft",
                "bottomRight": "DICESONICE.SpawnBottomRight"
            }),
            visibilityList: Utils.localize({
                "all": "DICESONICE.visibilityAll",
                "mine": "DICESONICE.visibilityMine",
                "none": "DICESONICE.visibilityNone"
            }),
            interactiveThrowsUserList: Utils.localize({
                "default": "DICESONICE.interactiveThrowsUserDefault",
                "disabled": "DICESONICE.interactiveThrowsUserDisabled",
                "off": "DICESONICE.interactiveThrowsUserOff",
                "on": "DICESONICE.interactiveThrowsUserOn"
            }),
            interactiveThrowsAvailable: DsnSettings.interactiveThrowsAvailable() && game.settings.get("dice-so-nice", "interactiveThrows") !== "0"
        },
            this.reset ? DsnSettings.ALL_DEFAULT_OPTIONS() : DsnSettings.ALL_CONFIG(game.user, this.isActor ? this.document : null)
        );
        delete data.sfxLine;

        data.isUser = this.isUser;

        //remove MSAA if not supported
        if (game.canvas.app.renderer.context.webGLVersion < 2) {
            delete data.antialiasingList.msaa;
        }

        //fix corupted save from #139
        if (data.specialEffects) {
            for (let [key, value] of Object.entries(data.specialEffects)) {
                if (Array.isArray(value.diceType) || Array.isArray(value.onResult) || Array.isArray(value.specialEffect))
                    delete data.specialEffects[key];
            }
        }

        this.canvas = document.createElement("div");
        this.canvas.id = "dice-configuration-canvas";
        this.diceFactory = game.dice3d.box.dicefactory;
        let config = foundry.utils.mergeObject(
            this.reset ? DsnSettings.ALL_DEFAULT_OPTIONS() : DsnSettings.ALL_CONFIG(game.user, this.isActor ? this.document : null),
            { dimensions: { width: 634, height: 245 }, autoscale: false, scale: 60 }
        );

        if (!this.noScene) {
            this.diceScene = new DiceScene(this.canvas, this.diceFactory, {
                rendererCacheKey: "showcase",
                dimensions: config.dimensions,
                scale: config.scale,
                autoscale: config.autoscale
            });
            await this.diceScene.initialize();
            this.diceFactory.setQualitySettings(config);
            this.diceScene.setupBloomPipeline();

            this.showcaseView = new ShowcaseView(this.diceScene, this.diceFactory);
            this.showcaseView.showExtraDice = config.showExtraDice;

            config.diceLibrary = DiceLibrary.getLibraryForUser(game.user);
            if (this.isWorldRole) {
                config.role = this.roleId;
                config.dieTypes = this._getRoleDieTypes(this.roleId);
                config.roleContext = this._buildRoleContext(this.roleId, this._getRoleBuffer(this.roleId));
            }
            await this.showcaseView.showcase(config);
        }

        this.navOrder = {};
        let triggerTypeList = [{ id: "", name: "" }];
        this.possibleResultList = {};
        let i = 0;
        const sfxExcludedCompound = new Set(
            Object.entries(COMPOUND_DICE).filter(([k]) => parseInt(k) > 100).map(([, places]) => places[0].type)
        );

        const hiddenDieTypes = this.diceFactory.getHiddenDieTypes();
        const diceTypes = this.showcaseView
            ? this.showcaseView.diceList.map(el => el.userData)
            : [...this.diceFactory.systems.get("standard").dice.keys()].filter(t => !hiddenDieTypes.has(t));

        diceTypes.forEach((diceType) => {
            this.navOrder[diceType] = i++;
            if (!sfxExcludedCompound.has(diceType)) {
                triggerTypeList.push({ id: diceType, name: diceType });
                this.possibleResultList[diceType] = [];
                let preset = this.diceFactory.systems.get("standard").dice.get(diceType);
                let termClass = Object.values(CONFIG.Dice.terms).find(term => term.name == preset.term) || foundry.dice.terms.Die;
                let term = new termClass({});

                if (diceType == "d100") {
                    for (let i = 1; i <= 100; i++) {
                        let label = term.getResultLabel({ result: i });
                        let option = { id: i + "", name: label };
                        this.possibleResultList[diceType].push(option);
                    }
                } else {
                    preset.values.forEach((value) => {
                        let label = term.getResultLabel({ result: value });
                        let option = { id: value + "", name: label };
                        this.possibleResultList[diceType].push(option);
                    });
                }

                this.possibleResultList[diceType].push({ id: "kh", name: "Keep Highest / Advantage" });
                this.possibleResultList[diceType].push({ id: "kl", name: "Keep Lowest / Disadvantage" });
                this.possibleResultList[diceType].push({ id: "dh", name: "Drop Highest" });
                this.possibleResultList[diceType].push({ id: "dl", name: "Drop Lowest" });
                this.possibleResultList[diceType].push({ id: "cs", name: "Counting Success" });
                this.possibleResultList[diceType].push({ id: "cf", name: "Counting Failure" });
                this.possibleResultList[diceType].push({ id: "x", name: "Exploded" });
                this.possibleResultList[diceType].push({ id: "r", name: "Rerolled" });
            }
        });

        let specialEffectsList = [];
        let specialEffectsPromises = [];
        let specialEffects = this.reset ? DsnSettings.DEFAULT_SFX() : DsnSettings.SFX();
        this.triggerTypeList = [...triggerTypeList, ...DiceSFXManager.EXTRA_TRIGGER_TYPE];
        foundry.utils.mergeObject(this.possibleResultList, DiceSFXManager.EXTRA_TRIGGER_RESULTS, { applyOperators: true });

        //Filter out the SFX that are not registered (skip advanced entries, they have no diceType)
        if (specialEffects) {
            let registeredTriggerTypes = this.triggerTypeList.map(trigger => trigger.id);
            specialEffects = specialEffects.filter(sfx => sfx.mode === 'advanced' || registeredTriggerTypes.includes(sfx.diceType));
        }

        if (specialEffects) {
            specialEffects.forEach((sfx, index) => {
                let sfxClass = DiceSFXManager.SFX_MODE_CLASS[sfx.specialEffect];
                if (!sfxClass) return;
                let dialogContent = sfxClass.getDialogContent(sfx, index);
                let hdbsTemplate = Handlebars.compile(dialogContent.content);
                const isAdvanced = sfx.mode === 'advanced';

                specialEffectsPromises.push(foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/partial-sfx.hbs", {
                    id: index,
                    isAdvanced: isAdvanced,
                    formula: isAdvanced ? (sfx.formula || '') : '',
                    diceType: sfx.diceType,
                    onResult: sfx.onResult,
                    specialEffect: sfx.specialEffect,
                    specialEffectsMode: DiceSFXManager.SFX_MODE_LIST,
                    triggerTypeList: this.triggerTypeList,
                    possibleResultList: this.possibleResultList[sfx.diceType],
                    formulaRolesHint: this._sfxFormulaRolesHint(),
                    options: hdbsTemplate(dialogContent.data)
                }).then((html) => {
                    specialEffectsList.push(html);
                }));
            });
            await Promise.all(specialEffectsPromises);
        }
        data.specialEffectsList = specialEffectsList.join("");

        this.currentRole = this.roleId ?? "basic";
        this.initializationData = data;
        data.roleSwitcher = this.isWorldRole ? null : this._prepareRoleSwitcher();

        const initialAppearance = this.isWorldRole ? this._getRoleBuffer(this.roleId) : data.appearance;
        const built = await this._buildAppearanceTabs(initialAppearance, this.currentRole);
        data.navAppearance = built.navAppearance;
        data.displayHint = built.displayHint;
        data.tabsAppearance = built.tabsAppearance;

        this.lastActiveAppearanceTab = "global";

        this.currentGlobalAppearance = initialAppearance.global ?? {};
        this.sfxDialogList = [];
        this.systemSettingsDialogList = [];

        this.slimSelectInstances = new Map();

        data.tabs = this._prepareTabs("dsn-main");
        data.appearanceTabs = this._prepareTabs("dsn-dice");

        data.buttons = [
            { type: "submit", icon: "fa-solid fa-save", label: "DICESONICE.Save" },
            { type: "button", action: "test", icon: "fa-solid fa-dice", label: "DICESONICE.TestRoll" },
            { type: "button", action: "close", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel" }
        ];

        if (this.isActor) {
            data.buttons.unshift({ type: "button", action: "resetActor", icon: "fa-solid fa-undo", label: "DICESONICE.Reset" });
        }

        if (this.isWorldRole) {
            data.buttons.unshift({ type: "button", action: "loadRoleSave", icon: "fa-solid fa-box-open", label: "DICESONICE.RoleLoadFromSave" });
        }

        return data;
    }

    addTitleToOptions(htmlString, selectorString) {
        // Initialize a DOMParser to parse the HTML string
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Select all <option> elements within elements that have the 'data-colorset' attribute
        const options = doc.querySelectorAll(selectorString);

        // Iterate over each <option> and set its 'title' attribute to its 'value'
        options.forEach(option => {
            // Ensure the 'value' attribute exists
            if (option.hasAttribute('value')) {
                const value = option.getAttribute('value');
                option.setAttribute('title', value);
            }
        });

        // Serialize the modified DOM back to an HTML string
        return doc.documentElement.outerHTML;
    }

    _prepareRoleSwitcher() {
        const roles = this.diceFactory.getRoles({ customizable: true }).filter(role => role.id !== "basic");
        if (!roles.length) return null;
        const loc = (str) => game.i18n.localize(str ?? "");
        const ungrouped = [];
        const groups = new Map();
        for (const role of roles) {
            const entry = { id: role.id, label: loc(role.label) || role.id, selected: role.id === this.currentRole };
            if (!role.group) {
                ungrouped.push(entry);
                continue;
            }
            const key = loc(role.group);
            if (!groups.has(key)) groups.set(key, { label: key, roles: [] });
            groups.get(key).roles.push(entry);
        }
        return {
            basicLabel: loc("DICESONICE.RoleBasic"),
            basicSelected: this.currentRole === "basic",
            ungrouped,
            groups: [...groups.values()],
            disabled: !!this.reset
        };
    }

    _getRoleDieTypes(role) {
        const dieTypes = this.diceFactory.getRole(role)?.dieTypes;
        return Array.isArray(dieTypes) && dieTypes.length ? dieTypes : null;
    }

    _basicGlobal() {
        if (this.isWorldRole) return DsnSettings.APPEARANCE(game.user).global;
        return this._roleBuffers.basic?.global ?? this.currentGlobalAppearance ?? DsnSettings.APPEARANCE(game.user, this.targetActor).global;
    }

    _buildRoleContext(role, buffer) {
        const context = DsnSettings.ROLE_CONTEXT(game.user, this.targetActor);
        if (role === "basic" || !context[role]) return context;
        const scope = this._prepareRoleScope(buffer, { keepHidden: false });
        if (this.isWorldRole) {
            context[role].world = Utils.sanitizeRoleScopes({ [role]: scope })[role] ?? {};
            context[role].player = {};
        } else {
            context[role].player = Utils.sanitizeRoleScopes({ [role]: scope }, game.user)[role] ?? {};
        }
        return context;
    }

    _resolveInheritColors(role, dieType, buffer) {
        const fallback = { labelColor: "#FFFFFF", diceColor: "#000000", outlineColor: "", edgeColor: "" };
        const basicGlobal = this._basicGlobal() ?? {};
        const context = this._buildRoleContext(role, buffer);
        const slot = this.diceFactory.resolveRoleSlot(context, role, dieType) ?? {};
        const out = {};
        for (const field of Object.keys(fallback)) {
            out[field] = slot[field] || basicGlobal[field] || fallback[field];
        }
        return out;
    }

    async _renderAppearanceTab(diceType, appearance, role, systemSettingsHtml, buffer = null) {
        const lists = this.initializationData;
        const isPerDie = diceType !== "global";
        const roleMode = role !== "basic";
        if (roleMode) {
            const filled = {};
            for (const field of ["system", "colorset", "texture", "material", "font", "labelColor", "diceColor", "outlineColor", "edgeColor"])
                filled[field] = appearance[field] ?? "";
            appearance = { ...appearance, ...filled };
        }
        const colors = roleMode ? this._resolveInheritColors(role, diceType, buffer ?? { global: {} }) : appearance;
        const preview = {};
        const inheritCls = {};
        for (const field of ["labelColor", "diceColor", "outlineColor", "edgeColor"]) {
            preview[field] = appearance[field] || colors[field] || "";
            inheritCls[field] = roleMode && !appearance[field] ? "dsn-inherit" : "";
        }
        let html = await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/partial-appearance.hbs", {
            dicetype: diceType,
            appearance: appearance,
            roleMode: roleMode,
            inheritLabel: game.i18n.localize("DICESONICE.Inherit"),
            preview: preview,
            inheritCls: inheritCls,
            systemList: Utils.prepareSystemList(role, appearance.system),
            colorsetList: lists.colorsetList,
            textureList: lists.textureList,
            materialList: lists.materialList,
            fontList: lists.fontList,
            showLibrary: isPerDie && DiceLibrary.getFullDieTypes().includes(diceType),
            libraryDiceGroups: isPerDie ? DiceLibrary.buildLibraryDiceGroups(diceType, appearance, null, { worldOnly: this.isWorldRole }) : [],
            systemSettings: systemSettingsHtml ?? '',
            systemSettingsVisible: systemSettingsHtml ? '' : 'dsn-hidden'
        });
        //We add a "title" attribute to all colorsets to give a way to users to see the colorset id
        //However the FVTT Hdlb helper does not provide such functionnality so we have to do it ourselves
        return this.addTitleToOptions(html, '[data-colorset] option');
    }

    _renderSystemSettings(system, diceType, role) {
        if (!system || !this.diceFactory.systems.has(system)) return '';
        const sys = this.diceFactory.systems.get(system);
        if (!sys.settings.length) return '';
        const dialogContent = sys.getSettingsDialogContent(diceType, role);
        if (dialogContent.content == "") return '';
        return Handlebars.compile(dialogContent.content)(dialogContent.data);
    }

    async _buildAppearanceTabs(appearance, role) {
        const roleMode = role !== "basic";
        const tabsList = Object.keys(appearance).filter(scope => appearance.hasOwnProperty(scope));
        if (!tabsList.includes("global")) tabsList.unshift("global");
        const tabsAppearance = [];
        const navAppearance = {};
        for (const diceType of tabsList) {
            const slot = appearance[diceType] ?? {};
            //sparse slots (package defaults, custom term sync) must show what they inherit or a save writes the select defaults
            if (!roleMode && diceType != "global") {
                const inheritsSystem = !slot.system;
                for (const field of ["system", "colorset", "texture", "material", "font", "labelColor", "diceColor", "outlineColor", "edgeColor"]) {
                    if (!slot[field]) slot[field] = appearance.global[field];
                }
                if (inheritsSystem && !slot.systemSettings && appearance.global.systemSettings)
                    slot.systemSettings = foundry.utils.deepClone(appearance.global.systemSettings);
            }
            if (slot.system && slot.systemSettings && this.diceFactory.systems.has(slot.system))
                this.diceFactory.systems.get(slot.system).updateSettings(diceType, slot.systemSettings, role);
            const systemSettings = this._renderSystemSettings(slot.system, diceType, role);
            tabsAppearance.push(await this._renderAppearanceTab(diceType, slot, role, systemSettings, appearance));
            if (diceType != "global")
                navAppearance[diceType] = diceType.toUpperCase();
        }
        return {
            tabsAppearance: tabsAppearance.join(""),
            navAppearance,
            displayHint: tabsAppearance.length > 1 ? "style='display:none;'" : ''
        };
    }

    _readFormAppearance() {
        const appearance = {};
        this.element.querySelectorAll(".tabAppearance").forEach(element => {
            const tab = element.dataset.tab;
            appearance[tab] = {
                labelColor: element.querySelector("[data-labelColor]")?.value,
                diceColor: element.querySelector("[data-diceColor]")?.value,
                outlineColor: element.querySelector("[data-outlineColor]")?.value,
                edgeColor: element.querySelector("[data-edgeColor]")?.value,
                colorset: element.querySelector("[data-colorset]")?.value,
                texture: element.querySelector("[data-texture]")?.value,
                material: element.querySelector("[data-material]")?.value,
                font: element.querySelector("[data-font]")?.value,
                system: element.querySelector("[data-system]")?.value,
                libraryDieId: element.querySelector("[data-libraryDie]")?.value || ""
            };

            const systemSettingsRaw = {};
            const systemSettingsContainer = element.querySelector("[data-systemsettings]");
            if (systemSettingsContainer) {
                systemSettingsContainer.querySelectorAll("input, select").forEach(field => {
                    let name = field.getAttribute("name");
                    name = name.substring(name.lastIndexOf("[") + 1, name.lastIndexOf("]"));
                    if (field.type === "checkbox") {
                        systemSettingsRaw[name] = field.checked;
                    } else {
                        systemSettingsRaw[name] = field.value;
                    }
                });
            }

            const system = this.diceFactory.systems.get(appearance[tab].system);
            if (system && system.settings.length > 0) {
                const systemSettingsIDs = system.settings.map(setting => setting.id);
                appearance[tab].systemSettings = Object.fromEntries(Object.entries(systemSettingsRaw).filter(([key]) => systemSettingsIDs.includes(key)));
            }
        });
        return appearance;
    }

    _getRoleBuffer(role) {
        if (this._roleBuffers[role]) return this._roleBuffers[role];
        let buffer;
        if (role === "basic") {
            buffer = DsnSettings.APPEARANCE(game.user, this.targetActor);
        } else {
            const stored = this.isWorldRole
                ? (Utils.sanitizeRoleScopes(this.document.getFlag("dice-so-nice", "roleAppearance") ?? {})[role] ?? {})
                : (DsnSettings.ROLE_APPEARANCE(game.user, this.targetActor)[role] ?? {});
            const dieTypes = this._getRoleDieTypes(role);
            buffer = { global: stored.global ?? {} };
            const hidden = {};
            for (const [dieType, slot] of Object.entries(stored)) {
                if (dieType === "global") continue;
                if (dieTypes && !dieTypes.includes(dieType)) hidden[dieType] = slot;
                else buffer[dieType] = slot;
            }
            this._roleHiddenSlots[role] = hidden;
        }
        this._roleBuffers[role] = buffer;
        return buffer;
    }

    async _switchRole(role) {
        if (role === this.currentRole) return;
        if (!this.element.querySelector(".tabAppearance")) return;
        await Promise.all(this.systemSettingsDialogList.map((dialog) => dialog.close()));
        this._roleBuffers[this.currentRole] = this._readFormAppearance();
        this.currentRole = role;
        const resetButton = this.element.querySelector("[data-role-reset]");
        if (resetButton) resetButton.hidden = role === "basic";
        await this._rebuildAppearanceTabs(this._getRoleBuffer(role));
        this.onApply();
    }

    async _rebuildAppearanceTabs(appearance) {
        const built = await this._buildAppearanceTabs(appearance, this.currentRole);
        this.lastActiveAppearanceTab = "global";
        this.currentGlobalAppearance = appearance.global ?? {};

        const content = this.element.querySelector("#dsn-appearance-content");
        content.innerHTML = built.tabsAppearance;

        const nav = this.element.querySelector(".dsn-appearance-tabs");
        nav.querySelectorAll('.item:not([data-tab="global"])').forEach(el => el.remove());
        for (const [diceType, name] of Object.entries(built.navAppearance)) {
            const navSpan = document.createElement("span");
            navSpan.className = "item";
            navSpan.dataset.action = "tab";
            navSpan.dataset.group = "dsn-dice";
            navSpan.dataset.tab = diceType;
            navSpan.innerHTML = `${name} <i class="fa-solid fa-times" data-close-tab></i>`;
            nav.append(navSpan);
        }
        const hint = nav.querySelector(".dsn-appearance-hint");
        if (hint) hint.style.display = Object.keys(built.navAppearance).length ? "none" : "";

        this.changeTab("global", "dsn-dice", { force: true });
        this.toggleCustomization();
        this.filterSystems();
        this.setPosition();
    }

    _refreshInheritPreviews() {
        if (!this.isRoleMode) return;
        const buffer = this._readFormAppearance();
        this.element.querySelectorAll(".tabAppearance").forEach(element => {
            const dieType = element.dataset.tab;
            const colors = this._resolveInheritColors(this.currentRole, dieType, buffer);
            for (const field of ["labelColor", "diceColor", "outlineColor", "edgeColor"]) {
                const text = element.querySelector(`[data-${field}]`);
                const picker = element.querySelector(`[data-${field}Selector]`);
                if (!text || !picker) continue;
                if (text.value) {
                    picker.classList.remove("dsn-inherit");
                } else {
                    picker.classList.add("dsn-inherit");
                    picker.value = colors[field] || "#000000";
                }
            }
        });
    }

    _prepareAppearanceScope(slot, { sparse, actorOwner = false, worldOwner = false }) {
        const out = foundry.utils.deepClone(slot ?? {});
        if (out.libraryDieId) {
            const parsed = DiceConfig._parseLibraryDieValue(out.libraryDieId);
            out.libraryDieId = parsed.libraryDieId || "";
            if (worldOwner) out.libraryDieOwner = DiceLibrary.WORLD_OWNER;
            else if (parsed.libraryDieOwner) out.libraryDieOwner = parsed.libraryDieOwner;
            else if (actorOwner) out.libraryDieOwner = game.user.id;
            else delete out.libraryDieOwner;
        } else {
            delete out.libraryDieId;
            delete out.libraryDieOwner;
        }

        if (out.colorset != "custom") {
            delete out.labelColor;
            delete out.diceColor;
            delete out.outlineColor;
            delete out.edgeColor;
        }

        const system = out.system ? this.diceFactory.systems.get(out.system) : null;
        if (system && system.settings.length > 0) {
            const systemSettingsIDs = system.settings.map(setting => setting.id);
            out.systemSettings = Object.fromEntries(Object.entries(out.systemSettings ?? {}).filter(([key]) => systemSettingsIDs.includes(key)));
        } else {
            delete out.systemSettings;
        }

        if (sparse) {
            for (const [key, value] of Object.entries(out)) {
                if (value === "" || value === null || value === undefined) delete out[key];
                else if (key === "systemSettings" && foundry.utils.isEmpty(value)) delete out[key];
            }
        }
        return out;
    }

    _prepareRoleScope(buffer, { keepHidden = true, role = this.currentRole } = {}) {
        const scope = {};
        for (const [dieType, slot] of Object.entries(buffer ?? {})) {
            const prepared = this._prepareAppearanceScope(slot, { sparse: true, actorOwner: this.isActor, worldOwner: this.isWorldRole });
            if (!foundry.utils.isEmpty(prepared)) scope[dieType] = prepared;
        }
        if (keepHidden) {
            for (const [dieType, slot] of Object.entries(this._roleHiddenSlots[role] ?? {})) {
                if (!scope[dieType]) scope[dieType] = foundry.utils.deepClone(slot);
            }
        }
        return scope;
    }

    //read-modify-write of the target's roleAppearance flag
    async _writeRoleAppearance() {
        const visited = Object.keys(this._roleBuffers).filter(role => role !== "basic");
        if (!visited.length) return new Set();
        const stored = foundry.utils.deepClone(this.document.getFlag("dice-so-nice", "roleAppearance") ?? {});
        const systemsInUse = new Set();
        for (const role of visited) {
            const scope = this._prepareRoleScope(this._roleBuffers[role], { role });
            if (foundry.utils.isEmpty(scope)) delete stored[role];
            else stored[role] = scope;
            for (const slot of Object.values(scope)) {
                if (slot.system && this.diceFactory.systems.has(slot.system)) systemsInUse.add(slot.system);
            }
        }
        await this.document.unsetFlag("dice-so-nice", "roleAppearance");
        if (!foundry.utils.isEmpty(stored)) await this.document.setFlag("dice-so-nice", "roleAppearance", stored);
        return systemsInUse;
    }

    async _resetCurrentRole() {
        const role = this.currentRole;
        this._roleBuffers[role] = { global: {} };
        this._roleHiddenSlots[role] = {};
        await Promise.all(this.systemSettingsDialogList.map((dialog) => dialog.close()));
        await this._rebuildAppearanceTabs(this._roleBuffers[role]);
        this.onApply();
    }

    _onRender(context, options) {
        this.changeTab(this.tabGroups["dsn-dice"], "dsn-dice", { force: true });

        if (!this.noScene) {
            this.element.querySelector("#dice-configuration-canvas-container").append(this.canvas);
        }

        if (this.isUser) {
            this.toggleHideAfterRoll();
            this.toggleAutoScale();
        }
        this.toggleCustomization();
        this.filterSystems();

        this._initSlimSelects();

        if (!this.reset) {
            this.element.addEventListener("change", (ev) => {
                const target = ev.target;
                if (target.matches("[data-role-switcher]")) {
                    this._switchRole(target.value);
                    return;
                } else if (target.matches("[data-showExtraDice]")) {
                    this.onApply(ev);
                } else if (target.matches("[data-hideAfterRoll]")) {
                    this.toggleHideAfterRoll(ev);
                } else if (target.matches("[data-sounds]")) {
                    this.toggleSounds(ev);
                } else if (target.matches("[data-autoscale]")) {
                    this.toggleAutoScale(ev);
                } else if (target.matches("[data-colorset]")) {
                    this.toggleCustomColors(target.dataset.dicetype);
                } else if (target.matches("[data-libraryDie]")) {
                    this.toggleCustomization(target.dataset.dicetype);
                } else if (target.matches("[data-system]")) {
                    this.toggleCustomization(target.dataset.dicetype);
                    const systemSettingsContainer = target.closest(".tabAppearance").querySelector("[data-systemsettings-hidden]");
                    systemSettingsContainer.innerHTML = "";
                    const optionsBtn = target.nextElementSibling;
                    const html = this._renderSystemSettings(target.value, target.dataset.dicetype, this.currentRole);
                    if (html) {
                        if (optionsBtn) optionsBtn.classList.remove("dsn-hidden");
                        systemSettingsContainer.insertAdjacentHTML("beforeend", html);
                    } else {
                        if (optionsBtn) optionsBtn.classList.add("dsn-hidden");
                    }
                } else if (target.matches("[data-sfx-dicetype]")) {
                    let dicetype = target.value;
                    let selectEl = target.closest(".sfx-line").querySelector("[data-sfx-result]");
                    if (!selectEl) return;
                    selectEl.setAttribute("data-sfx-result-dicetype", dicetype);
                    let instance = this.slimSelectInstances.get(selectEl);
                    if (instance) {
                        instance.setData(dicetype !== "" ? this._buildSlimSelectOptions(dicetype) : []);
                    }
                    this.setPosition();
                } else if (target.matches("[data-sfx-specialeffect]")) {
                    this.sfxDialogList.forEach((dialog) => { dialog.close(); });
                    this.sfxDialogList = [];
                    let sfxLine = target.closest(".sfx-line");
                    let ID = Array.from(sfxLine.parentElement.querySelectorAll(".sfx-line")).indexOf(sfxLine);
                    let sfxClass = DiceSFXManager.SFX_MODE_CLASS[target.value];
                    let dialogContent = sfxClass.getDialogContent({}, ID);
                    let hdbsTemplate = Handlebars.compile(dialogContent.content);
                    sfxLine.querySelector(".sfx-hidden [data-sfx-hidden-options]").innerHTML = hdbsTemplate(dialogContent.data);
                } else if (target.matches("[data-imageQuality]")) {
                    let quality = {
                        bumpMapping: true, shadowQuality: "high", glow: true,
                        antialiasing: game.canvas.app.renderer.context.webGLVersion === 2 ? "msaa" : "smaa",
                        useHighDPI: true, persistentDiceOutlines: true, advancedGlass: true
                    };
                    switch (target.value) {
                        case "low":
                            quality.bumpMapping = false; quality.shadowQuality = "low"; quality.glow = false;
                            quality.antialiasing = "none"; quality.useHighDPI = false;
                            quality.persistentDiceOutlines = false; quality.advancedGlass = false;
                            break;
                        case "medium":
                            quality.bumpMapping = true; quality.shadowQuality = "medium"; quality.glow = false;
                            quality.antialiasing = "none"; quality.useHighDPI = false;
                            quality.persistentDiceOutlines = false; quality.advancedGlass = false;
                            break;
                        case "high":
                            quality.bumpMapping = true; quality.shadowQuality = "high"; quality.glow = true;
                            quality.antialiasing = game.canvas.app.renderer.context.webGLVersion === 2 ? "msaa" : "smaa";
                            quality.useHighDPI = true; quality.persistentDiceOutlines = true; quality.advancedGlass = true;
                            break;
                    }
                    this.element.querySelector("[data-bumpMapping]").checked = quality.bumpMapping;
                    this.element.querySelector("[data-shadowQuality]").value = quality.shadowQuality;
                    this.element.querySelector("[data-glow]").checked = quality.glow;
                    this.element.querySelector("[data-antialiasing]").value = quality.antialiasing;
                    this.element.querySelector("[data-useHighDPI]").checked = quality.useHighDPI;
                    this.element.querySelector("[data-persistentDiceOutlines]").checked = quality.persistentDiceOutlines;
                    this.element.querySelector("[data-advancedGlass]").checked = quality.advancedGlass;
                } else if (target.matches("[data-bumpMapping],[data-shadowQuality],[data-glow],[data-antialiasing],[data-useHighDPI],[data-persistentDiceOutlines],[data-advancedGlass]")) {
                    this.element.querySelector("[data-imageQuality]").value = "custom";
                }

                if (target.matches("input,select") && target.closest('[data-tab="general"]')) {
                    if (target.matches("[data-labelColor],[data-diceColor],[data-outlineColor],[data-edgeColor],[data-colorset],[data-system],[data-libraryDie]"))
                        this._refreshInheritPreviews();
                    this.onApply(ev);
                }
            });

            this.element.addEventListener("input", (ev) => {
                const target = ev.target;
                if (target.matches("[data-sfx-formula]")) {
                    const { valid, error, warning } = SFXFormulaMatcher.validate(target.value);
                    const errorIcon = target.parentElement.querySelector("[data-sfx-formula-error]");
                    const hasText = !!target.value.trim();
                    target.classList.toggle("sfx-formula-invalid", hasText && !valid);
                    target.classList.toggle("sfx-formula-warning", hasText && valid && !!warning);
                    if (errorIcon) {
                        const message = hasText ? (valid ? warning : error) : null;
                        errorIcon.classList.toggle("visible", !!message);
                        errorIcon.classList.toggle("warning", !!message && valid);
                        errorIcon.title = message || '';
                    }
                }
            });
            this.element.querySelectorAll("[data-sfx-formula]").forEach(field => field.dispatchEvent(new Event("input", { bubbles: true })));

            this.element.addEventListener("click", (ev) => {
                const target = ev.target;
                let actionTarget;

                if (target.closest("[data-role-reset]")) {
                    this._resetCurrentRole();
                } else if (target.closest("[data-reset]")) {
                    this.onReset(ev);
                } else if (target.closest("[data-cancel]")) {
                    this.close();
                } else if (target.closest("[data-close-tab]")) {
                    let tabEl = target.closest("[data-close-tab]").parentElement;
                    this.closeAppearanceTab(tabEl.dataset.tab);
                } else if ((actionTarget = target.closest("[data-library-manage]"))) {
                    ev.preventDefault();
                    const libraryOptions = { diceType: actionTarget.dataset.dicetype, diceConfig: this };
                    if (this.isWorldRole) libraryOptions.worldOnly = true;
                    new DiceLibraryDialog(libraryOptions).render(true);
                } else if (target.closest("[data-action=loadRoleSave]")) {
                    this._onLoadRoleSave();
                } else if (target.closest("[data-action=test]")) {
                    if (this.noScene) return;
                    let config = this.getShowcaseAppearance();
                    let denominationList = [];
                    const showcaseTypes = new Set(this.showcaseView.diceList.map(el => el.userData));
                    const compoundSubTypes = new Set();
                    for (const [, places] of Object.entries(COMPOUND_DICE)) {
                        if (showcaseTypes.has(places[0].type)) {
                            for (let p = 1; p < places.length; p++) {
                                if (!showcaseTypes.has(places[p].type) || !COMPOUND_DICE[parseInt(places[p].type.slice(1))])
                                    compoundSubTypes.add(places[p].type);
                            }
                        }
                    }
                    this.showcaseView.diceList.forEach((el) => {
                        if (!compoundSubTypes.has(el.userData))
                            denominationList.push(el.userData);
                    });
                    new Roll(denominationList.join("+")).evaluate().then((roll) => {
                        if (this.isRoleMode) {
                            for (const term of roll.dice) term.options.dsnRole = this.currentRole;
                        }
                        let data = new DiceNotation(roll);
                        let specialEffects = this.getShowcaseSFX();
                        let customization = foundry.utils.mergeObject({ appearance: config.appearance }, { specialEffects: specialEffects }, { applyOperators: true });
                        customization.diceLibrary = config.diceLibrary;
                        customization.roleContext = config.roleContext;
                        game.dice3d.queue.enqueue(data, customization);
                    });
                } else if (target.closest("[data-sfx-create]")) {
                    let ID = this.element.querySelectorAll(".sfx-line").length;
                    let firstSFX = Object.keys(DiceSFXManager.SFX_MODE_LIST)[0];
                    let sfxClass = DiceSFXManager.SFX_MODE_CLASS[firstSFX];
                    let dialogContent = sfxClass.getDialogContent({}, ID);
                    let hdbsTemplate = Handlebars.compile(dialogContent.content);
                    foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/partial-sfx.hbs", {
                        id: ID, diceType: "", onResult: [], specialEffect: "",
                        isAdvanced: false,
                        specialEffectsMode: DiceSFXManager.SFX_MODE_LIST,
                        triggerTypeList: this.triggerTypeList, possibleResultList: [],
                        options: hdbsTemplate(dialogContent.data)
                    }).then((html) => {
                        this.element.querySelector("#sfxs-list").insertAdjacentHTML("beforeend", html);
                        this._initSlimSelects();
                        this.setPosition();
                    });
                } else if (target.closest("[data-sfx-mode-toggle]")) {
                    let sfxLine = target.closest(".sfx-line");
                    let currentMode = sfxLine.dataset.sfxMode || 'basic';
                    if (currentMode === 'basic') {
                        this._sfxToggleToAdvanced(sfxLine);
                    } else {
                        this._sfxToggleToBasic(sfxLine);
                    }
                } else if (target.closest("[data-sfx-delete]")) {
                    let sfxLine = target.closest(".sfx-line");
                    let selectEl = sfxLine.querySelector("[data-sfx-result]");
                    if (selectEl && this.slimSelectInstances.has(selectEl)) {
                        this.slimSelectInstances.get(selectEl).destroy();
                        this.slimSelectInstances.delete(selectEl);
                    }
                    sfxLine.remove();
                    this.element.querySelectorAll(".sfx-line").forEach((line, index) => {
                        line.querySelectorAll("input, select").forEach(input => {
                            let name = input.getAttribute("name");
                            input.setAttribute("name", name.replace(/(\w+\[)(\d+)(\]\[\w+\])/, "$1" + index + "$3"));
                        });
                    });
                    this.setPosition();
                } else if (target.closest("[data-sfx-options]")) {
                    let sfxLine = target.closest(".sfx-line");
                    let sfxLineOptions = sfxLine.querySelector("[data-sfx-hidden-options]");
                    if (!sfxLineOptions) return;

                    foundry.applications.api.DialogV2.wait({
                        classes: ["dice-so-nice"],
                        window: { title: "DICESONICE.Options", contentClasses: ["standard-form"] },
                        position: { width: 680 },
                        content: `<form class="standard-form" autocomplete="off" onsubmit="event.preventDefault();"></form>`,
                        buttons: [{ action: "ok", icon: "fa-solid fa-check-circle", label: "OK", default: true }],
                        render: (event, dialog) => {
                            dialog.element.querySelector(".dialog-content").append(sfxLineOptions);
                            this.activateDialogFilePicker(sfxLineOptions);
                            this.sfxDialogList.push(dialog);
                        },
                        close: (event, dialog) => {
                            sfxLine.querySelector(".sfx-hidden").append(sfxLineOptions);
                            this.sfxDialogList = this.sfxDialogList.filter(d => dialog.appId != d.appId);
                        }
                    });
                } else if (target.closest("[data-system-options]")) {
                    const tabAppearance = target.closest(".tabAppearance");
                    const systemSettingsContainer = tabAppearance.querySelector("[data-systemSettings-hidden]");
                    const systemSettingsElement = systemSettingsContainer.querySelector("[data-systemSettings]");
                    const systemSelected = tabAppearance.querySelector("[data-system]").value;
                    const systemName = this.diceFactory.systems.get(systemSelected).name;

                    foundry.applications.api.DialogV2.wait({
                        window: { title: `${game.i18n.localize("DICESONICE.SystemOptions")} - ${this.lastActiveAppearanceTab.charAt(0).toUpperCase()}${this.lastActiveAppearanceTab.slice(1)} - ${systemName}` },
                        position: { width: 550 },
                        content: `<form autocomplete="off" onsubmit="event.preventDefault();"></form>`,
                        buttons: [{ action: 'ok', icon: 'fa-solid fa-check', label: 'OK', default: true }],
                        render: (event, dialog) => {
                            this.systemSettingsDialogList.push(dialog);
                            dialog.element.querySelector("form").append(systemSettingsElement);
                            this.activateDialogListeners(dialog.element);
                        },
                        close: (event, dialog) => {
                            systemSettingsContainer.append(systemSettingsElement);
                            this.systemSettingsDialogList = this.systemSettingsDialogList.filter(d => dialog.appId != d.appId);
                            this.onApply();
                        }
                    });
                } else if (target.closest("[data-saveas]")) {
                    this._onSaveAs();
                } else if (target.closest("[data-load]")) {
                    this._onLoad();
                } else if (target.closest("[data-import]")) {
                    this._onImport();
                } else if (target.closest("[data-export]")) {
                    const filename = `fvtt-dicesonice-${Date.now()}.json`;
                    this.actionExportToJSON().then((json) => {
                        foundry.utils.saveDataToFile(json, "text/json", filename);
                    });
                } else if (target.closest("[data-exportSFX]")) {
                    const filename = `fvtt-dicesonice-SFX-${Date.now()}.json`;
                    this.actionExportSFXToJSON().then((json) => {
                        foundry.utils.saveDataToFile(json, "text/json", filename);
                    });
                } else if (target.closest("[data-exportLibrary]")) {
                    const filename = `fvtt-dicesonice-Library-${Date.now()}.json`;
                    const json = this.actionExportLibraryToJSON();
                    foundry.utils.saveDataToFile(json, "text/json", filename);
                } else if (target.closest("[data-gm-push]")) {
                    this._onGMPush();
                } else if (target.closest("#dice-configuration-canvas") && !this.noScene) {
                    this._onCanvasClick(ev);
                }
            });
        }

        this.activateDialogListeners(this.element);
    }

    activateDialogFilePicker(el) {
        el.addEventListener("click", (event) => {
            const btn = event.target.closest("button.file-picker");
            if (!btn) return;
            const filePicker = foundry.applications.apps.FilePicker.fromButton(btn);
            filePicker.render(true);
        });
    }

    activateDialogListeners(el) {
        el.addEventListener("change", (event) => {
            const target = event.target;
            if (target.matches("input[type=range]")) {
                target.nextElementSibling.textContent = target.value;
            } else if (target.matches("span.range-value")) {
                target.previousElementSibling.value = target.textContent;
            } else if (target.matches("input[type=color]")) {
                target.previousElementSibling.value = target.value;
                target.classList.remove("dsn-inherit");
                this._refreshInheritPreviews();
            } else if (target.matches("[data-colorpicker]")) {
                target.nextElementSibling.value = target.value;
            }
        });
    }

    async actionSaveAs(name) {
        await this.submit({
            preventClose: true,
            preventRender: true
        });

        Utils.actionSaveAs(name);
    }

    async actionDeleteSave(name) {
        await Utils.actionDeleteSave(name);
    }

    async actionLoadSave(name) {
        await Utils.actionLoadSave(name);
    }

    //library die refs pointing at another owner should not ref between users
    static _stripForeignLibraryRefs(scope) {
        for (const key in scope) {
            if (!scope.hasOwnProperty(key)) continue;
            if (scope[key]?.libraryDieOwner) {
                delete scope[key].libraryDieId;
                delete scope[key].libraryDieOwner;
            }
        }
        return scope;
    }

    static _stripForeignLibraryRefsInRoles(roleScopes) {
        for (const role in roleScopes) {
            if (!roleScopes.hasOwnProperty(role) || !roleScopes[role]) continue;
            DiceConfig._stripForeignLibraryRefs(roleScopes[role]);
        }
        return roleScopes;
    }

    //other users can't find a library die that has no owner, so set the owner
    static _pinLibraryRefs(scope, ownerId) {
        for (const key in scope) {
            if (!scope.hasOwnProperty(key)) continue;
            if (scope[key]?.libraryDieId && !scope[key].libraryDieOwner)
                scope[key].libraryDieOwner = ownerId;
        }
        return scope;
    }

    async actionExportToJSON() {

        //save current settings first
        await this.submit({
            preventClose: true,
            preventRender: true
        });

        //strip cross-user library die refs (not portable)
        const appearance = DiceConfig._stripForeignLibraryRefs(foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "appearance") || {}));
        const roleAppearance = DiceConfig._stripForeignLibraryRefsInRoles(foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "roleAppearance") || {}));

        const saves = foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "saves") || {});
        for (const saveName in saves) {
            if (!saves.hasOwnProperty(saveName)) continue;
            if (saves[saveName]?.appearance) DiceConfig._stripForeignLibraryRefs(saves[saveName].appearance);
            if (saves[saveName]?.roleAppearance) DiceConfig._stripForeignLibraryRefsInRoles(saves[saveName].roleAppearance);
        }

        let data = {
            appearance: appearance,
            roleAppearance: roleAppearance,
            sfxList: game.user.getFlag("dice-so-nice", "sfxList"),
            settings: game.user.getFlag("dice-so-nice", "settings"),
            saves: saves,
            diceLibrary: game.user.getFlag("dice-so-nice", "diceLibrary")
        };

        return JSON.stringify(data, null, 2);
    }

    async actionExportSFXToJSON() {

        //save current settings first
        await this.submit({
            preventClose: true,
            preventRender: true
        });
        let data = {
            sfxList: game.user.getFlag("dice-so-nice", "sfxList")
        };

        return JSON.stringify(data, null, 2);
    }

    actionExportLibraryToJSON() {
        return game.dice3d.diceLibrary.exportAll();
    }

    async actionImportFromJSON(json) {
        let data = JSON.parse(json);

        //library-only export
        if (data.dsnLibraryExport && Array.isArray(data.dice)) {
            await this._importLibraryDice(data.dice);
            return;
        }

        if (data.appearance) {
            await game.user.unsetFlag("dice-so-nice", "appearance");
            await game.user.setFlag("dice-so-nice", "appearance", data.appearance);
        }
        if (data.roleAppearance && typeof data.roleAppearance === "object") {
            await game.user.unsetFlag("dice-so-nice", "roleAppearance");
            if (!foundry.utils.isEmpty(data.roleAppearance))
                await game.user.setFlag("dice-so-nice", "roleAppearance", data.roleAppearance);
        }
        if (data.sfxList) {
            await game.user.unsetFlag("dice-so-nice", "sfxList");
            await game.user.setFlag("dice-so-nice", "sfxList", data.sfxList);
        }
        if (data.settings) {
            await game.user.unsetFlag("dice-so-nice", "settings");
            await game.user.setFlag("dice-so-nice", "settings", data.settings);
        }
        if (data.saves) {
            await game.user.unsetFlag("dice-so-nice", "saves");
            await game.user.setFlag("dice-so-nice", "saves", data.saves);
        }
        if (data.diceLibrary) {
            await this._importLibraryDice(data.diceLibrary);
        }
        await DsnSettings.markSaved(game.user, { appearance: !!data.appearance, sfx: !!data.sfxList });
        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id });
    }

    async actionGMPushConfig(parts) {
        if (!game.user.isGM) return;

        //collect the GM's effective values once, package defaults included - offline users get written the same payload
        const payload = {};
        if (parts.appearance) {
            //library dice stay in their owner's library, players reference them from there
            payload.appearance = DiceConfig._pinLibraryRefs(DsnSettings.APPEARANCE(game.user), game.user.id);
            const roleAppearance = DsnSettings.ROLE_APPEARANCE(game.user);
            for (const role of Object.values(roleAppearance)) DiceConfig._pinLibraryRefs(role, game.user.id);
            payload.roleAppearance = roleAppearance;
        }
        if (parts.sfxList) {
            payload.sfxList = DsnSettings.SFX_LIST(game.user);
        }
        if (parts.settings) {
            payload.settings = foundry.utils.deepClone(game.user.getFlag("dice-so-nice", "settings") || {});
        }

        //write directly to each non-GM user's flags - works for offline users too, since GMs have permission
        const targets = game.users.filter(u => !u.isGM && u.id !== game.user.id);
        const pushedIds = [];
        for (const user of targets) {
            try {
                for (const key of Object.keys(payload)) {
                    await user.unsetFlag("dice-so-nice", key);
                    await user.setFlag("dice-so-nice", key, payload[key]);
                }
                await DsnSettings.markSaved(user, { appearance: !!parts.appearance, sfx: !!parts.sfxList });
                pushedIds.push(user.id);
            } catch (err) {
                console.error(`[Dice So Nice] Failed to push config to ${user.name}:`, err);
            }
        }

        //notify connected targets so they reload their in-memory state without a page reload
        game.socket.emit("module.dice-so-nice", {
            type: "gmPush",
            user: game.user.id,
            targets: pushedIds
        });

        ui.notifications.info(game.i18n.format("DICESONICE.GMPushSuccess", { count: pushedIds.length }));
    }

    async _importLibraryDice(diceArray) {
        const { imported, skipped } = await game.dice3d.diceLibrary.importArray(diceArray);
        ui.notifications.info(game.i18n.format("DICESONICE.ImportLibrarySuccess", { count: imported, skipped: skipped }));
    }

    activateAppearanceTab(diceType) {
        this.changeTab(diceType, "dsn-dice");
    }

    closeAppearanceTab(diceType) {
        if (diceType == "global")
            return;

        if (this.tabGroups["dsn-dice"] == diceType)
            this.changeTab("global", "dsn-dice");

        this.element.querySelector(`.tabAppearance[data-tab="${diceType}"]`)?.remove();
        this.element.querySelector(`.dsn-appearance-tabs [data-tab="${diceType}"]`)?.remove();

        this.onApply();
    }

    changeTab(tab, group, { force=false } = {}) {
        super.changeTab(tab, group, { force });
        if (group == "dsn-dice") {
            if (this.lastActiveAppearanceTab != "global") {
                let appearanceArray = [];
                let systemSettingsElement = null;
                const tabs = this.element.querySelectorAll(`.tabAppearance[data-tab="global"],.tabAppearance[data-tab="${this.lastActiveAppearanceTab}"]`);
                tabs.forEach((element, index) => {
                    let obj = {
                        labelColor: element.querySelector("[data-labelColor]")?.value,
                        diceColor: element.querySelector("[data-diceColor]")?.value,
                        outlineColor: element.querySelector("[data-outlineColor]")?.value,
                        edgeColor: element.querySelector("[data-edgeColor]")?.value,
                        colorset: element.querySelector("[data-colorset]")?.value,
                        texture: element.querySelector("[data-texture]")?.value,
                        material: element.querySelector("[data-material]")?.value,
                        font: element.querySelector("[data-font]")?.value,
                        system: element.querySelector("[data-system]")?.value,
                        libraryDie: element.querySelector("[data-libraryDie]")?.value || ""
                    };
                    if (index == 1)
                        systemSettingsElement = element.querySelector("[data-systemSettings]");
                    if (obj.system == null) {
                        obj.system = this.currentGlobalAppearance.system;
                    }
                    appearanceArray.push(obj);
                });
                if (appearanceArray.length > 1) {
                    let hasDiff = false;
                    if (this.isRoleMode)
                        hasDiff = Object.values(appearanceArray[1]).some(value => value);
                    else
                        hasDiff = !foundry.utils.isEmpty(foundry.utils.diffObject(appearanceArray[0], appearanceArray[1]));

                    if (!hasDiff && systemSettingsElement && this.diceFactory.systems.has(appearanceArray[1].system)) {
                        for (let setting of this.diceFactory.systems.get(appearanceArray[1].system).settings) {
                            let settingEl = systemSettingsElement.querySelector(`[name="systemSettings[${appearanceArray[1].system}][${setting.id}]"]`);
                            let value;
                            if (setting.type == DiceSystem.SETTING_TYPE.BOOLEAN) {
                                value = settingEl?.checked;
                            } else {
                                value = settingEl?.value;
                            }
                            if (value != setting.defaultValue) {
                                hasDiff = true;
                                break;
                            }
                        }
                    }

                    if (!hasDiff) {
                        this.closeAppearanceTab(this.lastActiveAppearanceTab)
                    }
                }
            }
            this.lastActiveAppearanceTab = tab;
        }
    }

    toggleHideAfterRoll() {
        let hideAfterRoll = this.element.querySelector("[data-hideAfterRoll]").checked;
        this.element.querySelector("[data-timeBeforeHide]").disabled = !hideAfterRoll;
        this.element.querySelector("[data-hideFX]").disabled = !hideAfterRoll;
    }

    toggleSounds() {
        let sounds = this.element.querySelector("[data-sounds]").checked;
        this.element.querySelector("[data-soundsSurface]").disabled = !sounds;
        this.element.querySelector("[data-soundsVolume]").disabled = !sounds;
    }

    toggleAutoScale() {
        let autoscale = this.element.querySelector("[data-autoscale]").checked;
        this.element.querySelector("[data-scale]").disabled = autoscale;
    }

    toggleCustomColors(dicetype) {
        let selector = ".tabAppearance";
        if (dicetype) selector += `[data-tab="${dicetype}"]`;
        this.element.querySelectorAll(selector).forEach(element => {
            const libraryDieVal = element.querySelector("[data-libraryDie]")?.value;
            if (libraryDieVal) return;

            let colorsetEl = element.querySelector("[data-colorset]");
            let disabled = colorsetEl.value !== "custom" || colorsetEl.disabled;
            for (const attr of ["data-labelColor", "data-diceColor", "data-outlineColor", "data-edgeColor",
                "data-labelColorSelector", "data-diceColorSelector", "data-outlineColorSelector", "data-edgeColorSelector"]) {
                const el = element.querySelector(`[${attr}]`);
                if (el) el.disabled = disabled;
            }
        });
    }

    toggleCustomization(diceType = null) {
        let selector = ".tabAppearance";
        if (diceType) selector += `[data-tab="${diceType}"]`;

        this.element.querySelectorAll(selector).forEach(element => {
            let dt = element.dataset.tab;
            if (dt != "global") {
                const libraryDieVal = element.querySelector("[data-libraryDie]")?.value;
                const allAppearanceControls = element.querySelectorAll("[data-colorset],[data-texture],[data-material],[data-font],[data-labelColor],[data-diceColor],[data-outlineColor],[data-edgeColor],[data-labelColorSelector],[data-diceColorSelector],[data-outlineColorSelector],[data-edgeColorSelector]");
                if (libraryDieVal) {
                    allAppearanceControls.forEach(el => el.disabled = true);
                    return;
                }

                let system = element.querySelector("[data-system]")?.value;
                let customizationElements = element.querySelectorAll("[data-colorset],[data-texture],[data-material],[data-font]");
                if (system && system != "standard" && this.diceFactory.systems.has(system)) {
                    let diceobj = this.diceFactory.systems.get(system).dice.get(dt);
                    if (diceobj) {
                        let colorsetData = {};
                        if (diceobj.colorset) {
                            colorsetData = DiceColors.getColorSet(diceobj.colorset);
                        }
                        customizationElements.forEach(el => {
                            let colorsetForce = false;
                            if (el.matches("[data-colorset]") && !foundry.utils.isEmpty(colorsetData))
                                colorsetForce = true;
                            else if (el.matches("[data-texture]") && !foundry.utils.isEmpty(colorsetData) && colorsetData.texture != "custom")
                                colorsetForce = true;
                            else if (el.matches("[data-material]") && !foundry.utils.isEmpty(colorsetData) && colorsetData.material != "custom")
                                colorsetForce = true;
                            else if (el.matches("[data-font]") && ((!foundry.utils.isEmpty(colorsetData) && colorsetData.font != "custom") || diceobj.font))
                                colorsetForce = true;
                            el.disabled = diceobj.modelFile || colorsetForce;
                        });
                    }
                } else {
                    customizationElements.forEach(el => el.disabled = false);
                }
            }
        });
        this.toggleCustomColors(diceType);
    }

    filterSystems(diceType = null) {
        let selector = ".tabAppearance";
        if (diceType) selector += `[data-tab="${diceType}"]`;
        this.element.querySelectorAll(`${selector} [data-system]`).forEach(element => {
            let dt = element.dataset.dicetype;
            if (dt != "global") {
                element.querySelectorAll("option").forEach(opt => {
                    if (!opt.value || !this.diceFactory.systems.has(opt.value)) return;
                    let model = this.diceFactory.systems.get("standard").dice.get(dt);
                    if (!this.diceFactory.systems.get(opt.value).dice.has(dt) || !this.diceFactory.systems.get(opt.value).getDiceByShapeAndValues(model.shape, model.values))
                        opt.disabled = true;
                });
            }
        });
    }

    //"userId:dieId" => {libraryDieId, libraryDieOwner}
    static _parseLibraryDieValue(val) {
        if (!val) return {};
        if (val.includes(":")) {
            const [owner, id] = val.split(":", 2);
            return { libraryDieId: id, libraryDieOwner: owner };
        }
        return { libraryDieId: val };
    }

    getShowcaseAppearance() {
        let config;
        if (this.isActor || this.isWorldRole) {
            let userConfig = DsnSettings.ALL_CONFIG();
            config = foundry.utils.mergeObject(userConfig, {
                autoscale: false,
                scale: 60,
                appearance: {}
            });
        } else {
            const q = (sel) => this.element.querySelector(sel);
            config = {
                autoscale: false,
                scale: 60,
                shadowQuality: q("[data-shadowQuality]").value,
                imageQuality: q("[data-imageQuality]").value,
                antialiasing: q("[data-antialiasing]").value,
                bumpMapping: q("[data-bumpMapping]").checked,
                glow: q("[data-glow]").checked,
                sounds: q("[data-sounds]").checked,
                throwingForce: q("[data-throwingForce]").value,
                useHighDPI: q("[data-useHighDPI]").checked,
                advancedGlass: q("[data-advancedGlass]").checked,
                showExtraDice: q("[data-showExtraDice]").checked,
                muteSoundSecretRolls: q("[data-muteSoundSecretRolls]").checked,
                enableFlavorColorset: q("[data-enableFlavorColorset]").checked,
                immersiveDarkness: q("[data-immersiveDarkness]").checked,
                appearance: {}
            };
        }

        const formAppearance = this._readFormAppearance();
        const parseLibrary = (scope) => {
            const out = {};
            for (const [tab, slot] of Object.entries(scope)) {
                const { libraryDieId, ...rest } = slot;
                out[tab] = { ...rest, ...DiceConfig._parseLibraryDieValue(libraryDieId) };
            }
            return out;
        };
        config.role = this.currentRole;
        config.dieTypes = this._getRoleDieTypes(this.currentRole);
        if (this.isRoleMode) {
            config.appearance = parseLibrary(this._getRoleBuffer("basic"));
            config.roleAppearance = formAppearance;
            config.roleContext = this._buildRoleContext(this.currentRole, formAppearance);
        } else {
            config.appearance = parseLibrary(formAppearance);
            config.roleContext = DsnSettings.ROLE_CONTEXT(game.user, this.targetActor);
        }

        config.diceLibrary = DiceLibrary.getLibraryForUser(game.user);
        this.currentGlobalAppearance = formAppearance.global;
        return config;
    }

    refreshLibraryDropdown(dieType = null) {
        const selector = dieType
            ? `.tabAppearance[data-tab="${dieType}"]`
            : '.tabAppearance:not([data-tab="global"])';

        this.element.querySelectorAll(selector).forEach(element => {
            const tab = element.dataset.tab;
            const select = element.querySelector("[data-libraryDie]");
            if (!select) return;
            const currentVal = select.value || "";
            const groups = DiceLibrary.buildLibraryDiceGroups(tab, null, currentVal, { worldOnly: this.isWorldRole });
            let html = `<option value="">${game.i18n.localize("DICESONICE.None")}</option>`;
            for (const group of groups) {
                html += `<optgroup label="${group.label}">`;
                for (const d of group.dice) {
                    const sel = d.value === currentVal ? " selected" : "";
                    html += `<option value="${d.value}"${sel}>${d.name}</option>`;
                }
                html += `</optgroup>`;
            }
            select.innerHTML = html;
        });
    }

    //Not used because SFX aren't initialized. Keeping it here for later use.
    getShowcaseSFX() {
        let sfxList = [];

        this.element.querySelectorAll(".sfx-line").forEach(element => {
            const resultSelect = element.querySelector("[data-sfx-result]");
            let sfx = {
                diceType: element.querySelector("[data-sfx-dicetype]").value,
                onResult: resultSelect ? Array.from(resultSelect.selectedOptions).map(o => o.value) : [],
                specialEffect: element.querySelector("[data-sfx-specialeffect]").value,
                options: {}
            };
            element.querySelectorAll("[data-sfx-hidden-options] input, [data-sfx-hidden-options] select").forEach(el => {
                let name = el.getAttribute("name").match(/.*\[(.*)\]$/)[1];
                if (el.type === "checkbox")
                    sfx.options[name] = el.checked;
                else
                    sfx.options[name] = el.value;
            });
            if (sfx.diceType && sfx.onResult && sfx.specialEffect)
                sfxList.push(sfx);
        });
        return sfxList;
    }

    onApply(event = null) {
        if (event)
            event.preventDefault();
        if (this.noScene) return;

        const container = this.element.querySelector("#dice-configuration-canvas-container");
        container?.classList.add("loading");

        setTimeout(async () => {
            let config = this.getShowcaseAppearance();
            this.diceFactory.disposeCachedMaterials("showcase");

            if (this.isUser) {
                this.diceFactory.setQualitySettings(config);
                this.diceScene.updateRenderSettings();
            }
            await this.diceFactory.preloadPresets(true, null, config.appearance);
            if (config.roleAppearance)
                await this.diceFactory.preloadPresets(true, null, this._prepareRoleScope(config.roleAppearance, { keepHidden: false }));

            this.showcaseView.showExtraDice = config.showExtraDice;
            await this.showcaseView.showcase(config);
            container?.classList.remove("loading");
        }, 100);
    }

    async _onSaveAs() {
        let saves = game.user.getFlag("dice-so-nice", "saves");
        let saveList = new Map();
        if (saves) saveList = new Map(Object.entries(saves));

        foundry.applications.api.DialogV2.wait({
            classes: ["dice-so-nice"],
            window: { title: "DICESONICE.SaveAs" },
            position: { width: 550 },
            content: await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dialog-saveas.hbs", { saveList: saveList.keys() }),
            buttons: [{ action: "cancel", icon: "fa-solid fa-ban", label: "Cancel", default: true }],
            render: (event, dialog) => {
                const el = dialog.element;
                if (saveList.size) {
                    el.addEventListener("click", (ev) => {
                        if (ev.target.closest("[data-overwrite]")) {
                            let name = el.querySelector("[data-save-list]").value;
                            this.actionSaveAs(name);
                            dialog.close();
                        } else if (ev.target.closest("[data-delete]")) {
                            let name = el.querySelector("[data-save-list]").value;
                            this.actionDeleteSave(name).then(() => {
                                saveList.delete(name);
                                el.querySelector("[data-save-list] option:checked")?.remove();
                                if (!saveList.size) {
                                    const ow = el.querySelector("[data-overwrite]");
                                    const del = el.querySelector("[data-delete]");
                                    if (ow) ow.disabled = true;
                                    if (del) del.disabled = true;
                                }
                            });
                        } else if (ev.target.closest("[data-add-new]")) {
                            let name = el.querySelector("[data-save-name]").value;
                            if (name) {
                                if (saveList.has(name)) {
                                    ui.notifications.error(game.i18n.localize("DICESONICE.SaveAsErrorAlreadyExist"));
                                } else {
                                    this.actionSaveAs(name);
                                    dialog.close();
                                }
                            } else {
                                ui.notifications.error(game.i18n.localize("DICESONICE.SaveAsErrorName"));
                            }
                        }
                    });
                } else {
                    const ow = el.querySelector("[data-overwrite]");
                    const del = el.querySelector("[data-delete]");
                    if (ow) ow.disabled = true;
                    if (del) del.disabled = true;

                    el.addEventListener("click", (ev) => {
                        if (ev.target.closest("[data-add-new]")) {
                            let name = el.querySelector("[data-save-name]").value;
                            if (name) {
                                if (saveList.has(name)) {
                                    ui.notifications.error(game.i18n.localize("DICESONICE.SaveAsErrorAlreadyExist"));
                                } else {
                                    this.actionSaveAs(name);
                                    dialog.close();
                                }
                            } else {
                                ui.notifications.error(game.i18n.localize("DICESONICE.SaveAsErrorName"));
                            }
                        }
                    });
                }
            }
        });
    }

    async _onLoad() {
        let saves = game.user.getFlag("dice-so-nice", "saves");
        let saveList = [];
        if (saves) saveList = new Map(Object.entries(saves));

        foundry.applications.api.DialogV2.wait({
            window: { title: "DICESONICE.Load" },
            position: { width: 550 },
            content: await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dialog-load.hbs", { saveList: saveList.keys() }),
            buttons: [{
                action: "load", icon: "fa-solid fa-box-open", label: "DICESONICE.Load",
                callback: async (event, button, dialog) => {
                    let name = dialog.element.querySelector("[data-save-list]").value;
                    await this.actionLoadSave(name);
                    this.close();
                }
            }, {
                action: "no", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel", default: true
            }],
            render: (event, dialog) => {
                if (!saveList.size) {
                    const btn = dialog.element.querySelector('[data-button="load"]');
                    if (btn) btn.disabled = true;
                }
            }
        });
    }

    async _onLoadRoleSave() {
        const saves = game.user.getFlag("dice-so-nice", "saves") ?? {};
        const saveList = new Map(Object.entries(saves));

        foundry.applications.api.DialogV2.wait({
            window: { title: "DICESONICE.RoleLoadFromSave" },
            position: { width: 550 },
            content: await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dialog-load.hbs", { saveList: saveList.keys() }),
            buttons: [{
                action: "load", icon: "fa-solid fa-box-open", label: "DICESONICE.Load",
                callback: async (event, button, dialog) => {
                    const name = dialog.element.querySelector("[data-save-list]").value;
                    await this._loadRoleSave(name, saves[name]);
                }
            }, {
                action: "no", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel", default: true
            }],
            render: (event, dialog) => {
                if (!saveList.size) {
                    const btn = dialog.element.querySelector('[data-button="load"]');
                    if (btn) btn.disabled = true;
                }
            }
        });
    }

    async _loadRoleSave(name, save) {
        if (!save) return;
        const roleScope = save.roleAppearance?.[this.roleId];
        const hasRoleScope = roleScope && !foundry.utils.isEmpty(roleScope);
        const hasBasic = save.appearance && !foundry.utils.isEmpty(save.appearance);
        if (!hasRoleScope && !hasBasic) {
            ui.notifications.warn(game.i18n.format("DICESONICE.RoleLoadNothing", { name }));
            return;
        }

        let source;
        if (hasRoleScope && hasBasic) {
            const choice = await foundry.applications.api.DialogV2.wait({
                window: { title: game.i18n.localize("DICESONICE.RoleLoadFromSave") },
                content: `<p>${game.i18n.format("DICESONICE.RoleLoadWhich", { name, role: this.document.name })}</p>`,
                buttons: [
                    { action: "role", icon: "fa-solid fa-masks-theater", label: game.i18n.format("DICESONICE.RoleLoadRoleChoice", { role: this.document.name }) },
                    { action: "basic", icon: "fa-solid fa-dice-d20", label: "DICESONICE.RoleLoadBasicChoice" },
                    { action: "cancel", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel", default: true }
                ]
            });
            if (choice !== "role" && choice !== "basic") return;
            source = choice === "role" ? roleScope : save.appearance;
        } else {
            source = hasRoleScope ? roleScope : save.appearance;
        }

        const scope = await this._importScopeToWorld(foundry.utils.deepClone(source), save);
        await this._applyLoadedScope(scope);
        ui.notifications.info(game.i18n.format("DICESONICE.loadMessage", { name }));
    }

    //a world scope can only reference world dice, so we copy it
    async _importScopeToWorld(scope, save) {
        for (const data of Object.values(scope)) {
            if (!data?.libraryDieId) continue;
            if (DiceLibrary.isWorldOwner(data.libraryDieOwner)) {
                if (!DiceLibrary.getFromUser(DiceLibrary.WORLD_OWNER, data.libraryDieId)) {
                    delete data.libraryDieId;
                    delete data.libraryDieOwner;
                }
                continue;
            }
            //the save snapshots the library
            const snapshot = Array.isArray(save.diceLibrary) ? save.diceLibrary.find(d => d.id === data.libraryDieId) : null;
            const die = snapshot ?? DiceLibrary.getFromUser(data.libraryDieOwner || game.user.id, data.libraryDieId);
            if (!die) {
                delete data.libraryDieId;
                delete data.libraryDieOwner;
                continue;
            }
            const existing = DiceLibrary.getByNameAndTypeForUser(DiceLibrary.WORLD_OWNER, die.name, die.dieType);
            const copy = existing ?? await DiceLibrary.saveWorldDie({ ...foundry.utils.deepClone(die), id: undefined });
            if (copy) {
                data.libraryDieId = copy.id;
                data.libraryDieOwner = DiceLibrary.WORLD_OWNER;
            } else {
                delete data.libraryDieId;
                delete data.libraryDieOwner;
            }
        }
        return scope;
    }

    async _applyLoadedScope(scope) {
        const role = this.roleId;
        Utils.sanitizeRoleScopes({ [role]: scope });
        const dieTypes = this._getRoleDieTypes(role);
        const buffer = { global: scope.global ?? {} };
        const hidden = {};
        for (const [dieType, slot] of Object.entries(scope)) {
            if (dieType === "global") continue;
            if (dieTypes && !dieTypes.includes(dieType)) hidden[dieType] = slot;
            else buffer[dieType] = slot;
        }
        this._roleHiddenSlots[role] = hidden;
        this._roleBuffers[role] = buffer;
        await Promise.all(this.systemSettingsDialogList.map((dialog) => dialog.close()));
        await this._rebuildAppearanceTabs(buffer);
        this.onApply();
    }

    async _onImport() {
        foundry.applications.api.DialogV2.wait({
            window: { title: "DICESONICE.Import" },
            position: { width: 400 },
            content: await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dialog-import.hbs"),
            buttons: [{
                action: "import", icon: "fa-solid fa-file-import", label: "DICESONICE.Import",
                callback: async (event, button, dialog) => {
                    const form = dialog.element.querySelector("form");
                    if (!form.data.files.length) return ui.notifications.error(game.i18n.localize("DICESONICE.ImportNoFile"));
                    foundry.utils.readTextFromFile(form.data.files[0]).then(async json => {
                        await this.actionImportFromJSON(json);
                        this.close();
                    });
                },
                default: true
            }, {
                action: "no", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel"
            }]
        });
    }

    async _onGMPush() {
        if (!game.user.isGM) return;

        foundry.applications.api.DialogV2.wait({
            classes: ["dice-so-nice"],
            window: { title: "DICESONICE.GMPushDialogTitle" },
            position: { width: 500 },
            content: await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dialog-gm-push.hbs"),
            buttons: [{
                action: "push", icon: "fa-solid fa-share-square", label: "DICESONICE.GMPushConfirm",
                callback: async (event, button, dialog) => {
                    const form = dialog.element.querySelector("form");
                    const parts = {
                        appearance: form.elements.appearance.checked,
                        sfxList: form.elements.sfxList.checked,
                        settings: form.elements.settings.checked
                    };
                    if (!parts.appearance && !parts.sfxList && !parts.settings) {
                        ui.notifications.warn(game.i18n.localize("DICESONICE.GMPushNone"));
                        return;
                    }
                    await this.submit({ preventClose: true, preventRender: true });
                    await this.actionGMPushConfig(parts);
                }
            }, {
                action: "cancel", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel", default: true
            }]
        });
    }

    _onCanvasClick(event) {
        let rect = event.target.getBoundingClientRect();
        let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        if (x > 1) x = 1;
        let y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        let pos = { x: x, y: y };
        let dice = this.showcaseView.findShowcaseDie(pos);
        if (dice) {
            let diceType = this.showcaseView.findRootObject(dice.object).userData;
            if (this.element.querySelector(`.dsn-appearance-tabs [data-tab="${diceType}"]`)) {
                this.activateAppearanceTab(diceType);
            } else {
                const hint = this.element.querySelector(".dsn-appearance-hint");
                if (hint) hint.style.display = "none";
                const seed = this.isRoleMode ? {} : this.currentGlobalAppearance;
                const newSystemSettings = this.isRoleMode ? '' : this._renderSystemSettings(this.currentGlobalAppearance.system, diceType, this.currentRole);
                const buffer = this.isRoleMode ? this._readFormAppearance() : null;
                this._renderAppearanceTab(diceType, seed, this.currentRole, newSystemSettings, buffer).then((htmlString) => {
                    let tabName = diceType.toUpperCase();
                    let insertBefore = null;
                    this.element.querySelectorAll(".dsn-appearance-tabs .item").forEach(el => {
                        if (insertBefore) return;
                        if (this.navOrder[el.dataset.tab] >= this.navOrder[diceType]) {
                            insertBefore = el.dataset.tab;
                        }
                    });

                    const template = document.createElement("template");
                    template.innerHTML = htmlString;
                    const newTabContent = template.content.firstElementChild;

                    const navSpan = document.createElement("span");
                    navSpan.className = "item";
                    navSpan.dataset.action = "tab";
                    navSpan.dataset.group = "dsn-dice";
                    navSpan.dataset.tab = diceType;
                    navSpan.innerHTML = `${tabName} <i class="fa-solid fa-times" data-close-tab></i>`;

                    if (insertBefore) {
                        const beforeContent = this.element.querySelector(`.tabAppearance[data-tab="${insertBefore}"]`);
                        const beforeNav = this.element.querySelector(`.dsn-appearance-tabs .item[data-tab="${insertBefore}"]`);
                        if (beforeContent) beforeContent.before(newTabContent);
                        if (beforeNav) beforeNav.before(navSpan);
                    } else {
                        this.element.querySelector("#dsn-appearance-content").append(newTabContent);
                        this.element.querySelector(".dsn-appearance-tabs").append(navSpan);
                    }
                    this.activateAppearanceTab(diceType);
                    this.toggleCustomization(diceType);
                    this.filterSystems(diceType);
                });
            }
        }
    }

    onReset() {
        this.reset = true;
        this._roleBuffers = {};
        this._roleHiddenSlots = {};
        this.render();
        this.changeTab("general", "dsn-main", { force: true });
    }

    parseInputs(data) {
        var ret = {};
        retloop:
        for (var input in data) {
            var val = data[input];

            var parts = input.split('[');
            var last = ret;

            for (var i in parts) {
                var part = parts[i];
                if (part.substring(part.length - 1) == ']') {
                    part = part.substring(0, part.length - 1);
                }

                if (i == parts.length - 1) {
                    last[part] = val;
                    continue retloop;
                } else if (!last.hasOwnProperty(part)) {
                    last[part] = {};
                }
                last = last[part];
            }
        }
        return ret;
    }

    async _updateObject(event, formData) {
        formData = this.parseInputs(formData.object);

        if (this.isRoleMode) {
            await Promise.all(this.systemSettingsDialogList.map((dialog) => dialog.close()));
            this._roleBuffers[this.currentRole] = this._readFormAppearance();
        } else {
            this._roleBuffers[this.currentRole] = formData.appearance;
        }
        if (this.isWorldRole) {
            return this._updateWorldRoleScope();
        }
        formData.appearance = foundry.utils.deepClone(this._getRoleBuffer("basic"));

        if (this.isActor) {
            return this._updateActorAppearance(formData);
        }

        if (this.reset) {
            return this._clearUserRecord();
        }

        //Remove custom settings if custom isn't selected to prevent losing them in the user save
        let sfxLine = formData.sfxLine;
        if (sfxLine) {
            sfxLine = Object.values(sfxLine);
            //Remove empty lines
            for (let i = sfxLine.length - 1; i >= 0; i--) {
                if (sfxLine[i].mode === 'advanced') {
                    if (!sfxLine[i].formula || !sfxLine[i].specialEffect || !SFXFormulaMatcher.validate(sfxLine[i].formula).valid)
                        sfxLine.splice(i, 1);
                } else if (sfxLine[i].diceType == undefined || sfxLine[i].diceType == "" || sfxLine[i].onResult == "" || Array.isArray(sfxLine[i].diceType) || Array.isArray(sfxLine[i].specialEffect))
                    sfxLine.splice(i, 1);
            }
            //Remove duplicate lines
            let dataArr = sfxLine.map(item => {
                return [JSON.stringify(item), item]
            });
            let mapArr = new Map(dataArr);

            sfxLine = [...mapArr.values()];

            delete formData.sfxLine;
        }

        let scopedAppearance = Object.keys(formData.appearance);
        let systemsInUse = new Set();
        for (let scope of scopedAppearance) {
            if (formData.appearance[scope].libraryDieId) {
                const parsed = DiceConfig._parseLibraryDieValue(formData.appearance[scope].libraryDieId);
                formData.appearance[scope].libraryDieId = parsed.libraryDieId || "";
                if (parsed.libraryDieOwner) {
                    formData.appearance[scope].libraryDieOwner = parsed.libraryDieOwner;
                } else {
                    delete formData.appearance[scope].libraryDieOwner;
                }
            } else {
                delete formData.appearance[scope].libraryDieId;
                delete formData.appearance[scope].libraryDieOwner;
            }

            if (formData.appearance[scope].colorset != "custom") {
                delete formData.appearance[scope].labelColor;
                delete formData.appearance[scope].diceColor;
                delete formData.appearance[scope].outlineColor;
                delete formData.appearance[scope].edgeColor;
            }

            // filter form system settings based on the system settings to remove helpers and selectors
            systemsInUse.add(formData.appearance[scope].system);
            const system = this.diceFactory.systems.get(formData.appearance[scope].system);
            if (system && system.settings.length > 0) {
                const systemSettingsList = system.settings;
                const systemSettingsIDs = systemSettingsList.map(setting => setting.id);

                //Only keep settings form entries that are in the system settings id list. systemSettings is an object with the ids as keys
                formData.appearance[scope].systemSettings = Object.fromEntries(Object.entries(formData.appearance[scope].systemSettings).filter(([key]) => systemSettingsIDs.includes(key)));
            }
        }
        let currentSettings = DsnSettings.CONFIG();

        const roleSystemsInUse = await this._writeRoleAppearance();
        for (const system of roleSystemsInUse) systemsInUse.add(system);

        //required
        await game.user.unsetFlag("dice-so-nice", "sfxList");
        await game.user.unsetFlag("dice-so-nice", "appearance");
        await game.user.unsetFlag("dice-so-nice", "settings");

        //system settings won't be merged here because insertValues is false
        //merge on the plain defaults: a die type tab from a package default that the player removed must not come back
        let appearance = foundry.utils.mergeObject(DsnSettings.DEFAULT_APPEARANCE(), formData.appearance, { insertKeys: true, insertValues: false, applyOperators: true });

        //add back system settings and library die refs (mergeObject drops them)
        for (let scope of scopedAppearance) {
            if (formData.appearance[scope].systemSettings) {
                appearance[scope].systemSettings = formData.appearance[scope].systemSettings;
            }
            if (formData.appearance[scope].libraryDieId) {
                appearance[scope].libraryDieId = formData.appearance[scope].libraryDieId;
                if (formData.appearance[scope].libraryDieOwner) {
                    appearance[scope].libraryDieOwner = formData.appearance[scope].libraryDieOwner;
                }
            } else {
                delete appearance[scope].libraryDieId;
                delete appearance[scope].libraryDieOwner;
            }
        }

        delete formData.appearance;
        let settings = foundry.utils.mergeObject(DsnSettings.CONFIG(), formData, { insertKeys: false, insertValues: false, applyOperators: true });

        //preserve settings that have no field in this form
        settings.rollingArea = currentSettings.rollingArea;
        settings.protectPersistent = currentSettings.protectPersistent;

        await game.user.setFlag('dice-so-nice', 'settings', settings);
        await game.user.setFlag("dice-so-nice", "appearance", appearance);
        await game.user.setFlag("dice-so-nice", "sfxList", sfxLine ?? []);
        await game.user.setFlag("dice-so-nice", "saved", { appearance: true, sfx: true });

        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id });
        DiceSFXManager.init();
        for (let system of systemsInUse) {
            this.diceFactory.systems.get(system)?.loadSettings();
        }
        ui.notifications.info(game.i18n.localize("DICESONICE.saveMessage"));

        let reloadRequired = Utils.RELOAD_REQUIRED_IF_MODIFIED.some(setting => settings[setting] != currentSettings[setting]);

        if (reloadRequired) {
            foundry.applications.settings.SettingsConfig.reloadConfirm();
        } else {
            game.dice3d.update(settings);
        }
    }

    //save after a reset: clear the player's settings so they start from the package defaults again
    async _clearUserRecord() {
        const currentSettings = DsnSettings.CONFIG();
        for (const key of ["saved", "sfxList", "appearance", "roleAppearance", "settings"])
            await game.user.unsetFlag("dice-so-nice", key);
        //no field in this form for these two
        const kept = {};
        if (currentSettings.rollingArea) kept.rollingArea = currentSettings.rollingArea;
        if (currentSettings.protectPersistent) kept.protectPersistent = currentSettings.protectPersistent;
        if (!foundry.utils.isEmpty(kept))
            await game.user.setFlag("dice-so-nice", "settings", kept);

        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id });
        DiceSFXManager.init();
        for (const system of this.diceFactory.systems.values())
            system.loadSettings();
        ui.notifications.info(game.i18n.localize("DICESONICE.saveMessage"));

        const settings = DsnSettings.CONFIG();
        if (Utils.RELOAD_REQUIRED_IF_MODIFIED.some(setting => settings[setting] != currentSettings[setting]))
            foundry.applications.settings.SettingsConfig.reloadConfirm();
        else
            game.dice3d.update(settings);
    }

    async _updateActorAppearance(formData) {
        let scopedAppearance = Object.keys(formData.appearance);
        for (let scope of scopedAppearance) {
            if (formData.appearance[scope].libraryDieId) {
                const parsed = DiceConfig._parseLibraryDieValue(formData.appearance[scope].libraryDieId);
                formData.appearance[scope].libraryDieId = parsed.libraryDieId || "";
                formData.appearance[scope].libraryDieOwner = parsed.libraryDieOwner || game.user.id;
            } else {
                delete formData.appearance[scope].libraryDieId;
                delete formData.appearance[scope].libraryDieOwner;
            }

            if (formData.appearance[scope].colorset != "custom") {
                delete formData.appearance[scope].labelColor;
                delete formData.appearance[scope].diceColor;
                delete formData.appearance[scope].outlineColor;
                delete formData.appearance[scope].edgeColor;
            }

            const system = this.diceFactory.systems.get(formData.appearance[scope].system);
            if (system && system.settings.length > 0) {
                const systemSettingsIDs = system.settings.map(s => s.id);
                formData.appearance[scope].systemSettings = Object.fromEntries(
                    Object.entries(formData.appearance[scope].systemSettings ?? {}).filter(([key]) => systemSettingsIDs.includes(key))
                );
            }
        }

        await this._writeRoleAppearance();

        await this.document.unsetFlag("dice-so-nice", "appearance");
        await this.document.setFlag("dice-so-nice", "appearance", formData.appearance);

        const uuid = this.document.uuid;
        if (game.user.isGM) {
            let preloadList = game.settings.get("dice-so-nice", "documentsForPreload");
            if (!preloadList.includes(uuid)) {
                preloadList = [...preloadList, uuid];
                await game.settings.set("dice-so-nice", "documentsForPreload", preloadList);
            }
        }

        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id, document: uuid });
        ui.notifications.info(game.i18n.localize("DICESONICE.saveMessage"));
    }

    async _updateWorldRoleScope() {
        const scope = this._prepareRoleScope(this._roleBuffers[this.roleId], { role: this.roleId });
        await this.document.setFlag("dice-so-nice", "roleAppearance", { [this.roleId]: scope });

        DiceLibrary.preloadAssets();
        this.diceFactory.preloadPresets(false);

        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id, role: this.roleId });
        ui.notifications.info(game.i18n.localize("DICESONICE.saveMessage"));
    }

    static async _onResetActor() {
        if (!this.isActor) return;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize("DICESONICE.Reset") },
            content: game.i18n.localize("DICESONICE.ResetActorConfirm")
        });
        if (!confirmed) return;

        await this.document.unsetFlag("dice-so-nice", "roleAppearance");
        await this.document.unsetFlag("dice-so-nice", "appearance");

        const uuid = this.document.uuid;
        if (game.user.isGM) {
            let preloadList = game.settings.get("dice-so-nice", "documentsForPreload");
            preloadList = preloadList.filter(u => u !== uuid);
            await game.settings.set("dice-so-nice", "documentsForPreload", preloadList);
        }

        game.socket.emit("module.dice-so-nice", { type: "update", user: game.user.id, document: uuid });
        this.close();
    }

    _buildSlimSelectOptions(dicetype, selectedValues = []) {
        if (!dicetype || !this.possibleResultList[dicetype]) return [];
        const selected = new Set(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
        const isExtraTrigger = !!DiceSFXManager.EXTRA_TRIGGER_RESULTS[dicetype];
        return this.possibleResultList[dicetype].map(opt => {
            let displayText = opt.id;
            //we assume that a custom trigger result added with a name means the ID doesn't mean much
            if (isExtraTrigger) {
                displayText = opt.name;
            } else if (opt.name !== opt.id) {
                displayText = `${opt.name} (${opt.id})`;
            }
            return {
                text: displayText,
                value: opt.id,
                selected: selected.has(opt.id)
            };
        });
    }

    _sfxFormulaRolesHint() {
        const roles = game.dice3d?.DiceFactory?.getRoles?.().map(role => role.id) ?? [];
        return game.i18n.format("DICESONICE.sfxFormulaRolesHint", { roles: roles.join(", ") });
    }

    _initSlimSelects() {
        const selects = this.element.querySelectorAll("[data-sfx-result]");
        selects.forEach(selectEl => {
            if (this.slimSelectInstances.has(selectEl)) return;
            const dicetype = selectEl.dataset.sfxResultDicetype;
            const currentSelected = Array.from(selectEl.selectedOptions).map(o => o.value);
            const instance = new SlimSelect({
                select: selectEl,
                settings: {
                    showSearch: false,
                    closeOnSelect: false,
                    allowDeselect: true,
                    contentLocation: this.element.querySelector("form.dice-so-nice")
                },
                events: {
                    afterChange: () => this.setPosition()
                }
            });
            if (dicetype && this.possibleResultList[dicetype]) {
                instance.setData(this._buildSlimSelectOptions(dicetype, currentSelected));
            }
            this.slimSelectInstances.set(selectEl, instance);
        });
    }

    _destroySlimSelects() {
        for (const [selectEl, instance] of this.slimSelectInstances) {
            instance.destroy();
        }
        this.slimSelectInstances.clear();
    }

    _sfxToggleToAdvanced(sfxLine) {
        const diceTypeSelect = sfxLine.querySelector("[data-sfx-dicetype]");
        const resultSelect = sfxLine.querySelector("[data-sfx-result]");
        const ID = sfxLine.querySelector("[data-sfx-mode-input]").name.match(/\[(\d+)\]/)[1];

        // auto-convert current selections to formula
        let formula = '';
        if (diceTypeSelect) {
            const diceType = diceTypeSelect.value;
            if (diceType) {
                if (resultSelect) {
                    const selected = Array.from(resultSelect.selectedOptions).map(o => o.value);
                    const specialTriggers = ["kh", "kl", "dh", "dl", "cs", "cf", "x", "r"];
                    const numericResults = selected.filter(v => !specialTriggers.includes(v));

                    if (selected.includes("kh") || selected.includes("kl") || selected.includes("dh") || selected.includes("dl")) {
                        const mod = selected.find(v => ["kh", "kl", "dh", "dl"].includes(v));
                        formula = '!discarded(' + diceType + mod + ')';
                    } else if (selected.includes("cs")) {
                        formula = 'success(' + diceType + 'cs)';
                    } else if (selected.includes("cf")) {
                        formula = 'failure(' + diceType + 'cf)';
                    } else if (selected.includes("x")) {
                        formula = 'exploded(' + diceType + ')';
                    } else if (selected.includes("r")) {
                        formula = 'rerolled(' + diceType + ')';
                    } else {
                        formula = diceType;
                        if (numericResults.length > 0) {
                            formula += ' == ' + numericResults.join(',');
                        }
                    }
                } else {
                    formula = diceType;
                }
            }
        }

        // destroy SlimSelect on the result dropdown
        if (resultSelect && this.slimSelectInstances.has(resultSelect)) {
            this.slimSelectInstances.get(resultSelect).destroy();
            this.slimSelectInstances.delete(resultSelect);
        }

        // replace diceType + onResult with formula input
        const diceTypeContainer = sfxLine.querySelector(".sfx-flex-2");
        const resultContainer = sfxLine.querySelector(".sfx-flex-5");
        if (diceTypeContainer) diceTypeContainer.remove();
        if (resultContainer) resultContainer.remove();

        const formulaDiv = document.createElement("div");
        formulaDiv.className = "sfx-data sfx-flex-7 sfx-formula-container";
        const formulaInput = document.createElement("input");
        formulaInput.type = "text";
        formulaInput.setAttribute("data-sfx-formula", "");
        formulaInput.name = `sfxLine[${ID}][formula]`;
        formulaInput.value = formula;
        formulaInput.placeholder = game.i18n.localize("DICESONICE.sfxFormulaPlaceholder");
        formulaInput.title = this._sfxFormulaRolesHint();
        formulaInput.autocomplete = "off";
        formulaDiv.appendChild(formulaInput);
        const errorIcon = document.createElement("i");
        errorIcon.className = "fas fa-circle-exclamation sfx-formula-error-icon";
        errorIcon.setAttribute("data-sfx-formula-error", "");
        formulaDiv.appendChild(errorIcon);

        const specialEffectDiv = sfxLine.querySelector(".sfx-flex-3");
        sfxLine.insertBefore(formulaDiv, specialEffectDiv);

        // update mode state
        sfxLine.dataset.sfxMode = "advanced";
        sfxLine.querySelector("[data-sfx-mode-input]").value = "advanced";
        sfxLine.querySelector("[data-sfx-mode-toggle] i").className = "fas fa-list";

        this.setPosition();
    }

    async _sfxToggleToBasic(sfxLine) {
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize("DICESONICE.sfxModeConfirmTitle") },
            content: `<p>${game.i18n.localize("DICESONICE.sfxModeConfirmContent")}</p>`
        });
        if (!confirmed) return;

        const ID = sfxLine.querySelector("[data-sfx-mode-input]").name.match(/\[(\d+)\]/)[1];

        // remove formula input
        const formulaContainer = sfxLine.querySelector(".sfx-formula-container");
        if (formulaContainer) formulaContainer.remove();

        const specialEffectDiv = sfxLine.querySelector(".sfx-flex-3");

        // create diceType dropdown
        const diceTypeDiv = document.createElement("div");
        diceTypeDiv.className = "sfx-data sfx-flex-2";
        const diceTypeSelect = document.createElement("select");
        diceTypeSelect.setAttribute("data-sfx-dicetype", "");
        diceTypeSelect.name = `sfxLine[${ID}][diceType]`;
        this.triggerTypeList.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.name;
            diceTypeSelect.appendChild(opt);
        });
        diceTypeDiv.appendChild(diceTypeSelect);

        // create onResult multi-select
        const resultDiv = document.createElement("div");
        resultDiv.className = "sfx-data sfx-flex-5";
        const resultSelect = document.createElement("select");
        resultSelect.setAttribute("data-sfx-result", "");
        resultSelect.setAttribute("data-sfx-result-dicetype", "");
        resultSelect.name = `sfxLine[${ID}][onResult]`;
        resultSelect.multiple = true;
        resultDiv.appendChild(resultSelect);

        sfxLine.insertBefore(resultDiv, specialEffectDiv);
        sfxLine.insertBefore(diceTypeDiv, resultDiv);

        // update mode state
        sfxLine.dataset.sfxMode = "basic";
        sfxLine.querySelector("[data-sfx-mode-input]").value = "basic";
        sfxLine.querySelector("[data-sfx-mode-toggle] i").className = "fas fa-code";

        this._initSlimSelects();
        this.setPosition();
    }

    close(options) {
        this._destroySlimSelects();
        super.close(options);
        if (this.showcaseView) this.showcaseView.stopAnimation();
        if (this.diceScene) this.diceScene.clearScene();
        if (!this.noScene) this.diceFactory.disposeCachedMaterials("showcase");
        if (this.isWorldRole) this.options.onScopeSaved?.(this.roleId);
    }

    static async _onSubmit(event, form, formData) {
        this.sfxDialogList.forEach((dialog) => {
            dialog.close();
        });

        this.systemSettingsDialogList.forEach((dialog) => {
            dialog.close();
        });

        await this._updateObject(event, formData);
    }
}