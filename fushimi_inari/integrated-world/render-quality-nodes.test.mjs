import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {qualityPixelRatio,createRenderQuality} from './render-quality-nodes.mjs';
import ShadowNode from 'three/src/nodes/lighting/ShadowNode.js';
import {pass} from 'three/tsl';

test('main and nested shadow passes share current animated world matrices, restoring ownership on failure',()=>{
 const names=['document','innerWidth','innerHeight','devicePixelRatio'],previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:1280,innerHeight:720,devicePixelRatio:1});
 const scene=new THREE.Scene(),parent=new THREE.Group(),child=new THREE.Object3D();scene.add(parent);parent.add(child);
 const renderPost=THREE.RenderPipeline.prototype.render;
 let updates=0,fail=false;const update=scene.updateMatrixWorld.bind(scene);scene.updateMatrixWorld=(...args)=>{updates++;return update(...args);};
 const renderer={getMaxAnisotropy:()=>16,getPixelRatio:()=>1,setDrawingBufferSize(){}};
 const quality=createRenderQuality({renderer,scene,camera:new THREE.PerspectiveCamera(),sun:new THREE.DirectionalLight()});
 THREE.RenderPipeline.prototype.render=function(){
  // Match the main and nested shadow scene-update condition.
  for(let i=0;i<2;i++)if(scene.matrixWorldAutoUpdate)scene.updateMatrixWorld();
  assert.equal(child.matrixWorld.elements[12],parent.position.x+child.position.x);
  if(fail)throw Error('render failed');
 };
 try{
  parent.position.x=10;child.position.x=2;quality.render();assert.equal(updates,1);assert.equal(scene.matrixWorldAutoUpdate,true);
  parent.position.x=20;quality.render();assert.equal(updates,2);
  fail=true;assert.throws(()=>quality.render(),/render failed/);assert.equal(scene.matrixWorldAutoUpdate,true);
  fail=false;scene.matrixWorldAutoUpdate=false;const before=updates;quality.render();assert.equal(updates,before);assert.equal(scene.matrixWorldAutoUpdate,false);
 }finally{
  quality.dispose();THREE.RenderPipeline.prototype.render=renderPost;
  for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
 }
});

