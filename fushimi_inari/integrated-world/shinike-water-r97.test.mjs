import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {buildShinikeWaterR97,buildShinikeWaterR97Async,shinikeLayoutR97,SHINIKE_ID} from './shinike-water-r97.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url))),level=65.71652051629592;
const h=(x,z)=>66.20+.03*(x-530)+.015*(z+150);
test('natural bank lighting shares normals across clipped triangle seams without changing its positions',()=>{
 const f=fixture();buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()});
 const bank=f.root.getObjectByName('Shin-ike bounded inward natural bank collar R97'),p=bank.geometry.attributes.position,n=bank.geometry.attributes.normal,seen=new Map();let shared=0;
 for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e4)).join(','),normal=new THREE.Vector3().fromBufferAttribute(n,i);assert.ok(Math.abs(normal.length()-1)<1e-5);if(seen.has(key)){assert.ok(normal.distanceTo(seen.get(key))<1e-6);shared++;}else seen.set(key,normal);}
 assert.ok(shared>20);
});
test('bank toe meets existing submerged backing and leaves a measurable wet margin beneath the waterline',()=>{
 const f=fixture(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()}),bank=f.root.getObjectByName('Shin-ike bounded inward natural bank collar R97'),p=bank.geometry.attributes.position;let submerged=0,projected=0;
 for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i)-r.bedLevel)<1e-5)submerged++;if(i%3===0)projected+=Math.abs(polygonArea([0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k)])));}
 assert.ok(submerged>20);assert.equal(r.bankToeLevel,r.bedLevel);assert.equal(r.waterLevel,level);assert.ok(r.dryBankArea>0);assert.ok(r.dryBankArea<projected*.9,'part of the collar is submerged rather than consuming the open water');assert.equal(r.visibleWaterArea,r.pondArea-r.dryBankArea);assert.equal(r.collidersAdded,0);assert.equal(r.walkingChanged,false);
});
test('bank preserves forest material maps with nondegenerate texture density on steep and shallow faces',()=>{
 const f=fixture(),map=new THREE.Texture(),normalMap=new THREE.Texture(),source=new THREE.MeshStandardMaterial({map,normalMap,roughness:1,normalScale:new THREE.Vector2(.35,.35)});
 buildShinikeWaterR97(f.root,features,{shinikeBankMat:source}, {terrainPositions:terrain()});const bank=f.root.getObjectByName('Shin-ike bounded inward natural bank collar R97'),p=bank.geometry.attributes.position,uv=bank.geometry.attributes.uv;
 assert.notEqual(bank.material,source);assert.equal(bank.material.map,map);assert.equal(bank.material.normalMap,normalMap);assert.deepEqual(bank.material.normalScale.toArray(),[.35,.35]);assert.equal(source.side,THREE.FrontSide);
 let steep=0;for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,i+k)),normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])),area=normal.length()/2,uvArea=Math.abs(polygonArea([0,1,2].map(k=>[uv.getX(i+k),uv.getY(i+k)])));if(area<1e-4)continue;
  assert.ok(uvArea>0);assert.ok(uvArea*2.25>area*.57-.001,'dominant projection retains at least1/sqrt(3) of surface area at1.5m density');assert.ok(uvArea*2.25<area+.001);if(Math.abs(normal.y)<Math.max(Math.abs(normal.x),Math.abs(normal.z)))steep++;
 }assert.ok(steep>20,'fixture exercises steep bank faces');
});
function terrain(){const p=[];for(let x=520;x<590;x+=5)for(let z=-160;z< -60;z+=5)for(const [dx,dz]of [[0,0],[5,0],[0,5],[0,5],[5,0],[5,5]])p.push(x+dx,h(x+dx,z+dz),z+dz);return p;}
test('bank grades a rounded shoulder and toe through narrow contour bands while retaining its exact crest',()=>{
 const f=fixture(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()}),plan=shinikeLayoutR97(features),p=f.root.getObjectByName('Shin-ike bounded inward natural bank collar R97').geometry.attributes.position;
 const center=[0,0],area=polygonArea(plan.ring);
 for(let i=0;i<plan.ring.length;i++){const a=plan.ring[i],b=plan.ring[(i+1)%plan.ring.length],cross=a[0]*b[1]-b[0]*a[1];center[0]+=(a[0]+b[0])*cross/(6*area);center[1]+=(a[1]+b[1])*cross/(6*area);}
 const [x,z]=plan.ring[0],crest=h(x,z),dx=center[0]-x,dz=center[1]-z,distance=Math.hypot(dx,dz),inset=Math.min(4,Math.max(.35,(crest-r.waterLevel)*1.25),distance*.3),drop=crest-r.bedLevel;
 const at=t=>{const tx=x+dx/distance*inset*t,tz=z+dz/distance*inset*t;let best=Infinity,height;for(let i=0;i<p.count;i++){const distance=Math.hypot(p.getX(i)-tx,p.getZ(i)-tz);if(distance<best){best=distance;height=p.getY(i);}}assert.ok(best<.0001,`contour station ${t} exists`);return height;};
 assert.equal(r.bankBands,8);assert.ok(Math.abs(at(0)-crest)<.00001);assert.ok(Math.abs(at(1)-r.bedLevel)<.00001);
 assert.ok(crest-at(1/8)<drop*.05,'rounded crest has a shallow shoulder');assert.ok(at(7/8)-r.bedLevel<drop*.05,'submerged toe eases into backing');assert.ok(Math.abs(at(.5)-(crest+r.bedLevel)/2)<.00001);
});
function fixture(){const root=new THREE.Group(),owner=new THREE.Group();owner.userData.zone='kumataka';owner.position.y=level+.18;root.add(owner);const plane=new THREE.Mesh(new THREE.PlaneGeometry(18,22),new THREE.MeshPhysicalMaterial({roughness:.07}));plane.position.set(10.5,-.18,0);plane.rotation.x=-Math.PI/2;owner.add(plane);return {root,plane,owner};}
test('actual Shin-ike ring yields one lower horizontal olive water and only removes exact legacy signature',()=>{
 const f=fixture(),plan=shinikeLayoutR97(features);assert.ok(plan);const other=new THREE.Mesh(new THREE.PlaneGeometry(18,22),new THREE.MeshPhysicalMaterial({roughness:.07}));f.root.add(other);
 const r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:terrain()});assert.equal(r.built,true,JSON.stringify(r));assert.deepEqual(r.builtIds,[SHINIKE_ID]);assert.equal(r.waterLevel,level);assert.equal(f.plane.parent,null);assert.equal(other.parent,f.root);assert.equal(buildShinikeWaterR97(f.root,features),r);assert.equal(r.materialBatches,3);assert.equal(r.walkingChanged,false);assert.equal(r.collidersAdded,0);
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
 for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k)]),area=Math.abs(polygonArea(tri));if(area<1e-4)continue;let inside=0;for(const cut of plan.triangles)inside+=Math.abs(polygonArea(clipConvex(tri,cut)));assert.ok(Math.abs(area-inside)<.003);for(const old of triangles)assert.ok(Math.abs(polygonArea(clipConvex(tri,old)))<.003);triangles.push(tri);for(let k=0;k<3;k++){assert.ok(Number.isFinite(p.getY(i+k)));assert.ok(p.getY(i+k)>=level-.601);}}
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

