import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordedSoundEvents} from './recorded-sound-events.mjs';
const gate={center:[-302.6,31,-151.4],width:4.5};
const sample=(z,time,more={})=>({position:[-302.6,32.7,z],gate,time,arrivalPhase:'complete',...more});
test('gate chirps once per crossing in either direction, with debounce',()=>{
 const s=createRecordedSoundEvents();assert.deepEqual(s.update(sample(-152,0)),[]);
 assert.deepEqual(s.update(sample(-151,1)),['gate']);assert.deepEqual(s.update(sample(-152,1.5)),[]);
 s.update(sample(-151,4));assert.deepEqual(s.update(sample(-152,7)),['gate']);
});
test('teleports, flight, walking alongside and re-enabling do not tap a card',()=>{
 for(const [a,b]of [[sample(-160,0),sample(-140,1)],[sample(-152,0,{position:[-302.6,45,-152]}),sample(-151,1,{position:[-302.6,45,-151]})],[sample(-152,0,{position:[-290,32.7,-152]}),sample(-151,1,{position:[-290,32.7,-151]})]]){
  const s=createRecordedSoundEvents();s.update(a);assert.deepEqual(s.update(b),[]);
 }
 const s=createRecordedSoundEvents();s.update(sample(-152,0));s.update(sample(-151,1,{enabled:false}));assert.deepEqual(s.update(sample(-150,2)),[]);
});
test('closing alarm is edge triggered and skip never emits it',()=>{
 const s=createRecordedSoundEvents();s.update(sample(-180,0,{arrivalPhase:'opening'}));
 assert.deepEqual(s.update(sample(-180,1,{arrivalPhase:'closing'})),['doors']);assert.deepEqual(s.update(sample(-180,2,{arrivalPhase:'closing'})),[]);
 assert.deepEqual(s.update(sample(-180,3,{arrivalPhase:'complete'})),[]);
});
