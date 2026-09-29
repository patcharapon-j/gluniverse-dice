import { DiceFactory } from './engine/DiceFactory.js';
import { DsnSettings } from './settings/DsnSettings.js';
import { DiceBox } from './rendering/DiceBox.js';
import { DiceColors, TEXTURELIST, COLORSETS } from './engine/DiceColors.js';
import { DiceSFXManager } from './sfx/DiceSFXManager.js';
import { Utils } from './Utils.js';
import { ThinFilmFresnelMap } from './libs/ThinFilmFresnelMap.js';
import { TextureLoader, Vector3 } from 'three';
import { DiceTourMain } from './tours/DiceTourMain.js';
import { DiceSFX } from './sfx/DiceSFX.js';
import { DiceSystem } from './DiceSystem.js';
import { DiceLibrary } from './engine/DiceLibrary.js';
import { CustomDiceTerms } from './engine/CustomDiceTerms.js';
import { PendingThrowManager } from './interaction/PendingThrowManager.js';
import { PersistentDice } from './interaction/PersistentDice.js';
import { AnimationQueue } from './throw/AnimationQueue.js';
import { ThrowPipeline } from './throw/ThrowPipeline.js';
import { LEGACY_TO_METERS } from './engine/SceneConstants.js';
/**
 * Main class to handle 3D Dice animations.
 */
export class Dice3D {

    /**
     * Register a new system (legacy)
     * The id is to be used with addDicePreset
     * The name can be a localized string
     * @param {Object} system {id, name, group} or instance of DiceSystem
     * @param {String} mode "default" or "preferred". Kept for compatibility: "preferred" is a basic role default, use DiceSystem.setRoleDefaults("basic") instead.
     * @param {String} group Group to display in the dice selector. Can be any string, like the dice maker name or a brand
     */
    addSystem(system, mode = "default") {
        //retrocompatibility with  API version < 3.1
        if (typeof mode == "boolean") {
            mode = mode ? "preferred" : "default";
        }

        this.DiceFactory.addSystem(system, mode);
    }

    /**
     * Register a new dice preset
     * Type should be a known dice type (d4,d6,d8,d10,d12,d14,d16,d20,d24,d30,d100)
     * Labels contains either strings (unicode) or a path to a texture (png, gif, jpg, webp)
     * The texture file size should be 256*256
     * The system should be a system id already registered
     * @param {Object} dice {type:"",labels:[],system:""}
     */
    addDicePreset(dice, shape = null) {
        this.DiceFactory.addDicePreset(dice, shape);
    }

    /**
     * Register a custom physics shape under a name. Presets with a custom 3D model
     * can then reference it through the `shape` argument of `addDicePreset`, so the
     * die tumbles, lands, and reads on its own collision geometry instead of the
     * standard shape of its die type.
     *
     * @param {Object} bundle - the shape bundle
     * @param {String} bundle.name - unique shape name (prefix with your module id, e.g. "mymodule.rhombic_d12")
     * @param {String} bundle.type - collider type, only "ConvexPolyhedron" is supported for now
     * @param {Array<Array<Number>>} bundle.vertices - [x, y, z] per vertex, as-authored coordinates
     * @param {Array<Array<Number>>} bundle.faces - vertex indices per face, counter-clockwise from outside
     * @param {Boolean} [bundle.skipLastFaceIndex] - true if each face entry carries a trailing face id to ignore
     * @param {Array<Number>} bundle.faceValues - value shown by each face (top read), no 0
     * @param {Object} bundle.rotationCombinations - Euler degrees [x, y, z] keyed "low,high" for every pair of face values
     * @param {Number} [bundle.mass] - overrides the mass inherited from the die type
     * @param {Number} [bundle.inertia] - overrides the inertia inherited from the die type
     * @param {Number} [bundle.scaleModifier] - overrides the default scale modifier of presets using this shape
     * @returns {Boolean} true if the shape was registered, false if the bundle was rejected (see console)
     */
    addDiceShape(bundle) {
        return this.DiceFactory.addDiceShape(bundle);
    }

    /**
     * Register default appearances for damage types. Obsolete, use addRole
     * @param {Object} mapping - map of damage type id to default, shape
     *   `{ <id>: { colorset?: String, preset?: String, label?: String } }`.
     *   `colorset` is a registered colorset/theme id, `preset` a registered system id,
     *   `label` a display name used for new ids
     */
    addDamageTypeDefaults(mapping) {
        this.DiceFactory.addDamageTypeDefaults(mapping);
    }

