import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createZenReturnBoardingPlan} from './zen-return-boarding.mjs';
import {buildKeihanStation} from './keihan-station.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const station=buildKeihanStation(new THREE.Group(),{},features,{height:()=>30.03});
const local=(spec,p)=>{const x=p[0]-spec.track.origin[0],z=p[2]-spec.track.origin[1];return [x*spec.track.east[0]+z*spec.track.east[1],p[1]-spec.train.floor,x*spec.track.direction[0]+z*spec.track.direction[1]];};

test('return faces inward and ends over a supported existing cushion',()=>{
 const plan=createZenReturnBoardingPlan(station.spec);assert.ok(plan);
 const view=new THREE.Vector3(...plan.entry.target).sub(new THREE.Vector3(...plan.platform.position)).normalize();
 assert.ok(view.dot(new THREE.Vector3(station.spec.track.east[0],0,station.spec.track.east[1]))<-.98);
 const seat=local(station.spec,plan.seated.position);assert.ok(Math.abs(seat[0]-.99)<1e-8);assert.ok(Math.abs(seat[2]-station.spec.train.selectedV-1.55)<1e-8);
 station.setDoorOpen(1);station.group.updateMatrixWorld(true);
 const hit=new THREE.Raycaster(new THREE.Vector3(...plan.seated.position),new THREE.Vector3(0,-1,0),0,1.5).intersectObject(station.trainGroup,true).find(h=>!h.object.material.transparent);
 assert.ok(hit);assert.ok(Math.abs(hit.point.y-plan.seat.surfaceY)<1e-4);assert.ok(Math.abs(plan.seated.position[1]-hit.point.y-.70)<1e-4);
 assert.ok(new THREE.Vector3(...plan.seated.target).sub(new THREE.Vector3(...plan.seated.position)).dot(new THREE.Vector3(station.spec.track.east[0],0,station.spec.track.east[1]))<0);
});

test('actual doorway and aisle have body clearance; seated head clears furniture',()=>{
 const plan=createZenReturnBoardingPlan(station.spec),poses=[plan.platform,plan.entry,plan.aisle,plan.approach,plan.seated];
 station.setDoorOpen(1);station.setTrainOffset([0,0,0]);station.group.updateMatrixWorld(true);
 const p=new THREE.Vector3(),direction=new THREE.Vector3(),ray=new THREE.Raycaster();let samples=0;
 for(let segment=0;segment<poses.length-1;segment++){
  const a=poses[segment].position,b=poses[segment+1].position,steps=Math.ceil(Math.hypot(...a.map((v,i)=>v-b[i]))/.14);
  for(let i=0;i<=steps;i++){
   const t=i/steps;p.set(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t);
   const heights=segment<3?[station.spec.train.floor+.25,station.spec.train.floor+.65,station.spec.train.floor+1.05,p.y]:[p.y-.12,p.y,p.y+.12];
   for(const y of heights)for(const axis of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){
    const origin=p.clone();origin.y=y;direction.set(...axis);ray.set(origin,direction);ray.near=0;ray.far=segment<3?.28:.12;
    assert.equal(ray.intersectObject(station.trainGroup,true).filter(h=>!h.object.material.transparent).length,0,`segment=${segment} t=${t.toFixed(3)} y=${y}`);samples++;
   }
  }
 }
 assert.ok(samples>500);assert.equal(createZenReturnBoardingPlan({}),null);
});
