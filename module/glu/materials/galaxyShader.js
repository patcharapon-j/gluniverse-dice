// GLUniverse Dice: "galaxy" material shader chunks (ROADMAP M3).
//
// A dark clear shell with a nebula and stars inside. The inside is sampled in object space at
// several depths along the view ray, so it has parallax and turns with the die. Positions are
// normalised by 1/|position| per vertex, which is near-constant over a convex die, so the effect
// has the same size on every shape and scale. Labels (the darker parts of DSN's bump canvas)
// keep their colour and get no nebula.

export const GALAXY_VERTEX_PARS = /* glsl */`
varying vec3 vGluObj;
varying vec3 vGluCam;
varying float vGluInvR;
`;

export const GALAXY_VERTEX = /* glsl */`
vGluObj = position;
vGluCam = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
vGluInvR = 1.0 / max(length(position), 1e-5);
`;

export const GALAXY_FRAGMENT_PARS = /* glsl */`
varying vec3 vGluObj;
varying vec3 vGluCam;
varying float vGluInvR;
uniform sampler2D gluGalaxyMask;
uniform float gluGalaxySeed;
float gluHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float gluNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(mix(gluHash(i), gluHash(i + vec3(1, 0, 0)), f.x), mix(gluHash(i + vec3(0, 1, 0)), gluHash(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(gluHash(i + vec3(0, 0, 1)), gluHash(i + vec3(1, 0, 1)), f.x), mix(gluHash(i + vec3(0, 1, 1)), gluHash(i + vec3(1, 1, 1)), f.x), f.y),
        f.z);
}
float gluFbm(vec3 p) {
    float a = 0.5;
    float s = 0.0;
    for (int i = 0; i < 4; i++) {
        s += a * gluNoise(p);
        p *= 2.03;
        a *= 0.5;
    }
    return s;
}
`;

// after <map_fragment>: darken the body, remember the user's colour as the nebula tint
export const GALAXY_MAP_FRAGMENT = /* glsl */`
float gluBody = 1.0;
#ifdef USE_MAP
    gluBody = smoothstep(0.6, 0.9, texture2D(gluGalaxyMask, vMapUv).r);
#endif
vec3 gluTint = max(diffuseColor.rgb, vec3(0.08));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.1, gluBody);
`;

// before <opaque_fragment>: add the inside to the lit result
export const GALAXY_OUTPUT_FRAGMENT = /* glsl */`
{
    vec3 gluP = vGluObj * vGluInvR;
    vec3 gluD = normalize(gluP - vGluCam * vGluInvR);
    vec3 gluNeb = vec3(0.0);
    for (int k = 0; k < 4; k++) {
        float t = 0.12 + 0.2 * float(k);
        vec3 q = gluP + gluD * t + vec3(gluGalaxySeed);
        float d = smoothstep(0.42, 0.85, gluFbm(q * 2.2));
        vec3 c = mix(gluTint, gluTint.zxy * 0.8 + 0.2, float(k) / 3.0);
        gluNeb += d * c * (1.0 - t * 0.8);
        float s = gluHash(floor(q * 38.0));
        gluNeb += vec3(smoothstep(0.985, 1.0, s)) * 1.6 * (1.0 - t);
    }
    outgoingLight += gluNeb * 0.45 * gluBody;
}
`;

// "pearlescent": nacre. Thin-film iridescence alone barely shows on flat dice faces under the
// board's lighting, so a pastel hue that shifts with the viewing angle and the position on the
// die tints the lit result. Uses the galaxy varyings and mask (GALAXY_VERTEX*, gluGalaxyMask).
export const PEARL_MAP_FRAGMENT = /* glsl */`
float gluBody = 1.0;
#ifdef USE_MAP
    gluBody = smoothstep(0.6, 0.9, texture2D(gluGalaxyMask, vMapUv).r);
#endif
`;

export const PEARL_OUTPUT_FRAGMENT = /* glsl */`
{
    vec3 gluV = normalize(-vViewPosition);
    float gluF = 1.0 - abs(dot(normalize(normal), gluV));
    float gluH = gluF * 1.6 + gluFbm(vGluObj * vGluInvR * 3.0 + vec3(gluGalaxySeed)) * 0.9;
    vec3 gluPastel = 0.62 + 0.38 * cos(6.2831853 * (gluH + vec3(0.0, 0.33, 0.67)));
    outgoingLight = mix(outgoingLight, outgoingLight * gluPastel * 1.25, 0.55 * gluBody);
}
`;
