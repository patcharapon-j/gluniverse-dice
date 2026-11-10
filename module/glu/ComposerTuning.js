// GLUniverse Dice: the board's post-processing buffers, sized and typed for what they do.
//
// DiceScene.setupPostProcessing builds both composers on one render target that is already in
// device pixels, but EffectComposer multiplies the pixel ratio in again when it sizes its passes.
// On a HiDPI screen bloom, SMAA and the outline passes ran at four times their pixels. The
// targets were also 32-bit float with 4x MSAA, and each composer clones its own: about 2 GB of
// GPU memory for a 4K window, kept while the board is hidden.
//
// - every buffer is half float (three's own default for composers; plenty for HDR and bloom);
// - the bloom composer's second buffer only ever holds the darkened scene the bloom is made
//   from (that composer never swaps), so it needs no MSAA. The final composer's two buffers
//   keep it: the visible scene lands in either, depending on how many passes swap that frame;
// - both composers use pixel ratio 1, since their target is already in device pixels.
//
// Called once, right after the composers are built, before the first frame allocates them.
import { HalfFloatType } from 'three';

export function tuneComposers(diceScene) {
    const composers = [diceScene.bloomComposer, diceScene.finalComposer].filter(Boolean);
    if (!composers.length) return;
    for (const target of [diceScene.composerTarget, ...composers.map(c => c.renderTarget2)]) {
        if (target?.texture) target.texture.type = HalfFloatType;
    }
    if (diceScene.bloomComposer?.renderTarget2) diceScene.bloomComposer.renderTarget2.samples = 0;
    for (const composer of composers) composer.setPixelRatio(1);
}
