import test from 'node:test';
import assert from 'node:assert/strict';
import {createSectorPreparation,createRenderPreparationQueue} from './sector-preparation.mjs';

test('source loading can await renderer work outside checkpoint ownership and uses the latest completed quality',{timeout:1000},async()=>{
 const queue=createRenderPreparationQueue(),events=[],reports=[];let quality='balanced',sourceCurrent;
 const service=createSectorPreparation({run:queue.run,report:value=>reports.push(value),
  prepareSources:async(destination,stage,isCurrent)=>{sourceCurrent=isCurrent;await stage('deferred sources',()=>queue.run(async()=>{events.push('source compile');}));},
  prepare:async()=>{assert.equal(queue.busy,true);events.push('checkpoint '+quality);},commit:()=>events.push('commit')});
 const checkpoint=service.request({id:'gate'});
 const changed=queue.run(async()=>{quality='high';events.push('quality');});
 await Promise.all([checkpoint,changed]);await queue.awaitIdle();
 assert.deepEqual(events,['quality','source compile','checkpoint high','commit']);assert.equal(sourceCurrent(),true);
 assert.equal(reports.at(-1).history[0].status,'ready');assert.equal(reports.at(-1).history[0].stages[0].name,'deferred sources');assert.equal(service.busy,false);
});

test('source supersession skips the old checkpoint and source failure reports its stage without poisoning retry',async()=>{
 const queue=createRenderPreparationQueue(),events=[];let release,entered,fail=false,report;
 const started=new Promise(resolve=>entered=resolve);
 const service=createSectorPreparation({run:queue.run,report:value=>report=value,
  prepareSources:(destination,stage,isCurrent)=>stage('source geometry',async()=>{
   if(destination.id==='old'){entered();await new Promise(resolve=>release=resolve);assert.equal(isCurrent(),false);}
   if(fail)throw Error('source offline');
  }),prepare:async destination=>events.push('prepare '+destination.id),commit:destination=>events.push('commit '+destination.id)});
 const old=service.request({id:'old'});await started;const current=service.request({id:'new'});release();
 assert.deepEqual(await Promise.all([old,current]),[false,true]);assert.deepEqual(events,['prepare new','commit new']);assert.equal(report.history[0].status,'superseded');
 fail=true;await assert.rejects(service.request({id:'failed'}),/source offline/);assert.equal(service.busy,false);assert.equal(report.history.at(-1).status,'failed');assert.equal(report.history.at(-1).stages[0].name,'source geometry');
 fail=false;await service.request({id:'retry'});assert.equal(report.history.at(-1).status,'ready');assert.equal(events.at(-1),'commit retry');
});

test('shared renderer queue owns complete checkpoint preparation and commit before a quality change',async()=>{
 const events=[],busy=[],queue=createRenderPreparationQueue({onBusy:value=>busy.push(value)});
 let releasePrepare,releaseCommit,releaseQuality,enteredPrepare,enteredCommit,enteredQuality;
 const preparing=new Promise(resolve=>enteredPrepare=resolve),committing=new Promise(resolve=>enteredCommit=resolve),qualityStarted=new Promise(resolve=>enteredQuality=resolve);
 const service=createSectorPreparation({run:queue.run,prepare:async()=>{events.push('prepare');enteredPrepare();await new Promise(resolve=>releasePrepare=resolve);},commit:async()=>{events.push('commit');enteredCommit();await new Promise(resolve=>releaseCommit=resolve);events.push('committed');}});
 const checkpoint=service.request({id:'destination'});await preparing;
 const quality=queue.run(async()=>{events.push('quality');enteredQuality();await new Promise(resolve=>releaseQuality=resolve);events.push('quality ready');});
 assert.equal(queue.pending,2);assert.equal(queue.busy,true);releasePrepare();await committing;assert.deepEqual(events,['prepare','commit']);
 releaseCommit();await checkpoint;await qualityStarted;assert.deepEqual(events,['prepare','commit','committed','quality']);assert.equal(queue.busy,true);
 releaseQuality();await quality;await queue.awaitIdle();assert.equal(queue.pending,0);assert.equal(service.busy,false);assert.deepEqual(busy,[true,false]);
});

test('checkpoint tokens change immediately while renderer ownership is queued and only latest destination prepares',async()=>{
 const events=[],queue=createRenderPreparationQueue();let release,entered;
 const started=new Promise(resolve=>entered=resolve),quality=queue.run(async()=>{entered();await new Promise(resolve=>release=resolve);});await started;
 const service=createSectorPreparation({run:queue.run,prepare:async destination=>events.push('prepare '+destination.id),commit:destination=>events.push('commit '+destination.id)});
 const first=service.request({id:'a'});await Promise.resolve();const second=service.request({id:'b'}),third=service.request({id:'c'});
 assert.equal(service.busy,true);assert.deepEqual(events,[]);release();await quality;
 assert.deepEqual(await Promise.all([first,second,third]),[false,false,true]);await queue.awaitIdle();assert.deepEqual(events,['prepare c','commit c']);assert.equal(service.busy,false);
});

test('renderer queue preserves FIFO after synchronous and asynchronous failures and awaitIdle absorbs rejected jobs',async()=>{
 const queue=createRenderPreparationQueue(),events=[];
 const first=queue.run(()=>{events.push('sync');throw Error('sync failed');});
 const second=queue.run(async()=>{events.push('async');throw Error('async failed');});
 const third=queue.run(()=>{events.push('ready');return 42;});assert.equal(queue.pending,3);
 const failures=Promise.all([assert.rejects(first,/sync failed/),assert.rejects(second,/async failed/)]);
 await queue.awaitIdle();await failures;assert.equal(await third,42);assert.deepEqual(events,['sync','async','ready']);assert.equal(queue.busy,false);
 const service=createSectorPreparation({run:queue.run,prepare:async()=>{throw Error('checkpoint failed');},commit:()=>assert.fail('failed preparation cannot commit')});
 await assert.rejects(service.request({id:'broken'}),/checkpoint failed/);await queue.awaitIdle();assert.equal(service.busy,false);assert.equal(await queue.run(()=>7),7);
});
test('destination waits for preparation and only latest queued destination commits',async()=>{
 let release;const events=[],busy=[];
 const service=createSectorPreparation({prepare:async d=>{events.push('prepare '+d.id);if(d.id==='a')await new Promise(r=>release=r);},commit:d=>events.push('commit '+d.id),onBusy:v=>busy.push(v)});
 const a=service.request({id:'a'});await Promise.resolve();
 const b=service.request({id:'b'}),c=service.request({id:'c'});assert.deepEqual(events,['prepare a']);
 release();await Promise.all([a,b,c]);assert.deepEqual(events,['prepare a','prepare c','commit c']);assert.equal(service.busy,false);assert.equal(busy.at(-1),false);
});
test('failed preparation preserves current destination, reports stage and allows retry',async()=>{
 let fail=true,commits=0,report;
 const service=createSectorPreparation({prepare:(_,stage)=>stage('textures',()=>{if(fail)throw Error('offline');}),commit:()=>commits++,report:r=>report=r});
 await assert.rejects(service.request({id:'x'}),/offline/);assert.equal(commits,0);assert.equal(service.busy,false);assert.equal(report.history[0].status,'failed');assert.equal(report.history[0].stages[0].name,'textures');
 fail=false;await service.request({id:'x'});assert.equal(commits,1);
});
