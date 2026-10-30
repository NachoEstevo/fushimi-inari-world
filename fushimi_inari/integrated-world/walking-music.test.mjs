import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkingMusic,WALKING_MUSIC} from './walking-music.mjs';

function fixture({play=()=>Promise.resolve(),random=()=>0}={}){
 const jobs=new Map(),timers=new Map(),reports=[],gains=[],connections=[];let job=0,created=0;
 const param=()=>({value:0,events:[],cancelScheduledValues(){},setValueAtTime(v,t){this.value=v;this.events.push(['value',v,t]);},linearRampToValueAtTime(v,t){this.events.push(['ramp',v,t]);}});
 const node=()=>({connect(other){connections.push(other);return other;},disconnect(){this.disconnected=true;}});
 const media={readyState:0,duration:140,currentTime:0,loads:0,plays:0,pauses:0,load(){this.loads++;},play(){this.plays++;return play();},pause(){this.pauses++;},removeAttribute(name){delete this[name];}};
 const ctx={currentTime:0,destination:{},createGain(){const gain={...node(),gain:param()};gains.push(gain);return gain;},createMediaElementSource(value){assert.equal(value,media);return node();},decodeAudioData(){throw Error('Music must stream, never decode a complete song into a scene buffer');}};
 const score=createWalkingMusic(ctx,{random,createMedia(){created++;return media;},
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
 f.score.setEnabled(true);assert.equal(f.created,1);f.advance(5);assert.equal(f.media.loads,0,'movement only queues work; no file load in update');
 f.idle();assert.equal(f.media.loads,1);assert.equal(f.media.src,WALKING_MUSIC[0].url);f.ready();f.advance(8);await flush();assert.equal(f.media.plays,1);assert.equal(f.reports.at(-1).phase,'playing');
 const ramps=f.gains[0].gain.events.filter(e=>e[0]==='ramp');assert.ok(ramps.some(e=>e[1]>0));assert.equal(ramps.at(-1)[1],0,'a full piece fades before its natural end');
 f.media.onended();f.advance(44);await flush();assert.equal(f.media.plays,1,'at least 45 eligible seconds separate songs');
 f.advance(2);f.idle();assert.equal(f.media.src,WALKING_MUSIC[1].url);f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,2);assert.equal(f.created,1,'one native streaming element and decoder serve the whole playlist');
 f.score.dispose();
});

test('station waiting, paused menus and hidden time cannot consume the quiet interval',async()=>{
 const f=fixture();f.score.setEnabled(true);f.position.x=-306;f.position.z=-180;f.advance(100,{move:false});f.idle();assert.equal(f.media.loads,0);
 f.position.x=0;f.position.z=0;f.advance(4);f.advance(300,{paused:true});f.idle();assert.equal(f.media.loads,0);
 f.score.pause(true);f.advance(300);f.idle();assert.equal(f.media.loads,0);f.score.pause(false);
 f.advance(9);f.idle();f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});

test('muting and checkbox changes preserve a piece position without layering or late asynchronous playback',async()=>{
 let resolve;const pending=new Promise(yes=>resolve=yes),f=fixture({play:()=>pending});f.score.setEnabled(true);f.advance(13);f.idle();f.ready();f.advance(.2);
 assert.equal(f.media.plays,1);f.score.setEnabled(false);resolve();await flush();assert.equal(f.reports.at(-1).active,0);assert.ok(f.media.pauses>=1);
 f.media.currentTime=42;f.score.setEnabled(true);f.advance(.2);await flush();assert.equal(f.media.currentTime,42);assert.equal(f.created,1);
 f.score.setMusicEnabled(false);f.advance(100);assert.equal(f.reports.at(-1).active,0);const plays=f.media.plays;
 f.score.setMusicEnabled(true);f.advance(.2);await flush();assert.equal(f.media.plays,plays+1);assert.equal(f.media.currentTime,42);f.score.dispose();
});

test('autoplay refusal is bounded and a real sound gesture may retry; disposal cancels idle work',async()=>{
 let blocked=true;const f=fixture({play:()=>blocked?Promise.reject(Object.assign(Error('gesture'),{name:'NotAllowedError'})):Promise.resolve()});
 f.score.setEnabled(true);f.advance(13);f.idle();f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);assert.equal(f.reports.at(-1).phase,'awaiting-gesture');
 f.advance(60);await flush();assert.equal(f.media.plays,1,'no play-promise storm during ordinary frames');blocked=false;
 f.score.setEnabled(true);f.advance(.2);await flush();assert.equal(f.media.plays,2);assert.equal(f.reports.at(-1).active,1);
 f.score.dispose();assert.equal(f.media.onended,null);assert.equal(f.media.src,undefined);f.advance(500);f.idle();assert.equal(f.created,1);
 const queued=fixture();queued.score.setEnabled(true);queued.advance(5);assert.equal(queued.jobs.size,1);queued.score.dispose();assert.equal(queued.jobs.size,0);queued.idle();assert.equal(queued.media.src,undefined);
});

