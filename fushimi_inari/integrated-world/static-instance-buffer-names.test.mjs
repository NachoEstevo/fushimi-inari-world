import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installStaticInstanceBufferNames} from './static-instance-buffer-names.mjs';

for(const revision of [180,186])test(`r${revision} owned static matrix buffers retain stable names and native arguments`,()=>{
 const object={isInstancedMesh:true,instanceMatrix:{array:new Float32Array(32*16),usage:THREE.StaticDrawUsage}},objects=new WeakSet([object]),calls=[],result={};
 const builder={object,getUniformFromNode(...args){calls.push({receiver:this,args});return result;}},backend={isWebGPUBackend:true,createNodeBuilder(...args){assert.equal(this,backend);assert.deepEqual(args,[object,42]);return builder;}};
 const handle=installStaticInstanceBufferNames(backend,{objects,revision}),node={isBufferNode:true,bufferType:'mat4',value:object.instanceMatrix.array},other={...node};
 assert.equal(handle.enabled,true);assert.equal(backend.createNodeBuilder(object,42)===builder,true);
 assert.equal(builder.getUniformFromNode(node,'buffer','vertex',null)===result,true);builder.getUniformFromNode(node,'buffer','fragment');builder.getUniformFromNode(other,'buffer','vertex');
 assert.deepEqual(calls.map(call=>call.args[3]),['fushimiStaticInstanceMatrices0','fushimiStaticInstanceMatrices0','fushimiStaticInstanceMatrices1']);
 assert.ok(calls.every(call=>call.receiver===builder));assert.equal(calls[0].args[0]===node,true);assert.equal(calls[0].args[1],'buffer');handle.dispose();
});

for(const revision of [180,186])test(`r${revision} explicit names reserve identifiers and unrelated buffers stay unchanged`,()=>{
 const array=new Float32Array(16),object={isInstancedMesh:true,instanceMatrix:{array,usage:THREE.StaticDrawUsage}},objects=new WeakSet([object]),calls=[];
 const builder={object,getUniformFromNode(...args){calls.push(args);return args[3];}},backend={isWebGPUBackend:true,createNodeBuilder:()=>builder};
 const handle=installStaticInstanceBufferNames(backend,{objects,revision});backend.createNodeBuilder();const matrix={isBufferNode:true,bufferType:'mat4',value:array};
 builder.getUniformFromNode({...matrix,value:new Float32Array(16)},'buffer','vertex','fushimiStaticInstanceMatrices0');
 assert.equal(builder.getUniformFromNode(matrix,'buffer','vertex'),'fushimiStaticInstanceMatrices1');
 for(const [node,type,name]of [[matrix,'buffer','authored'],[{...matrix,bufferType:'vec4'},'buffer',undefined],[{...matrix,value:new Float32Array(16)},'buffer',undefined],[{...matrix,isBufferNode:false},'buffer',undefined],[matrix,'storageBuffer',undefined]]){
  builder.getUniformFromNode(node,type,'vertex',name);assert.equal(calls.at(-1)[3],name);
 }
 object.instanceMatrix.usage=THREE.DynamicDrawUsage;builder.getUniformFromNode({...matrix},'buffer','vertex');assert.equal(calls.at(-1)[3],undefined);
 object.instanceMatrix.usage=THREE.StaticDrawUsage;objects.delete(object);builder.getUniformFromNode({...matrix},'buffer','vertex');assert.equal(calls.at(-1)[3],undefined);handle.dispose();
});

test('factory disposal preserves ownership and unsupported runtimes never install hooks',()=>{
 const original=()=>({getUniformFromNode(){}}),prototype={createNodeBuilder:original},backend=Object.assign(Object.create(prototype),{isWebGPUBackend:true}),objects=new WeakSet();
 const handle=installStaticInstanceBufferNames(backend,{objects,revision:180});assert.equal(Object.hasOwn(backend,'createNodeBuilder'),true);handle.dispose();handle.dispose();assert.equal(Object.hasOwn(backend,'createNodeBuilder'),false);
 const next=installStaticInstanceBufferNames(backend,{objects,revision:180}),later=()=>{};backend.createNodeBuilder=later;next.dispose();assert.equal(backend.createNodeBuilder===later,true);
 for(const [candidate,revision]of [[{isWebGPUBackend:false,createNodeBuilder:original},180],...[179,181,182,183,184,185,187,'186.1',null].map(revision=>[{isWebGPUBackend:true,createNodeBuilder:original},revision])]){
  const before=candidate.createNodeBuilder,unsupported=installStaticInstanceBufferNames(candidate,{objects,revision});assert.equal(unsupported.enabled,false);assert.equal(candidate.createNodeBuilder===before,true);unsupported.dispose();
 }
});