    /**
     * Register or extend a dice role. Registering an existing id merges into it:
     * detectors are unioned, defaults are merged field by field (the last registration wins).
     * @param {Object} role
     * @param {String} role.id - role id (e.g. "hope", "fire")
     * @param {String} [role.label] - display name, can be a localization key
     * @param {String} [role.group] - group shown in the UIs, can be a localization key
     * @param {Boolean} [role.customizable] - whether players can customize this role in their dice settings
     * @param {Boolean} [role.optional] - whether players can turn this role off with their "Apply optional dice role appearances" preference
     * @param {Array<String>|null} [role.dieTypes] - optional die type whitelist shown in the player settings
     * @param {Array<String>} [role.denominations] - denominations of Die classes from your package (e.g. "w").
     *   Their dice get the role and roll as the regular die of their size
     * @param {Object} [role.defaults] - partial role scope `{ global?: {...}, d4?: {...}, ... }`
     * @param {Object} [role.detectors] - `{ modifiers?: [String], types?: [String] }`. A modifier token must be
     *   declared by a dice term class (Foundry's Die or one in CONFIG.Dice.terms)
     * @param {Object} [options]
     * @param {String} [options.package] - id of the registering package, shown in the Dice Roles table and in warnings
     */
    addRole(role, options = {}) {
        this.DiceFactory.addRole(role, options);
    }

    /**
     * Get the merged record of a role (builtin, registered and world overrides applied).
     * @param {String} id
     * @returns {Object|undefined}
     */
    getRole(id) {
        return this.DiceFactory.getRole(id);
    }

    /**
     * List roles known to this client.
     * @param {Object} [options]
     * @param {Boolean} [options.customizable] - only roles players can (or cannot) customize
     * @param {Boolean} [options.includeDeleted] - include roles the GM deleted from the table
     * @returns {Array<Object>}
     */
    getRoles(options = {}) {
        return this.DiceFactory.getRoles(options);
    }

    /**
     * Force preload of every dice preset registered under a given system id.
     * Useful for systems/modules that register internal dice presets that
     * users may never select in their appearance settings - without this,
     * those presets load lazily on the first roll and cause visible lag.
     *
     * Call this once after registering your presets (typically from the
     * `diceSoNiceReady` hook).
     *
     * @param {String} systemId - Id of the system whose presets should be preloaded
     * @returns {Promise<void>}
     */
    async preloadPresets(systemId) {
        await this.DiceFactory.forceLoadPresets(systemId);
    }

    /**
     * Add a texture to the list of textures and preload it
     * @param {String} textureID
     * @param {Object} textureData
     * @returns {Promise}
     */
    addTexture(textureID, textureData) {
        if (!textureData.bump)
            textureData.bump = '';
        return new Promise((resolve) => {
            let textureEntry = {};
            textureEntry[textureID] = textureData;
            TEXTURELIST[textureID] = textureData;
            DiceColors.loadTextures(textureEntry, (images) => {
                resolve();
            });
        });
    }

    /**
     * Add a colorset (theme)
     * @param {Object} colorset 
     * @param {String} mode = "default", "preferred". Kept for compatibility: "preferred" is a basic role default, use addRole instead.
     */
    async addColorset(colorset, mode = "default") {
        let defaultValues = {
            foreground: "custom",
            background: "custom",
            outline: "",
            edge: "",
            texture: "custom",
            material: "custom",
            font: "custom",
            visibility: "visible",
            labelComposite: "source-over",
            backgroundComposite: "source-over"
        }
        colorset = foundry.utils.mergeObject(defaultValues, colorset, { applyOperators: true });
        COLORSETS[colorset.name] = colorset;
        DiceColors.initColorSets(colorset);

        if (colorset.font && !foundry.applications.settings.menus.FontConfig.getAvailableFonts().includes(colorset.font)) {
            await foundry.applications.settings.menus.FontConfig.loadFont(colorset.font, { editor: false, fonts: [] });
        }
        //the legacy preferred mode is a basic role default
        if (mode == "preferred")
            this.DiceFactory.addRole({ id: "basic", defaults: { global: { colorset: colorset.name } } }, { package: colorset.name });
    }

