import * as THREE from 'three';
import {mappedFirstToriiPlacement} from './first-torii-alignment-layout.mjs';

// Raw two-node OSM way owns midpoint and transverse span. Preserve the
// authored decorative geometry/height while fitting its X span to those nodes.
export function alignFirstOmotesandoTorii(root,features,surfaces,colliders){
 root.updateWorldMatrix(true,true);
 const candidates=[];
 root.traverse(o=>{if(!o.isGroup)return;const posts=o.children.filter(c=>c.isMesh&&Math.abs(c.position.z-43.5)<.001&&Math.abs(Math.abs(c.position.x)-4.4)<.001);if(posts.length===6)candidates.push(o);});
 if(candidates.length!==1)return {aligned:false,reason:'unique original first gate asset not found'};
 const original=candidates[0],pieces=original.children.filter(c=>c.isMesh&&Math.abs(c.position.x)<=4.401&&(Math.abs(c.position.z-43.5)<.001||Math.abs(c.position.z-43.72)<.001));
 if(pieces.length!==10)return {aligned:false,reason:'original gate component signature changed'};
 const before=original.localToWorld(new THREE.Vector3(0,0,43.5)),placement=mappedFirstToriiPlacement();
 const [x,z]=placement.center,yaw=placement.yaw,c=Math.cos(yaw),s=Math.sin(yaw),half=placement.span/2,groundLeft=surfaces.height(x-half*c,z+half*s),groundRight=surfaces.height(x+half*c,z-half*s),base=Math.min(groundLeft,groundRight);
 const group=new THREE.Group();group.name='Ichiban torii aligned to mapped Omotesando';group.position.set(x,base,z);group.rotation.y=yaw;group.scale.x=placement.scaleX;
 for(const piece of pieces){piece.removeFromParent();piece.position.z-=43.5;group.add(piece);}
 root.add(group);
 for(let i=colliders.length-1;i>=0;i--)if(colliders[i].args.at(-1)==='ichiban_torii')colliders.splice(i,1);
 for(const side of [-1,1])colliders.push({type:'cylinder',args:[x+side*half*c,z-side*half*s,.52*placement.scaleX,base,base+10,'ichiban_torii']});
 group.userData={sourceWay:placement.sourceWay,nodeIds:placement.nodeIds,oldCenter:before.toArray(),sourceEndpoints:true,horizontalSpan:placement.span,authoredHeightRetained:true,sourceAccuracy:'OSM geometry; not independently surveyed'};
 return {aligned:true,...group.userData,center:[x,base,z],yaw,scaleX:placement.scaleX};
}
