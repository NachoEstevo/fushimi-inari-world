import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createArchitecturalSurfaceLibrary} from './architectural-surface-library.mjs';
import {createTextureStreaming} from './texture-streaming.mjs';

test('materials and physical maps are shared by all users of a surface',()=>{
 const surfaces=createArchitecturalSurfaceLibrary();
 const wood=surfaces.get('timber'),maps=surfaces.getMaps('timber');
 assert.strictEqual(surfaces.get('timber'),wood);
 assert.strictEqual(surfaces.getMaps('timber'),maps);
 assert.strictEqual(wood.map,maps.map);
 assert.strictEqual(wood.bumpMap,maps.bumpMap);
 assert.strictEqual(wood.roughnessMap,maps.roughnessMap);
 assert.strictEqual(maps.bumpMap,maps.roughnessMap);
 assert.equal(maps.map.colorSpace,THREE.SRGBColorSpace);
 assert.equal(maps.bumpMap.colorSpace,THREE.NoColorSpace);
 for(const texture of new Set(Object.values(maps))){
  assert.equal(texture.wrapS,THREE.RepeatWrapping);assert.equal(texture.wrapT,THREE.RepeatWrapping);
  assert.equal(texture.generateMipmaps,true);
 }
 let disposed=0;for(const texture of new Set(Object.values(maps)))texture.addEventListener('dispose',()=>disposed++);
 surfaces.dispose();surfaces.dispose();assert.equal(disposed,2);
});

test('streamed albedo keeps its identity and a natural fallback until the image arrives',()=>{
 const requests=[],textures=[];
 const loadTexture=url=>{requests.push(url);const texture=new THREE.Texture({width:1,height:1});textures.push(texture);return texture;};
 const surfaces=createArchitecturalSurfaceLibrary({loadTexture,assets:{timber:'cedar.webp',plaster:'plaster.webp'}});
 const wood=surfaces.get('timber'),plaster=surfaces.get('plaster');
 assert.deepEqual(requests,['cedar.webp','plaster.webp']);
 assert.strictEqual(wood.map,textures[0]);assert.strictEqual(plaster.map,textures[1]);
 assert.equal(wood.map.image.width,256);assert.equal(plaster.map.image.width,256);
 const replacement={width:512,height:512};wood.map.image=replacement;wood.map.needsUpdate=true;
 assert.strictEqual(surfaces.get('timber'),wood);assert.strictEqual(surfaces.getMaps('timber').map,textures[0]);
 assert.strictEqual(wood.map.image,replacement);
 surfaces.dispose();
});

test('texture streaming discovers nearby material and replaces only its source image',async()=>{
 const requests=[],image={width:128,height:128};
 const stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return image;}});
 const surfaces=createArchitecturalSurfaceLibrary({loadTexture:url=>stream.load(url)}),wood=surfaces.get('timber'),map=wood.map;
 const world=new THREE.Scene(),geometry=new THREE.BoxGeometry();world.add(new THREE.Mesh(geometry,wood));
 await stream.prepare(world,new THREE.Vector3());
 assert.equal(requests.length,1);assert.match(requests[0],/balanced\/architectural-r1\/cedar-weathered-color\.webp$/);
 assert.strictEqual(wood.map,map);assert.strictEqual(map.image,image);
 assert.deepEqual(surfaces.stats,{materials:1,textures:2,textureBytes:128*128*4+256*256*4,streamed:1});
 const other=createArchitecturalSurfaceLibrary({loadTexture:url=>stream.load(url)}),second=other.get('timber');
 assert.strictEqual(second.map.image,image,'a later user keeps the already streamed image');
 geometry.dispose();surfaces.dispose();other.dispose();
 assert.equal(surfaces.stats.textures,0);
});

test('fallback plaster is opaque and has no repeated base shadow',()=>{
 const surfaces=createArchitecturalSurfaceLibrary(),maps=surfaces.getMaps('plaster'),data=maps.map.image.data;
 const mean=y=>{let sum=0;for(let x=0;x<256;x++)sum+=data[(y*256+x)*4];return sum/256;};
 assert.ok(Math.abs(mean(4)-mean(252))<4);
 for(let i=3;i<data.length;i+=4)assert.equal(data[i],255);
 surfaces.dispose();
});
