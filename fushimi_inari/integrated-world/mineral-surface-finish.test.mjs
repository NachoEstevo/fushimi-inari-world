import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as finish from './mineral-surface-finish.mjs';

const fixture=()=>{const map=new THREE.Texture(),normalMap=new THREE.Texture(),roughnessMap=new THREE.Texture();return new THREE.MeshStandardMaterial({map,normalMap,roughnessMap,roughness:.78,metalness:.25,normalScale:new THREE.Vector2(-1.25,1.25),color:0xabcdef});};

test('only the exact complete flagstone map trio receives a nonmutating matte finish',()=>{
 const original=fixture(),sibling=original.clone();assert.equal(typeof finish.createMineralSurfaceFinish,'function');
 const result=finish.createMineralSurfaceFinish(sibling,original);assert.notEqual(result,sibling);assert.equal(result.map,sibling.map);assert.equal(result.normalMap,sibling.normalMap);assert.equal(result.roughnessMap,sibling.roughnessMap);
 assert.equal(result.roughness,.94);assert.equal(result.metalness,0);assert.deepEqual(result.normalScale.toArray(),[-.38,.38]);assert.equal(result.color.getHex(),sibling.color.getHex());
 assert.deepEqual(sibling.normalScale.toArray(),[-1.25,1.25]);assert.equal(sibling.roughness,.78);assert.equal(sibling.metalness,.25);assert.equal(sibling.userData.worldMineralFinish,undefined);
 assert.equal(finish.createMineralSurfaceFinish(result,original),result);
 for(const key of ['map','normalMap','roughnessMap']){const different=original.clone();different[key]=new THREE.Texture();assert.equal(finish.createMineralSurfaceFinish(different,original),null);different[key]=null;assert.equal(finish.createMineralSurfaceFinish(different,original),null);}
 assert.equal(finish.createMineralSurfaceFinish(original,{map:null,normalMap:null,roughnessMap:null}),null);
});

test('already understated normal scale and roughness remain intact, including zero and sign',()=>{
 const original=fixture(),tuned=original.clone();tuned.normalScale.set(-.32,0);tuned.roughness=.99;
 assert.equal(typeof finish.createMineralSurfaceFinish,'function');const result=finish.createMineralSurfaceFinish(tuned,original);
 assert.deepEqual(result.normalScale.toArray(),[-.32,0]);assert.equal(result.roughness,.99);assert.deepEqual(tuned.normalScale.toArray(),[-.32,0]);
});
