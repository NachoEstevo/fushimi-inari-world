import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {toriiMaterials} from './torii-materials-nodes.mjs';

test('torii paint suppresses inherited lacquer highlights without changing source materials or maps',()=>{
  const map=new THREE.Texture(),normalMap=new THREE.Texture();
  const source=new THREE.MeshPhysicalMaterial({map,normalMap,roughness:.32,metalness:.2,clearcoat:.58,envMapIntensity:1});
  const legacy={torii:{fresh:source,weathered:source},materials:{vermilionMat:source}};
  for(const separateInk of [false,true]){
    const materials=toriiMaterials(legacy,{separateInk});
    for(const material of Object.values(materials)){
      assert.equal(material.map,map);assert.equal(material.normalMap,normalMap);
      assert.equal(material.metalness,0);assert.ok(material.roughness>=.65);
      assert.ok(material.clearcoat<=.06);assert.ok(material.envMapIntensity<=.3);
      assert.equal(material.userData.precinctLeafReceiver,true);
      material.dispose();
    }
  }
  assert.equal(source.clearcoat,.58);assert.equal(source.metalness,.2);assert.equal(source.roughness,.32);
  source.dispose();map.dispose();normalMap.dispose();
});

test('untextured torii retain red paint and alpha without creating invalid texture nodes',()=>{
  const source=new THREE.MeshStandardMaterial({color:0xd94816});
  const materials=toriiMaterials({torii:{fresh:source,weathered:source},materials:{vermilionMat:source}});
  for(const name of ['weathered','beam']){
    let textures=0;materials[name].colorNode.traverse(node=>{if(node.isTextureNode)textures++;});
    assert.equal(textures,0);assert.equal(materials[name].map,null);
  }
  assert.equal(materials.fresh.color.getHex(),0xd94816);assert.equal(source.userData.precinctLeafReceiver,undefined);
  Object.values(materials).forEach(m=>m.dispose());source.dispose();
});

test('unlettered painted columns retain a bounded colour graph instead of deeply multiplying wood grain',()=>{
  const map=new THREE.Texture(),normalMap=new THREE.Texture(),source=new THREE.MeshPhysicalMaterial({map,normalMap,color:0xd94816});
  const materials=toriiMaterials({torii:{fresh:source,weathered:source},materials:{vermilionMat:source}},{separateInk:true});
  for(const material of Object.values(materials)){
    assert.ok(material.colorNode,'paint controls the base colour even for freshly replaced posts');
    assert.equal(material.color.getHex(),0xffffff,'material colour cannot multiply a second red tint over the paint');
    assert.ok(material.normalScale.x<=.25&&material.normalScale.y<=.25,'coated timber keeps fine grain below the scale of carved grooves');
    const textures=new Set();material.colorNode.traverse(node=>{if(node.isTextureNode)textures.add(node.value);});
    assert.deepEqual([...textures],[map],'the existing colour image is reused without a second texture layer');
    assert.equal(material.normalMap,normalMap);material.dispose();
  }
  assert.equal(source.color.getHex(),0xd94816);assert.equal(source.normalScale.x,1);source.dispose();map.dispose();normalMap.dispose();
});
