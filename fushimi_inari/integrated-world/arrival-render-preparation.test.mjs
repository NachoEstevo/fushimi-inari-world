import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareTrainArrival} from './arrival-render-preparation.mjs';
function fixture(){
 const camera=new THREE.PerspectiveCamera();camera.position.set(10,5,10);
 const station={built:true,spec:{arrival:{interiorPose:{position:[0,2,0],target:[1,2,0]},platformPose:{position:[3,2,0],target:[4,2,0]},travelDirection:[0,0,1],travelDistance:24}},setTrainOffset(v){this.offset=v;},setDoorOpen(v){this.doors=v;}};
 return {camera,station};
}
test('arrival renders moving, open door and platform poses and settles GPU before ready',async()=>{
 const {camera,station}=fixture(),original=camera.position.clone(),events=[];
 const result=await prepareTrainArrival({camera,station,prepareView:()=>events.push('nearby'),prepareAppearance:()=>events.push('reflection'),compile:()=>events.push('compile'),render:()=>events.push(['render',...camera.position.toArray(),station.doors]),settle:async()=>events.push('settled')});
 assert.equal(result,true);assert.deepEqual(events.filter(x=>Array.isArray(x)),[['render',0,2,-24,0],['render',0,2,0,1],['render',3,2,0,1]]);
 assert.equal(events.filter(x=>x==='reflection').length,1);assert.equal(events.at(-1),'settled');
 assert.deepEqual(camera.position,original);assert.deepEqual(station.offset,[0,0,0]);assert.equal(station.doors,0);
});
test('failed warmup restores camera and train, and propagates failure rather than starting',async()=>{
 const {camera,station}=fixture(),original=camera.position.clone();
 await assert.rejects(prepareTrainArrival({camera,station,prepareView(){},compile(){throw Error('compile failed');},render(){},settle(){}}),/compile failed/);
 assert.deepEqual(camera.position,original);assert.deepEqual(station.offset,[0,0,0]);assert.equal(station.doors,0);
});
