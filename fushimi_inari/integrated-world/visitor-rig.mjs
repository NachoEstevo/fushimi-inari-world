import {PropertyBinding,Matrix4} from 'three';
const names=['UpperLeg.L','UpperLeg.R','LowerLeg.L','LowerLeg.R','UpperArm.L','UpperArm.R','Head','Foot.L','Foot.R'];
export function bindVisitorRig(model){
 return Object.fromEntries(names.map(name=>{
  const bone=model.getObjectByName(PropertyBinding.sanitizeNodeName(name))??model.getObjectByName(name);
  if(!bone?.isBone)throw Error(`Visitor joint missing: ${name}`);
  return [name,{bone,rest:bone.quaternion.clone(),position:bone.position.clone(),scale:bone.scale.clone()}];
 }));
}
export function resetVisitorRig(rig){for(const joint of Object.values(rig)){joint.bone.quaternion.copy(joint.rest);joint.bone.position.copy(joint.position);joint.bone.scale.copy(joint.scale);}}
export function poseVisitorGait(rig,phase,weight){
 // Foot controls are siblings of Body in these exported rigs, not children
 // of the lower legs. Preserve their animated offset while following the leg.
 const links=['L','R'].map(side=>{const leg=rig['LowerLeg.'+side].bone,foot=rig['Foot.'+side].bone;leg.updateWorldMatrix(true,false);foot.updateWorldMatrix(true,false);return {leg,foot,relative:new Matrix4().copy(leg.matrixWorld).invert().multiply(foot.matrixWorld)};});
 const swing=Math.sin(phase)*.38*weight;
 for(const [name,angle]of [['UpperLeg.L',swing],['UpperLeg.R',-swing],['LowerLeg.L',Math.max(0,-Math.sin(phase))*.48*weight],['LowerLeg.R',Math.max(0,Math.sin(phase))*.48*weight],['UpperArm.L',-swing*.55],['UpperArm.R',swing*.55]])rig[name].bone.rotateX(angle);
 for(const {leg,foot,relative}of links){leg.updateWorldMatrix(true,false);foot.parent.updateWorldMatrix(true,false);const local=new Matrix4().copy(foot.parent.matrixWorld).invert().multiply(leg.matrixWorld).multiply(relative);local.decompose(foot.position,foot.quaternion,foot.scale);}
}
