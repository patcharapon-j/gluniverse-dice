// The Rapier worker must read the same face as the cannon-es worker for every shape.
// Compares shapeGeometry.js against cannon-es's own ConvexPolyhedron / Cylinder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConvexPolyhedron, Cylinder, Vec3, Quaternion } from 'cannon-es';
import { Vector3 } from 'three';
import { DiceShapeLibrary } from '../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry, readFace } from '../module/web-workers/rapier/shapeGeometry.js';

const RADIUS = 0.05;

function cannonShape(def, radius) {
    if (def.type === 'Cylinder') {
        return new Cylinder(radius * def.radiusTop, radius * def.radiusBottom, radius * def.height, def.numSegments);
    }
    const vertices = def.vertices.map(v => new Vec3(v[0] * radius, v[1] * radius, v[2] * radius));
    const faces = def.faces.map(f => def.skipLastFaceIndex ? f.slice(0, f.length - 1) : f);
    return new ConvexPolyhedron({ vertices, faces });
}

// verbatim logic of PhysicsWorker.js getDiceValue
function cannonRead(shape, name, faceValues, q) {
    const vector = new Vector3(0, name == 'd4' ? -1 : 1, 0);
    const n = new Vector3();
    let closest_face, closest_angle = Math.PI * 2;
    for (let i = 0; i < shape.faceNormals.length; ++i) {
        if (faceValues[i] == 0) continue;
        n.copy(shape.faceNormals[i]);
        const angle = n.applyQuaternion(q).angleTo(vector);
        if (angle < closest_angle) { closest_angle = angle; closest_face = i; }
    }
    return faceValues[closest_face];
}

function rng(seed) {
    return () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

for (const name of DiceShapeLibrary.getBuiltinNames()) {
    test(`face normals and readings match cannon-es: ${name}`, () => {
        const def = DiceShapeLibrary.getWorkerDefinition(name);
        const ours = buildShapeGeometry(def, RADIUS);
        const theirs = cannonShape(def, RADIUS);

        assert.equal(ours.faceNormals.length, theirs.faceNormals.length, 'face count');
        for (let i = 0; i < ours.faceNormals.length; i++) {
            const a = ours.faceNormals[i];
            const b = theirs.faceNormals[i];
            assert.ok(Math.abs(a[0] - b.x) < 1e-9 && Math.abs(a[1] - b.y) < 1e-9 && Math.abs(a[2] - b.z) < 1e-9, `normal ${i}`);
        }
        assert.equal(ours.points.length, theirs.vertices.length * 3, 'vertex count');

        const r = rng(name.length * 7919);
        for (let k = 0; k < 500; k++) {
            const q = new Quaternion(r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5);
            q.normalize();
            const expected = cannonRead(theirs, name, def.faceValues, q);
            const got = readFace(ours, name, { x: q.x, y: q.y, z: q.z, w: q.w }).value;
            assert.equal(got, expected, `orientation ${k}`);
        }
    });
}

test('custom addDiceShape-style definition (un-normalised vertices) matches cannon-es', () => {
    //a cube with non-unit vertices and no trailing face id, as a third-party bundle might send
    const def = {
        type: 'ConvexPolyhedron',
        vertices: [[-2, -2, -2], [2, -2, -2], [2, 2, -2], [-2, 2, -2], [-2, -2, 2], [2, -2, 2], [2, 2, 2], [-2, 2, 2]],
        faces: [[0, 3, 2, 1], [1, 2, 6, 5], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [4, 5, 6, 7]],
        skipLastFaceIndex: false,
        faceValues: [1, 2, 3, 4, 5, 6]
    };
    const ours = buildShapeGeometry(def, 0.01);
    const theirs = cannonShape(def, 0.01);
    for (let i = 0; i < 6; i++) {
        const a = ours.faceNormals[i], b = theirs.faceNormals[i];
        assert.ok(Math.abs(a[0] - b.x) + Math.abs(a[1] - b.y) + Math.abs(a[2] - b.z) < 1e-9);
    }
});
