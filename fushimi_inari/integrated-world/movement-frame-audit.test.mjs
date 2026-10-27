import test from 'node:test';
import assert from 'node:assert/strict';
import {installMovementFrameAudit} from './movement-frame-audit.mjs';

function documentStub(){
 const listeners=new Map(),body={dataset:{},children:[],append(child){this.children.push(child);}};
 return {body,hidden:false,listeners,addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);},dispatch(type){listeners.get(type)?.();},createElement(){return {children:[],handlers:new Map(),append(child){this.children.push(child);},addEventListener(type,fn){this.handlers.set(type,fn);},remove(){this.removed=true;}};}};
}
const camera=()=>({position:{x:0,y:1.7,z:0},quaternion:{x:0,y:0,z:0,w:1}});
function fixture(options={}){
 const previous=globalThis.document,document=documentStub();globalThis.document=document;
 const c=camera(),audit=installMovementFrameAudit({camera:c,...options});
 return {camera:c,audit,document,state:()=>JSON.parse(document.body.dataset.movementFrameAudit),cleanup(){audit.dispose();if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}};
}

test('measurement start resets diagnostic history once per real recording before capturing context',()=>{
 let generation=0;const f=fixture({onStart:()=>generation++,getContext:()=>({generation})});try{
  f.audit.run();assert.equal(generation,1);f.audit.run();assert.equal(generation,1);
  f.audit.afterRender(0,0);f.audit.afterRender(16000,1);assert.equal(f.state().result.contextStart.generation,1);
  f.audit.run();assert.equal(generation,2);f.audit.dispose();f.audit.run();assert.equal(generation,2);
 }finally{f.cleanup();}
});

test('an explicit bounded long recording keeps monitoring beyond the default sixteen seconds',()=>{
 const f=fixture({durationMs:60000});try{
  assert.equal(f.document.body.children[0].children[0].textContent,'Record movement 60s');
  f.audit.run();f.audit.afterRender(0,0);f.audit.afterRender(16000,1);assert.equal(f.audit.active,true);
  f.audit.afterRender(60000,2);assert.equal(f.state().result.duration,60);assert.equal(f.state().phase,'complete');
 }finally{f.cleanup();}
});

test('records normal movement for sixteen RAF seconds without changing the camera',()=>{
 let context=1;const f=fixture({getContext:()=>({context})});
 try{
  const section=f.document.body.children[0],button=section.children[0];
  assert.equal(button.textContent,'Record movement 16s');button.handlers.get('click')();assert.equal(f.audit.active,true);
  const initial=JSON.parse(JSON.stringify(f.camera));f.audit.afterRender(100,999,999);assert.deepEqual(f.camera,initial);
  f.camera.position.x=3;f.camera.quaternion.y=Math.SQRT1_2;f.camera.quaternion.w=Math.SQRT1_2;context=2;
  f.audit.afterRender(8100,2,1);assert.equal(f.audit.active,true);
  f.camera.position.z=4;f.camera.quaternion.y=1;f.camera.quaternion.w=0;f.audit.afterRender(16100,6,3);
  const {phase,result:r,error}=f.state();assert.equal(phase,'complete');assert.equal(error,null);assert.equal(f.audit.active,false);
  assert.equal(r.duration,16);assert.equal(r.elapsedMs,16000);assert.equal(r.frameCount,2);assert.equal(r.sampleCount,2);
  assert.equal(r.p50,8000);assert.equal(r.p95,8000);assert.equal(r.p99,8000);assert.equal(r.worst,8000);assert.equal(r.fps,.125);
  assert.equal(r.updateSum,4);assert.equal(r.updateMean,2);assert.equal(r.updateMax,3);assert.equal(r.submitSum,8);assert.equal(r.submitMean,4);assert.equal(r.submitMax,6);
  assert.equal(r.distanceWalked,7);assert.ok(Math.abs(r.angularCumulativeRadians-Math.PI)<1e-12);
  assert.deepEqual(r.firstPose,{position:[0,1.7,0],rotation:[0,0,0,1]});assert.deepEqual(r.lastPose,{position:[3,1.7,4],rotation:[0,1,0,0]});
  assert.deepEqual(r.contextStart,{context:1});assert.deepEqual(r.contextEnd,{context:2});assert.match(r.timing,/CPU/);assert.match(r.timing,/GPU.*not measured/);
 }finally{f.cleanup();}
});

test('bounds samples and slow frames while retaining full-run aggregates and movement',()=>{
 const f=fixture();try{
  f.audit.run();f.audit.afterRender(0,0);
  for(let time=1;time<=16000;time++){f.camera.position.x=time;f.audit.afterRender(time,time===15999?100:2,1);}
  const r=f.state().result;assert.equal(r.frameCount,16000);assert.equal(r.sampleCount,10000);assert.equal(r.samplesTruncated,true);assert.equal(r.slowFrames.length,20);
  assert.equal(r.submitMax,100);assert.equal(r.updateSum,16000);assert.equal(r.distanceWalked,16000);assert.equal(r.angularCumulativeRadians,0);assert.equal(r.firstPose.position[0],0);assert.equal(r.lastPose.position[0],16000);
 }finally{f.cleanup();}
});

