import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildSanctuaryApproaches} from './sanctuary-landing.mjs';
import {partitionWalkingTopsR96} from './path-top-ownership-r96.mjs';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
const pairs=[
 [[60.61725616455078,44.087249755859375,11.600589752197266,60.6872444152832,44.087249755859375,15.199910163879395,62.09584045410156,44.087249755859375,11.571840286254883],[64.52232360839844,44.087249755859375,10.177047729492188,61.035552978515625,44.087249755859375,11.768452644348145,61.95917892456055,44.087249755859375,12.704952239990234]],
 [[64.52232360839844,44.087249755859375,10.177047729492188,61.95917892456055,44.087249755859375,12.704952239990234,65.4459457397461,44.087249755859375,11.113547325134277],[64.5076675415039,44.087249755859375,11.047420501708984,67.42262268066406,44.087249755859375,13.16000747680664,65.38480377197266,44.087249755859375,9.837135314941406]]
];
const tri=v=>[0,3,6].map(i=>[v[i],v[i+2]]),area=v=>{let a=0;for(let i=0;i<v.length;i+=9)a+=Math.abs(polygonArea(tri(v.slice(i,i+9))));return a;};
test('both actual well-view apron overlap pairs retain their union once at the original lower datum',()=>{
 for(const [a,b]of pairs){const buckets={precinct:[...a,...b]},uv={};partitionWalkingTopsR96(buckets,uv);const overlap=Math.abs(polygonArea(clipConvex(tri(a),tri(b))));assert.ok(overlap>.001);assert.ok(Math.abs(area(buckets.precinct)-area(a)-area(b)+overlap)<1e-7);for(let i=1;i<buckets.precinct.length;i+=3)assert.equal(buckets.precinct[i],a[1]);}
});
test('real sanctuary approach builder gives both well rays one lower apron face with metric UVs',()=>{
 const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),root=new THREE.Group(),materials={precinctPaving:new THREE.MeshStandardMaterial()},surfaceY=44.122249603271484;
 buildSanctuaryApproaches(root,features,{height:()=>surfaceY},materials);const mesh=root.children[0],p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
 assert.ok(mesh.userData.apronOwnershipR96.overlaps>0);assert.equal(mesh.material,materials.sanctuaryApronMat);
 for(let i=0;i<p.count;i++){assert.ok(Math.abs(p.getY(i)-(surfaceY-.035))<2e-6);assert.ok(Math.abs(uv.getX(i)-p.getX(i)/2)<1e-5);assert.ok(Math.abs(uv.getY(i)-p.getZ(i)/2)<1e-5);}
 for(const [x,z]of [[61.42102153611313,11.617153693926607],[65.03313304434718,10.986306395605602]]){let count=0;for(let i=0;i<p.count;i+=3){const t=[0,1,2].map(j=>[p.getX(i+j),p.getZ(i+j)]),a=Math.abs(polygonArea(t)),parts=[0,1,2].reduce((s,j)=>s+Math.abs(polygonArea([t[j],t[(j+1)%3],[x,z]])),0);if(Math.abs(a-parts)<1e-7)count++;}assert.equal(count,1);}
});
