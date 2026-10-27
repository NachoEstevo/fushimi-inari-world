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

// Observe existing Matrix4 operations without adding a constructor seam to the rig API.
test('gait reuses matrix workspaces independently for each bound rig',async()=>{
 const b=fs.readFileSync(new URL('../assets/models/visitors/Casual_Male.glb',import.meta.url));
 const load=()=>new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const rigs=(await Promise.all([load(),load()])).map(asset=>bindVisitorRig(asset.scene));
 const original=Matrix4.prototype.copy,targets=new Set();let record=false;
 Matrix4.prototype.copy=function(...args){if(record)targets.add(this);return original.apply(this,args);};
 try{
  record=true;for(const rig of rigs)poseVisitorGait(rig,.5,.8);record=false;
  const initial=targets.size;assert.ok(initial>0);
  for(let frame=0;frame<30;frame++)for(const rig of rigs){resetVisitorRig(rig);record=true;poseVisitorGait(rig,frame*.17,frame%3/2);record=false;}
  assert.equal(targets.size,initial,'subsequent poses must reuse their initialized matrix workspaces');
 }finally{Matrix4.prototype.copy=original;}
});

// Original gait equations remain the visual reference while workspace ownership changes.
function referenceGait(rig,phase,weight){
 const links=['L','R'].map(side=>{const leg=rig['LowerLeg.'+side].bone,foot=rig['Foot.'+side].bone;leg.updateWorldMatrix(true,false);foot.updateWorldMatrix(true,false);return {leg,foot,relative:new Matrix4().copy(leg.matrixWorld).invert().multiply(foot.matrixWorld)};});
 const swing=Math.sin(phase)*.38*weight;
 for(const [name,angle]of [['UpperLeg.L',swing],['UpperLeg.R',-swing],['LowerLeg.L',Math.max(0,-Math.sin(phase))*.48*weight],['LowerLeg.R',Math.max(0,Math.sin(phase))*.48*weight],['UpperArm.L',-swing*.55],['UpperArm.R',swing*.55]])rig[name].bone.rotateX(angle);
 for(const {leg,foot,relative}of links){leg.updateWorldMatrix(true,false);foot.parent.updateWorldMatrix(true,false);const local=new Matrix4().copy(foot.parent.matrixWorld).invert().multiply(leg.matrixWorld).multiply(relative);local.decompose(foot.position,foot.quaternion,foot.scale);}
}

for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name}: gait preserves original joint matrices across animated roots, phases and weights`,async()=>{
 const b=fs.readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
 const load=()=>new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const [actual,reference]=await Promise.all([load(),load()]);
 const rig=bindVisitorRig(actual.scene),expected=bindVisitorRig(reference.scene);
 const mixer=new AnimationMixer(actual.scene),referenceMixer=new AnimationMixer(reference.scene);
 mixer.clipAction(actual.animations[0]).play();referenceMixer.clipAction(reference.animations[0]).play();
 for(let frame=0;frame<80;frame++){
  const dt=frame%7===0?0:1/60,phase=frame*.21-4,weight=[0,.2,1,.7][frame%4];
  resetVisitorRig(rig);resetVisitorRig(expected);mixer.update(dt);referenceMixer.update(dt);captureVisitorPose(rig);captureVisitorPose(expected);
  for(const scene of [actual.scene,reference.scene]){scene.position.set(frame*.013,Math.sin(frame*.1),-frame*.02);scene.rotation.set(.07,frame*.1,-.03);scene.scale.set(1.2,1.1,.9);}
  poseVisitorGait(rig,phase,weight);referenceGait(expected,phase,weight);
  actual.scene.updateMatrixWorld(true);reference.scene.updateMatrixWorld(true);
  for(const joint of Object.keys(rig))assert.ok(rig[joint].bone.matrixWorld.elements.every((v,i)=>Math.abs(v-expected[joint].bone.matrixWorld.elements[i])<1e-12),`joint matrix changed on frame ${frame}: ${joint}`);
 }
});
