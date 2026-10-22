import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {refineNaihaiden,isNaihaidenExposedRafterTriangle} from './naihaiden-refinements.mjs';

export function loadNaihaidenSource(){
  const data=fs.readFileSync(new URL('./naihaiden.glb',import.meta.url)),length=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+length)),bin=data.subarray(28+length);
  const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array};
  const attribute=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],Type=types[a.componentType];assert.ok(!v.byteStride);return new THREE.BufferAttribute(new Type(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*widths[a.type]).slice(),widths[a.type],!!a.normalized);};
  const colors={MAT_Copper_Patina_Green:'#345c51',MAT_Vermilion_ShuIro:'#b63b26',MAT_White_Shikku_Plaster:'#ded9ca',MAT_Gold_Kanagu_Leaf:'#b8a052',MAT_Granite_Stone_Moss:'#8c8e82',MAT_Straw_Shimenawa:'#b1a375',MAT_Black_Lacquer_Nemaki:'#292b27'};
  const mats=json.materials.map(m=>{const mat=new THREE.MeshStandardMaterial({color:colors[m.name]??'#aaa38c',side:THREE.DoubleSide});mat.name=m.name;return mat;});
  const scene=new THREE.Group();
  for(const node of json.nodes){if(node.mesh===undefined)continue;assert.ok(!node.matrix&&!node.translation&&!node.rotation&&!node.scale);const p=json.meshes[node.mesh].primitives[0],geo=new THREE.BufferGeometry();for(const [name,i]of Object.entries(p.attributes))geo.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[name]??name,attribute(i));if(p.indices!==undefined)geo.setIndex(attribute(p.indices));const mesh=new THREE.Mesh(geo,mats[p.material]);mesh.name=json.meshes[node.mesh].name;scene.add(mesh);}
  const materials={vermilionMat:mats.find(m=>m.name==='MAT_Vermilion_ShuIro'),goldMat:mats.find(m=>m.name==='MAT_Gold_Kanagu_Leaf')};return {scene,materials};
}

test('actual GLB gets one sagging prayer facade while roof, stairs and lanterns retain exact geometry',()=>{
  const {scene,materials}=loadNaihaidenSource(),before=scene.children.filter(m=>!/MAT_Straw_Shimenawa|MAT_White_Shikku_Plaster|MAT_Gold_Kanagu_Leaf|MAT_Vermilion_ShuIro/.test(m.material.name)).map(m=>[m,m.geometry,Array.from(m.geometry.attributes.position.array)]);
  const red=scene.children.find(m=>m.material.name==='MAT_Vermilion_ShuIro'),expanded=red.geometry.index?red.geometry.toNonIndexed():red.geometry,p=expanded.attributes.position,preserved=[],stations=[-6.6,-6.1875,-5.775,-5.3625,5.3625,5.775,6.1875,6.6],counts=new Map(stations.map(x=>[x,0]));let removed=0;
  for(let i=0;i<p.count;i+=3){const triangle=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);if(isNaihaidenExposedRafterTriangle(triangle)){removed++;const x=stations.find(x=>triangle.every(v=>Math.abs(v[0]-x)<.038));counts.set(x,counts.get(x)+1);}else preserved.push(...triangle.flat());}
  for(const [station,count]of counts)assert.equal(count,216,'exact front/rear bevelled rafter pair at x='+station);
  const white=scene.children.find(m=>m.material.name==='MAT_White_Shikku_Plaster');white.userData.interaction='preserved';
  const report=refineNaihaiden(scene,materials);assert.ok(report);assert.ok(report.paperTrianglesRemoved>=84);assert.ok(report.goldPlaqueTrianglesRemoved>0);assert.equal(report.shide,11);assert.equal(report.ropePlies,3);assert.equal(report.collidersAdded,0);
  assert.equal(removed,1728);assert.equal(report.exposedRafterTrianglesRemoved,removed);assert.deepEqual(Array.from(red.geometry.attributes.position.array),preserved,'all columns, wall and hidden rafters remain byte-for-byte');
  for(const [mesh,geometry,positions]of before){assert.equal(mesh.geometry,geometry);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions);assert.equal(mesh.parent,scene);}
  assert.equal(white.userData.interaction,'preserved');const group=scene.getObjectByName('Naihaiden photo-backed curved soffit and prayer facade');assert.ok(group);assert.equal(group.children.length,7);
  for(const mesh of group.children){for(const value of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(value));mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.min.z>=-23.9);assert.ok(mesh.geometry.boundingBox.max.z<=-21.75);}
  const children=scene.children.length;assert.equal(refineNaihaiden(scene,materials),report);assert.equal(scene.children.length,children);
});
test('future asset without exact rope source signature is not modified',()=>{
  const {scene,materials}=loadNaihaidenSource();scene.children.find(m=>m.material.name==='MAT_Straw_Shimenawa').geometry=new THREE.BoxGeometry(1,1,1);const children=scene.children.length;
  assert.equal(refineNaihaiden(scene,materials),null);assert.equal(scene.children.length,children);
});
