import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as THREE from 'three';
import {refineKumatakasha} from './mountain-landmarks-kumataka.mjs';
import {buildKumatakaLakesideRail} from './kumataka-lakeside-rail.mjs';
import {buildKumatakaRegistrationR97,kumatakaRegistrationPlanR97} from './kumataka-registration-r97.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fixture(){
  const root=new THREE.Group(),owner=new THREE.Group();owner.userData.zone='kumataka';owner.position.set(545.254396455114,65.89652051629592,-129.16842947649747);owner.rotation.y=-1.162212928391673;root.add(owner);
  const materials={};for(const k of ['stoneMat','entryStoneMat','copperRoofMat','goldMat','vermilionMat'])materials[k]=new THREE.MeshStandardMaterial();
  const add=(w,h,d,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.stoneMat);o.position.set(x,y,z);owner.add(o);return o;};
  const body=add(4.2,2.9,5.2,-5.8,1.85,0);body.userData.interactable={onTrigger:()=>42};
  add(6,.62,6.8,-5.8,3.45,0);const curtain=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),materials.stoneMat);curtain.position.set(-3.62,2.55,0);owner.add(curtain);
  add(.10,.85,.45,-3.45,3.18,0);add(4.8,.72,5.8,-5.8,.36,0);add(9.2,.35,11.5,-2.2,.12,0);add(1.15,1.1,18.5,2.4,.18,0);add(.18,.92,16.8,2.55,1.05,0);add(.22,.10,17,2.55,1.54,0);
  for(const z of [-2.4,2.4]){const c=new THREE.Group();c.position.set(-3.3,.25,z);owner.add(c);}
  const markers=[];for(let i=0;i<28;i++){const h=1.1+i%3*.32;markers.push(add(.56,h,.30,-9.2-i%4*1.35,h/2+i%4*.18,-8.5+Math.floor(i/4)*2.5));}
  add(1.5,.82,1.1,-4.2,.48,5.2);add(2.2,.32,1.8,-4.2,2.35,5.2);
  const pond=new THREE.Mesh(new THREE.PlaneGeometry(18,22),materials.stoneMat);pond.rotation.x=-Math.PI/2;pond.position.set(10.5,-.18,0);owner.add(pond);refineKumatakasha(owner,materials);buildKumatakaLakesideRail(root,materials);owner.updateWorldMatrix(true,true);
  const center=body.getWorldPosition(new THREE.Vector3()),colliders=[{type:'box',args:[center.x,center.z,2.5,3,-1.162212928391673,65.8965,69.69,'kumatakasha']}];
  return {root,owner,materials,body,markers,pond,colliders,surfaces:{terrainHeight:()=>66.312874}};
}
test('actual mapped roof controls pavilion front toward Takeya, not pond centroid',()=>{
  const plan=kumatakaRegistrationPlanR97(features);assert.ok(plan.front[0]<-.87&&plan.front[1]<-.48);assert.ok(plan.scale[0]>.79&&plan.scale[0]<.80&&plan.scale[2]>1.06);
  const f=fixture(),callback=f.body.userData.interactable,pondPosition=f.pond.position.clone(),pondGeometry=f.pond.geometry;
  const r=buildKumatakaRegistrationR97(f.root,features,f.surfaces,f.materials,f.colliders);assert.ok(r);assert.equal(f.body.userData.interactable,callback);assert.equal(callback.onTrigger(),42);
  assert.equal(f.pond.parent,f.owner);assert.ok(f.pond.position.equals(pondPosition));assert.equal(f.pond.geometry,pondGeometry);assert.equal(r.pondChanged,false);
  f.root.updateMatrixWorld(true);const center=new THREE.Vector3(-5.8,0,0).applyMatrix4(f.body.parent.matrixWorld);assert.ok(Math.hypot(center.x-plan.center[0],center.z-plan.center[1])<1e-7);
  const facing=new THREE.Vector3(1,0,0).transformDirection(f.body.parent.matrixWorld);assert.ok(facing.x<-.87&&facing.z<-.48);
  assert.ok(r.clearedSteleIndices.includes(11)&&r.clearedSteleIndices.includes(16));assert.ok(r.clearedSteleIndices.length<20);assert.equal(f.markers[0].parent,f.owner);
  assert.ok(r.batches<=3&&r.triangles<4000);r.group.traverse(o=>{if(o.isMesh)for(const x of o.geometry.attributes.position.array)assert.ok(Number.isFinite(x));});
  assert.ok(Math.abs(r.pier.waterLevel-65.71652051629592)<1e-8);assert.ok(Math.abs(r.pier.bottom-(r.pier.waterLevel-.15))<1e-8);assert.equal(r.pier.width,.43);assert.ok(r.pier.top>r.floor+.079);
  for(const [a,b]of r.pier.segments){assert.ok(Math.hypot(b[0]-a[0],b[1]-a[1])<8);for(const q of [a,b])assert.ok(Math.hypot(q[0]-plan.center[0],q[1]-plan.center[1])<6);}
  assert.equal(r.temizuya.previousPathOverlaps.length,1);assert.equal(r.temizuya.previousPathOverlaps[0].geometry.width,2.2);assert.ok(Math.abs(r.temizuya.previousPathOverlaps[0].area-.1258225)<1e-5);assert.equal(r.temizuya.pathOverlapArea,0);assert.equal(r.temizuya.pondOverlapArea,0);assert.ok(r.temizuya.front[0]<0&&r.temizuya.front[1]>0);
  for(const [a,b]of r.pier.segments){const ray=new THREE.Raycaster(new THREE.Vector3((a[0]+b[0])/2,80,(a[1]+b[1])/2),new THREE.Vector3(0,-1,0));assert.ok(ray.intersectObject(r.group,true).some(h=>Math.abs(h.point.y-r.pier.top)<5e-5),'actual pier cap supports the rail on both bank and return segments');}
  assert.equal(buildKumatakaRegistrationR97(f.root,features,f.surfaces,f.materials,f.colliders),null);
});
test('validated water owner supplies pier datum after the exact legacy plane is removed',()=>{
  const f=fixture();f.pond.removeFromParent();const water={built:true,builtIds:['way/105449705'],waterLevel:65.3145032521};
  const r=buildKumatakaRegistrationR97(f.root,features,f.surfaces,f.materials,f.colliders,{water});assert.ok(r);assert.equal(r.pier.waterLevel,water.waterLevel);assert.equal(r.pier.bottom,water.waterLevel-.15);assert.equal(r.triangles,2846);assert.equal(r.slats,63);
  const invalid=fixture(),before=[...invalid.owner.children];assert.equal(buildKumatakaRegistrationR97(invalid.root,features,invalid.surfaces,invalid.materials,invalid.colliders,{water:{...water,builtIds:['wrong']}}),null);assert.deepEqual(invalid.owner.children,before);
});
test('arrival and onward center and side walking lanes remain clear of registered pavilion and connected rail',()=>{
  const f=fixture(),r=buildKumatakaRegistrationR97(f.root,features,f.surfaces,f.materials,f.colliders);assert.ok(r);
  const world=new SpatialCollisionWorld();for(const c of f.colliders)world[c.type==='box'?'addBox':'addCylinder'](...c.args);
  const priorProblem=world.resolvePlayer(539.210063,67.862874,-135.621878,.28);assert.ok(Math.hypot(priorProblem.x-539.210063,priorProblem.z+135.621878)<1e-8,'former .256m collider shove is now zero');
  f.root.updateMatrixWorld(true);const roofRay=new THREE.Raycaster(new THREE.Vector3(539.210063,80,-135.621878),new THREE.Vector3(0,-1,0));assert.equal(roofRay.intersectObject(r.group,true).length,0,'mapped architecture no longer overhangs the old failing lane point');
  for(const path of features.paths.filter(p=>['way/626313754','way/301527750'].includes(p.id)))for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
    for(let j=0;j<=40;j++)for(const offset of [-.65,0,.65]){const t=j/40,x=a[0]+dx*t-dz/len*offset,z=a[2]+dz*t+dx/len*offset,q=world.resolvePlayer(x,67.862874,z,.28);assert.ok(Math.hypot(q.x-x,q.z-z)<1e-6);}
  }
  assert.ok(r.rail[0][0]>543&&r.rail[1][0]>546);assert.ok(r.slats>35);
});
test('unrecognized architecture or unsupported grade leaves original owners and colliders intact',()=>{
  for(const invalid of ['source','ground']){const f=fixture(),children=[...f.owner.children],collision=JSON.stringify(f.colliders);
    assert.equal(buildKumatakaRegistrationR97(f.root,invalid==='source'?{...features,buildings:[]}:features,invalid==='ground'?{terrainHeight:()=>NaN}:f.surfaces,f.materials,f.colliders),null);
    assert.deepEqual(f.owner.children,children);assert.equal(JSON.stringify(f.colliders),collision);
  }
});
test('photographed southwest passage closure joins registered body and has supported physical slats outside public routes',()=>{
  const f=fixture(),r=buildKumatakaRegistrationR97(f.root,features,f.surfaces,f.materials,f.colliders);assert.ok(r);assert.equal(r.pier.segments.length,3);
  const [a,b]=r.pier.segments[2];assert.deepEqual(a,r.rail[0]);assert.ok(Math.hypot(b[0]-543.030998,b[1]+131.420229)<1e-5);
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;assert.ok(len>1.69&&len<1.71);
  const footprint=[[a[0]+nx*.215,a[1]+nz*.215],[b[0]+nx*.215,b[1]+nz*.215],[b[0]-nx*.215,b[1]-nz*.215],[a[0]-nx*.215,a[1]-nz*.215]];
  for(const path of features.paths.filter(p=>['way/626313754','way/301527750'].includes(p.id)))for(let i=1;i<path.points.length;i++){
    const p=path.points[i-1],q=path.points[i],dx=q[0]-p[0],dz=q[2]-p[2],l=Math.hypot(dx,dz),half=(parseFloat(path.tags.width)||2)/2+.28,n=[-dz/l*half,dx/l*half];
    const strip=[[p[0]+n[0],p[2]+n[1]],[q[0]+n[0],q[2]+n[1]],[q[0]-n[0],q[2]-n[1]],[p[0]-n[0],p[2]-n[1]]];assert.ok(Math.abs(polygonArea(clipConvex(footprint,strip)))<1e-6,'full pier width clears public route plus player buffer');
  }
  f.root.updateMatrixWorld(true);
  const rayAt=(t,y)=>new THREE.Raycaster(new THREE.Vector3(a[0]+dx*t+nx*.4,y,a[1]+dz*t+nz*.4),new THREE.Vector3(-nx,0,-nz),0,.8).intersectObject(r.group,true);
  assert.ok(rayAt(.5,r.floor+.8).length>0,'middle return slat is actual solid geometry');
  assert.equal(rayAt(.55,r.floor+.8).length,0,'adjacent return slat gap remains physically open');
  const collider=f.colliders.filter(c=>c.args.at(-1)==='kumataka_mapped_lakeside_rail').at(-1);assert.ok(Math.abs(collider.args[0]-(a[0]+b[0])/2)<1e-8&&Math.abs(collider.args[1]-(a[1]+b[1])/2)<1e-8);
  const vertical=new THREE.Raycaster(new THREE.Vector3((a[0]+b[0])/2,80,(a[1]+b[1])/2),new THREE.Vector3(0,-1,0));assert.ok(vertical.intersectObject(r.group,true).some(h=>Math.abs(h.point.y-r.pier.top)<5e-5));
});
