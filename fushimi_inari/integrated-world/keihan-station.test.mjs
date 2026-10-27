import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createKeihanStationSpec,insideKeihanPolygon,keihanTrainPlatformGap} from './keihan-station-spec.mjs';
import {buildKeihanStation} from './keihan-station.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
const surfaces={height:()=>30.03};
const fixture=(floor=surfaces)=>buildKeihanStation(new THREE.Group(),{},features,floor);

test('ramp metal panels and lateral tactile guide reuse the original two top triangles with slope-aligned UVs',()=>{
 const api=fixture(),meshes=[];api.group.traverse(o=>{if(o.isMesh&&o.material.name==='Keihan grooved ramp panels and tactile guide')meshes.push(o);});
 assert.equal(meshes.length,1);const mesh=meshes[0],p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,m=mesh.material;
 assert.equal(p.count,6,'appearance adds no walking geometry');assert.ok(m.metalness<.4&&m.roughness>.5);assert.equal(m.map.wrapT,THREE.RepeatWrapping);assert.equal(m.map.wrapS,THREE.ClampToEdgeWrapping);assert.ok(m.bumpScale<=.004);
 const a=api.spec.gate.rampHead,b=api.spec.gate.rampFoot,dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
 for(let i=0;i<p.count;i++){
  const along=((p.getX(i)-a[0])*dx+(p.getZ(i)-a[2])*dz)/length,across=((p.getX(i)-a[0])*dz-(p.getZ(i)-a[2])*dx)/length;
  assert.ok(Math.abs(uv.getX(i)-(across/2.5+.5))<1e-5);assert.ok(Math.abs(uv.getY(i)-along/.75)<3e-5);
  assert.ok(Math.abs(p.getY(i)-(a[1]+(b[1]-a[1])*along/length))<1e-5);
 }
 const {width,height,data}=m.map.image,pixel=(u,y)=>{const i=(y*width+Math.floor(u*width))*4;return [...data.slice(i,i+3)];};
 for(const y of [20,90,180]){const yellow=pixel(.78,y),metal=pixel(.40,y);assert.ok(yellow[0]>yellow[2]+90);assert.ok(Math.max(...metal)-Math.min(...metal)<20);}
 assert.equal(width*height,512*256);assert.notDeepEqual(pixel(.40,13),pixel(.40,22),'transverse slots remain visible within each panel');
});
test('Keihan source identity, P2 direction and exact existing street junction remain independent of JR',()=>{
 const s=createKeihanStationSpec(features,surfaces);assert.equal(s.source.platform2,'way/223276787');assert.deepEqual(s.publicExit.position,[-301.277,30.03,-124.745]);assert.ok(s.track.direction[1]>.99&&s.track.direction[0]<0);assert.equal(s.train.carLength,18.7);assert.equal(s.train.carWidth,2.792);
 assert.ok(!s.builtIds.includes('way/952687107'));assert.equal(createKeihanStationSpec({...features,buildings:[]},surfaces),null);assert.equal(createKeihanStationSpec(features,{height:()=>NaN}),null);assert.equal(createKeihanStationSpec({...features,paths:[{id:'way/952687115'}]},surfaces),null);
});
test('all seven actual car envelopes clear the unchanged P2 footprint after heading reconciliation',()=>{
 const api=fixture(),s=api.spec;api.group.updateMatrixWorld(true);assert.ok(Math.abs(s.track.headingResolution)<.005);
 assert.deepEqual(s.arrival.platformPose.position,[-306.13318304024045,s.platformFloor+1.7,-181.94937578929026]);
 let samples=0,solidSamples=0;for(const center of s.train.carCenters)for(let v=center-s.train.carLength/2+.1;v<center+s.train.carLength/2;v+=.25){
  assert.ok(keihanTrainPlatformGap(s,v)>.159,'whole formation gap');const p=s.track.local(0,v),ray=new THREE.Raycaster(new THREE.Vector3(p[0],s.train.floor+.05,p[1]),new THREE.Vector3(s.track.east[0],0,s.track.east[1]),0,2);
  const hits=ray.intersectObject(api.trainGroup,true).filter(h=>!h.object.material.transparent);samples++;if(hits.length)solidSamples++;
  for(const h of hits)assert.equal(insideKeihanPolygon(h.point.x,h.point.z,s.platform2.points),false,`car mesh overlaps P2 at v${v}`);
 }
 assert.ok(solidSamples/samples>.95,'actual body covered by physical ray samples, apart from narrow door seams');
});
test('both continuous ramp side rails physically stop lateral body motion',()=>{
 const api=fixture(),s=api.spec,world=new SpatialCollisionWorld();for(const c of api.colliders)world.addBox(...c.args);
 const a=s.gate.rampHead,b=s.gate.rampFoot,dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),normal=[dz/len,-dx/len];assert.equal(api.colliders.filter(c=>c.args.at(-1)==='keihan-ramp-side-rail').length,2);
 for(const side of [-1,1])for(const t of [.1,.5,.9]){const x=a[0]+dx*t+side*normal[0]*1.30,z=a[2]+dz*t+side*normal[1]*1.30,y=a[1]+(b[1]-a[1])*t,q=world.resolvePlayer(x,y+1.7,z,.28);assert.ok(Math.hypot(q.x-x,q.z-z)>.20);assert.ok(Number.isFinite(api.surfaceHeight(q.x,q.z)));}
});
test('handoff faces the east wall with the south gate to the right rather than cutting a false exit through it',()=>{
 const api=fixture(),s=api.spec,p=s.arrival.platformPose.position,t=s.arrival.platformPose.target;
 assert.ok(insideKeihanPolygon(p[0],p[2],s.platform2.points));assert.ok(t[0]>p[0]+4);assert.ok(s.route.gate[2]>p[2]+20);
 const ray=new THREE.Raycaster(new THREE.Vector3(...p),new THREE.Vector3(t[0]-p[0],0,t[2]-p[2]).normalize(),0,15);api.group.updateMatrixWorld(true);
 const hits=ray.intersectObject(api.group,true).filter(h=>!h.object.material.transparent);assert.ok(hits.length>0);assert.ok(hits[0].point.x>p[0]+2,'wall must be ahead, not through player');
});
test('source objects remain immutable, duplicate builds reuse ownership, and geometry stays bounded',()=>{
 const root=new THREE.Group(),before=JSON.stringify(features),api=buildKeihanStation(root,{},features,surfaces);assert.equal(api.built,true);assert.equal(buildKeihanStation(root,{},features,surfaces),api);assert.equal(JSON.stringify(features),before);
 let triangles=0,meshes=0;api.group.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;meshes++;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}});
 assert.ok(triangles<30000,`${triangles} triangles`);assert.ok(meshes<=46,`${meshes} meshes`);assert.ok(api.colliders.length<45);assert.equal(api.group.children.filter(o=>o.isLight).length,0);
});
test('selected door leaves and train offset are deterministic and preserve closed state on replay',()=>{
 const api=fixture(),doors=[];api.trainGroup.traverse(o=>{if(o.isGroup&&o.name.startsWith('Keihan car'))doors.push(o);});assert.equal(doors.length,2);const before=doors.map(d=>d.position.z);
 api.setDoorOpen(1);for(let i=0;i<2;i++)assert.ok(Math.abs(Math.abs(doors[i].position.z-before[i])-.68)<1e-8);api.setDoorOpen(0);assert.deepEqual(doors.map(d=>d.position.z),before);
 const stop=api.trainGroup.position.clone();api.setTrainOffset([0,0,-24]);assert.equal(api.thresholdGroup.visible,false);api.setTrainOffset([0,0,0]);assert.ok(api.trainGroup.position.equals(stop));assert.equal(api.thresholdGroup.visible,true);assert.throws(()=>api.setTrainOffset([NaN,0,0]));api.setMode('night');api.setMode('day');
});
test('automatic doorway has a clear human opening, transparent closed window and a sourced platform gap',()=>{
 const api=fixture(),s=api.spec;api.setDoorOpen(1);api.group.updateMatrixWorld(true);
 const hits=(v,h)=>{const p=s.track.local(0,v);return new THREE.Raycaster(new THREE.Vector3(p[0],s.train.floor+h,p[1]),new THREE.Vector3(s.track.east[0],0,s.track.east[1]),0,1.7).intersectObject(api.trainGroup,true);};
 for(const offset of [-.54,0,.54])for(const y of [.3,1.2,2.05])assert.equal(hits(s.train.selectedV+offset,y).length,0);
 api.setDoorOpen(0);api.group.updateMatrixWorld(true);const closed=hits(s.train.selectedV+.1,1.66);assert.ok(closed.length>0);assert.ok(closed.every(h=>h.object.material.transparent));assert.ok(Math.abs(keihanTrainPlatformGap(s,s.train.selectedV)-.16)<1e-8);
 for(let v=s.train.carCenters[s.train.selectedCar]-9.35;v<s.train.carCenters[s.train.selectedCar]+9.35;v+=.25)assert.ok(keihanTrainPlatformGap(s,v)>.05);
});
test('automatic egress and right-turn gate ramp are supported, collision clear and have bounded grades',()=>{
 const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url),'utf8')),paved=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
 const api=fixture(paved),world=new SpatialCollisionWorld();for(const c of api.colliders)world.addBox(...c.args);api.setDoorOpen(1);api.group.updateMatrixWorld(true);
 for(let i=1;i<api.routePoints.length;i++){
  const a=api.routePoints[i-1],b=api.routePoints[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),count=Math.ceil(len/.12);
  for(const offset of [-.25,0,.25])for(let j=0;j<=count;j++){
   const t=j/count,x=a[0]+dx*t-dz/len*offset,z=a[2]+dz*t+dx/len*offset,y=api.surfaceHeight(x,z);
   assert.ok(Number.isFinite(y),`missing floor segment${i} ${x},${z}`);const q=world.resolvePlayer(x,y+1.7,z,.28);assert.ok(Math.hypot(q.x-x,q.z-z)<.01,`collision segment${i} ${x},${z}`);
   const ray=new THREE.Raycaster(new THREE.Vector3(x,y+.06,z),new THREE.Vector3(0,-1,0),0,.12),hits=ray.intersectObject(api.group,true);assert.ok(hits.some(h=>Math.abs(h.point.y-y)<.035),`missing physical top ${i} ${x},${z}`);
  }
 }
 assert.equal(api.surfaceHeight(0,0),null);assert.equal(api.surfaceHeight(-306,-120),null);
 const a=api.spec.gate.rampHead,b=api.spec.gate.rampFoot;assert.ok((a[1]-b[1])/Math.hypot(a[0]-b[0],a[2]-b[2])<.06);
});
test('the right-turn exit sign is on the passenger face of the outer wall',()=>{
 const api=fixture(),sign=api.group.getObjectByName('出口  Exit  →');api.group.updateMatrixWorld(true);
 const origin=sign.position.clone().add(new THREE.Vector3(-1.5,0,0)),ray=new THREE.Raycaster(origin,new THREE.Vector3(1,0,0),0,2);
 assert.equal(ray.intersectObject(api.group,true)[0]?.object,sign);
});
test('ramp head has one top on both sides of the diagonal join, without coplanar slabs',()=>{
 const api=fixture(),s=api.spec;api.group.updateMatrixWorld(true);
 for(const x of [-303.3,-302.6,-301.9])for(const z of [-149.95,-149.7,-149.45]){
  const y=api.surfaceHeight(x,z);assert.ok(Number.isFinite(y));const hits=new THREE.Raycaster(new THREE.Vector3(x,y+.02,z),new THREE.Vector3(0,-1,0),0,.04).intersectObject(api.group,true).filter(h=>Math.abs(h.point.y-y)<1e-5);assert.equal(hits.length,1,`${x},${z}`);
 }
});

