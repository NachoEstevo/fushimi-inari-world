import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createTextureStreaming} from './texture-streaming.mjs';

// The viewer owns DOM/bootstrap side effects. Execute its actual preparation
// callbacks with controlled dependencies rather than importing the whole app.
const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8');
const expression=(start,end)=>source.slice(source.indexOf(start)+start.length,source.indexOf(end,source.indexOf(start))).trim();
const deferredExpression=expression('const compileGroup=',';\n    await (renderPreparation');
const qualityExpression=expression('onRenderQuality:',',\n    onDetailDistance:');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture({stream,compile=async()=>{},applyQuality}={}){
 const events=[],camera={position:new THREE.Vector3()},controls={enabled:false},pauses=[];
 const quality={mode:'balanced',async setMode(value){events.push('quality');await applyQuality?.(value);quality.mode=value;}};
 const dependencies={
  camera,quality,controls,textureStreaming:stream,scene:{},group:{},query:new URLSearchParams(),
  walkingPrewarm:{setBlocked:()=>events.push('block'),awaitIdle:async()=>events.push('idle'),setRadius(){},invalidate:()=>events.push('invalidate')},
  compileAddedGroup:async()=>{events.push('compile');await compile();},compilationLights:{getLights(){}},
  renderPreparation:{run:async work=>work()},viewingDistance:{setQuality(){}},sunShadows:{setQuality(){}},prewarmViewRadius:()=>100,
  walkingPreparationBounds:new Map(),yieldPreparation:async()=>{},renderBuildAudit:null,reportWalkingNeighborhood(){},
  prepareWalkingNeighborhood:async options=>{events.push('neighborhood');assert.equal(options.camera,camera);assert.equal(options.position,camera.position);},
  leafLight:{setEnabled(){},stats:{}},sunShafts:{setQuality(){},update(){},mesh:{}},
  appearance:{prepare:async()=>events.push('appearance'),stats:{}},zen:{prepare:async()=>events.push('zen')},compileZen(){},assembly:{keihanStation:{group:{}}},
  photo:{active:false},menu:{active:false},journal:{active:false},arrival:null,sectorPreparation:{busy:false},
  document:{body:{dataset:{},classList:{contains:()=>false}}},walker:{active:false,pause:value=>pauses.push(value)},allowDebugCamera:true,$:()=>({disabled:true})
 };
 const make=new Function(...Object.keys(dependencies),`let qualityPending=0;return {deferred:${deferredExpression},changeQuality:${qualityExpression},get pending(){return qualityPending;}};`);
 return Object.assign(make(...Object.values(dependencies)),{events,camera,quality,controls,pauses});
}

test('quality preparation waits for actual final-tier images before configuring/render preparation',async()=>{
 const image=deferred(),stream=createTextureStreaming({loadImage:()=>image.promise}),scene=new THREE.Scene();
 const texture=stream.load('../assets/textures/readiness.png'),clone=texture.clone();
 scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:texture})),new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial({map:clone})));stream.index(scene);
 const f=fixture({stream,applyQuality(){assert.equal(texture.image.width,256);assert.equal(clone.image.width,256);}});
 const work=f.changeQuality('high');await tick();
 assert.equal(f.pending,1);assert.equal(f.quality.mode,'balanced');assert.equal(texture.image.width,1);assert.ok(!f.events.includes('compile'));
 image.resolve({width:256,height:256});await work;
 assert.equal(f.pending,0);assert.equal(f.quality.mode,'high');assert.ok(f.events.indexOf('quality')<f.events.indexOf('compile'));assert.deepEqual(f.pauses,[false]);
 assert.ok(f.events.indexOf('invalidate')<f.events.indexOf('neighborhood'));assert.equal(f.events.at(-1),'neighborhood','prepared owner generation is not invalidated after readiness');
});

test('failed image readiness restores the active texture tier and releases the transition owner',async()=>{
 const gate=deferred(),modes=[],stream={setMode:value=>modes.push(value),prepareAt:()=>gate.promise};
 const f=fixture({stream}),work=f.changeQuality('high');await tick();gate.reject(Error('Image preparation timed out'));
 await assert.rejects(work,/timed out/);assert.deepEqual(modes,['high','balanced']);assert.equal(f.quality.mode,'balanced');
 assert.equal(f.pending,0);assert.deepEqual(f.pauses,[false]);assert.equal(f.controls.enabled,true);assert.ok(!f.events.includes('compile'));
});

test('failed quality configuration also restores streaming to the active renderer tier',async()=>{
 const modes=[],stream={setMode:value=>modes.push(value),prepareAt:async()=>{}},f=fixture({stream,applyQuality(){throw Error('Quality unavailable');}});
 await assert.rejects(f.changeQuality('high'),/Quality unavailable/);assert.deepEqual(modes,['high','balanced']);assert.equal(f.pending,0);assert.ok(!f.events.includes('compile'));
});

test('deferred building shaders wait for texture readiness and never compile failed preparation',async()=>{
 for(const failed of [false,true]){
  const gate=deferred(),f=fixture({stream:{prepareAt:()=>gate.promise}}),work=f.deferred();await tick();
  assert.deepEqual(f.events,['block','idle']);
  if(failed){gate.reject(Error('No destination images'));await assert.rejects(work,/destination images/);assert.ok(!f.events.includes('compile'));}
  else{gate.resolve();await work;assert.deepEqual(f.events,['block','idle','compile']);}
 }
});

test('startup awaits the platform neighborhood with the real camera before it can release the welcome sheet',async()=>{
 const start=source.indexOf("loadingStage('Preparing nearby walking details…');"),end=source.indexOf('\n  if(arrivalPrepared){',start);
 const startup=source.slice(start,end),camera=new THREE.PerspectiveCamera();camera.position.set(20,2,30);
 for(const arrivalPrepared of [true,false]){
  const ready=deferred(),calls=[],expected=arrivalPrepared?[1,2,3]:camera.position.toArray();let finished=false;
  const dependencies={THREE,camera,arrivalPrepared,assembly:{keihanStation:{spec:{arrival:{platformPose:{position:[1,2,3]}}}}},
   loadingStage:()=>{},walkingPreparationBounds:new Map(),scene:{},quality:{},textureStreaming:{},walkingPrewarm:{},yieldPreparation:async()=>{},
   compilationLights:{getLights(){}},renderBuildAudit:null,reportWalkingNeighborhood(){},prewarmViewRadius:()=>100,
   prepareWalkingNeighborhood:async options=>{calls.push(options);await ready.promise;}};
  const run=new Function(...Object.keys(dependencies),`return async()=>{${startup}};`)(...Object.values(dependencies));
  const work=run().then(()=>finished=true);await tick();assert.equal(finished,false);assert.equal(calls.length,1);
  assert.equal(calls[0].camera,camera);assert.deepEqual(calls[0].position.toArray(),expected);assert.equal(calls[0].radius,164);
  ready.resolve();await work;assert.equal(finished,true);assert.deepEqual(camera.position.toArray(),[20,2,30]);
 }
});