    /**
     * Add a new type if SFX trigger that can be customized by users.
     * This trigger can then be pulled by a system, a module or a macro
     * @param {String} id : Identifier of the trigger, ex: fate3df
     * @param {String} name : Localized name of the trigger, ex: Fate Roll
     * @param {Array(String|Object)} results : Array of possible results for this trigger, ex: ["-3","3","0"]
     *        A result can also be an object with a localized name, ex: [{id: "hope", name: "With Hope"}]
     */
    addSFXTrigger(id, name, results) {
        if (DiceSFXManager.EXTRA_TRIGGER_RESULTS[id])
            return;
        DiceSFXManager.EXTRA_TRIGGER_TYPE.push({ id: id, name: name });
        DiceSFXManager.EXTRA_TRIGGER_RESULTS[id] = [];
        results.forEach((res) => {
            if (typeof res === "object")
                DiceSFXManager.EXTRA_TRIGGER_RESULTS[id].push({ id: String(res.id), name: res.name ?? String(res.id) });
            else
                DiceSFXManager.EXTRA_TRIGGER_RESULTS[id].push({ id: res, name: res });
        });
    }

    /**
     * Register special effect lines that players without a saved dice setup start with.
     * They show in the player settings as ordinary lines the player can edit or delete.
     * Lines from several packages add up.
     * @param {Array<Object>} lines - `{ diceType, onResult: [String], specialEffect, options? }`, or
     *   `{ mode: "advanced", formula, specialEffect, options? }`. diceType is a die type ("d20") or a trigger id
     *   registered with addSFXTrigger, specialEffect a mode id from getSFXModes
     */
    addSFXDefaults(lines) {
        DiceSFXManager.addDefaults(lines);
    }

    /**
     * Registers a new SFX mode class with the DiceSFXManager.
     *
     * @param {DiceSFX} sfxClass - The SFX mode class to be registered.
     * @return {void}
     */
    addSFXMode(sfxClass) {
        DiceSFXManager.registerSFXModeClass(sfxClass);
    }

    /**
     * Get available SFX modes by id -> localized name.
     * @returns {Object<string, string>}
     */
    getSFXModes() {
        const modes = DiceSFXManager.SFX_MODE_LIST || {};
        const localized = {};
        Object.entries(modes).forEach(([id, key]) => {
            localized[id] = game.i18n.localize(key);
        });
        return localized;
    }

    /**
     * Load a save file by its name
     * @param {String} name 
     * @returns {Promise}
     */
    async loadSaveFile(name) {
        if (game.user.getFlag("dice-so-nice", "saves").hasOwnProperty(name))
            await Utils.actionLoadSave(name);
    }

    /**
     * Get Loaded Dice Systems
     * return a map of DiceSystem
     * @returns {Map<systemId, DiceSystem>}
     */
    getLoadedDiceSystems() {
        return this.DiceFactory.systems;
    }

    /**
     * @param {string} selector - CSS selector for the elements to hide during a message update animation (default: ".dice-roll")
     */
    setMessageUpdateHideSelector(selector) {
        this.pipeline.messageUpdateHideSelector = selector;
    }

    /**
     * Set to true to disable the chat message interception on this client.
     */
    get messageHookDisabled() {
        return this.pipeline.messageHookDisabled;
    }

    set messageHookDisabled(value) {
        this.pipeline.messageHookDisabled = value;
    }

