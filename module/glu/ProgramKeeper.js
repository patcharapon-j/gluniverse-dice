// GLUniverse Dice: dispose a per-roll material without losing its compiled shaders.
//
// The burn and the settle glow make new materials for every die of every roll. three.js deletes a
// shader program when the last material using it is disposed, so each roll compiled the same
// programs again in the middle of its animation (8 per roll), a hitch on a weak GPU. Not
// disposing them is no answer: three.js keeps every ShaderMaterial in a Map until it is disposed.
// So the first material to use a program is kept as that program's keeper (one per program, per
// renderer) and every other one is disposed as before. A rebuilt board has a new renderer, and
// the old one's keepers go with it.
const keepers = new WeakMap();

export function retireMaterial(renderer, material) {
    if (!material) return;
    let keep = false;
    //three.js records each program a material was drawn with, by program cache key
    const programs = renderer?.properties?.get?.(material)?.programs;
    if (programs?.size) {
        let kept = keepers.get(renderer);
        if (!kept) keepers.set(renderer, kept = new Set());
        for (const key of programs.keys()) {
            if (kept.has(key)) continue;
            kept.add(key);
            keep = true;
        }
    }
    if (!keep) material.dispose();
}
