import * as THREE from 'three';
import {buildKeihanFareGateDetail} from './keihan-fare-gate-detail.mjs';

// The existing housings define two 1.2 m lanes. Local animation, no mesh rebuilds.
export function installKeihanFareGates(station){
 if(!station?.built)return null;
 if(station.fareGateDetail?.group?.parent===station.group)return station.fareGateDetail;
 const floor=station.spec.platformFloor,z=station.spec.gate.center[2];
 const group=new THREE.Group();group.name='Keihan automatic Suica flaps';
 const material=new THREE.MeshStandardMaterial({color:'#bd4936',roughness:.65});
 const readerCase=new THREE.MeshStandardMaterial({color:'#1b2830',roughness:.38});
 const readerLight=new THREE.MeshBasicMaterial({color:'#58d9ca',toneMapped:false});
 const readers=new THREE.Group();readers.name='Keihan original reader plates';group.add(readers);
 // Reader plates sit on the existing shared gate housings, with an illuminated
 // contact ring visible from both directions; no new obstruction enters a lane.
 for(const x of [-305,-303.4,-301.8]){
  const plate=new THREE.Mesh(new THREE.BoxGeometry(.27,.045,.36),readerCase);plate.position.set(x,floor+1.015,z);readers.add(plate);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.082,.009,6,20),readerLight);ring.rotation.x=-Math.PI/2;ring.position.set(x,floor+1.041,z);readers.add(ring);
  const indicator=new THREE.Mesh(new THREE.BoxGeometry(.12,.012,.025),readerLight);indicator.position.set(x,floor+1.043,z-.135);readers.add(indicator);
 }
 const lanes=[-304.2,-302.6].map(x=>{
  const leaves=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(x+side*.60,floor+.52,z);const flap=new THREE.Mesh(new THREE.BoxGeometry(.58,.52,.055),material);flap.position.x=-side*.29;pivot.add(flap);group.add(pivot);return {pivot,side};});
  return {x,leaves,open:0,near:false};
 });
 const detail=buildKeihanFareGateDetail(floor,z);group.add(detail.group);
 station.group.add(group);let previousTime=null,sequence=0,disposed=false;
 const state={sequence:0,open:[0,0]};
 const api={group,state,stats:detail.stats,setQuality(mode){if(disposed)return;const high=mode==='high'||mode==='ultra';readers.visible=!high;detail.group.visible=high;detail.stats.draws=high?detail.stats.batches:0;},update(position,time,paused=false){
  if(disposed)return;
  const dt=previousTime===null?0:Math.max(0,Math.min(.1,time-previousTime));previousTime=time;
  if(paused)return;
  for(const lane of lanes){
   const near=Math.abs(position[0]-lane.x)<.60&&Math.abs(position[2]-z)<(lane.near?3:2.3)&&Math.abs(position[1]-floor-1.7)<.8;
   if(near&&!lane.near)sequence++;
   lane.near=near;
   lane.open=THREE.MathUtils.clamp(lane.open+(near?1:-1)*dt/.28,0,1);
   for(const leaf of lane.leaves)leaf.pivot.rotation.y=leaf.side*lane.open*Math.PI/2;
  }
  state.sequence=sequence;state.open=lanes.map(l=>l.open);
 },canMove(from,to){
  if(disposed)return true;
  if(Math.min(from[1],to[1])>floor+2.6||Math.max(from[1],to[1])<floor-.3)return true;
  return !lanes.some(l=>l.open<.9&&Math.abs(to[0]-l.x)<.6&&Math.min(from[2],to[2])<=z+.12&&Math.max(from[2],to[2])>=z-.12);
 },dispose(){
  if(disposed)return;disposed=true;detail.dispose();
  const geometries=new Set(),materials=new Set();group.traverse(object=>{if(object.isMesh){geometries.add(object.geometry);for(const m of [object.material].flat())materials.add(m);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.removeFromParent();
  if(station.fareGateDetail===api)delete station.fareGateDetail;
 }};
 station.fareGateDetail=api;return api;
}
