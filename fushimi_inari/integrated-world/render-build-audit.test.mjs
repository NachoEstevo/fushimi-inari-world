import test from 'node:test';
import assert from 'node:assert/strict';
import {installRenderBuildAudit} from './render-build-audit.mjs';
test('build attribution snapshots the actual view and material rather than mutable camera references',()=>{
 const camera={position:{toArray:()=>[1,2,3]},quaternion:{toArray:()=>[0,0,0,1]},far:200,near:.2,fov:45,aspect:2},object={geometry:{type:'IcosahedronGeometry',parameters:{detail:1}},material:{color:{getHexString:()=> '737269'}}};
 const backend={createNodeBuilder(){return {object,camera,build(){}};}},audit=installRenderBuildAudit(backend,{now:()=>0});
 backend.createNodeBuilder(object).build();camera.far=12000;const record=audit.stats.slow[0];assert.equal(record.view.far,200);assert.equal(record.view.aspect,2);assert.deepEqual(record.view.position,[1,2,3]);assert.equal(record.materialColor,'737269');assert.equal(record.geometryDetail,1);audit.dispose();
});
test('build audit preserves receiver, result and arguments while bounding records and restoring ownership',()=>{
 let time=0;const proto={createNodeBuilder(object){assert.equal(this,backend);return {object,build(n){assert.equal(this.object,object);time+=n;return n*2;}};}},backend=Object.create(proto),audit=installRenderBuildAudit(backend,{now:()=>time,limit:2});
 for(const n of [3,12,8])assert.equal(backend.createNodeBuilder({name:`mesh ${n}`,material:{type:'NodeMaterial'}}).build(n),n*2);
 assert.equal(audit.stats.count,3);assert.equal(audit.stats.totalMs,23);assert.deepEqual(audit.stats.slow.map(r=>r.ms),[12,8]);assert.equal(audit.stats.slow[0].startTimeMs,3);audit.reset();assert.equal(audit.stats.count,0);audit.dispose();assert.equal(Object.hasOwn(backend,'createNodeBuilder'),false);
});
test('failed node builds remain observable and keep their original error',()=>{
 const failure=Error('shader failed'),backend={createNodeBuilder(){return {build(){throw failure;}};}},original=backend.createNodeBuilder,audit=installRenderBuildAudit(backend,{now:()=>0});
 assert.throws(()=>backend.createNodeBuilder({}).build(),e=>e===failure);assert.equal(audit.stats.count,1);audit.dispose();assert.equal(backend.createNodeBuilder,original);audit.dispose();
});
test('completed precompile identity survives a measurement reset and exposes a later rebuild',()=>{
 const mesh={uuid:'mesh-a',material:{id:7,version:2}},backend={createNodeBuilder(object){return {object,material:object.material,build(){}};}},audit=installRenderBuildAudit(backend,{now:()=>0});
 audit.noteCompiled([mesh]);audit.reset();backend.createNodeBuilder(mesh).build();assert.equal(audit.stats.buildsAfterPrepared,1);assert.equal(audit.stats.slow[0].objectId,'mesh-a');assert.equal(audit.stats.slow[0].preparedVersion,2);audit.dispose();
});

test('async elapsed time stays separate from CPU builds and retains invocation phase and view',async()=>{
 let time=0,finish,native;
 const object={uuid:'leaves',material:{id:4,version:2}},camera={far:200,position:{toArray:()=>[1,2,3]}};
 const backend={createNodeBuilder(value){return {object:value,camera,build(n){time+=n;return n;},buildAsync(value){
  assert.equal(this.object,object);assert.equal(value,'compile');native=new Promise(resolve=>{finish=resolve;});return native;
 }};}},audit=installRenderBuildAudit(backend,{now:()=>time});
 audit.noteCompiled([object]);audit.setPhase('precompile');const builder=backend.createNodeBuilder(object),pending=builder.buildAsync('compile');
 assert.equal(pending,native);audit.setPhase('render');camera.far=12000;time=30;finish('ready');assert.equal(await pending,'ready');
 const stats=audit.stats;assert.equal(stats.count,0);assert.equal(stats.totalMs,0);assert.equal(stats.async.count,1);assert.equal(stats.async.elapsedMs,30);
 assert.deepEqual(stats.async.phases,{precompile:{count:1,elapsedMs:30}});assert.equal(stats.async.slow[0].view.far,200);
 assert.equal(stats.async.slow[0].phase,'precompile');assert.equal(stats.async.slow[0].elapsedMs,30);assert.equal(stats.async.slow[0].ms,undefined);
 assert.equal(stats.async.buildsAfterPrepared,1);assert.equal(builder.build(3),3);assert.equal(audit.stats.totalMs,3);audit.dispose();
});

