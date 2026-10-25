import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {qualityPixelRatio,createRenderQuality} from './render-quality-nodes.mjs';

test('WebGPU presets bound pixel cost on ultrawide and high-DPI screens in increasing order',()=>{
  for(const [width,height] of [[3431,1264],[3840,2160],[8000,4000]]){
    let previous=0;
    for(const [mode,budget] of [['balanced',2000000],['high',3000000],['ultra',4000000]]){
      const pixels=width*height*qualityPixelRatio(mode,3,width,height)**2;
      assert.ok(pixels<=budget+.001,`${mode} exceeds its pixel budget`);
      assert.ok(pixels>previous,`${mode} must improve resolution`);
      previous=pixels;
    }
  }
  assert.equal(qualityPixelRatio('balanced',1,1280,720),1);
  assert.equal(qualityPixelRatio('high',3,1000,700),1.7);
  assert.equal(qualityPixelRatio('ultra',1,1280,720),1.5);
});

test('WebGPU switches apply shadows, filtering, creative looks and restore Balanced',async()=>{
  const names=['document','innerWidth','innerHeight','devicePixelRatio'];
  const previous=Object.fromEntries(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  Object.assign(globalThis,{document:{body:{dataset:{}}},innerWidth:3431,innerHeight:1264,devicePixelRatio:2});
  let ratio=1,disposed=0;
  const renderer={getMaxAnisotropy:()=>16,setPixelRatio:value=>ratio=value,getPixelRatio:()=>ratio,setSize(){}};
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),sun=new THREE.DirectionalLight();
  const texture=new THREE.Texture({width:1,height:1});texture.anisotropy=4;
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:texture})));
  sun.shadow.map={dispose(){disposed++;}};
  const quality=createRenderQuality({renderer,scene,camera,sun});
  const report=()=>JSON.parse(document.body.dataset.renderQuality);
  try{
    assert.equal(report().shadowSize,1024);
    assert.equal(disposed,1);
    assert.equal(report().maxPixels,2000000);
    quality.setLook('dreamcore');
    assert.equal(report().look,'dreamcore');assert.equal(report().bloom,.65*.65);
    await quality.setMode('high');
    assert.equal(report().shadowSize,2048);assert.equal(report().bloom,.65);
    assert.equal(texture.anisotropy,4);
    await quality.setMode('ultra');
    assert.equal(report().shadowSize,4096);assert.equal(texture.anisotropy,16);
    assert.equal(quality.detailScale,1.25);
    await quality.setMode('balanced');
    assert.equal(report().shadowSize,1024);assert.equal(texture.anisotropy,4);
    assert.equal(quality.detailScale,1);assert.equal(report().look,'dreamcore');
    await quality.setMode('invalid');assert.equal(quality.mode,'balanced');
    quality.dispose();quality.dispose();
  }finally{
    for(const name of names){if(previous[name])Object.defineProperty(globalThis,name,previous[name]);else delete globalThis[name];}
  }
});
