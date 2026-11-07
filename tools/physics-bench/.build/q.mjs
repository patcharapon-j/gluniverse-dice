import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry, rotateByQuat } from '../../../module/web-workers/rapier/shapeGeometry.js';
const g=buildShapeGeometry(DiceShapeLibrary.getWorkerDefinition('d12'),0.0488);
const q={"x":-0.28128620982170105,"y":0.1111297756433487,"z":0.36399492621421814,"w":0.8809290528297424}; const py=0.03619665279984474;
const ys=g.vertices.map(v=>py+rotateByQuat(v,q)[1]).sort((a,b)=>a-b);
console.log('lowest vertex heights mm', ys.slice(0,6).map(y=>(y*1000).toFixed(2)).join(' '));