test('async delegates to build before and after a yield are recorded once',async()=>{
 let time=0,resume;
 const backend={createNodeBuilder(){return {build(n){time+=n;return n*2;},async buildAsync(n){
  const first=this.build(n);await new Promise(resolve=>{resume=resolve;});return first+this.build(n+1);
 }};}},audit=installRenderBuildAudit(backend,{now:()=>time});
 audit.setPhase('precompile');const pending=backend.createNodeBuilder({}).buildAsync(2);audit.setPhase('render');time+=10;resume();
 assert.equal(await pending,10);assert.equal(audit.stats.count,0);assert.equal(audit.stats.async.count,1);
 assert.equal(audit.stats.async.elapsedMs,15);assert.equal(audit.stats.async.slow[0].phase,'precompile');audit.dispose();
});

test('async rejection and synchronous async-method throws retain the native error',async()=>{
 const failure=new Error('WGSL failed');let time=0;
 const backend={createNodeBuilder(mode){return {build(){throw failure;},buildAsync(){time+=4;if(mode==='throw')throw failure;return Promise.reject(failure);}};}},audit=installRenderBuildAudit(backend,{now:()=>time});
 assert.throws(()=>backend.createNodeBuilder('throw').buildAsync(),error=>error===failure);
 await assert.rejects(backend.createNodeBuilder('reject').buildAsync(),error=>error===failure);
 assert.equal(audit.stats.async.count,2);assert.equal(audit.stats.async.elapsedMs,8);assert.equal(audit.stats.count,0);audit.dispose();
});

test('reset and disposal exclude stale async completion and retain later factory ownership',async()=>{
 let time=0;const finishes=[];
 const backend={createNodeBuilder(){return {build(){},buildAsync(){return new Promise(resolve=>finishes.push(resolve));}};}},audit=installRenderBuildAudit(backend,{now:()=>time});
 const builder=backend.createNodeBuilder({}),first=builder.buildAsync();audit.reset();time=5;finishes.shift()();await first;
 assert.equal(audit.stats.async.count,0);const second=builder.buildAsync();time=9;finishes.shift()();await second;
 assert.equal(audit.stats.async.count,1);assert.equal(audit.stats.async.elapsedMs,4);
 const third=builder.buildAsync(),later=()=>{};backend.createNodeBuilder=later;audit.dispose();time=20;finishes.shift()();await third;
 assert.equal(audit.stats.async.count,1);assert.equal(backend.createNodeBuilder,later);builder.build();assert.equal(audit.stats.count,0);
});

test('async records are bounded and statistics snapshots do not mutate earlier phase totals',async()=>{
 let time=0;const backend={createNodeBuilder(){return {build(){},async buildAsync(n){time+=n;}};}},audit=installRenderBuildAudit(backend,{now:()=>time,limit:2});
 const builder=backend.createNodeBuilder({});await builder.buildAsync(3);const snapshot=audit.stats;
 await builder.buildAsync(12);await builder.buildAsync(8);
 assert.equal(audit.stats.async.count,3);assert.equal(audit.stats.async.elapsedMs,23);
 assert.deepEqual(audit.stats.async.slow.map(record=>record.elapsedMs),[12,8]);assert.equal(snapshot.async.phases.render.elapsedMs,3);audit.dispose();
});

test('a different builder retains CPU timing during pending async work and snapshot overhead is excluded',async()=>{
 let time=0,finish;
 const backend={createNodeBuilder(object){return {object,camera:{position:{toArray(){time+=10;return [0,0,0];}}},
  build(){time+=3;},buildAsync(){return new Promise(resolve=>{finish=resolve;});}};}},audit=installRenderBuildAudit(backend,{now:()=>time});
 const asyncBuilder=backend.createNodeBuilder({}),syncBuilder=backend.createNodeBuilder({});
 const pending=asyncBuilder.buildAsync();syncBuilder.build();assert.equal(audit.stats.count,1);assert.equal(audit.stats.totalMs,3);
 finish();await pending;assert.equal(audit.stats.async.count,1);audit.dispose();
});

test('diagnostic failures and repeated factory results cannot alter native errors or double-count',()=>{
 let failClock=false;
 const failure=new Error('native build'),builder={build(){throw failure;}},backend={createNodeBuilder:()=>builder};
 const audit=installRenderBuildAudit(backend,{now(){if(failClock)throw Error('clock');return 0;}});
 backend.createNodeBuilder({});backend.createNodeBuilder({});assert.throws(()=>builder.build(),error=>error===failure);assert.equal(audit.stats.count,1);
 failClock=true;assert.throws(()=>builder.build(),error=>error===failure);assert.equal(audit.stats.count,1);audit.dispose();
});
