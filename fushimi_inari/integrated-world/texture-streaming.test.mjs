import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTextureStreaming,textureTierURL} from './texture-streaming.mjs';
const until=async predicate=>{const end=performance.now()+10000;while(!predicate()){assert.ok(performance.now()<end,'stream work timed out');await new Promise(resolve=>setTimeout(resolve,5));}};
const settled=stream=>until(()=>stream.stats.pending===0);

test('destination preparation uses the existing index and finishes while unrelated downloads remain pending',async()=>{
 let finishFar;const requests=[],stream=createTextureStreaming({loadImage:url=>{requests.push(url);return url.includes('far')?new Promise(resolve=>finishFar=resolve):Promise.resolve({width:64,height:64});}}),scene=new THREE.Scene();
 const near=stream.load('../assets/textures/checkpoint-near.png'),far=stream.load('../assets/textures/checkpoint-far.png');
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:near})));
 const distant=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:far}));distant.position.x=1000;scene.add(distant);stream.index(scene);
 stream.prefetch(new THREE.Vector3(1000,0,0));await until(()=>!!finishFar);
 scene.updateWorldMatrix=()=>{throw Error('checkpoint must not reindex world');};
 const result=await stream.prepareAt(new THREE.Vector3(),{timeoutMs:1500});
 assert.deepEqual(result,{textures:1,failed:0});assert.equal(near.image.width,64);assert.equal(far.image.width,1);assert.ok(stream.stats.pending>0);assert.equal(requests.length,2);
 finishFar({width:64,height:64});await settled(stream);
});

test('destination preparation requests a newly selected tier for records already finished in the prior tier',async()=>{
 let finishSlow;const requests=[],scene=new THREE.Scene(),stream=createTextureStreaming({loadImage:url=>{requests.push(url);return url.includes('slow')&&url.includes('balanced')?new Promise(resolve=>finishSlow=resolve):Promise.resolve({width:url.includes('balanced')?64:256,height:64});}});
 const fast=stream.load('../assets/textures/checkpoint-fast.png'),slow=stream.load('../assets/textures/checkpoint-slow.png');for(const map of [fast,slow])scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));stream.index(scene);
 const prepared=stream.prepareAt(new THREE.Vector3(),{timeoutMs:2000});await until(()=>fast.image.width===64&&!!finishSlow);
 stream.setMode('high');finishSlow({width:64,height:64});await prepared;
 assert.equal(fast.image.width,256);assert.equal(slow.image.width,256);assert.equal(requests.filter(url=>!url.includes('balanced')).length,2);await settled(stream);
});

