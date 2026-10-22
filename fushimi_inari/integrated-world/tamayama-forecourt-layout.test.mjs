import test from 'node:test';
import assert from 'node:assert/strict';
import {tamayamaForecourtPlan} from './tamayama-forecourt-layout.mjs';
import {TAMAYAMA_LAYOUT as L,tamayamaLocalSolids} from './tamayama-compound-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const inside=(point,polygons)=>polygons.some(p=>{
  let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>point[1])!==(p[j][1]>point[1])&&point[0]<(p[j][0]-p[i][0])*(point[1]-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;
  return yes;
});

test('small mineral envelope surrounds existing lantern bases while retaining apron and all pedestal holes',()=>{
  const before=JSON.stringify(L),plan=tamayamaForecourtPlan(identity);
  assert.ok(plan.area>27&&plan.area<38,`${plan.area} square metres`);
  assert.equal(inside([2.6,1.85],plan.polygons),true,'mineral beside stone lantern');
  assert.equal(inside([4.4,1.88],plan.polygons),true,'mineral beside timber lantern');
  assert.equal(inside([0,1.9],plan.polygons),false,'retained stone apron');
  for(const base of tamayamaLocalSolids().filter(s=>s.id.includes('base-')))assert.equal(inside(base.center,plan.polygons),false,base.id);
  assert.equal(inside([0,4],plan.polygons),true,'visible mineral ground forward of apron');
  assert.equal(plan.estimatedFrontMargin,2,'photo-inferred front extent is explicit');
  for(const p of [[0,4.5],[5,2],[3,-1],[0,-10]])assert.equal(inside(p,plan.polygons),false,'bounded forecourt');
  assert.equal(JSON.stringify(L),before);
});

test('path junction, building and water obstacles are exact holes, without extra clearance strips',()=>{
  const cuts=[[[1.95,.5],[2.2,.5],[2.2,4.4],[1.95,4.4]],[[2.8,2.6],[3.8,2.6],[3.8,3.2]], [[-4,2.7],[-3,2.7],[-3,3.2],[-4,3.2]]];
  const plan=tamayamaForecourtPlan(identity,cuts);
  for(const p of plan.polygons)for(const cut of cuts){
    const area=Math.abs(polygonArea(p)),remaining=subtractConvex(p,cut).reduce((s,q)=>s+Math.abs(polygonArea(q)),0);
    assert.ok(Math.abs(area-remaining)<1e-8);
  }
  assert.equal(inside([2.21,2.9],plan.polygons),true,'mineral reaches path boundary');
  assert.equal(inside([2.1,4],plan.polygons),false,'crossing paving stays exposed in extended front court');
  assert.equal(inside([2.21,4],plan.polygons),true,'forward mineral reaches crossing paving without a grass seam');
});

test('compound world matrix owns the west-facing registration and its area is preserved',()=>{
  const matrix=[0,0,1,0,0,1,0,0,-1,0,0,0,103.331,50.14,-33.979,1];
  const local=tamayamaForecourtPlan(identity),world=tamayamaForecourtPlan(matrix);
  assert.ok(Math.abs(local.area-world.area)<1e-8);
  assert.equal(inside([103.331-1.85,-33.979+2.6],world.polygons),true);
  assert.equal(inside([103.331-1.9,-33.979],world.polygons),false);
});
