import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import * as wings from './romon-wings.mjs';
const {refineRomonWings}=wings;
import {buildRomonCourtSideDetails} from './romon-court-side-details.mjs';
import {romonWingLayout,isInheritedRomonWingTriangle,isInheritedRomonBarrelTriangle,isInheritedRomonWingRoofFitting,isInheritedRomonWingRoofPoint,romonWingRoofTop} from './romon-wings-layout.mjs';

// Decode actual production GLB buffers without browser image/texture loading.
function sourceFixture(){
 const data=readFileSync(new URL('./romon.glb',import.meta.url)),jsonLength=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+jsonLength).toString()),bin=data.subarray(28+jsonLength);
 const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array};
 const attr=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],Type=types[a.componentType],items=width[a.type];assert.ok(!v.byteStride,'fixture supports production packed buffers');return new THREE.BufferAttribute(new Type(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*items).slice(),items,!!a.normalized);};
 const scene=new THREE.Group(),materials={},map={MAT_Vermilion_ShuIro:'vermilionMat',MAT_White_Shikku_Plaster:'plasterMat',MAT_Copper_Patina_Green:'copperRoofMat',MAT_Gold_Kanagu_Leaf:'goldMat',MAT_Straw_Shimenawa:'strawMat',MAT_Blue_Hengaku_Plaque:'blueMat',MAT_Black_Lacquer_Nemaki:'blackNemakiMat',MAT_Hiwadabuki_Bark_Roof:'roofMat'};
 const mats=json.materials.map(m=>{const mat=new THREE.MeshStandardMaterial();mat.name=m.name;if(map[m.name])materials[map[m.name]]=mat;return mat;});
 for(const node of json.nodes){if(node.mesh===undefined)continue;assert.ok(!node.matrix&&!node.translation&&!node.rotation&&!node.scale,'production vertices are baked in source scene coordinates');
  const primitive=json.meshes[node.mesh].primitives[0],geometry=new THREE.BufferGeometry(),names={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'};
  for(const [key,index]of Object.entries(primitive.attributes))geometry.setAttribute(names[key]??key,attr(index));if(primitive.indices!==undefined)geometry.setIndex(attr(primitive.indices));
  const mesh=new THREE.Mesh(geometry,mats[primitive.material]);mesh.name=node.name;scene.add(mesh);
 }
 return {scene,materials};
}

test('cooperative wing stages reproduce all production geometry and statistics exactly',()=>{
 const sync=sourceFixture(),staged=sourceFixture(),expected=refineRomonWings(sync.scene,sync.materials);
 assert.equal(typeof wings.refineRomonWingStages,'function');
 const work=wings.refineRomonWingStages(staged.scene,staged.materials),labels=[];let step;
 do{step=work.next();if(!step.done)labels.push(step.value);}while(!step.done);
 assert.deepEqual(step.value,expected);assert.ok(labels.length>10);assert.ok(labels.every(label=>label.startsWith('romon-wings:')));
 const snapshot=scene=>{const result=[];scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry;result.push({name:o.name,material:o.material.name,castShadow:o.castShadow,receiveShadow:o.receiveShadow,matrix:o.matrix.elements,attributes:Object.fromEntries(Object.entries(g.attributes).map(([name,a])=>[name,{itemSize:a.itemSize,normalized:a.normalized,array:Array.from(a.array)}])),index:g.index?Array.from(g.index.array):null});});return result;};
 assert.deepEqual(snapshot(staged.scene),snapshot(sync.scene));
});

test('cooperative wing stages preserve failure signatures and leave invalid geometry untouched',()=>{
 const make=()=>{const scene=new THREE.Group(),materials={plasterMat:new THREE.MeshStandardMaterial(),vermilionMat:new THREE.MeshStandardMaterial(),copperRoofMat:new THREE.MeshStandardMaterial()};scene.add(new THREE.Mesh(new THREE.BoxGeometry(),materials.plasterMat));return {scene,materials};};
 const sync=make(),staged=make(),geometry=staged.scene.children[0].geometry,expected=refineRomonWings(sync.scene,sync.materials);
 assert.equal(typeof wings.refineRomonWingStages,'function');const work=wings.refineRomonWingStages(staged.scene,staged.materials);let step;do{step=work.next();}while(!step.done);
 assert.deepEqual(step.value,expected);assert.equal(staged.scene.children.length,1);assert.equal(staged.scene.children[0].geometry,geometry);
});

