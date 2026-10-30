import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from './audio.mjs';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({lateMusic=false}={}){
 const saved=Object.fromEntries(['document','window','Audio','fetch','requestIdleCallback','cancelIdleCallback'].map(key=>[key,globalThis[key]]));
 const listeners=new Map(),idle=new Map(),controls=new Map(),requests=[],media=[],contexts=[];let serial=0;
 function control(value){const handlers=new Map();return {value,checked:true,addEventListener:(name,work)=>handlers.set(name,work),removeEventListener:name=>handlers.delete(name),change(){handlers.get('change')?.();},handlers};}
 for(const [name,value]of [['ambient-volume','55'],['ambient-wind',''],['ambient-birds',''],['ambient-chimes',''],['ambient-music','']])controls.set(name,control(value));controls.get('ambient-chimes').checked=false;
 const doc={hidden:false,body:{dataset:{}},getElementById:id=>controls.get(id),addEventListener:(name,work)=>listeners.set(name,work),removeEventListener:name=>listeners.delete(name)};
 const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=()=>({connect(){return this;},disconnect(){}});
 class Context{
  constructor(){this.sampleRate=32;this.currentTime=0;this.destination={};this.state='suspended';this.bufferFrames=0;this.decodes=0;this.mediaSources=0;this.sources=[];
   this.listener=Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(key=>[key,param()]));contexts.push(this);}
  createGain(){return {...node(),gain:param()};}createBiquadFilter(){return {...node(),frequency:param(),Q:param()};}
  createBuffer(channels,length){this.bufferFrames+=channels*length;return {duration:length/this.sampleRate,getChannelData:()=>new Float32Array(length)};}
  createBufferSource(){const source={...node(),playbackRate:param(),start(){},stop(){}};this.sources.push(source);return source;}
  createPanner(){return {...node(),positionX:param(),positionY:param(),positionZ:param()};}
  createOscillator(){return {...node(),frequency:param(),start(){},stop(){}};}
  createMediaElementSource(){this.mediaSources++;return node();}
  async decodeAudioData(){this.decodes++;return {duration:2,sampleRate:32,length:64,numberOfChannels:1,getChannelData:()=>new Float32Array(64)};}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
 }
 class Media{
  constructor(){this.duration=132;this.currentTime=0;this.plays=0;this.pauses=0;media.push(this);}load(){if(this.src)this.oncanplay?.();}play(){this.plays++;return Promise.resolve();}pause(){this.pauses++;}removeAttribute(name){delete this[name];}
 }
 Object.assign(globalThis,{document:doc,window:{AudioContext:Context},Audio:Media,fetch:async url=>{requests.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};},
  requestIdleCallback:work=>{const id=++serial;idle.set(id,work);return id;},cancelIdleCallback:id=>idle.delete(id)});
 const deferredControl=controls.get('ambient-music');if(lateMusic)controls.delete('ambient-music');
 const audio=createAudio();if(lateMusic)controls.set('ambient-music',deferredControl);
 const camera={position:{x:0,y:60,z:0,toArray(){throw Error('walking must reuse its coordinate array');}},quaternion:{x:0,y:0,z:0,w:1}},world={arrival:{phase:'complete'},paused:false,time:0};
 async function runIdle(){for(const [id,work]of idle){idle.delete(id);await work();}await flush();}
 function walk(seconds){for(let i=0;i<seconds*10;i++){contexts[0].currentTime+=.1;camera.position.x+=.5;world.time=contexts[0].currentTime;audio.update(camera,false,world);}}
 return {audio,camera,world,contexts,controls,doc,requests,media,listeners,walk,runIdle,async cleanup(){audio.dispose();await flush();for(const [key,value]of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}};
}

test('the shared sound gesture owns one context, streams music and disposes every new listener and source',async()=>{
 const f=fixture({lateMusic:true});try{
  assert.equal(f.contexts.length,0);assert.equal(f.media.length,0);assert.equal(f.audio.setEnabled(false),false);assert.equal(f.contexts.length,0,'muting cannot unlock a context or start asset requests');f.controls.get('ambient-music').checked=false;
  assert.equal(f.audio.setEnabled(true),true);assert.equal(f.contexts.length,1);assert.equal(f.contexts[0].mediaSources,1);
  assert.ok(f.contexts[0].bufferFrames<=f.contexts[0].sampleRate*8,'sound unlock does not allocate the unused legacy three-second noise');
  await f.runIdle();f.walk(121);await f.runIdle();f.walk(.2);await flush();assert.equal(f.media[0].plays,0,'Music checkbox has independent authority');
  const decodes=f.contexts[0].decodes;f.controls.get('ambient-music').checked=true;f.controls.get('ambient-music').change();f.walk(121);await f.runIdle();f.walk(.2);await flush();
  assert.equal(f.media[0].plays,1);assert.equal(f.contexts[0].decodes,decodes,'the soundtrack uses the native streaming decoder, not AudioBuffer decoding');
  assert.equal(JSON.parse(f.doc.body.dataset.walkingMusic).active,1);
  f.doc.hidden=true;f.listeners.get('visibilitychange')();assert.equal(f.contexts[0].state,'suspended');
  f.audio.dispose();assert.equal(f.contexts[0].state,'closed');assert.equal(f.listeners.size,0);assert.equal(f.controls.get('ambient-music').handlers.size,0);assert.equal(f.media[0].src,undefined);
 }finally{await f.cleanup();}
});


test('bench seating and NPC interactions keep the current piece while movement is paused',async()=>{
 const f=fixture();try{
  f.audio.setEnabled(true);f.walk(23);await f.runIdle();f.walk(.2);await flush();assert.equal(f.media[0].plays,1);
  f.media[0].currentTime=37;const pauses=f.media[0].pauses;
  for(const activity of ['bench','npc']){
   f.world.paused=true;f.world.musicPaused=false;f.world.activity=activity;f.walk(2);await flush();
   assert.equal(f.media[0].pauses,pauses,`${activity} does not pause music`);assert.equal(f.media[0].plays,1);assert.equal(f.media[0].currentTime,37);
  }
  f.world.musicPaused=true;f.walk(.2);assert.equal(JSON.parse(f.doc.body.dataset.walkingMusic).phase,'paused');
  f.world.musicPaused=false;f.walk(.2);await flush();assert.equal(f.media[0].plays,2);assert.equal(f.media[0].currentTime,37);
 }finally{await f.cleanup();}
});

test('world.paused remains the fallback and an active arrival still takes precedence over musicPaused',async()=>{
 const f=fixture();try{
  f.audio.setEnabled(true);f.walk(23);await f.runIdle();f.walk(.2);await flush();assert.equal(f.media[0].plays,1);
  f.world.paused=true;f.walk(.2);assert.equal(JSON.parse(f.doc.body.dataset.walkingMusic).phase,'paused');
  f.world.musicPaused=false;f.world.arrival.phase='arriving';f.walk(1);await flush();assert.equal(f.media[0].plays,1);
  f.world.arrival.phase='complete';f.walk(.2);await flush();assert.equal(f.media[0].plays,2);
 }finally{await f.cleanup();}
});


test('enabling audio while already hidden cannot wake music or resume the shared context',async()=>{
 const f=fixture();try{
  f.doc.hidden=true;f.audio.setEnabled(true);assert.equal(f.contexts[0].state,'suspended');f.walk(100);await f.runIdle();assert.equal(f.media[0].plays,0);
  f.doc.hidden=false;f.listeners.get('visibilitychange')();f.walk(23);await f.runIdle();f.walk(.2);await flush();assert.equal(f.media[0].plays,1);
 }finally{await f.cleanup();}
});
