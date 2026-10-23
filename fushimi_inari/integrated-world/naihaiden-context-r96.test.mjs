import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {refineNaihaidenContextR96} from './naihaiden-context-r96.mjs';
import {refineNaihaiden} from './naihaiden-refinements.mjs';
import {refineNaihaidenArchitecture,refineNaihaidenPrayerFront} from './sanctuary-context-r95.mjs';
function load(file='naihaiden'){
 const d=fs.readFileSync(new URL(`./${file}.glb`,import.meta.url)),n=d.readUInt32LE(12),j=JSON.parse(d.subarray(20,20+n)),bin=d.subarray(28+n),scene=new THREE.Group();
 const attribute=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*size).slice(),size);};
 for(const mesh of j.meshes){const p=mesh.primitives[0],g=new THREE.BufferGeometry();for(const [key,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[key]??key,attribute(i));if(p.indices!==undefined)g.setIndex(attribute(p.indices));const m=new THREE.MeshStandardMaterial();m.name=j.materials[p.material].name;scene.add(new THREE.Mesh(g,m));}return scene;
}

function prepared(){const scene=load();refineNaihaiden(scene);refineNaihaidenArchitecture(scene);refineNaihaidenPrayerFront(scene);return scene;}
test('actual refined Naihaiden gains photographed hanging lanterns, shade headers and transom mesh',()=>{
 const scene=prepared(),before=[];scene.traverse(o=>{if(o.isMesh)before.push([o,o.geometry,Array.from(o.geometry.attributes.position.array),o.geometry.attributes.uv&&Array.from(o.geometry.attributes.uv.array),o.parent]);});const r=refineNaihaidenContextR96(scene);
 assert.equal(r.built,true,JSON.stringify(r));assert.equal(r.hangingLanterns,2);assert.equal(r.rolledShadeHeaders,5);assert.equal(r.transomMeshBays,5);assert.equal(r.materialBatches,4);assert.equal(r.collidersAdded,0);assert.equal(r.terrainChanged,false);
 for(const [o,g,p,uv,parent]of before){assert.equal(o.parent,parent);assert.equal(o.geometry,g);assert.deepEqual(Array.from(g.attributes.position.array),p);if(uv)assert.deepEqual(Array.from(g.attributes.uv.array),uv);}
 assert.equal(refineNaihaidenContextR96(scene),r);
 for(const mesh of scene.children.at(-1).children){const p=mesh.geometry.attributes.position;assert.equal(mesh.geometry.attributes.uv.count,p.count);for(let i=0;i<p.count;i++)for(const [axis,read]of [['x','getX'],['y','getY'],['z','getZ']]){const v=p[read](i);assert.ok(Number.isFinite(v));assert.ok(v>=r.bounds[axis][0]-.001&&v<=r.bounds[axis][1]+.001,axis+': '+v);}}
 assert.equal(r.triangles,3052);assert.equal(r.primitives,246);
});
test('unrefined or shifted source rejects addition without altering scene',()=>{
 const source=load();const count=source.children.length;assert.equal(refineNaihaidenContextR96(source).built,false);assert.equal(source.children.length,count);
 const shifted=prepared();shifted.children.find(o=>o.material?.name==='MAT_Granite_Stone_Moss').geometry.translate(0,0,1);const n=shifted.children.length;assert.equal(refineNaihaidenContextR96(shifted).built,false);assert.equal(shifted.children.length,n);
});
test('lanterns retain 1.96m overhead clearance and shade headers stay on solid rear core',()=>{
 const scene=prepared(),r=refineNaihaidenContextR96(scene);assert.equal(r.built,true);
 for(const mesh of scene.children.at(-1).children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){assert.ok(p.getY(i)>=5.55-.001);assert.ok(p.getZ(i)<-22.72+.001);if(p.getZ(i)>-24)assert.ok(p.getY(i)>=5.88-.001);}}
});
