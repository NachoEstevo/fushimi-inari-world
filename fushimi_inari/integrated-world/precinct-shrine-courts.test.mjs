import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import {makeSpatial} from './spatial.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {buildPrecinctShrineCourts,shrineCourtPlan,courtCuts,surface} from './precinct-shrine-courts.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

test('actual mapped shrines and neighbourhood retain bounded nonempty mineral collars',()=>{
 const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
 const features=read('../geography/features.json'),terrain=read('../geography/terrain.json'),spec=read('./anchors.json');
 const spatial=makeSpatial(terrain,features,spec),root=new THREE.Group();
 for(const zone of ['gonden','okumiya']){
  const a=spatial.byId[zone],g=new THREE.Group();g.position.fromArray(a.target);g.rotation.y=a.yaw+Math.PI/2;
  g.userData={zone,...(zone==='gonden'?{gondenFacadeR65:{}}:{okumiyaDetail:{}})};root.add(g);
 }
 const network=makePathSurfaces(features,()=>50),result=buildPrecinctShrineCourts(root,features,network,{gravelMat:new THREE.MeshStandardMaterial(),stoneMat:new THREE.MeshStandardMaterial()});
 assert.equal(result.courts.length,2);
 for(const court of result.courts)assert.ok(court.area>15&&court.area<32,`${court.zone} clipped area ${court.area}`);
 assert.deepEqual(result.courts.map(c=>c.plinthSize),[[7.2,5.4],[6.8,5]]);
});

test('rotated pavilion collars exclude retained plinth and exact public cutouts',()=>{
 const matrix=new THREE.Matrix4().makeRotationY(.7);matrix.setPosition(103,50,-34);
 const cut=[[102,-40],[103,-40],[103,-28],[102,-28]];
 for(const zone of ['gonden','okumiya']){
  const plan=shrineCourtPlan(zone,matrix.elements,[cut]);
  for(const p of [...plan.gravel,...plan.stone]){
   assert.ok(Math.abs(polygonArea(clipConvex(p,cut)))<1e-8);
   assert.ok(Math.abs(polygonArea(clipConvex(p,plan.base)))<1e-8);
  }
  const area=[...plan.gravel,...plan.stone].reduce((s,p)=>s+Math.abs(polygonArea(p)),0);assert.ok(area>10&&area<30);
 }
 assert.equal(shrineCourtPlan('tamayama',matrix.elements),null);
});

test('rendered overlays follow nonlinear terrain, preserve source state and cut building/path/junction',()=>{
 const root=new THREE.Group(),shrine=new THREE.Group();shrine.userData={zone:'gonden',gondenFacadeR65:{}};root.add(shrine);
 const building=[[3.8,0,-1],[4.5,0,-1],[4.5,0,1],[3.8,0,1]];
 const features={buildings:[{points:building},{id:'way/305214371',points:[[-4.2,0,-3.05],[4.2,0,-3.05],[4.2,0,3.55],[-4.2,0,3.55]]}]};
 const network={terrainHeight:(x,z)=>50+.015*x*x+.02*z,height:()=>50,segments:[{id:'path',a:[-8,50,-3.2],b:[8,50,-3.2],width:.3,accessJunctionTriangles:[-4.4,50,1,-3.8,50,1,-4.1,50,2]}]};
 const before=JSON.stringify(network.segments),height=network.height,terrain=network.terrainHeight;
 const materials={gravelMat:new THREE.MeshStandardMaterial(),stoneMat:new THREE.MeshStandardMaterial()};
 const result=buildPrecinctShrineCourts(root,features,network,materials);assert.ok(result.courts[0].area>15,'own mapped roof must not erase gravel beneath eaves');
 const group=root.children[1];assert.equal(group.children.length,2);
 const cuts=[building.map(p=>[p[0],p[2]]),[[-8,-3.5],[8,-3.5],[8,-2.9],[-8,-2.9]],[[-4.4,1],[-3.8,1],[-4.1,2]]];
 for(const mesh of group.children){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getY(i)-terrain(p.getX(i),p.getZ(i))-.012)<1e-5);
  for(let i=0;i<p.count;i+=3){
   const tri=Array.from({length:3},(_,j)=>[p.getX(i+j),p.getZ(i+j)]);
   assert.ok(polygonArea(tri)<-1e-10);
   for(const cut of cuts)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-5);
  }
 }
 assert.equal(network.height,height);assert.equal(network.terrainHeight,terrain);assert.equal(JSON.stringify(network.segments),before);
 assert.equal(buildPrecinctShrineCourts(root,features,network,materials),result);assert.equal(root.children.length,2);
});

test('court broad phases preserve exact cut order, capped acute miters and independent remote junction triangles',()=>{
 const features={buildings:[{id:'close',points:[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1],[-1,0,-1]]},{id:'way/305214371',points:[[8,0,8],[9,0,8],[9,0,9],[8,0,9],[8,0,8]]},{id:'remote',points:[[100,0,100],[101,0,100],[101,0,101],[100,0,101],[100,0,100]]}],water:[{points:[[2,0,2],[4,0,2],[4,0,4],[2,0,4],[2,0,2]]}]};
 const point=(x,z)=>[x,0,z],network={segments:[{id:'bend',a:point(-3,3),b:point(0,3),width:1},{id:'bend',a:point(0,3),b:point(-2,3.1),width:1},{id:'bend',a:point(-2,3.1),b:point(-1,5),width:1},{id:'remote',a:point(100,100),b:point(101,101),width:2,accessJunctionTriangles:[-.2,0,2.5,.2,0,2.5,0,0,3]},{id:'zero',a:point(0,0),b:point(0,0),width:2}]};
 const cuts=[[-4,5,-2,6],[-1.5,1.5,3,4],[8,10,8,10],[100,102,100,102]].map(r=>courtCuts(features,network,r,'gonden'));
 // Captured from the original allocating courtCuts implementation.
 assert.equal(createHash('sha256').update(JSON.stringify(cuts)).digest('hex'),'0320087e519c17b6bb6ac0e2519ff7fbb2ab271cd1ff631d1829a1fc4eac2800');
});
test('opt-in surface height reuse keeps native geometry exact while removing repeated pure sampler queries',()=>{
 const polygons=[[[0,0],[1.4,0],[1.2,.9],[0,1]],[[.8,.8],[1.8,.8],[1.8,1.6],[.8,1.6]]],material=new THREE.MeshStandardMaterial();
 for(const maxSlope of [Infinity,.45]){
  let directCalls=0,cachedCalls=0;const h=(x,z)=>8+.03*x*x+.02*z;
  const direct=surface(polygons,{terrainHeight:(x,z)=>{directCalls++;return h(x,z);}},material,'direct',{maxSlope});
  const cached=surface(polygons,{terrainHeight:(x,z)=>{cachedCalls++;return h(x,z);}},material,'cached',{maxSlope,cacheHeights:true});
  for(const key of Object.keys(direct.geometry.attributes))assert.deepEqual(cached.geometry.attributes[key].array,direct.geometry.attributes[key].array);
  assert.ok(cachedCalls<directCalls*.55,`${cachedCalls} unique queries replace ${directCalls} total queries`);
 }
});
