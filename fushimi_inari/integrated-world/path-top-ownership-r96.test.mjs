import test from 'node:test';
import assert from 'node:assert/strict';
import {partitionWalkingTopsR96} from './path-top-ownership-r96.mjs';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
const triangles=v=>Array.from({length:v.length/9},(_,i)=>[0,1,2].map(j=>[v[i*9+j*3],v[i*9+j*3+2]])),area=v=>triangles(v).reduce((s,p)=>s+Math.abs(polygonArea(p)),0);
const fixtures=[
 ['Okusha',[255.59683793762423,62.53497800000001,65.1793989027225,257.576110865629,62.53497800000001,64.89220240786078,257.37378570312967,62.53497800000001,63.506492001768464],[256.2902267096852,62.53497800000001,63.03127963432106,256.5897732903148,62.53497800000001,65.00872036567894,258.0430075456179,62.53497800000001,64.78858160494308]],
 ['Omotesando',[-71.86701202392578,36.606998443603516,9.020963668823242,-73.71724700927734,36.606998443603516,4.35098123550415,-73.40326690673828,36.606998443603516,9.141081809997559],[-74.14384460449219,36.606998443603516,6.741713047027588,-72.1696548461914,36.606998443603516,5.266887187957764,-74.16934204101562,36.606998443603516,5.302312850952148]],
 ['Sanctuary',[61.57246398925781,44.122249603271484,-21.599843978881836,63.17616271972656,44.122249603271484,-19.72170639038086,63.03947448730469,44.122249603271484,-21.717159271240234],[63.615360260009766,44.122249603271484,-21.72789192199707,61.684452056884766,44.122249603271484,-20.193971633911133,63.68226623535156,44.122249603271484,-20.287437438964844]],
 ['Honden',[70.14241790771484,44.122249603271484,3.4298062324523926,72.05155944824219,44.122249603271484,1.8398617506027222,70.0550765991211,44.122249603271484,1.9583492279052734],[71.04074096679688,44.122249603271484,.759009063243866,71.04926300048828,44.122249603271484,2.758991003036499,72.48663330078125,44.122249603271484,2.752868175506592]]
];
for(const [name,a,b]of fixtures)test(`${name} exported ray pair retains exact union across different material owners`,()=>{
 const buckets={omotesando:a,precinct:b},uvs={};partitionWalkingTopsR96(buckets,uvs);assert.deepEqual(buckets.omotesando,a);
 const overlap=Math.abs(polygonArea(clipConvex(triangles(a)[0],triangles(b)[0])));assert.ok(overlap>1e-4);assert.ok(Math.abs(area(buckets.omotesando)+area(buckets.precinct)-area(a)-area(b)+overlap)<1e-7);
 for(const x of triangles(buckets.omotesando))for(const y of triangles(buckets.precinct))assert.ok(Math.abs(polygonArea(clipConvex(x,y)))<1e-8);
});
test('plane bin boundaries share ownership, separated levels retain it, and repeated partition is stable',()=>{
 const a=[-1,10.000009,0,-1,10.000009,3,2,10.000009,0],b=a.map((v,i)=>i%3===1?v+.000002:v),upper=a.map((v,i)=>i%3===1?v+.1:v),buckets={stone:[...a,...b,...upper]},uvs={};
 partitionWalkingTopsR96(buckets,uvs);assert.deepEqual(buckets.stone,[...a,...upper]);const before=structuredClone(buckets),repeat=partitionWalkingTopsR96(buckets,uvs);assert.equal(repeat.overlaps,0);assert.deepEqual(buckets,before);
});
test('same-plane spatial cells preserve source UVs, lower aprons, sloped surfaces and excluded curbs',()=>{
 const a=[7,10,7,7,10,10,10,10,7],b=[8,10,8,8,10,11,11,10,8],lower=a.map((v,i)=>i%3===1?v-.035:v),slope=[7,11,7,7,12,10,10,11,7],edge=[...a];
 const buckets={omotesando:a,precinct:[...b,...lower,...slope],edge},uvs={precinct:[...b,...lower,...slope].flatMap((v,i,all)=>i%3===0?[v/3,all[i+2]/4]:[])};
 partitionWalkingTopsR96(buckets,uvs);assert.equal(buckets.edge,edge);assert.deepEqual(buckets.precinct.slice(-18),[...lower,...slope]);
 for(let i=0;i<buckets.precinct.length;i+=3){assert.ok(Math.abs(uvs.precinct[i/3*2]-buckets.precinct[i]/3)<1e-8);assert.ok(Math.abs(uvs.precinct[i/3*2+1]-buckets.precinct[i+2]/4)<1e-8);}
});
