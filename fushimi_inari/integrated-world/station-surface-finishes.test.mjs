import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createStationSurfaceFinishes} from './station-surface-finishes.mjs';

const fixture=()=>{
 const geometry=new THREE.BoxGeometry(4,.2,12).translate(-302,31,-176);
 const deck=new THREE.MeshStandardMaterial({color:'#777b79'});deck.userData.stationSurfaceRole='platform-deck';
 const wall=new THREE.MeshStandardMaterial({color:'#66707c'});wall.userData.stationSurfaceRole='platform-wall';
 const meshes=[deck,deck,wall].map(m=>new THREE.Mesh(geometry,m)),bindings=meshes.map(mesh=>({mesh,upgraded:mesh.material}));
 return {geometry,deck,wall,meshes,bindings};
};

test('High platform finishes have stable shared PBR maps and owned AO UVs; Balanced restores source buffers',()=>{
 const {geometry,deck,wall,meshes,bindings}=fixture();
 const positions=geometry.attributes.position.array.slice(),uvs=geometry.attributes.uv.array.slice();
 const finish=createStationSurfaceFinishes({spec:{platformFloor:30.99}},bindings);
 assert.equal(meshes[0].material,deck);assert.equal(meshes[0].geometry,geometry);
 assert.equal(finish.stats.textures,0,'Balanced does not bake High maps');
 finish.setEnabled(false);assert.equal(finish.stats.textureBytes,0);
 finish.setEnabled(true);
 const high=meshes[0].material,highGeometry=meshes[0].geometry;
 assert.equal(meshes[1].material,high);assert.equal(meshes[1].geometry,highGeometry);
 assert.notEqual(highGeometry,geometry);assert.equal(geometry.attributes.uv1,undefined);
 assert.deepEqual(highGeometry.attributes.position.array,positions);assert.deepEqual(highGeometry.attributes.uv.array,uvs);
 assert.ok([...highGeometry.attributes.uv1.array].every(Number.isFinite));
 assert.equal(high.aoMap.channel,1);assert.equal(high.aoMap.image.width,512);assert.equal(high.aoMap.image.height,1024);
 assert.ok(high.map&&high.normalMap&&high.roughnessMap);assert.equal(high.bumpMap,null);
 assert.equal(high.map.colorSpace,THREE.SRGBColorSpace);assert.equal(high.normalMap.colorSpace,THREE.NoColorSpace);
 assert.equal(high.map.image.width,512);assert.equal(high.map.generateMipmaps,true);
 assert.notEqual(high.map,high.normalMap);assert.notEqual(high.map,high.roughnessMap);
 assert.ok(high.roughness>=.9);assert.equal(high.metalness,0);
 const wallFinish=meshes[2].material;assert.equal(meshes[2].geometry,geometry);
 assert.ok(wallFinish.normalMap);assert.equal(wallFinish.aoMap.channel,0);
 const versions=[high.version,wallFinish.version],owned=[high,wallFinish,highGeometry],disposed=[];
 const textures=new Set([high.map,high.normalMap,high.roughnessMap,high.aoMap,wallFinish.map,wallFinish.normalMap,wallFinish.roughnessMap]);
 for(const object of [...owned,...textures])object.addEventListener('dispose',()=>disposed.push(object));
 for(let i=0;i<3;i++){
  finish.setEnabled(false);assert.equal(meshes[0].material,deck);assert.equal(meshes[0].geometry,geometry);assert.equal(meshes[2].material,wall);
  finish.setEnabled(true);assert.equal(meshes[0].material,high);assert.equal(meshes[0].geometry,highGeometry);
  assert.deepEqual([high.version,wallFinish.version],versions);
 }
 finish.dispose();finish.dispose();finish.setEnabled(true);
 assert.equal(meshes[0].material,deck);assert.equal(meshes[0].geometry,geometry);assert.equal(new Set(disposed).size,10);assert.equal(disposed.length,10);
 assert.deepEqual(geometry.attributes.position.array,positions);geometry.dispose();deck.dispose();wall.dispose();
});

test('unowned colors and train surfaces never qualify for architectural finish',()=>{
 const material=new THREE.MeshStandardMaterial({color:'#66707c'}),geometry=new THREE.BoxGeometry(),mesh=new THREE.Mesh(geometry,material);
 const finish=createStationSurfaceFinishes({spec:{platformFloor:31}},[{mesh,upgraded:material}]);finish.setEnabled(true);
 assert.equal(mesh.material,material);assert.equal(mesh.geometry,geometry);assert.equal(finish.stats.materials,0);assert.equal(finish.stats.textures,0);
 finish.dispose();geometry.dispose();material.dispose();
});
