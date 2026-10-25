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
      material.dispose();
    }
  }
  assert.equal(source.clearcoat,.58);assert.equal(source.metalness,.2);assert.equal(source.roughness,.32);
  source.dispose();map.dispose();normalMap.dispose();
});
