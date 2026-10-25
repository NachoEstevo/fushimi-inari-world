import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {registerMitsurugi} from './mitsurugi-registration.mjs';
import {rotateXZ} from './spatial.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));

test('Mitsurugi retains a physical shrine within mapped bounds and clears the actual returning trail',()=>{
  const root=new THREE.Group(),owner=new THREE.Group(),compound=new THREE.Group();
  owner.userData.zone='mitsurugi';compound.name='Mitsurugi authored sanctuary compound';
  compound.position.z=-1;
  for(const [w,h,d,x,y,z] of [[9.2,1.02,8.2,0,.51,-3.85],[5.65,.42,4.45,0,4.39,-1.35],[2.2,.35,2.2,-3.8,3.17,.8]]){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d));mesh.position.set(x,y,z);compound.add(mesh);
  }
  owner.add(new THREE.Mesh(new THREE.BoxGeometry(12.5,.4,13)),compound);root.add(owner);
  owner.position.set(1202,184,-169);owner.rotation.y=1.2;
  const unrelated={type:'box',args:[500,500,4,3,0,0,5,'peak_sanctuary']};
  const colliders=[{type:'box',args:[1202,-169,4,2,0,180,190,'peak_sanctuary']},unrelated];
  const report=registerMitsurugi(root,features,{height:()=>183.9},colliders);
  assert.ok(report.built);assert.ok(report.width>3&&report.width<3.5);assert.ok(report.depth>5&&report.depth<5.5);
  assert.equal(report.replacedColliders,1);assert.ok(colliders.includes(unrelated));
  const shrine=colliders.find(c=>c.args.at(-1)==='mitsurugi_mapped_shrine');assert.ok(shrine);
  assert.equal(owner.children.length,1,'generic oversize apron is removed');
  root.updateMatrixWorld(true);
  compound.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
    const [lx,lz]=rotateXZ(v.x-report.center[0],v.z-report.center[2],-report.yaw);
    assert.ok(Math.abs(lx)<=report.width/2+1e-5);assert.ok(Math.abs(lz)<=report.depth/2+1e-5);
  }});
  let checked=0;
  for(const id of ['way/1270597604','way/649037623']){
    const path=features.paths.find(p=>p.id===id);
    for(let i=1;i<path.points.length;i++)for(let step=0;step<=20;step++){
      const t=step/20,a=path.points[i-1],b=path.points[i],x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;
      const [lx,lz]=rotateXZ(x-report.center[0],z-report.center[2],-report.yaw);
      assert.ok(Math.abs(lx)>report.width/2+.3||Math.abs(lz)>report.depth/2+.3,`${id} segment ${i} t ${t}`);checked++;
    }
  }
  assert.ok(checked>400);assert.equal(registerMitsurugi(root,features,{height:()=>0},colliders),report);
});

test('missing or ambiguous Mitsurugi ownership leaves scene and colliders intact',()=>{
  const root=new THREE.Group(),colliders=[];
  assert.equal(registerMitsurugi(root,features,{height:()=>0},colliders).built,false);
  assert.equal(root.children.length,0);assert.equal(colliders.length,0);
});
