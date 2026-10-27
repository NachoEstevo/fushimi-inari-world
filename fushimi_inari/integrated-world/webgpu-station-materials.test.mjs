import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import { createStationMaterialStudy } from './webgpu-station-materials.mjs';
import {buildKeihanStation} from './keihan-station.mjs';

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
  assert.equal(study.stats.textures, 6);
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

test('High tactile studs and upholstery relief share bounded maps and toggle only scalar strength',()=>{
  const group=new THREE.Group(),geometry=new THREE.BoxGeometry();
  const yellow=new THREE.MeshStandardMaterial({color:'#d7ae35'}),seat=new THREE.MeshStandardMaterial({color:'#42677a'});
  const meshes=[yellow,yellow,seat,seat].map(material=>new THREE.Mesh(geometry,material));group.add(...meshes);
  const study=createStationMaterialStudy(group);study.setEnabled(true);
  const tactile=meshes[0].material,fabric=meshes[2].material;
  assert.equal(meshes[1].material,tactile);assert.equal(meshes[3].material,fabric);
  assert.equal(tactile.bumpScale,0);assert.equal(fabric.bumpScale,0);
  const maps=[tactile.bumpMap,fabric.bumpMap],versions=[tactile.version,fabric.version];
  const mapVersions=maps.map(map=>map?.version);
  for(const map of maps){
    assert.ok(map?.isDataTexture);assert.equal(map.image.width,256);assert.equal(map.image.height,256);
    assert.equal(map.wrapS,THREE.RepeatWrapping);assert.equal(map.wrapT,THREE.RepeatWrapping);
    assert.equal(map.generateMipmaps,true);assert.equal(map.minFilter,THREE.LinearMipmapLinearFilter);assert.ok(map.anisotropy>=4);
    assert.ok(new Set(map.image.data).size>8,'relief has a filtered gradient rather than a flat fill');
  }
  assert.notEqual(maps[0],maps[1]);assert.equal(study.stats.textures,6);
  const point=(u,v)=>maps[0].image.data[(Math.floor(v*256)*256+Math.floor(u*256))*4];
  assert.ok(point(.1,.1)>point(.02,.02)+60,'raised stud centre exceeds its surrounding tile');
  const disposed=[];maps.forEach(map=>map.addEventListener('dispose',()=>disposed.push(map)));
  for(const mode of ['high','balanced','ultra','balanced']){
    study.setQuality(mode);const high=mode!=='balanced';
    assert.equal(tactile.bumpScale,high?.004:0);assert.equal(fabric.bumpScale,high?.0007:0);
    assert.equal(tactile.bumpMap,maps[0]);assert.equal(fabric.bumpMap,maps[1]);
    assert.equal(tactile.version,versions[0]);assert.equal(fabric.version,versions[1]);
    maps.forEach((map,i)=>assert.equal(map.version,mapVersions[i]));
  }
  study.dispose();study.dispose();assert.equal(disposed.length,2);
  assert.equal(meshes[0].material,yellow);assert.equal(meshes[2].material,seat);
  geometry.dispose();yellow.dispose();seat.dispose();
});

test('shared platform palette separates train vinyl and door thresholds without changing geometry',()=>{
  const group=new THREE.Group(),trainGroup=new THREE.Group(),geometry=new THREE.BoxGeometry();group.add(trainGroup);
  const floor=new THREE.MeshStandardMaterial({color:'#777b79'}),yellow=new THREE.MeshStandardMaterial({color:'#d7ae35'});
  const platform=new THREE.Mesh(geometry,floor),warning=new THREE.Mesh(geometry,yellow),inside=new THREE.Mesh(geometry,floor),threshold=new THREE.Mesh(geometry,yellow);
  const door=new THREE.Group();door.add(threshold);trainGroup.add(inside,door);group.add(platform,warning);
  const study=createStationMaterialStudy({group,trainGroup});study.setEnabled(true);study.setQuality('high');
  assert.notEqual(inside.material,platform.material);assert.equal(inside.material.userData.stationMaterialStudy,'vinyl');
  assert.equal(platform.material.userData.stationMaterialStudy,'pavement');assert.notEqual(inside.material.bumpMap,platform.material.bumpMap);
  assert.equal(inside.material.map,null,'vinyl does not inherit exterior aggregate albedo');assert.equal(inside.material.color.getHex(),floor.color.getHex());
  assert.ok(inside.material.bumpScale<=.0003);assert.equal(platform.material.bumpScale,.003);
  assert.notEqual(threshold.material,warning.material);assert.equal(threshold.material.bumpScale,0);assert.equal(warning.material.bumpScale,.004);
  const materials=[platform,warning,inside,threshold].map(mesh=>mesh.material);
  study.setQuality('balanced');assert.equal(warning.material.bumpScale,0);assert.equal(inside.material.userData.stationMaterialStudy,'vinyl');
  for(const [i,mesh]of [platform,warning,inside,threshold].entries()){assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,materials[i]);}
  assert.equal(study.stats.materials,4);assert.equal(study.stats.textures,6);
  study.dispose();for(const mesh of [platform,inside])assert.equal(mesh.material,floor);for(const mesh of [warning,threshold])assert.equal(mesh.material,yellow);
  geometry.dispose();floor.dispose();yellow.dispose();
});

