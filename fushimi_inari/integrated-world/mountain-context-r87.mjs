import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

/** Bounded correction to the existing Ainomine sanctuary; no new compound. */
export function refineMountainContextR87(ainomine){
  const shrine=ainomine?.group,plan=ainomine?.plan;
  if(shrine?.userData?.mountainLandmark!=='ainomine'||!plan?.roof)return null;
  if(shrine.children.some(g=>g.userData?.mountainContextRevision===87))return null;
  // The existing roof is a zero-thickness pair of sheets. Retain its footprint,
  // ridge, eave and roof finish; add only its shaded timber underside.
  const group=new THREE.Group();group.name='Ainomine roof underside and nameboard · R87';
  group.userData={mountainContextRevision:87,
    reference:'https://inari.jp/en/wp-content/uploads/2016/09/ainomine.jpg',
    provenance:'Photo-supported timber roof edge and central vertical nameboard. Thickness, joinery spacing and dimensions estimated; inscription unresolved.'};
  const wood=new THREE.MeshStandardMaterial({color:'#51473a',roughness:.93,side:THREE.DoubleSide});
  const dark=new THREE.MeshStandardMaterial({color:'#292b24',roughness:.98});
  const parts=staticParts(group);
  // Consume the builder's canonical layout, never identify geometry by colour.
  const {halfWidth:half,back,front,ridge,eave}=plan.roof;
  if(![half,back,front,ridge,eave].every(Number.isFinite)||half<1||front<=back||ridge<=eave){wood.dispose();dark.dispose();return null;}
  for(const side of [-1,1]){
    parts.sheet([0,ridge-.065,back,side*half,eave-.065,back,0,ridge-.065,front,
      side*half,eave-.065,back,side*half,eave-.065,front,0,ridge-.065,front],wood);
    // The original timber eave beams already close the outer edge; retain them.
  }
  // A blank weathered timber face preserves the observed vertical board without
  // manufacturing unreadable Japanese lettering from a 224 x 168 reference.
  parts.box(.235,.43,.052,0,2.55,front+.031,dark);
  parts.box(.195,.39,.008,0,2.55,front+.061,wood);
  const stats=parts.flush();shrine.add(group);group.userData.stats=stats;
  return {group,stats};
}
