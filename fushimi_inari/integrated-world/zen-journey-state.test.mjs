import test from 'node:test';
import assert from 'node:assert/strict';
import {createZenJourney,ZEN_JOURNEY_KEY} from './zen-journey-state.mjs';
import {JOURNAL_KEY} from './journey-journal.mjs';

const locations={station:[0,0,0],canal:[150,0,0],senbon:[300,10,0],yotsu:[500,100,0],tea:[510,100,0],summit:[900,200,0]};
const context=(place,extra={})=>({position:locations[place].map((n,i)=>n+(i===1?1.7:0)),mode:'walk',intent:'interact',...extra});
const photo=(place,extra={})=>({...context(place),direction:[-1,0,0],fov:45,width:1920,height:1080,weather:'clear',...extra});
function fixture(raw=null){let value=raw,time=1000;const storage={getItem:()=>value,setItem:(key,data)=>{assert.equal(key,ZEN_JOURNEY_KEY);value=data;}};const journey=createZenJourney({storage,locations,now:()=>time++});return {journey,storage,get raw(){return value;}};}

test('moments require an intentional completed walk interaction at the actual site',()=>{
 const f=fixture(),j=f.journey;
 assert.equal(j.recordMoment('tea',context('station')),false);
 assert.equal(j.recordMoment('cat',context('station',{intent:'proximity'})),false);
 assert.equal(j.recordMoment('cat',context('station',{mode:'fly'})),false);
 assert.equal(j.recordMoment('cat',context('station',{position:[0,30,0]})),false);
 assert.equal(j.recordMoment('forged',context('station')),false);
 assert.equal(j.recordMoment('cat',context('station')),true);
 assert.equal(j.recordMoment('cat',context('station')),false);
 assert.deepEqual(Object.keys(j.snapshot().moments),['cat']);j.dispose();
});

test('photo prompts and observations use real geometry, height, camera mode and framing',()=>{
 const f=fixture(),j=f.journey;
 assert.equal(j.recordPhoto(photo('yotsu',{mode:'fly'})),null);
 for(const change of [{position:[500,160,0]},{direction:[1,0,0]},{direction:[0,1,0]},{fov:20}])assert.deepEqual(j.recordPhoto(photo('yotsu',change)).promptIds,[]);
 assert.deepEqual(j.recordPhoto(photo('yotsu')).promptIds,['kyoto-view']);
 assert.equal(j.recordMoment('sketch-city',photo('yotsu',{intent:'interact'})),false);
 assert.equal(j.recordMoment('sketch-city',photo('yotsu',{intent:'observe'})),true);
 assert.equal(j.recordMoment('sketch-city',photo('yotsu',{intent:'observe'})),false);
 const aimed=createZenJourney({locations:{...locations,senbon:{point:locations.senbon,target:[400,10,0]}}});
 assert.deepEqual(aimed.recordPhoto(photo('senbon')).promptIds,[]);
 assert.deepEqual(aimed.recordPhoto(photo('senbon',{direction:[1,0,0]})).promptIds,['gate-rhythm']);j.dispose();aimed.dispose();
});

test('free ending is optional and completes only after a validated return event',()=>{
 const f=fixture(),j=f.journey;assert.equal(j.finishVisit(),false);
 assert.equal(j.recordMoment('return',context('summit')),false);
 assert.equal(j.recordMoment('return',context('station')),true);assert.equal(j.finishVisit(),true);
 assert.equal(j.finishVisit(),false);assert.equal(j.recordMoment('return',context('station')),false);
 assert.equal(j.beginVisit(),true);assert.equal(j.snapshot().visit.number,2);
 assert.equal(j.finishVisit(),false);assert.equal(j.recordMoment('return',context('station')),true);assert.equal(j.finishVisit(),true);j.dispose();
});

test('Aki story and earned prompts survive bounded photo eviction and reloading',()=>{
 const f=fixture(),j=f.journey;j.recordMoment('aki',context('station'));assert.equal(j.snapshot().story.stage,1);
 j.recordPhoto(photo('yotsu'));j.recordMoment('tea',context('tea'));assert.equal(j.snapshot().story.stage,3);
 j.recordMoment('return',context('station'));j.finishVisit();assert.equal(j.snapshot().story.complete,true);
 for(let i=0;i<20;i++)j.recordPhoto(photo('station',{thumbnailId:`thumb-${i}`}));
 assert.equal(j.snapshot().photos.length,12);assert.equal(j.snapshot().story.complete,true);
 const restored=createZenJourney({storage:f.storage,locations});assert.equal(restored.snapshot().story.complete,true);assert.equal(restored.snapshot().photos.length,12);
 const snapshot=restored.snapshot();snapshot.photos[0].position[0]=99999;snapshot.moments.cat=1;assert.notEqual(restored.snapshot().photos[0].position[0],99999);assert.equal(restored.snapshot().moments.cat,undefined);j.dispose();restored.dispose();
});

