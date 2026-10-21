import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clippedCourtCells,courtPolygonArea,subtractCourtObstacle} from './court-clipping.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

test('diagonal corridor clips exact edges without whole-cell soil gaps or overlaps',()=>{
  const obstacle=[[1,-1],[3,-1],[9,11],[7,11]],subject=[[0,0],[10,0],[10,10],[0,10]];
  const exact=subtractCourtObstacle(subject,obstacle).reduce((s,p)=>s+courtPolygonArea(p),0);
  const cells=clippedCourtCells([0,10,0,10],[obstacle],.4);
  const actual=cells.reduce((s,p)=>s+courtPolygonArea(p),0);
  assert.ok(Math.abs(actual-exact)<1e-8);
  for(const cell of cells){
    const remaining=subtractCourtObstacle(cell,obstacle).reduce((s,p)=>s+courtPolygonArea(p),0);
    assert.ok(Math.abs(remaining-courtPolygonArea(cell))<1e-9);
  }
  assert.ok(cells.some(p=>p.some(([x,z])=>Math.abs((x-1)-(z+1)/2)<1e-8)));
});

test('building and water holes remain empty, overlapping holes do not remove extra paving',()=>{
  const a=[[2,2],[6,2],[6,6],[2,6]],b=[[4,4],[8,4],[8,8],[4,8]];
  const cells=clippedCourtCells([0,10,0,10],[a,b],.4);
  assert.ok(Math.abs(cells.reduce((s,p)=>s+courtPolygonArea(p),0)-72)<1e-8);
  assert.deepEqual(clippedCourtCells([0,1,0,1],[[[-1,-1],[2,-1],[2,2],[-1,2]]]),[]);
});

test('actual mapped branch joins at its rendered curb and remains within geometry budget',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const path=features.paths.find(p=>p.id==='way/1133052415'),[a,b]=path.points;
  const len=Math.hypot(b[0]-a[0],b[2]-a[2]),nx=-(b[2]-a[2])/len,nz=(b[0]-a[0])/len,w=pathWidth(path.tags)/2+.13;
  const obstacle=[[a[0]+nx*w,a[2]+nz*w],[b[0]+nx*w,b[2]+nz*w],[b[0]-nx*w,b[2]-nz*w],[a[0]-nx*w,a[2]-nz*w]];
  const bounds=[-85.4,-69.2,-20.5,-4],cells=clippedCourtCells(bounds,[obstacle],.4);
  const triangles=cells.reduce((s,p)=>s+p.length-2,0);
  assert.ok(triangles<4000,`${triangles} triangles`);
  const area=cells.reduce((s,p)=>s+courtPolygonArea(p),0);
  const exact=subtractCourtObstacle([[bounds[0],bounds[2]],[bounds[1],bounds[2]],[bounds[1],bounds[3]],[bounds[0],bounds[3]]],obstacle).reduce((s,p)=>s+courtPolygonArea(p),0);
  assert.ok(Math.abs(area-exact)<1e-7);
  const distances=cells.flat().map(([x,z])=>Math.abs((x-a[0])*nx+(z-a[2])*nz));
  assert.ok(distances.some(d=>Math.abs(d-w)<1e-8),'court reaches the rendered curb exactly');
  console.log(`mapped court: ${cells.length} polygons, ${triangles} triangles, ${area.toFixed(3)} square metres`);
});