test('load failures select another track after a quiet interval and never retry each frame',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();f.media.onerror();f.advance(36);f.idle();assert.equal(f.media.loads,1);
 f.advance(10);f.idle();assert.equal(f.media.loads,2);assert.equal(f.media.src,WALKING_MUSIC[1].url);f.ready();f.advance(.2);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});


test('an exhausted playlist remains quiet without scheduling an idle callback every frame',()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();f.media.onerror();
 f.advance(46);f.idle();f.media.onerror();assert.equal(f.media.loads,2);
 f.advance(46);assert.equal(f.jobs.size,0,'both failed files are terminal for this session');
 for(let i=0;i<1000;i++){f.advance(.2);assert.equal(f.jobs.size,0);f.idle();}
 assert.equal(f.media.loads,2);f.score.dispose();
});


test('both mapped approaches start First Light promptly, then preserve it across station and precinct regions',async()=>{
 for(const [x,z]of [[-157.407,10.342],[-199.024,-84.948],[-151.505,-87.319]]){
  const f=fixture();f.position.x=x;f.position.z=z;f.score.setEnabled(true);f.advance(5);f.idle();f.ready();
  f.advance(6);await flush();assert.equal(f.media.plays,0,'intro retains a brief quiet walk');
  f.advance(2);await flush();assert.equal(f.media.plays,1,`entry accompaniment at ${x},${z}`);
  f.media.currentTime=29;f.position.x=-180;f.position.z=40;f.advance(1,{move:false});await flush();
  assert.equal(f.media.plays,1);assert.equal(f.media.pauses,0,'returning across a region does not interrupt the piece');assert.equal(f.media.currentTime,29);f.score.dispose();
 }
});

test('JR and Keihan platform waiting cannot start music, while elapsed time alone cannot replace movement',async()=>{
 for(const [x,z]of [[-306,-180],[-180,40],[-166.8,37.4]]){
  const f=fixture();f.score.setEnabled(true);f.position.x=x;f.position.z=z;f.advance(100,{move:false});f.idle();
  assert.equal(f.media.loads,0,`no load while waiting at station ${x},${z}`);f.score.dispose();
 }
 for(const [x,z]of [[-306,-180],[-166.8,37.4]]){
  const f=fixture();f.score.setEnabled(true);f.position.x=x;
  for(let i=0;i<1000;i++){f.ctx.currentTime+=.1;f.position.z=z+Math.sin(i*.1)*4;f.score.update(f.position);}
  f.idle();assert.equal(f.media.loads,0,'walking around a platform or gate does not start the shrine score');f.score.dispose();
 }
 const f=fixture();f.score.setEnabled(true);f.advance(100,{move:false});f.idle();assert.equal(f.media.loads,0);
 f.advance(4.2);f.idle();f.ready();await flush();assert.equal(f.media.plays,1);f.score.dispose();
});

test('late canplay starts only when eligible and never wakes a muted, hidden or paused piece',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();assert.equal(f.media.plays,0);
 f.score.pause(true);f.ready();await flush();assert.equal(f.media.plays,0);f.score.pause(false);f.advance(.2);await flush();assert.equal(f.media.plays,1);
 f.score.setEnabled(false);f.ready();await flush();assert.equal(f.media.plays,1);f.score.setEnabled(true);f.advance(.2);await flush();assert.equal(f.media.plays,2);f.score.dispose();
 const late=fixture();late.score.setEnabled(true);late.advance(13);late.idle();late.ready();await flush();assert.equal(late.media.plays,1,'canplay fulfills an already eligible request without requiring another movement frame');late.score.dispose();
});

test('zero volume pauses and restores the same streaming position without a second decoder',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();f.ready();f.advance(.2);await flush();
 f.media.currentTime=31;f.score.setVolume(0);assert.ok(f.media.pauses>0);f.advance(100);await flush();assert.equal(f.media.plays,1);
 f.score.setVolume(.55);f.advance(.2);await flush();assert.equal(f.media.plays,2);assert.equal(f.media.currentTime,31);assert.equal(f.created,1);f.score.dispose();
});

test('random scheduling keeps the intro within 22 seconds and later quiet gaps within 75 seconds',async()=>{
 const f=fixture({random:()=>1});f.score.setEnabled(true);f.advance(15);f.idle();f.ready();f.advance(6);await flush();assert.equal(f.media.plays,0);
 f.advance(2);await flush();assert.equal(f.media.plays,1);f.media.onended();f.advance(74);f.idle();f.ready();await flush();assert.equal(f.media.plays,1);
 f.advance(2);await flush();assert.equal(f.media.plays,2);f.score.dispose();
});


