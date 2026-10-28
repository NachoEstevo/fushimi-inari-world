import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createZenCat} from './zen-cat.mjs';

const path=new URL('../assets/models/cat/Mugi.glb',import.meta.url);
const loadAsset=()=>{const bytes=readFileSync(path);return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
function fixture(options={}){
 const assembly={root:new THREE.Group(),legacy:{interactables:[]},keihanStation:{spec:{platformFloor:30}}},camera=new THREE.PerspectiveCamera(),events=[];
 const cat=createZenCat({assembly,camera,onAction:e=>events.push(e),loadAsset,...options});
 return {cat,assembly,camera,events};
}

test('the real author cat loads before interaction and stays in a two-draw zero-texture budget',async()=>{
 let resolve;const source=await loadAsset(),f=fixture({loadAsset:()=>new Promise(r=>resolve=r)});
 assert.equal(f.cat.stats.cats,0);assert.equal(f.assembly.legacy.interactables.length,0);assert.ok(f.cat.ready instanceof Promise);
 resolve(source);await f.cat.ready;assert.equal(f.cat.stats.cats,1);assert.equal(f.cat.stats.loadedModels,1);assert.equal(f.cat.stats.batches,2);assert.ok(f.cat.stats.triangles>800&&f.cat.stats.triangles<5000);assert.equal(f.cat.stats.materials,1);assert.equal(f.cat.stats.textures,0);assert.equal(f.cat.stats.lights,0);assert.equal(f.assembly.legacy.interactables[0],f.cat.group);
 const bounds=new THREE.Box3().setFromObject(f.cat.group),size=bounds.getSize(new THREE.Vector3());assert.ok(size.x<.25&&size.z<=.501&&size.y>.30&&size.y<.45);assert.ok(Math.abs(bounds.min.y-30.54)<1e-5);assert.deepEqual(f.cat.group.position.toArray(),[-300.4,30.54,-184.9]);assert.equal(f.cat.group.rotation.y,0);assert.ok(f.cat.group.getObjectByName('Mugi_head'));f.cat.dispose();
});

test('all four authored paws meet the seat plane inside its supported footprint',async()=>{
 const asset=await loadAsset();asset.scene.updateMatrixWorld(true);const body=asset.scene.getObjectByName('Mugi_body'),p=body.geometry.attributes.position,point=new THREE.Vector3(),minima=[Infinity,Infinity,Infinity,Infinity];
 for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(body.matrixWorld);const quadrant=(point.x>0?1:0)+(point.z>0?2:0);minima[quadrant]=Math.min(minima[quadrant],point.y);}
 for(const minimum of minima)assert.ok(Math.abs(minimum)<.002,`paw support ${minimum}`);
});

test('loading failures expose no invisible cat action and disposal releases a late result exactly once',async()=>{
 const failed=fixture({loadAsset:()=>Promise.reject(new Error('missing'))});await failed.cat.ready;assert.equal(failed.cat.stats.cats,0);assert.equal(failed.assembly.legacy.interactables.length,0);failed.cat.dispose();
 const asset=await loadAsset();let resolve,geometries=0,materials=0;const uniqueMaterials=new Set();asset.scene.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>geometries++);uniqueMaterials.add(o.material);}});for(const m of uniqueMaterials)m.addEventListener('dispose',()=>materials++);
 const f=fixture({loadAsset:()=>new Promise(r=>resolve=r)});f.cat.dispose();f.cat.dispose();resolve(asset);await f.cat.ready;assert.equal(geometries,2);assert.equal(materials,1);assert.equal(f.assembly.legacy.interactables.length,0);assert.equal(f.cat.group.parent,null);
});

test('saved familiarity retains guarded pet feedback without duplicate awards or moving paws',async()=>{
 const listeners=new Set(),journey={snapshot:()=>({moments:{cat:10}}),subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);}},f=fixture({journey});await f.cat.ready;
 const owner=f.cat.group,body=owner.getObjectByName('Mugi_body'),initial=body.matrix.clone();f.camera.position.copy(owner.position).add(new THREE.Vector3(0,1.1,-1));f.cat.update(.1,1,{blocked:true});assert.match(owner.userData.interactable.directAction(),/watches/);
 f.cat.update(.1,2);assert.match(owner.userData.interactable.prompt,/again|familiar/);owner.userData.interactable.directAction();f.cat.update(.1,2.5);owner.userData.interactable.directAction();assert.equal(f.events.length,0);f.cat.update(.1,3);owner.userData.interactable.directAction();assert.deepEqual(f.events.map(e=>e.type),['cat.pet']);f.cat.update(.1,4);owner.userData.interactable.directAction();assert.equal(f.events.length,2);body.updateMatrix();assert.ok(body.matrix.equals(initial));f.cat.dispose();assert.equal(listeners.size,0);
});


test('loaded model resources release once and never dispose unrelated scene geometry',async()=>{
 const f=fixture(),borrowed=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());f.assembly.root.add(borrowed);let borrowedDisposals=0;borrowed.geometry.addEventListener('dispose',()=>borrowedDisposals++);await f.cat.ready;const geometries=new Set(),materials=new Set();f.cat.group.traverse(o=>{if(o.isMesh){assert.equal(o.castShadow,true);geometries.add(o.geometry);materials.add(o.material);}});let geometryDisposals=0,materialDisposals=0;for(const g of geometries)g.addEventListener('dispose',()=>geometryDisposals++);for(const m of materials)m.addEventListener('dispose',()=>materialDisposals++);f.cat.dispose();f.cat.dispose();assert.equal(geometryDisposals,2);assert.equal(materialDisposals,1);assert.equal(borrowedDisposals,0);assert.equal(f.assembly.legacy.interactables.length,0);assert.ok(borrowed.parent);
});