    /**
     * Constructor. Create and initialize a new Dice3d.
     */
    constructor() {
        const canvasVisibility = {
            show: () => this._beforeShow(),
            hide: () => this._afterShow(),
            hideNow: () => this._hideCanvas()
        };
        this.pendingThrows = new PendingThrowManager();
        this.queue = new AnimationQueue({ canvasVisibility, pendingThrows: this.pendingThrows });
        this.persistent = new PersistentDice({ pendingThrows: this.pendingThrows, canvasVisibility, queue: this.queue });
        this.pipeline = new ThrowPipeline({ queue: this.queue, pendingThrows: this.pendingThrows });
        this.pendingThrows.pipeline = this.pipeline;
        this.pendingThrows.persistent = this.persistent;

        //the units exist before the hook, its listeners reach the facade delegates
        Hooks.call("diceSoNiceInit", this);
        this.dice3dRenderers = {
            "board": null,
            "showcase": null,
            "editor": null
        };

        this.exports = {
            "Utils": Utils,
            "DiceColors": DiceColors,
            "TEXTURELIST": TEXTURELIST,
            "COLORSETS": COLORSETS
        };

        this._iridescenceLookUp = null;
        this._iridescenceNoise = null;
        const self = this;

        this.uniforms = {
            globalBloom: { value: 1 },
            bloomStrength: { value: 1.1 },
            bloomRadius: { value: 0.2 },
            bloomThreshold: { value: 0 },
            iridescenceLookUp: { get value() { return self._iridescenceLookUp ??= new ThinFilmFresnelMap(); }, set value(v) { self._iridescenceLookUp = v; } },
            iridescenceNoise: { get value() { return self._iridescenceNoise ??= new TextureLoader().load("modules/dice-so-nice/textures/noise-thin-film.webp"); }, set value(v) { self._iridescenceNoise = v; } },
            boost: { value: 1.5 },
            time: { value: 0 }
        };

        //dev escape hatch: set game.dice3d.disableAutoRebuild = true to stop the resize handler from rebuilding the box.
        this.disableAutoRebuild = false;
        this.defaultShowExtraDice = DsnSettings.DEFAULT_OPTIONS.showExtraDice;
    }

    init() {
        this._buildCanvas();
        this._installResizeHandler();
        this._installWelcomeButtons();
        this._installSocket();
        this._installPointerCapture();
        this._buildDiceBox();
        this.diceLibrary = new DiceLibrary();
        DiceSFXManager.init();

        if (DsnSettings.CONFIG().visibility === "none") {
            DiceColors.initColorSets();
            Hooks.call("diceSoNiceReady", this);
            DiceSFXManager.init();
        } else {
            DiceColors.loadTextures(TEXTURELIST, async (images) => {
                DiceColors.initColorSets();

                Hooks.call("diceSoNiceReady", this);
                //again with the default lines packages registered in the hook
                DiceSFXManager.init();
                await this.DiceFactory._loadFonts();
                await this.diceLibrary.load();
                await CustomDiceTerms.applyDefaultAppearances();
                await DiceLibrary.preloadAssets();
                await this.DiceFactory.preloadPresets();
                await this._preloadActorDocuments();
                //restore persistent dice from flags
                await this.persistent.restoreAll();
            });
        }

        this._welcomeMessage();
        this._registerTours();
    }

    get canInteract() {
        return !this.box.running || this.box.persistentDiceList.length > 0;
    }

    async _preloadActorDocuments() {
        let preloadList = game.settings.get("dice-so-nice", "documentsForPreload");
        if (!preloadList?.length) return;

        let cleaned = false;
        const validUuids = [];
        for (const uuid of preloadList) {
            const doc = foundry.utils.fromUuidSync(uuid);
            if (!doc) {
                cleaned = true;
                continue;
            }
            validUuids.push(uuid);
            await DiceLibrary.preloadAssets(null, uuid);
            await this.DiceFactory.preloadPresets(false, null, {}, uuid);
        }

        if (cleaned && game.user.isGM) {
            await game.settings.set("dice-so-nice", "documentsForPreload", validUuids);
        }
    }

    /**
     * Create and inject the dice box canvas resizing to the window total size.
     *
     * @private
     */
    _buildCanvas() {
        const config = DsnSettings.CONFIG();
        const bodyTop = parseInt(window.getComputedStyle(document.body).top, 10) || 0;

        const area = {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight - 1 - bodyTop
        };

        if(config.rollingArea) {
            area.width = config.rollingArea.width;
            area.height = config.rollingArea.height;
            area.left = config.rollingArea.left;
            area.top = config.rollingArea.top;
        }

        this.canvas = document.createElement("div");
        this.canvas.id = "dice-box-canvas";
        this.canvas.style.cssText = `position: absolute; left: ${area.left}px; top: ${area.top}px; pointer-events: none;`;
        if (config.canvasZIndex === "over") {
            this.canvas.style.zIndex = 1000;
            document.body.append(this.canvas);
        } else if (config.canvasZIndex === "auto") {
            this.canvas.style.zIndex = 0;
            document.body.append(this.canvas);
        } else {
            document.getElementById("board").after(this.canvas);
        }
        this.canvas.style.width = area.width + 'px';
        this.canvas.style.height = area.height + 'px';
    }

