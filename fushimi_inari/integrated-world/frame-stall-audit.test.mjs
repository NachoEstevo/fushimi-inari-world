import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installFrameStallAudit} from './frame-stall-audit.mjs';

function observerFixture(types=['longtask','long-animation-frame']){
  const instances=[];
  class Observer {
    static supportedEntryTypes=types;
    constructor(callback){this.callback=callback;this.observed=[];this.disconnected=0;instances.push(this);}
    observe(options){this.observed.push(options);}
    disconnect(){this.disconnected++;}
    emit(entries){this.callback({getEntries:()=>entries});}
  }
  return {Observer,instances};
}

test('records recent entries in chronological order and bounds history',()=>{
  const f=observerFixture(),audit=installFrameStallAudit({Observer:f.Observer,limit:2});
  assert.deepEqual(audit.stats.supported,['longtask','long-animation-frame']);
  assert.equal(f.instances.length,2);
  f.instances[0].emit([{entryType:'longtask',startTime:30,duration:70},{entryType:'longtask',startTime:10,duration:60},{entryType:'longtask',startTime:20,duration:50}]);
  assert.deepEqual(audit.stats.recent.map(e=>e.startTime),[20,30]);
  assert.equal(audit.stats.recent[1].duration,70);
});

test('sanitizes and bounds script attribution without retaining browser objects',()=>{
  const f=observerFixture(),audit=installFrameStallAudit({Observer:f.Observer});
  const scripts=Array.from({length:10},(_,i)=>({startTime:i,duration:20,executionStart:2,sourceURL:'https://example.com/a.js?secret=1#frag',sourceFunctionName:'f'.repeat(200),invoker:'i'.repeat(200)}));
  f.instances[1].emit([{entryType:'long-animation-frame',startTime:2,duration:80,blockingDuration:30,renderStart:10,styleAndLayoutStart:11,scripts}]);
  const record=audit.stats.recent[0];
  assert.equal(record.blockingDuration,30);assert.equal(record.renderStart,10);assert.equal(record.styleAndLayoutStart,11);
  assert.equal(record.scripts.length,8);assert.equal(record.scripts[0].sourceURL,'https://example.com/a.js');
  assert.equal(record.scripts[0].sourceFunctionName.length,160);assert.equal(record.scripts[0].invoker.length,160);
  scripts[0].duration=999;assert.equal(record.scripts[0].duration,20);
});

test('reset ignores earlier delivered entries and dispose stops late callbacks',()=>{
  let clock=100;const f=observerFixture(),audit=installFrameStallAudit({Observer:f.Observer,now:()=>clock});
  f.instances[0].emit([{entryType:'longtask',startTime:90,duration:50}]);audit.reset();
  f.instances[0].emit([{entryType:'longtask',startTime:99,duration:60},{entryType:'longtask',startTime:100,duration:70}]);
  assert.deepEqual(audit.stats.recent.map(e=>e.startTime),[100]);
  audit.dispose();audit.dispose();f.instances[0].emit([{entryType:'longtask',startTime:120,duration:80}]);
  assert.deepEqual(audit.stats.recent.map(e=>e.startTime),[100]);assert.ok(f.instances.every(o=>o.disconnected===1));
});

test('unsupported or rejected observer is safe',()=>{
  assert.deepEqual(installFrameStallAudit({Observer:null}).stats,{supported:[],recent:[]});
  const f=observerFixture(['longtask']);f.Observer.prototype.observe=function(){throw Error('unsupported');};
  const audit=installFrameStallAudit({Observer:f.Observer});assert.deepEqual(audit.stats.supported,[]);audit.dispose();
});
