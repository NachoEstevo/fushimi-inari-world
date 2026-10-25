import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPublicWalkDomain,createPublicGravelSupport} from './public-walk-domain.mjs';
import {rotateXZ} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {heightAt} from '../geography/geo-core.mjs';

test('retains every actual mapped support segment, including branches, streets and both edges',()=>{
  const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
  const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url),'utf8'));
  const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
  const domain=createPublicWalkDomain({surfaces,isWalkable:(x,z)=>!!surfaces.sample(x,z)});
  let samples=0;
  for(const s of surfaces.segments){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);
    if(!length)continue;
    for(const t of [0,.25,.5,.75,1])for(const offset of [-s.width/2,0,s.width/2]){
      const x=s.a[0]+dx*t-dz/length*offset,z=s.a[2]+dz*t+dx/length*offset;
      assert.equal(domain.contains(x,z),true,`${s.id} t=${t} offset=${offset}`);samples++;
    }
  }
  assert.ok(samples>10000);assert.equal(domain.contains(1e6,1e6),false);
});

test('unions station owners and explicit plaza support without granting the surrounding terrain',()=>{
  const a={isWalkable:(x,z)=>Math.abs(z)<1&&x>=0&&x<=10,isPublicWalkSupport:(x,z)=>x>=4&&x<=6&&z>=1&&z<=4};
  const domain=createPublicWalkDomain(a);
  assert.ok(domain.contains(5,3));assert.ok(domain.contains(2,0));
  assert.equal(domain.contains(3,3),false);assert.equal(domain.contains(NaN,0),false);
  assert.deepEqual(domain.resolveMove([5,99,3],[5,99,3]),[5,99,3]);
  assert.equal(domain.resolveMove([3,99,3],[3,99,3]),null);
});

test('clips an exit, keeps tangent movement and cannot tunnel across unsupported gaps',()=>{
  const domain=createPublicWalkDomain({isWalkable:(x,z)=>Math.abs(z)<=1&&(x<=2||x>=3)});
  const stopped=domain.resolveMove([0,10,0],[4,10,0]);
  assert.ok(stopped[0]<=2);assert.ok(stopped[0]>1.99);assert.equal(stopped[1],10);
  const slide=domain.resolveMove([0,10,0],[1,10,3]);
  assert.ok(slide[0]>.99);assert.ok(slide[2]<=1);assert.ok(domain.contains(slide[0],slide[2]));
});

test('height and gate ownership remain external, and support owners can change dynamically',()=>{
  let open=true;
  const domain=createPublicWalkDomain({isWalkable:()=>open});
  assert.deepEqual(domain.resolveMove([1,200,1],[2,200,2]),[2,200,2]);
  open=false;assert.equal(domain.resolveMove([1,200,1],[2,200,2]),null);
  assert.equal(domain.resolveMove([1,200,1],[Infinity,200,2]),null);
  assert.throws(()=>createPublicWalkDomain({}, {sampleSpacing:0}),RangeError);
});
import * as THREE from 'three';
import {createPublicFloorQuery} from './public-walk-domain.mjs';

function floorFixture(){
  const root=new THREE.Group(),stoneMat=new THREE.MeshBasicMaterial(),roofMat=new THREE.MeshBasicMaterial();
  const surfaces={height:()=>0};
  function face(x,y,z,width=4,material=stoneMat){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width),material);
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);root.add(mesh);return mesh;
  }
  return {root,stoneMat,roofMat,surfaces,face,query(){root.updateMatrixWorld(true);return createPublicFloorQuery(THREE,root,{stoneMat,entryStoneMat:stoneMat},surfaces);}};
}

test('actual floor ray grid admits paving through positive and negative cell boundaries',()=>{
  const f=floorFixture();f.face(0,.1,0,40);
  const hit=f.query();let samples=0;
  for(let x=-19;x<=19;x++)for(let z=-19;z<=19;z++){
    assert.ok(Math.abs(hit(x,z).point.y-.1)<1e-6,`${x},${z}`);samples++;
  }
  assert.equal(samples,1521);assert.equal(hit(21,0),null);
  const domain=createPublicWalkDomain({isPublicWalkSupport:(x,z)=>!!hit(x,z)});
  assert.ok(domain.contains(-16,-16));assert.equal(domain.contains(21,0),false);
});

