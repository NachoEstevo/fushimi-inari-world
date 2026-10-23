import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {fixture} from './okusha-architecture.test.mjs';
import {buildOkushaCourt} from './okusha-details.mjs';
import {buildSenbonRestR96} from './senbon-rest-r96.mjs';
import {buildRestBoundaryR96,omokaruStoneIdsR96,omokaruCobbleLayoutR96,omokaruEaveBracesR96,omokaruLanternCapR96} from './restboundary-r96.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {subtractCourtObstacle,courtPolygonArea} from './court-clipping.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
function fullFixture(){
  const f=fixture();f.omokaru.removeFromParent();f.colliders.splice(1,1);
  for(const [w,h,d,x,y,z]of [[1.1,1.85,11.5,7.4,.92,-.5],[2.6,1.45,.35,6.6,.72,4.45],[.75,2.1,.32,6.6,1.25,4.85]]){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),f.materials.stoneMat);o.position.set(x,y,z);f.original.add(o);
  }
  const orbs=[];
  for(const x of [5.75,7.45]){
    for(const [geo,y]of [[new THREE.CylinderGeometry(.18,.22,1.45,10),.72],[new THREE.CylinderGeometry(.32,.28,.14,12),1.48],[new THREE.SphereGeometry(.24,18,18),1.76]]){
      const o=new THREE.Mesh(geo,f.materials.stoneMat);o.position.set(x,y,5.6);f.original.add(o);
      if(y===1.76){o.userData.interactable={onTrigger:()=>{o.position.y=2.04;}};orbs.push(o);}
    }
  }
  buildOkushaCourt(f.root,features,f.anchor,f.materials,f.colliders);buildSenbonRestR96(f.root,features,f.anchor,f.materials);
  f.original.updateWorldMatrix(true,true);
  for(const o of orbs){const p=o.getWorldPosition(new THREE.Vector3());f.colliders.push({type:'cylinder',args:[p.x,p.z,.32,65,67,'omokaru']});}
  return {...f,orbs};
}
test('mapped Omokaru relocation preserves actual pick-up objects and replaces only exact misplaced owners',()=>{
  const f=fullFixture(),callbacks=f.orbs.map(o=>o.userData.interactable),count=f.colliders.length;
  const a=buildRestBoundaryR96(f.root,features,f.materials,f.colliders,()=>65);
  assert.equal(a.movedStones,2);assert.equal(a.removedLegacy,3);assert.deepEqual(a.builtIds,['way/1051656818']);assert.ok(a.batches<=10&&a.triangles+a.lanternStats.reduce((s,q)=>s+q.triangles,0)<24000);assert.equal(a.label,'おもかる石');
  f.root.updateMatrixWorld(true);
  for(let i=0;i<2;i++){
    const point=features.pois.find(p=>p.id===omokaruStoneIdsR96[i]).point,pos=f.orbs[i].getWorldPosition(new THREE.Vector3());
    assert.ok(Math.abs(pos.x-point[0])<1e-8&&Math.abs(pos.z-point[2])<1e-8);assert.equal(f.orbs[i].userData.interactable,callbacks[i]);
    f.orbs[i].geometry.computeBoundingBox();const ob=f.orbs[i].geometry.boundingBox;assert.ok(ob.max.x-ob.min.x<.221);assert.ok(Math.abs(ob.min.y+1.76-1.5465)<.002,'liftstone is seated at the cap top rather than floating');
    callbacks[i].onTrigger();assert.equal(f.orbs[i].position.y,2.04);
    const collider=f.colliders.find(c=>c.args.at(-1)==='omokaru'&&c.args[0]===point[0]);assert.equal(collider.args[1],point[2]);
  }
  assert.equal(f.colliders.length,count+6);
  const boundary=f.colliders.find(c=>c.args.at(-1)==='omokaru_rear_boundary');assert.ok(boundary.args[0]>276);
  const collision=new SpatialCollisionWorld();
  for(const c of f.colliders.filter(c=>c.args.at(-1).startsWith('omokaru')))collision[c.type==='box'?'addBox':'addCylinder'](...c.args);
  const path=features.paths.find(p=>p.id==='way/301527762');
  for(let i=1;i<path.points.length;i++)for(let j=0;j<=50;j++){
    const t=j/50,x=path.points[i-1][0]*(1-t)+path.points[i][0]*t,z=path.points[i-1][2]*(1-t)+path.points[i][2]*t;
    const q=collision.resolvePlayer(x,66.55,z,.28);assert.ok(Math.hypot(q.x-x,q.z-z)<1e-7,'real rear-footway centerline retains .28m player passage');
  }
  assert.equal(f.original.children.some(c=>c.geometry?.parameters?.width===1.1&&c.geometry.parameters.depth===11.5),false);
  const lantern=a.group.children.find(g=>g.isGroup&&g.children[0]?.isMesh);assert.ok(lantern);
  for(const axis of [0,2])for(const side of [-1,1]){
    const faces=[];
    lantern.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;
      for(let j=0;j<p.count;j+=3){const t=[0,1,2].map(k=>[p.getX(j+k),p.getY(j+k),p.getZ(j+k)]);
        if(t.every(v=>Math.abs(v[axis]-side*.15)<1e-6&&v[1]>=.93-1e-6&&v[1]<=1.3575+1e-6))faces.push(t.map(v=>[v[axis===0?2:0],v[1]]));
      }
    });
    assert.ok(faces.length>0);
    for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
      const remaining=subtractCourtObstacle(faces[i],faces[j]).reduce((s,p)=>s+courtPolygonArea(p),0);
      assert.ok(courtPolygonArea(faces[i])-remaining<1e-7,'actual exterior chamber triangles have no positive-area coplanar overlap');
    }
  }
  for(const direction of [new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1)]){
    const start=lantern.position.clone().addScaledVector(direction,-1);start.y+=1.155;
    const ray=new THREE.Raycaster(start,direction);assert.equal(ray.intersectObject(lantern,true).length,0,'small opposite chamber openings are physically open');
    start.y=lantern.position.y+1.01;ray.set(start,direction);assert.ok(ray.intersectObject(lantern,true).length>0,'solid stone surrounds the chamber aperture below');
    start.y=lantern.position.y+1.295;ray.set(start,direction);assert.ok(ray.intersectObject(lantern,true).length>0,'solid stone surrounds the chamber aperture above');
  }
  a.group.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
  assert.equal(buildRestBoundaryR96(f.root,features,f.materials,f.colliders,()=>65),null);
});
test('cobble packing is deterministic, staggered, varied and horizontally broad',()=>{
  const a=omokaruCobbleLayoutR96(7.41);assert.deepEqual(a,omokaruCobbleLayoutR96(7.41));assert.ok(a.length>120);
  assert.ok(a.filter(c=>c.width>c.height).length/a.length>.9);assert.ok(new Set(a.map(c=>c.width.toFixed(3))).size>30);
  assert.ok(a.every(c=>c.s-c.width/2>=-1e-9&&c.s+c.width/2<=7.41+1e-9));
});
test('stone caps stay shallow and swept while keeping liftstone support inside retained collision radius',()=>{
  const {half,height}=omokaruLanternCapR96,rise=Math.max(...height)-Math.min(...height),span=half[0]*2;
  assert.ok(rise/span<.35&&rise/span>.25,'cap rise must be substantially smaller than its overhang span');
  assert.ok(height[0]>height[1],'outer lip sweeps above the adjacent shallow course');
  assert.ok(Math.SQRT2*half[0]<.32,'square cap corners stay inside the existing circular collider');
  assert.equal(height.at(-1)+.009,1.559,'crown seat stays fixed under the original orb baseline');
});
test('all swept canopy knees attach to actual long-eave receiver members',()=>{
  const fp=features.buildings.find(b=>b.id==='way/1051656818').points.slice(0,-1),base=65;
  const paths=omokaruEaveBracesR96(fp,base);assert.equal(paths.length,4);
  for(const [i,path]of paths.entries()){
    const [from,to]=[[0,3],[3,0],[1,2],[2,1]][i],a=fp[from],b=fp[to],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),tip=path.at(-1);
    assert.deepEqual(path[0],[a[0],base+1.99,a[2]]);
    for(const p of path)assert.ok(Math.abs((p[0]-a[0])*dz-(p[2]-a[2])*dx)/len<1e-8,'brace stays in its eave plane');
    assert.ok(tip[1]>=base+2.45-.085&&tip[1]<=base+2.45+.085,'brace tip intersects the existing fascia/eave receiver');
    const station=((tip[0]-a[0])*dx+(tip[2]-a[2])*dz)/len;assert.ok(station>.20&&station<len/2);
  }
});
test('unknown source, missing matching collider, or non-finite terrain never partially relocate fixtures',()=>{
  for(const mode of ['source','collider','ground']){
    const f=fullFixture(),parents=f.orbs.map(o=>o.parent),positions=f.orbs.map(o=>o.position.clone()),children=[...f.original.children];
    if(mode==='collider')f.colliders.pop();
    assert.equal(buildRestBoundaryR96(f.root,mode==='source'?{...features,pois:[]}:features,f.materials,f.colliders,()=>mode==='ground'?NaN:65),null);
    assert.deepEqual(f.original.children,children);for(let i=0;i<2;i++){assert.equal(f.orbs[i].parent,parents[i]);assert.ok(f.orbs[i].position.equals(positions[i]));}
  }
});
