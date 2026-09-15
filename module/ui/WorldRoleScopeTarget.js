//document-like target over one world role scope
export class WorldRoleScopeTarget {
    constructor(roleId) {
        this.roleId = roleId;
    }

    get id() {
        return `role-${this.roleId}`;
    }

    get name() {
        const role = game.dice3d?.DiceFactory?.getRole(this.roleId);
        if (!role) return this.roleId;
        return role.origin === "custom" ? (role.label || this.roleId) : game.i18n.localize(role.label || this.roleId);
    }

    _readScopes() {
        return foundry.utils.deepClone(game.settings.get("dice-so-nice", "roleScopes") ?? {});
    }

    _isRoleKey(scope, key) {
        return scope === "dice-so-nice" && key === "roleAppearance";
    }

    getFlag(scope, key) {
        if (!this._isRoleKey(scope, key)) return undefined;
        const stored = this._readScopes()[this.roleId];
        return stored ? { [this.roleId]: stored } : undefined;
    }

    async setFlag(scope, key, value) {
        if (!this._isRoleKey(scope, key)) return;
        const scopes = this._readScopes();
        const next = value?.[this.roleId];
        if (next && !foundry.utils.isEmpty(next)) scopes[this.roleId] = next;
        else delete scopes[this.roleId];
        await game.settings.set("dice-so-nice", "roleScopes", scopes);
    }

    async unsetFlag(scope, key) {
        if (!this._isRoleKey(scope, key)) return;
        const scopes = this._readScopes();
        if (!(this.roleId in scopes)) return;
        delete scopes[this.roleId];
        await game.settings.set("dice-so-nice", "roleScopes", scopes);
    }
}