test('passenger posters have three distinct purposes and retain one bounded material batch',()=>{
 const api=fixture(),posters=[];api.group.traverse(o=>{if(o.isMesh&&o.material.name==='Keihan passenger information atlas')posters.push(o);});
 assert.equal(posters.length,1);assert.deepEqual(posters[0].material.userData.panels,['Keihan line guide','Platform 2 information','Shrine access']);
 const uv=posters[0].geometry.attributes.uv;assert.ok(uv.count>=18);for(const value of uv.array)assert.ok(value>=0&&value<=1);
});

test('architectural surface roles isolate the platform deck and walls from the train, roof beams and molded seats',()=>{
 const api=fixture(),surfaces=[];api.group.traverse(o=>{if(o.isMesh&&o.material.userData.stationSurfaceRole)surfaces.push(o);});
 assert.equal(surfaces.filter(o=>o.material.userData.stationSurfaceRole==='platform-deck').length,1);
 const walls=surfaces.filter(o=>o.material.userData.stationSurfaceRole==='platform-wall');assert.equal(walls.length,3);
 for(const mesh of walls){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(p.getY(i)<=api.spec.platformFloor+3.101,'canopy beams excluded');}
 api.trainGroup.traverse(o=>{if(o.isMesh)assert.equal(o.material.userData.stationSurfaceRole,undefined);});
});
