import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkingMusic,WALKING_MUSIC} from './walking-music.mjs';

function fixture({play=()=>Promise.resolve()}={}){
 const jobs=new Map(),timers=new Map(),reports=[],gains=[],connections=[];let job=0,created=0;
 const param=()=>({value:0,events:[],cancelScheduledValues(){},setValueAtTime(v,t){this.value=v;this.events.push(['value',v,t]);},linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);}});
 const node=()=>({connect(other){connections.push(other);return other;},disconnect(){this.disconnected=true;}});
 const media={readyState:0,duration:140,currentTime:0,loads:0,plays:0,pauses:0,load(){this.loads++;},play(){this.plays++;return play();},pause(){this.pauses++;},removeAttribute(name){delete this[name];}};
 const ctx={currentTime:0,destination:{},createGain(){const gain={...node(),gain:param()};gains.push(gain);return gain;},createMediaElementSource(value){assert.equal(value,media);return node();},decodeAudioData(){throw Error('Music must stream, never decode a complete song into a scene buffer');}};
 const score=createWalkingMusic(ctx,{random:()=>0,createMedia(){created++;return media;},
  idle:work=>{const id=++job;jobs.set(id,work);return id;},cancelIdle:id=>jobs.delete(id),schedule:work=>{const id=++job;timers.set(id,work);return id;},cancel:id=>timers.delete(id),onStats:s=>reports.push(s)});
 const position={x:0,y:60,z:0};
 function advance(seconds,{move=true,...state}={}){for(let i=0;i<seconds*10;i++){ctx.currentTime+=.1;if(move)position.x+=.5;score.update(position,state);}}
 function idle(){for(const [id,work]of jobs){jobs.delete(id);work();}}
 const ready=()=>{media.readyState=3;media.oncanplay();};
 return {score,ctx,media,position,advance,idle,ready,jobs,timers,reports,gains,get created(){return created;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('a score waits for gesture, walking and an idle load; silence separates distinct full pieces',async()=>{
 const f=fixture();f.advance(100);f.idle();assert.equal(f.created,0);assert.equal(f.media.loads,0);
 f.score.setEnabled(true);assert.equal(f.created,1);f.advance(51);assert.equal(f.media.loads,0,'movement only queues work; no file load in update');
 f.idle();assert.equal(f.media.loads,1);assert.equal(f.media.src,WALKING_MUSIC[0].url);f.ready();f.advance(25);await flush();assert.equal(f.media.plays,1);assert.equal(f.reports.at(-1).phase,'playing');
 const ramps=f.gains[0].gain.events.filter(e=>e[0]==='ramp');assert.ok(ramps.some(e=>e[1]>0));assert.equal(ramps.at(-1)[1],0,'a full piece fades before its natural end');
 f.media.onended();f.advance(239);await flush();assert.equal(f.media.plays,1,'at least four active minutes separate songs');
 f.advance(2);f.idle();assert.equal(f.media.src,WALKING_MUSIC[1].url);f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,2);assert.equal(f.created,1,'one native streaming element and decoder serve the whole playlist');
 f.score.dispose();
});

test('station waiting, paused menus and hidden time cannot consume the quiet interval',async()=>{
 const f=fixture();f.score.setEnabled(true);f.position.x=-300;f.advance(100,{move:false});f.idle();assert.equal(f.media.loads,0);
 f.position.x=0;f.advance(40);f.advance(300,{paused:true});f.idle();assert.equal(f.media.loads,0);
 f.score.pause(true);f.advance(300);f.idle();assert.equal(f.media.loads,0);f.score.pause(false);
 f.advance(36);f.idle();f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});

test('muting and checkbox changes preserve a piece position without layering or late asynchronous playback',async()=>{
 let resolve;const pending=new Promise(yes=>resolve=yes),f=fixture({play:()=>pending});f.score.setEnabled(true);f.advance(76);f.idle();f.ready();f.advance(.2);
 assert.equal(f.media.plays,1);f.score.setEnabled(false);resolve();await flush();assert.equal(f.reports.at(-1).active,0);assert.ok(f.media.pauses>=1);
 f.media.currentTime=42;f.score.setEnabled(true);f.advance(.2);await flush();assert.equal(f.media.currentTime,42);assert.equal(f.created,1);
 f.score.setMusicEnabled(false);f.advance(100);assert.equal(f.reports.at(-1).active,0);const plays=f.media.plays;
 f.score.setMusicEnabled(true);f.advance(.2);await flush();assert.equal(f.media.plays,plays+1);assert.equal(f.media.currentTime,42);f.score.dispose();
});

test('autoplay refusal is bounded and a real sound gesture may retry; disposal cancels idle work',async()=>{
 let blocked=true;const f=fixture({play:()=>blocked?Promise.reject(Object.assign(Error('gesture'),{name:'NotAllowedError'})):Promise.resolve()});
 f.score.setEnabled(true);f.advance(76);f.idle();f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);assert.equal(f.reports.at(-1).phase,'awaiting-gesture');
 f.advance(60);await flush();assert.equal(f.media.plays,1,'no play-promise storm during ordinary frames');blocked=false;
 f.score.setEnabled(true);f.advance(.2);await flush();assert.equal(f.media.plays,2);assert.equal(f.reports.at(-1).active,1);
 f.score.dispose();assert.equal(f.media.onended,null);assert.equal(f.media.src,undefined);f.advance(500);f.idle();assert.equal(f.created,1);
 const queued=fixture();queued.score.setEnabled(true);queued.advance(55);assert.equal(queued.jobs.size,1);queued.score.dispose();assert.equal(queued.jobs.size,0);queued.idle();assert.equal(queued.media.src,undefined);
});

test('load failures select another track after a quiet interval and never retry each frame',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(76);f.idle();f.media.onerror();f.advance(64);f.idle();assert.equal(f.media.loads,1);
 f.advance(27);f.idle();assert.equal(f.media.loads,2);assert.equal(f.media.src,WALKING_MUSIC[1].url);f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});


test('an exhausted playlist remains quiet without scheduling an idle callback every frame',()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(76);f.idle();f.media.onerror();
 f.advance(91);f.idle();f.media.onerror();assert.equal(f.media.loads,2);
 f.advance(91);assert.equal(f.jobs.size,0,'both failed files are terminal for this session');
 for(let i=0;i<1000;i++){f.advance(.2);assert.equal(f.jobs.size,0);f.idle();}
 assert.equal(f.media.loads,2);f.score.dispose();
});
