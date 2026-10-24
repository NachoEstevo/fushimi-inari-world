import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildOkushaMappedSheltersR102,okushaTemizuyaIdR102} from './okusha-mapped-shelters-r102.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const fixture=()=>({root:new THREE.Group(),materials:{entryStoneMat:new THREE.MeshStandardMaterial(),plasterMat:new THREE.MeshStandardMaterial()},colliders:[]});

test('confirmed actual roof becomes open low shelter; exact-ID ownership, supported posts and public paths survive',()=>{
  const f=fixture(),prior=new THREE.Mesh(new THREE.BoxGeometry(),f.materials.entryStoneMat),callback={onTrigger:()=>3};prior.userData.interactable=callback;f.root.add(prior);
  const geo=prior.geometry,featureState=JSON.stringify(features),ground=()=>62.559976959228514;
  const r=buildOkushaMappedSheltersR102(f.root,features,f.materials,ground,f.colliders);
  assert.deepEqual(r.builtIds,[okushaTemizuyaIdR102]);assert.equal(r.posts,4);assert.equal(f.colliders.length,5);
  assert.ok(r.eave-ground()<2.31&&r.ridge-ground()<2.73);assert.ok(r.stats.batches<=6&&r.stats.triangles<4000);
  assert.equal(prior.geometry,geo);assert.equal(prior.userData.interactable,callback);assert.equal(JSON.stringify(features),featureState);
  r.group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(r.group),roof=features.buildings.find(b=>b.id===okushaTemizuyaIdR102);
  assert.ok(bounds.min.x>=252.80&&bounds.max.x<=255.23);assert.ok(bounds.min.z>=65.77&&bounds.max.z<=67.30);
  r.group.traverse(o=>{if(o.isMesh)for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
  const basinMesh=r.group.children.find(o=>o.isMesh&&o.material.color.getHexString()==='876c57');assert.ok(basinMesh);basinMesh.geometry.computeBoundingBox();assert.ok(Math.abs(basinMesh.geometry.boundingBox.min.y-r.deck)<1e-5,'actual basin underside seats directly on catchment deck');
  for(const c of f.colliders.filter(c=>c.type==='cylinder')){
    const [x,z,,y]=c.args;assert.equal(y,ground(x,z));
    const ray=new THREE.Raycaster(new THREE.Vector3(x,ground()+.3,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(r.group,true)[0];assert.ok(hit&&Math.abs(hit.point.y-ground()-.09)<1e-5,'mineral foot top corresponds to 12cm foot buried 3cm into support');
  }
  const center=roof.points.slice(0,-1).reduce((q,p)=>q.add(new THREE.Vector3(...p)),new THREE.Vector3()).multiplyScalar(.25);
  const ray=new THREE.Raycaster(new THREE.Vector3(center.x,ground()+1.4,64),new THREE.Vector3(0,0,1),0,5);
  assert.equal(ray.intersectObject(r.group,true).length,0,'no six-metre wall or closed side under roof');
  const collision=new SpatialCollisionWorld();for(const c of f.colliders)collision[c.type==='box'?'addBox':'addCylinder'](...c.args);
  for(const id of ['way/301527759','way/301527762','way/649037627']){
    const path=features.paths.find(p=>p.id===id);assert.ok(path);
    for(let i=1;i<path.points.length;i++)for(let j=0;j<=60;j++){
      const t=j/60,a=path.points[i-1],b=path.points[i],x=a[0]*(1-t)+b[0]*t,z=a[2]*(1-t)+b[2]*t;
      const q=collision.resolvePlayer(x,ground()+1.55,z,.28);assert.ok(Math.hypot(q.x-x,q.z-z)<1e-7,`route ${id} remains clear`);
    }
  }
  assert.equal(buildOkushaMappedSheltersR102(f.root,features,f.materials,ground,f.colliders),null);
});

test('unknown footprint or unsupported floor returns no builtIds and mutates nothing',()=>{
  for(const [data,ground]of [[{buildings:[]},()=>62.56],[features,()=>NaN],[features,(x)=>x*2]]){
    const f=fixture();assert.equal(buildOkushaMappedSheltersR102(f.root,data,f.materials,ground,f.colliders),null);assert.equal(f.root.children.length,0);assert.equal(f.colliders.length,0);
  }
});
