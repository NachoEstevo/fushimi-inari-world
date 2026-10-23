import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildYotsutsujiSupportsR95} from './yotsutsuji-support-r95.mjs';
import {yotsuForecourt} from './site-grading.mjs';

const stair={id:'way/1372826379',stair:true,a:[801.6,0,-210],b:[801.64,0,-209.2],ya:164.22,yb:164.22,width:2};
const ground=(x,z)=>163.8+(x-801)*.07+(z+216)*.015;
const stone=new THREE.MeshStandardMaterial();
test('actual court boundary and tread footprints receive vertical toe closure without new top faces',()=>{
 const root=new THREE.Group(),network={segments:[stair]},before=JSON.stringify(network),poly=JSON.stringify(yotsuForecourt);
 const r=buildYotsutsujiSupportsR95(root,network,ground,stone);
 assert.equal(r.built,true);assert.equal(r.treadBodies,1);assert.ok(r.courtPanels>50);assert.equal(r.drawBatches,1);
 assert.equal(r.terrainChanged,false);assert.equal(r.collidersAdded,0);
 const mesh=root.children[0],p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
 for(let i=0;i<p.count;i++){assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));assert.ok(Math.abs(n.getY(i))<1e-5,'support may not add horizontal walkable faces');}
 root.updateMatrixWorld(true);
 const side=new THREE.Raycaster(new THREE.Vector3(799,164,-209.6),new THREE.Vector3(1,0,0));
 assert.ok(side.intersectObject(root,true).length>0,'solid side beneath real tread');
 const down=new THREE.Raycaster(new THREE.Vector3(801.62,170,-209.6),new THREE.Vector3(0,-1,0));
 assert.equal(down.intersectObject(root,true).length,0,'source path alone owns the top');
 assert.equal(JSON.stringify(network),before);assert.equal(JSON.stringify(yotsuForecourt),poly);assert.equal(buildYotsutsujiSupportsR95(root,network,ground,stone),r);
});
test('only registered bounded stair bodies are closed and invalid sources fail without partial mesh',()=>{
 const source={segments:[{...stair,id:'unrelated'},{...stair,a:[801,0,-201],b:[801,0,-200]}]};
 const root=new THREE.Group();assert.equal(buildYotsutsujiSupportsR95(root,source,ground,stone).treadBodies,0);
 const bad=new THREE.Group();assert.equal(buildYotsutsujiSupportsR95(bad,{segments:[stair]},()=>NaN,stone).built,false);assert.equal(bad.children.length,0);
 const invalid=new THREE.Group();assert.equal(buildYotsutsujiSupportsR95(invalid,{segments:[{...stair,width:NaN}]},ground,stone).built,false);assert.equal(invalid.children.length,0);
});
