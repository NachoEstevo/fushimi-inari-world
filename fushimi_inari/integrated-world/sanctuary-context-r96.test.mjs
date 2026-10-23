import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {refineHondenServiceEnvelopeR96,HONDEN_R96_ENVELOPE} from './sanctuary-context-r96.mjs';
import {refineHondenRearVeranda} from './sanctuary-context-r94.mjs';
import {refineHondenOpenEnclosure} from './sanctuary-context-r95.mjs';
function load(file='honden'){
 const d=fs.readFileSync(new URL(`./${file}.glb`,import.meta.url)),n=d.readUInt32LE(12),j=JSON.parse(d.subarray(20,20+n)),bin=d.subarray(28+n),scene=new THREE.Group();
 const attribute=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*size).slice(),size);};
 for(const mesh of j.meshes){const p=mesh.primitives[0],g=new THREE.BufferGeometry();for(const [key,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[key]??key,attribute(i));if(p.indices!==undefined)g.setIndex(attribute(p.indices));const m=new THREE.MeshStandardMaterial();m.name=j.materials[p.material].name;scene.add(new THREE.Mesh(g,m));}return scene;
}
test('actual Honden packet retains earlier source owners and adds four photographed categories',()=>{
 const scene=load();refineHondenRearVeranda(scene);refineHondenOpenEnclosure(scene);const before=scene.children.map(o=>[o,o.geometry]);const r=refineHondenServiceEnvelopeR96(scene);
 assert.equal(r.built,true);assert.equal(r.sideVerandaReturns,2);assert.equal(r.rearRafterEnds,49);assert.equal(r.downpipes,1);assert.equal(r.netSupportTies,5);assert.equal(r.materialBatches,3);assert.equal(r.collidersAdded,0);assert.equal(r.terrainChanged,false);
 for(const [o,g]of before){assert.equal(o.parent,scene);assert.equal(o.geometry,g);}assert.equal(refineHondenServiceEnvelopeR96(scene),r);
 for(const mesh of scene.children.at(-1).children){const p=mesh.geometry.attributes.position;assert.equal(mesh.geometry.attributes.uv.count,p.count);for(let i=0;i<p.count;i++)for(const [axis,read]of [['x','getX'],['y','getY'],['z','getZ']]){const v=p[read](i);assert.ok(Number.isFinite(v));assert.ok(v>=HONDEN_R96_ENVELOPE[axis][0]-.001&&v<=HONDEN_R96_ENVELOPE[axis][1]+.001,`${axis}: ${v}`);}}
});
test('different asset and shifted Honden fail closed without mutation',()=>{
 const other=load('naihaiden'),count=other.children.length;assert.equal(refineHondenServiceEnvelopeR96(other).built,false);assert.equal(other.children.length,count);
 const scene=load();scene.children.find(o=>o.material.name==='MAT_Granite_Stone_Moss').geometry.translate(0,0,1);const n=scene.children.length;assert.equal(refineHondenServiceEnvelopeR96(scene).built,false);assert.equal(scene.children.length,n);
});
test('all detail stays inside existing fenced exclusion, leaving public walking corridors unchanged',()=>{
 const scene=load();const r=refineHondenServiceEnvelopeR96(scene);assert.equal(r.built,true);
 for(const mesh of scene.children.at(-1).children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){assert.ok(Math.abs(p.getX(i))<10.39);assert.ok(p.getZ(i)>-41.39&&p.getZ(i)<-23.91);}}
});
