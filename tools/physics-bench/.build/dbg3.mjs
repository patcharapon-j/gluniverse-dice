import RAPIER from '@dimforge/rapier3d-compat';
import { RapierPhysicsEngine } from '../../../module/web-workers/rapier/RapierPhysicsEngine.js';
import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
await RAPIER.init();
const ccd = process.argv[2] !== 'noccd';
const e = new RapierPhysicsEngine(RAPIER, { emit(){} });
const W=1920*0.016/50, H=1080*0.016/50;
e.init({height:H,width:W,margin:{}, tuning:{ccd}});
e.createShape({name:'d6',radius:0.0488,definition:DiceShapeLibrary.getWorkerDefinition('d6')});
// reproduce: many dice with throw-like velocity
let seed=12; const rand=()=>{seed=(seed*16807)%2147483647; return seed/2147483647;};
let bad=0, total=0;
for (let trial=0; trial<3; trial++){
  const specs=[];
  for(let i=0;i<10;i++) specs.push({id:trial*100+i,shape:'d6',material:'p',mass:300,startAtIteration:0,options:{},vectordata:{type:'d6',pos:{x:-0.55+rand()*0.05,y:0.07+rand()*0.06,z:-0.2+rand()*0.4},velocity:{x:2.5+rand()*1.5,y:-0.003,z:rand()-0.5},angle:{x:rand()*15-7,y:0,z:rand()*15-7},axis:{x:0,y:0,z:0,a:0}}});
  e.createDiceBatch(specs);
  let firstBelow=null;
  for(let it=1; it<=600; it++){ e._step(1/60);
    if(trial==2 && it>=95 && it<=125){ const b=e.diceList.get(205).body; const p=b.translation(), v=b.linvel(); let others=[]; for(const s of specs){ if(s.id==205) continue; const q=e.diceList.get(s.id).body.translation(); const d=Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z); if(d<0.1) others.push(s.id+":"+d.toFixed(3)+"@y"+q.y.toFixed(3)); } console.log(it,"y",p.y.toFixed(4),"vy",v.y.toFixed(3),"sleep",b.isSleeping(),others.join(" ")); } }
  for(const s of specs){ total++; if(e.diceList.get(s.id).body.translation().y<0) bad++; }
  if(firstBelow && trial<5) console.log('trial',trial,'first below',firstBelow);
  e.removeDice(specs.map(s=>s.id));
}
console.log('ccd',ccd,'below desk', bad,'/',total);
