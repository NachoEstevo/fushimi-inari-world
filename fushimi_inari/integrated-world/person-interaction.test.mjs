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