test('actual floor query excludes terrain/roofs, raised decorative faces and lower floors',()=>{
  const f=floorFixture();f.face(0,.1,0);f.face(0,1,0);f.face(0,.2,0,4,f.roofMat);
  f.face(8,-.2,0);f.face(16,.5,0);f.face(24,0,0,4,f.roofMat);
  const hit=f.query();
  assert.ok(Math.abs(hit(0,0).point.y-.1)<1e-6);
  assert.equal(hit(8,0),null);assert.equal(hit(16,0),null);assert.equal(hit(24,0),null);
  assert.ok(Math.abs(hit(16,0,.4).point.y-.5)<1e-6);
});

test('actual floor query respects transformed paving and does not infer support from its bounding box',()=>{
  const f=floorFixture(),mesh=f.face(16,.1,16,4);mesh.rotation.z=Math.PI/4;
  const hit=f.query();assert.ok(hit(16,16));assert.equal(hit(18.7,18.7),null);
  const vertical=floorFixture(),wall=vertical.face(0,.1,0);wall.rotation.x=0;
  assert.equal(vertical.query()(0,0),null);
});

import {buildYotsutsuji} from './yotsutsuji.mjs';
import {yotsuGrade} from './site-grading.mjs';
test('real Yotsutsuji court retains the whole lookout and excludes the unsupported bank',()=>{
  const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
  const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
  const ground=(x,z)=>yotsuGrade(x,z,heightAt(terrain,x,z));
  const surfaces=makePathSurfaces(features,ground),root=new THREE.Group();
  const materials=Object.fromEntries(['vermilionMat','roofMat','plasterMat','stoneMat','entryStoneMat','flagstoneMat','blackNemakiMat'].map(k=>[k,new THREE.MeshStandardMaterial()]));
  buildYotsutsuji(root,{materials,torii:{fresh:materials.vermilionMat,weathered:materials.vermilionMat,geometry:new THREE.BoxGeometry(.01,.01,.01),blackGeometry:new THREE.BoxGeometry(.01,.01,.01)}},features,ground,[],surfaces);
  root.updateMatrixWorld(true);
  const hit=createPublicFloorQuery(THREE,root,materials,surfaces,ground);
  const domain=createPublicWalkDomain({surfaces,isPublicWalkSupport:(x,z)=>!!hit(x,z)});
  for(const [x,z] of [[793,-218],[794.8,-218],[797,-217],[800,-216],[805,-219]])assert.ok(domain.contains(x,z),`${x},${z}`);
  assert.ok(hit(793,-218),'cloned, downward-wound sloped forecourt supports its western lookout');
  assert.ok(hit(794.15,-220.4),'existing turf margin supports the city-facing bench approach');
  for(const [from,to] of [[[793,164,-218],[805,164,-218]],[[805,164,-218],[793,164,-218]]])assert.deepEqual(domain.resolveMove(from,to),to);
  for(const [x,z] of [[790,-219],[790,-217],[794,-222]])assert.equal(domain.contains(x,z),false,`${x},${z}`);
});

test('explicit cloned mineral court owners admit slopes using exact triangle footprints',()=>{
  for(const name of ['Tamayama photographed mineral forecourt','Tamayama upper access mineral shoulders','Shinsenjo bounded north mineral court R99']){
    const f=floorFixture(),mesh=f.face(0,.1,0,4,f.roofMat);mesh.name=name;
    mesh.rotation.z=.1;f.surfaces.height=(x)=>.1+x*.1;
    const hit=f.query();assert.ok(hit(0,0),name);assert.equal(hit(3,0),null,name);
  }
});

test('terrain-painted gravel admits only existing court/approach envelopes and excludes beds, buildings and water',()=>{
  const romon={target:[100,3,200],source:[0,0,0],yaw:.4};
  const world=(x,z)=>{const [dx,dz]=rotateXZ(x,z,romon.yaw);return [100+dx,0,200+dz];};
  const ring=(x,z)=>[world(x-1,z-1),world(x+1,z-1),world(x+1,z+1),world(x-1,z+1),world(x-1,z-1)];
  const gravel=createPublicGravelSupport(romon,{paths:[],buildings:[{points:ring(10,-20)}],water:[{points:ring(-10,-20)}]});
  const has=(x,z)=>{const p=world(x,z);return gravel(p[0],p[2]);};
  for(const p of [[0,-20],[29,-20],[45,0],[0,27]])assert.ok(has(...p),p.join(','));
  for(const p of [[10,-20],[-10,-20],[10,4],[0,-57],[70,0],[0,40]])assert.equal(has(...p),false,p.join(','));
  assert.equal(gravel(NaN,0),false);
});
