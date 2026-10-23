import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWaterAppearance} from './water-appearance.mjs';
import {captureShinikeEnvironment,installShinikeReflections} from './shinike-reflections.mjs';

function fixture(){
  const scene=new THREE.Scene(),water=new THREE.Mesh(new THREE.PlaneGeometry(40,70).rotateX(-Math.PI/2),createWaterAppearance({kind:'shinike'}));
  water.position.set(550,65,-110);scene.add(water);
  return {scene,water,renderer:{},forestChunks:[],overlays:()=>[]};
}

// Runs the installed CubeCamera and PMREM control flow without a GPU.
function pmremRenderer(failDraw=null){
  const original={name:'viewer target'},viewport=new THREE.Vector4(0,0,800,600);
  const state={active:original,face:3,mip:1,draws:0,targets:new Map(),output:null};
  const renderer={coordinateSystem:THREE.WebGLCoordinateSystem,autoClear:true,xr:{enabled:true},shadowMap:{autoUpdate:true,needsUpdate:false},
    compile(){},getRenderTarget:()=>state.active,getActiveCubeFace:()=>state.face,getActiveMipmapLevel:()=>state.mip,
    getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(viewport),getScissorTest:()=>false,
    setRenderTarget(target,face=0,mip=0){
      state.active=target;state.face=face;state.mip=mip;
      if(target?.isWebGLRenderTarget&&!state.targets.has(target)){
        const ownership={disposed:0};state.targets.set(target,ownership);
        target.addEventListener('dispose',()=>{ownership.disposed++;});
        if(!target.isWebGLCubeRenderTarget&&!state.output)state.output=target;
      }
    },
    setViewport(){},setScissor(){},setScissorTest(){},
    render(){state.draws++;if(state.draws===failDraw)throw Error('PMREM blur failure');}};
  return {renderer,state,original};
}
test('local pond capture is deferred until nearby and reused across frames, travel and time',()=>{
  const f=fixture(),targets=[],capture=()=>{const t={texture:new THREE.Texture(),disposed:0,dispose(){this.disposed++;}};targets.push(t);return t;};
  const c=installShinikeReflections(f,capture),near=new THREE.Vector3(545,68,-120),far=new THREE.Vector3(0,40,0);
  c.update(far,'day:spring');assert.equal(targets.length,0);
  for(let i=0;i<100;i++)c.update(near,'day:spring');assert.equal(targets.length,1);
  c.update(far,'night:spring');assert.equal(targets.length,1);
  c.update(near,'night:spring');assert.equal(targets.length,2);assert.equal(targets[0].disposed,1);
  c.update(near,'night:autumn');assert.equal(targets.length,3);assert.equal(f.water.material.envMap,targets[2].texture);
  c.dispose();c.dispose();assert.equal(targets[2].disposed,1);assert.equal(f.water.material.envMap,null);
  c.update(near,'day:autumn');assert.equal(targets.length,3);
});
test('failed appearance refresh retains the last usable reflection and does not retry every frame',()=>{
  const f=fixture(),old=new THREE.Texture();f.water.material.envMap=old;f.water.material.envMapIntensity=.4;
  let calls=0;const valid={texture:new THREE.Texture(),disposed:0,dispose(){this.disposed++;}};
  const c=installShinikeReflections(f,()=>{if(calls++===0)return valid;throw Error('GPU unavailable');}),near=new THREE.Vector3(550,68,-110);
  c.update(near,'day');for(let i=0;i<100;i++)c.update(near,'night');assert.equal(calls,2);
  assert.equal(f.water.material.envMap,valid.texture);assert.equal(valid.disposed,0);assert.equal(c.stats.error,'GPU unavailable');
  c.dispose();assert.equal(f.water.material.envMap,old);assert.equal(f.water.material.envMapIntensity,.4);assert.equal(valid.disposed,1);
});
test('a failure on a real CubeCamera face restores viewer target, visibility, XR and shadow state',()=>{
  const f=fixture(),overlay=new THREE.Group(),visitor=new THREE.Group(),flash=new THREE.SpotLight(),tree=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial());
  visitor.name='Visitor 1 · initial';flash.name='Visitor flashlight';tree.visible=false;f.scene.add(overlay,visitor,flash,tree);
  const original={name:'main target'},viewport=new THREE.Vector4(3,4,800,600),scissor=new THREE.Vector4(5,6,400,300);
  let active=original,face=2,mip=1,draws=0,disposed=false;
  const renderer={coordinateSystem:THREE.WebGLCoordinateSystem,xr:{enabled:true},shadowMap:{autoUpdate:true,needsUpdate:true},
    compile(){},getRenderTarget:()=>active,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,
    getViewport:v=>v.copy(viewport),getScissor:v=>v.copy(scissor),getScissorTest:()=>true,
    setRenderTarget(t,f=0,m=0){active=t;face=f;mip=m;if(t?.isWebGLCubeRenderTarget)t.addEventListener('dispose',()=>{disposed=true;});},
    setViewport(v){assert.deepEqual(v.toArray(),viewport.toArray());},setScissor(v){assert.deepEqual(v.toArray(),scissor.toArray());},setScissorTest(v){assert.equal(v,true);},
    render(scene,camera){draws++;assert.equal(camera.far,12000);assert.equal(f.water.visible,false);assert.equal(overlay.visible,false);assert.equal(visitor.visible,false);assert.equal(flash.visible,false);assert.equal(tree.visible,true);assert.equal(this.shadowMap.autoUpdate,false);if(draws===2)throw Error('face failure');}};
  assert.throws(()=>captureShinikeEnvironment({scene:f.scene,renderer,center:new THREE.Vector3(550,65.12,-110),forestChunks:[{object:tree,bounds:new THREE.Sphere(new THREE.Vector3(550,70,-110),5)}],overlays:()=>[overlay]}),/face failure/);
  assert.equal(active,original);assert.equal(face,2);assert.equal(mip,1);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(renderer.shadowMap.needsUpdate,true);
  for(const o of [f.water,overlay,visitor,flash])assert.equal(o.visible,true);assert.equal(tree.visible,false);assert.equal(disposed,true);
});

