import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineOkumiya} from './okumiya-facade.mjs';
import {okumiyaLayout,okumiyaRoofY,okumiyaLatticeReturns,okumiyaBargeboard} from './okumiya-layout.mjs';

function sourceFixture(){
  // Mirror the source asset signature, including the original interaction
  // target and shared texture objects; no renderer or DOM is needed.
  const group=new THREE.Group();group.userData.zone='okumiya';group.rotation.y=Math.PI/2;
  const red=new THREE.MeshStandardMaterial(),gold=new THREE.MeshStandardMaterial(),plaster=new THREE.MeshStandardMaterial();
  const roofMaterial=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture(),roughnessMap:new THREE.Texture()});
  roofMaterial.normalScale.set(1.4,1.4);
  const add=(w,h,d,material,y,z=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(0,y,z);group.add(mesh);return mesh;};
  const podium=add(6.8,.48,5,plaster,.24),wall=add(5.6,2.95,3.8,plaster,1.95);
  let triggered=0;wall.userData.interactable={title:'Okumiya',onTrigger:()=>triggered++};
  const lattice=add(5.68,1.12,3.88,new THREE.MeshStandardMaterial({map:new THREE.Texture()}),1.05);
  const veranda=add(6.3,.16,4.4,red,.72);
  for(const x of [-2.7,-.9,.9,2.7]){
    const column=new THREE.Mesh(new THREE.CylinderGeometry(.12,.13,2.95,12),red);column.position.set(x,1.95,1.95);group.add(column);
  }
  for(const x of [-1.8,0,1.8]){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.18,12,12),gold);lamp.position.set(x,2.65,1.95);group.add(lamp);
  }
  const roof=add(7.8,.72,6.2,roofMaterial,3.72,.28);add(8,.26,.44,gold,4.18);
  return{group,podium,wall,lattice,veranda,roof,roofMaterial,materials:{vermilionMat:red,goldMat:gold},triggered:()=>triggered};
}

test('Okumiya preserves the interaction target, exterior podium and shared source maps',()=>{
  const f=sourceFixture(),wallGeo=f.wall.geometry,podiumGeo=f.podium.geometry,interaction=f.wall.userData.interactable;
  const podiumPosition=f.podium.position.clone(),latticeMaterial=f.lattice.material;
  const stats=refineOkumiya(f.group,f.materials);
  assert.equal(stats.revision,'R69');assert.equal(f.wall.geometry,wallGeo);assert.equal(f.podium.geometry,podiumGeo);
  assert.deepEqual(f.podium.position,podiumPosition);assert.equal(f.wall.userData.interactable,interaction);assert.equal(f.wall.parent,f.group);
  assert.equal(f.lattice.material,latticeMaterial);assert.equal(f.roof.material.map,f.roofMaterial.map);
  assert.equal(f.roof.material.normalMap,f.roofMaterial.normalMap);assert.equal(f.roof.material.roughnessMap,f.roofMaterial.roughnessMap);
  assert.deepEqual(f.roofMaterial.normalScale.toArray(),[1.4,1.4]);assert.notEqual(f.roof.material,f.roofMaterial);
  f.group.updateMatrixWorld(true);
  const origin=f.group.localToWorld(new THREE.Vector3(0,2.2,4)),target=f.group.localToWorld(new THREE.Vector3(0,2.2,0));
  const hits=new THREE.Raycaster(origin,target.sub(origin).normalize()).intersectObjects([f.wall],false);
  assert.ok(hits.length>0);assert.equal(hits[0].object,f.wall);assert.ok(Math.abs(hits[0].distance-2.1)<1e-6);
  interaction.onTrigger();assert.equal(f.triggered(),1);
});

test('Okumiya refinement is idempotent and declines unknown source geometry without mutation',()=>{
  const f=sourceFixture(),first=refineOkumiya(f.group,f.materials),children=[...f.group.children],roofGeo=f.roof.geometry,roofMat=f.roof.material;
  assert.equal(refineOkumiya(f.group,f.materials),first);assert.deepEqual(f.group.children,children);
  assert.equal(f.roof.geometry,roofGeo);assert.equal(f.roof.material,roofMat);
  const other=sourceFixture();other.roof.geometry=new THREE.BoxGeometry(7.8,.6,6.2);
  const originalChildren=[...other.group.children],originalAngle=other.group.rotation.y;
  assert.equal(refineOkumiya(other.group,other.materials),null);assert.deepEqual(other.group.children,originalChildren);
  assert.equal(other.group.rotation.y,originalAngle);assert.equal(other.group.userData.okumiyaDetail,undefined);
});

