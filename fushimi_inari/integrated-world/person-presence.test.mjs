import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bindPersonPresence,personGazeTarget,updatePersonGaze,posePersonPresence} from './person-presence.mjs';
import {resetVisitorRig,captureVisitorPose} from './visitor-rig.mjs';

function fixture(){
 const root=new THREE.Group(),model=new THREE.Group(),torso=new THREE.Bone(),head=new THREE.Bone(),left=new THREE.Bone(),right=new THREE.Bone();
 torso.name='Torso';head.name='Head';left.name='LowerArmL';right.name='LowerArmR';root.add(model);model.add(torso);torso.add(head,left,right);
 const rig={Head:{bone:head,rest:head.quaternion.clone(),position:head.position.clone(),scale:head.scale.clone()}};
 bindPersonPresence(rig,model);return {root,rig,torso,head};
}

test('nearby forward gaze stays bounded, ignores people behind or too far and eases back',()=>{
 assert.equal(personGazeTarget(0,0,5,0),0);
 assert.equal(personGazeTarget(0,0,-2,0),0);
 assert.equal(personGazeTarget(0,0,7,0),0);
 assert.equal(personGazeTarget(0,3,2,0),0);
 const target=personGazeTarget(3,0,3,0);assert.ok(target>0&&target<=.32);
 assert.equal(personGazeTarget(3,0,3,Math.PI/4),0);
 let gaze=0;for(let i=0;i<60;i++)gaze=updatePersonGaze(gaze,target,.016);
 assert.ok(gaze>.3&&gaze<=.32);for(let i=0;i<120;i++)gaze=updatePersonGaze(gaze,0,.016);assert.ok(gaze<.001);
});

test('breathing and weight shift animate the torso without accumulating onto mixer poses',()=>{
 const {rig,torso,head}=fixture(),initial=torso.scale.y;
 captureVisitorPose(rig);posePersonPresence(rig,1,0,0,.2);
 assert.notEqual(torso.scale.y,initial);assert.ok(Math.abs(head.rotation.y)>.15);
 const pose=torso.quaternion.clone(),scale=torso.scale.clone();
 for(let i=0;i<100;i++){resetVisitorRig(rig);captureVisitorPose(rig);posePersonPresence(rig,1,0,0,.2);}
 assert.ok(torso.quaternion.angleTo(pose)<1e-7);assert.ok(torso.scale.distanceTo(scale)<1e-10);
 resetVisitorRig(rig);assert.equal(torso.scale.y,initial);
});
