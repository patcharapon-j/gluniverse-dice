// GLUniverse Dice: extra dice materials and the "Enhanced materials" option (ROADMAP M3).
//
// Hooks (DiceFactory): extendMaterialOptions() at the end of initializeMaterials, and
// decorateMaterial() in createMaterial right after upstream sets its onBeforeCompile, before
// diceSoNiceOnMaterialReady fires, so systems and modules still see and patch the material.
//
// New ids: gemstone, galaxy, pearlescent. Existing ids render exactly as in Dice So Nice unless
// the client setting `enhancedMaterials` is on.
import { CanvasTexture, Color, DoubleSide, MixOperation, AddOperation } from 'three';
import { MODULE_ID } from '../LegacyIdentity.js';
import { TARGET_D6_EDGE_METERS } from '../../engine/SceneConstants.js';
import { GALAXY_VERTEX_PARS, GALAXY_VERTEX, GALAXY_FRAGMENT_PARS, GALAXY_MAP_FRAGMENT, GALAXY_OUTPUT_FRAGMENT, PEARL_MAP_FRAGMENT, PEARL_OUTPUT_FRAGMENT } from './galaxyShader.js';
import { memoizeNormalMaps } from '../NormalMapMemo.js';

export const ENHANCED_SETTING = "enhancedMaterials";
export const GLU_MATERIAL_IDS = ["gemstone", "galaxy", "pearlescent"];

/** {id: i18n key} for the material pickers, merged after upstream's list */
export function gluMaterialChoices() {
    return {
        gemstone: "GLUDICE.Material.Gemstone",
        galaxy: "GLUDICE.Material.Galaxy",
        pearlescent: "GLUDICE.Material.Pearlescent"
    };
}

export function registerMaterialSettings() {
    game.settings.register(MODULE_ID, ENHANCED_SETTING, {
        name: "GLUDICE.Settings.EnhancedMaterials.Name",
        hint: "GLUDICE.Settings.EnhancedMaterials.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        requiresReload: true
    });
}

function enhancedEnabled() {
    try {
        return game.settings.get(MODULE_ID, ENHANCED_SETTING) !== false;
    } catch {
        return false;
    }
}

const EDGE = TARGET_D6_EDGE_METERS;

function realisticOptions(advancedGlass) {
    return {
        gemstone: advancedGlass ? {
            type: 'physical',
            options: {
                metalness: 0,
                roughness: 0,
                transmission: 1.0,
                ior: 2.0,
                dispersion: 4.0,
                thickness: EDGE * 1.6,
                attenuationDistance: EDGE * 0.9,
                attenuationColor: new Color(0.95, 0.95, 1.0),
                specularIntensity: 1,
                clearcoat: 1,
                clearcoatRoughness: 0,
                side: DoubleSide
            },
            scopedOptions: { envMap: true },
            usesTransmissionMask: true,
            gluTintFromBackground: true
        } : {
            type: 'physical',
            options: { metalness: 0.4, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6 },
            scopedOptions: { envMap: true }
        },
        galaxy: {
            type: 'physical',
            options: { metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 },
            scopedOptions: { envMap: true },
            gluGalaxy: true
        },
        pearlescent: {
            type: 'physical',
            options: {
                metalness: 0,
                roughness: 0.25,
                clearcoat: 1,
                clearcoatRoughness: 0.1,
                iridescence: 1,
                iridescenceIOR: 1.6,
                iridescenceThicknessRange: [250, 650],
                sheen: 0.6,
                sheenRoughness: 0.4,
                sheenColor: new Color(1, 0.85, 0.95)
            },
            scopedOptions: { envMap: true },
            gluPearl: true
        }
    };
}

function basicOptions() {
    const shiny = { specular: 0xffffff, color: 0xb5b5b5, shininess: 40, reflectivity: 0.4, combine: MixOperation };
    return {
        gemstone: { type: 'phong', options: { ...shiny, shininess: 80, reflectivity: 0.6, combine: AddOperation }, scopedOptions: { envMap: true } },
        galaxy: { type: 'phong', options: { ...shiny }, scopedOptions: { envMap: true }, gluGalaxy: true },
        pearlescent: { type: 'phong', options: { ...shiny, shininess: 20, reflectivity: 0.25 }, scopedOptions: { envMap: true }, gluPearl: true }
    };
}

/** Enhanced versions of upstream ids (realistic lighting only). Values merge into options. */
function enhance(options, advancedGlass) {
    const physical = (id, extra) => {
        const m = options[id];
        if (!m) return;
        m.type = 'physical';
        Object.assign(m.options, extra);
    };
    //plastic and wood: a thin clear coat (lacquer / varnish)
    physical('plastic', { clearcoat: 0.5, clearcoatRoughness: 0.18 });
    physical('wood', { clearcoat: 0.25, clearcoatRoughness: 0.35 });
    //pristine: a sharper coat
    physical('pristine', { clearcoatRoughness: 0.04 });
    //velvet: denser pile
    physical('velvet', { sheen: 0.85, sheenRoughness: 0.6 });
    //glass family: chromatic dispersion (only where transmission is on)
    if (advancedGlass) {
        physical('glass', { dispersion: 0.8 });
        physical('resin', { dispersion: 0.35 });
        physical('frosted', { dispersion: 0.2 });
    }
    //chrome and metal: stronger, slightly sharper reflections
    for (const id of ['metal', 'chrome']) {
        if (options[id]) options[id].options.envMapIntensity = 1.25;
    }
}

