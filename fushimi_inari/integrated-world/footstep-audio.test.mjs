import test from 'node:test';
import assert from 'node:assert/strict';
import {createFootstepAudio} from './footstep-audio.mjs';
test('real output chain attenuates both surfaces and follows the volume control',async()=>{
 const destination={},gains=[],sources=[],stats=[];
 const ctx={state:'running',currentTime:0,destination,decodeAudioData:async()=>({}),
  createGain(){const node={gain:{value:1},connect(to){this.output=to;},disconnect(){}};gains.push(node);return node;},
  createBufferSource(){const node={connect(to){this.output=to;},disconnect(){},start(){},stop(){}};sources.push(node);return node;}};
 const audio=createFootstepAudio(ctx,{fetcher:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)}),onStats:s=>stats.push(s)});
 await audio.load();audio.play(true);ctx.currentTime=1;audio.play(false);
 for(let i=0;i<2;i++){assert.equal(sources[i].output,gains[i]);assert.equal(gains[i].output,destination);assert.ok(Math.abs(gains[i].gain.value-.044)<1e-8);}
 audio.setVolume(0);assert.ok(gains.every(g=>g.gain.value===0));
 audio.setVolume(1);assert.ok(gains.every(g=>g.gain.value===.08));
 ctx.currentTime=2;audio.play(true);assert.equal(gains[2].gain.value,.08);
 assert.equal(stats.at(-1).effectiveGain,.08);assert.ok(.044/.18<.25);
});
function fixture(fail=false){const sources=[],urls=[];const ctx={currentTime:0,state:'running',destination:{},decodeAudioData:async b=>({id:b}),createGain:()=>({gain:{},connect(){},disconnect(){}}),createBufferSource(){const s={connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};sources.push(s);return s;}};const audio=createFootstepAudio(ctx,{fetcher:async url=>{urls.push(url);return {ok:!fail,arrayBuffer:async()=>url};}});return {ctx,audio,sources,urls};}
test('loads once, alternates recorded feet/takes and rate limits without bursts',async()=>{const f=fixture();await Promise.all([f.audio.load(),f.audio.load()]);assert.equal(f.urls.length,12);assert.equal(f.audio.play(true),true);assert.match(f.sources[0].buffer.id,/StoneL1/);f.ctx.currentTime=.1;assert.equal(f.audio.play(true),false);f.ctx.currentTime=.5;f.audio.play(false);assert.match(f.sources[1].buffer.id,/SandR1/);f.ctx.currentTime=1;f.audio.play(true);assert.match(f.sources[2].buffer.id,/StoneL2/);f.audio.stop();assert.ok(f.sources.every(s=>s.stopped));});
test('failed or suspended audio never invents a fallback or retries per frame',async()=>{const f=fixture(true);await f.audio.load();for(let i=0;i<20;i++)assert.equal(f.audio.play(true),false);assert.equal(f.urls.length,12);const g=fixture();await g.audio.load();g.ctx.state='suspended';assert.equal(g.audio.play(true),false);assert.equal(g.sources.length,0);});
