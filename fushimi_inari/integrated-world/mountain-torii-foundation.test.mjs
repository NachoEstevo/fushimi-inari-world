import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildMountainTorii} from './mountain-torii.mjs';

function fixture(){
 const material=()=>new THREE.MeshPhysicalMaterial();
 const columns=height=>mergeGeometries([-1,1].map(side=>new THREE.CylinderGeometry(.122,.135,height,16).translate(side*1.24,height/2,0)));
 const materials={blackNemakiMat:material(),entryStoneMat:material(),vermilionMat:material()};
 const legacy={materials,torii:{geometry:columns(2.62),blackGeometry:columns(.65),fresh:material(),weathered:material()}};
 const points=[[0,10,0],[0,10,40]],spatial={main:points,returning:points,graph:new Map(),anchors:[],connected:()=>points};
 const surfaces={height:()=>10,sample:()=>null,terrainHeight:(x,z)=>9+x*.15};
 return {root:new THREE.Group(),legacy,spatial,surfaces,colliders:[]};
}

test('inferred slope foundations use shared mineral finish while the authored black sleeves remain black',()=>{
 const oldDocument=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const f=fixture();
 try{
  const result=buildMountainTorii(f.root,f.legacy,f.spatial,f.surfaces,f.colliders);
  const supports=f.root.children.filter(o=>o.name==='Mountain torii grounded nemaki'||o.name==='Mountain torii mineral foundations');
  assert.ok(result.count>5);assert.equal(result.supportCount,result.count*2);
  assert.ok(supports.length>0);
  for(const support of supports){
   assert.equal(support.material,f.legacy.materials.entryStoneMat,'terrain compensation is mineral, not an elongated painted sleeve');
   assert.equal(support.geometry.parameters.radialSegments,16);
   assert.ok(support.boundingSphere.radius>0);
  }
  assert.ok(f.root.children.some(o=>o.isInstancedMesh&&o.material===f.legacy.materials.blackNemakiMat),'the original nemaki must retain its authored black paint');
  assert.equal(f.colliders.length,result.count*2,'foundation appearance must not duplicate physical owners');
  assert.equal(new Set(supports.map(o=>o.geometry)).size,1,'all spatial chunks reuse one foundation geometry');
  assert.equal(new Set(supports.map(o=>o.material)).size,1,'no per-gate material variants');
 }finally{globalThis.document=oldDocument;}
});
