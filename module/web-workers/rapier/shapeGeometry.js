// Shape geometry for the Rapier worker, built from the same definitions the cannon-es worker
// receives (DiceShapeLibrary.getWorkerDefinition + radius).
//
// Face normals reproduce cannon-es ConvexPolyhedron.computeNormals exactly (same vertices, same
// winding, same formula, same final negate), so result reading picks the same face in both engines,
// including for custom addDiceShape colliders. The d2 "Cylinder" reproduces cannon-es Cylinder:
// an N-gon prism along +Y with faces [N sides, bottom, top].

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function normalize(v) {
    const l = Math.hypot(v[0], v[1], v[2]);
    return l > 0 ? [v[0] / l, v[1] / l, v[2] / l] : v;
}

// cannon-es ConvexPolyhedron.computeNormal(va, vb, vc): (vc - vb) x (vb - va), normalized,
// then computeNormals negates it.
function cannonFaceNormal(va, vb, vc) {
    const ab = sub(vb, va);
    const cb = sub(vc, vb);
    const n = normalize(cross(cb, ab));
    return [-n[0], -n[1], -n[2]];
}

function cannonCylinder(radiusTop, radiusBottom, height, N) {
    const vertices = [];
    const faces = [];
    const bottomface = [];
    const topface = [];
    vertices.push([-radiusBottom * Math.sin(0), -height * 0.5, radiusBottom * Math.cos(0)]);
    bottomface.push(0);
    vertices.push([-radiusTop * Math.sin(0), height * 0.5, radiusTop * Math.cos(0)]);
    topface.push(1);
    for (let i = 0; i < N; i++) {
        const theta = 2 * Math.PI / N * (i + 1);
        if (i < N - 1) {
            vertices.push([-radiusBottom * Math.sin(theta), -height * 0.5, radiusBottom * Math.cos(theta)]);
            bottomface.push(2 * i + 2);
            vertices.push([-radiusTop * Math.sin(theta), height * 0.5, radiusTop * Math.cos(theta)]);
            topface.push(2 * i + 3);
            faces.push([2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2]);
        } else {
            faces.push([2 * i, 2 * i + 1, 1, 0]);
        }
    }
    faces.push(bottomface);
    faces.push([...topface].reverse());
    return { vertices, faces };
}

/**
 * @param {object} definition  worker definition (type, vertices, faces, skipLastFaceIndex, faceValues, ...)
 * @param {number} radius      in meters
 * @returns {{ points: Float32Array, vertices: number[][], faces: number[][], faceNormals: number[][], faceValues: number[] }}
 */
export function buildShapeGeometry(definition, radius) {
    let vertices;
    let faces;
    switch (definition.type) {
        case "ConvexPolyhedron":
            vertices = definition.vertices.map(v => [v[0] * radius, v[1] * radius, v[2] * radius]);
            faces = definition.faces.map(f => definition.skipLastFaceIndex ? f.slice(0, f.length - 1) : f);
            break;
        case "Cylinder": {
            const c = cannonCylinder(radius * definition.radiusTop, radius * definition.radiusBottom, radius * definition.height, definition.numSegments);
            vertices = c.vertices;
            faces = c.faces;
            break;
        }
        default:
            throw new Error("Unknown shape type: " + definition.type);
    }
    const faceNormals = faces.map(f => cannonFaceNormal(vertices[f[0]], vertices[f[1]], vertices[f[2]]));
    const points = new Float32Array(vertices.length * 3);
    vertices.forEach((v, i) => points.set(v, i * 3));
    //collider: Rapier's convex hull of a thin prism (the d2 coin, 1:20 aspect) sinks into a
    //half-space even at rest (measured: -11.5 mm for a 4.8 mm coin). A true cylinder is exact and
    //cheaper; the face table above still reads the result like cannon-es does.
    let collider = { kind: "hull" };
    if (definition.type === "Cylinder" && definition.radiusTop === definition.radiusBottom) {
        collider = { kind: "cylinder", halfHeight: radius * definition.height / 2, radius: radius * definition.radiusTop };
    }
    return { points, vertices, faces, faceNormals, faceValues: definition.faceValues, collider };
}

// rotate v by unit quaternion q {x,y,z,w}
export function rotateByQuat(v, q) {
    const { x, y, z, w } = q;
    const ix = w * v[0] + y * v[2] - z * v[1];
    const iy = w * v[1] + z * v[0] - x * v[2];
    const iz = w * v[2] + x * v[1] - y * v[0];
    const iw = -x * v[0] - y * v[1] - z * v[2];
    return [
        ix * w + iw * -x + iy * -z - iz * -y,
        iy * w + iw * -y + iz * -x - ix * -z,
        iz * w + iw * -z + ix * -y - iy * -x
    ];
}

/**
 * Same rule as the cannon-es worker getDiceValue: the face whose world normal is closest to +Y
 * (-Y for d4), ignoring faceValues of 0. Returns { value, angle } (angle in radians, used by the
 * benchmark to detect cocked dice).
 */
export function readFace(geometry, shapeName, quat) {
    const up = shapeName === 'd4' ? -1 : 1;
    let closest = -1;
    let closestAngle = Math.PI * 2;
    for (let i = 0; i < geometry.faceNormals.length; i++) {
        if (geometry.faceValues[i] == 0) continue;
        const n = rotateByQuat(geometry.faceNormals[i], quat);
        const len = Math.hypot(n[0], n[1], n[2]) || 1;
        const angle = Math.acos(Math.max(-1, Math.min(1, (n[1] * up) / len)));
        if (angle < closestAngle) {
            closestAngle = angle;
            closest = i;
        }
    }
    return { value: geometry.faceValues[closest], angle: closestAngle };
}
