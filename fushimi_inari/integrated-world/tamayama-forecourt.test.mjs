import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildTamayamaForecourt} from './tamayama-forecourt.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs';

test('actual mapped neighbourhood produces one bounded batch without changing walking, terrain or source geometry',()=>{
  const features=tamayamaAccessFeatures(JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))));
  const paths=features.paths.filter(p=>Math.max(...p.points.map(q=>q[0]))>98&&Math.min(...p.points.map(q=>q[0]))<105&&Math.max(...p.points.map(q=>q[2]))>-40&&Math.min(...p.points.map(q=>q[2]))<-27);
  const network=makePathSurfaces({paths},()=>50.083474),walking=network.height,terrain=network.terrainHeight,source=JSON.stringify(network.segments);
  const root=new THREE.Group(),shrine=new THREE.Group();shrine.userData={zone:'tamayama',tamayamaDetail:{}};
  shrine.position.set(103.331,50.083474,-33.979);shrine.rotation.y=-Math.PI/2;root.add(shrine);
  const gravel=new THREE.MeshStandardMaterial(),record=buildTamayamaForecourt(root,features,network,{gravelMat:gravel});
  assert.ok(record.area>10&&record.area<20);assert.ok(record.triangles<1600);assert.equal(record.materialBatches,1);
  const mesh=root.getObjectByName('Tamayama photographed mineral forecourt'),p=mesh.geometry.attributes.position;
  assert.notEqual(mesh.material,gravel);assert.equal(mesh.castShadow,false);
  for(let i=0;i<p.count;i++){assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));assert.ok(Math.abs(p.getY(i)-(terrain(p.getX(i),p.getZ(i))+.012))<1e-5);}
  for(let i=0;i<p.count;i+=3){
    const ax=p.getX(i),az=p.getZ(i),bx=p.getX(i+1),bz=p.getZ(i+1),cx=p.getX(i+2),cz=p.getZ(i+2);
    assert.ok((bz-az)*(cx-ax)-(bx-ax)*(cz-az)>0,'upward nondegenerate triangles');
  }
  assert.equal(network.height,walking);assert.equal(network.terrainHeight,terrain);assert.equal(JSON.stringify(network.segments),source);
  assert.equal(buildTamayamaForecourt(root,features,network,{gravelMat:gravel}),null);
  assert.equal(root.children.length,2);
});
test('continuation mineral surface consumes actual rendered planes, preserving path holes and all source heights',()=>{
  const features=tamayamaAccessFeatures(JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))));
  const paths=features.paths.filter(p=>p.points.some(q=>q[0]>90&&q[0]<110&&q[2]>-45&&q[2]<-10)),network=makePathSurfaces({paths},()=>50.083474);
  network.terrainHeight=()=>100;const before=JSON.stringify(network.segments),walking=network.height,terrain=network.terrainHeight;
  const root=new THREE.Group(),shrine=new THREE.Group();shrine.userData={zone:'tamayama',tamayamaDetail:{}};shrine.position.set(103.331,50.083474,-33.979);shrine.rotation.y=-Math.PI/2;root.add(shrine);
  const plane=(x,z)=>50+(x-97)*.05+(z+30)*.08,p=(x,z)=>[x,plane(x,z),z];
  const positions=[...p(90,-45),...p(90,-10),...p(110,-45),...p(110,-45),...p(90,-10),...p(110,-10)],source=JSON.stringify(positions);
  const record=buildTamayamaForecourt(root,features,network,{gravelMat:new THREE.MeshStandardMaterial()},{terrainPositions:positions});
  assert.ok(record.continuationArea>45&&record.continuationArea<90);assert.ok(record.shrineArea>10&&record.shrineArea<20);assert.equal(record.materialBatches,1);assert.match(record.terrainRegistration,/shared rendered triangle/);
  const mesh=root.getObjectByName('Tamayama photographed mineral forecourt'),a=mesh.geometry.attributes.position;
  for(let i=0;i<a.count;i++)assert.ok(Math.abs(a.getY(i)-plane(a.getX(i),a.getZ(i))-.003)<1e-5,'mineral must follow actual rendered triangle, not raw100m height function');
  const branch=features.paths.find(p=>p.id==='way/297888105'),q=branch.points[0],r=branch.points[1],dx=r[0]-q[0],dz=r[2]-q[2];
  for(let i=0;i<a.count;i+=3){const x=(a.getX(i)+a.getX(i+1)+a.getX(i+2))/3,z=(a.getZ(i)+a.getZ(i+1)+a.getZ(i+2))/3;if(z> -29&&z< -25){const t=Math.max(0,Math.min(1,((x-q[0])*dx+(z-q[2])*dz)/(dx*dx+dz*dz)));assert.ok(Math.hypot(x-q[0]-t*dx,z-q[2]-t*dz)>=1.1299,'central source stair remains a hole');}}
  assert.equal(JSON.stringify(positions),source);assert.equal(JSON.stringify(network.segments),before);assert.equal(network.height,walking);assert.equal(network.terrainHeight,terrain);
});