test('opaque dark backing covers exactly the mapped pond 0.6m below unchanged water without new collision or grading',()=>{const f=fixture(),input=terrain(),r=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:input}),plan=shinikeLayoutR97(features),bed=f.root.getObjectByName('Shin-ike bounded dark silt visual backing R98'),p=bed.geometry.attributes.position;assert.equal(r.built,true);assert.equal(r.waterLevel,level);assert.equal(r.bedLevel,level-.6);assert.equal(r.backingDepth,.6);assert.equal(r.backingTriangles,18);assert.equal(r.materialBatches,3);assert.equal(r.collidersAdded,0);assert.equal(r.walkingChanged,false);assert.equal(p.count,54);assert.equal(bed.material.opacity,1);assert.equal(bed.material.transparent,false);assert.equal(bed.material.depthWrite,true);assert.equal(bed.material.metalness,0);assert.equal(bed.geometry.attributes.uv.count,p.count);let area=0;for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(k=>[p.getX(i+k),p.getZ(i+k)]),pieceArea=Math.abs(polygonArea(tri));let covered=0;for(const cut of plan.triangles)covered+=Math.abs(polygonArea(clipConvex(tri,cut)));assert.ok(Math.abs(covered-pieceArea)<.003);area+=pieceArea;for(let k=0;k<3;k++)assert.ok(Math.abs(p.getY(i+k)-(level-.6))<.00001);}assert.ok(Math.abs(area-plan.area)<.01);f.root.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(550,90,-110),new THREE.Vector3(0,-1,0)),hits=ray.intersectObject(f.root.getObjectByName('Shin-ike single horizontal water owner R97'),true);assert.equal(hits[0].object.name,'Shin-ike flat olive-gray water R97');assert.equal(hits[1].object,bed);assert.ok(Math.abs(hits[0].point.y-hits[1].point.y-.6)<.00001);});

