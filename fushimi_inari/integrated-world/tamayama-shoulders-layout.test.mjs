import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tamayamaShoulderPlan} from './tamayama-shoulders-layout.mjs';
import {polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs';

test('mineral margins follow widened landing while leaving its paving and branch mouth open',()=>{
  const source=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const features=tamayamaAccessFeatures(source),ids=['way/649175020','way/1133053715','way/1133055111','way/1133055117','way/1133055114'];
  const network=makePathSurfaces({paths:features.paths.filter(p=>ids.includes(p.id))},()=>49),snapshot=JSON.stringify(network.segments);
  const polygons=tamayamaShoulderPlan(network),area=polygons.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);
  assert.ok(area>4&&area<10,`bounded shoulder area ${area}`);
  const sample=(x,z)=>polygons.some(p=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes;});
  assert.equal(sample(95,-33.8),false,'original landing paving excluded');
  assert.equal(sample(93.46,-35.3),false,'mapped crossing excluded');
  assert.equal(sample(95,-30.9),true,'one metre mineral strip outside widened paving');
  assert.equal(sample(95,-29),false,'no broad invented courtyard');
  assert.equal(JSON.stringify(network.segments),snapshot);
});

test('source building and water obstacles cut exact holes from narrow margins',()=>{
  const s={id:'way/649175020',a:[0,0,0],b:[10,0,0],width:4.8,kind:'stone',stair:false};
  const base=tamayamaShoulderPlan({segments:[s]}),baseArea=base.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);
  const blocked=tamayamaShoulderPlan({segments:[s]},[[[2,2.6],[4,2.6],[4,3.4],[2,3.4]],[[6,-3.4],[8,-3.4],[8,-2.6],[6,-2.6]]]);
  const blockedArea=blocked.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);
  assert.ok(Math.abs(baseArea-20)<1e-8);
  assert.ok(Math.abs(blockedArea-16.8)<1e-8);
});
