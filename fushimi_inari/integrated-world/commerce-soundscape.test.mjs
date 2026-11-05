import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {createCommerceSoundscape} from './commerce-soundscape.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture({fetcher}={}){
 const jobs=new Map(),sources=[],gains=[],reports=[],requests=[];let serial=0,activeRequests=0,maxRequests=0;
 const param=()=>({value:0,targets:[],setValueAtTime(value){this.value=value;},setTargetAtTime(value,time,constant){this.value=value;this.targets.push({value,time,constant});},cancelScheduledValues(){}});
 const node=()=>({connected:true,connect(next){return next;},disconnect(){this.connected=false;}});
 const ctx={currentTime:0,state:'running',destination:{},createGain(){const n={...node(),gain:param()};gains.push(n);return n;},
  createBufferSource(){const source={...node(),started:false,stops:0,start(){this.started=true;},stop(at){this.stops++;this.stoppedAt=at;if(at===undefined||at<=ctx.currentTime)this.onended?.();},finish(){this.onended?.();}};sources.push(source);return source;},
  async decodeAudioData(data){return {id:data.id,duration:8};}};
 const load=fetcher??(async url=>({ok:true,arrayBuffer:async()=>({id:url.split('/').at(-1).replace('.mp3','')})}));
 const audio=createCommerceSoundscape?.(ctx,{fetcher:async(...args)=>{requests.push(args[0]);activeRequests++;maxRequests=Math.max(activeRequests,maxRequests);try{return await load(...args);}finally{activeRequests--;}},
  idle:work=>{const id=++serial;jobs.set(id,work);return id;},cancelIdle:id=>jobs.delete(id),onStats:stats=>reports.push(stats)});
 async function drain(){for(let turn=0;turn<100;turn++){for(const [id,work]of [...jobs]){jobs.delete(id);work();}await tick();if(!jobs.size&&!activeRequests){await tick();if(!jobs.size&&!activeRequests)return;}}throw Error('load queue failed to drain');}
 const near={x:0,y:0,z:0},vending=[{kind:'vending',position:[0,0,1]}],shop=[{kind:'shop',position:[0,0,1]}];
 return {audio,ctx,jobs,sources,gains,reports,requests,drain,near,vending,shop,get maxRequests(){return maxRequests;}};
}

const action=(type,kind)=>({type,kind,position:[0,0,1]});

test('the shared context warms nearby clips lazily with at most two concurrent loads',async()=>{
 assert.equal(typeof createCommerceSoundscape,'function');const f=fixture();
 f.audio.update(f.near,f.vending);await f.drain();assert.equal(f.requests.length,0);
 f.audio.setEnabled(true);await f.drain();assert.equal(f.requests.length,0,'sound unlock alone does not fetch commerce clips');
 f.audio.update({x:100,y:0,z:0},f.vending);await f.drain();assert.equal(f.requests.length,0);
 f.ctx.currentTime=1;f.audio.update(f.near,f.vending);await f.drain();
 assert.ok(f.requests.some(url=>url.endsWith('/select.mp3')));assert.ok(f.requests.some(url=>url.endsWith('/vending-hum.mp3')));assert.ok(f.maxRequests<=2);
 f.ctx.currentTime+=.3;f.audio.update(f.near,f.vending);assert.equal(f.sources.filter(source=>source.loop).length,1);
 assert.ok(f.gains[1].gain.targets.some(target=>target.value>0),'nearby ambience fades in');
 for(let i=0;i<1000;i++){f.ctx.currentTime+=.016;f.audio.update(f.near,f.vending);}
 assert.equal(f.sources.filter(source=>source.loop).length,1,'stationary ambience never restarts each frame');f.audio.dispose();
});

test('accepted actions are spatial, use the warmed files, respect cooldowns and limit active voices',async()=>{
 assert.equal(typeof createCommerceSoundscape,'function');const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,f.vending);await f.drain();
 assert.equal(f.audio.play(action('vending.select')),true);assert.equal(f.audio.play(action('vending.select')),false);
 assert.equal(f.audio.play(action('vending.dispense')),true);assert.equal(f.audio.play(action('drink.open','can')),true);
 assert.equal(f.audio.play(action('drink.sip')),false,'no more than three interaction voices overlap');
 const shots=f.sources.filter(source=>!source.loop);assert.deepEqual(shots.map(source=>source.buffer.id),['select','dispense','can-open']);
 shots.forEach(source=>source.finish());f.ctx.currentTime+=1;
 assert.equal(f.audio.play(action('drink.sip')),true);assert.equal(f.audio.play({type:'drink.sip',position:[100,0,0]}),false);
 assert.equal(f.audio.play(action('unrecognized')),false);f.audio.setVolume(.2);assert.equal(f.gains[0].gain.value,.2);
 f.ctx.currentTime+=1;f.audio.update(f.near,f.vending);assert.equal(f.reports.at(-1).plays['drink.sip'],1);f.audio.dispose();
});

test('shop ambience and food handling stay local and do not stack with a vending loop',async()=>{
 assert.equal(typeof createCommerceSoundscape,'function');const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,f.shop);await f.drain();f.ctx.currentTime=1;f.audio.update(f.near,f.shop);
 assert.equal(f.sources.filter(source=>source.loop).length,1);assert.equal(f.sources.find(source=>source.loop).buffer.id,'shop-grill');
 assert.equal(f.audio.play(action('food.collect')),true);assert.equal(f.audio.play(action('food.bite','senbei')),true);
 assert.deepEqual(f.sources.filter(source=>!source.loop).map(source=>source.buffer.id),['paper','crunch']);
 f.ctx.currentTime+=1;f.audio.update({x:100,y:0,z:0},f.shop);const ambient=f.sources.find(source=>source.loop);
 assert.equal(ambient.stops,1);assert.ok(ambient.stoppedAt>f.ctx.currentTime,'leaving the site fades the ambience before stopping');f.audio.dispose();
});

