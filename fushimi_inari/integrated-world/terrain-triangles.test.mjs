import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {terrainTriangles} from './terrain-triangles.mjs';
import * as terrainBuilders from './terrain-triangles.mjs';

test('paced terrain retains exact vertex and sampler order across detail selection and emission',async()=>{
  assert.equal(typeof terrainBuilders.terrainTrianglesAsync,'function');
  const terrain={cols:5,rows:6,xmin:0,zmin:0,step:10};
  const run=async paced=>{
    const calls=[],yieldPhases=new Set();let elapsed=0,yields=0,lastYield=0,maxSlice=0;
    const detail=(c,r)=>{calls.push(['detail',c,r]);elapsed+=1;return (c+r)%3===0;};
    const height=(x,z)=>{calls.push(['height',x,z]);elapsed+=.01;return Math.sin(x)*Math.cos(z)*4;};
    const vertices=paced?await terrainBuilders.terrainTrianglesAsync(terrain,detail,height,{budgetMs:8,now:()=>elapsed,yieldWork:async()=>{yields++;yieldPhases.add(calls.at(-1)[0]);maxSlice=Math.max(maxSlice,elapsed-lastYield);lastYield=elapsed;}}):terrainTriangles(terrain,detail,height);
    return {vertices,calls,yields,yieldPhases,maxSlice};
  };
  const original=await run(false),paced=await run(true);
  // Captured from HEAD's synchronous generator before adding pacing.
  assert.equal(createHash('sha256').update(JSON.stringify({vertices:original.vertices,calls:original.calls})).digest('hex'),'cf29ffd83968bfc14e8b11e20c963e8166b1bae0a48da81138892c136210b840');
  assert.deepEqual(paced.vertices,original.vertices);assert.deepEqual(paced.calls,original.calls);
  assert.deepEqual(paced.yieldPhases,new Set(['detail','height']));
  assert.ok(paced.maxSlice<9.21,'yield checks allow at most one detailed subrow beyond the 8 ms budget');
  assert.ok(paced.yields>1,'long construction yields during both selection and vertex work');
  let yields=0;
  await terrainBuilders.terrainTrianglesAsync({cols:2,rows:2,xmin:0,zmin:0,step:10},()=>false,()=>0,{now:()=>0,yieldWork:async()=>{yields++;}});
  assert.equal(yields,0,'tiny construction does not add a timer per work item');
});

test('paced integrated terrain preserves registered detail ownership and rejects invalid pacing',async()=>{
  assert.equal(typeof terrainBuilders.integratedTerrainTrianglesAsync,'function');
  const args=[{cols:4,rows:4,xmin:110,zmin:0,step:10},[{radius:2,target:[125,2,15]}],()=>null,(x,z)=>x*.1+Math.sin(z)];
  const options={detailBounds:[[112,115,2,4]]};
  const expected=integratedTerrainTriangles(...args,options);
  assert.deepEqual(await terrainBuilders.integratedTerrainTrianglesAsync(...args,{...options,yieldWork:async()=>{}}),expected);
  await assert.rejects(terrainBuilders.integratedTerrainTrianglesAsync(...args),/yieldWork/);
  await assert.rejects(terrainBuilders.integratedTerrainTrianglesAsync(...args,{yieldWork:async()=>{},budgetMs:0}),/budget/);
});

test('opt-in pure height caching preserves every terrain byte with bounded row reuse',async()=>{
  for(const [name,terrain,detail,expectedCalls]of [
    ['detailed',{cols:4,rows:4,xmin:0,zmin:0,step:10},()=>true,1023],
    // Two outer rows retain 18 points each; the detailed middle retains 127.
    ['stitched',{cols:4,rows:4,xmin:0,zmin:0,step:10},(c,r)=>c===1&&r===1,163],
    ['noninteger',{cols:5,rows:5,xmin:-.13,zmin:.07,step:2.3},(c,r)=>(c+r)%3===0,null]
  ]){
    const run=async cacheHeights=>{
      let calls=0;
      const positions=await terrainBuilders.terrainTrianglesAsync(terrain,detail,(x,z)=>{calls++;return Math.sin(x*.71)*Math.cos(z*.53)+x*.03;},{yieldWork:async()=>{},now:()=>0,cacheHeights});
      return {positions,calls};
    };
    const original=await run(false),cached=await run(true);
    assert.deepEqual(new Uint8Array(new Float64Array(cached.positions).buffer),new Uint8Array(new Float64Array(original.positions).buffer),name);
    assert.ok(cached.calls<original.calls/2,`${name}: reuse exact shared coordinates`);
    if(expectedCalls!==null)assert.equal(cached.calls,expectedCalls,`${name}: retain one coarse row, then discard its cache`);
  }
});

test('integrated async terrain forwards pure height caching without changing its offset',async()=>{
  const terrain={cols:2,rows:2,xmin:0,zmin:0,step:10};let calls=0;
  const positions=await terrainBuilders.integratedTerrainTrianglesAsync(terrain,[],()=>null,(x,z)=>{calls++;return x*.25-z*.1;},{detailBounds:[[1,2,1,2]],cacheHeights:true,yieldWork:async()=>{}});
  assert.equal(calls,121);
  assert.deepEqual(positions,integratedTerrainTriangles(terrain,[],()=>null,(x,z)=>x*.25-z*.1,{detailBounds:[[1,2,1,2]]}));
});
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