test('refined geometry is finite, nondegenerate and contained within the pavilion envelope',()=>{
  const f=sourceFixture();refineOkumiya(f.group,f.materials);f.group.rotation.y=0;f.group.updateMatrixWorld(true);
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let triangles=0,detailMeshes=0;
  for(const mesh of f.group.children){
    const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(const attribute of [p,n,uv])assert.ok(Array.from(attribute.array).every(Number.isFinite),`${mesh.name}: nonfinite attribute`);
    const count=g.index?.count??p.count;triangles+=count/3;
    for(let i=0;i<count;i+=3){
      a.fromBufferAttribute(p,g.index?g.index.getX(i):i);b.fromBufferAttribute(p,g.index?g.index.getX(i+1):i+1);c.fromBufferAttribute(p,g.index?g.index.getX(i+2):i+2);
      assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-16,`${mesh.name}: degenerate triangle at ${i/3}`);
    }
    if(mesh.name==='Okumiya photo-backed detail batch')detailMeshes++;
    for(let i=0;i<p.count;i++){
      a.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
      // No newly added low barrier may project onto the exterior forecourt.
      if(a.y<2.0){assert.ok(Math.abs(a.x)<=3.401);assert.ok(Math.abs(a.z)<=2.501);}
    }
  }
  const bounds=new THREE.Box3().setFromObject(f.group);
  assert.ok(bounds.min.y>=-1e-6&&bounds.max.y<5.35);assert.ok(bounds.min.x>=-4.03&&bounds.max.x<=4.03);
  assert.ok(bounds.min.z>=-2.87&&bounds.max.z<=3.43);
  assert.equal(detailMeshes,8);assert.ok(triangles<15000,`geometry budget exceeded: ${triangles}`);
});

test('the taller asymmetric roof retains both eave heights and uses metric bark UVs',()=>{
  const f=sourceFixture();refineOkumiya(f.group,f.materials);
  for(const x of [-3.9,-2,0,2,3.9]){
    const expected=3.20+1.22*.28+.12*Math.pow(Math.abs(x/3.9),6);
    assert.ok(Math.abs(okumiyaRoofY(x,-2.82)-expected)<1e-8);
    assert.ok(Math.abs(okumiyaRoofY(x,3.38)-expected)<1e-8);
  }
  assert.ok(okumiyaRoofY(0,okumiyaLayout.ridgeZ)>4.9);
  assert.ok(okumiyaRoofY(0,-1.5)<okumiyaRoofY(0,.96));
  const uvs=f.roof.geometry.attributes.uv,values=Array.from(uvs.array);
  assert.ok(Math.max(...values)-Math.min(...values)>7,'roof texture must not stretch one tile over the entire pavilion');
  const index=f.roof.geometry.index;
  for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);
    const area=(uvs.getX(b)-uvs.getX(a))*(uvs.getY(c)-uvs.getY(a))-(uvs.getY(b)-uvs.getY(a))*(uvs.getX(c)-uvs.getX(a));
    assert.ok(Math.abs(area)>1e-8,'roof side UVs must have area for normal-map derivatives');
  }
  f.lattice.geometry.computeBoundingBox();assert.ok(f.lattice.geometry.boundingBox.min.z>1.9,'koshi must not reappear around the rear wall');
});

test('curved vermilion soffit stays below the bark shell at both gable overhangs',()=>{
  const f=sourceFixture();refineOkumiya(f.group,f.materials);f.group.rotation.y=0;f.group.updateMatrixWorld(true);
  const underside=f.group.children.find(c=>c.name==='Okumiya photo-backed detail batch'&&c.material===f.materials.vermilionMat);
  for(const x of [-3.6,-3.4,3.4,3.6])for(const z of [-2.4,-1.3,.7,1.4]){
    const ray=new THREE.Raycaster(new THREE.Vector3(x,okumiyaRoofY(x,z)-.3,z),new THREE.Vector3(0,1,0));
    const red=ray.intersectObject(underside,false)[0],bark=ray.intersectObject(f.roof,false)[0];
    assert.ok(red&&bark,`underside gap at ${x},${z}`);
    assert.ok(red.distance<bark.distance-.005,`soffit crosses bark shell at ${x},${z}`);
  }
});

test('photographed corner lattice stays near the front and never wraps the main side walls',()=>{
 const returns=okumiyaLatticeReturns();assert.equal(returns.length,2);
 for(const r of returns){assert.ok(Math.abs(r.x)-.023>okumiyaLayout.wallWidth/2);assert.ok(r.z-r.depth/2>1.2);assert.ok(Math.abs(r.z+r.depth/2-r.frontZ)<1e-8);assert.ok(r.y+r.height/2<=okumiyaLayout.verandaFloor+1e-8);}
 const f=sourceFixture(),stats=refineOkumiya(f.group,f.materials);assert.equal(stats.features.latticeCornerReturns,2);assert.equal(stats.features.estimatedLatticeReturnDepth,.72);
 const batch=f.group.children.find(m=>m.name==='Okumiya photo-backed detail batch'&&m.material===f.lattice.material);assert.ok(batch);
 const box=new THREE.Box3().setFromObject(batch);assert.ok(box.min.z>1.2&&box.max.z<1.97);
});

test('pale gable fascia follows the unchanged roof with constant clearance',()=>{
 for(const side of [-1,1])for(const [x,y,z]of okumiyaBargeboard(side)){assert.equal(x,side*3.9);assert.ok(Math.abs(okumiyaRoofY(x,z)-y-.23)<1e-8);}
});
