import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {buildGondenRearLandscape,buildGondenRearLandscapeAsync} from './gonden-rear-landscape.mjs';
import {buildHondenRearBoundary,buildHondenRearBoundaryAsync} from './honden-rear-boundary.mjs';
import {buildTamayamaForecourt,buildTamayamaForecourtAsync} from './tamayama-forecourt.mjs';
import {buildOfficeGardenBanks} from './office-garden-banks.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const distant=[-900,20,900,-899,21,900,-900,20,901];
function digest(root,record,colliders=[]){
 const h=createHash('sha256');root.traverse(o=>{if(!o.isMesh)return;h.update(o.name);for(const key of Object.keys(o.geometry.attributes).sort()){h.update(key);h.update(Buffer.from(o.geometry.attributes[key].array.buffer));}if(o.instanceMatrix)h.update(Buffer.from(o.instanceMatrix.array.buffer));if(o.instanceColor)h.update(Buffer.from(o.instanceColor.array.buffer));});h.update(JSON.stringify(record));h.update(JSON.stringify(colliders));return h.digest('hex');
}
function fixture(kind,typed){
 const root=new THREE.Group(),colliders=[],shrine=new THREE.Group();let positions,args,build,buildAsync;
 if(kind==='gonden'){
  root.add(shrine);shrine.userData.zone='gonden';shrine.position.set(73.5,47,-22);shrine.rotation.y=-Math.PI/2+.06;
  const y=(x,z)=>48+.13*x-.04*z;
  positions=[[60,y(60,-35),-35],[60,y(60,-10),-10],[90,y(90,-35),-35],[90,y(90,-35),-35],[60,y(60,-10),-10],[90,y(90,-10),-10]].flat().concat(distant);
  args=[root,{}, {segments:[]},{stoneMat:new THREE.MeshStandardMaterial(),roofMat:new THREE.MeshStandardMaterial()},colliders];build=buildGondenRearLandscape;buildAsync=buildGondenRearLandscapeAsync;
 }else if(kind==='honden'){
  positions=[73,8,-5,82,8.3,-5,82,8.3,1,73,8,-5,82,8.3,1,73,8,1,...distant];
  args=[root,features,{height:()=>100,segments:[]},{},colliders];build=buildHondenRearBoundary;buildAsync=buildHondenRearBoundaryAsync;
 }else{
  shrine.userData={zone:'tamayama',tamayamaDetail:{}};shrine.position.set(103.331,50.083474,-33.979);shrine.rotation.y=-Math.PI/2;root.add(shrine);
  const f=tamayamaAccessFeatures(features),paths=f.paths.filter(p=>p.points.some(q=>q[0]>90&&q[0]<110&&q[2]>-45&&q[2]<-10)),network=makePathSurfaces({paths},()=>50.083474);network.terrainHeight=()=>100;
  const plane=(x,z)=>50+(x-97)*.05+(z+30)*.08,p=(x,z)=>[x,plane(x,z),z];
  positions=[...p(90,-45),...p(90,-10),...p(110,-45),...p(110,-45),...p(90,-10),...p(110,-10),...distant];
  args=[root,f,network,{gravelMat:new THREE.MeshStandardMaterial()}];build=buildTamayamaForecourt;buildAsync=buildTamayamaForecourtAsync;
 }
 return {root,colliders,args,build,buildAsync,positions:typed?new Float32Array(positions):positions};
}
// Complete attributes, instance buffers, records and colliders captured before
// adding scalar broad phases, immutable-sampler reuse or cooperative wrappers.
const golden={
 gonden:['a0c3213f8f13dc94cb587cfb549b13e295561a594b10f297c81f2a9d77ad55e7','bc71ca00e408e914456f9dbc58a113e9f9f46b7bc402eacb1ab090882dd46ede'],
 honden:['3dc0dd72b9de33ce93251014b9680de6f5293c58b3f257f505e4328c22c438ee','da3ca88a17365f00d6dc8d65b83d3530fb08c5aabbe6a00e3365d8c101fb4bec'],
 tamayama:['c9a79bd132b9d3583477cd0d8ead028cd91d238dc35ee78490e770af385145df','aabc6c67d8a475c3bc40e0fb33672dd2c1fc8e41c63c554830387d5a2bd3a406']
};
for(const kind of Object.keys(golden))test(`${kind} construction keeps exact native buffers and yields before publishing`,async()=>{
 for(const typed of [false,true])for(const paced of [false,true]){
  const f=fixture(kind,typed),before=f.root.children.length;let time=0,yields=0;
  const options={terrainPositions:f.positions,clock:()=>time+=33,yieldWork:async()=>{yields++;assert.equal(f.root.children.length,before);assert.equal(f.colliders.length,0);await new Promise(setImmediate);}};
  const record=await (paced?f.buildAsync:f.build)(...f.args,options);
  assert.equal(record.built??true,true);assert.equal(digest(f.root,record,f.colliders),golden[kind][Number(typed)]);if(paced)assert.ok(yields>0);
 }
});
test('garden immutable height reuse preserves complete native geometry and metadata',()=>{
 const root=new THREE.Group(),record=buildOfficeGardenBanks(root,features,{segments:[],terrainHeight:(x,z)=>46+x*.01+z*.002});
 assert.equal(digest(root,record),'169a961350863dacab2eb003b9a36340653b02f76a2b4c2af3dbfba1008b0956');
});
test('interrupted local terrain builders do not publish partial scenery or colliders',async()=>{
 for(const kind of Object.keys(golden)){
  const f=fixture(kind,false),before=f.root.children.length,error=Error('cancelled preparation');let time=0;
  await assert.rejects(f.buildAsync(...f.args,{terrainPositions:f.positions,clock:()=>time+=33,yieldWork:()=>Promise.reject(error)}),value=>value===error);
  assert.equal(f.root.children.length,before);assert.equal(f.colliders.length,0);
 }
});
