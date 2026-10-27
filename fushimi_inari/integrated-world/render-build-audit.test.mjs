import test from 'node:test';
import assert from 'node:assert/strict';
import {installRenderBuildAudit} from './render-build-audit.mjs';
test('build audit preserves receiver, result and arguments while bounding records and restoring ownership',()=>{
 let time=0;const proto={createNodeBuilder(object){assert.equal(this,backend);return {object,build(n){assert.equal(this.object,object);time+=n;return n*2;}};}},backend=Object.create(proto),audit=installRenderBuildAudit(backend,{now:()=>time,limit:2});
 for(const n of [3,12,8])assert.equal(backend.createNodeBuilder({name:`mesh ${n}`,material:{type:'NodeMaterial'}}).build(n),n*2);
 assert.equal(audit.stats.count,3);assert.equal(audit.stats.totalMs,23);assert.deepEqual(audit.stats.slow.map(r=>r.ms),[12,8]);audit.reset();assert.equal(audit.stats.count,0);audit.dispose();assert.equal(Object.hasOwn(backend,'createNodeBuilder'),false);
});
test('failed node builds remain observable and keep their original error',()=>{
 const failure=Error('shader failed'),backend={createNodeBuilder(){return {build(){throw failure;}};}},original=backend.createNodeBuilder,audit=installRenderBuildAudit(backend,{now:()=>0});
 assert.throws(()=>backend.createNodeBuilder({}).build(),e=>e===failure);assert.equal(audit.stats.count,1);audit.dispose();assert.equal(backend.createNodeBuilder,original);audit.dispose();
});
test('completed precompile identity survives a measurement reset and exposes a later rebuild',()=>{
 const mesh={uuid:'mesh-a',material:{id:7,version:2}},backend={createNodeBuilder(object){return {object,material:object.material,build(){}};}},audit=installRenderBuildAudit(backend,{now:()=>0});
 audit.noteCompiled([mesh]);audit.reset();backend.createNodeBuilder(mesh).build();assert.equal(audit.stats.buildsAfterPrepared,1);assert.equal(audit.stats.slow[0].objectId,'mesh-a');assert.equal(audit.stats.slow[0].preparedVersion,2);audit.dispose();
});
