import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {mappedFirstToriiPlacement} from './first-torii-alignment-layout.mjs';

// Raw OSM owns midpoint and heading. R58 narrows the prior visual span;
// height is retained and source span is not treated as measured pillar spacing.
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
 for(const piece of pieces){
  // The first gate's concrete columns terminate in the broad red daiwa
  // visible beneath its upper beam. Merge each collar into its own column so
  // the hero gate keeps the same mesh and material ownership.
  if(Math.abs(piece.position.x)===4.4&&piece.position.y===5){
   const collar=new THREE.CylinderGeometry(.57,.57,.20,18);
   collar.translate(0,8.97-piece.position.y,0);
   const geometry=mergeGeometries([piece.geometry,collar]);
   collar.dispose();
   if(geometry){piece.geometry.dispose();piece.geometry=geometry;}
  }
  piece.removeFromParent();piece.position.z-=43.5;group.add(piece);
 }
 root.add(group);
 for(let i=colliders.length-1;i>=0;i--)if(colliders[i].args.at(-1)==='ichiban_torii')colliders.splice(i,1);
 for(const side of [-1,1])colliders.push({type:'cylinder',args:[x+side*half*c,z-side*half*s,.52*placement.scaleX,base,base+10,'ichiban_torii']});
 group.userData={sourceWay:placement.sourceWay,nodeIds:placement.nodeIds,oldCenter:before.toArray(),sourceEndpoints:false,sourceSpan:placement.sourceSpan,widthFactor:placement.widthFactor,horizontalSpan:placement.span,authoredHeightRetained:true,sourceAccuracy:'OSM midpoint/heading; width is a visual estimate reduced20percent from R54, not surveyed'};
 return {aligned:true,...group.userData,center:[x,base,z],yaw,scaleX:placement.scaleX};
}
