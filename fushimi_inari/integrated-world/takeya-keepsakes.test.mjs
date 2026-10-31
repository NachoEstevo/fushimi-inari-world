import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildKumatakaTakeyaFrontage} from './kumataka-takeya-frontage.mjs';
import {buildTakeyaKeepsakes} from './takeya-keepsakes.mjs';

const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(){
 const root=new THREE.Group(),materials={stoneMat:new THREE.MeshStandardMaterial()},colliders=[],interactables=[];
 const surfaces={height:()=>66.31,terrainHeight:()=>66.31};
 const frontage=buildKumatakaTakeyaFrontage(root,features,surfaces,materials,colliders);
 return {root,materials,colliders,interactables,frontage};
}
test('photo-inspired products occupy the registered shop recess and leave paths and colliders intact',()=>{
 const f=fixture(),before=JSON.stringify(f.colliders),r=buildTakeyaKeepsakes(f.root,f.frontage,f.materials,f.interactables);
 assert.equal(r.built,true);assert.equal(r.toriiMagnets,6);assert.equal(r.packets,15);assert.equal(r.baskets,3);
 assert.equal(r.extraLights,0);assert.equal(r.extraColliders,0);assert.ok(r.batches<=8);assert.ok(r.triangles<4500);
 assert.equal(JSON.stringify(f.colliders),before);assert.equal(f.interactables.length,1);
 const group=f.interactables[0];group.updateWorldMatrix(true,true);
 const {a,b,length,inward:[nx,nz],openingCenter,openingWidth}=f.frontage.frontage;
 const ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,v=new THREE.Vector3();
 group.traverse(o=>{if(!o.isMesh)return;assert.equal(o.castShadow,false);const p=o.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert.ok(v.toArray().every(Number.isFinite));
   const s=(v.x-a[0])*ux+(v.z-a[2])*uz,d=(v.x-a[0])*nx+(v.z-a[2])*nz;
   assert.ok(s>openingCenter-openingWidth/2&&s<openingCenter+openingWidth/2);
   assert.ok(d>.20&&d<1.06,'products stay behind the facade, inside the existing display recess');
   assert.ok(v.y>=f.frontage.floor-.001&&v.y<f.frontage.floor+1.1);
  }
 });
 assert.equal(buildTakeyaKeepsakes(f.root,f.frontage,f.materials,f.interactables),r);assert.equal(f.interactables.length,1);
 assert.ok(group.userData.interactable.directAction().length<100);
});
test('missing frontage adds no invented store or interaction',()=>{
 const root=new THREE.Group(),targets=[];assert.equal(buildTakeyaKeepsakes(root,null,{},targets).built,false);
 assert.equal(root.children.length,0);assert.equal(targets.length,0);
});
