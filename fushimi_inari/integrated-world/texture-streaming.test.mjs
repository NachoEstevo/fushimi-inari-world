import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTextureStreaming,textureTierURL} from './texture-streaming.mjs';
const flush=()=>new Promise(r=>setTimeout(r,120));
test('only nearby texture users download; Ultra requests originals and cached tiers are reused',async()=>{
 const requested=[],stream=createTextureStreaming({loadImage:async url=>{requested.push(url);return {width:512,height:512,url};}}),scene=new THREE.Scene();
 const a=stream.load('../assets/textures/nanobanana/wood_vermilion_shuiro_color.png'),b=stream.load('../assets/textures/nanobanana/prop_kitsune_ema_rack.png');
 const near=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({map:a})),far=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({map:b}));far.position.x=1000;scene.add(near,far);
 await stream.prepare(scene,new THREE.Vector3());assert.equal(requested.length,1);assert.match(requested[0],/balanced\/nanobanana\/wood.*webp$/);
 stream.setMode('ultra');stream.update(new THREE.Vector3());await flush();assert.equal(requested.length,2);assert.match(requested[1],/nanobanana\/wood.*png$/);assert.doesNotMatch(requested[1],/balanced/);
 stream.setMode('balanced');stream.update(new THREE.Vector3());await flush();assert.equal(requested.length,2);assert.match(a.image.url,/balanced/);
 stream.update(new THREE.Vector3(1000,0,0));await flush();assert.equal(requested.length,3);assert.match(requested[2],/ema_rack.webp$/);
});
test('switching tier while a request is pending cannot apply a stale high image',async()=>{
 let resolve;const stream=createTextureStreaming({loadImage:()=>new Promise(r=>resolve=r)}),scene=new THREE.Scene(),texture=stream.load('../assets/textures/example.png');scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture})));
 stream.index(scene);stream.setMode('ultra');stream.update(new THREE.Vector3());stream.setMode('balanced');resolve({width:2048,height:2048});await flush();assert.equal(texture.image.width,1);
});
test('URL tier keeps originals unchanged and preserves relative directory ownership',()=>{
 const url='https://example.com/assets/textures/nanobanana/a.png';assert.equal(textureTierURL(url,'ultra'),url);assert.equal(textureTierURL(url,'balanced'),'https://example.com/assets/textures/balanced/nanobanana/a.webp');
});

test('painted torii retain opaque vermilion on pending and failed images without tinting stone or data maps',async()=>{
 const stream=createTextureStreaming({loadImage:async()=>{throw new Error('offline');}}),scene=new THREE.Scene();
 for(const name of ['nanobanana/wood_vermilion_shuiro_color.png','nanobanana/torii_weathered_kanji_color.png','Torii_Kanji_Column/Torii_Kanji_Column_BaseColor.png']){
  const texture=stream.load('../assets/textures/'+name);
  assert.deepEqual([...texture.image.data],[190,49,25,255]);
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture})));
 }
 const stone=stream.load('../assets/textures/stone_torii_color.png'),normal=stream.load('../assets/textures/wood_vermilion_shuiro_normal.png');
 assert.deepEqual([...stone.image.data],[255,255,255,255]);assert.deepEqual([...normal.image.data],[128,128,255,255]);
 await stream.prepare(scene,new THREE.Vector3());
 for(const mesh of scene.children)assert.deepEqual([...mesh.material.map.image.data],[190,49,25,255]);
});
test('clones and repeated loads inherit streamed images before and after indexing',async()=>{
 let finish;const stream=createTextureStreaming({loadImage:()=>new Promise(resolve=>finish=resolve)}),scene=new THREE.Scene();
 const url='../assets/textures/nanobanana/wood_vermilion_shuiro_color.png',texture=stream.load(url),early=texture.clone();
 early.repeat.set(3,4);scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:early})));
 stream.index(scene);stream.update(new THREE.Vector3());const late=texture.clone(),image={width:512,height:512};finish(image);await flush();
 assert.equal(early.image,image);assert.equal(late.image,image);assert.equal(stream.load(url).image,image);assert.deepEqual(early.repeat.toArray(),[3,4]);
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:late})));stream.index(scene);
 stream.setMode('ultra');stream.update(new THREE.Vector3());const ultra={width:2048,height:2048};finish(ultra);await flush();
 assert.equal(early.image,ultra);assert.equal(late.image,ultra);
});
test('invisible detail chunks still index transformed instanced bounds for camera residency',async()=>{
 const requests=[],stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return {width:64,height:64};}}),scene=new THREE.Scene(),group=new THREE.Group();
 group.visible=false;group.position.x=1000;scene.add(group);
 const texture=stream.load('../assets/textures/nanobanana/torii_weathered_kanji_color.png'),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture}),1);
 mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(100,0,0));group.add(mesh);
 stream.index(scene);stream.update(new THREE.Vector3());await flush();assert.equal(requests.length,0);
 stream.update(new THREE.Vector3(1100,0,0));await flush();assert.equal(requests.length,1);assert.equal(texture.image.width,64);
});

