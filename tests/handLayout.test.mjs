// M5: the waiting hand stays on screen, and a press anywhere on the group grabs it
// (module/glu/hand/HandLayout.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitInside, convexHull, distanceToHull } from '../module/glu/hand/HandLayout.js';

const screen = { minX: -10, maxX: 10, minZ: -5, maxZ: 5 };

test('fitInside leaves a cluster that already fits where it is', () => {
    assert.deepEqual(fitInside({ x: 2, z: -1 }, 3, screen), { x: 2, z: -1 });
});

test('fitInside pulls a cluster spawned by an edge fully inside', () => {
    //a roll button in the bottom-right corner
    assert.deepEqual(fitInside({ x: 9.5, z: 4.8 }, 2, screen), { x: 8, z: 3 });
    //and past the top-left of the screen
    assert.deepEqual(fitInside({ x: -40, z: -9 }, 2, screen), { x: -8, z: -3 });
});

test('fitInside centres a cluster too big for the screen', () => {
    assert.deepEqual(fitInside({ x: 9, z: 4 }, 6, screen), { x: 4, z: 0 });
    assert.deepEqual(fitInside({ x: 9, z: 4 }, 11, screen), { x: 0, z: 0 });
});

test('convexHull of one, two and many dice', () => {
    assert.equal(convexHull([{ x: 1, y: 1 }]).length, 1);
    assert.equal(convexHull([{ x: 0, y: 0 }, { x: 4, y: 0 }]).length, 2);
    assert.equal(convexHull([{ x: 0, y: 0 }, { x: 0, y: 0 }]).length, 1, 'duplicates collapse');
    //a hex cluster: the middle die is inside, not on the outline
    const hex = [{ x: 0, y: 0 }];
    for (let s = 0; s < 6; s++) hex.push({ x: Math.cos(s * Math.PI / 3) * 2, y: Math.sin(s * Math.PI / 3) * 2 });
    assert.equal(convexHull(hex).length, 6);
    //three in a row: the ends
    assert.equal(convexHull([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]).length, 2);
});

test('2d20: the gap between the two dice is on the hand', () => {
    //two dice 60 px apart, 22 px radius: the midpoint is in neither die
    const hull = convexHull([{ x: 100, y: 100 }, { x: 160, y: 100 }]);
    const r = 22;
    assert.ok(distanceToHull({ x: 130, y: 100 }, hull) <= r, 'centre of the pair');
    assert.ok(distanceToHull({ x: 130, y: 115 }, hull) <= r, 'just off the line between them');
    assert.ok(distanceToHull({ x: 130, y: 130 }, hull) > r, 'well clear of the pair');
    assert.ok(distanceToHull({ x: 200, y: 100 }, hull) > r, 'past the end die');
});

test('a group: inside the outline and within a radius of it, nothing further', () => {
    const hull = convexHull([{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 30, y: 52 }, { x: 30, y: 17 }]);
    assert.equal(hull.length, 3);
    assert.equal(distanceToHull({ x: 30, y: 30 }, hull), 0);
    assert.ok(Math.abs(distanceToHull({ x: 30, y: -10 }, hull) - 10) < 1e-9);
    assert.ok(distanceToHull({ x: 100, y: 100 }, hull) > 22);
    assert.equal(distanceToHull({ x: 0, y: 0 }, []), Infinity);
});