    _isAutoMode() {
        return DsnSettings.CONFIG().canvasZIndex === 'auto';
    }

    _raiseCanvas() {
        if (!this._isAutoMode()) return;
        const maxZ = foundry.applications?.api?.ApplicationV2?._maxZ;
        if (maxZ == null) {
            this.canvas.style.zIndex = 1000;
        } else {
            this.canvas.style.zIndex = ++foundry.applications.api.ApplicationV2._maxZ;
        }
        if (ui.activeWindow) ui.activeWindow = null;
    }

    /**
     * Build the dicebox.
     *
     * @private
     */
    _buildDiceBox() {
        this.DiceFactory = new DiceFactory();
        CustomDiceTerms.registerPresetsInFactory(this.DiceFactory);
        let config = DsnSettings.ALL_CONFIG();
        config.boxType = "board";

        config.dimensions = this._computeDimensions(config.rollingArea);

        this.box = new DiceBox(this.canvas, this.DiceFactory, config);
        if (config.visibility !== "none") this.box.initialize();

        this.queue.attach(this.box);
        this.persistent.attach(this.box, this.DiceFactory);
        this.pipeline.attach(this.box, this.DiceFactory);
        this.pendingThrows.attach(this.box);
    }

    _computeDimensions(rollingArea) {
        const dimensions = {
            width: window.innerWidth,
            height: window.innerHeight - 1,
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        };

        if(!rollingArea) {
            if (ui.sidebar.expanded) {
                dimensions.margin.right = ui.sidebar.element.clientWidth;
            } else {
                const sidebarContent = ui.sidebar.element.querySelector("#sidebar-content");
                dimensions.margin.right = sidebarContent?.clientWidth || ui.sidebar.element.clientWidth;
            }
        } else {
            dimensions.width = rollingArea.width;
            dimensions.height = rollingArea.height;
        }

        return dimensions;
    }

    _installResizeHandler() {
        const resizeHandler = () => {
            if (this.disableAutoRebuild) return;
            //resize ended probably, lets update the canvas once the current animation is complete
            this.queue.idle().then(() => this.resizeAndRebuild());
        }
        window.addEventListener("resize", foundry.utils.debounce(resizeHandler, 1000));
    }

    // Resize the play area
    // Only works if the window size hasn't changed
    resizePlayArea() {
        const config = DsnSettings.CONFIG();
        const dimensions = this._computeDimensions(config.rollingArea);
        this.box.updateBoundaries(dimensions);
    }

    //Only used after a window resize
    resizeAndRebuild() {
        if (!this.box.initialized) return;

        this.canvas.remove();
        this.dice3dRenderers.board.dispose();
        this.dice3dRenderers.board = null;

        //save previous systems and roles
        const systemBackup = this.DiceFactory.systems;
        const roleRegistryBackup = this.DiceFactory.roleRegistry;

        this.box.clearScene();
        this._buildCanvas();
        this._buildDiceBox();
        this.box.soundManager.preloadSounds();

        // Restore previous systems and roles
        this.DiceFactory.systems = systemBackup;
        this.DiceFactory.roleRegistry = roleRegistryBackup;
    }

    _installWelcomeButtons() {
        document.addEventListener("click", (ev) => {
            const target = ev.target.closest(".dice-so-nice-btn-settings");
            if (!target) return;
            ev.preventDefault();
            const menu = game.settings.menus.get(target.dataset.key);
            const app = new menu.type();
            return app.render(true);
        });

        document.addEventListener("click", (ev) => {
            const target = ev.target.closest(".dice-so-nice-btn-tour");
            if (!target) return;
            ev.preventDefault();
            game.tours.get("dice-so-nice.dice-so-nice-tour").start();
        });
    }