function waterDigest(root,record,input){
 const hash=createHash('sha256');root.traverse(o=>{if(!o.isMesh)return;hash.update(o.name);for(const key of Object.keys(o.geometry.attributes).sort()){hash.update(key);hash.update(Buffer.from(o.geometry.attributes[key].array.buffer));}});
 hash.update(JSON.stringify(record));hash.update(Buffer.from(new Float64Array(record.clipTerrain(input)).buffer));return hash.digest('hex');
}
test('pond broad phase preserves all native geometry attributes, shore metadata and clipped terrain byte for byte',()=>{
 for(const typed of [false,true]){
  const f=fixture(),positions=terrain();positions.push(-900,20,900,-899,21,900,-900,20,901);const input=typed?new Float32Array(positions):positions;
  const record=buildShinikeWaterR97(f.root,features,{}, {terrainPositions:input});
  // Captured before adding the scalar broad phase and cooperative construction.
  assert.equal(waterDigest(f.root,record,input),typed?'ca15f3dc581bedb1fbc247c8ad151233e9d6c92512c5f04a99b6943325a0f0a2':'4815904a195f8501baf4ba934032f79b421eea6490da684345f2b06cfdaaf4f3');
 }
});
test('cooperative pond construction yields while preserving the previous water until its complete replacement is ready',async()=>{
 const sync=fixture(),paced=fixture(),input=terrain();let time=0,yields=0;
 const expected=buildShinikeWaterR97(sync.root,features,{}, {terrainPositions:input});
 const record=await buildShinikeWaterR97Async(paced.root,features,{}, {terrainPositions:input,clock:()=>time+=33,yieldWork:async()=>{
  yields++;assert.equal(paced.plane.parent,paced.owner);assert.equal(paced.root.getObjectByName('Shin-ike single horizontal water owner R97'),undefined);await new Promise(setImmediate);
 }});
 assert.ok(yields>2);assert.equal(paced.plane.parent,null);assert.equal(waterDigest(paced.root,record,input),waterDigest(sync.root,expected,input));
 assert.deepEqual(await record.clipTerrainAsync(input,{yieldWork:async()=>{await new Promise(setImmediate);}}),expected.clipTerrain(input));
});
test('cooperative pond construction propagates a scheduling failure without publishing a partial replacement',async()=>{
 const f=fixture(),failure=Error('cancelled preparation');let time=0;
 await assert.rejects(buildShinikeWaterR97Async(f.root,features,{}, {terrainPositions:terrain(),clock:()=>time+=33,yieldWork:()=>Promise.reject(failure)}),error=>error===failure);
 assert.equal(f.plane.parent,f.owner);assert.equal(f.root.getObjectByName('Shin-ike single horizontal water owner R97'),undefined);
});
