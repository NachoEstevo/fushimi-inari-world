import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {qualityPixelRatio,createRenderQuality} from './render-quality-nodes.mjs';
import ShadowNode from 'three/src/nodes/lighting/ShadowNode.js';

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
    quality.setLook('dreamcore');
    assert.equal(report().look,'dreamcore');assert.equal(report().bloom,.65*.65);
    await quality.setMode('high');
    assert.equal(report().shadowSize,2048);assert.equal(report().bloom,.65);
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
    assert.equal(quality.detailScale,1);assert.equal(report().look,'dreamcore');
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
  const disposePost=THREE.PostProcessing.prototype.dispose;
  THREE.PostProcessing.prototype.dispose=function(){graphsDisposed++;return disposePost.call(this);};
  const renderer={getMaxAnisotropy:()=>16,getPixelRatio:()=>ratio,setPixelRatio:value=>ratio=value,
    setDrawingBufferSize:(width,height,value)=>{ratio=value;sizes.push([width,height]);},waitForGPU:()=>new Promise(resolve=>releases.push(resolve))};
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
    THREE.PostProcessing.prototype.dispose=disposePost;
    for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
  }
});