/** Called at the end of DiceFactory.initializeMaterials. */
export function extendMaterialOptions(factory) {
    memoizeNormalMaps(factory);
    const options = factory.material_options;
    if (!options) return;
    if (factory.realisticLighting) {
        if (enhancedEnabled()) enhance(options, factory.advancedGlass);
        Object.assign(options, realisticOptions(factory.advancedGlass));
    } else {
        Object.assign(options, basicOptions());
    }
}

/**
 * Called in DiceFactory.createMaterial right after `mat.onBeforeCompile` is set.
 * @param {HTMLCanvasElement} canvasBump the label mask (white body, darker labels)
 * @param {HTMLCanvasElement} [canvasEmissive] DSN's emissive canvas: black, with the text
 *        labels (and any emissive face art) in grey. Unlike the bump canvas it holds no texture
 *        bump, so it isolates the numbers.
 */
export function decorateMaterial(factory, mat, materialData, canvasBump, canvasEmissive) {
    //label mask for every material (galaxy and pearlescent)
    if (canvasBump && !mat.userData.gluLabelMask) {
        const mask = new CanvasTexture(canvasBump);
        mask.flipY = false;
        mat.userData.gluLabelMask = mask;
    }
    //number mask: M4's settle glow lights only the numbers through it
    //A copy, not DSN's canvas: that canvas is also `mat.emissiveMap.image`, and systems draw into
    //it from diceSoNiceOnMaterialReady (Daggerheart lights its cut there). On the shared canvas
    //their art would glow as if it were the number (M8).
    if (canvasEmissive && !mat.userData.gluNumberMask) {
        const numbers = new CanvasTexture(snapshotCanvas(canvasEmissive));
        numbers.flipY = false;
        mat.userData.gluNumberMask = numbers;
    }
    const selected = factory.material_options?.[materialData?.material];
    if (!selected) return;

    //gemstone: the stone takes the colour of the dice background, like DSN's resin
    if (selected.gluTintFromBackground && mat.attenuationColor) {
        let tint = new Color(materialData.background);
        if (tint.getHSL({}).l < 0.05) tint = new Color(0.95, 0.95, 1.0);
        mat.attenuationColor = tint;
    }

    if (selected.gluGalaxy) addInnerShader(mat, canvasBump, 'galaxy', GALAXY_MAP_FRAGMENT, GALAXY_OUTPUT_FRAGMENT);
    else if (selected.gluPearl) addInnerShader(mat, canvasBump, 'pearl', PEARL_MAP_FRAGMENT, PEARL_OUTPUT_FRAGMENT);
}

/**
 * A copy of a canvas as it is now. Falls back to the canvas itself when no copy can be made.
 * @param {HTMLCanvasElement} source
 * @param {() => HTMLCanvasElement} [create]
 */
export function snapshotCanvas(source, create = () => document.createElement('canvas')) {
    try {
        const copy = create();
        copy.width = source.width;
        copy.height = source.height;
        const ctx = copy.getContext('2d');
        if (!ctx) return source;
        ctx.drawImage(source, 0, 0);
        return copy;
    } catch {
        return source;
    }
}

//wraps upstream's onBeforeCompile with object-space varyings, the label mask and two chunks
function addInnerShader(mat, canvasBump, kind, mapChunk, outputChunk) {
    const mask = mat.userData.gluLabelMask;
    mat.userData.gluInner = kind;
    const seed = Math.random() * 100;
    const upstream = mat.onBeforeCompile;
    mat.onBeforeCompile = function (shader, renderer) {
        upstream.call(this, shader, renderer);
        shader.uniforms.gluGalaxyMask = { value: mask };
        shader.uniforms.gluGalaxySeed = { value: seed };
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', `#include <common>\n${GALAXY_VERTEX_PARS}`)
            .replace('#include <project_vertex>', `#include <project_vertex>\n${GALAXY_VERTEX}`);
        shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', `#include <common>\n${GALAXY_FRAGMENT_PARS}`)
            .replace('#include <map_fragment>', `#include <map_fragment>\n${mapChunk}`)
            .replace('#include <opaque_fragment>', `${outputChunk}\n#include <opaque_fragment>`);
    };
    const upstreamKey = mat.customProgramCacheKey.bind(mat);
    mat.customProgramCacheKey = () => upstreamKey() + '|glu-' + kind;
}
