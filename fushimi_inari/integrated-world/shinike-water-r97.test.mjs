import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildShinikeWaterR97,shinikeLayoutR97,SHINIKE_ID} from './shinike-water-r97.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),level=65.71652051629592;
const h=(x,z)=>66.20+.03*(x-530)+.015*(z+150);
function terrain(){const p=[];for(let x=520;x<590;x+=5)for(let z=-160;z< -60;z+=5)for(const [dx,dz]of [[0,0],[5,0],[0,5],[0,5],[5,0],[5,5]])p.push(x+dx,h(x+dx,z+dz),z+dz);return p;}
function fixture(){const root=new THREE.Group(),owner=new THREE.Group();owner.userData.zone='kumataka';owner.position.y=level+.18;root.add(owner);const plane=new THREE.Mesh(new THREE.PlaneGeometry(18,22),new THREE.MeshPhysicalMaterial({roughness:.07}));plane.position.set(10.5,-.18,0);plane.rotation.x=-Math.PI/2;owner.add(plane);return {root,plane,owner};}
test('actual Shin-ike ring yields one lower horizontal olive water and only removes exact legacy signature',()=>{
 const f=fixture(),plan=shinikeLayoutR97(features);assert.ok(plan);const other=new THREE.Mesh(new THREE.PlaneGeometry(18,22),new THREE.MeshPhysicalMaterial({roughness:.07}));f.root.add(other);
 const r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()});assert.equal(r.built,true,JSON.stringify(r));assert.deepEqual(r.builtIds,[SHINIKE_ID]);assert.equal(r.waterLevel,level);assert.equal(f.plane.parent,null);assert.equal(other.parent,f.root);assert.equal(buildShinikeWaterR97(f.root,features),r);assert.equal(r.materialBatches,2);assert.equal(r.walkingChanged,false);assert.equal(r.collidersAdded,0);
 const water=f.root.getObjectByName('Shin-ike flat olive-gray water R97');assert.equal(water.material.userData.waterAppearance.kind,'shinike');const p=water.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-level)<.00001);
});
test('exact water cut preserves exterior planes and distant triangles, with no retained pond overlap',()=>{
 const f=fixture(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()}),plan=shinikeLayoutR97(features),input=terrain(),out=r.clipTerrain(input);let original=0,remaining=0;
 for(let i=0;i<input.length;i+=9)original+=Math.abs(polygonArea([0,1,2].map(k=>[input[i+k*3],input[i+k*3+2]])));
 for(let i=0;i<out.length;i+=9){const tri=[0,1,2].map(k=>[out[i+k*3],out[i+k*3+2]]);remaining+=Math.abs(polygonArea(tri));for(const cut of plan.triangles)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-6);for(let k=0;k<3;k++)assert.ok(Math.abs(out[i+k*3+1]-h(...tri[k]))<1e-8);}
 assert.ok(Math.abs(original-remaining-plan.area)<1e-5);assert.deepEqual(out.slice(0,9),input.slice(0,9));assert.deepEqual(r.clipTerrain(input),out);assert.throws(()=>r.clipTerrain([NaN,0,0]),/finite triangle/);
});
test('inward natural bank stays inside mapped pond with disjoint projected triangles and bounded inset',()=>{
 const f=fixture(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()}),plan=shinikeLayoutR97(features),mesh=f.root.getObjectByName('Shin-ike bounded inward natural bank collar R97'),p=mesh.geometry.attributes.position,triangles=[];
 for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k)]),area=Math.abs(polygonArea(tri));if(area<1e-7)continue;let inside=0;for(const cut of plan.triangles)inside+=Math.abs(polygonArea(clipConvex(tri,cut)));assert.ok(Math.abs(area-inside)<.003);for(const old of triangles)assert.ok(Math.abs(polygonArea(clipConvex(tri,old)))<.003);triangles.push(tri);for(let k=0;k<3;k++){assert.ok(Number.isFinite(p.getY(i+k)));assert.ok(p.getY(i+k)>=level-.041);}}
 assert.ok(triangles.length>20);assert.equal(r.maximumBankInset,4);assert.equal(mesh.geometry.attributes.uv.count,p.count);
});
test('downward ray sees exposed flat water below shrine court rather than coarse terrain in pond center',()=>{
 const f=fixture(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()});f.root.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(550,90,-110),new THREE.Vector3(0,-1,0)),hits=ray.intersectObject(f.root.getObjectByName('Shin-ike single horizontal water owner R97'),true);assert.ok(hits.length);assert.equal(hits[0].object.name,'Shin-ike flat olive-gray water R97');assert.ok(Math.abs(hits[0].point.y-level)<.00001);assert.ok(hits[0].point.y<66.312874-.59);
});
test('missing source/legacy, changed datum or incomplete support leave legacy plane attached',()=>{
 for(const kind of ['missing','changed','coverage']){const f=fixture();if(kind==='changed')f.owner.position.y+=1;const before=f.root.children.length;const r=buildShinikeWaterR97(f.root,kind==='missing'?{water:[]}:features,{}, {terrainPositions:kind==='coverage'?terrain().slice(0,18):terrain()});assert.equal(r.built,false);assert.equal(f.root.children.length,before);assert.equal(f.plane.parent,f.owner);}
});

