import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {createSkyEnvironment,createSkyRadiance,SKY_ENVIRONMENT_LUMINANCE,SKY_ENVIRONMENT_SCENE_NAME} from './sky-environment.mjs';
import {SKY_SUN_DIRECTIONS} from './sky-nodes.mjs';

const Y=c=>.2126*c.r+.7152*c.g+.0722*c.b;
function generatorStub(){
  const calls=[];let disposed=0;
  return {calls,get disposed(){return disposed;},create:()=>({fromScene(scene,sigma,near,far,options){
    calls.push({scene,options,colors:scene.children[0].geometry.attributes.color.array.slice()});
    return options.renderTarget??new THREE.RenderTarget(4,4);
  },dispose(){disposed++;}})};
}

test('sky radiance is luminance-normalized, warm toward the sunset sun and dark below the horizon',()=>{
  const color=new THREE.Color();
  for(const mode of ['day','gold','night'])for(const look of ['natural','sakura','aozora','soft-light']){
    const sky=createSkyRadiance({mode,look});let sum=0;
    for(let i=0;i<64;i++)for(let j=0;j<64;j++){const u=(i+.5)/64,phi=(j+.5)/64*Math.PI*2,r=Math.sqrt(u);sum+=Y(sky.sample(new THREE.Vector3(r*Math.cos(phi),Math.sqrt(1-u),r*Math.sin(phi)),color));}
    assert.ok(Math.abs(sum/4096-SKY_ENVIRONMENT_LUMINANCE)/SKY_ENVIRONMENT_LUMINANCE<.03,`${mode}/${look} up-facing irradiance matches the tunable`);
    const [sx,,sz]=SKY_SUN_DIRECTIONS[mode];assert.ok(Y(sky.sample(new THREE.Vector3(0,-1,0),color))<Y(sky.sample(new THREE.Vector3(-sx,4,-sz),new THREE.Color())),'ground bounce stays below the horizon sky');
  }
  const gold=createSkyRadiance({mode:'gold'}),sun=new THREE.Vector3(...SKY_SUN_DIRECTIONS.gold).normalize();
  const toward=gold.sample(sun),away=gold.sample(new THREE.Vector3(-sun.x,sun.y,-sun.z));
  assert.ok(Y(toward)>Y(away)*1.3,'sunset fill is brighter on the sun side');assert.ok(away.r>away.b,'the whole sunset sky stays warm');
  const night=createSkyRadiance({mode:'night'}).sample(new THREE.Vector3(0,1,0));
  assert.ok(night.b>night.r,'night sky light stays cool');
});

test('environment regenerates only on time-of-day, look or ground change, reusing one target',()=>{
  const stub=generatorStub(),sky=createSkyEnvironment({renderer:{},createGenerator:stub.create});
  assert.equal(sky.texture,null);
  assert.equal(sky.update({mode:'day',look:'natural'}),true);
  const texture=sky.texture;assert.ok(texture);assert.equal(stub.calls[0].scene.name,SKY_ENVIRONMENT_SCENE_NAME);
  assert.equal(stub.calls[0].scene.children.length,1,'only the sky dome is captured');
  for(let i=0;i<5;i++)assert.equal(sky.update({mode:'day',look:'natural'}),false);
  assert.equal(sky.update({mode:'invalid',look:'natural'}),false,'unknown modes are daylight');
  assert.equal(stub.calls.length,1);
  sky.update({mode:'gold',look:'natural'});sky.update({mode:'gold',look:'dreamcore'});sky.update({mode:'gold',look:'soft-light'});
  sky.update({mode:'night',look:'soft-light',ground:'#465068'});
  assert.equal(stub.calls.length,4,'dreamcore is the same look as soft-light');
  assert.ok(stub.calls.slice(1).every(call=>call.options.renderTarget?.texture===texture),'later captures refill the same target');
  assert.equal(sky.texture,texture,'scene.environment keeps one texture identity');
  assert.notDeepEqual(stub.calls[0].colors,stub.calls[1].colors);
  assert.equal(sky.stats.generations,4);assert.equal(sky.stats.mode,'night');
  sky.dispose();sky.dispose();assert.equal(stub.disposed,1);assert.equal(sky.texture,null);
  assert.equal(sky.update({mode:'day'}),false,'disposed environments never capture');
});

test('world appearance binds the sky environment, refreshes on time and look only, and restores on dispose',async()=>{
  const {installWorldAppearance}=await import('./world-appearance.mjs');
  const original=THREE.PMREMGenerator.prototype.fromScene,originalDispose=THREE.RenderTarget.prototype.dispose;
  const captures=[],disposed=new Set();
  THREE.PMREMGenerator.prototype.fromScene=function(scene,sigma,near,far,options){captures.push(scene.name);return options?.renderTarget??new THREE.RenderTarget(4,4);};
  THREE.RenderTarget.prototype.dispose=function(){disposed.add(this);return originalDispose.call(this);};
  const renderer={xr:{enabled:false},getMRT:()=>null,getRenderTarget:()=>null,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0};
  const scene=new THREE.Scene(),previous=new THREE.Texture(),hemi=new THREE.HemisphereLight(0xddeeff,0x73755d,1.6),sun=new THREE.DirectionalLight(0xffffff,1.9);scene.environment=previous;scene.environmentIntensity=.8;
  let appearance;
  try{
    appearance=await installWorldAppearance({scene,renderer,camera:new THREE.PerspectiveCamera(),quality:{mode:'balanced',setLook(){}},assembly:{},hemi,sun});
    const environment=scene.environment;
    assert.notEqual(environment,previous);assert.deepEqual(captures,[SKY_ENVIRONMENT_SCENE_NAME]);
    for(let i=0;i<10;i++)appearance.update(i);
    appearance.updateBaseLighting(()=>{});assert.equal(captures.length,1,'frames and base-lighting updates never capture');
    appearance.setTimeOfDay('day');assert.equal(captures.length,1,'unchanged time of day does not capture');
    appearance.updateBaseLighting(()=>{sun.intensity=.34;hemi.intensity=.84;});appearance.setTimeOfDay('night');appearance.setTimeOfDay('night');assert.equal(captures.length,2);
    appearance.setLook('sakura');appearance.setLook('sakura');assert.equal(captures.length,3);
    assert.equal(scene.environment,environment);assert.equal(appearance.stats.environment.mode,'night');
    assert.ok(scene.environmentIntensity<.14,'night keeps the daylight-energy scale');
    appearance.dispose();
    assert.equal(scene.environment,previous);assert.equal(scene.environmentIntensity,.8);
    assert.ok([...disposed].some(target=>target.texture===environment),'the sky target is released');
  }finally{appearance?.dispose();THREE.PMREMGenerator.prototype.fromScene=original;THREE.RenderTarget.prototype.dispose=originalDispose;}
});
