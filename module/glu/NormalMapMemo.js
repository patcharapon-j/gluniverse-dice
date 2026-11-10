// GLUniverse Dice: build each dice normal map once.
//
// DiceFactory.createMaterial turns the label bump canvas into a normal map in plain JS (three
// blur passes and a Sobel pass over every pixel). That was 98% of building a material: ~180 ms
// on the main thread for a 1024² atlas and ~800 ms for a d20 on a slow laptop, paid again for
// every colour of the same die, because the bump canvas does not depend on the colours. The
// result is now kept by an exact hash of the bump pixels, so any input that changes the
// engraving (shape, labels, font, a bumpy texture, outlines) gives a new entry.
//
// Installed from extendMaterialOptions (DiceFactory.initializeMaterials).
const MAX_ENTRIES = 24;

export function memoizeNormalMaps(factory) {
    const build = factory.heightCanvasToNormalCanvas;
    if (typeof build !== "function" || build._gluMemo) return;
    const memo = new Map();
    const memoized = function (srcCanvas, strength = this.normalMapStrength) {
        const key = bumpKey(srcCanvas, strength);
        const hit = key && memo.get(key);
        if (hit) {
            //most recently used last
            memo.delete(key);
            memo.set(key, hit);
            return hit;
        }
        const canvas = build.call(this, srcCanvas, strength);
        if (key) {
            memo.set(key, canvas);
            if (memo.size > MAX_ENTRIES) memo.delete(memo.keys().next().value);
        }
        return canvas;
    };
    memoized._gluMemo = true;
    factory.heightCanvasToNormalCanvas = memoized;
}

// FNV-1a over the pixels, with the size and strength. Null when the canvas cannot be read.
export function bumpKey(canvas, strength) {
    try {
        const { width: w, height: h } = canvas;
        const data = canvas.getContext("2d").getImageData(0, 0, w, h).data;
        const words = new Uint32Array(data.buffer, data.byteOffset, data.byteLength >> 2);
        let a = 0x811c9dc5, b = 0x9e3779b9;
        for (let i = 0; i < words.length; i++) {
            a = Math.imul(a ^ words[i], 0x01000193);
            b = Math.imul(b ^ words[i], 0x85ebca6b) ^ (b >>> 13);
        }
        return `${w}x${h}:${strength}:${(a >>> 0).toString(36)}${(b >>> 0).toString(36)}`;
    } catch {
        return null;
    }
}
