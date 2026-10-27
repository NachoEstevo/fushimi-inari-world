import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as architectureStages from './romon-gehaiden-r95.mjs';
import * as roofStages from './romon-gehaiden-roofs-r95.mjs';
import * as THREE from 'three';
import {refineRomonGehaidenR95 as refine} from './romon-gehaiden-r95.mjs';
import {refineGehaiden} from './gehaiden-refinements.mjs';
import {refineCentralIrimoyaR95,centralRoofR95,centralRoofProfileR95,originalCentralRoofHeight} from './romon-gehaiden-roofs-r95.mjs';
function fixture(zone){
 const data=readFileSync(new URL(`./${zone}.glb`,import.meta.url)),len=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+len)),bin=data.subarray(28+len);
 const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array};
 const attr=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],T=types[a.componentType];assert.ok(!v.byteStride);return new THREE.BufferAttribute(new T(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*widths[a.type]).slice(),widths[a.type]);};
 const scene=new THREE.Group(),mats=json.materials.map(m=>{
  const mat=new THREE.MeshStandardMaterial();mat.name=m.name;
  // Preserve actual production GLB texture-slot wiring without browser image
  // decoding. UV/material contract tests do not claim pixel appearance.
  if(m.pbrMetallicRoughness?.baseColorTexture)mat.map=new THREE.Texture();
  if(m.normalTexture)mat.normalMap=new THREE.Texture();
  if(m.pbrMetallicRoughness?.metallicRoughnessTexture)mat.roughnessMap=mat.metalnessMap=new THREE.Texture();
  return mat;
 });
 for(const node of json.nodes){if(node.mesh===undefined)continue;const p=json.meshes[node.mesh].primitives[0],g=new THREE.BufferGeometry();for(const [name,i]of Object.entries(p.attributes))g.setAttribute(({POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'})[name]??name,attr(i));if(p.indices!==undefined)g.setIndex(attr(p.indices));const mesh=new THREE.Mesh(g,mats[p.material]);mesh.name=node.name;scene.add(mesh);}
 return scene;
}
test('production Romon removes only four complete slabs, opens balcony and preserves roofs and deck',()=>{
 const scene=fixture('romon'),roof=scene.children.find(m=>m.material.name.includes('Hiwadabuki')),snapshot=roof.geometry;
 const sourceMaterials=scene.children.filter(m=>/Vermilion|Gold_Kanagu/.test(m.material.name)).map(m=>[m,Array.from(m.geometry.attributes.position.array)]);
 const report=refine(scene,'romon');assert.equal(report.built,true,JSON.stringify(report));assert.equal(report.removedSlabs,4);assert.equal(report.materialBatches,2);assert.equal(report.roofRepair.built,true,JSON.stringify(report.roofRepair));assert.equal(report.roofRepair.removedRoofTriangles,4028);assert.deepEqual(roof.geometry.attributes.position.array,snapshot.attributes.position.array);assert.equal(report.collidersAdded,0);
 for(const [mesh,positions]of sourceMaterials)assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions,'original vertex buffers including balcony deck and balusters remain unchanged');
 const group=scene.children.at(-1);assert.equal(refine(scene,'romon'),report);assert.equal(scene.children.at(-1),group);
 const p=group.children[0].geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(p.getY(i)>=6.6,'all new work above public passage');
});
test('production Gehaiden replaces blinds and lanterns after prior balustrade repair, retaining roof/fence/plinth',()=>{
 const scene=fixture('gehaiden');refineGehaiden(scene);const preserved=scene.children.filter(m=>m.isMesh&&/Granite/.test(m.material.name)).map(m=>[m,m.geometry]);
 const report=refine(scene,'gehaiden');assert.equal(report.built,true,JSON.stringify(report));assert.equal(report.lanterns,12);assert.equal(report.blindPanels,16);assert.ok(report.triangles<30000);assert.ok(report.materialBatches<=6);
 for(const [mesh,geo]of preserved){assert.equal(mesh.parent,scene);assert.equal(mesh.geometry,geo);}
 assert.equal(scene.children.some(m=>m.isMesh&&/Sudare_Bamboo|Dark_Bronze|Lantern_Warm/.test(m.material.name)),false);
 assert.ok(scene.getObjectByName('Gehaiden open verandah balustrade'));
 assert.equal(report.roofRepair.built,true,JSON.stringify(report.roofRepair));assert.equal(report.roofRepair.pediments,2);assert.ok(report.roofRepair.apex>=report.roofRepair.ridgeUnderside);
 const group=scene.children.at(-1);group.traverse(m=>{if(m.isMesh)for(const x of m.geometry.attributes.position.array)assert.ok(Number.isFinite(x));});
 assert.equal(refine(scene,'gehaiden'),report);
});
test('unknown source refuses destructive partial refinement',()=>{
 for(const zone of ['romon','gehaiden']){const scene=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());scene.add(mesh);assert.equal(refine(scene,zone).built,false);assert.equal(scene.children.length,1);}
 const scene=fixture('gehaiden'),blind=scene.children.find(m=>m.material.name.includes('Sudare')),white=scene.children.find(m=>m.material.name.includes('White_Shikku')),whiteBefore=white.geometry;
 blind.geometry=new THREE.BoxGeometry();const children=[...scene.children];assert.equal(refine(scene,'gehaiden').built,false);assert.equal(white.geometry,whiteBefore);assert.deepEqual(scene.children,children);
});

test('both repaired roof shells keep exact plan/apex, join the ridge and reseat all source rafters',()=>{
 for(const zone of ['romon','gehaiden']){
  const scene=fixture(zone),s=centralRoofR95[zone],report=refineCentralIrimoyaR95(scene,zone);assert.equal(report.built,true,JSON.stringify(report));assert.equal(report.reseatedRafters,zone==='romon'?74:68);
  assert.equal(report.removedRoofTriangles,4028);assert.ok(report.apex-report.ridgeUnderside>.06);
  const mesh=scene.children.at(-1).children[0];mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox;
  assert.ok(Math.abs(bounds.min.x+s.halfLength)<1e-5&&Math.abs(bounds.max.x-s.halfLength)<1e-5);
  assert.ok(Math.abs(bounds.min.z-s.centerZ+s.halfWidth)<1e-5&&Math.abs(bounds.max.z-s.centerZ-s.halfWidth)<1e-5);
  assert.ok(Math.abs(bounds.max.y-report.apex)<1e-5);
  for(const x of [-s.halfLength,-s.halfLength*.52,0,s.halfLength*.52,s.halfLength])for(const z of [-s.halfWidth,s.halfWidth])assert.ok(Math.abs(centralRoofProfileR95(s,x,z,Math.abs(x)>s.halfLength*.52)-originalCentralRoofHeight(s,x,z))<1e-8,'existing eave elevations retained');
  assert.equal(refineCentralIrimoyaR95(scene,zone),report);
 }
});

test('changed roof source declines before mutating any existing mesh',()=>{
 const scene=fixture('gehaiden'),roof=scene.children.find(m=>m.material.name.includes('Hiwadabuki')),p=roof.geometry.attributes.position;p.setY(0,p.getY(0)+.02);
 const snapshots=scene.children.map(m=>[m,m.geometry]);assert.equal(refineCentralIrimoyaR95(scene,'gehaiden').built,false);
 for(const [m,g]of snapshots)assert.equal(m.geometry===g,true);
});

test('production bark texture slots retain finite metric UVs across every replacement shell patch',()=>{
 for(const zone of ['romon','gehaiden']){
  const scene=fixture(zone),s=centralRoofR95[zone],source=scene.children.find(m=>m.material.name.includes('Hiwadabuki')),material=source.material;
  assert.ok(material.map&&material.normalMap&&material.roughnessMap,'actual GLB contains all bark texture slots');
  const result=refineCentralIrimoyaR95(scene,zone);assert.equal(result.built,true);
  const mesh=scene.children.at(-1).children[0],p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv;
  assert.equal(mesh.material,material);assert.equal(mesh.material.map,material.map);assert.equal(uv.count,p.count);
  let plans=0,fascias=0;
  for(let i=0;i<p.count;i+=3){
   const dx=p.getX(i+1)-p.getX(i),dz=p.getZ(i+1)-p.getZ(i),ex=p.getX(i+2)-p.getX(i),ez=p.getZ(i+2)-p.getZ(i);
   for(let j=0;j<3;j++)assert.ok(Number.isFinite(uv.getX(i+j))&&Number.isFinite(uv.getY(i+j)));
   const area=Math.abs((uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getY(i+1)-uv.getY(i))*(uv.getX(i+2)-uv.getX(i)));
   assert.ok(area>1e-9,'no collapsed texture triangles on roof or fascia');
   if(Math.abs(dx*ez-ex*dz)>1e-8){plans++;for(let j=0;j<3;j++){assert.ok(Math.abs(uv.getX(i+j)+(p.getZ(i+j)-s.centerZ)/2)<1e-5);assert.ok(Math.abs(uv.getY(i+j)-p.getX(i+j)/2)<1e-5);}}else fascias++;
  }
  assert.ok(plans>2000&&fascias>100);
 }
});

// Pinned before staging: cover every attribute/index byte, material binding order,
// hierarchy and report, not merely triangle counts.
function completionDigest(scene,report){
 const materials=new Map(),objects=[];
 scene.traverse(object=>{
  const material=object.material;
  if(material&&!materials.has(material))materials.set(material,materials.size);
  const attribute=a=>({itemSize:a.itemSize,normalized:a.normalized,array:createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex')});
  objects.push({name:object.name,children:object.children.length,castShadow:object.castShadow,receiveShadow:object.receiveShadow,
   material:material?{binding:materials.get(material),name:material.name,color:material.color?.getHex(),roughness:material.roughness,metalness:material.metalness,side:material.side,map:!!material.map,normalMap:!!material.normalMap,roughnessMap:!!material.roughnessMap}:null,
   geometry:object.geometry?{attributes:Object.fromEntries(Object.entries(object.geometry.attributes).map(([key,value])=>[key,attribute(value)])),index:object.geometry.index?attribute(object.geometry.index):null}:null});
 });
 return createHash('sha256').update(JSON.stringify({objects,report})).digest('hex');
}
// Independently reproduced from the four original HEAD 7c18302 modules under
// each runtime. ConeGeometry emits 12 triangles in r164 and 8 in r180;
// twelve lantern roofs account for the 48-triangle Gehaiden difference.
const originalCompletionDigests={
 '164':{romon:'87a161c95f74a0d14425ca493166b79a3fe9e912e486bb1fe8e34ee9c690be39',gehaiden:'6d83b1e644c1531a23bbc2d4e8dfc5034e767c9b5fda15f2ca7dff06caf2fc77'},
 '180':{romon:'87a161c95f74a0d14425ca493166b79a3fe9e912e486bb1fe8e34ee9c690be39',gehaiden:'d0244071c0650d5b627a13d9a9846e9e6f0e66b4c1dd7f9d3d2497e69cd73a00'}
};
for(const zone of ['romon','gehaiden'])test(`${zone}: staged architecture preserves original production buffers and yields bounded work`,()=>{
 assert.equal(typeof architectureStages.refineRomonGehaidenR95Stages,'function');
 const expectedDigest=originalCompletionDigests[THREE.REVISION]?.[zone];assert.ok(expectedDigest,`Original production digest required for Three r${THREE.REVISION}`);
 const scene=fixture(zone);if(zone==='gehaiden')refineGehaiden(scene);
 const work=architectureStages.refineRomonGehaidenR95Stages(scene,zone),stages=[];let step;
 do{step=work.next();if(!step.done)stages.push(step.value);}while(!step.done);
 assert.equal(step.value.built,true);assert.ok(stages.length>20,'production geometry must yield repeatedly');
 assert.equal(completionDigest(scene,step.value),expectedDigest);
 const synchronous=fixture(zone);if(zone==='gehaiden')refineGehaiden(synchronous);
 assert.equal(completionDigest(synchronous,refine(synchronous,zone)),expectedDigest);
 assert.equal(architectureStages.refineRomonGehaidenR95Stages(scene,zone).next().value,step.value,'idempotent completion returns existing report');
});

test('staged central roof refuses changed signatures before mutating source geometries',()=>{
 assert.equal(typeof roofStages.refineCentralIrimoyaR95Stages,'function');
 const scene=fixture('gehaiden'),roof=scene.children.find(m=>m.material.name.includes('Hiwadabuki')),p=roof.geometry.attributes.position;p.setY(0,p.getY(0)+.02);
 const snapshots=scene.children.map(mesh=>[mesh,mesh.geometry]),stages=roofStages.refineCentralIrimoyaR95Stages(scene,'gehaiden');let step;
 do{step=stages.next();}while(!step.done);
 assert.equal(step.value.built,false);for(const [mesh,geometry]of snapshots)assert.equal(mesh.geometry,geometry);
});
