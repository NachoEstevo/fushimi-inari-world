import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

export const senbonRestBuildingIds=Object.freeze(['way/301527739','way/301527730']);

/** Complete the existing mapped court-edge buildings, without adding a footprint.
 * Roof/body dimensions remain the court owner's R88 estimates, not a survey.
 * No public walking surface, collision, path station or vegetation is changed.
 */
export function buildSenbonRestFrontage(group,{id,width:w,depth:d},materials){
  if(!senbonRestBuildingIds.includes(id)||!Number.isFinite(w)||!Number.isFinite(d)||w<1||d<1)return null;
  if(group.children.some(c=>c.userData?.senbonRestR94))return null;
  const detail=new THREE.Group();detail.name=`Okusha mapped timber envelope · ${id}`;
  detail.userData={senbonRestR94:true,osm:id,dimensions:'R88 mapped footprint; estimated joinery and heights',
    reference:'User supplied Okusha court video stills, 2026-10-23; https://inari.jp/en/map/spot_08/'};
  const parts=staticParts(detail);
  const timber=new THREE.MeshStandardMaterial({color:'#4c3b2b',roughness:.94});
  const board=new THREE.MeshStandardMaterial({color:'#63513e',roughness:.98});
  const stone=materials.entryStoneMat;
  // The supplied court still shows dark horizontal timber below the counters,
  // not an undifferentiated brown cuboid. Keep every existing opening above it.
  for(let i=0;i<5;i++)parts.box(w-.16,.095,.075,0,.37+i*.115,-d/2-.025,board);
  parts.box(w-.12,.08,.12,0,.94,-d/2-.045,timber);
  // Close the previously missing roof-end triangles. Follow the exact existing
  // 3.05 m eave / 4.15 m ridge rather than introducing a second roof silhouette.
  for(const side of [-1,1]){
    const x=side*(w/2+.025);
    const vertices=[[x,3.05,-d/2],[x,4.15,0],[x,3.05,d/2]];
    if(side<0)vertices.reverse();
    parts.sheet(vertices.flat(),board);
    for(const z of [-d/2,d/2])parts.box(.13,2.86,.13,side*(w/2-.04),1.67,z,timber);
    // Narrow boards articulate the sidewall instead of false windows or doors.
    const bays=Math.ceil(d/.19);
    for(let i=0;i<bays;i++){
      const z=-d/2+(i+.5)*d/bays;
      parts.box(.045,2.54,d/bays-.018,side*(w/2+.012),1.61,z,board);
    }
    for(const y of [.36,2.94])parts.box(.09,.13,d,x,y,0,timber);
    // Top stays .34; embed the underside below the court's .14 floor so two
    // opposite-facing coplanar sheets cannot self-shadow along the footing.
    parts.box(.10,.22,d,x,.23,0,stone);
    for(const sign of [-1,1]){
      const a=new THREE.Vector3(x,4.14,0),b=new THREE.Vector3(x,3.04,sign*d/2),delta=b.clone().sub(a);
      const geometry=new THREE.BoxGeometry(.13,delta.length(),.13);
      geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
      parts.put(geometry.translate(...a.add(b).multiplyScalar(.5).toArray()),timber);
    }
  }
  // Exposed eave structure stays below the existing roof sheets and above heads.
  const count=Math.ceil(w/.50);
  for(let i=0;i<=count;i++)for(const sign of [-1,1]){
    parts.box(.07,.10,d/2+.62,-w/2+i*w/count,2.98,sign*(d/4+.27),timber);
  }
  for(const sign of [-1,1])parts.box(w+1,.16,.14,0,3.005,sign*(d/2+.67),timber);
  // Continuous narrow mineral plinth seats the existing rear wall visually.
  parts.box(w,.22,.10,0,.23,d/2+.025,stone);
  parts.box(w,.14,.09,0,2.94,d/2+.025,timber);
  const stats=parts.flush();detail.userData.stats=stats;group.add(detail);
  return {group:detail,stats,id};
}
