import test from 'node:test';
import assert from 'node:assert/strict';
import {REVISION} from 'three';
import Renderer from 'three/src/renderers/common/Renderer.js';
import {compileScenePass} from './scene-pass-compilation.mjs';
import {installPrecompileStateRestoration} from './renderer-precompile-state.mjs';

function fixture(){
 const canvas=null,offscreen={name:'other offscreen view'},passTarget={name:'scene pass'},priorMRT={name:'outside MRT'},passMRT={name:'pass MRT'};
 let target=canvas,face=2,mip=3,mrt=priorMRT;
 const renderer={hasInitialized:()=>true,_callDepth:-1,_currentRenderContext:null,_compilationPromises:[],
  getRenderTarget:()=>target,getActiveCubeFace:()=>face,getActiveMipmapLevel:()=>mip,getMRT:()=>mrt,
  setRenderTarget(value,f=0,m=0){target=value;face=f;mip=m;},setMRT(value){mrt=value;}};
 renderer._beginPreCompile=Renderer.prototype._beginPreCompile;renderer._finishPreCompile=Renderer.prototype._finishPreCompile;
 const outside=()=>({target,face,mip,mrt}),assertOutside=value=>assert.deepEqual(outside(),value);
 const pass={setup(){},renderTarget:passTarget,getMRT:()=>passMRT};
 const snapshot=()=>({useFrameBufferTarget:false,renderTarget:target,outputRenderTarget:target,
  activeCubeFace:face,activeMipmapLevel:mip,item:null,mrt,outputMRT:mrt});
 function compile({onYield=()=>{},failure=null,synchronous=false,repairFirst=true}={}){
  renderer.compileAsync=function(){
   if(synchronous)throw failure;
   this._precompilationState=snapshot();
   const material={side:1};
   // Native queue capture forces useFrameBufferTarget on each async work item.
   Renderer.prototype._createObjectPipeline.call(this,{},material,{},{},{},null,null);
   const item=this._compilationPromises.pop();this._precompilationState=null;
   const state=item.precompilationState;state.item=item;
   // Real compileAsync begins its first item synchronously, before awaiting
   // the asynchronous node builder and before the scoped caller's finally.
   this._beginPreCompile(state);
   assert.equal(target,passTarget);assert.equal(mrt,passMRT);assert.equal(this._callDepth,0);
   return Promise.resolve().then(async()=>{
    this._finishPreCompile();
    // Native CompileScheduler restores state before permitting a visible frame.
    await onYield();
    this._beginPreCompile(state);
    assert.equal(target,passTarget);assert.equal(mrt,passMRT);
    this._finishPreCompile();
    if(failure)throw failure;
   });
  };
  if(repairFirst)return compileScenePass(renderer,pass,{},{});
  // Previous scoped submission restored only the live renderer, leaving the
  // first native item's delayed restoration pointed at its compile target.
  const previous=outside();renderer.setRenderTarget(passTarget);renderer.setMRT(passMRT);
  try{return renderer.compileAsync();}
  finally{renderer.setRenderTarget(previous.target,previous.face,previous.mip);renderer.setMRT(previous.mrt);}
 }
 return {renderer,canvas,offscreen,passTarget,priorMRT,passMRT,outside,assertOutside,snapshot,compile};
}

const native={skip:REVISION!=='187'};
test('native r187 queued compilation reproduces the attachment leak and the installer restores canvas after every slice',native,async()=>{
 const baseline=fixture(),prior=baseline.outside(),unpatched=baseline.compile({repairFirst:false});baseline.assertOutside(prior);
 await unpatched;assert.equal(baseline.outside().target,baseline.passTarget,'native queued restoration overrides the synchronous helper restoration');
 const f=fixture(),outside=f.outside(),handle=installPrecompileStateRestoration(f.renderer);
 assert.equal(handle.enabled,true);
 try{
  const work=f.compile({onYield:()=>f.assertOutside(outside)});f.assertOutside(outside);
  await work;f.assertOutside(outside);assert.equal(f.renderer._callDepth,-1);assert.equal(f.renderer._precompilationState,null);
 }finally{handle.dispose();}
});