test('low actual shoreline deterministically lowers water once without a berm or later descending levels',()=>{const f=fixture(),input=terrain().map((n,i)=>i%3===1?65.4:n),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:input});assert.equal(r.built,true,JSON.stringify(r));assert.equal(r.legacyWaterLevel,level);assert.ok(Math.abs(r.waterLevel-65.36)<1e-9);assert.ok(Math.abs(r.minRetainedShore-65.4)<1e-9);assert.ok(r.minShoreWitness.every(Number.isFinite));const fixed=r.waterLevel;r.clipTerrain(input);r.clipTerrain(input);assert.equal(r.waterLevel,fixed);assert.equal(buildShinikeWaterR97(f.root,features),r);});

test('exact wet cut and inner bank preserve the actual arrival/onward walking corridor including player margin',()=>{const plan=shinikeLayoutR97(features);for(const id of ['way/626313754','way/301527750','way/439990443']){const path=features.paths.find(p=>p.id===id);assert.ok(path);for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),nx=-dz/len*1.26,nz=dx/len*1.26,cut=[[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]];for(const tri of plan.triangles)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-6,id);}}});

test('successful water rebuild removes only the uniquely registered temporary legacy fallen log',()=>{
 const f=fixture();f.owner.position.set(545.254396455114,level+.18,-129.16842947649747);f.owner.rotation.y=-1.162212928391673;
 const log=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,6.8,8),new THREE.MeshStandardMaterial());log.position.set(8.2,-.08,-2.5);log.rotation.set(0,.42,Math.PI*.47);f.owner.add(log);
 const unrelated=log.clone();unrelated.geometry=new THREE.CylinderGeometry(.18,.26,5.8,8);f.owner.add(unrelated);const unowned=log.clone();f.root.add(unowned);
 const r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()});assert.equal(r.built,true);assert.equal(r.removedLegacyLogs,1);assert.equal(log.parent,null);assert.equal(unrelated.parent,f.owner);assert.equal(unowned.parent,f.root);assert.equal(buildShinikeWaterR97(f.root,features).removedLegacyLogs,1);
});
test('ambiguous or displaced log signatures and failed water builds preserve all original log objects',()=>{
 for(const kind of ['duplicate','displaced','failure']){
  const f=fixture();f.owner.position.set(545.254396455114,level+.18,-129.16842947649747);f.owner.rotation.y=-1.162212928391673;
  const log=new THREE.Mesh(new THREE.CylinderGeometry(.18,.26,6.8,8),new THREE.MeshStandardMaterial());log.position.set(8.2,-.08,-2.5);log.rotation.set(0,.42,Math.PI*.47);f.owner.add(log);let duplicate;
  if(kind==='duplicate'){duplicate=log.clone();f.owner.add(duplicate);}if(kind==='displaced')f.owner.position.x+=30;
  const r=buildShinikeWaterR97(f.root,kind==='failure'?{water:[]}:features,{}, {terrainPositions:terrain()});assert.equal(log.parent,f.owner);if(duplicate)assert.equal(duplicate.parent,f.owner);if(kind==='failure'){assert.equal(r.built,false);assert.equal(f.plane.parent,f.owner);}else{assert.equal(r.built,true);assert.equal(r.removedLegacyLogs,0);}
 }
});
