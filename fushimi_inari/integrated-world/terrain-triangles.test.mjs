import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainTriangles} from './terrain-triangles.mjs';
test('nonlinear graded terrain has no unmatched internal edges at LOD cell boundaries',()=>{
  const vertices=terrainTriangles({cols:4,rows:4,xmin:0,zmin:0,step:10},(c,r)=>c===1&&r===1,(x,z)=>Math.sin(x)*Math.cos(z)*4);
  const edges=new Map(),key=p=>p.map(v=>v.toFixed(7)).join(',');
  for(let i=0;i<vertices.length;i+=9){const tri=[0,1,2].map(j=>vertices.slice(i+j*3,i+j*3+3));for(let j=0;j<3;j++){
    const a=tri[j],b=tri[(j+1)%3],id=[key(a),key(b)].sort().join('|');
    const e=edges.get(id)??{a,b,count:0};e.count++;edges.set(id,e);
  }}
  for(const {a,b,count} of edges.values()){
    const boundary=[0,30].some(v=>a[0]===v&&b[0]===v||a[2]===v&&b[2]===v);
    assert.equal(count,boundary?1:2,`edge ${key(a)} -> ${key(b)}`);
  }
});
