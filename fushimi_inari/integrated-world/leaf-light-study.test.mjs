import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {vec4} from 'three/tsl';
import {createLeafLightStudy} from './leaf-light-study.mjs';

test('deterministic bounded single-channel mask is shared by attached materials',()=>{
  const a=createLeafLightStudy(),b=createLeafLightStudy();
  assert.deepEqual(a.texture.image.data,b.texture.image.data);
  assert.equal(a.texture.image.width,128);assert.equal(a.texture.format,THREE.RedFormat);
  assert.equal(a.texture.colorSpace,THREE.NoColorSpace);
  assert.equal(a.stats.sourceBytes,16384);assert.equal(a.stats.mipBytes,21845);
  assert.deepEqual(a.stats.sunSlope,[-800/1400,-600/1400]);
  assert.ok(a.texture.image.data.some(x=>x===0));assert.ok(a.texture.image.data.some(x=>x>0));
  const materials=[new THREE.MeshStandardNodeMaterial(),new THREE.MeshStandardNodeMaterial()];
  for(const material of materials){
    a.attach(material);let found=false;
    material.colorNode.traverse(node=>{if(node.isTextureNode&&node.value===a.texture)found=true;});
    assert.ok(found);
  }
  assert.equal(a.stats.materials,2);a.attach(materials[0]);assert.equal(a.stats.materials,2);
  a.dispose();b.dispose();materials.forEach(m=>m.dispose());
  assert.throws(()=>createLeafLightStudy({strength:.11}),RangeError);
  assert.throws(()=>createLeafLightStudy({size:129}),RangeError);
  for(const sunSlope of [[NaN,0],[0,Infinity],[4.01,0],[0],null])assert.throws(()=>createLeafLightStudy({sunSlope}),RangeError);
});

test('composition retains RGBA source, controls strength and restores only its own nodes',()=>{
  const study=createLeafLightStudy(),material=new THREE.MeshStandardNodeMaterial();
  const source=vec4(.4,.3,.2,.6);material.colorNode=source;study.attach(material);
  const result=material.colorNode;let found=false;
  result.traverse(node=>{if(node===source)found=true;});assert.ok(found);
  assert.equal(study.stats.strength,0);study.setEnabled(true);assert.equal(study.stats.strength,.08);
  study.setTimeOfDay('night');assert.equal(study.stats.strength,0);
  study.setTimeOfDay('day');assert.equal(study.stats.strength,.08);
  study.setSunSlope([1,-2]);assert.deepEqual(study.stats.sunSlope,[1,-2]);
  assert.throws(()=>study.setSunSlope([Infinity,0]),RangeError);
  study.setEnabled(false);assert.equal(study.stats.strength,0);
  let disposals=0;study.texture.addEventListener('dispose',()=>disposals++);
  study.dispose();study.dispose();assert.equal(disposals,1);assert.equal(material.colorNode,source);
  assert.throws(()=>study.attach(material));material.dispose();
});

test('disposal does not overwrite a subsequent material owner',()=>{
  const study=createLeafLightStudy(),material=new THREE.MeshStandardNodeMaterial();
  study.attach(material);const replacement=vec4(1,1,1,1);material.colorNode=replacement;
  study.dispose();assert.equal(material.colorNode,replacement);material.dispose();
});
