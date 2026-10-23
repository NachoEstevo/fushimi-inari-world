import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {refineRomonWings} from './romon-wings.mjs';
import {refineRomonPrecinctR96 as refine} from './romon-precinct-r96.mjs';
function fixture(){
 const bytes=readFileSync(new URL('./romon.glb',import.meta.url)),n=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+n)),bin=bytes.subarray(n+28),scene=new THREE.Group();
 const attr=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],T={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType],s={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];assert.ok(!v.byteStride);return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*s).slice(),s);};
 const mats=j.materials.map(m=>{const mat=new THREE.MeshStandardMaterial();mat.name=m.name;return mat;});
 for(const node of j.nodes){if(node.mesh===undefined)continue;const p=j.meshes[node.mesh].primitives[0],g=new THREE.BufferGeometry();for(const [key,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[key]??key,attr(i));if(p.indices!==undefined)g.setIndex(attr(p.indices));scene.add(new THREE.Mesh(g,mats[p.material]));}
 const materials={};for(const [name,pattern]of Object.entries({vermilionMat:/Vermilion/,plasterMat:/White_Shikku/,goldMat:/Gold_Kanagu/,stoneMat:/Granite/,copperRoofMat:/Copper_Patina/,blackNemakiMat:/Black_Lacquer/}))materials[name]=mats.find(m=>pattern.test(m.name));
 assert.ok(refineRomonWings(scene,materials).reconstructed);return {scene,materials};
}
test('production galleries receive complete static joinery packet while every source geometry survives',()=>{
 const {scene,materials}=fixture(),before=[];scene.traverse(o=>{if(o.isMesh)before.push([o,o.geometry,Array.from(o.geometry.attributes.position.array)]);});
 const report=refine(scene,materials);assert.ok(report.built);assert.equal(report.galleries,2);assert.equal(report.transverseBracketArms,24);assert.equal(report.stoneColumnShoes,24);assert.equal(report.goldJointPlates,42);assert.equal(report.materialBatches,3);assert.equal(report.collidersAdded,0);
 for(const [mesh,g,p]of before){assert.equal(mesh.geometry,g);assert.deepEqual(Array.from(g.attributes.position.array),p);assert.ok(mesh.parent);}
 const group=scene.children.at(-1);assert.equal(refine(scene,materials),report);assert.equal(scene.children.at(-1),group);
 for(const mesh of group.children){const g=mesh.geometry;assert.ok(g.attributes.uv);for(const x of g.attributes.position.array)assert.ok(Number.isFinite(x));g.computeBoundingBox();assert.ok(g.boundingBox.min.y>=2.04999);assert.ok(g.boundingBox.max.y<7.4);assert.ok(g.boundingBox.min.z>=-2.10001);assert.ok(g.boundingBox.max.z<=2.10001);}
});
test('unprepared or changed gallery integration refuses without partial insertion',()=>{
 const scene=new THREE.Group();assert.equal(refine(scene).built,false);assert.equal(scene.children.length,0);
 scene.userData.romonWingDetail={reconstructed:true};assert.equal(refine(scene).built,false);assert.equal(scene.children.length,0);
 const group=new THREE.Group();group.name='Romon Kairo facade refinement';scene.add(group);assert.equal(refine(scene).built,false);assert.equal(scene.children.length,1);
});