    _installSocket() {
        game.socket.on('module.dice-so-nice', (request) => {
            switch (request.type) {
                case "show":
                    if (!request.users || request.users.includes(game.user.id))
                        this.pipeline.show(request.data, game.users.get(request.user), false, null, false, request.speaker);
                    break;
                case "update":
                    if (request.role) {
                        DiceLibrary.preloadAssets();
                        this.DiceFactory.preloadPresets(false);
                    } else if (request.document) {
                        DiceLibrary.preloadAssets(null, request.document);
                        this.DiceFactory.preloadPresets(false, null, {}, request.document);
                        if (game.user.isGM) {
                            let preloadList = game.settings.get("dice-so-nice", "documentsForPreload");
                            if (!preloadList.includes(request.document)) {
                                preloadList = [...preloadList, request.document];
                                game.settings.set("dice-so-nice", "documentsForPreload", preloadList);
                            }
                        }
                    } else {
                        if (request.user == game.user.id || DsnSettings.CONFIG().showOthersSFX)
                            DiceSFXManager.init();
                        if (request.user != game.user.id) {
                            DiceLibrary.preloadAssets(request.user);
                            this.DiceFactory.preloadPresets(false, request.user);
                        }
                    }
                    break;
                case "gmPush":
                    //GM overwrote my flags - reload my own state so new config takes effect without a reload
                    if (request.targets && request.targets.includes(game.user.id)) {
                        DiceSFXManager.init();
                        this.update(DsnSettings.CONFIG());
                        ui.notifications.info(game.i18n.localize("DICESONICE.GMPushReceived"));
                    }
                    break;
                case "customTermSync":
                    CustomDiceTerms.sync(request.definitions || {}, this.DiceFactory);
                    CustomDiceTerms.applyDefaultAppearances();
                    break;
                case "persistent-create":
                case "persistent-remove":
                case "persistent-clear":
                case "persistent-pickup":
                case "persistent-move":
                case "persistent-release":
                case "persistent-preroll":
                case "persistent-throw":
                    if (request.user !== game.user.id)
                        this.persistent.handleMessage(request)
                            .then(() => this.pendingThrows?.onTableEvent(request.type.slice("persistent-".length), request.user))
                            .catch(err =>
                                console.error("[Dice So Nice] Persistent sync error:", err));
                    break;
            }
        });
    }

    _installPointerCapture() {
        const hideCanvasAndClear = () => {
            const config = DsnSettings.CONFIG();
            if (!config.hideAfterRoll && this.canvas.style.display !== "none" && !this.box.rolling) {
                if (this.box.persistentDiceList.length === 0) {
                    this.canvas.style.display = "none";
                }
                this.box.clearAll();
            }
        }

        const mouseNDC = (event) => {
            let rect = this.canvas.getBoundingClientRect();
            let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            if (x > 1)
                x = 1;
            let y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;
            return { x: x, y: y };
        }

        if (game.settings.get("dice-so-nice", "allowInteractivity")) {
            //pointer events + setPointerCapture to avoid dropped drags
            //capture phase on window so nothing downstream can stopPropagation
            //TODO: touch/pen input not supported yet for persistent dice
            this._dsnPointerDown = async (event) => {
                if (event.pointerType && event.pointerType !== "mouse") return;
                if (!this.canInteract) return;
                //temporarily flip pointer-events to auto so elementsFromPoint can see the canvas,
                //then restore immediately. respects stacking order (modals, dialogs, etc.)
                //look up fresh each time in case _buildCanvas recreated the div
                const dsnEl = document.getElementById("dice-box-canvas");
                if (dsnEl && typeof document.elementFromPoint === "function") {
                    const prevPE = dsnEl.style.pointerEvents;
                    let topmost;
                    dsnEl.style.pointerEvents = "auto";
                    try {
                        topmost = document.elementFromPoint(event.clientX, event.clientY);
                    } finally {
                        dsnEl.style.pointerEvents = prevPE;
                    }
                    if (topmost && topmost !== dsnEl && !dsnEl.contains(topmost)) {
                        return;
                    }
                }
                let hit = await this.box.onMouseDown(event, mouseNDC(event));
                if (hit) {
                    try {
                        document.documentElement.setPointerCapture?.(event.pointerId);
                    } catch (e) { /* capture is best-effort */ }
                    this._beforeShow();
                } else {
                    hideCanvasAndClear();
                }
            };
            this._dsnPointerMove = async (event) => {
                if (event.pointerType && event.pointerType !== "mouse") return;
                if (!this.canInteract) return;
                await this.box.onMouseMove(event, mouseNDC(event));
            };
            this._dsnPointerUp = async (event) => {
                if (event.pointerType && event.pointerType !== "mouse") return;
                if (!this.canInteract) return;
                let hit = await this.box.onMouseUp(event);
                if (hit) this._afterShow();
            };
            //no removeEventListener needed, init runs once per session
            window.addEventListener("pointerdown", this._dsnPointerDown, true);
            window.addEventListener("pointermove", this._dsnPointerMove, true);
            window.addEventListener("pointerup", this._dsnPointerUp, true);
            //pointercancel = OS took the pointer, treat as release
            window.addEventListener("pointercancel", this._dsnPointerUp, true);
        } else {
            document.addEventListener("mousedown", async (event) => {
                hideCanvasAndClear();
            });
        }
    }

