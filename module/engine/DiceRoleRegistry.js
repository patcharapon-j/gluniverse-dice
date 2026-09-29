import {COLORSETS} from './DiceColors.js';
import {DiceLibrary} from './DiceLibrary.js';
import {Utils} from '../Utils.js';

//roles known to DSN: builtin damage types, roles registered by packages, world overrides
export class DiceRoleRegistry {
	constructor(){
		this._builtinRoles = null;
		this._registeredRoles = new Map();
		this._mergedRoles = null;
		this._denominationRoles = null;
	}

	_buildBuiltinRoles(){
		const roles = new Map();
		roles.set("basic", {
			id: "basic",
			label: "DICESONICE.RoleBasic",
			group: null,
			origin: "builtin",
			package: null,
			customizable: true,
			optional: false,
			dieTypes: null,
			denominations: [],
			defaults: {},
			detectors: {modifiers: [], types: []}
		});
		for(const [id, cs] of Object.entries(COLORSETS)){
			if(cs.category !== "DICESONICE.DamageTypes") continue;
			roles.set(id, {
				id,
				label: cs.description ?? cs.name ?? id,
				group: "DICESONICE.DamageTypes",
				origin: "builtin",
				package: null,
				customizable: false,
				optional: true,
				dieTypes: null,
				denominations: [],
				defaults: {global: {colorset: id}},
				detectors: {modifiers: [], types: [id]}
			});
		}
		return roles;
	}

	_normalizeDetectors(detectors){
		const modifiers = Array.isArray(detectors?.modifiers) ? detectors.modifiers : [];
		const types = Array.isArray(detectors?.types) ? detectors.types : [];
		return {
			modifiers: [...new Set(modifiers.filter(m => typeof m === "string" && m.length).map(m => m.toLowerCase()))],
			types: [...new Set(types.filter(t => typeof t === "string" && t.length))]
		};
	}

	_cloneRole(role){
		return foundry.utils.deepClone(role);
	}

	_applyRegistered(target, reg){
		if(reg.label !== undefined) target.label = reg.label;
		if(reg.group !== undefined) target.group = reg.group;
		if(reg.customizable !== undefined) target.customizable = reg.customizable;
		if(reg.optional !== undefined) target.optional = reg.optional;
		if(reg.dieTypes !== undefined) target.dieTypes = reg.dieTypes ? [...reg.dieTypes] : null;
		if(reg.package) target.package = reg.package;
		target.denominations = [...new Set([...target.denominations, ...reg.denominations])];
		target.detectors.modifiers = [...new Set([...target.detectors.modifiers, ...reg.detectors.modifiers])];
		target.detectors.types = [...new Set([...target.detectors.types, ...reg.detectors.types])];
		target.defaults = foundry.utils.mergeObject(target.defaults ?? {}, this._cloneRole(reg.defaults), {inplace: false});
	}

	//merged view: builtin < registered < world roles setting
	_buildRoles(){
		if(!this._builtinRoles) this._builtinRoles = this._buildBuiltinRoles();
		const merged = new Map();
		for(const [id, role] of this._builtinRoles) merged.set(id, this._cloneRole(role));
		for(const [id, reg] of this._registeredRoles){
			let target = merged.get(id);
			if(!target){
				target = {
					id,
					label: id,
					group: null,
					origin: "registered",
					package: null,
					customizable: false,
					optional: false,
					dieTypes: null,
					denominations: [],
					defaults: {},
					detectors: {modifiers: [], types: []}
				};
				merged.set(id, target);
			}
			this._applyRegistered(target, reg);
		}
		let world = {};
		try {
			world = game.settings.get("dice-so-nice", "roles") ?? {};
		} catch(e) {
			world = {};
		}
		for(const [id, override] of Object.entries(world)){
			if(!override || typeof override !== "object") continue;
			const existing = merged.get(id);
			if(existing){
				//detectors are unioned so a world override never drops what the package declared
				if(override.label !== undefined) existing.label = override.label;
				if(override.group !== undefined) existing.group = override.group;
				if(override.customizable !== undefined) existing.customizable = !!override.customizable;
				if(override.optional !== undefined) existing.optional = !!override.optional;
				if(override.detectors !== undefined){
					const extra = this._normalizeDetectors(override.detectors);
					existing.detectors = {
						modifiers: [...new Set([...(existing.detectors?.modifiers ?? []), ...extra.modifiers])],
						types: [...new Set([...(existing.detectors?.types ?? []), ...extra.types])]
					};
				}
				if(override.deleted !== undefined) existing.deleted = !!override.deleted;
			} else {
				merged.set(id, {
					id,
					label: override.label ?? id,
					group: override.group ?? null,
					origin: "custom",
					package: null,
					customizable: !!override.customizable,
					optional: override.optional ?? true,
					dieTypes: null,
					denominations: [],
					defaults: {},
					detectors: this._normalizeDetectors(override.detectors),
					deleted: !!override.deleted
				});
			}
		}
		return merged;
	}

