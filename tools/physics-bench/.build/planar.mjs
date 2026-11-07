import { DiceShapeLibrary } from '../../../module/engine/DiceShapeLibrary.js';
import { buildShapeGeometry } from '../../../module/web-workers/rapier/shapeGeometry.js';
for (const name of DiceShapeLibrary.getBuiltinNames()) {
  const def = DiceShapeLibrary.getWorkerDefinition(name); if (def.type!=='ConvexPolyhedron') continue;
  const g = buildShapeGeometry(def, 1);
  let worst=0, outward=0, usedVerts=new Set();
  g.faces.forEach((f,i)=>{ const n=g.faceNormals[i]; const p0=g.vertices[f[0]];
    f.forEach(vi=>usedVerts.add(vi));
    for(const vi of f){ const v=g.vertices[vi]; const d=(v[0]-p0[0])*n[0]+(v[1]-p0[1])*n[1]+(v[2]-p0[2])*n[2]; worst=Math.max(worst,Math.abs(d)); }
    const c=f.reduce((a,vi)=>[a[0]+g.vertices[vi][0]/f.length,a[1]+g.vertices[vi][1]/f.length,a[2]+g.vertices[vi][2]/f.length],[0,0,0]);
    if (c[0]*n[0]+c[1]*n[1]+c[2]*n[2] < 0) outward++; });
  console.log(name.padEnd(4), 'verts', g.vertices.length, 'used', usedVerts.size, 'faces', g.faces.length, 'scoring', g.faceValues.filter(v=>v).length, 'max non-planarity', worst.toFixed(4), 'inward normals', outward);
}
