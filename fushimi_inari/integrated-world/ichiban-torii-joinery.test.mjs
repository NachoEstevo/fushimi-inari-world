import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {toriiCrossbeamGeometry} from './torii-crossbeam-geometry.mjs';
import {alignFirstOmotesandoTorii} from './first-torii-alignment.mjs';

// Execute the actual generated builder's bounded gate block, keeping the full
// mountain/texture bootstrap out of a geometry and placement regression.
const source=readFileSync(new URL('./legacy-builders.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const start=source.indexOf('      const ichibanZ = 43.5;'),end=source.indexOf('      // 4. Grand Carved Stone Shrine Pillar',start),block=source.slice(start,end);
function fixture({sourceTagged=false}={}){
 const g=new THREE.Group(),colliders=[],wood=new THREE.Texture(),normal=new THREE.Texture(),rough=new THREE.Texture();let plaqueTextures=0;
 const vermilionMat=new THREE.MeshPhysicalMaterial({map:wood,normalMap:normal,roughnessMap:rough,color:0xcd3917,metalness:.14,roughness:.37,clearcoat:.3}),stoneMat=new THREE.MeshStandardMaterial(),blackNemakiMat=new THREE.MeshStandardMaterial();
 if(sourceTagged)vermilionMat.userData.precinctLeafReceiver=true;
 const dependencies={THREE,g,toriiCrossbeamGeometry,vermilionMat,stoneMat,blackNemakiMat,
  createMetricBox:(w,h,d,material)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material),
  collisionWorld:{addCylinder:(...args)=>colliders.push({type:'cylinder',args})},
  createHengakuPlaqueTexture:()=>{plaqueTextures++;return new THREE.Texture();}};
 new Function(...Object.keys(dependencies),block)(...Object.values(dependencies));g.updateMatrixWorld(true);
 return {g,colliders,vermilionMat,stoneMat,blackNemakiMat,get plaqueTextures(){return plaqueTextures;}};
}

test('Ichiban has a thin upturned cap over red concrete joinery within its existing silhouette and draw owners',()=>{
 const f=fixture(),bounds=new THREE.Box3().setFromObject(f.g);
 assert.equal(f.g.children.length,10,'existing component ownership and alignment signature are retained');
 const topAt=x=>new THREE.Raycaster(new THREE.Vector3(x,20,43.5),new THREE.Vector3(0,-1,0)).intersectObject(f.g,true)[0].point.y;
 assert.ok(topAt(6.79)-topAt(0)>.25,'photographed gate has a shallow upturned crown, not a straight box');
 assert.ok(Math.abs(bounds.max.y-10.1)<1e-5,'the old overall authored height remains unchanged');
 assert.ok(Math.abs(bounds.min.x+6.8)<1e-5&&Math.abs(bounds.max.x-6.8)<1e-5);
 assert.ok(Math.abs(bounds.min.z-(43.5-.78))<1e-5&&Math.abs(bounds.max.z-(43.5+.78))<1e-5);
 const triangles=f.g.children.reduce((sum,mesh)=>sum+mesh.geometry.index.count/3,0);assert.equal(triangles,512,'two three-segment hero beams add only32 triangles to the original480');
 assert.ok(f.g.children.filter(mesh=>Math.abs(mesh.position.x)===4.4).every(mesh=>mesh.geometry.parameters.radialSegments===18),'nearby painted columns and plinths retain eighteen sides');
});

test('Ichiban uses its photographed red structural strut without inventing a lettered plaque or another texture',()=>{
 const f=fixture(),strut=f.g.children.find(mesh=>mesh.position.x===0&&mesh.position.y>8.2&&mesh.position.y<9);
 assert.ok(strut);assert.ok(strut.geometry.parameters.width<.7);assert.equal(f.plaqueTextures,0);
 assert.equal(strut.material.map,null,'the concrete gate must not inherit prominent wood-grain colour');assert.equal(strut.material.metalness,0);assert.ok(strut.material.roughness>=.65);
 assert.equal(new Set(f.g.children.map(mesh=>mesh.material)).size,3,'concrete red, black protective finish and stone are the only gate materials');
 assert.ok(f.vermilionMat.map?.isTexture,'other shrine timbers keep their original material');
});

test('Ichiban refinement preserves mapped placement, the two colliders and existing post locations',()=>{
 const f=fixture(),root=new THREE.Group();root.add(f.g);
 assert.deepEqual(f.colliders,[{type:'cylinder',args:[-4.4,43.5,.52,0,10,'ichiban_torii']},{type:'cylinder',args:[4.4,43.5,.52,0,10,'ichiban_torii']}]);
 const report=alignFirstOmotesandoTorii(root,[],{height:()=>0},f.colliders);
 assert.equal(report.aligned,true);assert.equal(report.authoredHeightRetained,true);assert.equal(f.colliders.length,2);
 const aligned=root.getObjectByName('Ichiban torii aligned to mapped Omotesando');assert.equal(aligned.children.length,10);assert.equal(aligned.scale.x,report.scaleX);
 for(const side of [-1,1])assert.equal(aligned.children.filter(mesh=>mesh.position.x===side*4.4).length,3);
});

test('legacy Ichiban paint never enters the node-only leaf-light receiver contract',()=>{
 for(const sourceTagged of [false,true]){
  const f=fixture({sourceTagged});
  for(const mesh of f.g.children)assert.ok(!mesh.material.userData.precinctLeafReceiver||mesh.material.isNodeMaterial,'every tagged receiver must support TSL colour nodes');
  const red=f.g.children.find(mesh=>mesh.position.x===0&&mesh.position.y>8.2&&mesh.position.y<9).material;
  assert.equal(red.userData.precinctLeafReceiver,undefined,'open-avenue concrete needs no fake leaf-light graph');
  assert.equal(f.vermilionMat.userData.precinctLeafReceiver,sourceTagged?true:undefined,'removing the clone flag must not mutate the source material');
 }
});
