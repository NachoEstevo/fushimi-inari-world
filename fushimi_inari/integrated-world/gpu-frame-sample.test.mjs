import test from 'node:test';
import assert from 'node:assert/strict';
import {createGpuFrameSample} from './gpu-frame-sample.mjs';

function fixture(){
 const pool={frames:[],queryOffsets:new Map(),timestamps:new Map()};
 const original=function(){assert.equal(this,inspector);};
 const inspector=Object.create({beginRender:original});
 const backend={isWebGPUBackend:true,trackTimestamp:true,timestampQueryPool:{render:pool}};
 let resolve;
 const renderer={inspector,backend,resolveTimestampsAsync(){assert.ok(backend.trackTimestamp);return new Promise(r=>resolve=r);}};
 const audit=createGpuFrameSample(renderer);
 function pass(uid,name,target){
  pool.queryOffsets.set(uid,pool.queryOffsets.size*2);
  inspector.beginRender(uid,{name},{},target?{texture:{name:target}}:null);
 }
 async function publish(values,{fresh=true}={}){
  if(fresh){pool.frames=[1];pool.timestamps=new Map(values);}
  pool.queryOffsets.clear();resolve(999);await new Promise(r=>setImmediate(r));
 }
 return {audit,backend,inspector,original,renderer,pass,publish};
}

test('r187 sampled pass IDs retain names and individual distributions, without a displayed-frame sum',async()=>{
 const f=fixture(),a='r:1:4:f1',b='r:2:5:f1',c='r:1:4:f2',d='r:2:5:f2';
 f.audit.begin(0);f.pass(a,'World','output');f.pass(b,'Bloom [ Blur Horizontal - 0 ]','UnrealBloomPass.h0');f.audit.end();
 assert.equal(f.backend.trackTimestamp,false);assert.equal(f.inspector.beginRender,f.original);assert.equal(Object.hasOwn(f.inspector,'beginRender'),false);
 f.audit.begin(260);assert.equal(f.backend.trackTimestamp,false,'readbacks cannot overlap');
 await f.publish([[a,7],[b,6],['r:99:7:f0',1200]]);
 f.audit.begin(200);assert.equal(f.backend.trackTimestamp,false,'quarter-second cadence');
 f.audit.begin(270);f.pass(c,'World','output');f.pass(d,'Bloom [ Blur Horizontal - 0 ]','UnrealBloomPass.h0');f.audit.end();
 await f.publish([[c,5],[d,0]]);
 const {count,measurement,passes,...stats}=f.audit.stats;
 assert.equal(measurement,'individual-render-pass');assert.equal(count,2);assert.equal(stats.rejected,0);
 assert.equal(stats.p95Ms,undefined);assert.equal(passes.length,2);
 assert.deepEqual(passes[0],{name:'World',target:'output',contextId:'4',count:2,p50Ms:5,p95Ms:7,maxMs:7});
 assert.equal(passes[1].p50Ms,0);assert.equal(passes[1].maxMs,6);
});

test('reset, stale resolves and invalid timestamps cannot republish earlier GPU samples',async()=>{
 const f=fixture(),uid='r:1:3:f5';
 f.audit.begin(1);f.pass(uid,'Scene');f.audit.end();f.audit.reset();await f.publish([[uid,4]]);
 assert.equal(f.audit.stats.count,0);
 f.audit.begin(251);f.pass(uid,'Scene');f.audit.end();await f.publish([],{fresh:false});
 assert.equal(f.audit.stats.rejected,1);assert.equal(f.audit.stats.count,0);
 f.audit.begin(501);f.pass(uid,'Scene');f.audit.end();await f.publish([[uid,-4]]);
 assert.equal(f.audit.stats.invalidPasses,1);assert.equal(f.audit.stats.rejected,2);
 f.renderer.resolveTimestampsAsync=()=>{throw Error('device lost');};
 f.audit.begin(751);f.pass(uid,'Scene');assert.doesNotThrow(()=>f.audit.end());assert.equal(f.backend.trackTimestamp,false);
 assert.equal(f.audit.stats.rejected,3);
});

test('unsupported backends perform no query work',()=>{
 const backend={isWebGPUBackend:false,trackTimestamp:true};
 const audit=createGpuFrameSample({backend});audit.begin(0);audit.end();
 assert.equal(backend.trackTimestamp,false);assert.equal(audit.stats.supported,false);assert.deepEqual(audit.stats.passes,[]);
});

test('pinned Three.js pool preserves both individually overlapping hardware intervals', async (t) => {
 const {default: WebGPUTimestampQueryPool} = await import('three-runtime/src/renderers/webgpu/utils/WebGPUTimestampQueryPool.js');
 // Two synthetic hardware intervals overlap by 4 ms. Exercise r187's actual
 // query allocation, buffer decoding, frame grouping and map publication.
 const intervals = new BigUint64Array([0n, 7000000n, 3000000n, 9000000n]);
 const command = {resolveQuerySet() {}, copyBufferToBuffer() {}, finish() { return {}; }};
 const device = {
  createQuerySet() { return {}; },
  createCommandEncoder() { return command; },
  createBuffer() { return {
   mapState: 'unmapped', async mapAsync() { this.mapState = 'mapped'; },
   getMappedRange() { return intervals.buffer; }, unmap() { this.mapState = 'unmapped'; }
  }; },
  queue: { submit() {} }
 };
 for (const [name, value] of Object.entries({
  GPUBufferUsage: {QUERY_RESOLVE: 1, COPY_SRC: 2, COPY_DST: 4, MAP_READ: 8},
  GPUMapMode: {READ: 1}
 })) {
  if (!(name in globalThis)) {
   globalThis[name] = value;
   t.after(() => { delete globalThis[name]; });
  }
 }
 const pool = new WebGPUTimestampQueryPool(device, 'render', 4);
 const inspector = {beginRender() {}};
 const backend = {isWebGPUBackend: true, trackTimestamp: true, timestampQueryPool: {render: pool}};
 const audit = createGpuFrameSample({inspector, backend, resolveTimestampsAsync: () => pool.resolveQueriesAsync()});
 audit.begin(0);
 for (const [uid, name] of [['r:1:2:f1','World'], ['r:2:3:f1','Bloom']]) {
  inspector.beginRender(uid, {name}, {}, null);
  pool.allocateQueriesForContext(uid);
 }
 audit.end();
 await new Promise(r => setImmediate(r));
 assert.equal(pool.lastValue, 13, 'the r187 cumulative duration double counts the overlap');
 assert.deepEqual(audit.stats.passes.map(({name, p50Ms}) => [name, p50Ms]), [['World', 7], ['Bloom', 6]]);
 assert.equal(audit.stats.maxMs, undefined);
});
