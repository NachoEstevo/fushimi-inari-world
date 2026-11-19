import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Sphere,Vector3} from 'three';
import {createWalkingPrewarm} from './walking-prewarm.mjs';

const source=readFileSync(new URL('./viewer.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const handler=source.split("  $('buildings').onchange=")[1].split("\n  $('aerial-canopy')")[0];
const branch=source.split('      if(object===panorama.group){')[1].split('\n      }')[0];
const makeToggle=new Function('buildingGroup','walkingPrewarm','panorama','return '+handler);
const makeCompile=new Function('$','panorama','cityHorizon','camera','yieldIdle',
  'return async function(object,{isCurrent}){'+branch+'}');

test('a stationary visitor retries city admission on enabling buildings without rewarming other scenery',async()=>{
 const position=new Vector3(795,164,-216),checkbox={checked:false},buildingGroup={visible:false};
 const tasks=[],calls=[],scenery={},camera={};
 const panorama={group:{},prewarmBounds:new Sphere(position,40),async prepare(){calls.push('geometry');}};
 const horizon={async prepare(view,{batchSize}){assert.equal(view,camera);assert.equal(batchSize,1);calls.push('shaders');}};
 const compile=makeCompile(()=>checkbox,panorama,horizon,camera,async()=>{});
 const cityEntry={object:panorama.group,bounds:panorama.prewarmBounds};
 const service=createWalkingPrewarm({
   entries:[cityEntry,{object:scenery,bounds:new Sphere(position,1)}],
   schedule:work=>tasks.push(work),
   compile:(object,ctx)=>object===scenery?calls.push('scenery'):compile(object,ctx)
 });
 const toggle=makeToggle(buildingGroup,service,panorama);
 const drain=async()=>{while(tasks.length)await tasks.shift()();};
 try{
   service.update(position,0);await drain();
   assert.deepEqual(calls,['scenery']);
   assert.equal(service.stats.compiled,1);
   checkbox.checked=true;toggle({target:checkbox});
   service.update(position,1);await drain();
   assert.equal(buildingGroup.visible,true);
   assert.deepEqual(calls,['scenery','geometry','shaders']);
   checkbox.checked=false;toggle({target:checkbox});assert.equal(buildingGroup.visible,false);
   checkbox.checked=true;toggle({target:checkbox});service.update(position,2);await drain();
   assert.deepEqual(calls,['scenery','geometry','shaders']);
 }finally{service.dispose();}
});

test('disabling buildings while geometry is prepared skips the city shader submission',async()=>{
 const checkbox={checked:true};
 const panorama={async prepare(){checkbox.checked=false;}};
 const compile=makeCompile(()=>checkbox,panorama,{prepare(){assert.fail('unexpected city shader submission');}},{},async()=>{});
 assert.equal(await compile(panorama.group,{isCurrent:()=>true}),false);
});
