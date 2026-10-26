import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createKeihanContextMaterials,applyMetricUVs} from './keihan-context-materials.mjs';

test('facade finishes share two small static mipmapped textures and retain palette contracts',()=>{
 const finish=createKeihanContextMaterials(),{palette,textures}=finish;
 assert.equal(Object.keys(palette).length,6);assert.equal(textures.length,2);
 for(const material of Object.values(palette)){
  assert.ok(material.isMeshStandardMaterial);assert.ok(!material.isMeshPhysicalMaterial);
  assert.ok(Number.isFinite(material.roughness));assert.ok(material.roughness>=0&&material.roughness<=1);
 }
 assert.equal(palette.plaster.vertexColors,true);assert.equal(palette.cloth.vertexColors,true);
 assert.equal(palette.glass.metalness,.14);
 assert.equal(palette.plaster.roughnessMap,palette.plaster.bumpMap);
 assert.equal(palette.shutter.roughnessMap,palette.shutter.bumpMap);
 assert.notEqual(palette.plaster.bumpMap,palette.shutter.bumpMap);
 for(const texture of textures){
  assert.equal(texture.image.width,128);assert.equal(texture.image.height,128);
  assert.equal(texture.generateMipmaps,true);assert.equal(texture.minFilter,THREE.LinearMipmapLinearFilter);
  assert.equal(texture.wrapS,THREE.RepeatWrapping);
  assert.ok(texture.image.data.every(Number.isFinite));
 }
 let releases=0;for(const resource of [...Object.values(palette),...textures])resource.addEventListener('dispose',()=>releases++);
 finish.dispose();finish.dispose();assert.equal(releases,8);
});

test('metric UVs retain metre scale on rotated translated planes and boxes',()=>{
 const angle=.61;
 const plane=new THREE.PlaneGeometry(3,6).rotateY(angle).translate(-300,30,-170);
 assert.equal(applyMetricUVs(plane),plane);
 const uv=plane.getAttribute('uv');
 const us=Array.from({length:uv.count},(_,i)=>uv.getX(i)),vs=Array.from({length:uv.count},(_,i)=>uv.getY(i));
 assert.ok(Math.abs(Math.max(...us)-Math.min(...us)-2)<.0001);
 assert.ok(Math.abs(Math.max(...vs)-Math.min(...vs)-4)<.0001);
 const box=applyMetricUVs(new THREE.BoxGeometry(2,3,.12).rotateY(angle).translate(-300,30,-170));
 assert.ok(Array.from(box.getAttribute('uv').array).every(Number.isFinite));
 plane.dispose();box.dispose();
});
