import test from 'node:test';
import assert from 'node:assert/strict';
import {createAmbience} from './ambient-audio.mjs';

function fixture(){
 const reports=[],gains=[],sources=[],lookups=[],controls={'ambient-volume':{value:'55'},'ambient-wind':{checked:true},'ambient-birds':{checked:true},'ambient-chimes':{checked:false}};
 const dataset={};Object.defineProperty(dataset,'ambience',{set:value=>reports.push(JSON.parse(value))});
 const document={body:{dataset},getElementById(id){lookups.push(id);return controls[id];}};
 const parameter=()=>({value:0,calls:[],setTargetAtTime(...args){this.calls.push(args);},setValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){return this;},disconnect(){}});
 const ctx={sampleRate:32,currentTime:0,destination:{},listener:Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(key=>[key,parameter()])),
  createGain(){const n={...node(),gain:parameter()};gains.push(n);return n;},createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)};},
  createBufferSource(){const n={...node(),starts:0,stops:0,start(){this.starts++;},stop(){this.stops++;}};sources.push(n);return n;},
  createBiquadFilter:()=>({...node(),frequency:parameter()}),createPanner:()=>({...node(),positionX:parameter(),positionY:parameter(),positionZ:parameter()}),decodeAudioData:async()=>({duration:1})};
 const audio=createAmbience(ctx,{document,fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)})}),camera={position:{x:0,y:1.7,z:0},quaternion:{x:0,y:0,z:0,w:1}};
 return {audio,ctx,camera,controls,reports,gains,sources,lookups};
}

test('diagnostics run at four hertz while listener, volume and wind stay continuous',()=>{
 const f=fixture();f.audio.setEnabled(true);
 for(let i=1;i<=60;i++){f.ctx.currentTime=i/60;f.camera.position.x=i;f.audio.update(f.camera);assert.equal(f.ctx.listener.positionX.value,i);}
 assert.equal(f.lookups.length,4,'the four DOM controls are cached rather than queried each frame');
 assert.equal(f.gains[0].gain.calls.length,60);assert.equal(f.gains[1].gain.calls.length,60);assert.ok(f.reports.length>=4&&f.reports.length<=5);
 const reports=f.reports.length;f.controls['ambient-volume'].value='25';f.controls['ambient-wind'].checked=false;f.ctx.currentTime+=.01;f.audio.update(f.camera);
 assert.equal(f.gains[0].gain.calls.at(-1)[0],.25);assert.equal(f.gains[1].gain.calls.at(-1)[0],0);assert.equal(f.reports.length,reports);
 f.audio.setEnabled(false);assert.equal(f.reports.at(-1).enabled,false);assert.equal(f.reports.at(-1).activeSources,0);assert.equal(f.reports.length,reports+1);
 f.audio.setEnabled(true);assert.equal(f.reports.at(-1).enabled,true);assert.equal(f.reports.length,reports+2);
});

test('bird playback and mute remain responsive between diagnostic ticks',async()=>{
 const f=fixture();await new Promise(resolve=>setImmediate(resolve));f.audio.setEnabled(true);f.camera.position.x=200;f.ctx.currentTime=.01;f.audio.update(f.camera);
 assert.equal(f.sources.length,2);assert.equal(f.sources[1].starts,1);assert.equal(f.reports.length,1);
 f.ctx.currentTime=.26;f.audio.update(f.camera);assert.equal(f.reports.at(-1).birdCalls,1);assert.equal(f.reports.at(-1).bird,'ready');
 f.audio.setEnabled(false);assert.equal(f.sources[1].stops,1);assert.equal(f.reports.at(-1).enabled,false);
});
