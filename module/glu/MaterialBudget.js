// GLUniverse Dice: keep the board's dice materials within a texture budget.
//
// DiceFactory caches one material per die type and appearance and never evicts it. A colour set
// with random colour arrays (fire, ice, poison, ...: a third of the built-in sets) resolves new
// colours on every roll, so each roll built new materials: about 20 MB of textures for a d6
// atlas, about 80 MB for a d20, kept for the whole session. GPU memory grew by hundreds of MB per
// roll. Past the budget, the oldest board materials that nothing shows are disposed (a die that
// needs one again rebuilds it, cheaply since NormalMapMemo.js).
//
// Called from DiceFactory.createMaterial, right after a material is cached.
import { CanvasTexture } from 'three';
import { retireMaterial } from './ProgramKeeper.js';

const BUDGET_BYTES = 768 * 1024 * 1024;
//a material this young may belong to dice still being built (a hand opening, a throw starting)
const YOUNG_MS = 10000;
const born = new WeakMap();

export function trimMaterialCache(factory, key) {
    const cache = factory?.baseMaterialCache;
    if (!cache) return;
    const now = performance.now();
    if (cache[key]) born.set(cache[key], now);
    const keys = Object.keys(cache).filter(k => k.startsWith("board"));
    const sizes = new Map();
    let total = 0;
    for (const k of keys) {
        const bytes = materialBytes(cache[k]);
        sizes.set(k, bytes);
        total += bytes;
    }
    if (total <= BUDGET_BYTES) return;
    const used = materialsInUse();
    const renderer = game.dice3d?.box?.renderer;
    //insertion order: the oldest first
    for (const k of keys) {
        if (total <= BUDGET_BYTES) break;
        const mat = cache[k];
        if (k === key || used.has(mat) || now - (born.get(mat) ?? 0) < YOUNG_MS) continue;
        delete cache[k];
        disposeMaterial(renderer, mat);
        total -= sizes.get(k);
    }
}

function textures(mat) {
    const list = [mat.map, mat.normalMap, mat.emissiveMap, mat.transmissionMap,
        mat.userData?.heightMap, mat.userData?.detailNormalMap, mat.userData?.emissiveMapFull,
        mat.userData?.gluNumberMask, mat.userData?.gluLabelMask];
    return [...new Set(list.filter(t => t instanceof CanvasTexture))];
}

function materialBytes(mat) {
    let bytes = 0;
    for (const t of textures(mat)) {
        const img = t.image;
        const px = (img?.width || 0) * (img?.height || 0);
        bytes += px * 4 * (t.generateMipmaps ? 4 / 3 : 1);
    }
    return bytes;
}

// What the board shows or is about to: its scene (thrown dice, persistent dice, the hand, a
// burn), and the throw's dice that are not spawned yet.
function materialsInUse() {
    const used = new Set();
    const one = (m) => {
        if (!m) return;
        used.add(m);
        if (m.gluBurnOf) used.add(m.gluBurnOf);
    };
    const add = (o) => {
        const m = o?.material;
        if (Array.isArray(m)) m.forEach(one);
        else one(m);
    };
    const box = game.dice3d?.box;
    box?.scene?.traverse(add);
    for (const list of [box?.throwEngine?.diceList, box?.throwEngine?.deadDiceList]) {
        for (const die of list ?? []) die.traverse ? die.traverse(add) : add(die);
    }
    return used;
}

// As DiceFactory.disposeCachedMaterials, plus the masks our materials add.
function disposeMaterial(renderer, mat) {
    for (const t of textures(mat)) t.dispose();
    retireMaterial(renderer, mat);
}
