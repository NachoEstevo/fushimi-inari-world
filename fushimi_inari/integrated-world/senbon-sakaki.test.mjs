import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as shrub from './senbon-sakaki.mjs';

function fixture(){
 const root=new THREE.Group();root.userData.zone='senbon';
 const pillar=new THREE.Mesh(new THREE.BoxGeometry(.28,1.38,.28),new THREE.MeshStandardMaterial());pillar.position.set(-.15,.69,-2.15);
 const cone=new THREE.Mesh(new THREE.ConeGeometry(.45,2.15,8),new THREE.MeshStandardMaterial({color:0x244a26,roughness:.65}));cone.position.set(-.15,1.15,-2.75);
 root.add(pillar,cone);return {root,pillar,cone};
}
function withCanvas(run){
 const prior=globalThis.document;let canvases=0;
 globalThis.document={createElement(){canvases++;return {getContext:()=>new Proxy({},{get:()=>()=>{}})};}};
 try{return run(()=>canvases);}finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
}

test('replaces only the exact Senbon shrub proxy with bounded leafy geometry in its original envelope',()=>withCanvas(()=>{
 assert.equal(typeof shrub.refineSenbonSakaki,'function');const {root,pillar,cone}=fixture();
 const other=new THREE.Mesh(cone.geometry,cone.material);other.position.set(2,1.15,-2.75);root.add(other);
 const source=cone.geometry,material=cone.material,originalPosition=cone.position.clone(),pillarGeometry=pillar.geometry,children=[...root.children];
 const expected=new THREE.Box3().setFromObject(cone),report=shrub.refineSenbonSakaki(root);
 assert.equal(report.refined,true);assert.equal(report.drawMeshes,1);assert.ok(report.triangles<=256);assert.equal(cone.geometry.type,'BufferGeometry');assert.equal(cone.material.alphaTest,.4);assert.equal(cone.material.transparent,false);
 assert.deepEqual(root.children,children);assert.equal(pillar.geometry,pillarGeometry);assert.equal(other.geometry,source);assert.equal(other.material,material);assert.ok(cone.position.equals(originalPosition));
 const actual=new THREE.Box3().setFromObject(cone);assert.ok(actual.min.distanceTo(expected.min)<1e-6);assert.ok(actual.max.distanceTo(expected.max)<1e-6);
 assert.equal(cone.castShadow,false);assert.equal(cone.receiveShadow,false);assert.ok(cone.material.map?.isTexture);
 const geometry=cone.geometry,leafMaterial=cone.material;
 for(const name of ['position','normal','uv','color']){assert.ok(geometry.attributes[name]);assert.ok(Array.from(geometry.attributes[name].array).every(Number.isFinite));}
 assert.equal(geometry.attributes.uv.count,geometry.attributes.position.count);assert.equal(shrub.refineSenbonSakaki(root),report);assert.equal(cone.geometry,geometry);assert.equal(cone.material,leafMaterial);
 assert.match(report.appearance,/leaf/i);assert.match(report.limits,/inferred/i);
}));

test('unknown or ambiguous source signatures remain untouched',()=>{
 assert.equal(typeof shrub.refineSenbonSakaki,'function');
 for(const change of [f=>f.root.userData.zone='other',f=>f.root.remove(f.pillar),f=>f.cone.position.z-=.01,f=>{f.cone.geometry=new THREE.ConeGeometry(.45,2.2,8);},f=>{const duplicate=f.cone.clone();f.root.add(duplicate);}]){
  const f=fixture();change(f);const geometry=f.cone.geometry,material=f.cone.material,children=[...f.root.children];
  assert.equal(shrub.refineSenbonSakaki(f.root),null);assert.equal(f.cone.geometry,geometry);assert.equal(f.cone.material,material);assert.deepEqual(f.root.children,children);assert.equal(f.root.userData.senbonSakaki,undefined);
 }
});

test('separate shrubs share the existing leaf material and require no per-frame updates or new lights',()=>withCanvas(canvases=>{
 assert.equal(typeof shrub.refineSenbonSakaki,'function');const a=fixture(),b=fixture();
 const first=shrub.refineSenbonSakaki(a.root),second=shrub.refineSenbonSakaki(b.root);
 assert.equal(a.cone.material,b.cone.material);assert.notEqual(a.cone.geometry,b.cone.geometry);assert.ok(canvases()<=1);
 assert.equal(first.triangles,second.triangles);assert.equal(first.drawMeshes,1);assert.equal(first.extraLights,0);assert.equal(first.updateRequired,false);
 const nodes=[];a.root.traverse(object=>nodes.push(object));assert.equal(nodes.filter(object=>object.isLight).length,0);
}));
