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

// Resolution ownership preserves the existing sampler and adaptive stitching.
import {integratedTerrainTriangles} from './terrain-triangles.mjs';
test('optional registered court bounds refine cells without changing heights or outside topology',()=>{
 const terrain={cols:5,rows:5,xmin:50,zmin:0,step:10},height=(x,z)=>Math.sin(x*.1)+Math.cos(z*.13),baseline=integratedTerrainTriangles(terrain,[],()=>null,height),unchanged=integratedTerrainTriangles(terrain,[],()=>null,height,{detailBounds:[]});assert.deepEqual(unchanged,baseline);
 const refined=integratedTerrainTriangles(terrain,[],()=>null,height,{detailBounds:[[72.49,73.94,3.97,20.04]]});assert.ok(refined.length>baseline.length);
 const edges=new Map(),key=p=>p.map(v=>v.toFixed(7)).join(',');for(let i=0;i<refined.length;i+=9){const tri=[0,3,6].map(k=>refined.slice(i+k,i+k+3));for(const [x,y,z]of tri)assert.ok(Math.abs(y-(height(x,z)-.06))<1e-10);for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],id=[key(a),key(b)].sort().join('|');const e=edges.get(id)??{a,b,count:0};e.count++;edges.set(id,e);}}
 for(const {a,b,count}of edges.values()){const boundary=[50,90].some(x=>a[0]===x&&b[0]===x)||[0,40].some(z=>a[2]===z&&b[2]===z);assert.equal(count,boundary?1:2);}
 const triangleSet=v=>new Set(Array.from({length:v.length/9},(_,i)=>v.slice(i*9,i*9+9).join(','))),old=triangleSet(baseline),next=triangleSet(refined);for(const t of [...old].filter(t=>!next.has(t)).concat([...next].filter(t=>!old.has(t)))){const p=t.split(',').map(Number);for(const k of [0,3,6])assert.ok(p[k]>=60&&p[k]<=90&&p[k+2]>=0&&p[k+2]<=40);}
 assert.throws(()=>integratedTerrainTriangles(terrain,[],()=>null,height,{detailBounds:[[1,0,2,3]]}),/finite/);
});
