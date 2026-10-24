import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createInariStationArrivalSpec,inariStationSurfaceHeight,pointInStationPolygon,inariTrainPlatformGap} from './inari-station-arrival-spec.mjs';
import {buildInariStationArrival} from './inari-station-arrival.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildInariStationRoute} from './inari-station-route.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
const surfaces={height:()=>33.7};
test('arrival uses mapped JR station, true SE rail tangent, P2 east side and separate lower exit',()=>{
 const s=createInariStationArrivalSpec(features,surfaces);
 assert.equal(s.sourceFeature,'way/952687107');assert.ok(Math.abs(s.frame.origin[0]+166.7805)<1e-8);assert.equal(s.frame.origin[1],37.37);
 assert.ok(s.track.direction[0]>.29&&s.track.direction[0]<.30);assert.ok(s.track.direction[1]>.95);
 const p=s.arrival.platformPose.position;assert.ok(pointInStationPolygon(p[0],p[2],s.platform2.points));
 assert.ok(Math.abs(s.platformFloor-s.publicFloor-.9)<1e-8);assert.ok(s.publicExit.position[0]>s.frame.origin[0]);
 assert.equal(createInariStationArrivalSpec({buildings:[]},surfaces),null);
 assert.equal(createInariStationArrivalSpec(features,{height:()=>NaN}),null);
});
test('visible stair surfaces connect mapped P2 to gate with six bounded downward risers',()=>{
 const s=createInariStationArrivalSpec(features,surfaces);let previous=s.platformFloor;
 for(let i=0;i<=600;i++){const u=-9.05+5.05*i/600,p=s.local(u,0),h=inariStationSurfaceHeight(s,...p);assert.ok(Number.isFinite(h));assert.ok(h<=previous+1e-8);assert.ok(previous-h<=.15000001);previous=h;}
 assert.ok(Math.abs(previous-s.publicFloor)<1e-8);assert.equal(inariStationSurfaceHeight(s,-210,40),null);
});
test('builder owns independent geometry, deterministic doors/offset/mode and retains source input',()=>{
 const root=new THREE.Group(),source=JSON.stringify(features),api=buildInariStationArrival(root,{},features,surfaces);
 assert.equal(api.built,true);assert.equal(JSON.stringify(features),source);assert.equal(api.trainGroup.userData.dynamic,true);
 assert.equal(buildInariStationArrival(root,{},features,surfaces),api);
 const leaf=api.trainGroup.getObjectByName(`Car ${api.spec.train.selectedCar+1} door ${api.spec.train.selectedDoor+1} 1 1`),closed=leaf.position.z;
 api.setDoorOpen(1);assert.ok(Math.abs(leaf.position.z-closed-.68)<1e-8);api.setDoorOpen(0);assert.equal(leaf.position.z,closed);
 const base=api.trainGroup.position.clone();api.setTrainOffset([1,0,3]);api.setTrainOffset([1,0,3]);assert.ok(api.trainGroup.position.distanceTo(base.clone().add(new THREE.Vector3(1,0,3)))<1e-8);api.setTrainOffset([0,0,0]);assert.equal(root.getObjectByName('Selected doorway gap plate').visible,true);
 assert.throws(()=>api.setTrainOffset([Infinity,0,0]));api.setMode('night');api.setMode('day');
 root.traverse(o=>{if(o.isMesh){assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}});
 assert.ok(api.stats.train.triangles<60000);assert.ok(api.colliders.length<350);
 let trainMeshes=0,doorGroups=0;api.trainGroup.traverse(o=>{if(o.isMesh)trainMeshes++;if(o.isGroup&&o.name.startsWith('Car '))doorGroups++;});assert.equal(doorGroups,2);assert.ok(trainMeshes<25,`train draw meshes ${trainMeshes}`);
});
test('door-to-public-exit path remains physically supported and collision clear for player radius',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces),world=new SpatialCollisionWorld();
 for(const c of api.colliders)world.addBox(...c.args);
 for(let i=1;i<api.routePoints.length;i++){
  const a=api.routePoints[i-1],b=api.routePoints[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.08);
  for(let j=0;j<=steps;j++){
   const t=j/steps,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=api.surfaceHeight(x,z);
   assert.ok(Number.isFinite(y),`support ${i} ${x},${z}`);
   const resolved=world.resolvePlayer(x,y+1.7,z,.28);assert.ok(Math.hypot(resolved.x-x,resolved.z-z)<.001,`collision ${i} ${x},${z}`);
  }
 }
});
test('open doorway has a clear swept human opening and closed eye-level glass has no opaque backing',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces),s=api.spec;
 const hitsAt=(v,h)=>{const p=s.track.local(0,v),ray=new THREE.Raycaster(new THREE.Vector3(p[0],s.train.floor+h,p[1]),new THREE.Vector3(s.track.east[0],0,s.track.east[1]),0,1.7);api.group.updateMatrixWorld(true);return ray.intersectObject(api.trainGroup,true);};
 api.setDoorOpen(1);
 const selected=s.train.selectedOffset;
 for(const v of [selected-.55,selected,selected+.55])for(const h of [.25,1.2,2.05])assert.equal(hitsAt(v,h).length,0,`solid in open doorway at ${v},${h}`);
 api.setDoorOpen(0);const closed=hitsAt(selected+.1,1.66);assert.ok(closed.length>0);assert.ok(closed.every(h=>h.object.material.transparent&&h.object.material.opacity<.2));
});
test('every navigation height on egress is backed by an actual mesh within five centimeters',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces);api.setDoorOpen(1);api.group.updateMatrixWorld(true);
 for(let i=1;i<api.routePoints.length;i++){
  const a=api.routePoints[i-1],b=api.routePoints[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.09);
  for(let j=1;j<steps;j++){
   const t=j/steps,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,height=api.surfaceHeight(x,z);
   const ray=new THREE.Raycaster(new THREE.Vector3(x,height+.051,z),new THREE.Vector3(0,-1,0),0,.102),hits=ray.intersectObject(api.group,true);
   assert.ok(hits.some(h=>Math.abs(h.point.y-height)<=.05),`missing mesh support ${i} ${x},${z} @${height}`);
  }
 }
});
test('lower stair is physically cut from P2 slab, with no solid above the descending feet',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces);api.group.updateMatrixWorld(true);
 for(let u=-8.75;u< -4.25;u+=.1)for(const v of [-.25,0,.25]){
  const [x,z]=api.spec.local(u,v),y=api.surfaceHeight(x,z),ray=new THREE.Raycaster(new THREE.Vector3(x,y+1.5,z),new THREE.Vector3(0,-1,0),0,1.44);
  assert.equal(ray.intersectObject(api.group,true).length,0,`stair body inside mesh at ${u},${v}`);
 }
});
test('new source equipment preserves three walking lanes through gates and exterior street route',()=>{
 const root=new THREE.Group(),paved=makePathSurfaces(features,()=>33.7),api=buildInariStationArrival(root,{},features,paved),exterior=buildInariStationRoute(root,features,paved,{},[],api.spec),world=new SpatialCollisionWorld();
 for(const c of api.colliders)world.addBox(...c.args);
 // Three body-center lanes retain .28m radius; the widest housing trim also
 // stays inside its narrowed collision envelope rather than obstructing it.
 for(const v of [-.25,0,.25])for(let u=-1.5;u<2.5;u+=.05){const [x,z]=api.spec.local(u,v),p=world.resolvePlayer(x,api.spec.publicFloor+1.7,z,.28);assert.ok(Math.hypot(p.x-x,p.z-z)<.001,`gate lane ${u},${v}`);}
 const route=exterior.routePoints;
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.1);for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=exterior.surfaceHeight(x,z)??paved.height(x,z),p=world.resolvePlayer(x,y+1.7,z,.28);assert.ok(Math.hypot(p.x-x,p.z-z)<.001,`exterior equipment clips route ${i}`);}}
});
test('hall foundation reaches local support while preserving top and derived selected-door poses',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,{height:()=>33.7,terrainHeight:()=>32.8}),s=api.spec;
 assert.ok(Math.abs(api.foundationBottom-32.68)<1e-8);assert.equal(s.train.selectedDoor,3);assert.equal(s.train.selectedOffset,s.train.doorOffsets[3]);
 for(const [u,pose]of [[.10,s.arrival.interiorPose.position],[3.35,s.arrival.platformPose.position]]){const expected=s.track.local(u,s.train.selectedOffset);assert.ok(Math.hypot(pose[0]-expected[0],pose[2]-expected[1])<1e-8);}
 api.group.updateMatrixWorld(true);const [x,z]=s.local(s.building.halfWidth+.03,6),ray=new THREE.Raycaster(new THREE.Vector3(x,s.streetFloor-.01,z),new THREE.Vector3(-s.frame.east[0],0,-s.frame.east[1]),0,.15);
 assert.ok(ray.intersectObject(api.group,true).length>0,'solid plinth closes the street-height air gap');
});
test('selected-door lateral shift derives from mapped edge and the whole selected car clears P2 at foot height',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces),s=api.spec;
 assert.ok(Math.abs(inariTrainPlatformGap(s,s.train.selectedOffset)-.16)<1e-8);
 assert.ok(Math.abs(s.track.lateralResolution-(s.track.sourcePlatformEdge-s.train.bodyHalfWidth-.16))<1e-10);
 assert.ok(s.track.lateralResolution>.58&&s.track.lateralResolution<.59);
 api.group.updateMatrixWorld(true);
 for(let v=-9.75;v<=9.75;v+=.10){
  const gap=inariTrainPlatformGap(s,v);assert.ok(gap>.01,`selected car overlap P2 at ${v}`);
  const [x,z]=s.track.local(0,v);
  for(const h of [-.09,.09]){const ray=new THREE.Raycaster(new THREE.Vector3(x,s.train.floor+h,z),new THREE.Vector3(s.track.east[0],0,s.track.east[1]),0,1.5),hits=ray.intersectObject(api.trainGroup,true).filter(h=>!h.object.material.transparent);
   if(hits.length){const outer=Math.max(...hits.map(h=>h.distance));assert.ok(outer<=s.train.bodyHalfWidth+.001,`actual shell exceeds checked envelope ${v},${h}`);}
  }
 }
});
test('hall and two external tongues have one horizontal top owner at off-diagonal lane samples',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces),s=api.spec;api.group.updateMatrixWorld(true);
 for(const u of [-4.1,-3.5,-3.1,-2.4,-1.1,.3,1.1,2.7,3.4,3.6]){
  const [x,z]=s.local(u,.13),ray=new THREE.Raycaster(new THREE.Vector3(x,s.publicFloor+.05,z),new THREE.Vector3(0,-1,0),0,.10),tops=ray.intersectObject(api.group,true).filter(h=>Math.abs(h.point.y-s.publicFloor)<1e-5);
  assert.equal(tops.length,1,`duplicate or missing public hall top at ${u},.13`);
 }
});
test('upper stair landing has exactly one mapped P2 top with no decorative duplicate',()=>{
 const api=buildInariStationArrival(new THREE.Group(),{},features,surfaces),s=api.spec;api.group.updateMatrixWorld(true);
 for(const u of [-9.20,-9.05,-8.90])for(const v of [-.25,.13,.25]){
  const [x,z]=s.local(u,v),height=api.surfaceHeight(x,z);assert.ok(Math.abs(height-s.platformFloor)<1e-8);
  const ray=new THREE.Raycaster(new THREE.Vector3(x,height+.05,z),new THREE.Vector3(0,-1,0),0,.10),tops=ray.intersectObject(api.group,true).filter(h=>Math.abs(h.point.y-height)<1e-5);
  assert.equal(tops.length,1,`duplicate upper landing ${u},${v}`);
 }
 assert.deepEqual(s.arrival.platformPose.target,[s.route.stairBottom[0],s.platformFloor+1.6,s.route.stairBottom[2]]);
});
