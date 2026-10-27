import {PropertyBinding,Matrix4} from 'three';
const gaitWorkspaces=new WeakMap();
const names=['UpperLeg.L','UpperLeg.R','LowerLeg.L','LowerLeg.R','UpperArm.L','UpperArm.R','Head','Foot.L','Foot.R'];
export function bindVisitorRig(model){
 return Object.fromEntries(names.map(name=>{
  const bone=model.getObjectByName(PropertyBinding.sanitizeNodeName(name))??model.getObjectByName(name);
  if(!bone?.isBone)throw Error(`Visitor joint missing: ${name}`);
  return [name,{bone,rest:bone.quaternion.clone(),position:bone.position.clone(),scale:bone.scale.clone()}];
 }));
}
// AnimationMixer skips unchanged track values. Restore its previous output,
// never the bind/T pose, before evaluating the next frame's additive gait.
export function captureVisitorPose(rig){for(const joint of Object.values(rig)){joint.rest.copy(joint.bone.quaternion);joint.position.copy(joint.bone.position);joint.scale.copy(joint.bone.scale);}}
export function resetVisitorRig(rig){for(const joint of Object.values(rig)){joint.bone.quaternion.copy(joint.rest);joint.bone.position.copy(joint.position);joint.bone.scale.copy(joint.scale);}}
export function poseVisitorGait(rig,phase,weight){
 // Foot controls are siblings of Body in these exported rigs, not children
 // of the lower legs. Preserve their animated offset while following the leg.
 let workspace=gaitWorkspaces.get(rig);
 if(!workspace){
  workspace={links:['L','R'].map(side=>({leg:rig['LowerLeg.'+side].bone,foot:rig['Foot.'+side].bone,relative:new Matrix4()})),local:new Matrix4()};
  gaitWorkspaces.set(rig,workspace);
 }
 // Reuse storage only; animated foot offsets are recomputed for every pose.
 const {links,local}=workspace;
 for(const {leg,foot,relative}of links){leg.updateWorldMatrix(true,false);foot.updateWorldMatrix(true,false);relative.copy(leg.matrixWorld).invert().multiply(foot.matrixWorld);}
 const swing=Math.sin(phase)*.38*weight;
 rig['UpperLeg.L'].bone.rotateX(swing);rig['UpperLeg.R'].bone.rotateX(-swing);
 rig['LowerLeg.L'].bone.rotateX(Math.max(0,-Math.sin(phase))*.48*weight);
 rig['LowerLeg.R'].bone.rotateX(Math.max(0,Math.sin(phase))*.48*weight);
 rig['UpperArm.L'].bone.rotateX(-swing*.55);rig['UpperArm.R'].bone.rotateX(swing*.55);
 for(const {leg,foot,relative}of links){leg.updateWorldMatrix(true,false);foot.parent.updateWorldMatrix(true,false);local.copy(foot.parent.matrixWorld).invert().multiply(leg.matrixWorld).multiply(relative);local.decompose(foot.position,foot.quaternion,foot.scale);}
}
