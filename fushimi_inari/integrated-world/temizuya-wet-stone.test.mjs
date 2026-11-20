import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {lights} from 'three/tsl';
import {batchStaticScene} from './spatial-static-batches.mjs';
import {installTemizuyaWetStone} from './temizuya-wet-stone.mjs';

function fixture(zone = 'temizuya') {
  const pavilion = new THREE.Group();
  pavilion.userData.zone = zone;
  const maps = {map:new THREE.Texture(), normalMap:new THREE.Texture(), roughnessMap:new THREE.Texture()};
  const flagstone = new THREE.MeshStandardMaterial({...maps, roughness:.78, normalScale:new THREE.Vector2(1.25,1.25)});
  const basinSurface = new THREE.MeshStandardMaterial({map:new THREE.Texture(), bumpMap:new THREE.Texture(), roughness:.88});
  const basin = new THREE.Mesh(new THREE.BoxGeometry(2.2,.86,1.25), basinSurface);
  basin.position.y = .65;
  basin.userData.interactable = {};
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5.2,.28,3.8), flagstone);
  deck.position.y = .14;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshStandardMaterial());
  pavilion.add(deck, basin, water);
  return {pavilion, maps, flagstone, basinSurface, basin, deck, water};
}

test('the pavilion finish retains stone maps and uses one existing PBR lobe', () => {
  const {pavilion, maps, flagstone, basinSurface, basin, deck, water} = fixture();
  const geometries = pavilion.children.map(mesh => mesh.geometry);
  const waterMaterial = water.material;
  const interaction = basin.userData.interactable;
  const finish = installTemizuyaWetStone(pavilion, basin, flagstone);

  assert.equal(pavilion.children.length, 3);
  assert.deepEqual(pavilion.children.map(mesh => mesh.geometry), geometries);
  assert.equal(basin.userData.interactable, interaction);
  assert.equal(water.material, waterMaterial);
  assert.equal(basin.material.map, basinSurface.map);
  assert.equal(basin.material.bumpMap, basinSurface.bumpMap);
  for (const [property, texture] of Object.entries(maps)) assert.equal(deck.material[property], texture);
  assert.equal(deck.material.roughness, .94);
  assert.equal(deck.material.normalScale.x, .38);
  assert.equal(flagstone.normalScale.x, 1.25);
  for (const material of [basin.material, deck.material]) {
    assert.ok(material.isMeshStandardNodeMaterial);
    assert.equal(material.metalness, 0);
    assert.equal(material.envMap, null);
    assert.equal(material.transparent, false);
    assert.ok(material.colorNode && material.roughnessNode && material.normalNode);
  }

  const materials = [basin.material, deck.material];
  const versions = materials.map(material => material.version);
  assert.equal(finish.highQuality.value, false);
  finish.setQuality('high');
  assert.equal(finish.highQuality.value, true);
  finish.setQuality('balanced');
  assert.equal(finish.highQuality.value, false);
  assert.deepEqual([basin.material, deck.material], materials);
  assert.deepEqual(materials.map(material => material.version), versions);
  assert.equal(installTemizuyaWetStone(pavilion, basin, flagstone), finish);
});

test('unrelated pavilions and missing basin geometry keep their original materials', () => {
  const other = fixture('okusha');
  assert.equal(installTemizuyaWetStone(other.pavilion, other.basin, other.flagstone), null);
  assert.equal(other.deck.material, other.flagstone);
  const {pavilion, deck, flagstone} = fixture();
  assert.equal(installTemizuyaWetStone(pavilion, null, flagstone), null);
  assert.equal(deck.material, flagstone);
});

test('quality keeps the pavilion-local coordinates and material identity through static batching', () => {
  const {pavilion, flagstone, basinSurface, basin, deck} = fixture();
  const root = new THREE.Group();
  const otherFlagstone = new THREE.Mesh(deck.geometry,flagstone);
  otherFlagstone.position.set(-12,40,-8);
  const thirdFlagstone = otherFlagstone.clone();
  thirdFlagstone.position.z -= 4;
  root.add(pavilion,otherFlagstone,thirdFlagstone);
  pavilion.position.set(-11.9,40.78,-14.04);
  pavilion.rotation.y = -1.51;
  const finish = installTemizuyaWetStone(pavilion,basin,flagstone);
  const checks = [
    {mesh:basin, point:new THREE.Vector3(.57,.43,.465)},
    {mesh:deck, point:new THREE.Vector3(.54,.14,1.1)}
  ].map(({mesh, point}) => ({mesh, point, world:mesh.localToWorld(point.clone()), material:mesh.material, geometry:mesh.geometry}));
  const batches = batchStaticScene(root,new Set([basin]),128,new Set([basin]));
  assert.equal(batches.mergedBatches,1);
  assert.ok(batches.meshes.some(mesh => mesh.material === flagstone && mesh.parent === root));
  finish.setQuality('high');
  for (const {mesh, point, world, material, geometry} of checks) {
    assert.equal(mesh.parent,pavilion);
    assert.equal(mesh.material,material);
    assert.equal(mesh.geometry,geometry);
    assert.ok(mesh.worldToLocal(world.clone()).distanceTo(point) < 1e-10);
    assert.ok(batches.residencyEntries.some(entry => entry.object === mesh));
  }
  finish.dispose();
  assert.equal(basin.material,basinSurface);
  assert.equal(deck.material,flagstone);
});

test('both node materials emit WGSL without extra texture samples', () => {
  const {pavilion, flagstone, basin, deck} = fixture();
  // Use Three's node builder directly to generate WGSL without a GPU device.
  const renderer = new THREE.WebGPURenderer({canvas:{width:128,height:128,addEventListener(){}}});
  renderer.hasFeature = () => false;
  renderer._bindings = undefined;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(), sun = new THREE.DirectionalLight();
  scene.add(pavilion,sun);
  function shader(mesh) {
    const builder = new THREE.WGSLNodeBuilder(mesh,renderer);
    builder.scene = scene;
    builder.camera = camera;
    builder.context.material = mesh.material;
    builder.lightsNode = lights([sun]);
    builder.build();
    return builder.fragmentShader;
  }
  const samples = source => source.match(/textureSample\w*\(/g)?.length ?? 0;
  const baseline = [basin,deck].map(mesh => samples(shader(mesh)));
  installTemizuyaWetStone(pavilion,basin,flagstone).setQuality('high');
  const updated = [basin,deck].map(shader);
  assert.deepEqual(updated.map(samples),baseline);
  for (const source of updated) {
    assert.match(source,/if \( nodeVar\d+ \) \{[\s\S]+\btemizuyaWetness = /);
    assert.match(source,/Roughness = .*temizuyaWetness/);
  }
});