test('destination preparation reports failed images and times out only its unfinished selection',async()=>{
 const scene=new THREE.Scene(),stream=createTextureStreaming({loadImage:()=>{throw Error('synchronous offline');}}),map=stream.load('../assets/textures/checkpoint-error.png');scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));stream.index(scene);
 assert.deepEqual(await stream.prepareAt(new THREE.Vector3(),{timeoutMs:1000}),{textures:1,failed:1});assert.equal(stream.stats.pending,0);
 let finish;const waiting=createTextureStreaming({loadImage:()=>new Promise(resolve=>finish=resolve)}),world=new THREE.Scene();world.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:waiting.load('../assets/textures/checkpoint-timeout.png')})));waiting.index(world);
 await assert.rejects(waiting.prepareAt(new THREE.Vector3(),{timeoutMs:90}),/still preparing/);
 finish({width:64,height:64});await settled(waiting);
 assert.deepEqual(await waiting.prepareAt(new THREE.Vector3()),{textures:1,failed:0});
});
test('only nearby texture users download; High requests originals and cached tiers are reused',async()=>{
 const requested=[],stream=createTextureStreaming({loadImage:async url=>{requested.push(url);return {width:512,height:512,url};}}),scene=new THREE.Scene();
 const a=stream.load('../assets/textures/nanobanana/wood_vermilion_shuiro_color.png'),b=stream.load('../assets/textures/nanobanana/prop_kitsune_ema_rack.png');
 const near=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({map:a})),far=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial({map:b}));far.position.x=1000;scene.add(near,far);
 await stream.prepare(scene,new THREE.Vector3());assert.equal(requested.length,1);assert.match(requested[0],/balanced\/nanobanana\/wood.*webp$/);
 stream.setMode('high');stream.update(new THREE.Vector3());await settled(stream);assert.equal(requested.length,2);assert.match(requested[1],/nanobanana\/wood.*png$/);assert.doesNotMatch(requested[1],/balanced/);
 stream.setMode('ultra');stream.update(new THREE.Vector3());await settled(stream);assert.equal(requested.length,2,'legacy Ultra reuses the High tier');
 stream.setMode('balanced');stream.update(new THREE.Vector3());await settled(stream);assert.equal(requested.length,2);assert.match(a.image.url,/balanced/);
 stream.update(new THREE.Vector3(1000,0,0));await settled(stream);assert.equal(requested.length,3);assert.match(requested[2],/ema_rack.webp$/);
});
test('switching tier while a request is pending cannot apply a stale high image',async()=>{
 let resolve;const stream=createTextureStreaming({loadImage:()=>new Promise(r=>resolve=r)}),scene=new THREE.Scene(),texture=stream.load('../assets/textures/example.png');scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture})));
 stream.index(scene);stream.setMode('high');stream.update(new THREE.Vector3());stream.setMode('balanced');const highResolve=resolve;highResolve({width:2048,height:2048});await until(()=>resolve!==highResolve);assert.equal(texture.image.width,1);
 resolve({width:64,height:64});await settled(stream);assert.equal(texture.image.width,64);
});
test('URL tier keeps originals unchanged and preserves relative directory ownership',()=>{
 const url='https://example.com/assets/textures/nanobanana/a.png';assert.equal(textureTierURL(url,'high'),url);assert.equal(textureTierURL(url,'ultra'),url);assert.equal(textureTierURL(url,'balanced'),'https://example.com/assets/textures/balanced/nanobanana/a.webp');
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
 stream.index(scene);stream.update(new THREE.Vector3());const late=texture.clone(),image={width:512,height:512};finish(image);await settled(stream);
 assert.equal(early.image,image);assert.equal(late.image,image);assert.equal(stream.load(url).image,image);assert.deepEqual(early.repeat.toArray(),[3,4]);
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:late})));stream.index(scene);
 stream.setMode('high');stream.update(new THREE.Vector3());const ultra={width:2048,height:2048};finish(ultra);await settled(stream);
 assert.equal(early.image,ultra);assert.equal(late.image,ultra);
});
test('invisible detail chunks still index transformed instanced bounds for camera residency',async()=>{
 const requests=[],stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return {width:64,height:64};}}),scene=new THREE.Scene(),group=new THREE.Group();
 group.visible=false;group.position.x=1000;scene.add(group);
 const texture=stream.load('../assets/textures/nanobanana/torii_weathered_kanji_color.png'),mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture}),1);
 mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(100,0,0));group.add(mesh);
 stream.index(scene);stream.update(new THREE.Vector3());await settled(stream);assert.equal(requests.length,0);
 stream.update(new THREE.Vector3(1100,0,0));await settled(stream);assert.equal(requests.length,1);assert.equal(texture.image.width,64);
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
 stream.index(scene);stream.update(new THREE.Vector3());finish({width:496,height:496});await settled(stream);
 assert.equal(events.length,2);assert.ok(events.every(e=>e.width===1&&e.cloneWidth===1));assert.equal(clone.image.width,496);
 stream.setMode('high');stream.update(new THREE.Vector3());finish({width:2048,height:2048});await settled(stream);
 assert.equal(events.length,4);assert.ok(events.slice(2).every(e=>e.width===496&&e.cloneWidth===496));assert.equal(clone.image.width,2048);
 stream.setMode('balanced');stream.update(new THREE.Vector3());await settled(stream);assert.equal(events.length,6);assert.equal(clone.image.width,496);
});


test('production reports omit opt-in per-texture audit diagnostics',()=>{
 let report;const stream=createTextureStreaming({report:value=>report=value});stream.load('../assets/textures/example.png');stream.update(new THREE.Vector3());
 assert.equal(report.registered,1);assert.equal(Object.hasOwn(report,'diagnostics'),false);
});


