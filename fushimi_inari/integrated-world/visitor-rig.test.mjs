import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vector3,Matrix4,AnimationMixer} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bindVisitorRig,resetVisitorRig,captureVisitorPose,poseVisitorGait} from './visitor-rig.mjs';
for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name}: loaded joints and actual skinned vertices alternate during walking`,async()=>{
 const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
 const asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const rig=bindVisitorRig(asset.scene);assert.ok(rig['UpperLeg.L'].bone.name==='UpperLegL');
 const vertices=()=>{asset.scene.updateMatrixWorld(true);const result=[];asset.scene.traverse(o=>{if(o.isSkinnedMesh){o.skeleton.update();const v=new Vector3();for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,v);result.push(v.clone());}}});return result;};
 const footOffset=()=>{asset.scene.updateMatrixWorld(true);return new Matrix4().copy(rig['LowerLeg.L'].bone.matrixWorld).invert().multiply(rig['Foot.L'].bone.matrixWorld);};
 const offset=footOffset();const rest=vertices();poseVisitorGait(rig,Math.PI/2,1);const left=vertices();assert.ok(footOffset().elements.every((v,i)=>Math.abs(v-offset.elements[i])<1e-5));
 resetVisitorRig(rig);poseVisitorGait(rig,3*Math.PI/2,1);const right=vertices();
 assert.ok(left.filter((v,i)=>v.distanceTo(right[i])>.05).length>20,'walking must visibly deform mesh, not just translate the root');
 resetVisitorRig(rig);const reset=vertices();assert.ok(reset.every((v,i)=>v.distanceTo(rest[i])<1e-5));
 poseVisitorGait(rig,1,0);assert.ok(vertices().every((v,i)=>v.distanceTo(rest[i])<1e-5));
});

for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name}: idle arm pose survives repeated gait, pauses and zero-delta updates`,async()=>{
 const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
 const load=()=>new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const [actual,baseline]=await Promise.all([load(),load()]);
 const mixer=new AnimationMixer(actual.scene),reference=new AnimationMixer(baseline.scene);
 mixer.clipAction(actual.animations[0]).play();reference.clipAction(baseline.animations[0]).play();
 mixer.update(0);reference.update(0);const rig=bindVisitorRig(actual.scene),expected=bindVisitorRig(baseline.scene);
 for(let frame=0;frame<360;frame++){
  const dt=frame%60===0?0:1/30;resetVisitorRig(rig);mixer.update(dt);reference.update(dt);captureVisitorPose(rig);
  for(const name of ['UpperArm.L','UpperArm.R','UpperLeg.L','UpperLeg.R','Head'])assert.ok(rig[name].bone.quaternion.toArray().every((v,i)=>Math.abs(v-expected[name].bone.quaternion.toArray()[i])<1e-6),`base pose diverged on frame ${frame}: ${name}`);
  poseVisitorGait(rig,frame*.15,frame<120||frame>240?1:0);
 }
});
