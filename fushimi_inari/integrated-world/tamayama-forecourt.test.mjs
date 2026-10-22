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
