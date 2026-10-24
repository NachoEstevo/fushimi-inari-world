import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordedAudio} from './recorded-audio.mjs';
function fixture(fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})){
 const sources=[],stats=[];const ctx={currentTime:0,destination:{},decodeAudioData:async()=>({duration:4}),
  createGain(){return {gain:{value:0,setTargetAtTime(){},cancelScheduledValues(){}},connect(){return this;},disconnect(){}};},
  createBufferSource(){const s={starts:0,stops:0,connect(){return this;},disconnect(){},start(when){this.starts++;this.when=when;},stop(){this.stops++;}};sources.push(s);return s;}};
 return {ctx,sources,stats,audio:createRecordedAudio(ctx,{fetcher,onStats:s=>stats.push(s)})};
}
const frame={position:[-302.6,32.7,-152],gate:{center:[-302.6,31,-151.4],width:4.5},arrival:{phase:'decelerating'},time:1};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('recordings load only after enable, use bounded loops, and mute stops them',async()=>{
 let requests=0;const f=fixture(async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};});
 f.audio.update(frame);assert.equal(requests,0);f.audio.setEnabled(true);await flush();
 assert.equal(requests,6);for(let i=0;i<100;i++)f.audio.update({...frame,time:i});
 assert.equal(f.sources.length,1);assert.equal(f.sources[0].loop,true);
 f.audio.setEnabled(false);assert.equal(f.sources[0].stops,1);assert.equal(f.stats.at(-1).activeLoops.length,0);
});
test('pending decode never starts playback after mute',async()=>{
 let release;const promise=new Promise(r=>release=r);const f=fixture(()=>promise);f.audio.setEnabled(true);f.audio.update(frame);f.audio.setEnabled(false);
 release({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await flush();f.audio.update(frame);assert.equal(f.sources.length,0);
});
test('hidden/menu pause stops sounds and crossing gate remains edge-triggered after resume',async()=>{
 const f=fixture();f.audio.setEnabled(true);await flush();f.audio.update({...frame,arrival:{phase:'complete'}});
 f.audio.update({...frame,arrival:{phase:'complete'},position:[-302.6,32.7,-151],time:2});await flush();assert.equal(f.sources.length,1);
 f.audio.pause(true);assert.equal(f.sources[0].stops,1);
 f.audio.update({...frame,position:[-302.6,32.7,-150],arrival:{phase:'complete'},paused:true,time:3});
 f.audio.update({...frame,position:[-302.6,32.7,-149],arrival:{phase:'complete'},paused:false,time:4});await flush();assert.equal(f.sources.length,1);
});
test('bad recording fails once without replacing it with synthesized audio',async()=>{
 let requests=0;const f=fixture(async()=>{requests++;return {ok:false,status:404};});f.audio.setEnabled(true);await flush();
 for(let i=0;i<10;i++)f.audio.update({...frame,time:i});await flush();assert.equal(requests,6);assert.equal(f.sources.length,0);assert.equal(f.stats.at(-1).failed.length,6);
});

test('door warning stops at handoff and crossing ambience survives railway phase changes',async()=>{
 const f=fixture();f.audio.setEnabled(true);await flush();
 f.audio.update({...frame,arrival:{phase:'closing'}});await flush();
 const door=f.sources[0];assert.equal(door.starts,1);
 f.audio.update({...frame,arrival:{phase:'complete'},time:2});assert.equal(door.stops,1);
 const rail={group:{userData:{crossingState:{phase:'clear'}}},spec:{crossing:frame.position}};
 f.audio.update({...frame,arrival:{phase:'complete'},rail,time:3});
 const ambience=f.sources[1];assert.equal(ambience.loop,true);
 rail.group.userData.crossingState.phase='warning';
 f.audio.update({...frame,arrival:{phase:'complete'},rail,time:4});
 assert.equal(f.sources.length,2);assert.equal(ambience.stops,0);
});

test('arrival schedules Japanese fully before English and cancels both on skip',async()=>{
 const f=fixture();f.audio.setEnabled(true);await flush();
 f.audio.update({...frame,arrival:{phase:'moving',elapsed:0}});await flush();
 const voices=f.sources.filter(s=>!s.loop);assert.equal(voices.length,2);
 assert.equal(voices[1].when-voices[0].when,4.25);
 assert.deepEqual(f.stats.at(-1).voiceSchedule.map(s=>s.id),['announcementJa','announcementEn']);
 f.audio.update({...frame,arrival:{phase:'moving',elapsed:1}});await flush();assert.equal(f.sources.filter(s=>!s.loop).length,2);
 f.audio.update({...frame,arrival:{phase:'complete',elapsed:18}});assert.ok(f.sources.every(s=>s.stops===1));
});
test('arrival replay replaces a scheduled announcement and menu pause prevents the later language',async()=>{
 const f=fixture();f.audio.setEnabled(true);await flush();
 f.audio.update({...frame,arrival:{phase:'stopped',elapsed:2,reducedMotion:true}});await flush();
 f.audio.update({...frame,arrival:{phase:'stopped',elapsed:0,reducedMotion:true}});await flush();
 assert.equal(f.sources.length,4);assert.equal(f.sources[0].stops,1);assert.equal(f.sources[1].stops,1);
 f.audio.pause(true);assert.equal(f.sources[2].stops,1);assert.equal(f.sources[3].stops,1);
});

test('door hold remains active until the English source has ended',async()=>{
 const f=fixture();f.audio.setEnabled(true);await flush();
 f.audio.update({...frame,arrival:{phase:'moving',elapsed:0}});await flush();
 assert.equal(f.audio.announcementActive,true);
 const voices=f.sources.filter(s=>!s.loop);voices[0].onended();assert.equal(f.audio.announcementActive,true);
 voices[1].onended();assert.equal(f.audio.announcementActive,false);
});

test('enabling sound late before opening still plays the two announcements once',async()=>{
 const f=fixture();const late={...frame,arrival:{phase:'stopped',elapsed:8}};
 f.audio.update(late);f.audio.setEnabled(true);await flush();f.audio.update(late);await flush();
 assert.equal(f.audio.announcementActive,true);assert.equal(f.sources.length,2);
 f.audio.update(late);await flush();assert.equal(f.sources.length,2);
 f.audio.setEnabled(false);f.audio.setEnabled(true);f.audio.update(late);await flush();assert.equal(f.sources.length,4);
});
