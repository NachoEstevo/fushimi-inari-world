import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import RenderContexts from 'three/src/renderers/common/RenderContexts.js';
import {compileScenePass} from './scene-pass-compilation.mjs';

function fixture(){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),scenePass=pass(scene,camera);
 const priorTarget=new THREE.RenderTarget(8,8),priorMRT={id:1001};
 let target=priorTarget,mrt=priorMRT,face=2,mip=3,initialized=true;
 const renderer={samples:4,hasInitialized:()=>initialized,getOutputBufferType:()=>THREE.HalfFloatType,
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getMRT:()=>mrt,
  setRenderTarget(value,f=0,m=0){target=value;face=f;mip=m;},setMRT(value){mrt=value;},getClearDepth:()=>1,getClearStencil:()=>0};
 renderer._renderContexts=new RenderContexts(renderer);
 const restored=()=>{assert.equal(target,priorTarget);assert.equal(mrt,priorMRT);assert.equal(face,2);assert.equal(mip,3);};
 return {renderer,scene,camera,scenePass,restored,setInitialized:value=>initialized=value,dispose(){scenePass.dispose();priorTarget.dispose();}};
}

test('scene pass compiles in the actual nested render context and restores before native completion',async()=>{
 const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get;
 const scope=new THREE.Group(),targetScene=new THREE.Scene();
 let resolve,compiledContext;
 const pending=new Promise(done=>resolve=done);
 renderer.compileAsync=function(...args){
  assert.equal(this,renderer);assert.deepEqual(args,[scope,camera,targetScene]);
  assert.equal(this.getRenderTarget(),scenePass.renderTarget);assert.equal(this.getMRT(),scenePass.getMRT());
  assert.equal(scenePass.renderTarget.samples,4);assert.equal(scenePass.renderTarget.texture.type,THREE.HalfFloatType);
  compiledContext=this._renderContexts.get(this.getRenderTarget(),this.getMRT());
  return pending;
 };
 try{
  const work=compileScenePass(renderer,scenePass,scope,camera,targetScene);assert.equal(work,pending);
  f.restored();assert.equal(contexts.get,original);assert.equal(Object.hasOwn(contexts,'get'),false);
  assert.equal(compiledContext,contexts.get(scenePass.renderTarget,scenePass.getMRT(),1));
  assert.notEqual(compiledContext,contexts.get(scenePass.renderTarget,scenePass.getMRT(),0),'native default context differs from the visible pass');
  // Another compile while the first GPU work is pending owns only its own synchronous scope.
  assert.equal(compileScenePass(renderer,scenePass,scope,camera,targetScene),pending);f.restored();assert.equal(contexts.get,original);
  resolve('compiled');assert.equal(await work,'compiled');f.restored();
 }finally{f.dispose();}
});

test('redirect touches only the pass target and MRT at omitted or zero depth',()=>{
 const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get;
 const otherTarget=new THREE.RenderTarget(4,4),otherMRT={id:2002},passMRT={id:3003};scenePass.setMRT(passMRT);
 renderer.compileAsync=()=>{
  const target=scenePass.renderTarget,mrt=scenePass.getMRT();
  assert.equal(contexts.get(target,mrt),original.call(contexts,target,mrt,1));
  assert.equal(contexts.get(target,mrt,undefined),original.call(contexts,target,mrt,1));
  assert.equal(contexts.get(target,mrt,0),original.call(contexts,target,mrt,1));
  for(const depth of [1,2,-1,null])assert.equal(contexts.get(target,mrt,depth),original.call(contexts,target,mrt,depth));
  assert.equal(contexts.get(otherTarget,mrt),original.call(contexts,otherTarget,mrt,0));
  assert.equal(contexts.get(target,otherMRT),original.call(contexts,target,otherMRT,0));
  assert.equal(contexts.get(null,null),original.call(contexts,null,null,0));
  const other=new RenderContexts(renderer);assert.equal(contexts.get.call(other,target,mrt),original.call(other,target,mrt,0));
  return 'native result';
 };
 try{assert.equal(compileScenePass(renderer,scenePass,scene,camera),'native result');f.restored();assert.equal(contexts.get,original);}
 finally{otherTarget.dispose();f.dispose();}
});

test('synchronous compilation and setup failures preserve state and selector ownership',()=>{
 for(const stage of ['setup','compile']){
  const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get,failure=Error(stage);
  if(stage==='setup')scenePass.setup=()=>{throw failure;};
  renderer.compileAsync=()=>{throw failure;};
  try{assert.throws(()=>compileScenePass(renderer,scenePass,scene,camera),error=>error===failure);f.restored();assert.equal(contexts.get,original);assert.equal(Object.hasOwn(contexts,'get'),false);}
  finally{f.dispose();}
 }
});

test('asynchronous rejection never retains pass state or the temporary selector',async()=>{
 const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get,failure=Error('GPU failed');
 let reject;const pending=new Promise((resolve,fail)=>reject=fail);renderer.compileAsync=()=>pending;
 try{const work=compileScenePass(renderer,scenePass,scene,camera);f.restored();assert.equal(contexts.get,original);reject(failure);await assert.rejects(work,error=>error===failure);f.restored();assert.equal(contexts.get,original);}
 finally{f.dispose();}
});

test('uninitialized renderers are rejected before pass setup or native compilation',async()=>{
 for(const missing of [false,true]){
  const f=fixture(),{renderer,scenePass,scene,camera}=f;f.setInitialized(false);if(missing)delete renderer.hasInitialized;
  scenePass.setup=()=>assert.fail('uninitialized pass setup');renderer.compileAsync=()=>assert.fail('uninitialized native compile');
  try{await assert.rejects(compileScenePass(renderer,scenePass,scene,camera),/Initialize the renderer/);f.restored();}
  finally{f.dispose();}
 }
});

test('unsupported revisions keep their native context selector and target setup',()=>{
 for(const revision of ['180','183','187']){
  const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get;
  renderer.compileAsync=()=>{assert.equal(contexts.get,original);assert.equal(renderer.getRenderTarget(),scenePass.renderTarget);return contexts.get(scenePass.renderTarget,scenePass.getMRT());};
  try{const result=compileScenePass(renderer,scenePass,scene,camera,scene,{revision});assert.equal(result,contexts.get(scenePass.renderTarget,scenePass.getMRT(),0));f.restored();}
  finally{f.dispose();}
 }
});

test('owned selectors restore their descriptor and later wrappers retain an inert captured selector',()=>{
 for(const replace of [false,true]){
  const f=fixture(),{renderer,scenePass,scene,camera}=f,contexts=renderer._renderContexts,original=contexts.get;
  const owned=function(){return original.apply(this,arguments);};Object.defineProperty(contexts,'get',{value:owned,writable:true,configurable:true,enumerable:false});
  const descriptor=Object.getOwnPropertyDescriptor(contexts,'get');let later;
  renderer.compileAsync=()=>{
   if(replace){const temporary=contexts.get;later=function(){return temporary.apply(this,arguments);};contexts.get=later;}
   return Promise.resolve();
  };
  try{
   compileScenePass(renderer,scenePass,scene,camera);f.restored();
   if(replace){assert.equal(contexts.get,later);assert.equal(contexts.get(scenePass.renderTarget,scenePass.getMRT()),original.call(contexts,scenePass.renderTarget,scenePass.getMRT(),0));}
   else assert.deepEqual(Object.getOwnPropertyDescriptor(contexts,'get'),descriptor);
  }finally{f.dispose();}
 }
});
