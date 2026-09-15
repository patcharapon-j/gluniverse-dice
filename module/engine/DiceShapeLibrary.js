import { DICE_SHAPE } from './DiceModels.js';
import { Vector3 } from 'three';

export class DiceShapeLibrary {

    static shapes = new Map();
    static builtins = new Set();

    static register(name, definition, { builtin = false } = {}) {
        if (this.shapes.has(name))
            throw new Error(`shape "${name}" is already registered`);
        this.shapes.set(name, definition);
        if (builtin)
            this.builtins.add(name);
    }

    static get(name) {
        return this.shapes.get(name) ?? null;
    }

    static has(name) {
        return this.shapes.has(name);
    }

    static isBuiltin(name) {
        return this.builtins.has(name);
    }

    static getBuiltinNames() {
        return [...this.builtins];
    }

    //the worker uses vertices as delivered and only applies the radius, 
    //so built-ins are pre-normalized here
    static getWorkerDefinition(name) {
        const def = this.shapes.get(name);
        if (!def) return null;

        const { rotationCombinations, ...workerDef } = def;
        return workerDef;
    }
}

for (const [name, data] of Object.entries(DICE_SHAPE)) {
    const definition = { ...data };
    if (definition.vertices) {
        definition.vertices = definition.vertices.map(v => {
            const n = new Vector3().fromArray(v).normalize();
            return [n.x, n.y, n.z];
        });
    }
    DiceShapeLibrary.register(name, definition, { builtin: true });
}
