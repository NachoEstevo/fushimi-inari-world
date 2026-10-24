import * as THREE from 'three';

// The existing housings define two 1.2 m lanes. Local animation, no mesh rebuilds.
export function installKeihanFareGates(station){
 if(!station?.built)return null;
 const floor=station.spec.platformFloor,z=station.spec.gate.center[2];
 const group=new THREE.Group();group.name='Keihan automatic Suica flaps';
 const material=new THREE.MeshStandardMaterial({color:'#bd4936',roughness:.65});
 const lanes=[-304.2,-302.6].map(x=>{
  const leaves=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(x+side*.60,floor+.52,z);const flap=new THREE.Mesh(new THREE.BoxGeometry(.58,.52,.055),material);flap.position.x=-side*.29;pivot.add(flap);group.add(pivot);return {pivot,side};});
  return {x,leaves,open:0,near:false};
 });
 station.group.add(group);let previousTime=null,sequence=0;
 const state={sequence:0,open:[0,0]};
 return {group,state,update(position,time,paused=false){
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
  if(Math.min(from[1],to[1])>floor+2.6||Math.max(from[1],to[1])<floor-.3)return true;
  return !lanes.some(l=>l.open<.9&&Math.abs(to[0]-l.x)<.6&&Math.min(from[2],to[2])<=z+.12&&Math.max(from[2],to[2])>=z-.12);
 }};
}