test('readonly stats expose applied-image revisions and outstanding stream work',async()=>{
 let finish;const stream=createTextureStreaming({loadImage:()=>new Promise(resolve=>finish=resolve)}),scene=new THREE.Scene();
 const map=stream.load('../assets/textures/example.png');scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));
 assert.equal(stream.stats.revision,0);assert.equal(stream.stats.pending,0);stream.index(scene);stream.update(new THREE.Vector3());
 assert.equal(stream.stats.pending,1);assert.equal(stream.stats.revision,0);finish({width:512,height:512});await settled(stream);
 assert.equal(stream.stats.pending,0);assert.equal(stream.stats.revision,1);stream.update(new THREE.Vector3());assert.equal(stream.stats.revision,1);
 stream.setMode('high');stream.update(new THREE.Vector3());assert.equal(stream.stats.pending,1);finish({width:1024,height:1024});await settled(stream);
 assert.equal(stream.stats.revision,2);stream.setMode('balanced');stream.update(new THREE.Vector3());await settled(stream);assert.equal(stream.stats.revision,3);assert.equal(stream.stats.pending,0);
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
 while(stream.stats.pending){for(const finish of finishes.splice(0))finish({width:64,height:64});await until(()=>finishes.length>0||stream.stats.pending===0);}
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
 await settled(stream);
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
 stream.index(scene);stream.update(new THREE.Vector3());await settled(stream);
 // A full-world rebuild would touch this geometry again. Incremental indexing
 // must only inspect the newly attached subtree and its ancestor transforms.
 const geometry=first.geometry;Object.defineProperty(first,'geometry',{get(){throw new Error('static world revisited');},configurable:true});
 const group=new THREE.Group();group.position.x=1000;scene.add(group);
 group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/deferred.png')})));
 stream.index(group,{append:true});stream.index(group,{append:true});
 assert.equal(stream.stats.users,2);stream.update(new THREE.Vector3());await settled(stream);assert.equal(requests.length,1);
 stream.update(new THREE.Vector3(1000,0,0));await settled(stream);assert.equal(requests.length,2);
 Object.defineProperty(first,'geometry',{value:geometry,configurable:true});
 scene.remove(group);stream.index(scene);assert.equal(stream.stats.users,1);
});



test('distinct source groups apply across paced ticks while clones retain source sharing',async()=>{
 const scene=new THREE.Scene(),stream=createTextureStreaming({loadImage:async()=>({width:64,height:64})});
 const textures=Array.from({length:5},()=>stream.load('../assets/textures/bounded.png')),clone=textures[0].clone();textures.push(clone);
 let disposals=0;for(const map of textures){map.addEventListener('dispose',()=>disposals++);scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));}
 assert.equal(textures[0].source,clone.source);
 stream.index(scene);stream.update(new THREE.Vector3());await until(()=>disposals>0);
 assert.equal(disposals,2,'one atomic source group, including its clone');assert.equal(textures.filter(t=>t.image.width===64).length,2);assert.equal(stream.stats.revision,0);assert.ok(stream.stats.pending>0);
 const late=textures[1].clone();scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:late})));stream.index(scene,{append:true});
 await until(()=>stream.stats.pending===0);assert.ok([...textures,late].every(t=>t.image.width===64));assert.equal(disposals,6);assert.equal(stream.stats.revision,1);assert.equal(stream.stats.maxUploadGroupTextures,2);assert.equal(stream.stats.maxUploadGroupPixels,4096);
});

test('reverting mode during a partially applied tier restores every source group from cache',async()=>{
 const requests=[],scene=new THREE.Scene(),stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return {width:url.includes('balanced')?64:256,height:64};}});
 const textures=Array.from({length:4},()=>stream.load('../assets/textures/race.png')),base=textures[0];
 for(const map of textures)scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));
 await stream.prepare(scene,new THREE.Vector3());stream.setMode('high');stream.update(new THREE.Vector3());
 await until(()=>textures.some(t=>t.image.width===256));assert.ok(textures.some(t=>t.image.width===64));
 stream.setMode('balanced');stream.update(new THREE.Vector3());await until(()=>stream.stats.pending===0);
 assert.ok(textures.every(t=>t.image.width===64));assert.equal(requests.length,2);assert.equal(stream.stats.revision,2);
 const appended=base.clone(),group=new THREE.Group();group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:appended})));scene.add(group);stream.index(group,{append:true});
 stream.setMode('high');await stream.prepare(scene,new THREE.Vector3());assert.ok([...textures,appended].every(t=>t.image.width===256));assert.equal(stream.stats.pending,0);
});

