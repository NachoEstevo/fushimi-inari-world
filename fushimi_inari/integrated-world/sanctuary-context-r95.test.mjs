import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {refineHondenOpenEnclosure,refineNaihaidenPrayerFront,refineNaihaidenArchitecture,isHondenSolidFenceTriangle,TAMAGAKI_RUNS} from './sanctuary-context-r95.mjs';
import {refineHondenRearVeranda} from './sanctuary-context-r94.mjs';
import {refineNaihaiden} from './naihaiden-refinements.mjs';
function load(file){
 const d=fs.readFileSync(new URL(file,import.meta.url)),n=d.readUInt32LE(12),j=JSON.parse(d.subarray(20,20+n)),bin=d.subarray(28+n),scene=new THREE.Group();
 const attribute=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],T={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*size).slice(),size);};
 for(const mesh of j.meshes){const p=mesh.primitives[0],g=new THREE.BufferGeometry();for(const [key,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[key]??key,attribute(i));if(p.indices!==undefined)g.setIndex(attribute(p.indices));const m=new THREE.MeshStandardMaterial();m.name=j.materials[p.material].name;scene.add(new THREE.Mesh(g,m));}return scene;
}
const red=s=>s.children.find(o=>o.material?.name==='MAT_Vermilion_ShuIro');
test('production Honden replaces complete five solid walls preserving every other triangle and attribute',()=>{
 const scene=load('./honden.glb'),mesh=red(scene),src=mesh.geometry.toNonIndexed(),keep=[];let removed=0;
 const p=src.attributes.position;for(let i=0;i<p.count;i+=3){if(isHondenSolidFenceTriangle([0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k)])))removed++;else keep.push(i,i+1,i+2);}
 assert.equal(removed,540);const others=scene.children.filter(o=>o!==mesh).map(o=>[o,o.geometry]);const r=refineHondenOpenEnclosure(scene);assert.equal(r.built,true);assert.equal(r.removedTriangles,540);assert.equal(r.runs,5);assert.ok(r.pickets>250);
 for(const [key,a]of Object.entries(src.attributes)){const expected=keep.flatMap(i=>Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize)));assert.deepEqual(Array.from(mesh.geometry.attributes[key].array),expected,key);}
 for(const [o,g]of others){assert.equal(o.parent,scene);assert.equal(o.geometry,g);}
 const group=scene.children.at(-1);for(const m of group.children){const p=m.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=[p.getX(i),p.getY(i),p.getZ(i)];assert.ok(v.every(Number.isFinite));assert.ok(v[1]>=3.199&&v[1]<=4.851);assert.ok(TAMAGAKI_RUNS.some(([x,z,w,d])=>Math.abs(v[0]-x)<=w/2+.001&&Math.abs(v[2]-z)<=d/2+.001));}}
 assert.equal(refineHondenOpenEnclosure(scene),r);
});
test('incomplete Honden signature fails without altering original source',()=>{
 const scene=load('./honden.glb'),mesh=red(scene);mesh.geometry.translate(0,0,1);const original=mesh.geometry,n=scene.children.length;assert.equal(refineHondenOpenEnclosure(scene).built,false);assert.equal(mesh.geometry,original);assert.equal(scene.children.length,n);
});
test('production Naihaiden receives four open offering grilles and nine cords without mutating source',()=>{
 const scene=load('./naihaiden.glb'),before=scene.children.map(o=>[o,o.geometry]);const r=refineNaihaidenPrayerFront(scene);assert.equal(r.built,true);assert.equal(r.offeringBays,4);assert.equal(r.bellCords,9);assert.equal(r.collidersAdded,0);assert.equal(r.terrainChanged,false);
 for(const [o,g]of before){assert.equal(o.parent,scene);assert.equal(o.geometry,g);}
 for(const m of scene.children.at(-1).children){m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;assert.ok(b.min.y>=3.98&&b.max.y<=7.351);assert.ok(b.min.x>=-4.81&&b.max.x<=4.81);assert.ok(b.min.z>=-23.73&&b.max.z<=-23.54);for(const v of m.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}
 assert.equal(refineNaihaidenPrayerFront(scene),r);assert.equal(refineNaihaidenPrayerFront(load('./honden.glb')).built,false);
});
test('prior veranda and prayer-facade refinements retain their owners when R95 runs afterwards',()=>{
 const honden=load('./honden.glb');assert.equal(refineHondenRearVeranda(honden).built,true);const railing=honden.children.at(-1);assert.equal(refineHondenOpenEnclosure(honden).built,true);assert.equal(railing.parent,honden);
 const naihaiden=load('./naihaiden.glb');assert.ok(refineNaihaiden(naihaiden));const front=naihaiden.getObjectByName('Naihaiden photo-backed curved soffit and prayer facade');assert.equal(refineNaihaidenPrayerFront(naihaiden).built,true);assert.equal(front.parent,naihaiden);
});
test('Naihaiden architecture retains roof plan and rear junction while correcting closed front finish',()=>{
 const scene=load('./naihaiden.glb');refineNaihaiden(scene);const roof=scene.children.find(o=>o.material?.name==='MAT_Copper_Patina_Green'),before=Array.from(roof.geometry.attributes.position.array);const result=refineNaihaidenArchitecture(scene);assert.equal(result.built,true,JSON.stringify(result));assert.equal(result.coreFacesRecolored,20);assert.ok(result.roofVerticesMoved>100);const p=roof.geometry.attributes.position.array;
 for(let i=0;i<p.length;i+=3){assert.equal(p[i],before[i]);assert.equal(p[i+2],before[i+2]);if(before[i+2]<=-24.52||before[i+1]<=7.30||Math.abs(before[i])>=4.2)assert.equal(p[i+1],before[i+1]);assert.ok(Number.isFinite(p[i+1]));}
 assert.equal(refineNaihaidenArchitecture(scene),result);assert.equal(refineNaihaidenPrayerFront(scene).built,true);
});
