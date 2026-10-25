import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {vec3} from 'three/tsl';
import {attachCloudShade,CLOUD_SHADE_MAX} from './cloud-shade.mjs';

test('projected terrain shade composes existing blends and animates uniforms without recompilation',()=>{
  const material=new THREE.MeshStandardNodeMaterial();
  const blend=vec3(.4,.5,.2);material.colorNode=blend;
  const shade=attachCloudShade(material),node=material.colorNode,version=material.version;
  const uniforms=[];node.traverse(value=>{if(value.isUniformNode)uniforms.push(value);});
  assert.ok(CLOUD_SHADE_MAX>0&&CLOUD_SHADE_MAX<=.12);
  assert.ok(node!==blend);let hasBlend=false;node.traverse(value=>{if(value===blend)hasBlend=true;});assert.ok(hasBlend);
  shade.update(120,'gold');
  assert.ok(uniforms.some(value=>value.value===120));assert.ok(uniforms.some(value=>value.value===CLOUD_SHADE_MAX));
  shade.update(150,'night');assert.ok(uniforms.every(value=>value.value!==CLOUD_SHADE_MAX));
  shade.update(180,'day');assert.ok(uniforms.some(value=>value.value===CLOUD_SHADE_MAX));
  assert.equal(material.colorNode,node);assert.equal(material.version,version);
});

test('plain terrain material receives a node and invalid elapsed time cannot poison shader uniforms',()=>{
  const material=new THREE.MeshStandardNodeMaterial(),shade=attachCloudShade(material);
  shade.update(NaN,'day');
  material.colorNode.traverse(node=>{if(node.isUniformNode&&typeof node.value==='number')assert.ok(Number.isFinite(node.value));});
});