	invalidateRoles(){
		this._mergedRoles = null;
		this._denominationRoles = null;
	}

	get roles(){
		if(!this._mergedRoles) this._mergedRoles = this._buildRoles();
		return this._mergedRoles;
	}

	getRole(id){
		if(!id) return undefined;
		return this.roles.get(id);
	}

	getRoles({customizable, includeDeleted = false} = {}){
		const list = [...this.roles.values()].filter(role => {
			if(!includeDeleted && role.deleted) return false;
			if(customizable !== undefined && !!role.customizable !== !!customizable) return false;
			return true;
		});
		const loc = (str) => game.i18n?.localize?.(str ?? "") ?? (str ?? "");
		list.sort((a, b) => {
			if(a.id === "basic") return -1;
			if(b.id === "basic") return 1;
			const ga = loc(a.group), gb = loc(b.group);
			if(ga !== gb) return ga.localeCompare(gb);
			return loc(a.label).localeCompare(loc(b.label));
		});
		return list;
	}

	//the token only reaches DSN if a term class declares it, so warn the author at registration
	_isKnownModifier(token){
		const has = (cls) => {
			const mods = cls?.MODIFIERS;
			return !!mods && Object.keys(mods).some(k => k.toLowerCase() === token);
		};
		if(has(foundry?.dice?.terms?.Die)) return true;
		for(const cls of Object.values(CONFIG?.Dice?.terms ?? {})){
			if(has(cls)) return true;
		}
		return false;
	}

	addRole(role, {package: packageId = null} = {}){
		if(!role || typeof role.id !== "string" || !role.id.length){
			console.warn(`Dice So Nice! | addRole: a role needs a string id`);
			return;
		}
		const id = role.id;
		const entry = this._registeredRoles.get(id) ?? {id, package: null, denominations: [], defaults: {}, detectors: {modifiers: [], types: []}};
		if(role.label !== undefined) entry.label = role.label;
		if(role.group !== undefined) entry.group = role.group;
		if(role.customizable !== undefined) entry.customizable = !!role.customizable;
		if(role.optional !== undefined) entry.optional = !!role.optional;
		if(role.dieTypes !== undefined) entry.dieTypes = Array.isArray(role.dieTypes) ? [...role.dieTypes] : null;
		if(Array.isArray(role.denominations)){
			//a denomination already listed by another role is ignored
			const taken = new Set([...this._registeredRoles.values()].filter(other => other.id !== id).flatMap(other => other.denominations));
			entry.denominations = [...new Set([...entry.denominations, ...role.denominations.filter(d => !taken.has(d))])];
		}
		if(role.detectors){
			const incoming = this._normalizeDetectors(role.detectors);
			for(const token of incoming.modifiers){
				if(!this._isKnownModifier(token))
					console.warn(`Dice So Nice! | addRole: role "${id}" (package "${packageId ?? "unknown"}") declares modifier "${token}" but no dice term class declares it, the detector will never match`);
			}
			entry.detectors.modifiers = [...new Set([...entry.detectors.modifiers, ...incoming.modifiers])];
			entry.detectors.types = [...new Set([...entry.detectors.types, ...incoming.types])];
		}
		if(role.defaults && typeof role.defaults === "object"){
			for(const [slot, fields] of Object.entries(role.defaults)){
				if(!fields || typeof fields !== "object") continue;
				entry.defaults[slot] = foundry.utils.mergeObject(entry.defaults[slot] ?? {}, fields, {inplace: false});
			}
		}
		if(packageId) entry.package = packageId;
		this._registeredRoles.set(id, entry);
		this.invalidateRoles();
	}

