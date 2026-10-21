import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ainomineBuildingId,ainomineLayout,ainomineApproach,makeAinomineToriiExclusion} from './mountain-landmarks-layout.mjs';
import {heightAt,isWalkable,buildGraph,nearestNode,shortestRoute} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
const terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url),'utf8'));
const ground=(x,z)=>heightAt(terrain,x,z),surfaces=makePathSurfaces(features,ground);
const plan=ainomineLayout(features,surfaces.height);

test('Ainomine is registered to its own mountain footprint and existing bypass, without mutating geography',()=>{
  const before=JSON.stringify(features),poi=features.pois.find(p=>p.id===ainomineBuildingId);
  const layout=ainomineLayout(features,surfaces.height);
  assert.equal(JSON.stringify(features),before);
  assert.deepEqual(layout.sourcePoint,poi.point);
  assert.equal(layout.center[0],939.488);assert.equal(layout.center[2],.456);
  assert.ok(layout.width>3.2&&layout.width<3.3);assert.ok(layout.depth>1.6&&layout.depth<1.75);
  assert.equal(layout.route.id,'way/1372826374');
  assert.ok(layout.route.point[2]<layout.center[2]);
  assert.equal(ainomineLayout({...features,buildings:features.buildings.filter(b=>b.id!==ainomineBuildingId)},ground),null);
});

test('all new shrine solids leave the complete mapped northern path walkable in both directions and at both edges',()=>{
  const world=new SpatialCollisionWorld();
  for(const c of plan.solids)world[c.type==='box'?'addBox':'addCylinder'](...c.args);
  let samples=0;
  for(const path of features.paths.filter(p=>isWalkable(p.tags))){
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
      if(!length)continue;
      const count=Math.ceil(length/.2);
      for(const direction of [1,-1])for(let sample=0;sample<=count;sample++){
        const t=direction===1?sample/count:1-sample/count,x=a[0]+dx*t,z=a[2]+dz*t;
        if(Math.hypot(x-plan.center[0],z-plan.center[2])>12)continue;
        // A .28 m player centred .72 m off-axis fits inside the mapped 2 m path.
        for(const lateral of [-.72,0,.72]){
          const px=x-dz/length*lateral,pz=z+dx/length*lateral,py=surfaces.height(px,pz)+1.7;
          const result=world.resolvePlayer(px,py,pz,.28);
          assert.ok(Math.hypot(result.x-px,result.z-pz)<.00001,`${path.id}, lane ${lateral}, (${px},${pz})`);samples++;
        }
      }
    }
  }
  assert.ok(samples>300);
});

test('gate preserves an open pedestrian centre while its visible pillars stop the player',()=>{
  const world=new SpatialCollisionWorld();
  for(const c of plan.solids)world[c.type==='box'?'addBox':'addCylinder'](...c.args);
  // Stop in front of the actual altar; this is a side sanctuary, not a tunnel
  // through the altar and rear wall.
  for(let v=.40;v<2;v+=.1){
    const [x,z]=plan.world(0,v),result=world.resolvePlayer(x,plan.floor+1.7,z);
    assert.ok(Math.hypot(result.x-x,result.z-z)<.00001);
  }
  const [x,z]=plan.world(plan.gateHalfSpan-.15,plan.gateV),hit=world.resolvePlayer(x,plan.floor+1.7,z);
  assert.ok(Math.hypot(hit.x-x,hit.z-z)>.05);
});