test('preexisting stage declarations are reserved and disposed builder wrappers preserve native errors and names',()=>{
 const object={isInstancedMesh:true,instanceMatrix:{array:new Float32Array(16),usage:THREE.StaticDrawUsage}},objects=new WeakSet([object]),error=new Error('native uniform failure');
 const declaration={node:{}},builder={object,shaderStage:'vertex',declarations:{vertex:{fushimiStaticInstanceMatrices0:declaration}},getUniformFromNode(node,type,stage,name){if(node.fail)throw error;return name;}};
 const original=()=>builder,backend={isWebGPUBackend:true,createNodeBuilder:original},handle=installStaticInstanceBufferNames(backend,{objects,revision:180});backend.createNodeBuilder();
 const matrix={isBufferNode:true,bufferType:'mat4',value:object.instanceMatrix.array};
 assert.equal(builder.getUniformFromNode(matrix,'buffer','vertex'),'fushimiStaticInstanceMatrices1');assert.equal(builder.declarations.vertex.fushimiStaticInstanceMatrices0===declaration,true);
 assert.throws(()=>builder.getUniformFromNode({...matrix,fail:true},'buffer','vertex'),caught=>caught===error);
 const renamed=handle.stats.renamed;handle.dispose();assert.equal(backend.createNodeBuilder===original,true);assert.equal(Object.hasOwn(backend,'createNodeBuilder'),true);
 assert.equal(builder.getUniformFromNode({...matrix},'buffer','vertex'),undefined);assert.equal(handle.stats.renamed,renamed);
});

test(`real r${THREE.REVISION} WGSL uniforms share declarations with independent buffers`,{skip:!['180','186'].includes(THREE.REVISION)},async()=>{
 const [{default:WGSLNodeBuilder},{default:BufferNode}]=await Promise.all([import('three/src/renderers/webgpu/nodes/WGSLNodeBuilder.js'),import('three/src/nodes/accessors/BufferNode.js')]);
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),a=new THREE.InstancedMesh(geometry,material,64),b=new THREE.InstancedMesh(geometry,material,64);b.count=43;
 const objects=new WeakSet([a,b]),backend={isWebGPUBackend:true,createNodeBuilder:object=>new WGSLNodeBuilder(object,{debug:{diagnostics:{keywords:true}}})};
 const plainA=backend.createNodeBuilder(a),plainB=backend.createNodeBuilder(b);plainA.getUniformFromNode(new BufferNode(a.instanceMatrix.array,'mat4',64),'buffer','vertex');plainB.getUniformFromNode(new BufferNode(b.instanceMatrix.array,'mat4',64),'buffer','vertex');
 assert.notEqual(plainA.getUniforms('vertex'),plainB.getUniforms('vertex'));
 const handle=installStaticInstanceBufferNames(backend,{objects}),ba=backend.createNodeBuilder(a),bb=backend.createNodeBuilder(b);
 const ua=ba.getUniformFromNode(new BufferNode(a.instanceMatrix.array,'mat4',64),'buffer','vertex'),ub=bb.getUniformFromNode(new BufferNode(b.instanceMatrix.array,'mat4',64),'buffer','vertex');
 assert.notEqual(ua.id,ub.id);assert.equal(ua.name,ub.name);assert.equal(ba.getUniforms('vertex'),bb.getUniforms('vertex'));
 const bindingA=ba.bindings.vertex.object[0],bindingB=bb.bindings.vertex.object[0];assert.equal(bindingA.buffer===a.instanceMatrix.array,true);assert.equal(bindingB.buffer===b.instanceMatrix.array,true);assert.equal(bindingA.buffer!==bindingB.buffer,true);
 assert.equal(bindingA.visibility,bindingB.visibility);assert.equal(ba.bindings.vertex.object.length,1);assert.equal(bb.bindings.vertex.object.length,1);assert.equal(a.count,64);assert.equal(b.count,43);
 handle.dispose();a.dispose();b.dispose();geometry.dispose();material.dispose();
});

test(`real r${THREE.REVISION} explicit buffer declarations reserve their .value names`,{skip:!['180','186'].includes(THREE.REVISION)},async()=>{
 const [{default:WGSLNodeBuilder},{default:BufferNode}]=await Promise.all([import('three/src/renderers/webgpu/nodes/WGSLNodeBuilder.js'),import('three/src/nodes/accessors/BufferNode.js')]);
 const geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),object=new THREE.InstancedMesh(geometry,material,32),objects=new WeakSet([object]),foreign=new Float32Array(16);
 const backend={isWebGPUBackend:true,createNodeBuilder(value){
  const builder=new WGSLNodeBuilder(value,{debug:{diagnostics:{keywords:true}}});builder.shaderStage='vertex';
  builder.getUniformFromNode(new BufferNode(foreign,'mat4',1),'buffer','vertex','fushimiStaticInstanceMatrices0');return builder;
 }};
 const handle=installStaticInstanceBufferNames(backend,{objects}),builder=backend.createNodeBuilder(object);
 assert.ok(builder.declarations.vertex['fushimiStaticInstanceMatrices0.value']);
 const uniform=builder.getUniformFromNode(new BufferNode(object.instanceMatrix.array,'mat4',32),'buffer','vertex');
 assert.equal(uniform.name,'fushimiStaticInstanceMatrices1');assert.equal(builder.bindings.vertex.object.length,2);
 assert.equal(builder.bindings.vertex.object[0].buffer===foreign,true);assert.equal(builder.bindings.vertex.object[1].buffer===object.instanceMatrix.array,true);
 handle.dispose();object.dispose();geometry.dispose();material.dispose();
});
