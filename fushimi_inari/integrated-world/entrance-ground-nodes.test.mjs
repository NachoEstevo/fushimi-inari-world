import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {vec3} from 'three/tsl';
import * as entrance from './entrance-ground-nodes.mjs';

function fixture(){
  const positions=[];
  for(let i=0;i<4096;i++)positions.push((i%64)*4-128,30,Math.floor(i/64)*4-128);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const material=new THREE.MeshStandardNodeMaterial(),previous=vec3(.3,.4,.2);material.colorNode=previous;
  return {geometry,material,previous,gravel:{map:new THREE.Texture()},romon:{target:[0,30,0],source:[0,0,0],yaw:0},features:{paths:[],buildings:[],water:[]}};
}
const blend=(f,asyncOptions)=>asyncOptions?entrance.blendEntranceGroundAsync(f.geometry,f.material,f.gravel,f.romon,f.features,asyncOptions):entrance.blendEntranceGround(f.geometry,f.material,f.gravel,f.romon,f.features);

test('entrance ground weights preserve the original appearance golden',()=>{
  const f=fixture();blend(f);
  const hash=createHash('sha256').update(new Uint8Array(f.geometry.attributes.entranceGround.array.buffer)).digest('hex');
  assert.equal(hash,'465cfde6b679bb900d2b29808cb9d982018b46d08b6cf9c9ca7fb66221650a3a');
});

test('paced entrance ground preserves attribute bytes and existing TSL appearance while yielding',async()=>{
  assert.equal(typeof entrance.blendEntranceGroundAsync,'function');
  const original=fixture();blend(original);
  const f=fixture(),positions=f.geometry.attributes.position.array.slice();let elapsed=0,yields=0;
  const p=f.geometry.attributes.position,getX=p.getX.bind(p);p.getX=i=>{elapsed+=.01;return getX(i);};
  await blend(f,{budgetMs:8,now:()=>elapsed,yieldWork:async()=>{yields++;}});
  assert.deepEqual(f.geometry.attributes.entranceGround.array,original.geometry.attributes.entranceGround.array);
  assert.deepEqual(p.array,positions);assert.ok(yields>1);
  assert.equal(f.material.terrainGravelMap,f.gravel.map);
  let retained=false;f.material.colorNode.traverse(node=>{if(node===f.previous)retained=true;});assert.ok(retained);
  assert.equal(f.material.colorNode.constructor,original.material.colorNode.constructor);
  assert.equal(f.material.normalNode.constructor,original.material.normalNode.constructor);
});