test('keeps the twenty largest frame gaps and their measured CPU costs',()=>{
 const f=fixture();try{
  f.audit.run();let time=0;f.audit.afterRender(time,0);
  for(let gap=1;gap<=30;gap++){time+=gap;f.audit.afterRender(time,gap*2,gap*3);}
  f.audit.afterRender(16000,4,5);const r=f.state().result;
  assert.equal(r.slowFrames.length,20);assert.equal(r.slowFrames[0].gap,16000-time);assert.deepEqual(r.slowFrames[1],{elapsedMs:time,gap:30,submitMs:60,updateMs:90});assert.equal(r.worst,16000-time);
 }finally{f.cleanup();}
});

test('keeps the twenty most CPU-intensive frames even when their preceding gaps are short',()=>{
 const f=fixture();try{
  f.audit.run();f.audit.afterRender(0,0);for(let i=1;i<=30;i++)f.audit.afterRender(i*8,i===1?60:i,i===1?10:0);
  f.audit.afterRender(16000,0,0);const r=f.state().result;
  assert.equal(r.slowCpuFrames.length,20);assert.deepEqual(r.slowCpuFrames[0],{elapsedMs:8,gap:8,submitMs:60,updateMs:10});
  assert.equal(r.slowCpuFrames.at(-1).submitMs,12);assert.equal(r.slowFrames[0].gap,15760);
 }finally{f.cleanup();}
});

test('visibility changes abort recording without waiting for a RAF',()=>{
 const f=fixture();try{
  f.audit.run();f.audit.afterRender(0,1);f.document.hidden=true;f.document.dispatch('visibilitychange');
  assert.equal(f.audit.active,false);assert.equal(f.state().phase,'aborted');assert.match(f.state().error,/visible document/);assert.equal(f.state().result,null);
  f.audit.run();assert.equal(f.audit.active,false);assert.equal(f.state().phase,'error');
  f.document.hidden=false;f.audit.run();f.audit.afterRender(10,1);f.document.hidden=true;f.audit.afterRender(20,1);assert.equal(f.state().phase,'aborted');
 }finally{f.cleanup();}
});

test('rejects invalid timing, camera and context data and can start a fresh recording',()=>{
 for(const invalid of [f=>f.audit.afterRender(NaN,1),f=>f.audit.afterRender(1,-1),f=>f.audit.afterRender(1,1,Infinity),f=>{f.camera.position.x=NaN;f.audit.afterRender(1,1);}]){
  const f=fixture();try{f.audit.run();invalid(f);assert.equal(f.state().phase,'error');assert.equal(f.audit.active,false);assert.equal(f.state().result,null);}finally{f.cleanup();}
 }
 const f=fixture({getContext:()=>{throw Error('context failed');}});try{f.audit.run();f.audit.afterRender(0,1);assert.equal(f.state().error,'context failed');}finally{f.cleanup();}
});

test('duplicate start preserves the recording and dispose aborts and removes listeners and UI',()=>{
 const f=fixture();try{
  f.audit.run();f.audit.afterRender(100,1);f.camera.position.x=2;f.audit.run();f.audit.afterRender(16100,1);
  assert.equal(f.state().result.distanceWalked,2);
  f.audit.run();f.audit.afterRender(20000,1);f.audit.dispose();assert.equal(f.audit.active,false);assert.equal(f.state().phase,'aborted');assert.match(f.state().error,/disposed/);assert.equal(f.document.listeners.size,0);assert.equal(f.document.body.children[0].removed,true);
  f.audit.run();f.audit.afterRender(40000,1);assert.equal(f.state().phase,'aborted');
 }finally{f.cleanup();}
});

test('quaternion sign changes add no apparent rotation and mutable contexts are snapshotted',()=>{
 const shared={nested:{version:1}},f=fixture({getContext:()=>shared});try{
  f.audit.run();f.audit.afterRender(0,1);shared.nested.version=2;f.camera.quaternion.w=-1;f.audit.afterRender(8000,1);
  f.camera.quaternion.w=1;f.audit.afterRender(16000,1);const r=f.state().result;
  assert.equal(r.angularCumulativeRadians,0);assert.equal(r.contextStart.nested.version,1);assert.equal(r.contextEnd.nested.version,2);
 }finally{f.cleanup();}
});

test('non-increasing frame timestamps fail and a fresh recording resets previous samples',()=>{
 const f=fixture();try{
  f.audit.run();f.audit.afterRender(100,1);f.audit.afterRender(99,1);assert.equal(f.state().phase,'error');
  f.audit.run();f.audit.afterRender(200,1);f.audit.afterRender(16200,2,3);const r=f.state().result;
  assert.equal(f.state().phase,'complete');assert.equal(r.frameCount,1);assert.equal(r.updateSum,3);assert.equal(r.submitSum,2);assert.equal(r.distanceWalked,0);
 }finally{f.cleanup();}
});
