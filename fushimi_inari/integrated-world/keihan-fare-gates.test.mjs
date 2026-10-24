import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installKeihanFareGates} from './keihan-fare-gates.mjs';
import {createRecordedSoundEvents} from './recorded-sound-events.mjs';
const make=()=>installKeihanFareGates({built:true,group:new THREE.Group(),spec:{platformFloor:31,gate:{center:[-302.6,31,-151.4]}}});
test('closed lanes block both walking and ground-level guided travel, then open before crossing',()=>{
 const g=make();assert.deepEqual(g.state.open,[0,0]);
 for(const y of [31,32.7])assert.equal(g.canMove([-302.6,y,-152],[-302.6,y,-151]),false);
 g.update([-302.6,32.7,-153],0);for(let i=1;i<=4;i++)g.update([-302.6,32.7,-153],i*.1);
 assert.equal(g.state.sequence,1);assert.equal(g.state.open[1],1);assert.equal(g.state.open[0],0);
 assert.equal(g.canMove([-302.6,32.7,-152],[-302.6,32.7,-151]),true);
 g.update([-302.6,32.7,-150],.5);assert.equal(g.state.sequence,1);
 for(let i=6;i<11;i++)g.update([-302.6,32.7,-146],i*.1);
 assert.deepEqual(g.state.open,[0,0]);g.update([-302.6,32.7,-150],1.2);assert.equal(g.state.sequence,2);
});
test('pause and unrelated elevation do not open or repeat the tap',()=>{
 const g=make();g.update([-302.6,50,-151],0);g.update([-302.6,32.7,-152],.1,true);assert.equal(g.state.sequence,0);
 g.update([-302.6,32.7,-153.6],.2);g.update([-302.6,32.7,-153.8],.3);g.update([-302.6,32.7,-153.6],.4);assert.equal(g.state.sequence,1);
});
test('Suica emits once on opening, not again when crossing; disabled sound is not replayed',()=>{
 const s=createRecordedSoundEvents(),base={position:[-302.6,32.7,-152],gate:{center:[-302.6,31,-151.4],width:4.5},arrivalPhase:'complete',time:0};
 assert.deepEqual(s.update({...base,gateState:{sequence:0}}),[]);
 assert.deepEqual(s.update({...base,gateState:{sequence:1}}),['gate']);
 assert.deepEqual(s.update({...base,position:[-302.6,32.7,-151],gateState:{sequence:1}}),[]);
 s.update({...base,gateState:{sequence:2},enabled:false});assert.deepEqual(s.update({...base,gateState:{sequence:2}}),[]);s.reset();assert.deepEqual(s.update({...base,gateState:{sequence:2}}),[]);
});