test('malformed data, unavailable storage and disposed callbacks fail safely',()=>{
 for(const raw of ['{','null',JSON.stringify({version:9}),JSON.stringify({version:2,moments:{cat:-1,arbitrary:10},photos:[{id:'fake'}]})]){const f=fixture(raw);assert.deepEqual(f.journey.snapshot().moments,{});assert.deepEqual(f.journey.snapshot().photos,[]);f.journey.dispose();}
 const j=createZenJourney({locations,storage:{getItem(){throw Error('blocked');}}});assert.equal(j.snapshot().persistent,false);assert.equal(j.recordMoment('cat',context('station')),true);
 let calls=0;const unsubscribe=j.subscribe(()=>calls++);j.setWeather('drizzle');unsubscribe();j.setWeather('clear');assert.equal(calls,1);j.dispose();assert.equal(j.recordMoment('map',context('station')),false);assert.equal(j.setIntention('summit'),false);
 const full=createZenJourney({locations,storage:{getItem:()=>null,setItem(){throw Error('full');}}});full.recordMoment('cat',context('station'));assert.equal(full.snapshot().persistent,false);assert.ok(full.snapshot().moments.cat);full.dispose();
});

test('other-tab progress merges before writes and newer visit resets remain authoritative',()=>{
 const f=fixture(),a=f.journey,b=createZenJourney({locations,storage:f.storage,now:()=>2000});
 a.recordMoment('cat',context('station'));b.recordMoment('map',context('station'));a.setIntention('views');
 let saved=JSON.parse(f.raw);assert.ok(saved.moments.cat&&saved.moments.map);assert.equal(saved.intention,'views');
 b.recordMoment('return',context('station'));b.finishVisit();a.beginVisit();assert.equal(a.snapshot().visit.number,2);
 b.setWeather('drizzle');saved=JSON.parse(f.raw);assert.equal(saved.visit.finishedAt,0);assert.equal(saved.visit.number,2);a.dispose();b.dispose();
});

test('observe records departure without awarding a moment and missing locations fail closed',()=>{
 const j=createZenJourney({locations});assert.equal(j.observe([120,1.7,0],{mode:'fly'}),false);assert.equal(j.observe([100,1.7,0],{mode:'walk'}),false);assert.equal(j.observe([120,1.7,0],{mode:'walk'}),true);assert.deepEqual(j.snapshot().moments,{});
 const missing=createZenJourney();assert.equal(missing.recordMoment('cat',context('station')),false);assert.deepEqual(missing.recordPhoto(photo('yotsu')).promptIds,[]);j.dispose();missing.dispose();
});

test('an explicit postcard prop location is accepted without broadening other station moments',()=>{
 const j=createZenJourney({locations:{...locations,postcard:[200,0,0]}}),details={position:[200,1.7,0],mode:'walk',intent:'interact'};
 assert.equal(j.recordMoment('cat',details),false);assert.equal(j.recordMoment('postcard',details),true);j.dispose();
});

test('Aki encounter and physical postcard stamping remain independent completions',()=>{
 const f=fixture(),j=f.journey;assert.equal(j.recordMoment('postcard',context('station')),true);assert.equal(j.snapshot().story.stage,0);
 assert.equal(j.recordMoment('aki',context('station')),true);assert.equal(j.snapshot().story.stage,1);assert.ok(j.snapshot().moments.postcard);
 const other=fixture();other.journey.recordMoment('aki',context('station'));assert.equal(other.journey.snapshot().moments.postcard,undefined);assert.equal(other.journey.recordMoment('postcard',context('station')),true);j.dispose();other.journey.dispose();
});

