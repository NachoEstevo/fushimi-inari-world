import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {refineShrineBuilding,refineShrineBuildingAsync} from './shrine-building-refinements.mjs';

const fingerprint=scene=>{
 const hash=createHash('sha256');
 scene.traverse(object=>{
  hash.update(JSON.stringify([object.name,object.type,object.matrix.toArray(),object.castShadow,object.receiveShadow]));
  if(!object.isMesh)return;
  hash.update(JSON.stringify([object.material.name,object.geometry.groups]));
  for(const [name,attribute]of Object.entries(object.geometry.attributes)){
   hash.update(name);hash.update(Buffer.from(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength));
  }
  if(object.geometry.index)hash.update(Buffer.from(object.geometry.index.array.buffer));
 });
 return hash.digest('hex');
};

test('task-staged refinements preserve every authored building geometry and diagnostic',async()=>{
 const previousDocument=globalThis.document;
 globalThis.document??={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 try{
  for(const id of ['romon','gehaiden','naihaiden','honden']){
   const bytes=await readFile(new URL(`${id}.glb`,import.meta.url));
   const parse=()=>new GLTFLoader().register(()=>({name:'test-no-images',loadTexture:()=>Promise.resolve(new THREE.Texture())})).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
   const materialSet=()=>new Proxy({}, {get:(target,key)=>target[key]??=new THREE.MeshStandardMaterial({name:String(key)})});
   const sync=(await parse()).scene,staged=(await parse()).scene,syncDiagnostics={},asyncDiagnostics={},stages=[];
   refineShrineBuilding(sync,id,materialSet(),{diagnostics:syncDiagnostics});
   let yields=0;
   assert.equal(await refineShrineBuildingAsync(staged,id,materialSet(),{diagnostics:asyncDiagnostics,yieldWork:async()=>{yields++;},timing:(name,ms)=>{assert.ok(ms>=0);stages.push(name);}}),staged);
   assert.equal(fingerprint(staged),fingerprint(sync),id);
   assert.deepEqual(asyncDiagnostics,syncDiagnostics,id);assert.equal(yields,stages.length);assert.ok(yields>2);
   if(id==='romon')assert.ok(stages.includes('romon-wings'));
  }
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