test('prewarm uses the real scene pass type and MSAA before first render and restores target state before waiting',async()=>{
 const names=['document','innerWidth','innerHeight','devicePixelRatio'],previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:1200,innerHeight:800,devicePixelRatio:1});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight(),scope=new THREE.Scene(),view=new THREE.PerspectiveCamera();
 const priorTarget=new THREE.RenderTarget(16,16),priorMRT={label:'existing attachments'};
 let target=priorTarget,face=2,mip=3,mrt=priorMRT,ratio=1,initialized=true,compiledPass,compiledTarget,release,compiles=0,renders=0;
 const samplePass=pass(scene,camera),passPrototype=Object.getPrototypeOf(samplePass),setup=passPrototype.setup;
 passPrototype.setup=function(builder){compiledPass=this;return setup.call(this,builder);};
 const renderer={samples:4,hasInitialized:()=>initialized,getOutputBufferType:()=>THREE.HalfFloatType,getMaxAnisotropy:()=>16,getPixelRatio:()=>ratio,setDrawingBufferSize:(w,h,value)=>ratio=value,
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getMRT:()=>mrt,setMRT:value=>mrt=value,
  setRenderTarget(value,nextFace=0,nextMip=0){target=value;face=nextFace;mip=nextMip;},getOutputRenderTarget:()=>null,getDrawingBufferSize:value=>value.set(1200,800),
  render(renderScene,renderCamera){renders++;assert.equal(renderScene,scene);assert.equal(renderCamera,camera);assert.equal(target,compiledTarget);assert.equal(target.samples,4);assert.equal(target.texture.type,THREE.HalfFloatType);},
  compileAsync(renderScene,renderCamera,targetScene){compiles++;assert.equal(renderScene,scope);assert.equal(renderCamera,view);assert.equal(targetScene,scene);compiledTarget=target;
   assert.equal(target,compiledPass.renderTarget);assert.equal(target.texture.type,THREE.HalfFloatType);assert.equal(target.samples,4);assert.equal(mrt,compiledPass.getMRT());assert.notEqual(target,priorTarget);
   return new Promise(resolve=>release=resolve);
  }};
 const quality=createRenderQuality({renderer,scene,camera,sun});
 const restored=()=>{assert.equal(target,priorTarget);assert.equal(face,2);assert.equal(mip,3);assert.equal(mrt,priorMRT);};
 try{
  assert.equal(renders,0);const work=quality.compileAsync(scope,view,scene);restored();assert.equal(compiles,1);release();await work;restored();
  // Exercise the actual pass with a mock draw: its first visible render
  // binds the exact same target, format and sample count used for prewarming.
  compiledPass.updateBefore({renderer});assert.equal(renders,1);
  renderer.setRenderTarget(priorTarget,2,3);renderer.setMRT(priorMRT);
  for(const asynchronous of [false,true]){
   renderer.compileAsync=()=>{assert.equal(target,compiledTarget);if(asynchronous)return Promise.reject(Error('pipeline failed'));throw Error('pipeline failed');};
   if(asynchronous)await assert.rejects(quality.compileAsync(scope,view,scene),/pipeline failed/);
   else assert.throws(()=>quality.compileAsync(scope,view,scene),/pipeline failed/);
   restored();
  }
  initialized=false;await assert.rejects(quality.compileAsync(scope,view,scene),/Initialize the renderer/);restored();
  quality.dispose();await assert.rejects(quality.compileAsync(scope,view,scene),/disposed/);restored();
 }finally{
  quality.dispose();priorTarget.dispose();samplePass.dispose();passPrototype.setup=setup;
  for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
 }
});

test('compilation state remains accurate without blocking rendering or leaking target state',async()=>{
 const names=['document','innerWidth','innerHeight','devicePixelRatio'],previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:1200,innerHeight:800,devicePixelRatio:1});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight(),priorTarget=new THREE.RenderTarget(8,8),priorMRT={};
 let target=priorTarget,mrt=priorMRT,face=2,mip=3,draws=0,cityDraws=0;const pending=[];
 const originalRender=THREE.RenderPipeline.prototype.render;THREE.RenderPipeline.prototype.render=function(){draws++;};
 const renderer={samples:1,hasInitialized:()=>true,getOutputBufferType:()=>THREE.HalfFloatType,getMaxAnisotropy:()=>16,getPixelRatio:()=>1,setDrawingBufferSize(){},
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getMRT:()=>mrt,setMRT:value=>mrt=value,
  setRenderTarget(value,f=0,m=0){target=value;face=f;mip=m;},getOutputRenderTarget:()=>null,getDrawingBufferSize:value=>value.set(1200,800),
  compileAsync(){assert.equal(quality.compiling,true);return new Promise((resolve,reject)=>pending.push({resolve,reject}));}};
 const cityHorizon={compose:color=>color,render(){cityDraws++;},dispose(){}};
 const quality=createRenderQuality({renderer,scene,camera,sun,cityHorizon});
 const restored=()=>{assert.equal(target,priorTarget);assert.equal(mrt,priorMRT);assert.equal(face,2);assert.equal(mip,3);};
 try{
  const a=quality.compileAsync(scene,camera),b=quality.compileAsync(scene,camera);restored();assert.equal(quality.compiling,true);quality.render();assert.equal(draws,1);assert.equal(cityDraws,1);
  pending[0].resolve();await a;assert.equal(quality.compiling,true);quality.render();assert.equal(draws,2);assert.equal(cityDraws,2);
  pending[1].resolve();await b;assert.equal(quality.compiling,false);quality.render();assert.equal(draws,3);assert.equal(cityDraws,3);
  const bad=quality.compileAsync(scene,camera);pending[2].reject(Error('pipeline failed'));await assert.rejects(bad,/pipeline failed/);restored();assert.equal(quality.compiling,false);
  renderer.compileAsync=()=>{throw Error('synchronous failure');};assert.throws(()=>quality.compileAsync(scene,camera),/synchronous failure/);restored();assert.equal(quality.compiling,false);
  quality.render();assert.equal(draws,4);assert.equal(cityDraws,4);
 }finally{quality.dispose();priorTarget.dispose();THREE.RenderPipeline.prototype.render=originalRender;for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}}
});

