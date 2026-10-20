import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {heightAt,buildGraph,shortestRoute,nearestNode,routeMetrics,resample,isWalkable} from './geo-core.mjs';
const terrain=JSON.parse(readFileSync(new URL('./terrain.json',import.meta.url)));
const features=JSON.parse(readFileSync(new URL('./features.json',import.meta.url)));
const graph=buildGraph(features.paths,terrain);
const poi=name=>features.pois.find(p=>p.tags.name===name);
const id=p=>nearestNode(graph,p.point,80)?.node.id;
test('DEM interpolation preserves corners and the actual mesh triangles',()=>{
  const t={xmin:0,zmin:0,cols:2,rows:2,step:10,heights:[0,10,20,30]};
  assert.equal(heightAt(t,0,0),0);assert.equal(heightAt(t,10,10),30);assert.equal(heightAt(t,5,5),15);
  const saddle={...t,heights:[0,0,0,40]};
  assert.equal(heightAt(saddle,5,5),0);assert.equal(heightAt(saddle,7.5,7.5),20);
});
test('source coverage includes real eastward summit and official elevation agreement within DEM resolution',()=>{
  const gate=poi('楼門'),summit=poi('一ノ峰');
  assert.ok(summit.point[0]-gate.point[0]>1000);
  assert.ok(Math.abs(summit.point[1]-233)<5);
  assert.ok(summit.point[1]-gate.point[1]>170);
  assert.ok(terrain.heights.every(Number.isFinite));
});
test('Romon to summit route uses connected OSM nodes without fabricated links',()=>{
  const route=shortestRoute(graph,id(poi('楼門')),id(poi('一ノ峰')));
  assert.ok(route&&route.length>50);
  const stats=routeMetrics(resample(route,terrain));
  assert.ok(stats.length>1200&&stats.length<5000,JSON.stringify(stats));
  assert.ok(stats.ascent>170&&stats.ascent<450,JSON.stringify(stats));
  console.log('Romon-summit',stats);
});
test('alternative route via Gozendani exists and differs from direct route',()=>{
  const a=id(poi('楼門')),b=id(poi('一ノ峰')),via=id(poi('御膳谷奉拝所'));
  const direct=shortestRoute(graph,a,b),leg1=shortestRoute(graph,a,via),leg2=shortestRoute(graph,via,b);
  assert.ok(leg1&&leg2);
  assert.notDeepEqual([...leg1,...leg2.slice(1)],direct);
});
test('route endpoints are not silently connected across disconnected components',()=>{
  const g=new Map([[1,{point:[0,0,0],edges:[]}],[2,{point:[1,0,0],edges:[]}]]);
  assert.equal(shortestRoute(g,1,2),null);
  assert.equal(nearestNode(g,[100,0,100],10),null);
});
test('walking respects access overrides and does not project tunnels/bridges onto ground',()=>{
  assert.equal(isWalkable({highway:'path',access:'private'}),false);
  assert.equal(isWalkable({highway:'path',access:'private',foot:'yes'}),true);
  assert.equal(isWalkable({highway:'path',bridge:'yes'}),false);
  assert.equal(isWalkable({highway:'path',tunnel:'yes'}),false);
});
test('resampled route stays on the same terrain used by the viewer, with meter-scale spacing',()=>{
  const route=resample(shortestRoute(graph,id(poi('楼門')),id(poi('一ノ峰'))),terrain,2);
  for(let i=0;i<route.length;i++){
    assert.equal(route[i][1],heightAt(terrain,route[i][0],route[i][2]));
    if(i)assert.ok(Math.hypot(route[i][0]-route[i-1][0],route[i][2]-route[i-1][2])<=2.001);
  }
});
test('full circuit connects all named stops and closes at Romon',()=>{
  const names=['楼門','奥社奉拝所','熊鷹社','四ツ辻 (Yottsu tsuji)','三ノ峰','二ノ峰','一ノ峰','御劔社','御膳谷奉拝所','四ツ辻 (Yottsu tsuji)','楼門'];
  const stops=names.map(poi);stops.splice(1,0,features.pois.find(p=>p.id==='node/6865347485'));
  const points=[];
  for(let i=1;i<stops.length;i++){
    assert.ok(nearestNode(graph,stops[i].point,20));
    const leg=shortestRoute(graph,id(stops[i-1]),id(stops[i]));
    assert.ok(leg,`Missing leg ${names[i]}`);
    points.push(...(i===1?leg:leg.slice(1)));
  }
  const metrics=routeMetrics(resample(points,terrain,2));
  assert.deepEqual(points[0],points.at(-1));
  assert.ok(metrics.length>3500&&metrics.length<4500);
  assert.ok(Math.abs(metrics.ascent-metrics.descent)<.001);
  console.log('Full circuit',metrics);
});
test('crossing paths without shared OSM node IDs remain unconnected',()=>{
  const g=buildGraph([
    {id:'a',tags:{highway:'path'},nodeIds:[1,2],points:[[0,0,0],[10,0,10]]},
    {id:'b',tags:{highway:'path'},nodeIds:[3,4],points:[[0,0,10],[10,0,0]]}
  ],{xmin:0,zmin:0,cols:2,rows:2,step:10,heights:[0,0,0,0]});
  assert.equal(shortestRoute(g,1,4),null);
});
