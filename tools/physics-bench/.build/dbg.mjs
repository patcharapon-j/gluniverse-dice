import RAPIER from '@dimforge/rapier3d-compat';
import { RapierPhysicsEngine } from '/home/frostnoxia/.t3/worktrees/gluniverse-dice/m0-m1-fork-and-rapier/module/web-workers/rapier/RapierPhysicsEngine.js';
import { DiceShapeLibrary } from '/home/frostnoxia/.t3/worktrees/gluniverse-dice/m0-m1-fork-and-rapier/module/engine/DiceShapeLibrary.js';
await RAPIER.init();
const e = new RapierPhysicsEngine(RAPIER, { emit(){} });
const W=1920*0.016/50, H=1080*0.016/50;
e.init({height:H,width:W,margin:{}});
e.createShape({name:'d6',radius:0.0488,definition:DiceShapeLibrary.getWorkerDefinition('d6')});
// drop a die straight down and let it rest
e.createDiceBatch([{id:1,shape:'d6',material:'p',mass:300,startAtIteration:0,options:{},vectordata:{type:'d6',pos:{x:0,y:0.1,z:0},velocity:{x:1,y:0,z:0.5},angle:{x:5,y:0,z:3},axis:{x:0,y:0,z:0,a:0}}}]);
const d=e.diceList.get(1);
for(let i=0;i<200;i++){ e._step(1/60); if(i%20==0){const p=d.body.translation(); const v=d.body.linvel(); console.log(i, p.x.toFixed(3),p.y.toFixed(4),p.z.toFixed(3), Math.hypot(v.x,v.y,v.z).toFixed(3), d.body.isSleeping());} }
console.log('expected rest y ~', (0.0488/Math.sqrt(3)).toFixed(4));
