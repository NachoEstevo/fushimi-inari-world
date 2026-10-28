import test from 'node:test';
import assert from 'node:assert/strict';
import {createZenAmbientAudio} from './zen-ambient-audio.mjs';

function fixture(options={}){
 const params=[],sources=[],nodes=[];let created=0,resumed=0,suspended=0,closed=0;
 function parameter(){const p={value:0,calls:[],setTargetAtTime(...args){this.calls.push(args);},setValueCurveAtTime(...args){this.calls.push(args);}};params.push(p);return p;}
 function node(){const n={connected:0,disconnected:0,connect(){this.connected++;return this;},disconnect(){this.disconnected++;}};nodes.push(n);return n;}
 const ctx={state:'suspended',sampleRate:100,currentTime:4,destination:{},createBuffer:(_,length)=>({getChannelData:()=>new Float32Array(length)}),
  createBufferSource(){const s={...node(),starts:0,stops:0,start(){this.starts++;},stop(){this.stops++;}};sources.push(s);return s;},
  createBiquadFilter(){return {...node(),frequency:parameter(),Q:parameter()};},createGain(){return {...node(),gain:parameter()};},
  resume(){resumed++;if(options.resume)return options.resume(this);this.state='running';return Promise.resolve();},suspend(){suspended++;this.state='suspended';return Promise.resolve();},close(){closed++;this.state='closed';return Promise.resolve();}};
 const audio=createZenAmbientAudio({createContext(){created++;return ctx;},...options});
 return {audio,ctx,params,sources,nodes,get created(){return created;},get resumed(){return resumed;},get suspended(){return suspended;},get closed(){return closed;}};
}

test('rain audio is gesture-lazy, owns one loop and changing shelter muffles without rescheduling every frame',()=>{
 const f=fixture(),state={raining:true,sheltered:false,umbrella:false,blocked:false};
 f.audio.update(state);f.audio.setEnabled(false);assert.equal(f.created,0);
 assert.equal(f.audio.setEnabled(true),true);assert.equal(f.created,1);assert.equal(f.sources.length,1);assert.equal(f.sources[0].starts,1);
 f.audio.update(state);const calls=f.params.reduce((sum,p)=>sum+p.calls.length,0);
 for(let i=0;i<100;i++)f.audio.update(state);assert.equal(f.params.reduce((sum,p)=>sum+p.calls.length,0),calls);
 const frequency=f.params[0];assert.equal(frequency.calls.at(-1)[0],3200);
 state.sheltered=true;f.audio.update(state);assert.equal(frequency.calls.at(-1)[0],1050);
 f.audio.setEnabled(true);f.audio.update(state);assert.equal(f.sources.length,1);assert.equal(f.created,1);
 f.audio.setVolume(0);f.audio.update(state);for(const p of f.params.filter((_,i)=>i===2||i===5))assert.equal(p.calls.at(-1)[0],0);
 f.audio.setEnabled(false);assert.equal(f.suspended,1);f.audio.dispose();f.audio.dispose();assert.equal(f.sources[0].stops,1);assert.equal(f.closed,1);
 assert.equal(f.audio.setEnabled(true),false);
});

test('repeated key and polling equivalent enable/volume calls perform no audio work',async()=>{
 const f=fixture(),state={raining:true,sheltered:false,umbrella:false,blocked:false};
 f.audio.setEnabled(true,{gesture:true});await Promise.resolve();f.audio.update(state);
 const calls=f.params.reduce((sum,p)=>sum+p.calls.length,0);
 for(let i=0;i<100;i++){f.audio.setEnabled(true);f.audio.setEnabled(true,{gesture:true});f.audio.setVolume(.55);f.audio.update(state);}
 assert.equal(f.resumed,1);assert.equal(f.created,1);assert.equal(f.params.reduce((sum,p)=>sum+p.calls.length,0),calls);
 f.audio.setEnabled(false);const muted=f.params.reduce((sum,p)=>sum+p.calls.length,0);
 for(let i=0;i<100;i++){f.audio.setEnabled(false);f.audio.setVolume(.55);}
 assert.equal(f.suspended,1);assert.equal(f.params.reduce((sum,p)=>sum+p.calls.length,0),muted);f.audio.dispose();
});