test('inferred approach stays outside the existing public steps and does not require excavating terrain',()=>{
  const steps=ainomineApproach(plan,surfaces.height);
  assert.ok(steps.length>=2&&steps.length<=8);
  assert.ok(plan.floor-steps[0].level<=.22,'last approach step joins the platform inside walkHeight tolerance');
  for(let i=1;i<steps.length;i++)assert.ok(Math.abs(steps[i].level-steps[i-1].level)<=.22,'successive treads stay walkable');
  const route=plan.route;let normal=[-route.direction[1],route.direction[0]];
  if(normal[0]*(plan.center[0]-route.point[0])+normal[1]*(plan.center[2]-route.point[2])<0)normal=normal.map(n=>-n);
  for(const step of steps)for(const [x,y,z]of step.polygon){
    const separation=normal[0]*(x-route.point[0])+normal[1]*(z-route.point[2]);
    assert.ok(separation>=route.halfWidth-.00001,'no overlapping slab on mapped route');
    assert.ok(y>=surfaces.height(x,z)-.00001,'treads above terrain');
    assert.ok(y-surfaces.height(x,z)<=.24,'no unwalkable exposed riser at a tread corner');
  }
  const graph=buildGraph(features.paths,terrain),here=nearestNode(graph,plan.sourcePoint).node;
  for(const id of ['way/626313751','way/626313736']){
    const other=nearestNode(graph,features.pois.find(p=>p.id===id).point).node;
    assert.ok(shortestRoute(graph,here.id,other.id)?.length>1,'existing Sannomine/Ninomine route retained');
  }
});

test('Ainomine reserves its side approach before complete inferred torii stations are emitted',()=>{
  // Captured from the actual Sannomine–Ninomine placement loop (section 4),
  // including global occupied-station filtering. Before this reservation,
  // stations 64/65 blocked the approach and 66 crossed the roof/lantern.
  const stations=[
    [63,196.2327425,200.08943530182785,.1664315753017472,
      [936.1706042180655,-.8721086994737361],[936.2371911280367,-3.73423931156583]],
    [64,196.4757815,200.21492323101978,.1608754573582116,
      [937.7210010349244,-.8821578918901063],[937.7874641299865,-3.6519934817009636]],
    [65,196.597301,200.09454867101581,.16357305570326555,
      [939.3828681902122,-.8506524463242118],[939.4541289245841,-3.605996700824078]],
    [66,196.70687416666667,200.32427874277158,.1588577485575716,
      [940.7992584332436,-.8278761751358641],[940.8505745194251,-3.563278320515785]],
    [67,196.81644733333334,200.41930881137498,.1651444102867151,
      [942.1474164029376,-.7930465410108742],[942.2202794660518,-3.53482467229512]],
  ].map(([index,yMin,yMax,radius,...points])=>({index,yMin,yMax,posts:points.map(([x,z])=>({x,z,radius}))}));
  const before=JSON.stringify(stations),exclude=makeAinomineToriiExclusion(plan,ainomineApproach(plan,surfaces.height));
  const kept=stations.filter(s=>!exclude(s));
  assert.deepEqual(stations.filter(s=>exclude(s)).map(s=>s.index),[64,65,66]);
  assert.deepEqual(kept.map(s=>s.index),[63,67],'adjacent stations retain their original placement');
  assert.equal(exclude(stations[3]),'ainomine-sanctuary','roof conflict also excludes the complete gate');
  assert.equal(JSON.stringify(stations),before,'reservation does not move any remaining station');
  const worldFor=list=>{
    const world=new SpatialCollisionWorld();
    for(const c of plan.solids)world[c.type==='box'?'addBox':'addCylinder'](...c.args);
    for(const s of list)for(const p of s.posts)world.addCylinder(p.x,p.z,p.radius,s.yMin,s.yMax,'mountain_torii');
    return world;
  };
  const obstructed=worldFor(stations),clear=worldFor(kept);let priorMax=0,samples=0;
  for(const u of [-.45,0,.45])for(const direction of [1,-1])for(let i=0;i<=90;i++){
    const t=direction===1?i/90:1-i/90,v=.4+(plan.route.axisDistance-.4)*t,[x,z]=plan.world(u,v),y=surfaces.height(x,z)+1.7;
    const old=obstructed.resolvePlayer(x,y,z),now=clear.resolvePlayer(x,y,z);
    priorMax=Math.max(priorMax,Math.hypot(old.x-x,old.z-z));
    assert.ok(Math.hypot(now.x-x,now.z-z)<.00001,'reserved approach remains open with neighbouring torii present');samples++;
  }
  assert.ok(priorMax>.30,'fixture reproduces the original blocked approach');assert.ok(samples>500);
});
