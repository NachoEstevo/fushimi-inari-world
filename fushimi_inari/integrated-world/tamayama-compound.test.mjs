import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineTamayama,buildTamayamaCompound} from './tamayama-compound.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {TAMAYAMA_LAYOUT} from './tamayama-compound-layout.mjs';

const target=[103.331,50.083474,-33.979],source=[-11.8,3.2,-39.8],anchorYaw=-Math.PI/2+.06;

function fixture(){
  const materials=Object.fromEntries(['vermilionMat','blackNemakiMat','stoneMat','flagstoneMat','gravelMat','plasterMat','copperRoofMat','goldMat','roofMat'].map(key=>[key,new THREE.MeshStandardMaterial()]));
  const group=new THREE.Group();group.userData.zone='tamayama';group.position.set(...source);group.rotation.y=Math.PI*.38;
  const box=(w,h,d,mat,x,y,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const apron=box(5.6,.22,4.8,materials.flagstoneMat,0,.11,0);
  const body=box(3.4,2.6,2.8,materials.plasterMat,0,1.5,-.4);
  body.userData.onInteract=()=> 'existing bell callback';
  box(3.46,1.15,2.86,new THREE.MeshStandardMaterial(),0,.95,-.4);
  box(4.8,.58,4.4,materials.roofMat,0,3.05,.1);
  box(2.4,.45,1.2,materials.roofMat,0,3.12,1.85);
  const plaqueMaterial=new THREE.MeshStandardMaterial({map:new THREE.Texture()});
  const plaque=box(.52,.92,.1,plaqueMaterial,0,2.62,1.92);
  for(const side of [-1,1]){
    box(2.4,1.35,.18,materials.vermilionMat,side*2.85,.85,.2);
    box(2.55,.18,.42,materials.copperRoofMat,side*2.85,1.58,.2);
  }
  return {group,body,apron,plaque,materials};
}

function relocated(){
  const f=fixture(),detail=refineTamayama(f.group,f.materials),root=new THREE.Group();
  const transform=new THREE.Matrix4().makeTranslation(...target)
    .multiply(new THREE.Matrix4().makeRotationY(anchorYaw))
    .multiply(new THREE.Matrix4().makeTranslation(...source.map(v=>-v)));
  f.group.applyMatrix4(transform);root.add(f.group);
  const unrelated={type:'box',args:[10,20,2,3,0,0,3,'other_shrine']};
  const colliders=[unrelated,{type:'box',args:[target[0],target[2],2.4,2.2,anchorYaw,target[1],target[1]+3.8,'tamayama_inari']}];
  const registration=buildTamayamaCompound(root,{},null,f.materials,colliders);
  const collision=new SpatialCollisionWorld();
  for(const c of colliders)collision.addBox(...c.args);
  return {...f,root,detail,registration,colliders,collision,unrelated};
}

test('refinement retains interaction, original plaque asset and floor ownership',()=>{
  const f=fixture(),callback=f.body.userData.onInteract,plaqueMaterial=f.plaque.material,plaqueMap=plaqueMaterial.map;
  const originalPosition=f.group.position.clone(),floorMaterial=f.apron.material;
  const result=refineTamayama(f.group,f.materials);
  assert.equal(result.id,'way/305214602');
  assert.equal(result.revision,'R68');
  assert.equal(f.body.parent,f.group);assert.equal(f.body.userData.onInteract,callback);
  assert.equal(f.plaque.parent,f.group);assert.equal(f.plaque.material,plaqueMaterial);assert.equal(f.plaque.material.map,plaqueMap);
  assert.equal(f.apron.parent,f.group);assert.equal(f.apron.material,floorMaterial);assert.equal(f.apron.position.y,.11);
  assert.equal(f.apron.geometry.parameters.width,3.7);assert.equal(f.apron.geometry.parameters.depth,4.8);
  assert.deepEqual(f.group.position.toArray(),originalPosition.toArray());assert.equal(f.group.rotation.y,-.06);
  const children=[...f.group.children];assert.equal(refineTamayama(f.group,f.materials),result);assert.deepEqual(f.group.children,children);
});

test('unknown shrine or incomplete legacy signature is not partially rewritten',()=>{
  const f=fixture();f.group.userData.zone='okumiya';
  assert.equal(refineTamayama(f.group,f.materials),null);
  f.group.userData.zone='tamayama';f.plaque.removeFromParent();
  const children=[...f.group.children],rotation=f.group.rotation.y,bodyMaterial=f.body.material;
  assert.equal(refineTamayama(f.group,f.materials),null);
  assert.deepEqual(f.group.children,children);assert.equal(f.group.rotation.y,rotation);assert.equal(f.body.material,bodyMaterial);
});

test('mapped public approach reaches the closed front without invisible collision',()=>{
  const f=relocated();
  assert.equal(f.registration.replacedLegacyColliders,1);assert.equal(f.colliders[0],f.unrelated);
  assert.ok(Math.abs(f.registration.yaw+Math.PI/2)<1e-12);
  const baseline=new SpatialCollisionWorld();baseline.addBox(target[0],target[2],2.4,2.2,anchorYaw,target[1],target[1]+3.8,'tamayama_inari');
  const blocked=baseline.resolvePlayer(101.806,target[1]+1.77,-33.93);
  assert.ok(Math.hypot(blocked.x-101.806,blocked.z+33.93)>.90,'fixture reproduces original approach blockage');
  for(const lateral of [-.70,0,.70])for(let i=0;i<=30;i++){
    const t=i/30,x=97.199+(101.806-97.199)*t,z=-33.841+(-33.93+33.841)*t+lateral;
    const resolved=f.collision.resolvePlayer(x,target[1]+1.77,z);
    assert.ok(Math.hypot(resolved.x-x,resolved.z-z)<1e-8,`way 1133053715 remains clear at ${t}, lateral ${lateral}`);
  }
  // The real sanctuary enclosure is still closed; removing the obsolete
  // oversized envelope must not let a visitor walk through the building.
  const inside=new THREE.Vector3(0,0,-.4).applyMatrix4(f.group.matrixWorld);
  const resolved=f.collision.resolvePlayer(inside.x,target[1]+1.77,inside.z);
  assert.ok(Math.hypot(resolved.x-inside.x,resolved.z-inside.z)>1);
  const post=TAMAYAMA_LAYOUT.porch;
  const postCenter=new THREE.Vector3(post.postX,0,post.postZ).applyMatrix4(f.group.matrixWorld);
  const postResolved=f.collision.resolvePlayer(postCenter.x,target[1]+1.77,postCenter.z);
  assert.ok(Math.hypot(postResolved.x-postCenter.x,postResolved.z-postCenter.z)>.25);
  const before=f.colliders.length;
  assert.equal(buildTamayamaCompound(f.root,{},null,f.materials,f.colliders),f.registration);
  assert.equal(f.colliders.length,before,'registration is idempotent');
});

test('corrected floor and furniture do not occupy the mapped southern shrine',()=>{
  const f=relocated(),bounds=new THREE.Box3().setFromObject(f.apron);
  // way/1268143670, the adjacent small shrine: preserved map data.
  const neighbour={minX:103.248,maxX:104.771,minZ:-31.414,maxZ:-30.179};
  assert.ok(bounds.max.z<neighbour.minZ,'narrow platform no longer enters the southern shrine footprint');
  for(const collider of f.colliders.filter(c=>c.args.at(-1).startsWith('tamayama_compound_'))){
    const [x,z,halfW,halfD,yaw]=collider.args;
    const extentX=Math.abs(Math.cos(yaw))*halfW+Math.abs(Math.sin(yaw))*halfD;
    const extentZ=Math.abs(Math.sin(yaw))*halfW+Math.abs(Math.cos(yaw))*halfD;
    const overlap=x+extentX>neighbour.minX&&x-extentX<neighbour.maxX&&z+extentZ>neighbour.minZ&&z-extentZ<neighbour.maxZ;
    assert.equal(overlap,false,`${collider.args.at(-1)} preserves neighbour`);
  }
});

test('all added geometry is finite and static within a bounded material budget',()=>{
  const f=fixture(),result=refineTamayama(f.group,f.materials),detail=f.group.children.find(c=>c.name==='Tamayama photographed compound detail');
  assert.ok(result.materialBatches<=10);assert.ok(result.triangles<12000);
  assert.equal(detail.children.length,result.materialBatches);
  let triangles=0;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(const mesh of detail.children){
    assert.ok(mesh.isMesh&&!mesh.isInstancedMesh);assert.equal(mesh.children.length,0);
    for(const attribute of Object.values(mesh.geometry.attributes))assert.ok([...attribute.array].every(Number.isFinite));
    triangles+=mesh.geometry.attributes.position.count/3;
    assert.ok(mesh.geometry.attributes.uv.count===mesh.geometry.attributes.position.count);
    assert.equal(mesh.onBeforeRender,THREE.Object3D.prototype.onBeforeRender);
    const positions=mesh.geometry.attributes.position;
    for(let i=0;i<positions.count;i+=3){
      a.fromBufferAttribute(positions,i);b.fromBufferAttribute(positions,i+1);c.fromBufferAttribute(positions,i+2);
      assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-18,'curved surfaces and folded strips contain no zero-area triangles');
    }
  }
  assert.equal(triangles,result.triangles);
  const bounds=new THREE.Box3().setFromObject(detail);
  assert.ok(bounds.min.x> -4.6&&bounds.max.x<4.6);assert.ok(bounds.max.y<4.7);assert.ok(bounds.min.z>=-2.2&&bounds.max.z<2.7);
});