test('quality leaves native WebGPU readiness ownership intact on r186',()=>{
 const names=['document','innerWidth','innerHeight','devicePixelRatio'],previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:800,innerHeight:600,devicePixelRatio:1});
 let draws=0;const original=function(){draws++;},backend={isWebGPUBackend:true,draw:original,get:()=>({pipeline:null})};
 const renderer={backend,getMaxAnisotropy:()=>16,getPixelRatio:()=>1,setDrawingBufferSize(){}};
 const quality=createRenderQuality({renderer,scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),sun:new THREE.DirectionalLight()});
 try{assert.equal(backend.draw,original);backend.draw({pipeline:{},object:{name:'pending'}});assert.equal(draws,1);assert.deepEqual(quality.pipelineStats,{skipped:0,lastObjectName:''});quality.dispose();assert.equal(backend.draw,original);}finally{quality.dispose();for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}}
});

test('WebGPU presets bound pixel cost on ultrawide and high-DPI screens in increasing order',()=>{
  for(const [width,height] of [[3431,1264],[3840,2160],[8000,4000]]){
    let previous=0;
    for(const [mode,budget] of [['balanced',2000000],['high',4000000]]){
      const pixels=width*height*qualityPixelRatio(mode,3,width,height)**2;
      assert.ok(pixels<=budget+.001,`${mode} exceeds its pixel budget`);
      assert.ok(pixels>previous,`${mode} must improve resolution`);
      previous=pixels;
    }
  }
  assert.equal(qualityPixelRatio('balanced',1,1280,720),1);
  assert.equal(qualityPixelRatio('high',3,1000,700),2);
  assert.equal(qualityPixelRatio('high',1,1280,720),1.5);
  assert.equal(qualityPixelRatio('ultra',1,1280,720),1.5);
});

