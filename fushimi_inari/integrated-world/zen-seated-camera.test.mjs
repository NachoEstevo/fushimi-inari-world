import test from 'node:test';import assert from 'node:assert/strict';import {PerspectiveCamera} from 'three';import {createZenSeatedCamera} from './zen-seated-camera.mjs';
test('seat owns one camera, pauses during overlays and restores exact standing pose once',()=>{
 const camera=new PerspectiveCamera();camera.position.set(2,3,4);camera.lookAt(2,3,0);const p=camera.position.clone(),q=camera.quaternion.clone(),calls=[],controls={enabled:true};let leaves=0;
 const seat=createZenSeatedCamera({camera,controls,walker:{pause:v=>calls.push(v)}});assert.equal(seat.sit({position:[3,2,5],target:[3,2,0],onLeave:()=>leaves++}),true);assert.equal(seat.sit({position:[4,2,6],target:[3,2,0]}),false);
 seat.update(.2,{paused:true});assert.deepEqual(camera.position.toArray(),p.toArray());seat.update(1,{paused:false});assert.ok(camera.position.distanceTo(p)>.1);assert.equal(controls.enabled,false);
 seat.stand();assert.deepEqual(camera.position.toArray(),p.toArray());assert.ok(camera.quaternion.angleTo(q)<1e-6);seat.stand();assert.equal(leaves,1);assert.equal(calls.at(-1),false);seat.dispose();assert.equal(seat.active,false);
});
test('invalid poses never take camera ownership and disposal restores an active seat',()=>{const camera=new PerspectiveCamera(),controls={enabled:false},walker={pause(){}};const seat=createZenSeatedCamera({camera,controls,walker});assert.equal(seat.sit({position:[NaN,0,0],target:[0,0,0]}),false);assert.equal(seat.active,false);seat.sit({position:[1,2,3],target:[0,1,0]});seat.dispose();assert.deepEqual(camera.position.toArray(),[0,0,0]);assert.equal(seat.sit({position:[1,2,3],target:[0,1,0]}),false);});
test('reduced motion uses the supported seat pose without a travelling camera',()=>{const camera=new PerspectiveCamera(),seat=createZenSeatedCamera({camera,walker:{pause(){}},controls:{enabled:true},reducedMotion:()=>true});seat.sit({position:[2,1.3,4],target:[2,1.3,0]});seat.update(0);assert.deepEqual(camera.position.toArray(),[2,1.3,4]);seat.dispose();});
test('head look is bounded, smooth, paused, reset between seats and restores the original rotation',()=>{
 const camera=new PerspectiveCamera(),controls={enabled:true},seat=createZenSeatedCamera({camera,controls,walker:{paused:true,pause(v){this.paused=v;}}});
 const original=camera.quaternion.clone();seat.sit({position:[1,2,3],target:[1,2,0]});seat.update(1);const fixed=camera.position.clone();seat.look(100,100);seat.update(.12);
 const first=camera.quaternion.clone();assert.ok(first.angleTo(original)>0);seat.update(1,{paused:true});assert.ok(camera.quaternion.angleTo(first)<1e-7);seat.update(10);
 const direction=camera.getWorldDirection(new (camera.position.constructor)());assert.ok(Math.abs(direction.x)<=Math.SQRT1_2+.001);assert.ok(Math.abs(direction.y)<=Math.sin(Math.PI/15)+.001);assert.deepEqual(camera.position.toArray(),fixed.toArray());
 seat.look(NaN,1);const clamped=camera.quaternion.clone();seat.update(1);assert.ok(camera.quaternion.angleTo(clamped)<1e-5);seat.stand();assert.ok(camera.quaternion.angleTo(original)<1e-7);seat.sit({position:[1,2,3],target:[1,2,0]});seat.update(2);assert.ok(camera.quaternion.angleTo(original)<1e-7);seat.dispose();
});
