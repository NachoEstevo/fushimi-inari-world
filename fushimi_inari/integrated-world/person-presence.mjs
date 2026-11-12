import {Quaternion,Vector3} from 'three';

const workspaces=new WeakMap();

// Add the joints touched by the presence layer to the same mixer-pose reset.
export function bindPersonPresence(rig,model){
 for(const [name,source]of [['Torso','Torso'],['LowerArm.L','LowerArmL'],['LowerArm.R','LowerArmR']]){
  if(rig[name])continue;
  const bone=model.getObjectByName(source);
  if(!bone?.isBone)throw Error(`Person joint missing: ${source}`);
  rig[name]={bone,rest:bone.quaternion.clone(),position:bone.position.clone(),scale:bone.scale.clone()};
 }
 workspaces.set(rig,{root:model.parent,axis:new Vector3(),world:new Quaternion(),parent:new Quaternion(),rotation:new Quaternion()});
 return rig;
}

// Only acknowledge someone near the front of the person at eye level.
export function personGazeTarget(dx,dy,dz,yaw){
 if(dx*dx+dz*dz>36||Math.abs(dy)>2.2)return 0;
 const angle=Math.atan2(Math.sin(Math.atan2(dx,dz)-yaw),Math.cos(Math.atan2(dx,dz)-yaw));
 if(Math.abs(angle)>1.15)return 0;
 return Math.max(-.32,Math.min(.32,angle));
}

export function updatePersonGaze(current,target,dt){
 return current+(target-current)*(1-Math.exp(-5*Math.max(0,Math.min(.1,dt))));
}

// Called after the mixer output has been captured; never modify the captured pose.
export function posePersonPresence(rig,time,phase,movement,gaze){
 const stillness=1-Math.max(0,Math.min(1,movement))*.65;
 const breath=Math.sin(time*1.25+phase),sway=Math.sin(time*.48+phase*.7);
 rig.Torso.bone.scale.y*=1+breath*.004;
 rig.Torso.bone.rotateZ(sway*.014*stillness);
 rig.Head.bone.rotateY(gaze+Math.sin(time*.36+phase)*.035*(1-Math.min(1,Math.abs(gaze)/.32)));
}

export function posePersonWave(rig,amount,progress){
 const workspace=workspaces.get(rig),bone=rig['LowerArm.R']?.bone;
 if(!workspace?.root||!bone)return;
 const {root,axis,world,parent,rotation}=workspace;
 root.getWorldQuaternion(world);bone.parent.getWorldQuaternion(parent).invert();
 axis.set(1,0,0).applyQuaternion(world).applyQuaternion(parent);
 bone.quaternion.premultiply(rotation.setFromAxisAngle(axis,-1.9*amount));
 bone.rotateY(Math.sin(progress*Math.PI*4)*.16*amount);
}
