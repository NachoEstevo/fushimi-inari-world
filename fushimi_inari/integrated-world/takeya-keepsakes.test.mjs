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
 assert.equal(r.built,true);assert.equal(r.toriiMagnets,6);assert.equal(r.mochi,15);assert.equal(r.shelfParcels,16);assert.equal(r.baskets,3);
 assert.equal(r.extraLights,0);assert.equal(r.extraColliders,0);assert.ok(r.batches<=8);assert.ok(r.triangles<6000);
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
   assert.ok(v.y>=f.frontage.floor-.001&&v.y<f.frontage.floor+2);
  }
 });
 assert.equal(buildTakeyaKeepsakes(f.root,f.frontage,f.materials,f.interactables),r);assert.equal(f.interactables.length,1);
 assert.ok(group.userData.interactable.directAction().length<100);
});
test('shelf stock has camera-facing printed labels and remains inside the bounded recess',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 try{const f=fixture();buildTakeyaKeepsakes(f.root,f.frontage,f.materials,f.interactables);const labels=[];f.interactables[0].traverse(o=>{if(o.isMesh&&o.material.map?.name==='Takeya shared package lettering')labels.push(o);});
  assert.equal(labels.length,1);const uv=labels[0].geometry.attributes.uv;assert.ok(uv.count>=20*6,'shelf packages and display cards share one atlas');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('the sweets have rounded bodies on folded paper, inside the existing baskets',()=>{
 const f=fixture(),record=buildTakeyaKeepsakes(f.root,f.frontage,f.materials,f.interactables),group=f.interactables[0];
 assert.equal(record.foldedWraps,15);const body=[];
 group.traverse(mesh=>{if(mesh.isMesh&&['Takeya kinako mochi','Takeya matcha mochi'].includes(mesh.material.name))body.push(mesh);});
 assert.equal(body.length,2);
 for(const mesh of body){
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
  const onTray=[];for(let i=0;i<p.count;i++)if(p.getY(i)>.80&&p.getY(i)<.89)onTray.push(i);
  assert.ok(onTray.length>200,'several rounded sweets are present on each tray');
  assert.ok(new Set(onTray.map(i=>Math.round(n.getY(i)*100))).size>8,'sweets are not flat printed cuboids');
  assert.ok(Math.min(...onTray.map(i=>p.getY(i)))>=.808,'their bottoms rest just above the woven base');
 }
});

test('wrappers face upward and package labels and folds face visitors on either frontage orientation',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};
 try{for(const direction of [-1,1]){
  const root=new THREE.Group(),targets=[],frontage={floor:0,frontage:{a:[0,0,0],b:[6,0,0],length:6,inward:[0,direction],openingCenter:3,openingWidth:3}};
  buildTakeyaKeepsakes(root,frontage,{},targets);const group=targets[0];group.updateWorldMatrix(true,true);
  let wraps=0,folds=0,labels=0;
  group.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
   for(let i=0;i<p.count;i+=3){
    const points=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(mesh.matrixWorld));
    const ys=points.map(p=>p.y),depth=points.map(p=>p.z*direction),span=Math.max(...ys)-Math.min(...ys);
    const normal=new THREE.Vector3().fromBufferAttribute(n,i).transformDirection(mesh.matrixWorld);
    if(mesh.material.name==='Takeya paper wrappers'&&Math.min(...ys)>.809&&Math.max(...ys)<.821&&span>.009&&span<.011){
     wraps++;assert.ok(normal.y>0,'folded paper is visible from above');
    }
    if(['Takeya paper wrappers','Takeya kinako mochi','Takeya matcha mochi'].includes(mesh.material.name)&&Math.min(...ys)>1.08&&Math.max(...ys)<1.17&&Math.min(...depth)>.925&&Math.max(...depth)<.9355&&span>.025){
     folds++;assert.ok(normal.z*(-direction)>.5,'package fold faces outward');
    }
    if(mesh.material.map?.name==='Takeya shared package lettering'&&Math.abs(normal.y)<.1){
     labels++;assert.ok(normal.z*(-direction)>.99,'package label faces the visitor');
    }
   }
  });
  assert.ok(wraps>0&&folds>0&&labels>0);
 }}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
test('missing frontage adds no invented store or interaction',()=>{
 const root=new THREE.Group(),targets=[];assert.equal(buildTakeyaKeepsakes(root,null,{},targets).built,false);
 assert.equal(root.children.length,0);assert.equal(targets.length,0);
});
