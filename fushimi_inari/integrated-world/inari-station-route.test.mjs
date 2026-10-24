import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {createInariStationArrivalSpec} from './inari-station-arrival-spec.mjs';
import {inariStationRouteLayout,buildInariStationRoute} from './inari-station-route.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const inRing=(x,z,ring)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])inside=!inside;}return inside;};
function triangleHeight(x,z,triangle){
 const [a,b,c]=triangle,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)return null;
 const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;
 // Float32 mesh coordinates may round by micrometres at exact public edges.
 return Math.min(u,v,w)>=-5e-5?u*a[1]+v*b[1]+w*c[1]:null;
}

test('real east exit route turns north along Hommachi before using the preserved crossing',()=>{
 const spec=createInariStationArrivalSpec(features,surfaces),layout=inariStationRouteLayout(features,surfaces,spec),route=layout.routePoints;
 assert.deepEqual(route[0],spec.publicExit.position);assert.equal(layout.arrival.sourceNode,749327076);
 assert.deepEqual(route.at(-2),[-157.407,surfaces.height(-157.407,10.342),10.342]);
 assert.equal(route.at(-1)[0],-149.06);assert.ok(route[0][2]-route.at(-3)[2]>26);
 assert.ok(route.at(-3)[0]<-161);assert.ok(layout.stair.rise>.14&&layout.stair.rise<.17);assert.ok(layout.ramp.slope>0&&layout.ramp.slope<1/12);
});

test('new paving is disjoint, outside mapped building interiors and existing road tops',()=>{
 const layout=inariStationRouteLayout(features,surfaces);
 for(let i=0;i<layout.portions.length;i++)for(let j=i+1;j<layout.portions.length;j++)assert.ok(Math.abs(polygonArea(clipConvex(layout.portions[i].polygon,layout.portions[j].polygon)))<1e-7,layout.portions[i].id+' / '+layout.portions[j].id);
 for(const p of layout.portions){const x=p.polygon.reduce((n,a)=>n+a[0],0)/p.polygon.length,z=p.polygon.reduce((n,a)=>n+a[1],0)/p.polygon.length;
  for(const b of features.buildings)assert.equal(inRing(x,z,b.points),false,p.id+' intersects '+b.id);
  const road=surfaces.sample(x,z);if(road&&['way/79699850','way/944841272'].includes(road.segment.id))assert.ok(road.distance>=road.segment.width/2-.006,p.id+' duplicates '+road.segment.id);
 }
});

test('existing street segments own pavement levels even if off-road DEM changes',()=>{
 const baseline=inariStationRouteLayout(features,surfaces),altered={...surfaces,height:(x,z)=>surfaces.sample(x,z)?.height??9999},spec=createInariStationArrivalSpec(features,surfaces),next=inariStationRouteLayout(features,altered,spec);
 for(const p of baseline.portions)for(const [x,z]of p.polygon)assert.equal(next.surfaceHeight(x,z),baseline.surfaceHeight(x,z));
 assert.equal(next.surfaceHeight(0,0),null);
 assert.throws(()=>inariStationRouteLayout(features,{height:()=>33},spec),/paved street sampler/);
});

test('visible tops support continuous outbound and return walks with no rail collision',()=>{
 const root=new THREE.Group(),colliders=[],result=buildInariStationRoute(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();for(const c of colliders)world.addCylinder(...c.args);
 let checked=0,maxStep=0,last=null;
 for(const route of [result.routePoints,[...result.routePoints].reverse()])for(let j=1;j<route.length;j++){
  const a=route[j-1],b=route[j],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.05));
  for(let i=0;i<=count;i++){
   const t=i/count,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,added=result.surfaceHeight(x,z),y=added??surfaces.sample(x,z)?.height;
   assert.ok(Number.isFinite(y),'no visible paved owner '+[x,z]);
   const solved=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(solved.x-x,solved.z-z)<1e-7);
   if(added!==null){const hits=result.topTriangles.map(t=>triangleHeight(x,z,t)).filter(y=>y!==null);assert.ok(hits.some(h=>Math.abs(h-y)<.001),'walking floor has no matching rendered top '+[x,y,z]);}
   if(last!==null)maxStep=Math.max(maxStep,Math.abs(y-last));last=y;checked++;
  }
 }
 assert.ok(checked>1500);assert.ok(maxStep<.18);assert.ok(result.triangles<3000);assert.equal(result.drawBatches,5);
 const again=buildInariStationRoute(root,features,surfaces,{},colliders);assert.equal(again.group,result.group);assert.equal(root.children.length,1);assert.equal(colliders.length,result.collidersAdded);
});

test('ramp stays walkable between observed rails and has matching visual support',()=>{
 const layout=inariStationRouteLayout(features,surfaces),root=new THREE.Group(),colliders=[],result=buildInariStationRoute(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();for(const c of colliders)world.addCylinder(...c.args);
 for(let v=3.3;v<=12.6;v+=.1){const [x,z]=layout.local(.6,v),y=result.surfaceHeight(x,z),solved=world.resolvePlayer(x,y+1.7,z);assert.ok(Number.isFinite(y));assert.ok(Math.hypot(solved.x-x,solved.z-z)<1e-7);assert.ok(result.topTriangles.some(t=>{const h=triangleHeight(x,z,t);return h!==null&&Math.abs(h-y)<.001;}));}
 root.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
});

test('the reported exact landing/riser corners have real ray support without an offset patch',()=>{
 const root=new THREE.Group(),r=buildInariStationRoute(root,features,surfaces);root.updateMatrixWorld(true);
 for(const [x,z]of [[-162.47639664541933,37.534906983135606],[-162.48628549627932,37.035004782071574]])for(const dx of [-.01,0,.01]){
  const y=r.surfaceHeight(x+dx,z),ray=new THREE.Raycaster(new THREE.Vector3(x+dx,y+.05,z),new THREE.Vector3(0,-1,0),0,.25),hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-y)<.001);
 }
});

test('crossing-mouth seal follows the actual road miters without any road-top overlap',()=>{
 const root=new THREE.Group(),r=buildInariStationRoute(root,features,surfaces),layout=inariStationRouteLayout(features,surfaces);root.updateMatrixWorld(true);
 for(const p of layout.portions.filter(p=>p.id.startsWith('crossing-mouth')))for(const q of layout.roadTops)assert.ok(Math.abs(polygonArea(clipConvex(p.polygon,q)))<1e-8);
 for(const [x,z]of [[-160.40713737668898,10.09365402964061],[-160.4069995440519,10.343653991644937]])for(const dx of [-.001,-.0001,-.00005,0,.00005,.0001,.001]){
  const y=r.surfaceHeight(x+dx,z),ray=new THREE.Raycaster(new THREE.Vector3(x+dx,y+.05,z),new THREE.Vector3(0,-1,0),0,.1),hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.ok(Math.abs(hit.point.y-y)<1e-5);
 }
});

test('incomplete source and inconsistent public levels do not silently invent a path',()=>{
 assert.equal(inariStationRouteLayout({paths:[],buildings:[]},surfaces),null);
 const spec=createInariStationArrivalSpec(features,surfaces);assert.throws(()=>inariStationRouteLayout(features,surfaces,{...spec,publicFloor:spec.publicFloor+2}),/reconciliation/);
});
