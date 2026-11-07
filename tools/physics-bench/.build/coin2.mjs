import RAPIER from '@dimforge/rapier3d-compat';
import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry } from '../../../module/web-workers/rapier/shapeGeometry.js';
await RAPIER.init();
const r=0.9*0.0542;
const g=buildShapeGeometry(DiceShapeLibrary.getWorkerDefinition('d2'),r);
for (const lu of [1, 0.05]) for (const kind of ['hull','cyl']) {
const w=new RAPIER.World({x:0,y:-25,z:0}); w.lengthUnit=lu;
const desk=w.createRigidBody(RAPIER.RigidBodyDesc.fixed()); w.createCollider(new RAPIER.ColliderDesc(new RAPIER.HalfSpace({x:0,y:1,z:0})),desk);
const b=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,0.05,0));
const cd = kind=='hull'? RAPIER.ColliderDesc.convexHull(g.points) : RAPIER.ColliderDesc.cylinder(0.0024, r);
const c=w.createCollider(cd.setMass(400),b);
const ab=c.computeAabb? c.computeAabb():null;
for(let i=0;i<120;i++) w.step();
console.log('lengthUnit',lu,kind,'rest y',b.translation().y.toFixed(5), ab? 'aabb y '+ab.mins?.y?.toFixed?.(4):'' , 'vertices', c.shape.vertices?.length/3);
}