test('DOM report diagnostics distinguish loaded alpha maps from unused placeholders and show clone invalidation',async()=>{
 let report;const stream=createTextureStreaming({audit:true,report:value=>report=value,loadImage:async()=>({width:496,height:496})}),scene=new THREE.Scene();
 const map=stream.load('../assets/textures/nanobanana/foliage_sugi_cedar.png'),clone=map.clone();stream.load('../assets/textures/unused.png');
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:clone,alphaTest:.28})));
 const initialVersion=clone.version;await stream.prepare(scene,new THREE.Vector3());
 const foliage=report.diagnostics.find(d=>d.file==='foliage_sugi_cedar.png'),unused=report.diagnostics.find(d=>d.file==='unused.png');
 assert.equal(foliage.tier,'balanced');assert.equal(foliage.users,1);assert.equal(foliage.textures.length,2);
 assert.ok(foliage.textures.every(t=>t.size[0]===496&&t.sourceVersion>1));assert.ok(clone.version>initialVersion);
 assert.equal(unused.tier,null);assert.equal(unused.users,0);assert.deepEqual(unused.textures[0].size,[1,1]);
});

test('dimension changes release every GPU texture before mutating shared sources',async()=>{
 let finish;const stream=createTextureStreaming({loadImage:()=>new Promise(resolve=>finish=resolve)}),scene=new THREE.Scene();
 const map=stream.load('../assets/textures/nanobanana/foliage_sugi_cedar.png'),clone=map.clone(),events=[];
 for(const texture of [map,clone])texture.addEventListener('dispose',()=>events.push({texture,width:map.image.width,cloneWidth:clone.image.width}));
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:clone,alphaTest:.28})));
 stream.index(scene);stream.update(new THREE.Vector3());finish({width:496,height:496});await flush();
 assert.equal(events.length,2);assert.ok(events.every(e=>e.width===1&&e.cloneWidth===1));assert.equal(clone.image.width,496);
 stream.setMode('ultra');stream.update(new THREE.Vector3());finish({width:2048,height:2048});await flush();
 assert.equal(events.length,4);assert.ok(events.slice(2).every(e=>e.width===496&&e.cloneWidth===496));assert.equal(clone.image.width,2048);
 stream.setMode('balanced');stream.update(new THREE.Vector3());await flush();assert.equal(events.length,6);assert.equal(clone.image.width,496);
});


test('production reports omit opt-in per-texture audit diagnostics',()=>{
 let report;const stream=createTextureStreaming({report:value=>report=value});stream.load('../assets/textures/example.png');stream.update(new THREE.Vector3());
 assert.equal(report.registered,1);assert.equal(Object.hasOwn(report,'diagnostics'),false);
});


test('readonly stats expose applied-image revisions and outstanding stream work',async()=>{
 let finish;const stream=createTextureStreaming({loadImage:()=>new Promise(resolve=>finish=resolve)}),scene=new THREE.Scene();
 const map=stream.load('../assets/textures/example.png');scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));
 assert.equal(stream.stats.revision,0);assert.equal(stream.stats.pending,0);stream.index(scene);stream.update(new THREE.Vector3());
 assert.equal(stream.stats.pending,1);assert.equal(stream.stats.revision,0);finish({width:512,height:512});await flush();
 assert.equal(stream.stats.pending,0);assert.equal(stream.stats.revision,1);stream.update(new THREE.Vector3());assert.equal(stream.stats.revision,1);
 stream.setMode('ultra');stream.update(new THREE.Vector3());assert.equal(stream.stats.pending,1);finish({width:1024,height:1024});await flush();
 assert.equal(stream.stats.revision,2);stream.setMode('balanced');stream.update(new THREE.Vector3());await flush();assert.equal(stream.stats.revision,3);assert.equal(stream.stats.pending,0);
 const snapshot=stream.stats;snapshot.revision=999;assert.equal(stream.stats.revision,3);
});