test('local image revisions change only for applied nearby images, including cached tier returns',async()=>{
 const requests=[],stream=createTextureStreaming({loadImage:async url=>{requests.push(url);return {width:url.includes('balanced')?64:256,height:64};}}),scene=new THREE.Scene(),position=new THREE.Vector3();
 const near=stream.load('../assets/textures/local-revision.png'),far=stream.load('../assets/textures/distant-revision.png');
 const local=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:near})),distant=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:far}));distant.position.x=1000;scene.add(local,distant);stream.index(scene);
 const placeholder=stream.revisionAt(position);assert.equal(typeof placeholder,'string');assert.equal(stream.stats.pending,0,'reading a revision must not request images');
 assert.deepEqual(await stream.prepareAt(position),{textures:1,failed:0});const balanced=stream.revisionAt(position);assert.notEqual(balanced,placeholder);
 const globalRevision=stream.stats.revision;await stream.prepareAt(new THREE.Vector3(1000,0,0));assert.ok(stream.stats.revision>globalRevision);
 assert.equal(stream.revisionAt(position),balanced,'distant image completion cannot invalidate this probe');
 stream.setMode('high');assert.equal(stream.revisionAt(position),balanced,'a requested tier does not change an applied image');assert.equal(stream.stats.pending,0);
 await stream.prepareAt(position);const high=stream.revisionAt(position);assert.notEqual(high,balanced);assert.equal(near.image.width,256);assert.equal(far.image.width,64);
 stream.setMode('balanced');await stream.prepareAt(position);assert.notEqual(stream.revisionAt(position),balanced,'returning to a cached tier still applies a new image revision');assert.equal(near.image.width,64);assert.equal(requests.length,3);await settled(stream);
});

test('local image revision indexing admits new nearby records while duplicate or distant users stay stable',async()=>{
 const stream=createTextureStreaming({loadImage:async()=>({width:64,height:64})}),scene=new THREE.Scene(),position=new THREE.Vector3(),existing=stream.load('../assets/textures/revision-existing.png');
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:existing})));stream.index(scene);await stream.prepareAt(position);const initial=stream.revisionAt(position);
 const group=new THREE.Group(),map=stream.load('../assets/textures/revision-appended.png');group.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map})));scene.add(group);
 assert.equal(stream.revisionAt(position),initial,'unindexed textures do not belong to the local scene');
 stream.index(group,{append:true});const appended=stream.revisionAt(position);assert.notEqual(appended,initial,'index generation invalidates the cached selection');
 await stream.prepareAt(position);const loaded=stream.revisionAt(position);assert.notEqual(loaded,appended);
 const duplicate=new THREE.Group();duplicate.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:existing})));scene.add(duplicate);stream.index(duplicate,{append:true});assert.equal(stream.revisionAt(position),loaded,'multiple users of an unchanged image do not add revisions');
 const distant=new THREE.Group();distant.position.x=1000;distant.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/revision-far-append.png')})));scene.add(distant);stream.index(distant,{append:true});assert.equal(stream.revisionAt(position),loaded);
 stream.index(scene);assert.equal(stream.revisionAt(position),loaded,'rebuilding the same index does not change image content');await settled(stream);
});

test('repeated image revision reads at one point reuse the spatial query without queuing work',()=>{
 const stream=createTextureStreaming(),scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:stream.load('../assets/textures/revision-cache.png')})));stream.index(scene);
 const original=THREE.Sphere.prototype.distanceToPoint;let checks=0;
 THREE.Sphere.prototype.distanceToPoint=function(position){checks++;return original.call(this,position);};
 try{
  const first=stream.revisionAt(new THREE.Vector3());assert.equal(checks,1);
  for(let i=0;i<100;i++)assert.equal(stream.revisionAt(new THREE.Vector3()),first);assert.equal(checks,1,'equal coordinates reuse the cached result');
  stream.revisionAt(new THREE.Vector3(1,0,0));assert.equal(checks,2,'a different point reselects nearby owners');assert.equal(stream.stats.pending,0);
 }finally{THREE.Sphere.prototype.distanceToPoint=original;}
});