	//role of each listed denomination, deleted roles are left out
	get denominationRoles(){
		if(!this._denominationRoles){
			this._denominationRoles = new Map();
			for(const role of this.roles.values()){
				if(role.deleted) continue;
				for(const denom of role.denominations ?? []) this._denominationRoles.set(denom, role.id);
			}
		}
		return this._denominationRoles;
	}

	getDenominationRole(denomination){
		return this.denominationRoles.get(denomination);
	}

	//these die types are never rolled, their dice use the regular die of their size
	getHiddenDieTypes(){
		return new Set([...this.denominationRoles.keys()].map(denom => "d" + denom));
	}

	resolveRoleSlot(roleContext, roleId, dieType){
		const ctx = roleContext?.[roleId];
		if(!ctx || typeof ctx !== "object") return null;
		const slot = {};
		const apply = (src, ownerId) => {
			if(!src || typeof src !== "object") return;
			for(const [key, value] of Object.entries(src)){
				if(value === "" || value === null || value === undefined) continue;
				if(key === "libraryDieOwner") continue;
				if(key === "libraryDieId"){
					slot.libraryDieId = value;
					if(src.libraryDieOwner) slot.libraryDieOwner = src.libraryDieOwner;
					else if(ownerId) slot.libraryDieOwner = ownerId;
					else delete slot.libraryDieOwner;
					continue;
				}
				slot[key] = (typeof value === "object") ? foundry.utils.deepClone(value) : value;
			}
		};
		const layers = [[ctx.defaults, null], [ctx.world, null]];
		if(ctx.customizable) layers.push([ctx.player, ctx.userId ?? null]);
		for(const [layer, ownerId] of layers){
			apply(layer?.global, ownerId);
			apply(layer?.[dieType], ownerId);
		}
		Utils.sanitizeAppearance({[dieType]: slot});
		if(slot.libraryDieId){
			const owner = DiceLibrary.resolveOwner(slot.libraryDieOwner);
			const die = owner ? DiceLibrary.getFromUser(owner, slot.libraryDieId) : null;
			if(!die || die.dieType !== dieType){
				delete slot.libraryDieId;
				delete slot.libraryDieOwner;
			}
		}
		return slot;
	}

	//roll-level options are merged down into dice terms by Dice3D before we get here
	detectRole(dsnDie){
		try {
			const options = dsnDie?.options ?? {};
			if(typeof options.dsnRole === "string" && options.dsnRole !== "") return options.dsnRole;
			//dsnDamageType / dsnDamageTypeManaged are obsolete, use dsnRole / dsnRoleManaged
			if(typeof options.dsnDamageType === "string" && options.dsnDamageType !== "") return options.dsnDamageType;
			const denominationRole = this.getDenominationRole(dsnDie?.termDenomination);
			if(denominationRole) return denominationRole;
			const managed = !!(options.dsnRoleManaged || options.dsnDamageTypeManaged);
			const roles = [...this.roles.values()].filter(role => !role.deleted);
			for(const token of dsnDie?.termModifiers ?? []){
				if(typeof token !== "string") continue;
				const key = token.toLowerCase().match(/^([a-z]+)/)?.[1];
				if(!key) continue;
				const match = roles.find(role => role.detectors?.modifiers?.includes(key));
				if(match) return match.id;
			}
			if(managed) return "basic";
			for(const value of [options.type, options.flavor]){
				if(typeof value !== "string" || value === "") continue;
				const match = roles.find(role => role.detectors?.types?.includes(value));
				if(match) return match.id;
				if(COLORSETS[value]?.category === "DICESONICE.DamageTypes") return value;
			}
		} catch(e) {
			console.warn("Dice So Nice! | detectRole failed, falling back to basic", e);
		}
		return "basic";
	}
}