test('unsupported playback falls back to the next file after a bounded quiet interval',async()=>{
 let unsupported=true;const f=fixture({play:()=>unsupported?Promise.reject(Object.assign(Error('format'),{name:'NotSupportedError'})):Promise.resolve()});
 f.score.setEnabled(true);f.advance(13);f.idle();f.ready();await flush();assert.equal(f.reports.at(-1).phase,'unavailable');
 f.advance(36);f.idle();assert.equal(f.media.loads,1);unsupported=false;f.advance(10);f.idle();f.ready();await flush();assert.equal(f.media.src,WALKING_MUSIC[1].url);assert.equal(f.media.plays,2);f.score.dispose();
});


for(const [name,x,z]of [['Omotesando',-149.06,10.742],['Urasando',-124.95,-84.325],['Urasando inner footway',-38.305,-49.771]]){
 test(`${name} entry brings the next distinct piece within three seconds after an outside walk`,async()=>{
  const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();f.ready();await flush();assert.equal(f.media.src,WALKING_MUSIC[0].url);
  f.media.onended();f.advance(2);f.position.x=x;f.position.z=z;f.advance(.2,{move:false});f.idle();f.ready();
  f.advance(2,{move:false});await flush();assert.equal(f.media.plays,1,'entry keeps a brief musical breath');
  f.advance(1.2,{move:false});await flush();assert.equal(f.media.plays,2,'entry shortens the pending 45-second quiet gap');assert.equal(f.media.src,WALKING_MUSIC[1].url);
  f.media.onended();
  for(let i=0;i<10;i++){f.position.z=z+10;f.advance(.2,{move:false});f.position.z=z;f.advance(.2,{move:false});}
  f.advance(10,{move:false});f.idle();await flush();assert.equal(f.media.plays,2,'boundary oscillation cannot cue a repeated song');f.score.dispose();
 });
}

test('entering a mapped approach with an active piece neither cuts it nor leaves a deferred repeated entry cue',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(13);f.idle();f.ready();await flush();f.media.currentTime=52;
 f.position.x=-149.06;f.position.z=10.742;f.advance(.2,{move:false});await flush();assert.equal(f.media.plays,1);assert.equal(f.media.pauses,0);assert.equal(f.media.currentTime,52);
 f.media.onended();f.position.z=30;f.advance(.2,{move:false});f.position.z=10.742;f.advance(10,{move:false});f.idle();assert.equal(f.media.loads,1,'active entry consumes the one-shot cue without deferring it until song end');f.score.dispose();
});

test('an approach cue preserves First Light and its minimum actual walking distance after teleporting',async()=>{
 const f=fixture();f.score.setEnabled(true);f.advance(.2,{move:false});f.position.x=-149.06;f.position.z=10.742;
 f.advance(10,{move:false});f.idle();assert.equal(f.media.loads,0,'teleport plus entry wait cannot replace twenty metres of walking');
 f.advance(4.2);f.idle();f.ready();await flush();assert.equal(f.media.plays,1);assert.equal(f.media.src,WALKING_MUSIC[0].url);f.score.dispose();
});

test('starting inside an approach keeps the normal introductory delay even after enough walking',async()=>{
 const f=fixture();f.position.x=-149.06;f.position.z=10.742;f.score.setEnabled(true);f.advance(5);f.idle();f.ready();f.advance(5);await flush();assert.equal(f.media.plays,0);
 f.advance(3);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});


test('the longest approach cue remains six eligible seconds and freezes while externally paused',async()=>{
 const f=fixture({random:()=>1});f.score.setEnabled(true);f.advance(23);f.idle();f.ready();await flush();f.media.onended();
 f.position.x=-149.06;f.position.z=10.742;f.advance(.2,{move:false});f.idle();f.ready();
 f.score.pause(true);f.advance(100,{move:false});await flush();assert.equal(f.media.plays,1);f.score.pause(false);
 f.advance(5.7,{move:false});await flush();assert.equal(f.media.plays,1);f.advance(.6,{move:false});await flush();assert.equal(f.media.plays,2);f.score.dispose();
});

test('walking outside while music is muted cannot arm an approach cue before starting inside the approach',async()=>{
 const f=fixture();f.score.setEnabled(true);f.score.setMusicEnabled(false);f.advance(100);f.position.x=-149.06;f.position.z=10.742;f.score.setMusicEnabled(true);
 f.advance(5);f.idle();f.ready();f.advance(5);await flush();assert.equal(f.media.plays,0,'muted outside time does not shorten the initial twelve-second interval');
 f.advance(3);await flush();assert.equal(f.media.plays,1);f.score.dispose();
});
