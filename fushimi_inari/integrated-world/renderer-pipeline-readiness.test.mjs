import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installPendingPipelineGuard} from './pending-pipeline-guard.mjs';

// This pins the browser's r180 lifecycle, not shader validation. Only the GPU
// device is deferred; cache publication and pipeline binding use the real engine.
test('r180 pending pipelines skip only their own draw until late GPU completion',
 {skip:THREE.REVISION!=='180'},async()=>{
  const [{default:DataMap},{default:Pipelines},{default:WebGPUPipelineUtils}]=await Promise.all([
   import('three/src/renderers/common/DataMap.js'),
   import('three/src/renderers/common/Pipelines.js'),
   import('three/src/renderers/webgpu/utils/WebGPUPipelineUtils.js')
  ]);
  const backend=new DataMap(),readyHandle={ready:true},otherHandle={alreadyReady:true};
  backend.isWebGPUBackend=true;
  let finish,asyncCreates=0,syncCreates=0,bound=0;
  backend.device={
   createPipelineLayout:()=>({}),
   createRenderPipeline(){syncCreates++;throw Error('unexpected synchronous compilation');},
   createRenderPipelineAsync(){asyncCreates++;return new Promise(resolve=>{finish=()=>resolve(readyHandle);});}
  };
  backend.utils={getPrimitiveTopology:()=> 'triangle-list',getCurrentColorFormat:()=> 'bgra8unorm',
   getCurrentDepthStencilFormat:()=> 'depth24plus',getSampleCountRenderContext:()=>1};
  backend.attributeUtils={createShaderVertexBuffers:()=>[]};
  backend.createProgram=program=>{backend.get(program).module={};};
  backend.needsRenderUpdate=()=>false;backend.getRenderCacheKey=()=> 'walking-view';
  const utils=new WebGPUPipelineUtils(backend),pipelines=new Pipelines(backend,{});
  backend.createRenderPipeline=(object,promises)=>utils.createRenderPipeline(object,promises);
  const geometry=new THREE.PlaneGeometry(),material=new THREE.MeshBasicMaterial({transparent:true,
   blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});
  const object=new THREE.InstancedMesh(geometry,material,8);
  const renderObject={object,geometry,material,context:{textures:null,depth:true,stencil:false},
   getBindings:()=>[],getNodeBuilderState:()=>({vertexShader:'vertex',fragmentShader:'fragment'})};
  const pass={setPipeline(handle){
   if(handle!==readyHandle&&handle!==otherHandle)throw new TypeError('not a GPURenderPipeline');
   bound++;
  }};
  const delegated=[],info={frame:1};
  backend.draw=function(value,renderInfo){
   assert.equal(this,backend);assert.equal(renderInfo,info);
   utils.setPipeline(pass,this.get(value.pipeline).pipeline);delegated.push(value);return 'drawn';
  };
  const originalDraw=backend.draw,promises=[];let guard;
  try{
   const pending=pipelines.getForRender(renderObject,promises);
   assert.equal(asyncCreates,1);assert.equal(promises.length,1);
   assert.equal(pipelines.caches.get(pending.cacheKey),pending);
   assert.equal(backend.get(pending).pipeline,undefined);
   // A normal draw retrieves the same pending cache entry, without compiling
   // a synchronous replacement or waiting for the outstanding GPU promise.
   assert.equal(pipelines.getForRender(renderObject),pending);
   assert.equal(syncCreates,0);assert.equal(asyncCreates,1);
   // The pass already drew another transparent object before this one.
   utils._activePipelines.set(pass,{previous:true});
   assert.throws(()=>utils.setPipeline(pass,backend.get(pending).pipeline),
    {name:'TypeError',message:'not a GPURenderPipeline'});
   assert.equal(bound,0);
   guard=installPendingPipelineGuard(backend);
   assert.equal(backend.draw(renderObject,info),undefined);
   assert.equal(delegated.length,0);assert.equal(bound,0);
   // A second render object is already GPU-ready in the very same pass.
   const otherObject={...renderObject,pipeline:{}};backend.get(otherObject.pipeline).pipeline=otherHandle;
   assert.equal(backend.draw(otherObject,info),'drawn');
   assert.deepEqual(delegated,[otherObject]);assert.equal(bound,1);
   finish();await Promise.all(promises);
   assert.equal(pipelines.getForRender(renderObject),pending);
   assert.equal(backend.get(pending).pipeline,readyHandle);
   assert.equal(backend.draw(renderObject,info),'drawn');
   assert.deepEqual(delegated,[otherObject,renderObject]);
   assert.equal(bound,2);assert.equal(asyncCreates,1);assert.equal(syncCreates,0);
   guard.dispose();assert.equal(backend.draw,originalDraw);
  }finally{
   guard?.dispose();
   finish?.();await Promise.all(promises);
   object.dispose();geometry.dispose();material.dispose();
  }
 });