test('an actual distant drink machine is eligible only within its narrow local reach',()=>{
 const j=createZenJourney({locations:{...locations,drink:[[2000,0,0],[2100,5,0]]}});
 assert.equal(j.recordMoment('drink',{position:[2004,1.7,0],mode:'walk',intent:'interact'}),false);
 assert.equal(j.recordMoment('drink',{position:[2000,1.7,0],mode:'walk',intent:'proximity'}),false);
 assert.equal(j.recordMoment('drink',{position:[2000,1.7,0],mode:'fly',intent:'interact'}),false);
 assert.equal(j.recordMoment('drink',{position:[2102,6.7,0],mode:'walk',intent:'interact'}),true);j.dispose();
 for(const place of ['station','canal']){const fallback=createZenJourney({locations});assert.equal(fallback.recordMoment('drink',context(place)),true);fallback.dispose();}
});

test('a return from an earlier free visit cannot finish a later Aki story on the mountain',()=>{
 const f=fixture(),j=f.journey;j.recordMoment('return',context('station'));j.finishVisit();j.beginVisit();
 j.recordMoment('aki',context('station'));j.recordPhoto(photo('yotsu'));j.recordMoment('tea',context('tea'));
 assert.equal(j.snapshot().story.stage,3);assert.equal(j.snapshot().story.complete,false);
 j.recordMoment('return',context('station'));j.finishVisit();assert.equal(j.snapshot().story.complete,true);j.dispose();
});

test('photo eligibility reuses capture validation without awarding, persisting or notifying',()=>{
 const f=fixture(),j=f.journey;let calls=0;j.subscribe(()=>calls++);const before=j.snapshot(),raw=f.raw;
 assert.equal(j.canRecordPhoto(photo('station')),true);
 for(const change of [{mode:'orbit'},{mode:'fly'},{position:[NaN,1.7,0]},{width:0},{height:Infinity},{weather:'storm'},{fov:120},{direction:null}])assert.equal(j.canRecordPhoto(photo('station',change)),false);
 assert.deepEqual(j.snapshot(),before);assert.equal(f.raw,raw);assert.equal(calls,0);assert.ok(j.recordPhoto(photo('station')));assert.equal(calls,1);j.dispose();assert.equal(j.canRecordPhoto(photo('station')),false);
});

test('train photographs keep actual album metadata and reload within the cap without earning walking prompts',()=>{
 const f=fixture(),j=f.journey,details=photo('yotsu',{mode:'train',thumbnailId:'train-window-preview'});
 assert.equal(j.canRecordPhoto(details),true);const first=j.recordPhoto(details);assert.equal(first.mode,'train');assert.equal(first.thumbnailId,'train-window-preview');assert.deepEqual(first.promptIds,[]);assert.deepEqual(j.snapshot().photoPrompts,{});
 assert.equal(j.recordMoment('sketch-city',{...details,intent:'observe'}),false);
 const malformed=JSON.parse(f.raw);malformed.photos[0].promptIds=['kyoto-view'];const cleaned=createZenJourney({locations,storage:{getItem:()=>JSON.stringify(malformed)}});assert.deepEqual(cleaned.snapshot().photos[0].promptIds,[]);cleaned.dispose();
 let restored=createZenJourney({locations,storage:f.storage});assert.equal(restored.snapshot().photos[0].mode,'train');assert.equal(restored.snapshot().photos[0].thumbnailId,'train-window-preview');restored.dispose();
 for(let i=0;i<16;i++)j.recordPhoto({...details,thumbnailId:`train-window-${i}`});assert.equal(j.snapshot().photos.length,12);assert.ok(j.snapshot().photos.every(p=>p.mode==='train'&&p.promptIds.length===0));
 restored=createZenJourney({locations,storage:f.storage});assert.equal(restored.snapshot().photos.length,12);assert.deepEqual(restored.snapshot().photoPrompts,{});assert.ok(restored.snapshot().photos.every(p=>p.mode==='train'));assert.equal(restored.canRecordPhoto({...details,mode:'orbit'}),false);assert.equal(restored.canRecordPhoto({...details,mode:'fly'}),false);j.dispose();restored.dispose();
});

