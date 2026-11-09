// GLUniverse Dice: the waiting hand's geometry (ROADMAP M5), kept free of the board and of three
// so the tests can run it.
//
// - fitInside: where the floating cluster may sit so all of it stays on screen.
// - convexHull / distanceToHull: a press counts as on the hand when it lands within a die's
//   radius of the area the dice cover, gaps between them included.

/**
 * Move a centre the least so that everything within `extent` of it fits inside
 * bounds { minX, maxX, minZ, maxZ }. On an axis too narrow for the cluster, centre it there.
 */
export function fitInside(p, extent, bounds) {
    const fit = (v, lo, hi) => (lo + extent <= hi - extent ? Math.max(lo + extent, Math.min(hi - extent, v)) : (lo + hi) / 2);
    return { x: fit(p.x, bounds.minX, bounds.maxX), z: fit(p.z, bounds.minZ, bounds.maxZ) };
}

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** The convex hull of 2D points { x, y } (monotone chain): one point, a segment's two ends, or a polygon. */
export function convexHull(points) {
    const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
        .filter((p, i, all) => i === 0 || p.x !== all[i - 1].x || p.y !== all[i - 1].y);
    if (pts.length < 3) return pts;
    const lower = [];
    for (const p of pts) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
        lower.push(p);
    }
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
        upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Distance from a point to a convex hull from convexHull: 0 inside it. */
export function distanceToHull(p, hull) {
    if (!hull.length) return Infinity;
    if (hull.length === 1) return Math.hypot(p.x - hull[0].x, p.y - hull[0].y);
    if (hull.length === 2) return distanceToSegment(p, hull[0], hull[1]);
    let inside = true;
    let best = Infinity;
    for (let i = 0; i < hull.length; i++) {
        const a = hull[i], b = hull[(i + 1) % hull.length];
        //counter-clockwise: inside is on the left of every edge
        if (cross(a, b, p) < 0) inside = false;
        best = Math.min(best, distanceToSegment(p, a, b));
    }
    return inside ? 0 : best;
}