test('simultaneous decodes apply at most one image per paced tick',async()=>{
 const finishes=[],stream=createTextureStreaming({loadImage:()=>new Promise(resolve=>finishes.push(resolve))}),scene=new THREE.Scene();
 for(let i=0;i<6;i++)scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/burst'+i+'.png')})));
 stream.index(scene);stream.update(new THREE.Vector3());
 assert.equal(finishes.length,1);
 await new Promise(resolve=>setTimeout(resolve,60));assert.equal(finishes.length,2);
 for(const finish of finishes)finish({width:64,height:64});
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(stream.stats.revision,0);
 await new Promise(resolve=>setTimeout(resolve,50));assert.ok(stream.stats.revision<=1);
 // Settle remaining work so no timers/request promises survive this test.
 while(stream.stats.pending){for(const finish of finishes.splice(0))finish({width:64,height:64});await flush();}
 assert.equal(stream.stats.revision,6);
});

test('stationary updates skip world residency queries and distant cells',async()=>{
 const stream=createTextureStreaming({loadImage:async()=>({width:64,height:64})}),scene=new THREE.Scene();
 const map=stream.load('../assets/textures/local.png');
 for(let i=0;i<100;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map}));mesh.position.x=i*1000;scene.add(mesh);}
 stream.index(scene);const original=THREE.Sphere.prototype.distanceToPoint;let checks=0;
 THREE.Sphere.prototype.distanceToPoint=function(position){checks++;return original.call(this,position);};
 try{stream.update(new THREE.Vector3());const first=checks;assert.ok(first<5);for(let i=0;i<100;i++)stream.update(new THREE.Vector3());assert.equal(checks,first);}
 finally{THREE.Sphere.prototype.distanceToPoint=original;}
 await flush();
});


test('audit reports are throttled during uploads and finish with indexed user counts',async()=>{
 const reports=[],scene=new THREE.Scene(),stream=createTextureStreaming({audit:true,report:value=>reports.push(value),loadImage:async()=>({width:64,height:64})});
 const map=stream.load('../assets/textures/foliage_audit.png');
 for(let i=0;i<3;i++)scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));
 for(let i=0;i<4;i++)scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/audit'+i+'.png')})));
 await stream.prepare(scene,new THREE.Vector3());
 assert.ok(reports.length<=4,'reports should not run for every decode and upload');
 assert.equal(reports.at(-1).pending,0);assert.equal(reports.at(-1).loaded,5);
 assert.equal(reports.at(-1).diagnostics.find(record=>record.file==='foliage_audit.png').users,3);
 scene.remove(scene.children[0]);stream.index(scene);await stream.prepare(scene,new THREE.Vector3());
 assert.equal(reports.at(-1).diagnostics.find(record=>record.file==='foliage_audit.png').users,2);
});


test('deferred subtree indexing preserves existing residency without revisiting static world geometry',async()=>{
 const requests=[],stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return {width:64,height:64};}}),scene=new THREE.Scene();
 const first=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/existing.png')}));scene.add(first);
 stream.index(scene);stream.update(new THREE.Vector3());await flush();
 // A full-world rebuild would touch this geometry again. Incremental indexing
 // must only inspect the newly attached subtree and its ancestor transforms.
 const geometry=first.geometry;Object.defineProperty(first,'geometry',{get(){throw new Error('static world revisited');},configurable:true});
 const group=new THREE.Group();group.position.x=1000;scene.add(group);
 group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/deferred.png')})));
 stream.index(group,{append:true});stream.index(group,{append:true});
 assert.equal(stream.stats.users,2);stream.update(new THREE.Vector3());await flush();assert.equal(requests.length,1);
 stream.update(new THREE.Vector3(1000,0,0));await flush();assert.equal(requests.length,2);
 Object.defineProperty(first,'geometry',{value:geometry,configurable:true});
 scene.remove(group);stream.index(scene);assert.equal(stream.stats.users,1);
});
