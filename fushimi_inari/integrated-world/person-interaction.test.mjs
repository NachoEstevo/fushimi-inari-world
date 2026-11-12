import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersonInteraction,posePersonGreeting} from './person-interaction.mjs';

test('a greeting cannot restart its animation during cooldown and can repeat afterwards',()=>{
 let now=100;
 const greeting=createPersonInteraction({now:()=>now});
 assert.equal(greeting.progress(),null);
 greeting.data.directAction();now=1000;
 assert.equal(greeting.progress(),.5);
 greeting.data.directAction();assert.equal(greeting.progress(),.5);
 now=1900;assert.equal(greeting.progress(),null);
 greeting.data.directAction();assert.equal(greeting.progress(),0);
});

test('greeting adds a restrained head bow and returns to the resting pose at the end',()=>{
 let head=0,arm=0;
 const rig={Head:{bone:{rotateX:value=>head=value}},'UpperArm.R':{bone:{rotateZ:value=>arm=value}}};
 posePersonGreeting(rig,.5);assert.equal(head,.24);assert.equal(arm,-.18);
 posePersonGreeting(rig,0);assert.equal(head,0);assert.equal(Math.abs(arm),0);
});

test('individual greetings are stable, varied, brief and relevant to their place',()=>{
 let now=0;const make=()=>createPersonInteraction({seed:2,zone:'temizuya',now:()=>now});
 const first=make(),same=make();assert.equal(first.gesture,same.gesture);
 assert.equal(first.data.directAction(),same.data.directAction());now=2000;
 const second=first.data.directAction();assert.notEqual(second,createPersonInteraction({seed:2,zone:'temizuya',now:()=>now}).data.directAction());
 assert.ok(second.length<100);
 const vendor=createPersonInteraction({vendor:true,seed:1,kind:'grill',now:()=>now});
 assert.ok(['bow','nod'].includes(vendor.gesture));assert.match(vendor.data.directAction(),/grill|warm|fresh/i);
});

test('a managed greeting freezes while blocked and ignores large wall-clock jumps',()=>{
 let wall=0;const greeting=createPersonInteraction({now:()=>wall});
 greeting.advance(0);greeting.data.directAction();greeting.advance(.05);const before=greeting.progress();
 wall=60000;greeting.advance(.05,true);assert.equal(greeting.progress(),before);
 greeting.advance(.05,false);assert.ok(Math.abs(greeting.progress()-before-.05/1.8)<1e-10);
 wall=-100;assert.ok(greeting.progress()!==null);
});

test('food service can start an attendant greeting while its menu is paused',()=>{
 const greeting=createPersonInteraction({vendor:true,now:()=>0});
 greeting.advance(0,true);greeting.data.directAction();assert.equal(greeting.progress(),0);
 greeting.advance(.05,true);assert.equal(greeting.progress(),0);
 greeting.advance(.05,false);assert.ok(greeting.progress()>0);
});