test('unchanged persistence payloads are read for concurrency but decoded only once',()=>{
 const original=JSON.parse;let parses=0,reads=0,raw=null;JSON.parse=(...args)=>{parses++;return original(...args);};
 let journey;
 try{
  journey=createZenJourney({locations,storage:{getItem(){reads++;return raw;},setItem(_,value){raw=value;}}});
  for(let i=0;i<50;i++)journey.observe([0,1.7,0],{mode:'walk'});
  assert.equal(reads,51);assert.equal(parses,1,'initial null payload is cached too');
  assert.equal(journey.recordMoment('cat',context('station')),true);
  for(let i=0;i<50;i++)journey.observe([0,1.7,0],{mode:'walk'});
  assert.equal(reads,102);assert.equal(parses,1,'a successful write updates the cache without reparsing its own payload');
  raw='{';journey.observe([0,1.7,0],{mode:'walk'});journey.observe([0,1.7,0],{mode:'walk'});assert.equal(parses,2,'malformed payloads are cached and safely ignored');
 }finally{JSON.parse=original;journey?.dispose();}
});

test('cached storage events retain unions through delayed events and newer cross-tab visits',()=>{
 const previous=globalThis.window,listeners=new Set();globalThis.window={addEventListener(name,fn){if(name==='storage')listeners.add(fn);},removeEventListener(name,fn){listeners.delete(fn);}};
 let raw=null,time=1000,a,b,notifications=0;const storage={getItem:()=>raw,setItem:(_,value)=>raw=value};
 try{
  a=createZenJourney({locations,storage,now:()=>time++});b=createZenJourney({locations,storage,now:()=>time++});a.subscribe(()=>notifications++);
  a.recordMoment('cat',context('station'));const old=raw;b.recordMoment('map',context('station'));const union=raw;
  const event=value=>{for(const fn of listeners)fn({key:ZEN_JOURNEY_KEY,newValue:value});};
  event(union);const count=notifications;event(union);assert.equal(notifications,count,'identical events do not rerender subscribers');
  a.setIntention('views');const current=raw;event(old);a.observe([0,1.7,0],{mode:'walk'});
  assert.equal(raw,current);assert.equal(a.snapshot().intention,'views');assert.ok(a.snapshot().moments.map&&a.snapshot().moments.cat);
  b.recordMoment('return',context('station'));b.finishVisit();b.beginVisit();event(old);a.setWeather('drizzle');
  const saved=JSON.parse(raw);assert.equal(saved.visit.number,2);assert.equal(saved.visit.finishedAt,0);assert.ok(saved.moments.cat&&saved.moments.map);assert.equal(saved.weather,'drizzle');
 }finally{a?.dispose();b?.dispose();globalThis.window=previous;}
});

test('an optional walk can be changed or dismissed without altering v2 accomplishments',()=>{
 const f=fixture(JSON.stringify({version:2,moments:{aki:20},photoPrompts:{'canal-light':30},sketches:{'sketch-gates':40},photos:[]})),j=f.journey;
 assert.equal(j.snapshot().activeWalk,'none');
 assert.equal(j.setActiveWalk('station'),true);assert.equal(j.snapshot().activeWalk,'station');
 assert.equal(j.setActiveWalk('missing'),false);assert.equal(j.setActiveWalk('none'),true);
 const saved=JSON.parse(f.raw);assert.equal(saved.version,2);assert.equal(saved.activeWalk,'none');
 assert.deepEqual(saved.moments,{aki:20});assert.deepEqual(saved.photoPrompts,{'canal-light':30});assert.deepEqual(saved.sketches,{'sketch-gates':40});
 const restored=createZenJourney({storage:f.storage,locations});assert.equal(restored.snapshot().activeWalk,'none');assert.deepEqual(restored.snapshot().sketches,{'sketch-gates':40});j.dispose();restored.dispose();
});

test('choosing a walk preserves existing saved photos and the separate seal journal',()=>{
 const savedPhoto={id:'saved-photo',createdAt:41,position:[150,1.7,0],direction:[-1,0,0],fov:45,width:1920,height:1080,mode:'walk',weather:'clear',thumbnailId:'saved-thumbnail',promptIds:['canal-light']};
 const seals='{"version":1,"seals":{"old-seal":7}}',data=new Map([[ZEN_JOURNEY_KEY,JSON.stringify({version:2,photos:[savedPhoto],photoPrompts:{'canal-light':41}})],[JOURNAL_KEY,seals]]);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const journey=createZenJourney({storage,locations,now:()=>1000});journey.setActiveWalk('station');
 const restored=createZenJourney({storage,locations});assert.deepEqual(restored.snapshot().photos,[savedPhoto]);assert.equal(data.get(JOURNAL_KEY),seals);
 journey.dispose();restored.dispose();
});