test('WebGPU switches apply shadows, filtering, creative looks and restore Balanced',async()=>{
  const names=['document','innerWidth','innerHeight','devicePixelRatio'];
  const previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:3431,innerHeight:1264,devicePixelRatio:2});
  let ratio=1,disposed=0;
  let activeTarget=null;
  const prepared=[];
  const renderer={getMaxAnisotropy:()=>16,setPixelRatio:value=>ratio=value,getPixelRatio:()=>ratio,setDrawingBufferSize(width,height,value){ratio=value;},
    getRenderTarget:()=>activeTarget,getActiveCubeFace:()=>2,getActiveMipmapLevel:()=>1,
    setRenderTarget:target=>activeTarget=target,clear:()=>prepared.push([activeTarget.width,activeTarget.height])};
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight();
  const texture=new THREE.Texture({width:1,height:1});texture.anisotropy=4;
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:texture})));
  // Exercise r180's real cached shadow target and resize implementation.
  const shadowNode=new ShadowNode(sun);
  const target=new THREE.RenderTarget(2048,2048,{depthTexture:new THREE.DepthTexture(2048,2048)});
  const depthTexture=target.depthTexture,colorTexture=target.texture;
  target.addEventListener('dispose',()=>disposed++);
  shadowNode.shadowMap=target;sun.shadow.map=target;
  const frame={scene,renderer:{render(){} }};
  const quality=createRenderQuality({renderer,scene,camera,sun});
  const report=()=>JSON.parse(document.body.dataset.renderQuality);
  try{
    assert.equal(report().shadowSize,2048);
    assert.equal(disposed,0);
    assert.equal(report().maxPixels,2000000);
    quality.setLook('aozora');assert.equal(report().look,'aozora');assert.equal(report().bloom,.20*.65);
    quality.setLook('dreamcore');
    assert.equal(report().look,'soft-light');assert.equal(report().bloom,.36*.65);
    await quality.setMode('high');
    assert.equal(report().shadowSize,2048);assert.equal(report().bloom,.36);
    assert.equal(texture.anisotropy,16);assert.equal(quality.detailScale,1.25);
    await quality.setMode('ultra');
    assert.equal(quality.mode,'high','legacy Ultra selects High quality');
    assert.equal(report().shadowSize,2048);assert.equal(texture.anisotropy,16);
    assert.equal(sun.shadow.map,target);
    assert.equal(disposed,0,'quality transitions never resize the live shadow atlas');
    assert.equal(activeTarget,null);assert.deepEqual(prepared,[]);
    shadowNode.renderShadow(frame);
    assert.equal(target.width,2048);assert.equal(target.height,2048);
    assert.equal(target.depthTexture,depthTexture);assert.equal(target.texture,colorTexture);
    assert.equal(disposed,0,'ShadowNode must not destroy a depth texture during render');
    assert.equal(quality.detailScale,1.25);
    await quality.setMode('balanced');
    assert.equal(report().shadowSize,2048);assert.equal(texture.anisotropy,4);
    assert.equal(quality.detailScale,1);assert.equal(report().look,'soft-light');
    await quality.setMode('invalid');assert.equal(quality.mode,'balanced');
    assert.equal(disposed,0,'returning to Balanced preserves the shadow atlas');
    shadowNode.renderShadow(frame);
    assert.equal(target.width,2048);assert.equal(target.depthTexture,depthTexture);
    quality.dispose();quality.dispose();
  }finally{
    for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
  }
});


test('WebGPU transitions wait for submitted work and serialize mode and resize requests',async()=>{
  const names=['document','innerWidth','innerHeight','devicePixelRatio'];
  const previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:1200,innerHeight:800,devicePixelRatio:2});
  let ratio=1;
  const releases=[],sizes=[];
  let graphsDisposed=0;
  const disposePost=THREE.RenderPipeline.prototype.dispose;
  THREE.RenderPipeline.prototype.dispose=function(){graphsDisposed++;return disposePost.call(this);};
  const renderer={getMaxAnisotropy:()=>16,getPixelRatio:()=>ratio,setPixelRatio:value=>ratio=value,
    setDrawingBufferSize:(width,height,value)=>{ratio=value;sizes.push([width,height]);},backend:{isWebGPUBackend:true,device:{queue:{onSubmittedWorkDone:()=>new Promise(resolve=>releases.push(resolve))}}},
    waitForGPU(){throw Error('compatibility stub must not settle transitions');}};
  const quality=createRenderQuality({renderer,scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),sun:new THREE.DirectionalLight()});
  try{
    assert.equal(quality.mode,'balanced','initial state is established synchronously');
    const first=quality.setMode('high'),second=quality.resize(900,600);
    quality.render(); // Must skip, since this renderer deliberately has no render implementation.
    await Promise.resolve();
    assert.equal(releases.length,1);assert.equal(quality.mode,'balanced');assert.equal(sizes.length,1);
    releases[0]();await first;
    assert.equal(quality.mode,'high');assert.equal(graphsDisposed,0,'resolution changes retain graph texture identities');
    await Promise.resolve();
    assert.equal(releases.length,2);assert.equal(sizes.length,2);
    quality.setLook('sakura');quality.render();
    releases[1]();await second;
    assert.deepEqual(sizes.at(-1),[900,600]);assert.equal(graphsDisposed,0);
    const report=JSON.parse(document.body.dataset.renderQuality);
    assert.equal(report.status,'ready');assert.equal(report.look,'sakura');assert.equal(report.bloom,.30);
  }finally{
    quality.dispose();
    THREE.RenderPipeline.prototype.dispose=disposePost;
    for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
  }
});