    /**
     * Show a private message to new players
     */
    _welcomeMessage() {
        if (!game.user.getFlag("dice-so-nice", "welcomeMessageShown")) {
            const content = [`
            <div class="dice-so-nice">
                <h3 class="nue">${game.i18n.localize("DICESONICE.WelcomeTitle")}</h3>
                <p class="nue">${game.i18n.localize("DICESONICE.WelcomeMessage1")}</p>
                <p class="nue">${game.i18n.localize("DICESONICE.WelcomeMessage2")}</p>
                <p>
                    <button type="button" class="dice-so-nice-btn-settings" data-key="dice-so-nice.dice-so-nice">
                        <i class="fas fa-dice-d20"></i> ${game.i18n.localize("DICESONICE.configTitle")}
                    </button>
                </p>
                <p class="nue">${game.i18n.localize("DICESONICE.WelcomeMessage3")}</p>
                <p class="nue">${game.i18n.localize("DICESONICE.WelcomeMessageTour")}</p>
                <p>
                    <button type="button" class="dice-so-nice-btn-tour" data-tour="dice-so-nice-tour">
                        <i class="fas fa-hiking"></i> ${game.i18n.localize("DICESONICE.WelcomeMessageTourBtn")}
                    </button>
                </p>
                <p class="nue">${game.i18n.localize("DICESONICE.WelcomeMessage4")}</p>
                <footer class="nue">${game.i18n.localize("NUE.FirstLaunchHint")}</footer>
            </div>
            `];
            const chatData = content.map(c => {
                return {
                    whisper: [game.user.id],
                    speaker: { alias: "Dice So Nice!" },
                    flags: { core: { canPopout: true } },
                    content: c
                };
            });
            ChatMessage.implementation.createDocuments(chatData);
            game.user.setFlag("dice-so-nice", "welcomeMessageShown", true);
        }
    }

    /**
     * Register the tours to the Tour Manager
     */
    _registerTours() {
        game.tours.register("dice-so-nice", "dice-so-nice-tour", new DiceTourMain());
    }

    /**
     * Check if 3D simulation is enabled from the settings.
     */
    isEnabled() {
        return DsnSettings.isEnabled();
    }

    /**
     * Update the DiceBox with fresh new settgins.
     *
     * @param settings
     */
    update(settings) {
        this.box.update(settings);
    }

    /**
     * Show the 3D Dice animation for the Roll made by the User.
     *
     * @param roll an instance of Roll class to show 3D dice animation.
     * @param user the user who made the roll (game.user by default).
     * @param synchronize if the animation needs to be sent and played for each players (true/false).
     * @param users list of users or userId who can see the roll, leave it empty if everyone can see.
     * @param blind if the roll is blind for the current user
     * @param messageID ChatMessage related to this roll (default: null)
     * @param speaker Object based on the ChatSpeakerData data schema related to this roll. Useful to fully support DsN settings like "hide npc rolls". (Default: null)
     * @param options Object with 2 booleans: ghost (default: false) and secret (default: false)
     * @returns {Promise<boolean>} when resolved true if the animation was displayed, false if not.
     */
    showForRoll(roll, user = game.user, synchronize, users = null, blind, messageID = null, speaker = null, options = { ghost: false, secret: false }) {
        return this.pipeline.showForRoll(roll, user, synchronize, users, blind, messageID, speaker, options);
    }

    /**
     * Show the 3D Dice animation based on data configuration made by the User.
     *
     * @param data data containing the dice info.
     * @param user the user who made the roll (game.user by default).
     * @param synchronize
     * @param users list of users or userId who can see the roll, leave it empty if everyone can see.
     * @param blind if the roll is blind for the current user
     * @returns {Promise<boolean>} when resolved true if the animation was displayed, false if not.
     */
    show(data, user = game.user, synchronize = false, users = null, blind, speaker = null) {
        return this.pipeline.show(data, user, synchronize, users, blind, speaker);
    }