test('food bite sounds follow the serving and never add a cracker crunch to soft food',async()=>{
 const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,f.shop);await f.drain();
 assert.equal(f.audio.play(action('food.bite','soft-serve')),true);assert.equal(f.sources.at(-1).buffer.id,'sip');
 assert.ok(f.gains.at(-1).gain.value<.1,'soft-serve handling stays quiet');
 assert.equal(f.audio.play(action('food.bite','grill')),false);assert.equal(f.audio.play(action('food.bite')),false);
 assert.equal(f.sources.filter(source=>source.buffer.id==='crunch').length,0);f.audio.dispose();
});

test('non-grill food counters preload their serving sounds without a grill loop',async()=>{
 const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,[{kind:'food',position:[0,0,1]}]);await f.drain();
 for(const id of ['paper','crunch','sip'])assert.ok(f.requests.some(url=>url.endsWith(`/${id}.mp3`)));
 assert.equal(f.requests.some(url=>url.endsWith('/shop-grill.mp3')),false);f.ctx.currentTime=1;f.audio.update(f.near,[{kind:'food',position:[0,0,1]}]);
 assert.equal(f.sources.length,0);assert.equal(f.audio.play(action('food.bite','senbei')),true);f.audio.dispose();
});

test('a pending sound never plays late after pause, mute or disposal',async()=>{
 assert.equal(typeof createCommerceSoundscape,'function');let release;const deferred=new Promise(resolve=>release=resolve),f=fixture({fetcher:()=>deferred});
 f.audio.setEnabled(true);f.audio.update(f.near,[]);assert.equal(f.audio.play(action('vending.select')),false);for(const [id,work]of f.jobs){f.jobs.delete(id);work();}
 f.audio.pause(true);release({ok:true,arrayBuffer:async()=>({id:'select'})});await tick();f.audio.pause(false);f.ctx.currentTime=4;f.audio.update(f.near,[]);await tick();assert.equal(f.sources.length,0);
 f.audio.setEnabled(false);assert.equal(f.audio.play(action('vending.select')),false);f.audio.dispose();f.audio.dispose();await tick();assert.equal(f.sources.length,0);assert.ok(f.gains.every(gain=>!gain.connected));
});

test('failed clips are not retried in the frame loop',async()=>{
 assert.equal(typeof createCommerceSoundscape,'function');const f=fixture({fetcher:async()=>({ok:false,status:404})});f.audio.setEnabled(true);f.audio.update(f.near,f.shop);await f.drain();const requests=f.requests.length;
 for(let i=0;i<100;i++){f.ctx.currentTime+=.3;f.audio.update(f.near,f.shop);f.audio.play(action('food.bite'));}await f.drain();assert.equal(f.requests.length,requests);assert.equal(f.sources.length,0);f.audio.dispose();
});

test('muting stops every active commerce voice and disconnects its nodes',async()=>{
 const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,f.vending);await f.drain();f.ctx.currentTime=1;f.audio.update(f.near,f.vending);
 assert.equal(f.audio.play(action('vending.select')),true);assert.equal(f.sources.length,2);
 f.audio.setEnabled(false);assert.ok(f.sources.every(source=>source.stops===1&&!source.connected));assert.ok(f.gains.slice(1).every(gain=>!gain.connected));
 f.audio.dispose();f.audio.dispose();assert.ok(f.sources.every(source=>source.stops===1));assert.ok(f.gains.every(gain=>!gain.connected));
});

test('nearby ambient mixes stay in the calibrated level range and obey master volume',async()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/audio/commerce/manifest.json',import.meta.url),'utf8'));
 for(const [site,id] of [['vending','vending-hum'],['shop','shop-grill']]){
  const f=fixture(),sites=[{kind:site,position:[0,0,1]}];f.audio.setEnabled(true);f.audio.setVolume(.55);f.audio.update(f.near,sites);await f.drain();
  f.ctx.currentTime=1;f.audio.update(f.near,sites);const loop=f.sources.find(source=>source.loop),gain=f.gains[1].gain;
  const level=manifest.tracks[id].integratedLUFS+20*Math.log10(f.gains[0].gain.value*gain.value);
  assert.ok(level>=-46&&level<=-43,`${id} one-metre mix is ${level.toFixed(1)} LUFS`);
  f.ctx.currentTime=2;f.audio.update({x:0,y:0,z:1},sites);assert.ok(gain.value<=.25,'loop gain stays capped at its source');
  f.audio.setVolume(0);assert.equal(f.gains[0].gain.value,0);f.audio.setEnabled(false);assert.equal(loop.stops,1);f.audio.dispose();
 }
});

test('pausing during an ambient fade stops the scheduled tail immediately',async()=>{
 const f=fixture();f.audio.setEnabled(true);f.audio.update(f.near,f.shop);await f.drain();f.ctx.currentTime=1;f.audio.update(f.near,f.shop);
 const ambient=f.sources.find(source=>source.loop);f.ctx.currentTime=2;f.audio.update({x:100,y:0,z:0},f.shop);
 assert.equal(ambient.stops,1);assert.equal(ambient.connected,true);f.audio.pause(true);
 assert.equal(ambient.stops,2);assert.equal(ambient.connected,false);f.audio.dispose();
});