test('actual GLB wing filter is bounded and preserves roof, base and central gate triangles',()=>{
 const {scene,materials}=sourceFixture(),roof=scene.children.find(o=>o.material===materials.roofMat),roofBefore=Array.from(roof.geometry.attributes.position.array),normalBefore=Array.from(roof.geometry.attributes.normal.array),unrelated=scene.children.filter(o=>![materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat,materials.goldMat,materials.blackNemakiMat].includes(o.material)&&o.material!==materials.roofMat),snapshots=unrelated.map(o=>[o,o.geometry,Array.from(o.geometry.attributes.position.array)]);
 const before=new Map(scene.children.filter(o=>[materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat,materials.goldMat,materials.blackNemakiMat].includes(o.material)).map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,keep=[];let removed=0;for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);if(!(o.material===materials.goldMat||o.material===materials.blackNemakiMat?isInheritedRomonWingRoofFitting(points,o.material===materials.goldMat?'goldRoof':'blackRoof'):o.material===materials.strawMat||o.material===materials.blueMat?isInheritedRomonBarrelTriangle(points,o.material===materials.blueMat):isInheritedRomonWingTriangle(points)))keep.push(...points.flat());else removed++;}return[o,keep];}));
 const result=refineRomonWings(scene,materials);assert.equal(result.reconstructed,true,JSON.stringify(result));assert.equal(result.removedTriangles,14832);assert.equal(result.removedUnsupportedBarrels,18);assert.equal(result.removedUnsupportedCrests,18);assert.equal(result.screenBays,9);assert.equal(result.northEndWindow,true);assert.equal(result.materialBatches,6);assert.equal(result.triangles,7910);
 for(const [mesh,positions]of before){if(!positions.length)assert.equal(mesh.parent,null,'fully removed prop mesh is detached');else assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions,'all outside-region triangles preserved byte-for-byte');}
 for(const [mesh,geo,positions]of snapshots){assert.equal(mesh.geometry,geo);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions);}
 for(const mesh of scene.children.filter(o=>o.name!=='Romon Kairo facade refinement')){
  if(![materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat,materials.goldMat,materials.blackNemakiMat].includes(mesh.material))continue;
  const g=mesh.geometry,p=g.attributes.position;for(let i=0;i<(g.index?.count??p.count);i+=3){const vertices=[0,1,2].map(j=>{const k=g.index?g.index.getX(i+j):i+j;return[p.getX(k),p.getY(k),p.getZ(k)];});assert.equal(mesh.material===materials.goldMat||mesh.material===materials.blackNemakiMat?isInheritedRomonWingRoofFitting(vertices,mesh.material===materials.goldMat?'goldRoof':'blackRoof'):mesh.material===materials.strawMat||mesh.material===materials.blueMat?isInheritedRomonBarrelTriangle(vertices,mesh.material===materials.blueMat):isInheritedRomonWingTriangle(vertices),false);}
 }
 const positions=roof.geometry.attributes.position,normals=roof.geometry.attributes.normal;let changed=0;
 for(let i=0;i<positions.count;i++){
  const before=roofBefore.slice(i*3,i*3+3);
  if(isInheritedRomonWingRoofPoint(before)){assert.equal(positions.getX(i),before[0]);assert.equal(positions.getZ(i),before[2]);const expected=before[1]+romonWingRoofTop(before[0],before[2],true)-romonWingRoofTop(before[0],before[2]);assert.ok(Math.abs(positions.getY(i)-expected)<.00001);if(Math.abs(positions.getY(i)-before[1])>.001)changed++;}
  else{assert.deepEqual([positions.getX(i),positions.getY(i),positions.getZ(i)],before);assert.deepEqual([normals.getX(i),normals.getY(i),normals.getZ(i)],normalBefore.slice(i*3,i*3+3));}
 }
 assert.ok(changed>1000);assert.equal(result.wingRoofTriangles,8056);assert.equal(result.outerGables,2);
 assert.equal(refineRomonWings(scene,materials),result);
});

