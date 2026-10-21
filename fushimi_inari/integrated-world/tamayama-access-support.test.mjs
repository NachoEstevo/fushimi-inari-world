import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tamayamaAccessTerrain} from './tamayama-access-support.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {heightAt,buildGraph,shortestRoute} from '../geography/geo-core.mjs';
import {tamayamaStairRailLayout} from './tamayama-stair-layout.mjs';

const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('actual Tamayama front already connects to Okumiya through mapped nodes and four-count steps',()=>{
  const ids=['way/1133053715','way/649175020','way/1133055117','way/297888105','way/1133055118','way/1133055119','way/626313768','way/1392716577','way/105449724'];
  const paths=features.paths.filter(p=>ids.includes(p.id)),graph=buildGraph(paths,terrain);
  const route=shortestRoute(graph,10564318626,2065278023);
  assert.ok(route?.length>5);
  const network=makePathSurfaces({paths},(x,z)=>heightAt(terrain,x,z));
  assert.equal(network.segments.filter(s=>s.id==='way/297888105').length,4);
  assert.equal(network.segments.filter(s=>s.id==='way/626313768').length,22);
});

test('mapped front stair and connector curb receive backing without changing tread or walking levels',()=>{
  const ids=['way/105449693','way/1133055111','way/1133055112','way/649175020','way/1133053715','way/1133055117','way/297888105','way/1133055118'];
  const source=makePathSurfaces({paths:features.paths.filter(p=>ids.includes(p.id))},(x,z)=>heightAt(terrain,x,z));
  const before=JSON.stringify(source.segments),walking=source.height;
  const grade=tamayamaAccessTerrain(source,features);
  for(const id of ids){
    const s=source.segments.find(s=>s.id===id),x=(s.a[0]+s.b[0])/2,z=(s.a[2]+s.b[2])/2;
    near(grade(x,z),(s.ya+s.yb)/2-(s.stair?s.rise:0)-.045);
  }
  assert.equal(JSON.stringify(source.segments),before);assert.equal(source.height,walking);
  for(const p of [[103.33,-33.98],[117,-18],[800,-220],[70,-20]])assert.equal(grade(...p),source.terrainHeight(...p));
});

test('main west flight uses full mapped width and a continuous dividing rail at its actual tread heights',()=>{
  const path=features.paths.find(p=>p.id==='way/105449693');
  assert.equal(path.tags.width,'2');assert.equal(path.tags.step_count,undefined);
  const source=makePathSurfaces({paths:[path]},(x,z)=>heightAt(terrain,x,z)),before=JSON.stringify(source.segments);
  const layout=tamayamaStairRailLayout(source),grade=tamayamaAccessTerrain(source,features);
  assert.ok(layout.joints.length>2);
  assert.deepEqual(layout.joints[0].filter((_,i)=>i!==1),[path.points[0][0],path.points[0][2]]);
  assert.deepEqual(layout.joints.at(-1).filter((_,i)=>i!==1),[path.points.at(-1)[0],path.points.at(-1)[2]]);
  for(let i=1;i<layout.joints.length-1;i++)near(layout.joints[i][1],(layout.flight[i-1].yb+layout.flight[i].ya)/2+.84);
  for(const s of source.segments){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz),x=(s.a[0]+s.b[0])/2-dz/len*1.13,z=(s.a[2]+s.b[2])/2+dx/len*1.13;
    near(grade(x,z),s.ya-s.rise-.045);
  }
  assert.equal(JSON.stringify(source.segments),before);
  const mouths=makePathSurfaces({paths:features.paths.filter(p=>['way/105449693','way/1213198209','way/1133055112'].includes(p.id))},()=>49);
  const first=mouths.segments.find(s=>s.id==='way/105449693'),last=mouths.segments.filter(s=>s.id==='way/105449693').at(-1);
  for(const s of [first,last]){
    const p=s===first?s.a:s.b;
    assert.equal(mouths.edgeCovered(p[0],p[2]+s.width/2,s.ya,'way/105449693'),true,'existing shared-node policy opens landing curbs');
  }
});

test('only bounded shoulders change and meet prior terrain continuously',()=>{
  const source={segments:[{id:'way/1133053715',a:[0,0,0],b:[10,0,0],width:2,ya:50,yb:50,stair:false}],terrainHeight:()=>48};
  const grade=tamayamaAccessTerrain(source);
  near(grade(5,1.13),49.955);assert.equal(grade(5,2.13),48);
  assert.ok(Math.abs(grade(5,2.13-.0001)-48)<1e-6);
  assert.equal(grade(5,3),48);
  const other={...source,segments:[{...source.segments[0],id:'unrelated'}]};
  assert.equal(tamayamaAccessTerrain(other),other.terrainHeight);
  const crossing={...source,segments:[...source.segments,{...source.segments[0],id:'other-stair',a:[5,0,-20],b:[5,0,20],stair:true,rise:.18}]};
  assert.equal(tamayamaAccessTerrain(crossing)(5,0),48);
});
