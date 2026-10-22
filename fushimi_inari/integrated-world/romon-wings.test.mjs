import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {refineRomonWings} from './romon-wings.mjs';
import {buildRomonCourtSideDetails} from './romon-court-side-details.mjs';
import {romonWingLayout,isInheritedRomonWingTriangle,isInheritedRomonBarrelTriangle} from './romon-wings-layout.mjs';

// Decode actual production GLB buffers without browser image/texture loading.
function sourceFixture(){
 const data=readFileSync(new URL('./romon.glb',import.meta.url)),jsonLength=data.readUInt32LE(12),json=JSON.parse(data.subarray(20,20+jsonLength).toString()),bin=data.subarray(28+jsonLength);
 const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4},types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array};
 const attr=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],Type=types[a.componentType],items=width[a.type];assert.ok(!v.byteStride,'fixture supports production packed buffers');return new THREE.BufferAttribute(new Type(bin.buffer,bin.byteOffset+(v.byteOffset??0)+(a.byteOffset??0),a.count*items).slice(),items,!!a.normalized);};
 const scene=new THREE.Group(),materials={},map={MAT_Vermilion_ShuIro:'vermilionMat',MAT_White_Shikku_Plaster:'plasterMat',MAT_Copper_Patina_Green:'copperRoofMat',MAT_Gold_Kanagu_Leaf:'goldMat',MAT_Straw_Shimenawa:'strawMat',MAT_Blue_Hengaku_Plaque:'blueMat'};
 const mats=json.materials.map(m=>{const mat=new THREE.MeshStandardMaterial();mat.name=m.name;if(map[m.name])materials[map[m.name]]=mat;return mat;});
 for(const node of json.nodes){if(node.mesh===undefined)continue;assert.ok(!node.matrix&&!node.translation&&!node.rotation&&!node.scale,'production vertices are baked in source scene coordinates');
  const primitive=json.meshes[node.mesh].primitives[0],geometry=new THREE.BufferGeometry(),names={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv'};
  for(const [key,index]of Object.entries(primitive.attributes))geometry.setAttribute(names[key]??key,attr(index));if(primitive.indices!==undefined)geometry.setIndex(attr(primitive.indices));
  const mesh=new THREE.Mesh(geometry,mats[primitive.material]);mesh.name=node.name;scene.add(mesh);
 }
 return {scene,materials};
}

test('actual GLB wing filter is bounded and preserves roof, base and central gate triangles',()=>{
 const {scene,materials}=sourceFixture(),unrelated=scene.children.filter(o=>![materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat].includes(o.material)),snapshots=unrelated.map(o=>[o,o.geometry,Array.from(o.geometry.attributes.position.array)]);
 const before=new Map(scene.children.filter(o=>[materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat].includes(o.material)).map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,keep=[];let removed=0;for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);if(!(o.material===materials.strawMat||o.material===materials.blueMat?isInheritedRomonBarrelTriangle(points,o.material===materials.blueMat):isInheritedRomonWingTriangle(points)))keep.push(...points.flat());else removed++;}return[o,keep];}));
 const result=refineRomonWings(scene,materials);assert.equal(result.reconstructed,true,JSON.stringify(result));assert.equal(result.removedTriangles,12144);assert.equal(result.removedUnsupportedBarrels,18);assert.equal(result.removedUnsupportedCrests,18);assert.equal(result.screenBays,9);assert.equal(result.northEndWindow,true);assert.ok(result.materialBatches<=5);assert.ok(result.triangles<8000);
 for(const [mesh,positions]of before){if(!positions.length)assert.equal(mesh.parent,null,'fully removed prop mesh is detached');else assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions,'all outside-region triangles preserved byte-for-byte');}
 for(const [mesh,geo,positions]of snapshots){assert.equal(mesh.geometry,geo);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),positions);}
 for(const mesh of scene.children.filter(o=>o.name!=='Romon Kairo facade refinement')){
  if(![materials.plasterMat,materials.vermilionMat,materials.copperRoofMat,materials.strawMat,materials.blueMat].includes(mesh.material))continue;
  const g=mesh.geometry,p=g.attributes.position;for(let i=0;i<(g.index?.count??p.count);i+=3){const vertices=[0,1,2].map(j=>{const k=g.index?g.index.getX(i+j):i+j;return[p.getX(k),p.getY(k),p.getZ(k)];});assert.equal(mesh.material===materials.strawMat||mesh.material===materials.blueMat?isInheritedRomonBarrelTriangle(vertices,mesh.material===materials.blueMat):isInheritedRomonWingTriangle(vertices),false);}
 }
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