test('a blocked initial resume retries on a real gesture and deduplicates pending unlocks',async()=>{
 let allowed=false;
 const f=fixture({resume(ctx){if(!allowed)return Promise.reject(Error('Gesture required'));ctx.state='running';return Promise.resolve();}});
 f.audio.setEnabled(true);await Promise.resolve();
 for(let i=0;i<100;i++)f.audio.setEnabled(true);
 assert.equal(f.resumed,1);allowed=true;f.audio.setEnabled(true,{gesture:true});assert.equal(f.resumed,2);assert.equal(f.created,1);f.audio.dispose();
 let release;
 const pending=fixture({resume(ctx){return new Promise(resolve=>{release=()=>{ctx.state='running';resolve();};});}});
 pending.audio.setEnabled(true,{gesture:true});for(let i=0;i<100;i++)pending.audio.setEnabled(true,{gesture:true});assert.equal(pending.resumed,1);
 release();await Promise.resolve();pending.audio.setEnabled(true,{gesture:true});assert.equal(pending.resumed,1);pending.audio.dispose();
});

test('hidden enabling waits for visibility and unchanged volume clamps do not reschedule',async()=>{
 const handlers=new Map(),doc={hidden:true,addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
 const f=fixture({document:doc}),state={raining:true,sheltered:false,umbrella:false,blocked:false};
 f.audio.setEnabled(true,{gesture:true});for(let i=0;i<20;i++)f.audio.setEnabled(true,{gesture:true});assert.equal(f.resumed,0);
 doc.hidden=false;handlers.get('visibilitychange')();await Promise.resolve();assert.equal(f.resumed,1);
 f.audio.setVolume(2);f.audio.update(state);const calls=f.params.reduce((sum,p)=>sum+p.calls.length,0);
 f.audio.setVolume(100);f.audio.setVolume(NaN);f.audio.update(state);assert.equal(f.params.reduce((sum,p)=>sum+p.calls.length,0),calls);f.audio.dispose();
});

test('a soft purr shares the existing gesture context, is bounded and respects mute and pause',()=>{
 const f=fixture();assert.equal(f.audio.purr(),false);assert.equal(f.created,0);
 f.audio.setEnabled(true);assert.equal(f.audio.purr(),true);assert.equal(f.created,1);assert.equal(f.sources.length,2);
 assert.equal(f.audio.purr(),false);assert.equal(f.sources.length,2);
 f.audio.setEnabled(false);assert.equal(f.audio.purr(),false);assert.equal(f.sources[1].stops,2);
 f.audio.setEnabled(true);f.audio.update({raining:false,sheltered:false,umbrella:false,blocked:true});assert.equal(f.audio.purr(),false);
 f.audio.dispose();assert.equal(f.audio.purr(),false);
});

test('backgrounding suspends local weather audio even when the animation loop stops',()=>{
 const handlers=new Map(),doc={hidden:false,addEventListener(name,fn){handlers.set(name,fn);},removeEventListener(name){handlers.delete(name);}};
 const f=fixture({document:doc});f.audio.setEnabled(true);assert.equal(f.resumed,1);
 doc.hidden=true;handlers.get('visibilitychange')();assert.equal(f.suspended,1);assert.equal(f.audio.purr(),false);
 doc.hidden=false;handlers.get('visibilitychange')();assert.equal(f.resumed,2);f.audio.dispose();assert.equal(handlers.size,0);
});

test('paused or clear weather has zero rain gains, and unavailable audio never interrupts the scene',()=>{
 const f=fixture();f.audio.setEnabled(true);f.audio.update({raining:true,sheltered:true,umbrella:true,blocked:true});
 assert.equal(f.params[2].calls.at(-1)[0],0);assert.equal(f.params[5].calls.at(-1)[0],0);
 f.audio.update({raining:false,sheltered:true,umbrella:false,blocked:false});assert.equal(f.params[2].calls.at(-1)[0],0);f.audio.dispose();
 const unavailable=createZenAmbientAudio({createContext(){throw Error('No audio permission');}});
 assert.equal(unavailable.setEnabled(true),false);unavailable.update({raining:true});unavailable.dispose();
});
