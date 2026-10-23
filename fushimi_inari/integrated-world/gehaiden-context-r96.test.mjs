import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {refineGehaiden} from './gehaiden-refinements.mjs';
import {refineRomonGehaidenR95} from './romon-gehaiden-r95.mjs';
import {refineGehaidenContextR96 as refine} from './gehaiden-context-r96.mjs';
function fixture(){
 const b=readFileSync(new URL('./gehaiden.glb',import.meta.url)),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n)),bin=b.subarray(n+28),scene=new THREE.Group();
 const attr=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],T={5126:Float32Array,5123:Uint16Array,5125:Uint32Array}[a.componentType],s={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];assert.ok(!v.byteStride);return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*s).slice(),s);};
 const mats=j.materials.map(m=>{const mat=new THREE.MeshStandardMaterial();mat.name=m.name;return mat;});
 for(const node of j.nodes){if(node.mesh===undefined)continue;const p=j.meshes[node.mesh].primitives[0],g=new THREE.BufferGeometry();for(const [k,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[k]??k,attr(i));if(p.indices!==undefined)g.setIndex(attr(p.indices));scene.add(new THREE.Mesh(g,mats[p.material]));}
 refineGehaiden(scene);assert.ok(refineRomonGehaidenR95(scene,'gehaiden').built);return scene;
}
test('production stage, soffit and all 16 woven borders are repaired within existing envelope',()=>{
 const scene=fixture(),before=[];scene.traverse(o=>{if(o.isMesh)before.push([o,o.geometry,Array.from(o.geometry.attributes.position.array)]);});
 const r=refine(scene);assert.ok(r.built,JSON.stringify(r));assert.equal(r.stageBoards,36);assert.equal(r.indigoBlindBorders,80);assert.equal(r.blindPanels,16);assert.equal(r.materialBatches,4);assert.equal(r.collidersAdded,0);
 for(const [mesh,g,p]of before){assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),p);assert.ok(mesh.parent);if(mesh.geometry!==g)assert.equal(mesh.material.color.getHexString(),'a9a69b');}
 const group=scene.children.at(-1);assert.equal(refine(scene),r);assert.equal(scene.children.at(-1),group);
 for(const mesh of group.children){for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));assert.ok(mesh.geometry.attributes.uv);mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;assert.ok(b.min.y>2.4);assert.ok(b.max.y<5.5);assert.ok(b.min.x>=-5.4);assert.ok(b.max.x<=5.4);assert.ok(b.min.z>=-16.1);assert.ok(b.max.z<=-8.9);}
 const floor=group.children.find(o=>o.material.name.includes('stage'));floor.geometry.computeBoundingBox();assert.ok(Math.abs(floor.geometry.boundingBox.max.y-2.427)<1e-5);
});
test('unprepared or altered R95 woven source refuses before touching stage or other materials',()=>{
 const empty=new THREE.Group();assert.equal(refine(empty).built,false);assert.equal(empty.children.length,0);
 const scene=fixture(),tape=scene.getObjectByName('gehaiden source-referenced architectural completion R95').children.find(o=>o.material.color.getHexString()==='a9a69b');
 tape.geometry=new THREE.BoxGeometry();const children=[...scene.children],g=tape.geometry;assert.equal(refine(scene).built,false);assert.equal(tape.geometry,g);assert.deepEqual(scene.children,children);
});
