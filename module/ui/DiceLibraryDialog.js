import { DiceEditor } from './DiceEditor.js';
import { DiceLibrary } from '../engine/DiceLibrary.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

//library popup - collapsible sections per die type: my dice, the world dice, other users' dice
export class DiceLibraryDialog extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        classes: ["dice-so-nice", "dice-library-dialog-app"],
        window: {
            title: "DICESONICE.diceLibrary",
            contentClasses: ["standard-form"],
            resizable: true
        },
        id: "dice-library-dialog",
        position: {
            width: 540,
            height: 500
        }
    };

    static PARTS = {
        content: {
            template: "modules/dice-so-nice/templates/dice-library-dialog.hbs",
            scrollable: [".dice-library-list"]
        }
    };

    constructor(options = {}) {
        super(options);
        this.dieType = options.diceType || options.dieType || null;
        this.diceConfig = options.diceConfig || null;
        //world role appearances can only reference world dice
        this.worldOnly = !!options.worldOnly;
    }

    _refreshConfigDropdown() {
        if (this.diceConfig) {
            this.diceConfig.refreshLibraryDropdown();
        }
    }

    async _prepareContext(options) {
        const isGM = game.user.isGM;
        const myDice = this.worldOnly ? [] : game.dice3d.diceLibrary.getAll();
        const worldDice = DiceLibrary.getWorldLibrary();

        const otherUsersData = [];
        if (!this.worldOnly) {
            for (const user of game.users) {
                if (user.id === game.user.id) continue;
                const userDice = DiceLibrary.getLibraryForUser(user);
                if (userDice.length > 0) {
                    otherUsersData.push({
                        userId: user.id,
                        userName: game.i18n.format("DICESONICE.libraryUserDice", { name: user.name }),
                        dice: userDice
                    });
                }
            }
        }

        const allTypes = new Set();
        for (const d of myDice) allTypes.add(d.dieType);
        for (const d of worldDice) allTypes.add(d.dieType);
        for (const u of otherUsersData) {
            for (const d of u.dice) allTypes.add(d.dieType);
        }

        const sortedTypes = [...allTypes].sort((a, b) => {
            const ia = DiceLibrary.LIBRARY_DIE_TYPES.indexOf(a);
            const ib = DiceLibrary.LIBRARY_DIE_TYPES.indexOf(b);
            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });

        const sections = sortedTypes.map(dieType => {
            const otherUsers = otherUsersData
                .map(u => ({
                    userId: u.userId,
                    userName: u.userName,
                    dice: u.dice.filter(d => d.dieType === dieType)
                }))
                .filter(u => u.dice.length > 0);

            return {
                dieType,
                label: dieType.toUpperCase(),
                expanded: dieType === this.dieType,
                myDice: myDice.filter(d => d.dieType === dieType),
                worldDice: worldDice.filter(d => d.dieType === dieType),
                otherUsers
            };
        });

        const dieTypeOptions = DiceLibrary.getFullDieTypes().map(t => ({
            value: t,
            label: t.toUpperCase(),
            selected: t === this.dieType
        }));

        return {
            sections,
            hasAnySections: sections.length > 0,
            dieTypeOptions,
            isGM,
            worldOnly: this.worldOnly,
            canCreate: !this.worldOnly || isGM
        };
    }

    _isWorld(target) {
        return target?.dataset.owner === DiceLibrary.WORLD_OWNER;
    }

    _getDie(id, world) {
        return world ? DiceLibrary.getFromUser(DiceLibrary.WORLD_OWNER, id) : game.dice3d.diceLibrary.get(id);
    }

    _openEditor(dieType, die, world) {
        const editor = new DiceEditor(dieType, die, {
            diceConfig: this.diceConfig,
            owner: world ? DiceLibrary.WORLD_OWNER : null,
            onSave: () => { this.render(true); this._refreshConfigDropdown(); }
        });
        editor.render(true);
    }

    async _saveCopy(die, target) {
        const copy = foundry.utils.deepClone(die);
        delete copy.id;
        copy.name = `${copy.name} (Copy)`;
        if (target === DiceLibrary.WORLD_OWNER) await DiceLibrary.saveWorldDie(copy);
        else await game.dice3d.diceLibrary.add(copy);
    }

    async _deleteDie(id, world) {
        if (world) await DiceLibrary.deleteWorldDie(id);
        else await game.dice3d.diceLibrary.delete(id);
    }

    _onRender(context, options) {
        const el = this.element;

        el.addEventListener("click", (ev) => {
            const toggleTarget = ev.target.closest("[data-action=toggleSection]");
            if (toggleTarget) {
                const section = toggleTarget.closest(".dice-library-section");
                section.classList.toggle("collapsed");
                return;
            }

            const createNewTarget = ev.target.closest("[data-action=createNew]");
            if (createNewTarget) {
                ev.stopPropagation();
                this._openEditor(createNewTarget.dataset.dieType, null, this._isWorld(createNewTarget));
                return;
            }

            const editTarget = ev.target.closest("[data-action=editDie]");
            if (editTarget) {
                const world = this._isWorld(editTarget);
                const die = this._getDie(editTarget.dataset.dieId, world);
                if (!die) return;
                this._openEditor(die.dieType, die, world);
                return;
            }

            const duplicateTarget = ev.target.closest("[data-action=duplicateDie]");
            if (duplicateTarget) {
                const world = this._isWorld(duplicateTarget);
                const die = this._getDie(duplicateTarget.dataset.dieId, world);
                if (!die) return;
                this._saveCopy(die, world ? DiceLibrary.WORLD_OWNER : null).then(() => {
                    this.render(true);
                    this._refreshConfigDropdown();
                });
                return;
            }

            const copyToWorldTarget = ev.target.closest("[data-action=copyToWorld]");
            if (copyToWorldTarget) {
                const die = game.dice3d.diceLibrary.get(copyToWorldTarget.dataset.dieId);
                if (!die) return;
                this._saveCopy(die, DiceLibrary.WORLD_OWNER).then(() => {
                    ui.notifications.info(game.i18n.format("DICESONICE.libraryCopiedToWorld", { name: die.name }));
                    this.render(true);
                    this._refreshConfigDropdown();
                });
                return;
            }

            const copyToMineTarget = ev.target.closest("[data-action=copyToMine]");
            if (copyToMineTarget) {
                const die = DiceLibrary.getFromUser(DiceLibrary.WORLD_OWNER, copyToMineTarget.dataset.dieId);
                if (!die) return;
                this._saveCopy(die, null).then(() => {
                    ui.notifications.info(game.i18n.format("DICESONICE.libraryCopiedToMine", { name: die.name }));
                    this.render(true);
                    this._refreshConfigDropdown();
                });
                return;
            }

            const duplicateOtherTarget = ev.target.closest("[data-action=duplicateOtherDie]");
            if (duplicateOtherTarget) {
                const owner = game.users.get(duplicateOtherTarget.dataset.userId);
                if (!owner) return;
                const die = DiceLibrary.getFromUser(owner, duplicateOtherTarget.dataset.dieId);
                if (!die) return;
                this._saveCopy(die, null).then(() => {
                    this.render(true);
                    this._refreshConfigDropdown();
                });
                return;
            }

            const deleteTarget = ev.target.closest("[data-action=deleteDie]");
            if (deleteTarget) {
                const world = this._isWorld(deleteTarget);
                const id = deleteTarget.dataset.dieId;
                const die = this._getDie(id, world);
                foundry.applications.api.DialogV2.confirm({
                    window: { title: game.i18n.localize("DICESONICE.Delete") },
                    content: `<p>${game.i18n.format("DICESONICE.editorDeleteConfirm", { name: die?.name || "die" })}</p>`
                }).then(confirmed => {
                    if (!confirmed) return;
                    this._deleteDie(id, world).then(() => {
                        game.dice3d.box.dicefactory.disposeCachedMaterials();
                        this.render(true);
                        this._refreshConfigDropdown();
                    });
                });
                return;
            }

            const createFromFooterTarget = ev.target.closest("[data-action=createFromFooter]");
            if (createFromFooterTarget) {
                const dieType = el.querySelector("[data-footer-dietype]").value;
                if (!dieType) return;
                this._openEditor(dieType, null, this._isWorld(createFromFooterTarget));
                return;
            }
        });

        if (this.dieType) {
            const target = el.querySelector(`.dice-library-section[data-die-type="${this.dieType}"]`);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    }
}