test('quiet walks recognize real actions in any order and do not complete from proximity',()=>{
 const f=fixture(),j=f.journey,walk=id=>j.snapshot().walks.find(item=>item.id===id);
 assert.equal(walk('station').next,'Meet Aki at the station.');assert.equal(walk('station').complete,false);
 j.observe([150,1.7,0],{mode:'walk'});assert.equal(walk('station').complete,false);
 j.recordPhoto(photo('canal'));j.recordMoment('drink',context('station'));assert.equal(walk('station').next,'Meet Aki at the station.');
 j.recordMoment('aki',context('station'));assert.equal(walk('station').complete,true);assert.equal(walk('station').next,null);
 j.recordMoment('sketch-gates',photo('senbon',{intent:'observe'}));assert.equal(walk('gates').complete,false);
 j.recordPhoto(photo('senbon'));assert.equal(walk('gates').complete,true);
 j.dispose();
});

test('mountain walk requires a completed return after its other moments in this visit',()=>{
 const f=fixture(),j=f.journey,walk=()=>j.snapshot().walks.find(item=>item.id==='mountain');
 j.recordMoment('return',context('station'));j.finishVisit();j.beginVisit();
 j.recordMoment('tea',context('tea'));j.recordPhoto(photo('yotsu'));assert.equal(walk().next,'Return by train.');assert.equal(walk().complete,false);
 assert.equal(j.recordMoment('return',context('station')),true);assert.equal(walk().complete,false,'boarding or a pending train is not a finished visit');
 j.finishVisit();assert.equal(walk().complete,true);
 j.beginVisit();assert.equal(walk().complete,false,'an earlier visit cannot supply this visit’s return');assert.equal(walk().next,'Return by train.');j.dispose();
});

test('walk selection merges across tabs and malformed stored selections are ignored',()=>{
 const invalid=fixture(JSON.stringify({version:2,activeWalk:'unexpected',settingsAt:{activeWalk:9}}));assert.equal(invalid.journey.snapshot().activeWalk,'none');invalid.journey.dispose();
 const f=fixture(),a=f.journey,b=createZenJourney({locations,storage:f.storage,now:()=>2000});
 a.setActiveWalk('gates');b.recordMoment('cat',context('station'));assert.equal(b.snapshot().activeWalk,'gates');
 b.setActiveWalk('mountain');a.setWeather('drizzle');const saved=JSON.parse(f.raw);
 assert.equal(saved.activeWalk,'mountain');assert.ok(saved.moments.cat);assert.equal(saved.weather,'drizzle');a.dispose();b.dispose();
});

test('simultaneous walk selections converge when two tabs use the same timestamp',()=>{
 const previous=globalThis.window,listeners=new Set();globalThis.window={addEventListener(_,fn){listeners.add(fn);},removeEventListener(_,fn){listeners.delete(fn);}};
 const station=JSON.stringify({version:2,activeWalk:'station',settingsAt:{activeWalk:1000}}),gates=JSON.stringify({version:2,activeWalk:'gates',settingsAt:{activeWalk:1000}});
 let raw=station,a,b;const storage={getItem:()=>raw,setItem:(_,value)=>raw=value};
 try{
  a=createZenJourney({locations,storage});raw=gates;b=createZenJourney({locations,storage});
  for(const fn of listeners)fn({key:ZEN_JOURNEY_KEY,newValue:station});for(const fn of listeners)fn({key:ZEN_JOURNEY_KEY,newValue:gates});
  assert.equal(a.snapshot().activeWalk,b.snapshot().activeWalk);
  a.setWeather('drizzle');b.setIntention('views');assert.equal(JSON.parse(raw).activeWalk,a.snapshot().activeWalk);
 }finally{a?.dispose();b?.dispose();globalThis.window=previous;}
});