test('r187 async slices restore an offscreen target and preserve the native compile target, MRT and context',native,async()=>{
 const f=fixture();f.renderer.setRenderTarget(f.offscreen,4,5);const outside=f.outside(),handle=installPrecompileStateRestoration(f.renderer);
 try{
  await f.compile({onYield:()=>f.assertOutside(outside)});f.assertOutside(outside);
  const state={...f.snapshot(),item:{material:{side:2},side:1},useFrameBufferTarget:true,renderTarget:f.passTarget,mrt:f.passMRT,
   outputRenderTarget:f.passTarget,outputMRT:f.passMRT,renderContext:{name:'compile context'}};
  f.renderer._beginPreCompile(state);
  assert.equal(state.renderTarget,f.passTarget);assert.equal(state.mrt,f.passMRT);assert.equal(f.renderer._currentRenderContext,state.renderContext);
  assert.equal(state.item.material.side,1);f.renderer._finishPreCompile();assert.equal(state.item.material.side,2);f.assertOutside(outside);
 }finally{handle.dispose();}
});

test('r187 initial queue submission retains its native snapshot rather than adopting the outside target',native,()=>{
 const f=fixture(),handle=installPrecompileStateRestoration(f.renderer),state=f.snapshot(),captured={...state};
 state.outputRenderTarget=f.passTarget;state.outputMRT=f.passMRT;
 try{
  f.renderer._beginPreCompile(state);assert.equal(state.outputRenderTarget,f.passTarget);assert.equal(state.outputMRT,f.passMRT);
  assert.equal(state.renderTarget,captured.renderTarget);f.renderer._finishPreCompile();
 }finally{handle.dispose();}
});

test('r187 synchronous throws and asynchronous rejection preserve errors, restoration and installer ownership',native,async()=>{
 const f=fixture(),outside=f.outside(),original=f.renderer._beginPreCompile,handle=installPrecompileStateRestoration(f.renderer),hook=f.renderer._beginPreCompile;
 const failure=Error('native compilation failed');
 try{
  assert.throws(()=>f.compile({failure,synchronous:true}),error=>error===failure);f.assertOutside(outside);assert.equal(f.renderer._beginPreCompile,hook);
  await assert.rejects(f.compile({failure,onYield:()=>f.assertOutside(outside)}),error=>error===failure);f.assertOutside(outside);assert.equal(f.renderer._beginPreCompile,hook);
 }finally{handle.dispose();assert.equal(f.renderer._beginPreCompile,original);}
});

test('installer preserves receiver, native result and error, then restores descriptors or leaves later owners inert',()=>{
 for(const replace of [false,true]){
  const result={},failure=Error('native begin'),state={item:{}},calls=[];
  const original=function(...args){calls.push([this,args]);if(args[1]==='throw')throw failure;return result;};
  const renderer=Object.create({_beginPreCompile:original});Object.assign(renderer,{getRenderTarget:()=>null,getActiveCubeFace:()=>2,getActiveMipmapLevel:()=>3,getMRT:()=>null});
  const handle=installPrecompileStateRestoration(renderer,{revision:187});
  assert.equal(renderer._beginPreCompile(state,'arg'),result);assert.equal(calls[0][0],renderer);assert.deepEqual(calls[0][1],[state,'arg']);
  assert.throws(()=>renderer._beginPreCompile(state,'throw'),error=>error===failure);
  const hook=renderer._beginPreCompile,later=function(...args){return hook.apply(this,args);};if(replace)renderer._beginPreCompile=later;
  handle.dispose();handle.dispose();
  if(replace){assert.equal(renderer._beginPreCompile,later);const untouched={item:{}};renderer._beginPreCompile(untouched);assert.deepEqual(untouched,{item:{}});}
  else{assert.equal(renderer._beginPreCompile,original);assert.equal(Object.hasOwn(renderer,'_beginPreCompile'),false);}
 }
 const renderer={_beginPreCompile(){}};Object.defineProperty(renderer,'_beginPreCompile',{enumerable:false});
 const descriptor=Object.getOwnPropertyDescriptor(renderer,'_beginPreCompile'),handle=installPrecompileStateRestoration(renderer,{revision:187});handle.dispose();
 assert.deepEqual(Object.getOwnPropertyDescriptor(renderer,'_beginPreCompile'),descriptor);
});

test('other revisions and renderers without the native lifecycle remain untouched',()=>{
 for(const revision of [180,186,188,'187.1',null]){
  const renderer={_beginPreCompile(){}},original=renderer._beginPreCompile,handle=installPrecompileStateRestoration(renderer,{revision});
  assert.equal(handle.enabled,false);assert.equal(renderer._beginPreCompile,original);handle.dispose();assert.equal(renderer._beginPreCompile,original);
 }
 const handle=installPrecompileStateRestoration({}, {revision:187});assert.equal(handle.enabled,false);handle.dispose();
});
