import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {northCourtPlantingLayout,ellipseBoundary} from './north-court-planting-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
const spec=northCourtPlantingLayout(features);
const distance=(p,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[2]-t*dz);};
test('reference island remains west of mapped red frontage and south of shop frontage',()=>{
  assert.equal(spec.estimated,true);assert.equal(spec.hallId,'way/105449708');
  assert.ok(spec.center[0]+spec.radii[0]<23.8-2);
  assert.ok(spec.center[1]-spec.radii[1]>-29.722+4);
  assert.ok(spec.center[0]<31&&spec.center[1]<-15);
});
test('rounded planter perimeter preserves sourced crossing, shop and stair access corridors',()=>{
  for(const id of ['way/105449672','way/105449712','way/1133053714','way/1106589424']){
    const path=features.paths.find(p=>p.id===id),half=Number(path.tags.width??2)/2;
    for(let i=0;i<96;i++){
      const p=ellipseBoundary(spec,i*Math.PI*2/96);
      const gap=Math.min(...path.points.slice(1).map((b,j)=>distance(p,path.points[j],b)))-half;
      assert.ok(gap>.25,id+' clearance '+gap);
    }
  }
});
test('missing geographic context suppresses the island instead of guessing placement',()=>{
  assert.equal(northCourtPlantingLayout({buildings:[],paths:[]}),null);
});
