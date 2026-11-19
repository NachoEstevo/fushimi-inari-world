import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advanceGuidedRoute} from './guided-route-motion.mjs';

const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const callback=source.split("  $('walk').onclick=")[1].split("\n  $('stop').onclick")[0].trim();
function startAt(x,webgpu=true){
  let resolve,requested,interruptions=0;
  const points=[[0,0,0],[100,5,0],[130,7,0]],controls={enabled:true};
  const buttons={walk:{disabled:false,textContent:'Follow route'},stop:{disabled:true}};
  const make=new Function('advanceGuidedRoute','renderer','camera','controls','requestCheckpoint','interruptArrival','$','points',
    'let activeRoute=points,routeProgress=0,travelled=0,walking=false;const start='+callback+
    'return {start,get walking(){return walking;},replan(){activeRoute=points.slice();}}');
  const state=make(advanceGuidedRoute,{backend:{isWebGPUBackend:webgpu}},{position:{x,z:0}},controls,
    destination=>{requested=destination;return new Promise(yes=>resolve=yes);},
    ()=>interruptions++,id=>buttons[id],points);
  return {state,buttons,get requested(){return requested;},get interruptions(){return interruptions;},finish:ready=>resolve(ready)};
}
test('a nearby tour releases the arrival camera and starts immediately',async()=>{
  const f=startAt(2);await f.state.start();
  assert.equal(f.state.walking,true);assert.equal(f.interruptions,1);assert.equal(f.requested,undefined);
});
test('a distant route yields camera ownership until its destination is ready',async()=>{
  const f=startAt(850),work=f.state.start();
  assert.deepEqual(f.requested.point,[0,0,0]);assert.equal(f.buttons.walk.disabled,true);assert.equal(f.state.walking,false);
  f.finish(true);await work;assert.equal(f.state.walking,true);assert.equal(f.buttons.walk.disabled,false);
});
test('replaced or failed preparation cannot take the camera',async()=>{
  for(const superseded of [false,true]){
    const f=startAt(850),work=f.state.start();if(superseded)f.state.replan();
    f.finish(superseded);await work;assert.equal(f.state.walking,false);assert.equal(f.interruptions,0);
    if(!superseded)assert.equal(f.buttons.walk.disabled,false);
  }
});

test('WebGL2 starts distant guided routes with incremental streaming',async()=>{
  const f=startAt(850,false);await f.state.start();
  assert.equal(f.state.walking,true);assert.equal(f.requested,undefined);
});
