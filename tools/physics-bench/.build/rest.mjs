import RAPIER from '@dimforge/rapier3d-compat';
import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry, readFace } from '../../../module/web-workers/rapier/shapeGeometry.js';
await RAPIER.init();
const R=0.0488;
function rnd(s){return ()=>{s=(s*16807)%2147483647;return s/2147483647;}}
for (const deskKind of ['halfspace','cuboid']) {
 const rows=[];
 for (const name of ['d2','d4','d6','d8','d10','d12','d20']) {
  const def=DiceShapeLibrary.getWorkerDefinition(name); const g=buildShapeGeometry(def,R);
  let bad=0, worstSink=0; const rand=rnd(7);
  for(let k=0;k<40;k++){
   const w=new RAPIER.World({x:0,y:-25,z:0}); w.lengthUnit=0.05;
   const desk=w.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, deskKind==='cuboid'?-0.5:0, 0));
   w.createCollider(deskKind==='cuboid'? RAPIER.ColliderDesc.cuboid(5,0.5,5) : new RAPIER.ColliderDesc(new RAPIER.HalfSpace({x:0,y:1,z:0})), desk);
   const q={x:rand()-.5,y:rand()-.5,z:rand()-.5,w:rand()-.5}; const l=Math.hypot(q.x,q.y,q.z,q.w); for(const k2 in q) q[k2]/=l;
   const b=w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,0.1,0).setRotation(q).setAngvel({x:rand()*10-5,y:0,z:rand()*10-5}));
   w.createCollider(RAPIER.ColliderDesc.convexHull(g.points).setMass(300).setFriction(0.4).setRestitution(0.4), b);
   for(let i=0;i<240;i++) w.step();
   const p=b.translation(); const r=readFace(g,name,b.rotation());
   // lowest vertex height
   const qq=b.rotation(); let minY=Infinity; for(const v of g.vertices){ const x=v; const ix=qq.w*x[0]+qq.y*x[2]-qq.z*x[1], iy=qq.w*x[1]+qq.z*x[0]-qq.x*x[2], iz=qq.w*x[2]+qq.x*x[1]-qq.y*x[0], iw=-qq.x*x[0]-qq.y*x[1]-qq.z*x[2]; const y=iy*qq.w+iw*-qq.y+iz*-qq.x-ix*-qq.z; minY=Math.min(minY,p.y+y); }
   worstSink=Math.min(worstSink,minY);
   if (r.angle*180/Math.PI>5) bad++;
   w.free();
  }
  rows.push(`${name}: tilted>5° ${bad}/40, deepest vertex ${(worstSink*1000).toFixed(2)} mm`);
 }
 console.log(deskKind, '\n  '+rows.join('\n  '));
}