test('actual station keeps every source buffer and draw owner while its six shared textures dispose once',()=>{
  const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
  const station=buildKeihanStation(new THREE.Group(),{},features,{height:()=>30.03}),source=[];
  const digest=geometry=>{
    const hash=createHash('sha256');
    for(const name of Object.keys(geometry.attributes).sort()){
      const array=geometry.attributes[name].array;hash.update(name);hash.update(Buffer.from(array.buffer,array.byteOffset,array.byteLength));
    }
    return hash.digest('hex');
  };
  station.group.traverse(mesh=>{if(mesh.isMesh)source.push({mesh,geometry:mesh.geometry,material:mesh.material,digest:digest(mesh.geometry)});});
  const study=createStationMaterialStudy(station);study.setEnabled(true);
  const tactile=station.group.getObjectByName('Keihan central tactile relief · High');assert.ok(tactile);
  assert.equal(tactile.visible,false);assert.equal(study.stats.tactileDetail.instances,4000);
  const tactileGeometry=tactile.children[0].geometry;let tactileDisposed=0;tactileGeometry.addEventListener('dispose',()=>tactileDisposed++);
  const ownedMaterials=new Set(),ownedTextures=new Set();
  for(const {mesh,material}of source)if(mesh.material!==material){
    for(const m of [mesh.material].flat())if(m.userData.stationMaterialStudy){
      ownedMaterials.add(m);for(const key of ['bumpMap','roughnessMap'])if(m[key])ownedTextures.add(m[key]);
    }
  }
  assert.equal(ownedTextures.size,6);assert.equal(study.stats.materials,ownedMaterials.size);
  assert.ok([...ownedMaterials].some(m=>m.userData.stationMaterialStudy==='vinyl'));
  assert.ok([...ownedMaterials].some(m=>m.userData.stationMaterialStudy==='entrance'));
  for(const mode of ['high','balanced','ultra']){
    study.setQuality(mode);let meshes=0;station.group.traverse(o=>{if(o.isMesh)meshes++;});assert.equal(meshes,source.length+1);
    assert.equal(tactile.visible,mode!=='balanced');assert.equal(study.stats.tactileDetail.draws,Number(mode!=='balanced'));
    for(const record of source){assert.equal(record.mesh.geometry,record.geometry);assert.equal(digest(record.geometry),record.digest);}
  }
  let materialsDisposed=0,texturesDisposed=0;
  for(const m of ownedMaterials)m.addEventListener('dispose',()=>materialsDisposed++);
  for(const t of ownedTextures)t.addEventListener('dispose',()=>texturesDisposed++);
  study.dispose();study.dispose();assert.equal(materialsDisposed,ownedMaterials.size);assert.equal(texturesDisposed,6);
  assert.equal(tactile.parent,null);assert.equal(tactileDisposed,1);
  for(const record of source){assert.equal(record.mesh.material,record.material);assert.equal(digest(record.geometry),record.digest);}
  const geometries=new Set(source.map(r=>r.geometry)),materials=new Set(source.flatMap(r=>[r.material].flat()));
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});

test('metal receives the local probe while the mineral floor stays matte', () => {
  const group = new THREE.Group(), geometry = new THREE.BoxGeometry();
  const metal = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:'#9aa3a5'}));
  const floor = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({color:'#777b79'}));
  const sourceFloor=floor.material,sourceColor=sourceFloor.color.clone();
  group.add(metal, floor);
  const study = createStationMaterialStudy(group); study.setEnabled(true);
  assert.equal(metal.material.userData.stationReflectionReceiver, true);
  assert.ok(metal.material.metalness > .7);
  assert.equal(floor.material.userData.stationReflectionReceiver, undefined);
  assert.ok(floor.material.roughness >= .9);
  assert.ok(floor.material.bumpMap);
  assert.ok(floor.material.map===floor.material.bumpMap,'existing mineral pixels also supply visible albedo variation');
  const pixels=floor.material.map.image.data;
  let mean=0;for(let i=0;i<pixels.length;i+=4)mean+=pixels[i]/255;mean/=pixels.length/4;
  assert.ok(Math.abs(floor.material.color.r*mean-sourceColor.r)<.002,'mean albedo stays close to its original finish');
  assert.equal(sourceFloor.color.r,sourceColor.r);assert.equal(sourceFloor.map,null);
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
