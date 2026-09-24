import { Utils } from '../Utils.js';
import { DiceConfig } from './DiceConfig.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const QUICK_KEYS = ["colorset", "system"];
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export class DiceRolesConfig extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["dice-so-nice", "dice-roles-config"],
        form: {
            handler: DiceRolesConfig._onSubmit,
            submitOnChange: false,
            closeOnSubmit: true
        },
        window: {
            title: "DICESONICE.DiceRolesConfigTitle",
            contentClasses: ["standard-form"],
            resizable: true
        },
        id: "dice-roles-config",
        position: {
            width: 1080,
            height: "auto"
        },
        actions: {
            addRow: DiceRolesConfig._onAddRow,
            editRow: DiceRolesConfig._onEditRow,
            deleteRow: DiceRolesConfig._onDeleteRow,
            restoreRow: DiceRolesConfig._onRestoreRow,
            resetRow: DiceRolesConfig._onResetRow,
            editAppearance: DiceRolesConfig._onEditAppearance
        }
    };

    static PARTS = {
        body: {
            template: "modules/dice-so-nice/templates/dice-roles-config.hbs",
            scrollable: [".dice-roles-config-table-wrap"]
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    };

    constructor(options = {}) {
        super(options);
        this._rows = null;
        this._removedIds = [];
        this._customCounter = 0;
    }

    static isCustomScope(scope) {
        if (!scope || typeof scope !== "object") return false;
        for (const [slot, value] of Object.entries(scope)) {
            if (slot !== "global") return true;
            if (!value || typeof value !== "object") continue;
            if (Object.keys(value).some(k => !QUICK_KEYS.includes(k))) return true;
        }
        return false;
    }

    //blank means inherit from the player's basic appearance
    _quickDefaults(role) {
        const global = role?.defaults?.global ?? {};
        return { colorset: global.colorset || "", system: global.system || "" };
    }

    _rowFromRole(role, scopes) {
        const scope = scopes[role.id];
        const def = this._quickDefaults(role);
        const global = scope?.global ?? {};
        return {
            key: role.origin === "custom" ? `custom_${++this._customCounter}` : `${role.origin}_${role.id}`,
            id: role.id,
            origId: role.id,
            origin: role.origin,
            package: role.package,
            group: role.group,
            label: role.label,
            customizable: !!role.customizable,
            customizableInitial: !!role.customizable,
            optional: !!role.optional,
            optionalInitial: !!role.optional,
            modifiers: [...(role.detectors?.modifiers ?? [])],
            typesText: (role.detectors?.types ?? []).join(", "),
            deleted: !!role.deleted,
            colorset: global.colorset ?? def.colorset,
            system: global.system ?? def.system,
            isCustomScope: DiceRolesConfig.isCustomScope(scope),
            defaults: def
        };
    }

    _initRows() {
        const diceFactory = game.dice3d.DiceFactory;
        const scopes = game.settings.get("dice-so-nice", "roleScopes") ?? {};
        this._rows = diceFactory.getRoles({ includeDeleted: true })
            .filter(role => role.id !== "basic")
            .map(role => this._rowFromRole(role, scopes));
        this._removedIds = [];
    }

    reloadScope(id) {
        if (!this._rows) return;
        const row = this._rows.find(r => r.id === id);
        const role = game.dice3d.DiceFactory.getRole(id);
        if (!row || !role) return;
        this._captureForm();
        const scopes = game.settings.get("dice-so-nice", "roleScopes") ?? {};
        const fresh = this._rowFromRole(role, scopes);
        row.colorset = fresh.colorset;
        row.system = fresh.system;
        row.isCustomScope = fresh.isCustomScope;
        this.render();
    }

    _rowEqualsDefault(row) {
        if (row.isCustomScope) return false;
        return (row.system || "") === row.defaults.system && (row.colorset || "") === row.defaults.colorset;
    }

    async _prepareContext(options) {
        if (!game.user.isGM) {
            throw new Error("DiceRolesConfig is GM-only");
        }

        if (!this._rows) {
            this._initRows();
        }

        const presetOptions = (row) => Object.entries(Utils.prepareSystemList(row.id, row.system)).map(([id, cfg]) => ({ id, name: cfg.label }));

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

        const originLabels = {
            builtin: game.i18n.localize("DICESONICE.DiceRolesOriginBuiltin"),
            registered: game.i18n.localize("DICESONICE.DiceRolesOriginRegistered"),
            custom: game.i18n.localize("DICESONICE.DiceRolesOriginCustom")
        };

        const renderRows = this._rows.map(r => {
            const isCustom = r.origin === "custom";
            return {
                key: r.key,
                id: r.id,
                label: isCustom ? (r.label || r.id) : game.i18n.localize(r.label || r.id),
                group: r.group ? game.i18n.localize(r.group) : "",
                origin: originLabels[r.origin] ?? r.origin,
                package: r.package || "",
                isCustom,
                deleted: r.deleted,
                customizable: r.customizable,
                optional: r.optional,
                modifiers: r.modifiers,
                hasModifiers: r.modifiers.length > 0,
                typesText: r.typesText,
                isCustomScope: r.isCustomScope,
                presets: presetOptions(r).map(p => ({ ...p, selected: !r.isCustomScope && p.id === r.system })),
                presetBlankSelected: !r.isCustomScope && !r.system,
                colorsetGroups: colorsetGroupList.map(g => ({
                    group: g.group,
                    items: g.items.map(it => ({ ...it, selected: !r.isCustomScope && it.id === r.colorset }))
                })),
                colorsetBlankSelected: !r.isCustomScope && r.colorset === "",
                resetDisabled: this._rowEqualsDefault(r),
                appearanceDisabled: isCustom && !r.origId
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
        html.querySelectorAll(".dice-roles-row").forEach(row => this._syncRowInterlock(row));

        html.addEventListener("change", async (ev) => {
            const target = ev.target;
            if (!(target instanceof HTMLElement)) return;
            const row = target.closest(".dice-roles-row");
            if (!row) return;
            const r = this._rows.find(rw => rw.key === row.dataset.key);
            if (!r) return;

            const isQuick = target.matches("select[name^='preset-']") || target.matches("select[name^='colorset-']");
            if (isQuick && r.isCustomScope) {
                //leaving the custom state replaces the whole scope with the quick values, so ask first
                const confirmed = await foundry.applications.api.DialogV2.confirm({
                    window: { title: game.i18n.localize("DICESONICE.DiceRolesCustomConfirmTitle") },
                    content: game.i18n.format("DICESONICE.DiceRolesCustomConfirmContent", { role: r.id }),
                    yes: { default: false }
                });
                if (!confirmed) {
                    target.value = "custom";
                    return;
                }
                r.isCustomScope = false;
                row.querySelectorAll("option[value='custom']").forEach(opt => opt.remove());
                const other = target.matches("select[name^='preset-']")
                    ? row.querySelector("select[name^='colorset-']")
                    : row.querySelector("select[name^='preset-']");
                if (other && other.value === "custom") other.value = "";
            }
            this._captureForm();
            this._syncRowInterlock(row);

            const resetBtn = row.querySelector("button[data-action='resetRow']");
            if (resetBtn) resetBtn.disabled = this._rowEqualsDefault(r);
        });
    }

    _syncRowInterlock(row) {
        const presetSelect = row.querySelector("select[name^='preset-']");
        const colorsetSelect = row.querySelector("select[name^='colorset-']");
        if (!presetSelect || !colorsetSelect) return;
        if (presetSelect.value === "custom") {
            colorsetSelect.disabled = false;
            return;
        }
        const isStandard = (presetSelect.value || "standard") === "standard";
        colorsetSelect.disabled = !isStandard;
        if (!isStandard && colorsetSelect.value !== "custom") {
            colorsetSelect.value = "";
        }
    }

    _captureForm() {
        if (!this._rows) return;
        const html = this.element;
        if (!html) return;
        for (const r of this._rows) {
            const row = html.querySelector(`.dice-roles-row[data-key='${r.key}']`);
            if (!row) continue;
            if (r.isCustomScope) continue;
            const preset = row.querySelector(`[name='preset-${r.key}']`)?.value;
            const colorset = row.querySelector(`[name='colorset-${r.key}']`)?.value;
            if (preset !== undefined && preset !== "custom") r.system = preset || "";
            if (colorset !== undefined && colorset !== "custom") r.colorset = colorset || "";
        }
    }

    _idError(id, row) {
        if (!id) return game.i18n.localize("DICESONICE.DiceRolesMissingId");
        if (!ID_PATTERN.test(id)) return game.i18n.format("DICESONICE.DiceRolesInvalidId", { id });
        if (id === "basic" || this._rows.some(other => other !== row && other.id === id))
            return game.i18n.format("DICESONICE.DiceRolesDuplicateId", { id });
        return null;
    }

    //one dialog for creating and editing a role, reopened with the entered values until they validate
    async _roleSettingsDialog(row) {
        const isCustom = row.origin === "custom";
        let values = { label: row.label, id: row.id, typesText: row.typesText, customizable: row.customizable, optional: row.optional };
        while (true) {
            const content = await foundry.applications.handlebars.renderTemplate("modules/dice-so-nice/templates/dice-role-settings.hbs", {
                isCustom,
                label: isCustom ? values.label : game.i18n.localize(row.label || row.id),
                id: values.id,
                typesText: values.typesText,
                customizable: values.customizable,
                optional: values.optional
            });
            const result = await foundry.applications.api.DialogV2.wait({
                classes: ["dice-so-nice"],
                window: { title: row.origId || !isCustom ? "DICESONICE.DiceRolesSettings" : "DICESONICE.DiceRolesNewEntry" },
                position: { width: 640 },
                content,
                buttons: [
                    { action: "ok", icon: "fa-solid fa-check", label: "DICESONICE.Ok", default: true,
                      callback: (event, button) => new foundry.applications.ux.FormDataExtended(button.form).object },
                    { action: "cancel", icon: "fa-solid fa-ban", label: "DICESONICE.Cancel" }
                ],
                rejectClose: false
            });
            if (!result || result === "cancel") return null;
            values = {
                label: isCustom ? (result.label ?? "").trim() : row.label,
                id: isCustom ? (result.id ?? "").trim().toLowerCase() : row.id,
                typesText: isCustom ? (result.types ?? "") : row.typesText,
                customizable: !!result.customizable,
                optional: !!result.optional
            };
            if (!isCustom) return values;
            if (!values.id) values.id = values.label.slugify({ strict: true });
            const error = this._idError(values.id, row);
            if (!error) return values;
            ui.notifications.warn(error);
        }
    }

    static async _onAddRow(event, target) {
        event.preventDefault();
        this._captureForm();
        const row = {
            key: `custom_${++this._customCounter}`,
            id: "",
            origId: null,
            origin: "custom",
            package: null,
            group: null,
            label: "",
            customizable: false,
            customizableInitial: false,
            optional: true,
            optionalInitial: true,
            modifiers: [],
            typesText: "",
            deleted: false,
            colorset: "",
            system: "",
            isCustomScope: false,
            defaults: { colorset: "", system: "" }
        };
        const values = await this._roleSettingsDialog(row);
        if (!values) return;
        Object.assign(row, values);
        this._rows.push(row);
        this.render();
    }

    static async _onEditRow(event, target) {
        event.preventDefault();
        this._captureForm();
        const row = this._rows.find(r => r.key === target.dataset.key);
        if (!row) return;
        const values = await this._roleSettingsDialog(row);
        if (!values) return;
        Object.assign(row, values);
        this.render();
    }

    static async _onDeleteRow(event, target) {
        event.preventDefault();
        const key = target.dataset.key;
        if (!key) return;
        this._captureForm();
        const row = this._rows.find(r => r.key === key);
        if (!row) return;
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize("DICESONICE.DiceRolesDeleteConfirmTitle") },
            content: game.i18n.format("DICESONICE.DiceRolesDeleteConfirmContent", { role: row.id || row.label }),
            yes: { default: true }
        });
        if (!confirmed) return;
        if (row.origin === "custom") {
            if (row.origId) this._removedIds.push(row.origId);
            this._rows = this._rows.filter(r => r.key !== key);
        } else {
            row.deleted = true;
            row.isCustomScope = false;
            row.colorset = row.defaults.colorset;
            row.system = row.defaults.system;
        }
        this.render();
    }

    static _onRestoreRow(event, target) {
        event.preventDefault();
        this._captureForm();
        const row = this._rows.find(r => r.key === target.dataset.key);
        if (row) row.deleted = false;
        this.render();
    }

    static async _onResetRow(event, target) {
        event.preventDefault();
        this._captureForm();
        const row = this._rows.find(r => r.key === target.dataset.key);
        if (!row) return;
        if (row.isCustomScope) {
            const confirmed = await foundry.applications.api.DialogV2.confirm({
                window: { title: game.i18n.localize("DICESONICE.DiceRolesResetConfirmTitle") },
                content: game.i18n.format("DICESONICE.DiceRolesResetConfirmContent", { role: row.id }),
                yes: { default: false }
            });
            if (!confirmed) return;
        }
        row.isCustomScope = false;
        row.colorset = row.defaults.colorset;
        row.system = row.defaults.system;
        this.render();
    }

    //open the dice settings on the role's world scope. the scope is keyed by the stored id, so an unsaved
    //or renamed custom row has to go through the table save first
    static _onEditAppearance(event, target) {
        event.preventDefault();
        this._captureForm();
        const row = this._rows.find(r => r.key === target.dataset.key);
        if (!row || row.deleted) return;
        if (row.origin === "custom" && (!row.origId || row.origId !== row.id)) {
            ui.notifications.warn(game.i18n.localize("DICESONICE.DiceRolesSaveBeforeAppearance"));
            return;
        }
        const id = row.id;
        const existing = foundry.applications.instances.get(`dice-config-role-${id}`);
        if (existing) {
            existing.render({ force: true });
            return;
        }
        new DiceConfig({ roleId: id, onScopeSaved: (roleId) => this.reloadScope(roleId) }).render({ force: true });
    }

    _parseTypes(text, id) {
        const types = [];
        for (const part of (text || "").split(",")) {
            const type = part.trim();
            if (type && !types.includes(type)) types.push(type);
        }
        return types.length ? types : [id];
    }

    async _migrateScopes(renames, removals) {
        const documents = [...game.users];
        for (const uuid of game.settings.get("dice-so-nice", "documentsForPreload") ?? []) {
            const doc = foundry.utils.fromUuidSync(uuid);
            if (doc?.getFlag) documents.push(doc);
        }
        for (const doc of documents) {
            const stored = doc.getFlag("dice-so-nice", "roleAppearance");
            if (!stored) continue;
            const update = {};
            for (const [oldId, newId] of renames) {
                if (!(oldId in stored)) continue;
                update[oldId] = new foundry.data.operators.ForcedDeletion();
                update[newId] = foundry.utils.deepClone(stored[oldId]);
            }
            for (const id of removals) {
                if (id in stored) update[id] = new foundry.data.operators.ForcedDeletion();
            }
            if (foundry.utils.isEmpty(update)) continue;
            await doc.setFlag("dice-so-nice", "roleAppearance", update);
        }
    }

    _validateCustomRows() {
        for (const row of this._rows) {
            if (row.origin !== "custom") continue;
            const error = this._idError(row.id, row);
            if (error) {
                ui.notifications.warn(error);
                return false;
            }
        }
        return true;
    }

    _customRoleEntry(row, storedRoles) {
        const entry = foundry.utils.deepClone(storedRoles[row.origId] ?? {});
        entry.label = row.label || row.id;
        entry.customizable = row.customizable;
        entry.optional = row.optional;
        entry.detectors = { types: this._parseTypes(row.typesText, row.id) };
        delete entry.deleted;
        return entry;
    }

    //builtin and registered roles only store what the GM changed
    _roleOverrideEntry(row, storedRoles) {
        const entry = foundry.utils.deepClone(storedRoles[row.id] ?? {});
        if (row.customizable !== row.customizableInitial) entry.customizable = row.customizable;
        if (row.optional !== row.optionalInitial) entry.optional = row.optional;
        if (row.deleted) entry.deleted = true;
        else delete entry.deleted;
        return Object.keys(entry).length ? entry : null;
    }

    _worldScope(row, storedScopes) {
        if (row.deleted) return null;
        if (row.isCustomScope) return foundry.utils.deepClone(storedScopes[row.origId] ?? null);
        if (this._rowEqualsDefault(row)) return null;
        const global = {};
        if (row.system) global.system = row.system;
        if (row.colorset) global.colorset = row.colorset;
        return Object.keys(global).length ? { global } : null;
    }

    static async _onSubmit(event, form, formData) {
        this._captureForm();
        if (!this._validateCustomRows()) return;

        const storedRoles = game.settings.get("dice-so-nice", "roles") ?? {};
        const storedScopes = game.settings.get("dice-so-nice", "roleScopes") ?? {};
        const roles = foundry.utils.deepClone(storedRoles);
        const scopes = foundry.utils.deepClone(storedScopes);
        const renames = [];

        for (const id of this._removedIds) {
            delete roles[id];
            delete scopes[id];
        }
        for (const row of this._rows) {
            if (row.origin !== "custom" || !row.origId || row.origId === row.id) continue;
            renames.push([row.origId, row.id]);
            delete roles[row.origId];
            delete scopes[row.origId];
        }
        for (const row of this._rows) {
            const entry = row.origin === "custom" ? this._customRoleEntry(row, storedRoles) : this._roleOverrideEntry(row, storedRoles);
            if (entry) roles[row.id] = entry;
            else delete roles[row.id];

            const scope = this._worldScope(row, storedScopes);
            if (scope) scopes[row.id] = scope;
            else delete scopes[row.id];
        }

        await game.settings.set("dice-so-nice", "roles", roles);
        await game.settings.set("dice-so-nice", "roleScopes", scopes);
        if (renames.length || this._removedIds.length) await this._migrateScopes(renames, this._removedIds);
        game.dice3d.DiceFactory.invalidateRoles();
        ui.notifications.info(game.i18n.localize("DICESONICE.DiceRolesConfigSaved"));
    }
}
