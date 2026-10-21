import test from 'node:test';
import assert from 'node:assert/strict';
import {okumiyaTerrainGrade,okumiyaLandingEdges} from './okumiya-grade.mjs';
import fs from 'node:fs';

const landing={id:'way/1392716577',a:[114.952,52.09,-18.023],b:[117.168,52.36,-18.201],ya:52.23,yb:52.50,width:6,stair:false,rise:0};
const network=segments=>({segments,terrainHeight:()=>49});
test('landing support meets paving without changing the walking surface',()=>{
  const source=network([landing]),before=JSON.stringify(source.segments);
  const grade=okumiyaTerrainGrade(source);
  assert.ok(Math.abs(grade(...[landing.a[0],landing.a[2]])-(landing.ya-.045))<1e-9);
  assert.equal(JSON.stringify(source.segments),before);
});
test('shoulder is continuous across mapped edge and returns to previous terrain',()=>{
  const segment={...landing,a:[0,0,0],b:[10,0,0],ya:52,yb:52};
  const grade=okumiyaTerrainGrade(network([segment]));
  assert.ok(Math.abs(grade(5,3-.0001)-grade(5,3+.0001))<1e-5);
  assert.equal(grade(5,4.5),49);
  assert.ok(Math.abs(grade(5,4.5-.0001)-49)<1e-5);
  assert.equal(grade(500,500),49);
});
test('stair fill preserves the lower riser level and unmapped routes',()=>{
  const stair={...landing,id:'way/626313768',ya:52,yb:52,stair:true,rise:.18};
  const grade=okumiyaTerrainGrade(network([stair]));
  assert.ok(Math.abs(grade(stair.a[0],stair.a[2])-(52-.18-.045))<1e-9);
  const other=okumiyaTerrainGrade(network([{...landing,id:'way/unrelated'}]));
  assert.equal(other(landing.a[0],landing.a[2]),49);
});

test('short mapped landing opens overlapping stair and lateral curbs through its real nodes',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const stair=features.paths.find(p=>p.id==='way/626313768');
  const lateral=features.paths.find(p=>p.id==='way/105449724');
  assert.equal(stair.nodeIds.some(n=>lateral.nodeIds.includes(n)),false);
  const s={id:lateral.id,a:lateral.points[0],b:lateral.points[1],ya:52.5,yb:52.5,width:3};
  const covered=okumiyaLandingEdges({segments:[s],edgeCovered:()=>false},features);
  // West side of the lateral intersects the wide landing 0.78 m beyond the
  // stair endpoint. Without the short connector this mouth gets a curb wall.
  assert.equal(covered(115.8,-17,52.5,stair.id),true);
  assert.equal(covered(115.8,-17,51.8,stair.id),false);
  assert.equal(covered(115.8,-17,52.5,'unmapped-parallel-path'),false);
  assert.equal(covered(117.9,-8,52.5,stair.id),false);
});
