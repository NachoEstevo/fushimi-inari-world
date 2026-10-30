import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createKeihanStationSpec} from './keihan-station-spec.mjs';
import {createStationTactileDetail} from './station-tactile-detail.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
const fixture=()=>({group:new THREE.Group(),spec:createKeihanStationSpec(features,{height:()=>30.03})});

test('central High warning studs exactly follow both existing strip centres within fixed geometry and draw budgets',()=>{
 const station=fixture(),detail=createStationTactileDetail(station),{mesh,group,stats}=detail;
 assert.equal(group.parent,station.group);assert.equal(group.visible,false);assert.equal(mesh.count,4000);
 assert.equal(stats.instances,4000);assert.equal(stats.draws,0);assert.equal(stats.extraLights,0);
 const triangles=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;
 assert.ok(triangles<=24);assert.ok(triangles*mesh.count<=120000);
 assert.equal(mesh.castShadow,false);assert.equal(mesh.frustumCulled,true);assert.equal(mesh.material.bumpMap,null);
 assert.equal(mesh.instanceMatrix.usage,THREE.StaticDrawUsage);
 const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),spec=station.spec,door=spec.train.doorPosition;
 let count=0;
 for(const [platform,side]of [[spec.platform2,1],[spec.platform1,-1]]){
  const a=platform.points[side===1?0:1],b=platform.points[side===1?1:2],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
  const center=(door[0]-a[0])*dx+(door[2]-a[1])*dz;
  for(let column=0;column<400;column++)for(let row=0;row<5;row++){
   mesh.getMatrixAt(count++,matrix);point.setFromMatrixPosition(matrix);
   const x=point.x-a[0]-spec.track.east[0]*.46*side,z=point.z-a[1]-spec.track.east[1]*.46*side;
   assert.ok(Math.abs(x*dz-z*dx-(row-2)*.06)<.00005,'five rows stay centred on the existing wall strip');
   assert.ok(Math.abs(x*dx+z*dz-center)<=12,'only the central twenty-four metres receive geometry');
   assert.ok(Math.abs(point.y-(spec.platformFloor+.020))<.00001);
   assert.ok((row-2)*.06+.012<.17,'cap remains within the unchanged .34 m strip');
   assert.ok(mesh.boundingSphere.containsPoint(point));
  }
 }
 const version=mesh.instanceMatrix.version,geometry=mesh.geometry,material=mesh.material;
 for(const enabled of [true,false,true]){detail.setEnabled(enabled);assert.equal(group.visible,enabled);assert.equal(stats.draws,Number(enabled));}
 assert.equal(mesh.instanceMatrix.version,version);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
 let geometries=0,materials=0,instances=0;geometry.addEventListener('dispose',()=>geometries++);material.addEventListener('dispose',()=>materials++);mesh.addEventListener('dispose',()=>instances++);
 detail.dispose();detail.dispose();detail.setEnabled(true);
 assert.equal(group.parent,null);assert.equal(group.visible,false);assert.deepEqual([geometries,materials,instances],[1,1,1]);
});

test('unsupported station contracts add no geometry or resource owners',()=>{
 for(const station of [{group:new THREE.Group()},{group:new THREE.Group(),spec:{platformFloor:NaN}}]){
  assert.equal(createStationTactileDetail(station),null);assert.equal(station.group.children.length,0);
 }
});

test('existing bounded reflection surrogate excludes the instanced detail rather than multiplying probe geometry',{skip:!['180','186'].includes(THREE.REVISION)},async()=>{
 const {createStationReflectionProxy}=await import('./station-reflection-proxy.mjs');
 const station=fixture(),source=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());station.group.add(source);
 const detail=createStationTactileDetail(station);detail.setEnabled(true);
 const proxy=await createStationReflectionProxy(station,{yieldStage:async()=>{}});
 assert.equal(proxy.stats.meshes,1);assert.equal(proxy.stats.triangles,12);assert.equal(proxy.stats.skipped,1);
 proxy.dispose();detail.dispose();source.geometry.dispose();source.material.dispose();
});
