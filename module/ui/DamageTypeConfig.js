import { COLORSETS } from '../engine/DiceColors.js';
import { Utils } from '../Utils.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

//GM-facing damage type → dice appearance mapping editor
//world-scoped setting, opened from the main DsN config menu
export class DamageTypeConfig extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["dice-so-nice", "damage-type-config"],
        form: {
            handler: DamageTypeConfig._onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        },
        window: {
            title: "DICESONICE.DamageTypeConfigTitle",
            contentClasses: ["standard-form"],
            resizable: true
        },
        id: "damage-type-config",
        position: {
            width: 820,
            height: "auto"
        },
        actions: {
            addRow: DamageTypeConfig._onAddRow,
            deleteRow: DamageTypeConfig._onDeleteRow,
            resetRow: DamageTypeConfig._onResetRow
        }
    };

    static PARTS = {
        body: {
            template: "modules/dice-so-nice/templates/damage-type-config.hbs",
            scrollable: [".damage-type-config-table-wrap"]
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    constructor(options = {}) {
        super(options);
        //working rows carry a stable row key separate from the editable damage-type id
        //this lets the user rename a custom entry's id without breaking form field names
        //row shape: { key, id, kind, label, preset, colorset, saveName, saveOwner, isBuiltin }
        //kind: "builtin" | "dev" | "custom"
        this._rows = null;
        this._customCounter = 0;
    }

    _initRowsFromSetting() {
        const stored = game.settings.get("dice-so-nice", "damageTypeMap") ?? {};
        const df = game.dice3d.DiceFactory;
        const devRegistry = df.damageTypeDefaults;
        const builtinIds = Object.entries(COLORSETS)
            .filter(([, cs]) => cs.category === "DICESONICE.DamageTypes")
            .map(([key]) => key);

        const rows = [];
        //builtins: show the stored GM override if present, else the effective default
        for (const id of builtinIds) {
            const entry = stored[id] || {};
            const hasStored = !!(entry.preset || entry.colorset || entry.saveName);
            const eff = df.getEffectiveDamageTypeDefault(id);
            rows.push({
                key: `builtin_${id}`,
                id,
                kind: "builtin",
                label: game.i18n.localize(COLORSETS[id].description),
                preset: hasStored ? (entry.preset || "standard") : eff.preset,
                colorset: hasStored ? (entry.colorset || "") : eff.colorset,
                saveName: entry.saveName || "",
                saveOwner: entry.saveOwner || "",
                isBuiltin: true
            });
        }
        //dev rows: brand-new ids registered by a system/module, not builtin
        for (const [id, dev] of devRegistry) {
            if (builtinIds.includes(id)) continue;
            const entry = stored[id] || {};
            const hasStored = !!(entry.preset || entry.colorset || entry.saveName);
            const eff = df.getEffectiveDamageTypeDefault(id);
            rows.push({
                key: `dev_${id}`,
                id,
                kind: "dev",
                label: game.i18n.localize(dev.label || id),
                preset: hasStored ? (entry.preset || "standard") : eff.preset,
                colorset: hasStored ? (entry.colorset || "") : eff.colorset,
                saveName: entry.saveName || "",
                saveOwner: entry.saveOwner || "",
                isBuiltin: false
            });
        }

        for (const [id, entry] of Object.entries(stored)) {
            if (builtinIds.includes(id)) continue;
            if (devRegistry.has(id)) continue;
            this._customCounter++;
            rows.push({
                key: `custom_${this._customCounter}`,
                id,
                kind: "custom",
                label: entry.label || id,
                preset: entry.preset || "standard",
                colorset: entry.colorset || "",
                saveName: entry.saveName || "",
                saveOwner: entry.saveOwner || "",
                isBuiltin: false
            });
        }
        this._rows = rows;
    }

    //true when the row's live value matches its effective default
    _rowEqualsEffectiveDefault(row) {
        if (row.saveName) return false;
        const eff = game.dice3d.DiceFactory.getEffectiveDamageTypeDefault(row.id);
        return (row.preset || "standard") === eff.preset && (row.colorset || "") === eff.colorset;
    }

    async _prepareContext(options) {
        //defensive GM check on top of the menu's restricted:true
        if (!game.user.isGM) {
            throw new Error("DamageTypeConfig is GM-only");
        }

        if (!this._rows) {
            this._initRowsFromSetting();
        }

        //preset dropdown - standard comes first via prepareSystemList's sort, no blank option
        const systemList = Utils.prepareSystemList();
        const presetOptions = [];
        for (const [id, cfg] of Object.entries(systemList)) {
            presetOptions.push({ id, name: cfg.label });
        }

        //colorset dropdown - grouped by category, sorted inside each group
        const colorsetList = Utils.prepareColorsetList();
        const colorsetGroups = {};
        for (const [id, cs] of Object.entries(colorsetList)) {
            const group = cs.group || "";
            if (!colorsetGroups[group]) colorsetGroups[group] = [];
            colorsetGroups[group].push({ id, label: cs.label });
        }
        const colorsetGroupList = Object.entries(colorsetGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, items]) => ({ group, items }));

        //GM's saves for the save-as-source dropdown
        const savesObj = game.user.getFlag("dice-so-nice", "saves") ?? {};
        const saveNames = Object.keys(savesObj);

        //per-row, precompute which options are selected so the template doesn't need a comparison helper
        const renderRows = this._rows.map(r => {
            const hasSave = !!(r.saveName);
            const saveIsBroken = hasSave && !savesObj[r.saveName];
            return {
                key: r.key,
                id: r.id,
                label: r.label,
                isBuiltin: r.isBuiltin,
                kind: r.kind,
                isCustom: r.kind === "custom",
                showReset: r.kind === "builtin" || r.kind === "dev",
                resetDisabled: this._rowEqualsEffectiveDefault(r),
                presets: presetOptions.map(p => ({ ...p, selected: p.id === r.preset })),
                colorsetGroups: colorsetGroupList.map(g => ({
                    group: g.group,
                    items: g.items.map(it => ({ ...it, selected: it.id === r.colorset }))
                })),
                colorsetBlankSelected: (r.colorset === ""),
                hasPreset: r.preset !== "",
                hasColorset: r.colorset !== "",
                hasSave,
                saveIsBroken,
                saveName: r.saveName,
                saves: saveNames.map(name => ({ name, selected: name === r.saveName }))
            };
        });

        return {
            rows: renderRows,
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "DICESONICE.Save" },
                { type: "button", action: "close", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel" }
            ]
        };
    }

    _onRender(context, options) {
        const html = this.element;
        html.querySelectorAll(".damage-type-row").forEach(row => this._syncRowInterlock(row));

        //theme disables when the preset is non-standard; save disables preset+theme
        html.addEventListener("change", (ev) => {
            const target = ev.target;
            if (!(target instanceof HTMLElement)) return;
            const row = target.closest(".damage-type-row");
            if (!row) return;

            if (target.matches("select[name^='preset-']") || target.matches("select[name^='colorset-']")) {
                //changing preset or theme clears the save
                const saveSelect = row.querySelector("select[name^='save-']");
                if (saveSelect) saveSelect.value = "";
            } else if (target.matches("select[name^='save-']") && target.value) {
                //selecting a save resets preset+theme
                const presetSelect = row.querySelector("select[name^='preset-']");
                const colorsetSelect = row.querySelector("select[name^='colorset-']");
                if (presetSelect) presetSelect.value = "standard";
                if (colorsetSelect) colorsetSelect.value = "";
            }
            this._captureForm();
            this._syncRowInterlock(row);

            const r = this._rows.find(rw => rw.key === row.dataset.key);
            const resetBtn = row.querySelector("button[data-action='resetRow']");
            if (r && resetBtn) resetBtn.disabled = this._rowEqualsEffectiveDefault(r);
        });
    }

    //interlock: save disables preset+theme; non-standard preset disables theme
    _syncRowInterlock(row) {
        const presetSelect = row.querySelector("select[name^='preset-']");
        const colorsetSelect = row.querySelector("select[name^='colorset-']");
        const saveSelect = row.querySelector("select[name^='save-']");
        if (!presetSelect || !colorsetSelect) return;

        const hasSave = saveSelect && saveSelect.value;
        if (hasSave) {
            presetSelect.disabled = true;
            colorsetSelect.disabled = true;
        } else {
            presetSelect.disabled = false;
            const isStandard = (presetSelect.value || "standard") === "standard";
            colorsetSelect.disabled = !isStandard;
            if (!isStandard) {
                colorsetSelect.value = "";
            }
        }
    }

    //read the current form state back into this._rows so add/delete/interlock don't drop edits
    _captureForm() {
        if (!this._rows) return;
        const html = this.element;
        for (const r of this._rows) {
            const row = html.querySelector(`.damage-type-row[data-key='${r.key}']`);
            if (!row) continue;
            r.preset = row.querySelector(`[name='preset-${r.key}']`)?.value || "";
            r.colorset = row.querySelector(`[name='colorset-${r.key}']`)?.value || "";
            r.saveName = row.querySelector(`[name='save-${r.key}']`)?.value || "";
            r.saveOwner = r.saveName ? game.user.id : "";

            if (r.kind === "custom") {
                const labelInput = row.querySelector(`[name='label-${r.key}']`);
                if (labelInput) {
                    r.label = labelInput.value || "";
                    r.id = labelInput.value.trim().toLowerCase();
                }
            }
        }
    }

    static _onAddRow(event, target) {
        event.preventDefault();
        this._captureForm();
        this._customCounter++;
        this._rows.push({
            key: `custom_${this._customCounter}`,
            id: "",
            kind: "custom",
            label: game.i18n.localize("DICESONICE.DamageTypeNewEntry"),
            preset: "standard",
            colorset: "",
            saveName: "",
            saveOwner: "",
            isBuiltin: false
        });
        this.render();
    }

    static _onDeleteRow(event, target) {
        event.preventDefault();
        const key = target.dataset.key;
        if (!key) return;
        this._captureForm();
        this._rows = this._rows.filter(r => r.key !== key);
        this.render();
    }

    static _onResetRow(event, target) {
        event.preventDefault();
        const key = target.dataset.key;
        if (!key) return;
        this._captureForm();
        const row = this._rows.find(r => r.key === key);
        if (row) {
            //reset lands on the effective default (dev default if registered, else core)
            const eff = game.dice3d.DiceFactory.getEffectiveDamageTypeDefault(row.id);
            row.preset = eff.preset;
            row.colorset = eff.colorset;
            row.saveName = "";
            row.saveOwner = "";
        }
        this.render();
    }

    static async _onSubmit(event, form, formData) {
        this._captureForm();

        const final = {};
        for (const r of this._rows) {
            //skip rows equal to their effective default (save refs are never equal, always written)
            if (this._rowEqualsEffectiveDefault(r)) continue;
            if (r.kind === "custom" && !r.id) {
                ui.notifications.warn(game.i18n.localize("DICESONICE.DamageTypeMissingId"));
                continue;
            }
            const entry = {};
            if (r.saveName) {
                entry.saveName = r.saveName;
                entry.saveOwner = r.saveOwner || game.user.id;
            } else {
                if (r.preset && r.preset !== "standard") entry.preset = r.preset;
                if (r.colorset) entry.colorset = r.colorset;
            }

            if (r.kind === "custom" && r.label) entry.label = r.label;
            final[r.id] = entry;
        }

        await game.settings.set("dice-so-nice", "damageTypeMap", final);
        ui.notifications.info(game.i18n.localize("DICESONICE.DamageTypeConfigSaved"));
    }
}