test('actual PMREM blur failure restores autoClear and releases its unpublished output target',()=>{
  const f=fixture(),{renderer,state,original}=pmremRenderer(8),setTarget=renderer.setRenderTarget;
  assert.throws(()=>captureShinikeEnvironment({scene:f.scene,renderer,center:new THREE.Vector3(550,65.12,-110),forestChunks:[],overlays:()=>[]}),/PMREM blur failure/);
  assert.equal(state.draws,8,'six real cube faces and conversion succeed before the failing PMREM blur');
  assert.equal(state.active,original);assert.equal(state.face,3);assert.equal(state.mip,1);assert.equal(renderer.setRenderTarget,setTarget);
  assert.equal(f.water.visible,true);assert.equal(renderer.xr.enabled,true);
  assert.ok(state.output,'real PMREM conversion allocated an output target');
  assert.deepEqual({autoClear:renderer.autoClear,outputDisposed:state.targets.get(state.output).disposed},{autoClear:true,outputDisposed:1},'restore main-frame clearing and dispose the output never published to a material');
});

test('successful real PMREM capture transfers only its output to the caller and disposes temporary cube and scratch',()=>{
  const f=fixture(),{renderer,state,original}=pmremRenderer(),setTarget=renderer.setRenderTarget;
  const output=captureShinikeEnvironment({scene:f.scene,renderer,center:new THREE.Vector3(550,65.12,-110),forestChunks:[],overlays:()=>[]});
  assert.equal(output,state.output);assert.equal(output.texture.mapping,THREE.CubeUVReflectionMapping);
  assert.ok(state.draws>8,'success traverses real cube conversion and all PMREM blur draws');
  assert.equal(state.active,original);assert.equal(state.face,3);assert.equal(state.mip,1);
  assert.equal(renderer.setRenderTarget,setTarget);assert.equal(renderer.autoClear,true);assert.equal(renderer.xr.enabled,true);assert.equal(f.water.visible,true);
  assert.equal(state.targets.get(output).disposed,0,'returned environment stays live for its caller');
  const temporary=[...state.targets].filter(([target])=>target!==output);
  assert.equal(temporary.length,2,'one cube target and one PMREM scratch target');
  assert.ok(temporary.every(([,ownership])=>ownership.disposed===1));
  output.dispose();assert.equal(state.targets.get(output).disposed,1,'caller owns final environment disposal');
});
