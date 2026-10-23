import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {refineHondenRearVeranda} from './sanctuary-context-r94.mjs';

function source(){
 const data=fs.readFileSync(new URL('./honden.glb',import.meta.url)),n=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+n)),bin=data.subarray(28+n),scene=new THREE.Group();
 for(const mesh of json.meshes){const p=mesh.primitives[0],a=json.accessors[p.attributes.POSITION],v=json.bufferViews[a.bufferView];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*3).slice(),3));const m=new THREE.MeshStandardMaterial();m.name=json.materials[p.material].name;scene.add(new THREE.Mesh(g,m));}return scene;
}
test('actual Honden receives bounded open rear veranda with original source geometry intact',()=>{
 const scene=source(),before=scene.children.map(o=>[o,o.geometry,Array.from(o.geometry.attributes.position.array)]);
 const result=refineHondenRearVeranda(scene);assert.equal(result.built,true);assert.equal(result.posts,9);assert.equal(result.collidersAdded,0);assert.equal(result.terrainChanged,false);
 for(const [o,g,p]of before){assert.equal(o.parent,scene);assert.equal(o.geometry,g);assert.deepEqual(Array.from(g.attributes.position.array),p);}
 const group=scene.children.at(-1);assert.equal(group.children.length,2);
 for(const m of group.children){const p=m.geometry.attributes.position;for(const v of p.array)assert.ok(Number.isFinite(v));m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;assert.ok(b.min.x>=-6.5&&b.max.x<=6.5);assert.ok(b.min.z>=-38.9&&b.max.z<=-38.6);assert.ok(b.min.y>=4.53&&b.max.y<=5.50);}
 assert.equal(refineHondenRearVeranda(scene),result);assert.equal(scene.children.length,before.length+1);
});
test('unregistered asset fails closed without adding details',()=>{
 const scene=new THREE.Group();assert.equal(refineHondenRearVeranda(scene).built,false);assert.equal(scene.children.length,0);
 const wrong=source();const stone=wrong.children.find(o=>o.material.name==='MAT_Granite_Stone_Moss');stone.geometry.translate(0,0,1);const n=wrong.children.length;assert.equal(refineHondenRearVeranda(wrong).built,false);assert.equal(wrong.children.length,n);
});
