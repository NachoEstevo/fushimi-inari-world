import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildSenbon} from './senbon.mjs';
import {routeSpec} from './route-spec.mjs';

test('both twin tunnels gain headroom without moving gates or changing their footprint',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 const mat=()=>new THREE.MeshPhysicalMaterial();
 const legacy={torii:{fresh:mat(),weathered:mat()},materials:{vermilionMat:mat(),blackNemakiMat:mat(),lanternGlowMat:mat()}};
 const twins=[0,1].map(index=>({total:30,at:t=>({point:[index*4,0,t*30],yaw:0})}));
 const build=()=>{const root=new THREE.Group(),colliders=[];const report=buildSenbon(root,legacy,{twins},()=>4,colliders);return {root,colliders,report};};
 const current={height:routeSpec.senbon.height,crossbarUnderside:routeSpec.senbon.crossbarUnderside};
 try{
  routeSpec.senbon.height=2.55;routeSpec.senbon.crossbarUnderside=1.98;
  const before=build();Object.assign(routeSpec.senbon,current);const after=build();
  assert.equal(after.report.height,2.75);assert.equal(after.report.gates,before.report.gates);
  assert.equal(after.report.clearWidth,before.report.clearWidth);assert.equal(after.report.spacing,before.report.spacing);
  const beforeInstances=before.root.children.filter(o=>o.isInstancedMesh),afterInstances=after.root.children.filter(o=>o.isInstancedMesh);
  assert.equal(afterInstances.length,beforeInstances.length);
  for(let i=0;i<afterInstances.length;i++){
   const a=afterInstances[i],b=beforeInstances[i];assert.deepEqual(a.instanceMatrix.array,b.instanceMatrix.array);
   a.geometry.computeBoundingBox();b.geometry.computeBoundingBox();
   for(const axis of ['x','z']){assert.equal(a.geometry.boundingBox.min[axis],b.geometry.boundingBox.min[axis]);assert.equal(a.geometry.boundingBox.max[axis],b.geometry.boundingBox.max[axis]);}
   assert.ok(Math.abs(a.geometry.boundingBox.max.y-b.geometry.boundingBox.max.y-.20)<1e-5);
  }
  after.colliders.forEach((a,i)=>{
   const b=before.colliders[i];assert.deepEqual(a.args.slice(0,4),b.args.slice(0,4));assert.equal(a.args[5],b.args[5]);
   assert.ok(Math.abs((a.args[4]-a.args[3])/(b.args[4]-b.args[3])-2.75/2.55)<1e-10);
  });
  const fixtures=root=>root.children.filter(o=>o.isGroup&&o.name!=='Torii dedication ink');
  fixtures(after.root).forEach((a,i)=>a.children.forEach((mesh,j)=>assert.ok(Math.abs(mesh.position.y-fixtures(before.root)[i].children[j].position.y-.20)<1e-10)));
 }finally{Object.assign(routeSpec.senbon,current);if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
