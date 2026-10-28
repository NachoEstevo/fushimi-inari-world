import test from 'node:test';
import assert from 'node:assert/strict';
import {createPondSoundscape} from './pond-soundscape.mjs';

function fixture(fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})){
 const jobs=new Map(),sources=[],reports=[],controls={'ambient-birds':{checked:true},'ambient-wind':{checked:true}};let serial=0,requests=0,decodes=0;
 const gain={value:0,calls:[],setValueAtTime(v){this.value=v;},setTargetAtTime(...args){this.calls.push(args);}};
 const node=()=>({connect(){return this;},disconnect(){this.disconnected=true;}});
 const ctx={currentTime:0,destination:{},createGain:()=>({...node(),gain}),decodeAudioData:async()=>{decodes++;return {duration:38};},
  createBufferSource(){const voice={...node(),stops:0,start(){this.started=true;},stop(){this.stops++;}};sources.push(voice);return voice;}};
 const recording=createPondSoundscape(ctx,{document:{getElementById:id=>controls[id]},fetcher:(...args)=>{requests++;return fetcher(...args);},
  idle:work=>{const id=++serial;jobs.set(id,work);return id;},cancelIdle:id=>jobs.delete(id),onStats:s=>reports.push(s)});
 async function idle(){for(const [id,work]of jobs){jobs.delete(id);await work();}}
 return {recording,ctx,sources,gain,controls,reports,idle,jobs,get requests(){return requests;},get decodes(){return decodes;}};
}

test('the field recording loads once in idle after sound unlock and remains one bounded loop',async()=>{
 const f=fixture();f.recording.update({x:552.64,z:-110.23});await f.idle();assert.equal(f.requests,0);
 f.recording.setEnabled(true);assert.equal(f.requests,0);await f.idle();assert.equal(f.requests,1);assert.equal(f.decodes,1);assert.equal(f.sources.length,1);assert.equal(f.sources[0].loop,true);
 f.recording.update({x:552.64,z:-110.23});assert.equal(f.gain.calls.at(-1)[0],.55*.24);
 for(let i=0;i<1000;i++){f.ctx.currentTime+=.016;f.recording.update({x:552.64,z:-110.23});}assert.equal(f.sources.length,1);assert.equal(f.gain.calls.length,1,'a stationary unchanged mix does not reschedule automation every frame');
 f.recording.setEnabled(false);assert.equal(f.sources[0].stops,1);f.recording.setEnabled(true);await f.idle();assert.equal(f.sources.length,2);assert.equal(f.decodes,1);assert.equal(f.requests,1);f.recording.dispose();
});

test('stream/birds stay near the pond and obey night, menu, birds, wind and master volume',async()=>{
 const f=fixture();f.recording.setEnabled(true);await f.idle();
 function update(position,night,state){f.ctx.currentTime+=.3;f.recording.update(position,night,state);return f.gain.calls.at(-1)?.[0];}
 const near={x:552.64,z:-110.23};assert.equal(update(near,false),.55*.24);assert.equal(update({x:1000,z:0},false),0);
 assert.equal(update(near,true),0);assert.equal(update(near,false,{paused:true}),0);
 assert.ok(update(near,false)>0);f.controls['ambient-birds'].checked=false;assert.equal(update(near,false),0);
 f.controls['ambient-birds'].checked=true;assert.ok(update(near,false)>0);f.controls['ambient-wind'].checked=false;assert.equal(update(near,false),0);
 f.controls['ambient-wind'].checked=true;f.recording.setVolume(.25);assert.equal(update(near,false),.25*.24);f.recording.dispose();
});

test('failed recordings do not request or decode repeatedly; disposal cancels queued work',async()=>{
 const f=fixture(async()=>({ok:false,status:404}));f.recording.setEnabled(true);await f.idle();assert.equal(f.requests,1);assert.equal(f.decodes,0);
 for(let i=0;i<100;i++){f.recording.prepare();f.recording.update({x:552,z:-110});}await f.idle();assert.equal(f.requests,1);assert.match(f.reports.at(-1).error,/404/);f.recording.dispose();
 const queued=fixture();queued.recording.setEnabled(true);assert.equal(queued.jobs.size,1);queued.recording.dispose();assert.equal(queued.jobs.size,0);await queued.idle();assert.equal(queued.requests,0);
});