test('rebuilt walls contain real apertures and preserve the central public passage',()=>{
 const {scene,materials}=sourceFixture();refineRomonWings(scene,materials);const group=scene.getObjectByName('Romon Kairo facade refinement');group.updateMatrixWorld(true);
 const wall=group.children.find(m=>m.material===materials.plasterMat),ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,-3),new THREE.Vector3(0,0,1)).intersectObject(wall,false);
 for(const wing of romonWingLayout())for(const bay of wing.bays){assert.equal(ray(bay.x,3.75).length>0,!bay.screen);assert.ok(ray(bay.x,2.45).length>0);}
 for(const mesh of group.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getX(i))>=5.9,'new geometry must not cross the central gate passage');}
 const root=new THREE.Group(),court=buildRomonCourtSideDetails(root,{source:[0,0,0],target:[0,0,0],yaw:0},materials);assert.equal(court.children.length,4);assert.match(court.userData.barrier,/single pale rail on red posts/);
});

test('unexpected source mesh declines reconstruction without adding or mutating geometry',()=>{
 const scene=new THREE.Group(),materials={plasterMat:new THREE.MeshStandardMaterial(),vermilionMat:new THREE.MeshStandardMaterial(),copperRoofMat:new THREE.MeshStandardMaterial()};
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(12.8,3.3,3.8).translate(12.5,3.7,0),materials.plasterMat);scene.add(mesh);const original=mesh.geometry,children=[...scene.children];
 const result=refineRomonWings(scene,materials);assert.equal(result.reconstructed,false);assert.equal(mesh.geometry,original);assert.deepEqual(scene.children,children);
});

test('end gable reaches the original end wall without enlarging roof plan or ridge height',()=>{
 for(const side of [-1,1]){assert.ok(Math.abs(romonWingRoofTop(side*18.9,0,true)-7.5)<1e-8);assert.ok(romonWingRoofTop(side*18.9,0)<6);for(const z of [-2.9,2.9])assert.ok(Math.abs(romonWingRoofTop(side*18.9,z,true)-romonWingRoofTop(side*18.9,z))<1e-8);}
});

test('runtime material substitution with cleared names retains exact production preflight',()=>{
 const {scene,materials}=sourceFixture();
 for(const key of ['plasterMat','vermilionMat','copperRoofMat','blackNemakiMat','goldMat']){const old=materials[key],replacement=old.clone();replacement.name='';materials[key]=replacement;for(const mesh of scene.children)if(mesh.material===old)mesh.material=replacement;}
 const result=refineRomonWings(scene,materials);assert.equal(result.reconstructed,true,JSON.stringify(result));assert.equal(result.removedTriangles,14832);assert.equal(result.outerGables,2);
});

test('outer hip bark cannot hide the north or south white gable from an end view',()=>{
 const {scene,materials}=sourceFixture();refineRomonWings(scene,materials);scene.updateMatrixWorld(true);
 const roof=scene.children.find(o=>o.material===materials.roofMat),detail=scene.getObjectByName('Romon Kairo facade refinement'),white=detail.children.find(o=>o.material===materials.plasterMat);
 for(const side of [-1,1]){const ray=new THREE.Raycaster(new THREE.Vector3(side*22,6.0,.4),new THREE.Vector3(-side,0,0)),hits=ray.intersectObjects([roof,white],false);assert.ok(hits.length);assert.equal(hits[0].object,white,'white gable must appear before any retained bark end surface');assert.ok(Math.abs(Math.abs(hits[0].point.x)-18.93)<.001);}
});
