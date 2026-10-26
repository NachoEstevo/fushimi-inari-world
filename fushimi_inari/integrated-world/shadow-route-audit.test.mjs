import test from 'node:test';
import assert from 'node:assert/strict';
import {createShadowRoute,percentile,summarizeShadowFrames,installShadowRouteAudit} from './shadow-route-audit.mjs';
const assembly={spatial:{returning:[[0,0,0],[30,0,0]],byId:{mitsurugi:{target:[5,0,0]}}},walkHeight:x=>x*.1};
const camera=()=>({position:{set(...p){this.value=p;}},lookAt(...p){this.target=p;}});
function documentStub(){
 const body={dataset:{},children:[],append(child){this.children.push(child);}};
 const listeners=new Map();
 return {body,addEventListener(type,fn){listeners.set(type,fn);},removeEventListener(type,fn){if(listeners.get(type)===fn)listeners.delete(type);},dispatch(type){listeners.get(type)?.();},createElement(){return {children:[],append(child){this.children.push(child);},addEventListener(){},remove(){}};}};
}
test('route starts at projected anchor, advances 12 m and retraces at fixed time',()=>{
 const route=createShadowRoute(assembly);
 assert.deepEqual(route.sample(0).pose.position,[5,2.2,0]);
 assert.deepEqual(route.sample(8).pose.position,[17,3.4000000000000004,0]);
 assert.deepEqual(route.sample(4).pose.position,route.sample(12).pose.position);
 assert.deepEqual(route.sample(0).pose.position,route.sample(16).pose.position);
 assert.notDeepEqual(route.sample(4).pose.target,route.sample(12).pose.target);
 assert.deepEqual(route.sample(4),createShadowRoute(assembly).sample(4));
 assert.equal(route.preparationViews.length,7);
 assert.deepEqual(route.preparationViews.map(view=>view.pose.position[0]),[5,9,13,17,13,9,5]);
});
test('percentiles and frame summaries use measured gaps and shadow-frame subsets',()=>{
 assert.equal(percentile([10,30,20],.95),29);
 const s=summarizeShadowFrames([{gap:10,submitMs:2,calls:4,triangles:50,shadowUpdated:false},{gap:20,submitMs:4,calls:6,triangles:100,shadowUpdated:true}]);
 assert.equal(s.fps,2000/30);assert.equal(s.p50,15);assert.equal(s.p95,19.5);assert.equal(s.worst,20);assert.equal(s.submitMean,3);assert.equal(s.shadowFrames,1);assert.equal(s.shadowTrianglesMean,100);
});
test('controller prepares, settles, measures, then restores ownership',async()=>{
 globalThis.document=documentStub();const c=camera();let begins=0,ends=0,views,updates=0;
 const audit=installShadowRouteAudit({camera:c,assembly,prepare:async v=>{views=v;},onBegin:()=>begins++,onEnd:()=>ends++,getStats:()=>({calls:2,triangles:8,shadowUpdates:updates++})});
 await audit.run();assert.equal(views.length,7);assert.equal(audit.active,true);audit.update(0);audit.update(2000);audit.update(2100);audit.afterRender(2100,1);audit.update(6100);assert.deepEqual(c.position.value,[11,2.8,0]);audit.afterRender(6100,2);audit.update(18100);audit.afterRender(18100,3);
 const state=JSON.parse(document.body.dataset.shadowRouteAudit);assert.equal(state.phase,'complete');assert.equal(state.result.frameCount,2);assert.equal(state.result.shadowFrames,2);assert.equal(state.result.duration,16);assert.deepEqual(state.result.preparationViews,views);assert.equal(begins,1);assert.equal(ends,1);assert.equal(audit.active,false);
 await audit.previewMidpoint();assert.deepEqual(c.position.value,[17,3.4000000000000004,0]);assert.equal(ends,2);audit.dispose();delete globalThis.document;
});
test('preparation and stats errors restore ownership',async()=>{
 globalThis.document=documentStub();let ends=0;const audit=installShadowRouteAudit({camera:camera(),assembly,prepare:async()=>{throw Error('prepare failed');},onEnd:()=>ends++});
 await audit.run();assert.equal(ends,1);assert.equal(audit.active,false);assert.match(JSON.parse(document.body.dataset.shadowRouteAudit).error,/prepare failed/);audit.dispose();delete globalThis.document;
});
test('stats failure restores ownership',async()=>{
 globalThis.document=documentStub();let ends=0;const audit=installShadowRouteAudit({camera:camera(),assembly,getStats:()=>{throw Error('stats failed');},onEnd:()=>ends++});
 await audit.run();audit.update(0);audit.update(2000);audit.update(2010);audit.afterRender(2010,1);
 assert.equal(ends,1);assert.equal(audit.active,false);assert.match(JSON.parse(document.body.dataset.shadowRouteAudit).error,/stats failed/);audit.dispose();delete globalThis.document;
});
test('zero draw statistics reject the measurement',async()=>{
 globalThis.document=documentStub();let ends=0;const audit=installShadowRouteAudit({camera:camera(),assembly,getStats:()=>({calls:0,triangles:0}),onEnd:()=>ends++});
 await audit.run();audit.update(0);audit.update(2000);audit.update(2010);audit.afterRender(2010,1);
 assert.equal(ends,1);const state=JSON.parse(document.body.dataset.shadowRouteAudit);assert.equal(state.phase,'error');assert.equal(state.result,null);assert.match(state.error,/invalid draw statistics/);audit.dispose();delete globalThis.document;
});
test('hidden document aborts settling or measured frames',async()=>{
 globalThis.document=documentStub();let ends=0;const audit=installShadowRouteAudit({camera:camera(),assembly,getStats:()=>({calls:1,triangles:1}),onEnd:()=>ends++});
 await audit.run();document.hidden=true;assert.equal(audit.update(0),false);assert.equal(ends,1);assert.match(JSON.parse(document.body.dataset.shadowRouteAudit).error,/visible document/);
 document.hidden=false;await audit.run();audit.update(0);audit.update(2000);audit.update(2010);document.hidden=true;audit.afterRender(2010,1);assert.equal(ends,2);assert.equal(JSON.parse(document.body.dataset.shadowRouteAudit).phase,'error');audit.dispose();delete globalThis.document;
});
test('visibility event aborts without an animation update and listener is removed on dispose',async()=>{
 globalThis.document=documentStub();let ends=0;const audit=installShadowRouteAudit({camera:camera(),assembly,onEnd:()=>ends++});
 await audit.run();audit.update(0);audit.update(2000);audit.update(2010);document.hidden=true;document.dispatch('visibilitychange');
 assert.equal(audit.active,false);assert.equal(ends,1);assert.equal(JSON.parse(document.body.dataset.shadowRouteAudit).phase,'error');
 document.hidden=false;document.dispatch('visibilitychange');assert.equal(ends,1);audit.dispose();document.hidden=true;document.dispatch('visibilitychange');assert.equal(ends,1);delete globalThis.document;
});
