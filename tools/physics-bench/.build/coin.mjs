import RAPIER from '@dimforge/rapier3d-compat';
import { RapierPhysicsEngine } from '../../../module/web-workers/rapier/RapierPhysicsEngine.js';
import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry } from '../../../module/web-workers/rapier/shapeGeometry.js';
await RAPIER.init();
const e = new RapierPhysicsEngine(RAPIER, { emit(){} });
const W=1920*0.016/50, H=1080*0.016/50;
e.init({height:H,width:W,margin:{}, tuning: JSON.parse(process.argv[2]||'{}')});
const r=0.9*0.0542;
e.createShape({name:'d2',radius:r,definition:DiceShapeLibrary.getWorkerDefinition('d2')});
const g=buildShapeGeometry(DiceShapeLibrary.getWorkerDefinition('d2'),r); console.log('coin pts', g.points.length/3, 'ymin', Math.min(...g.vertices.map(v=>v[1])).toFixed(4));
const L=0.016/50;
e.createDiceBatch([{id:1,shape:'d2',material:'p',mass:400,startAtIteration:0,options:{},vectordata:{type:'d2',pos:{x:0,y:0.09,z:0},velocity:{x:0.05,y:3000*L,z:0.02},angle:{x:96,y:0,z:8},axis:{x:1,y:0.5,z:1,a:0.3}}}]);
const d=e.diceList.get(1);
console.log('collider', d.collider.shape.type, 'mass', d.collider.mass(), 'inertia', JSON.stringify(d.body.principalInertia()));
for(let i=0;i<400;i++){ e._step(1/60); if(i%20==0||(i>40&&i<70)){const p=d.body.translation(); const v=d.body.linvel(); const w=d.body.angvel(); console.log(i, 'y',p.y.toFixed(4),'v',Math.hypot(v.x,v.y,v.z).toFixed(3),'w',Math.hypot(w.x,w.y,w.z).toFixed(1));} }