    /**
     * Change the default value of the showExtraDice settings
     * @param {Boolean} show 
     */
    showExtraDiceByDefault(show = true) {
        this.defaultShowExtraDice = show;
    }

    /**
     * enableDebugMode
     */
    enableDebugMode() {
        if(this.box)
            this.box.debugMode = true;
    }

    /**
     * Project a die mesh to screen space
     * @param {Object3D} dicemesh A die mesh, as received by a macro special effect
     * @returns {{x: Number, y: Number}|null} Viewport coordinates in CSS pixels, null when the 3D box is not ready
     */
    getScreenPosition(dicemesh) {
        const camera = this.box?.camera;
        if (!camera || !dicemesh?.isObject3D) return null;
        //the mesh is in a scaled container, so we read the world position
        const projected = dicemesh.getWorldPosition(new Vector3()).project(camera);
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: rect.left + (projected.x + 1) / 2 * rect.width,
            y: rect.top + (1 - projected.y) / 2 * rect.height
        };
    }

    /**
     * Helper function to detect the end of a 3D animation for a message
     * @param {ChatMessage.ID} targetMessageId 
     * @returns Promise<boolean>
     */
    waitFor3DAnimationByMessageID(targetMessageId) {
        function buildHook(resolve) {
            Hooks.once('diceSoNiceRollComplete', (messageId) => {
                if (targetMessageId === messageId)
                    resolve(true);
                else
                    buildHook(resolve)
            });
        }
        return new Promise((resolve, reject) => {
            if (game.dice3d && DsnSettings.CONFIG().visibility !== "none" && !game.settings.get("dice-so-nice", "immediatelyDisplayChatMessages")) {
                const message = game.messages.get(targetMessageId);
                if (message?._dice3danimating) {
                    buildHook(resolve);
                } else {
                    resolve(true);
                }
            } else {
                resolve(true);
            }
        });
    }


    /**
     *
     * @private
     */
    _beforeShow() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
        }
        this.box.cancelFade();
        this._cancelCanvasFade();
        this.canvas.style.display = "";
        this.canvas.style.opacity = "";
        this._raiseCanvas();
    }

    /**
     *
     * @private
     */
    _afterShow() {
        if (DsnSettings.CONFIG().hideAfterRoll) {
            if (DiceSFXManager.renderQueue.length) {
                clearTimeout(this.timeoutHandle);
                return;
            } else {
                this.timeoutHandle = setTimeout(() => {
                    if (!this.box.rolling) {
                        const hasPersistentDice = this.box.persistentDiceList.length > 0;
                        if (DsnSettings.CONFIG().hideFX === 'none') {
                            if (!hasPersistentDice) {
                                this.canvas.style.display = "none";
                            }
                            this.box.clearAll();
                        }
                        if (DsnSettings.CONFIG().hideFX === 'fadeOut') {
                            if (hasPersistentDice) {
                                this.box.fadeOutEphemeral(1000);
                            } else {
                                this._fadeOutCanvas(1000, () => {
                                    this.box.clearAll();
                                });
                            }
                        }
                    }
                }, DsnSettings.CONFIG().timeBeforeHide);
            }
        }
    }

    /**
     * Fade the canvas out over `duration` ms, then call `complete`.
     * @private
     */
    _fadeOutCanvas(duration, complete) {
        this._cancelCanvasFade();
        this.canvas.style.transition = `opacity ${duration}ms ease`;
        this.canvas.style.opacity = "0";
        this._canvasFadeTimer = setTimeout(() => {
            this.canvas.style.display = "none";
            this.canvas.style.transition = "";
            this.canvas.style.opacity = "";
            this._canvasFadeTimer = null;
            if (complete) complete();
        }, duration);
    }

    /**
     * Cancel any in-progress canvas fade animation.
     * @private
     */
    _cancelCanvasFade() {
        if (this._canvasFadeTimer) {
            clearTimeout(this._canvasFadeTimer);
            this._canvasFadeTimer = null;
        }
        this.canvas.style.transition = "";
    }

    _hideCanvas() {
        if (this.canvas && this.canvas.style.display !== "none") {
            this.canvas.style.display = "none";
        }
    }
}
