import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildKandakaraShrine} from './kandakara-shrine.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));

test('named footprint owns a bounded static shrine without new colliders or lights',()=>{
 const root=new THREE.Group(),before=JSON.stringify(features),stone=new THREE.MeshStandardMaterial();
 const normal=new THREE.Texture(),roughness=new THREE.Texture();
 const woodSource=new THREE.MeshStandardMaterial({normalMap:normal,roughnessMap:roughness});
 const roofSource=new THREE.MeshStandardMaterial({normalMap:normal,roughnessMap:roughness});
 const result=buildKandakaraShrine(root,features,{height:()=>81},{entryStoneMat:stone,vermilionMat:woodSource,copperRoofMat:roofSource});
 assert.deepEqual(result.builtIds,['way/626313677']);
 assert.equal(result.extraLights,0);assert.equal(result.extraColliders,0);
 assert.equal(result.dimensionsInferred,true);assert.equal(result.roofInferred,true);
 assert.equal(result.front,'west approach');assert.equal(result.shide,4);assert.equal(result.steps,3);assert.equal(result.stepRise,.15);
 assert.equal(result.visualFloorOnly,true);assert.equal(result.landingInferred,true);assert.equal(result.counterInferred,true);assert.ok(result.batches<=5);assert.ok(result.triangles<1600);
 assert.equal(JSON.stringify(features),before);
 assert.equal(buildKandakaraShrine(root,features,{height:()=>81},{}),result);
 const footprint=features.buildings.find(b=>b.id===result.builtIds[0]).points;
 const x=footprint.map(p=>p[0]),z=footprint.map(p=>p[2]);
 let visualStone=null,wood=null,roof=null,woodGeometry=null;
 root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;
  if(o.material.name==='Kandakara visual-only stone')visualStone=o.material;
  if(o.material.name==='Kandakara timber'){wood=o.material;woodGeometry=o.geometry;}
  if(o.material.name==='Kandakara dark roof')roof=o.material;
  for(let i=0;i<p.count;i++){
   assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));
   assert.ok(p.getX(i)>=Math.min(...x)-.06&&p.getX(i)<=Math.max(...x)+.06);
   assert.ok(p.getZ(i)>=Math.min(...z)-.06&&p.getZ(i)<=Math.max(...z)+.06);
  }
 });
 assert.ok(visualStone);assert.notEqual(visualStone,stone);
 assert.equal(wood.normalMap,normal);assert.equal(wood.roughnessMap,roughness);assert.equal(wood.normalScale.x,.16);
 assert.equal(wood.vertexColors,true);assert.equal(wood.map.colorSpace,THREE.SRGBColorSpace);assert.equal(wood.map.wrapS,THREE.RepeatWrapping);
 assert.equal(woodGeometry.attributes.color.count,woodGeometry.attributes.position.count);
 const shades=woodGeometry.attributes.color.array;assert.ok([...shades].every(v=>Number.isFinite(v)&&v>=.5&&v<=1));assert.ok(Math.min(...shades)<.7);
 const positions=woodGeometry.attributes.position,colors=woodGeometry.attributes.color,front=[],rear=[];
 for(let i=0;i<positions.count;i++)if(positions.getY(i)>82){if(positions.getX(i)<382.9)front.push(colors.getX(i));if(positions.getX(i)>386.8)rear.push(colors.getX(i));}
 assert.ok(front.length&&rear.length);assert.ok(front.reduce((a,b)=>a+b,0)/front.length>rear.reduce((a,b)=>a+b,0)/rear.length+.15,'timber recedes into shade behind the exposed frontage');
 assert.ok([...woodGeometry.attributes.uv.array].every(Number.isFinite));
 assert.equal(roof.normalMap,normal);assert.equal(roof.roughnessMap,roughness);assert.notEqual(roof,roofSource);
});
test('missing source footprint or invalid terrain does not claim ownership',()=>{
 for(const [f,s] of [[{...features,buildings:[]},{height:()=>81}],[features,{height:()=>NaN}]]){
  const result=buildKandakaraShrine(new THREE.Group(),f,s,{});
  assert.deepEqual(result.builtIds,[]);
 }
});

test('changed or malformed footprints leave the generic owner available',()=>{
 for(const points of [[[0,0,0],[1,0,0],[0,0,1],[0,0,0]],features.buildings.find(b=>b.id==='way/626313677').points.map(p=>[p[0]+10,p[1],p[2]])]){
  const input={...features,buildings:[{id:'way/626313677',points}]};
  const root=new THREE.Group();assert.deepEqual(buildKandakaraShrine(root,input,{height:()=>81},{}).builtIds,[]);assert.equal(root.children.length,0);
 }
});