test('unreasonable stored timestamps cannot poison new progress or its reload',()=>{
 const future=Number.MAX_SAFE_INTEGER,hostile={version:2,activeWalk:'gates',intention:'views',weather:'drizzle',settingsAt:{activeWalk:future,intention:future,weather:future},
  moments:{cat:future,return:future},sketches:{'sketch-gates':future},photoPrompts:{'kyoto-view':future},visit:{number:1,startedAt:future,finishedAt:future,updatedAt:future},
  photos:[{...photo('canal'),id:'bad-photo',createdAt:future}]};
 const f=fixture(JSON.stringify(hostile)),j=f.journey;
 assert.equal(j.snapshot().activeWalk,'none');assert.deepEqual(j.snapshot().moments,{});assert.deepEqual(j.snapshot().photos,[]);
 assert.equal(j.setWeather('drizzle'),true);assert.equal(j.setActiveWalk('station'),true);assert.equal(j.recordMoment('aki',context('station')),true);assert.ok(j.recordPhoto(photo('canal')));
 const restored=createZenJourney({storage:f.storage,locations}),state=restored.snapshot();
 assert.equal(state.weather,'drizzle');assert.equal(state.activeWalk,'station');assert.ok(state.moments.aki);assert.equal(state.photos.length,1);assert.ok(state.photoPrompts['canal-light']);
 j.dispose();restored.dispose();
});

test('an invalid supplied clock cannot write unsafe timestamps',()=>{
 let raw=null;const storage={getItem:()=>raw,setItem:(_,value)=>raw=value};
 const j=createZenJourney({storage,locations,now:()=>Number.MAX_SAFE_INTEGER});
 assert.equal(j.recordMoment('aki',context('station')),true);assert.equal(j.setWeather('drizzle'),true);j.dispose();
 const restored=createZenJourney({storage,locations});assert.ok(restored.snapshot().moments.aki);assert.equal(restored.snapshot().weather,'drizzle');restored.dispose();
});

test('visit start and finish timestamps advance the logical clock after inconsistent v2 data',()=>{
 const later=Date.now()+100000;
 const unfinished=fixture(JSON.stringify({version:2,visit:{number:2,startedAt:later,updatedAt:1,finishedAt:0}}));
 assert.equal(unfinished.journey.recordMoment('return',context('station')),true);assert.equal(unfinished.journey.finishVisit(),true);unfinished.journey.dispose();
 const finished=fixture(JSON.stringify({version:2,visit:{number:2,startedAt:100,updatedAt:1,finishedAt:later}}));
 assert.equal(finished.journey.beginVisit(),true);assert.ok(finished.journey.snapshot().visit.startedAt>later);finished.journey.dispose();
});

test('timestamps at the future acceptance boundary leave room for new progress',()=>{
 const realNow=Date.now;Date.now=()=>1000000;
 try{
  const boundary=Date.now()+100*366*24*60*60*1000;
  const f=fixture(JSON.stringify({version:2,activeWalk:'gates',settingsAt:{activeWalk:boundary}}));
  assert.equal(f.journey.setWeather('drizzle'),true);assert.equal(f.journey.recordMoment('aki',context('station')),true);
  f.journey.dispose();const restored=createZenJourney({storage:f.storage,locations,now:()=>1000});
  assert.equal(restored.snapshot().activeWalk,'gates');assert.equal(restored.snapshot().weather,'drizzle');assert.ok(restored.snapshot().moments.aki);
  assert.equal(restored.setIntention('views'),true);restored.dispose();
  const again=createZenJourney({storage:f.storage,locations});assert.equal(again.snapshot().intention,'views');assert.ok(again.snapshot().moments.aki);again.dispose();
 }finally{Date.now=realNow;}
});

test('a delayed corrupt cross-tab event cannot restore an older walk selection',()=>{
 const realNow=Date.now,previous=globalThis.window,listeners=new Set();let wall=1000000;Date.now=()=>wall;
 globalThis.window={addEventListener(_,fn){listeners.add(fn);},removeEventListener(_,fn){listeners.delete(fn);}};
 const stale=JSON.stringify({version:2,activeWalk:'gates',settingsAt:{activeWalk:Date.now()+100*366*24*60*60*1000}});
 let raw=stale,a,b;const storage={getItem:()=>raw,setItem:(_,value)=>raw=value};
 try{
  a=createZenJourney({storage,locations,now:()=>1000});b=createZenJourney({storage,locations,now:()=>1000});
  assert.equal(a.setActiveWalk('station'),true);wall+=5000;for(const fn of listeners)fn({key:ZEN_JOURNEY_KEY,newValue:stale});
  assert.equal(a.snapshot().activeWalk,'station');b.setWeather('drizzle');a.setIntention('views');
  assert.equal(JSON.parse(raw).activeWalk,'station');
 }finally{a?.dispose();b?.dispose();globalThis.window=previous;Date.now=realNow;}
});
