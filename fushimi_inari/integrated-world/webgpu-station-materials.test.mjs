import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createStationMaterialStudy } from './webgpu-station-materials.mjs';

test('station study shares upgrades, preserves mapped signs, and restores ownership on disposal', () => {
  const group = new THREE.Group(), geometry = new THREE.BoxGeometry();
  const green = new THREE.MeshStandardMaterial({ color: '#245b4b' });
  const glass = new THREE.MeshStandardMaterial({ color: '#aec1be', transparent: true, opacity: .12 });
  const signMap = new THREE.Texture();
  const sign = new THREE.MeshStandardMaterial({ color: '#e6e3d6', map: signMap });
  const originals = [green, glass, sign], disposedOriginals = [];
  originals.forEach(m => m.addEventListener('dispose', () => disposedOriginals.push(m)));
  signMap.addEventListener('dispose', () => disposedOriginals.push(signMap));
  const first = new THREE.Mesh(geometry, green), second = new THREE.Mesh(geometry, green);
  const pane = new THREE.Mesh(geometry, glass), placard = new THREE.Mesh(geometry, sign);
  const array = [green, sign], multi = new THREE.Mesh(geometry, array);
  group.add(first, second, pane, placard, multi);
  const study = createStationMaterialStudy({ group });
  assert.equal(first.material, green, 'creation leaves the base comparison intact');
  assert.equal(study.stats.materials, 2);
  assert.equal(study.stats.textures, 4);
  assert.equal(study.stats.textureSize, 256);
  study.setEnabled(true);
  assert.ok(first.material.isMeshPhysicalMaterial);
  assert.equal(first.material, second.material, 'shared palette remains shared');
  assert.equal(first.material, multi.material[0]);
  assert.equal(first.material.userData.stationReflectionReceiver, true);
  assert.ok(first.material.clearcoat > 0);
  assert.equal(first.material.bumpMap, null, 'paint finish never deforms smooth train panels');
  assert.ok(first.material.roughnessMap.isDataTexture);
  assert.equal(first.material.roughnessMap.image.width, 256);
  assert.equal(first.material.roughnessMap.image.height, 256);
  assert.equal(pane.material.userData.stationReflectionReceiver, true);
  assert.ok(pane.material.opacity >= .32 && pane.material.opacity <= .36);
  assert.equal(pane.material.depthWrite, false);
  assert.equal(placard.material, sign);
  assert.equal(multi.material[1], sign);
  assert.equal(sign.map, signMap);
  const paint = first.material, upgradedGlass = pane.material, disposedStudy = [];
  paint.addEventListener('dispose', () => disposedStudy.push(paint));
  upgradedGlass.addEventListener('dispose', () => disposedStudy.push(upgradedGlass));
  study.setEnabled(false);
  assert.equal(first.material, green);
  assert.equal(pane.material, glass);
  assert.equal(multi.material, array, 'the original material array identity is restored');
  study.setEnabled(true);
  study.dispose();
  assert.equal(first.material, green);
  assert.equal(multi.material, array);
  assert.deepEqual(disposedOriginals, [], 'study never disposes station-owned resources');
  assert.equal(disposedStudy.length, 2);
  study.dispose(); study.setEnabled(true);
  assert.equal(disposedStudy.length, 2, 'disposal is idempotent');
  assert.equal(first.material, green, 'disposed study cannot reattach resources');
  geometry.dispose(); originals.forEach(m => m.dispose()); signMap.dispose();
});

test('metal receives the local probe while the mineral floor stays matte', () => {
  const group = new THREE.Group(), geometry = new THREE.BoxGeometry();
  const metal = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:'#9aa3a5'}));
  const floor = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:'#777b79'}));
  group.add(metal, floor);
  const study = createStationMaterialStudy(group); study.setEnabled(true);
  assert.equal(metal.material.userData.stationReflectionReceiver, true);
  assert.ok(metal.material.metalness > .7);
  assert.equal(floor.material.userData.stationReflectionReceiver, undefined);
  assert.ok(floor.material.roughness >= .9);
  assert.ok(floor.material.bumpMap);
  study.dispose(); geometry.dispose(); metal.material.dispose(); floor.material.dispose();
});

test('quality changes only finish uniforms and balanced restores the exact original study', () => {
  const group = new THREE.Group(), geometry = new THREE.BoxGeometry();
  const colors = ['#245b4b', '#9aa3a5', '#c03220'];
  const meshes = colors.map(color => new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color})));
  const signMap = new THREE.Texture();
  const sign = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:'#e6e3d6',map:signMap}));
  group.add(...meshes, sign);
  const originals = meshes.map(mesh => mesh.material), originalSign = sign.material;
  const study = createStationMaterialStudy(group);study.setEnabled(true);
  const upgraded = meshes.map(mesh => mesh.material);
  const snapshots = upgraded.map(material => ({roughness:material.roughness, clearcoat:material.clearcoat,
    clearcoatRoughness:material.clearcoatRoughness, version:material.version,
    roughnessMap:material.roughnessMap, bumpMap:material.bumpMap}));
  const textureVersions = upgraded.map(material => material.roughnessMap.version);
  for (let cycle=0;cycle<2;cycle++) {
    study.setQuality('high');
    assert.equal(upgraded[0].roughness,.72);assert.equal(upgraded[0].clearcoat,.18);
    assert.equal(upgraded[0].clearcoatRoughness,.42);assert.equal(upgraded[1].roughness,.72);
    assert.equal(upgraded[2].roughness,snapshots[2].roughness);
    assert.equal(upgraded[2].clearcoat,snapshots[2].clearcoat);
    assert.equal(upgraded[2].clearcoatRoughness,snapshots[2].clearcoatRoughness);
    assert.equal(sign.material,originalSign);
    study.setQuality('balanced');
    upgraded.forEach((material,index) => {
      assert.equal(meshes[index].material,material);
      for (const [key,value] of Object.entries(snapshots[index])) assert.equal(material[key],value,key);
      assert.equal(material.roughnessMap.version,textureVersions[index]);
    });
  }
  study.setEnabled(false);study.setQuality('high');study.setEnabled(true);
  assert.equal(meshes[0].material,upgraded[0]);assert.equal(upgraded[0].roughness,.72);
  study.dispose();study.setQuality('balanced');
  meshes.forEach((mesh,index) => assert.equal(mesh.material,originals[index]));
  assert.equal(upgraded[0].roughness,.72,'disposed study ignores later quality updates');
  geometry.dispose();originals.forEach(material => material.dispose());originalSign.dispose();signMap.dispose();
});
