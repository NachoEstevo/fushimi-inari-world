import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installWalking} from './walking.mjs';
function fixture({sample=true,colliders=[],isWalkable}={}){
 const saved={document:globalThis.document,location:globalThis.location,addEventListener:globalThis.addEventListener},els=new Map();
 globalThis.document={body:{dataset:{},classList:{add(){},remove(){}}},getElementById(id){if(!els.has(id))els.set(id,{hidden:false,textContent:''});return els.get(id);}};
 globalThis.location={search:''};globalThis.addEventListener=()=>{};
 const camera=new THREE.PerspectiveCamera();camera.position.set(20,30,40);const controls={enabled:true,target:new THREE.Vector3()};
 const assembly={colliders,isWalkable,spatial:{main:[],returning:[]},surfaces:{segments:[],sample:()=>sample?{segment:{id:'way/105449722',kind:'stone'}}:null,height:()=>33.664626},walkHeight:()=>33.664626};
 const walker=installWalking({camera,controls,renderer:{domElement:{addEventListener(){}}},ground:()=>33.664626,assembly,audio:{step(){}},onStart(){}});
 return {camera,controls,walker,restore(){for(const [k,v]of Object.entries(saved)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}};
}
test('arrival teleport accepts mapped clear crossing and retains its exact requested center',()=>{
 const f=fixture();try{assert.equal(f.walker.teleport([-157.407,33.664626,10.342],[-138.295876,35.364626,10.764595]),true);assert.ok(Math.abs(f.camera.position.x+157.407)<1e-9);assert.ok(Math.abs(f.camera.position.z-10.342)<1e-9);assert.ok(Math.abs(f.camera.position.y-35.364626)<1e-9);assert.equal(f.walker.mode,'walk');assert.equal(f.controls.enabled,false);}finally{f.restore();}
});
test('teleport still rejects missing mapped surface without moving camera',()=>{
 const f=fixture({sample:false});try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});
test('teleport still rejects a crossing covered by a solid collision without bypassing it',()=>{
 const f=fixture({colliders:[{type:'box',args:[-157.407,10.342,5,5,0,30,40,'test_solid']}]});try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});
test('registered station paving can accept teleport without inventing a mapped path',()=>{
 const f=fixture({sample:false,isWalkable:(x,z)=>x>=-159&&x<=-155&&z>=8&&z<=12});
 try{assert.equal(f.walker.teleport([-157.407,0,10.342],[-150,35.364626,10.342]),true);assert.equal(f.camera.position.x,-157.407);assert.equal(f.walker.mode,'walk');}finally{f.restore();}
});
test('registered paving does not bypass the collider check',()=>{
 const f=fixture({sample:false,isWalkable:()=>true,colliders:[{type:'box',args:[-157.407,10.342,5,5,0,30,40,'station_wall']}]});
 try{assert.equal(f.walker.teleport([-157.407,0,10.342],[0,0,0]),false);assert.deepEqual(f.camera.position.toArray(),[20,30,40]);}finally{f.restore();}
});
