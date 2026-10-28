import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {createSoftLightMotes} from './soft-light-motes.mjs';

test('soft-light motes use one bounded draw, no lights or targets, and preserve GPU resources while walking',()=>{
 const field=createSoftLightMotes(),scene=new THREE.Scene();scene.add(field.mesh);
 const geometry=field.mesh.geometry,material=field.mesh.material,attribute=geometry.attributes.moteSeed,values=attribute.array.slice(),version=attribute.version;
 let geometryDisposals=0,materialDisposals=0;geometry.addEventListener('dispose',()=>geometryDisposals++);material.addEventListener('dispose',()=>materialDisposals++);
 const position=new THREE.Vector3();position.toArray=()=>{throw Error('frame must not export camera coordinates');};
 try{
  assert.equal(field.stats.draws,0);field.setEnabled(true);assert.equal(field.stats.draws,1);assert.equal(field.mesh.count,28);
  field.setQuality('high');assert.equal(field.mesh.count,72);assert.equal(attribute.count,72);
  for(let i=0;i<1000;i++){position.set(i*.1,20,-i*.2);field.update(position,i/60);}
  assert.equal(field.mesh.geometry,geometry);assert.equal(field.mesh.material,material);assert.equal(attribute.version,version);assert.deepEqual(attribute.array,values);
  assert.equal(field.mesh.castShadow,false);assert.equal(material.depthWrite,false);assert.equal(material.depthTest,true);
  assert.equal(field.stats.extraLights,0);assert.equal(field.stats.textures,0);assert.equal(field.stats.renderTargets,0);
  field.setReducedMotion(true);assert.equal(field.mesh.visible,false);field.setQuality('balanced');assert.equal(field.mesh.visible,false);
  field.setReducedMotion(false);assert.equal(field.mesh.count,28);assert.equal(field.mesh.visible,true);
  field.setEnabled(false);assert.equal(field.mesh.visible,false);
 }finally{field.dispose();field.dispose();}
 assert.equal(geometryDisposals,1);assert.equal(materialDisposals,1);assert.equal(scene.children.length,0);
});
