import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNAL_KEY,JOURNEY_STAMPS,createJourneyJournal,journalDiscoveryForInteraction} from './journey-journal.mjs';

function fixture(initial=null){
  let raw=initial,writes=0,time=1000;
  const storage={getItem:()=>raw,setItem:(key,value)=>{assert.equal(key,JOURNAL_KEY);raw=value;writes++;}};
  const journal=createJourneyJournal({storage,now:()=>time++});
  const locations=Object.fromEntries(JOURNEY_STAMPS.map((s,i)=>[s.id,[[i*200,i*40,0]]]));
  const at=id=>({position:[...locations[id][0]].map((v,i)=>v+(i===1?1.7:0)),locations});
  return {journal,at,storage,get raw(){return raw;},get writes(){return writes;},set raw(value){raw=value;}};
}

test('five distinct stamps complete the journey without optional notes or repeated rewards',()=>{
  const f=fixture();
  assert.equal(f.journal.collect('summit',f.at('summit')),false);
  for(const stamp of JOURNEY_STAMPS){
    assert.equal(f.journal.collect(stamp.id,f.at(stamp.id)),true);
    assert.equal(f.journal.collect(stamp.id,f.at(stamp.id)),false);
  }
  assert.equal(f.journal.snapshot().complete,true);assert.equal(f.writes,5);
  assert.deepEqual(f.journal.snapshot().discoveries,{});
});

test('collection rechecks real position, height, availability and modal/arrival blocking at click time',()=>{
  const f=fixture(),at=f.at('departure');
  assert.deepEqual(f.journal.available(at),['departure']);
  assert.equal(f.journal.collect('departure',{...at,blocked:true}),false);
  assert.equal(f.journal.collect('departure',{...at,position:[0,25,0]}),false);
  assert.equal(f.journal.collect('departure',{...at,position:[200,1.7,0]}),false);
  assert.equal(f.journal.collect('departure',{...at,position:[NaN,1.7,0]}),false);
  assert.equal(f.journal.collect('forged',at),false);assert.equal(f.writes,0);
  assert.equal(f.journal.collect('departure',at),true);
});

test('progress persists on reload; return visits can fill remaining pages in any order',()=>{
  const f=fixture();f.journal.collect('departure',f.at('departure'));f.journal.collect('summit',f.at('summit'));
  const restored=createJourneyJournal({storage:f.storage});
  assert.equal(restored.snapshot().complete,false);assert.ok(restored.snapshot().stamps.summit);
  assert.equal(restored.collect('okusha',f.at('okusha')),true);
  const exposed=restored.snapshot();exposed.stamps.romon=1;
  assert.equal(restored.snapshot().stamps.romon,undefined);
});

test('only completed authored actions yield optional notes; they do not grant main stamps',()=>{
  const f=fixture();assert.equal(f.journal.discover('bell'),false);
  f.journal.collect('departure',f.at('departure'));
  assert.equal(journalDiscoveryForInteraction({title:'Suzu · shrine bell'}),'bell');
  assert.equal(journalDiscoveryForInteraction({title:'Temizu · water ladle'}),'water');
  assert.equal(journalDiscoveryForInteraction({title:'Kumataka-sha (熊鷹社)'}),'shrine');
  assert.equal(journalDiscoveryForInteraction({title:'Ichinomine (一ノ峰)'}),'shrine');
  assert.equal(journalDiscoveryForInteraction({title:'Cumbre Suprema Ichinomine — Kami-no-sha'}),'shrine');
  assert.equal(journalDiscoveryForInteraction({title:'Shrine reception'}),null);
  assert.equal(journalDiscoveryForInteraction({title:'Keihan Fushimi-Inari · visitor'}),null);
  for(const id of ['bell','water','shrine']){assert.equal(f.journal.discover(id),true);assert.equal(f.journal.discover(id),false);}
  assert.equal(f.journal.discover('free-points'),false);assert.equal(f.journal.snapshot().complete,false);
  assert.equal(Object.keys(f.journal.snapshot().stamps).length,1);
});

test('corrupt or unknown storage and forged fields cannot crash loading or invent progress',()=>{
  for(const raw of ['{','null','{"version":2}',JSON.stringify({version:1,stamps:{departure:-1,romon:'yes',summit:Infinity,unknown:1},discoveries:{bell:NaN}})]){
    const f=fixture(raw);assert.deepEqual(f.journal.snapshot().stamps,{});assert.equal(f.journal.snapshot().complete,false);
  }
});

test('blocked reads or failed writes retain usable session progress with truthful save state',()=>{
  const f=fixture();
  const blocked=createJourneyJournal({storage:{getItem(){throw Error('blocked');}}});
  assert.equal(blocked.snapshot().persistent,false);
  assert.equal(blocked.collect('departure',f.at('departure')),true);
  const full=createJourneyJournal({storage:{getItem:()=>null,setItem(){throw Error('quota');}}});
  assert.equal(full.collect('departure',f.at('departure')),true);
  assert.equal(full.snapshot().persistent,false);assert.ok(full.snapshot().stamps.departure);
});

test('awards merge other-tab progress before saving and ignore malformed storage events',()=>{
  const f=fixture();f.journal.collect('departure',f.at('departure'));
  const other=createJourneyJournal({storage:f.storage});other.collect('romon',f.at('romon'));
  assert.equal(f.journal.collect('okusha',f.at('okusha')),true);
  const combined=JSON.parse(f.raw);assert.ok(combined.stamps.romon&&combined.stamps.okusha);
  f.journal.sync('{');f.journal.sync(JSON.stringify({version:1,stamps:{yotsu:100},discoveries:{water:200}}));
  assert.ok(f.journal.snapshot().stamps.yotsu);assert.equal(f.journal.snapshot().discoveries.water,200);
});
