import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildGraph,heightAt,nearestNode} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {createKeihanStationSpec} from './keihan-station-spec.mjs';
import {keihanApproachLayout} from './keihan-approach.mjs';
import {createInariStationArrivalSpec} from './inari-station-arrival-spec.mjs';
import {inariStationRouteLayout} from './inari-station-route.mjs';
import {buildStationApproachRoutes} from './station-approach-routes.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),graph=buildGraph(features.paths,terrain),romon=nearestNode(graph,features.pois.find(p=>p.tags.name==='楼門').point,10).node.point;
const keihan=createKeihanStationSpec(features,surfaces),jr=createInariStationArrivalSpec(features,surfaces);
const floor=(x,z)=>50+Math.sin(x*.07)+z*.01;
function setup(){return {
 spatial:{main:[[...romon]]},walkHeight:floor,isWalkable:()=>true,
 keihanStation:{built:true,spec:keihan,routePoints:[keihan.train.doorPosition,keihan.route.platformDoor,keihan.route.turn,keihan.route.gate,keihan.route.rampHead,keihan.route.rampFoot].map(p=>[...p])},
 keihanApproach:{built:true,routePoints:keihanApproachLayout(features,surfaces,keihan).routePoints},
 inariStation:{built:true,spec:jr,routePoints:[jr.train.doorPosition,jr.route.platformDoor,jr.route.stairTop,jr.route.stairBottom,jr.route.gate,jr.route.exit].map(p=>[...p])},
 inariStationRoute:{built:true,routePoints:inariStationRouteLayout(features,surfaces,jr).routePoints}
};}
const contains=(points,p)=>points.some(q=>Math.hypot(q[0]-p[0],q[2]-p[2])<1e-8);

test('both station routes begin on their platform and reach the exterior canonical Romon node',()=>{
 const a=setup(),r=buildStationApproachRoutes(a,features,terrain);
 for(const [key,spec]of [['keihan',keihan],['keihan_omotesando',keihan],['jr',jr]]){
  assert.ok(r[key]);assert.deepEqual(r[key].points[0],[spec.route.platformDoor[0],floor(spec.route.platformDoor[0],spec.route.platformDoor[2]),spec.route.platformDoor[2]]);
  assert.deepEqual(r[key].points.at(-1),[romon[0],floor(romon[0],romon[2]),romon[2]]);
  assert.equal(contains(r[key].points,spec.train.doorPosition),false,'train doorway is outside the walking tour');
  assert.ok(r[key].stops[0].includes(key==='jr'?'JR':'Keihan'));assert.equal(r[key].stops.at(-1),'Rōmon');
 }
});

test('Keihan Omotesando branch turns south at Hommachi then east through the first torii',()=>{
 const r=buildStationApproachRoutes(setup(),features,terrain),p=r.keihan_omotesando.points;
 for(const point of [[-157.252,0,-85.95],[-157.261,0,-82.343],[-157.407,0,10.342],[-149.06,0,10.742],[-73.144,0,6.724]])assert.ok(contains(p,point));
 assert.equal(contains(p,[-157.198,0,31.926]),false,'do not walk south past the Omotesando turn');
 assert.ok(p.length>r.keihan.points.length);
 assert.ok(r.keihan_omotesando.stops.includes('Omotesando · First torii'));
 const missing={...features,paths:features.paths.filter(p=>p.id!=='way/79699850')};
 const broken=buildStationApproachRoutes(setup(),missing,terrain);
 assert.equal(broken.keihan_omotesando,null);assert.ok(broken.keihan);assert.ok(broken.jr);
});

test('authored corners and real mapped gate/Omotesando/Urasando connections survive densification',()=>{
 const a=setup(),r=buildStationApproachRoutes(a,features,terrain);
 for(const [key,station,approach]of [['keihan',a.keihanStation,a.keihanApproach],['jr',a.inariStation,a.inariStationRoute]]){
  for(const p of [...station.routePoints.slice(1),...approach.routePoints])assert.ok(contains(r[key].points,p),`${key} lost owner corner ${p}`);
 }
 assert.ok(contains(r.keihan.points,[-304.141,0,-128.596]),'mapped gate path middle corner must not be replaced by a straight exit join');
 for(const p of features.paths.find(p=>p.id==='way/105449722').points.slice(0,-1))assert.ok(contains(r.jr.points,p),'JR follows every Omotesando bend');
 for(const p of [[-19.905,0,-20.561],[-19.659,0,-16.13],[-18.3,0,1.959]])assert.ok(contains(r.keihan.points,p),'Keihan uses mapped Urasando continuation');
});

test('every returned height comes from assembly and all three-dimensional steps are at most two metres',()=>{
 const a=setup(),calls=[];a.walkHeight=(x,z,previous)=>{calls.push({x,z,previous});return floor(x,z);};
 const r=buildStationApproachRoutes(a,features,terrain);
 for(const route of Object.values(r))for(let i=0;i<route.points.length;i++){
  const p=route.points[i];assert.equal(p[1],floor(p[0],p[2]));if(i)assert.ok(Math.hypot(...p.map((v,j)=>v-route.points[i-1][j]))<=2+1e-8);
 }
 assert.ok(calls.some(c=>Number.isFinite(c.previous)),'previous floor participates in the canonical sampler');
});

test('station data is preserved and returned arrays do not alias either owner',()=>{
 const a=setup(),before=JSON.stringify([a.keihanStation.routePoints,a.keihanApproach.routePoints,a.inariStation.routePoints,a.inariStationRoute.routePoints]),r=buildStationApproachRoutes(a,features,terrain);
 assert.equal(JSON.stringify([a.keihanStation.routePoints,a.keihanApproach.routePoints,a.inariStation.routePoints,a.inariStationRoute.routePoints]),before);
 r.keihan.points[0][0]=999;r.keihan.stops.push('changed');assert.equal(JSON.stringify([a.keihanStation.routePoints,a.keihanApproach.routePoints,a.inariStation.routePoints,a.inariStationRoute.routePoints]),before);
 assert.equal(buildStationApproachRoutes(a,features,terrain).keihan.stops.includes('changed'),false);
});

test('a missing owner withholds only its station while invalid shared connectivity withholds both',()=>{
 const a=setup();a.keihanStation.built=false;const r=buildStationApproachRoutes(a,features,terrain);assert.equal(r.keihan,null);assert.ok(r.jr);
 const disconnected={...features,paths:features.paths.filter(p=>!p.nodeIds.includes(5911582120))};assert.deepEqual(buildStationApproachRoutes(setup(),disconnected,terrain),{keihan:null,keihan_omotesando:null,jr:null});
});

test('unmapped joins, unavailable floors and unsupported samples fail closed',()=>{
 const a=setup();a.keihanApproach.routePoints[0]=[-300,0,-120];assert.equal(buildStationApproachRoutes(a,features,terrain).keihan,null);
 const b=setup();b.walkHeight=()=>NaN;assert.deepEqual(buildStationApproachRoutes(b,features,terrain),{keihan:null,keihan_omotesando:null,jr:null});
 const c=setup();c.isWalkable=()=>false;assert.deepEqual(buildStationApproachRoutes(c,features,terrain),{keihan:null,keihan_omotesando:null,jr:null});
 assert.deepEqual(buildStationApproachRoutes({},features,terrain),{keihan:null,keihan_omotesando:null,jr:null});
});
