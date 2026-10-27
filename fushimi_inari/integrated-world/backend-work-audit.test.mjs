import test from 'node:test';
import assert from 'node:assert/strict';
import {installBackendWorkAudit} from './backend-work-audit.mjs';

test('existing hooks preserve receiver, arguments, synchronous returns, promises and thrown identity',()=>{
 let time=0;const calls=[],result={},promise=Promise.resolve(result),error=new Error('GPU validation');
 Object.defineProperty(promise,'then',{get(){assert.fail('Audit must not inspect or attach promise continuations');}});
 const backend={createProgram(...args){calls.push([this,...args]);time+=3;return result;},createRenderPipeline(){time+=4;return promise;},updateTexture(){time+=5;throw error;},updateAttribute(){time+=1;return 42;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time}),arg={name:'wood shader',stage:'fragment'},extra={};
 assert.equal(backend.createProgram(arg,extra)===result,true);assert.equal(calls[0][0]===backend,true);assert.equal(calls[0][1]===arg,true);assert.equal(calls[0][2]===extra,true);
 assert.equal(backend.createRenderPipeline({object:{name:'roof',type:'Mesh'}},[])===promise,true);
 assert.throws(()=>backend.updateTexture({name:'paint',isTexture:true,type:1014,source:{data:{width:1024,height:512}}}),caught=>caught===error);
 assert.equal(backend.updateAttribute({name:'instanceMatrix',array:new Float32Array(16),count:1,itemSize:16}),42);
 assert.equal(audit.stats.totals.count,4);assert.equal(audit.stats.totals.totalMs,13);assert.equal(audit.stats.recent.length,3);
 assert.equal(audit.stats.recent[0].method,'createProgram');assert.equal(audit.stats.recent[0].name,'wood shader');assert.equal(audit.stats.recent[0].type,'fragment');
 assert.equal(audit.stats.recent[1].name,'roof');assert.equal(audit.stats.recent[1].type,'Mesh');
 assert.equal(audit.stats.recent[2].width,1024);assert.equal(audit.stats.recent[2].height,512);assert.equal(audit.stats.recent[2].type,'Texture');audit.dispose();
});

test('recent events form a bounded chronological ring while totals include fast calls and phases',()=>{
 let time=10;const backend={updateAttribute(){time+=2;}},audit=installBackendWorkAudit(backend,{now:()=>time,limit:2,thresholdMs:2});
 audit.setPhase('precompile');backend.updateAttribute({array:new Uint8Array(8),count:2,itemSize:4});backend.updateAttribute({});
 audit.setPhase('render');backend.updateAttribute({name:'latest'});
 const stats=audit.stats;assert.deepEqual(stats.recent.map(event=>event.startTimeMs),[12,14]);assert.deepEqual(stats.recent.map(event=>event.phase),['precompile','render']);
 assert.equal(stats.totals.count,3);assert.equal(stats.totals.methods.updateAttribute.totalMs,6);assert.equal(stats.totals.phases.precompile.count,2);
 assert.equal(stats.recent[1].name,'latest');stats.recent[0].ms=999;stats.totals.methods.updateAttribute.count=999;
 assert.equal(audit.stats.recent[0].ms,2);assert.equal(audit.stats.totals.methods.updateAttribute.count,3);
 audit.reset();assert.equal(audit.stats.totals.count,0);assert.equal(audit.stats.recent.length,0);
 backend.updateAttribute({array:new Float32Array(12),count:4,itemSize:3});assert.equal(audit.stats.recent[0].phase,'render');assert.equal(audit.stats.recent[0].byteLength,48);audit.dispose();
});

test('dispose restores own and inherited method ownership without overriding later replacements',()=>{
 const inherited=function(){return 1;},own=function(){return 2;},replacement=()=>3,prototype={createProgram:inherited},backend=Object.assign(Object.create(prototype),{updateTexture:own});
 const audit=installBackendWorkAudit(backend);assert.equal(Object.hasOwn(backend,'createProgram'),true);assert.equal(Object.hasOwn(backend,'createRenderPipeline'),false);assert.equal(Object.hasOwn(backend,'updateAttribute'),false);
 backend.updateTexture=replacement;audit.dispose();audit.dispose();assert.equal(backend.createProgram===inherited,true);assert.equal(Object.hasOwn(backend,'createProgram'),false);assert.equal(backend.updateTexture===replacement,true);
 const target={updateTexture:own};
 const third=installBackendWorkAudit(target);third.dispose();assert.equal(Object.hasOwn(target,'updateTexture'),true);assert.equal(target.updateTexture===own,true);
});

test('unsafe metadata cannot replace backend returns or errors and disposed captured wrappers stop recording',()=>{
 let time=0;const expected=new Error('original'),backend={createProgram(){time+=3;return 7;},updateTexture(){time+=4;throw expected;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time}),unsafe={get name(){throw new Error('unsafe metadata');}};
 assert.equal(backend.createProgram(unsafe),7);assert.throws(()=>backend.updateTexture(unsafe),error=>error===expected);
 assert.equal(audit.stats.totals.count,2);assert.equal(audit.stats.recent.length,2);
 const wrapper=backend.createProgram;audit.dispose();assert.equal(wrapper.call(backend,{}),7);assert.equal(audit.stats.totals.count,2);
});

test('every fast pipeline submission enters a bounded history with mode and owner metadata while returns and throws stay intact',()=>{
 let time=0;const result={},error=new Error('pipeline rejected'),backend={createRenderPipeline(object){time+=.25;if(object.fail)throw error;return result;}};
 const audit=installBackendWorkAudit(backend,{now:()=>time,limit:2,thresholdMs:2});
 const object={object:{name:'near mesh',type:'Mesh',uuid:'mesh-id'},material:{name:'paint',type:'MeshStandardNodeMaterial',id:31}};
 audit.setPhase('precompile');assert.equal(backend.createRenderPipeline(object,[])===result,true);
 audit.setPhase('render');assert.equal(backend.createRenderPipeline(object,null)===result,true);
 assert.throws(()=>backend.createRenderPipeline({...object,fail:true},[]),caught=>caught===error);
 const stats=audit.stats;assert.equal(Array.isArray(stats.pipelines),true);assert.equal(stats.pipelines.length,2);
 assert.deepEqual(stats.recent,[]);assert.equal(stats.totals.count,3);
 assert.deepEqual(stats.pipelines.map(event=>event.startTimeMs),[.25,.5]);assert.deepEqual(stats.pipelines.map(event=>event.mode),['sync','async']);
 assert.equal(stats.pipelines[0].phase,'render');assert.equal(stats.pipelines[0].ms,.25);assert.equal(stats.pipelines[0].name,'near mesh');assert.equal(stats.pipelines[0].type,'Mesh');
 assert.equal(stats.pipelines[0].objectId,'mesh-id');assert.equal(stats.pipelines[0].material,'paint');assert.equal(stats.pipelines[0].materialType,'MeshStandardNodeMaterial');assert.equal(stats.pipelines[0].materialId,31);
 stats.pipelines[0].name='mutated';assert.equal(audit.stats.pipelines[0].name,'near mesh');audit.reset();assert.deepEqual(audit.stats.pipelines,[]);audit.dispose();
});
