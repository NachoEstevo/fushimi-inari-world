import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
test('permanent context retains only actual bounded footprint identities and unchanged polygons',()=>{
 const layout=entranceNeighborhoodLayout(features);assert.ok(layout.records.length>35);
 for(const r of layout.records){const b=features.buildings.find(b=>b.id===r.id);assert.deepEqual(r.points,b.points.slice(0,-1));assert.notEqual(b.tags.building,'roof');assert.ok(r.center[0]>=-160&&r.center[0]<=-18);assert.ok(r.height>0);}
 assert.ok(layout.skippedLegacyShopOverlap.includes('way/305215314'));assert.ok(!layout.records.some(r=>r.id==='way/305215314'));
});
test('metadata heights take precedence, storey conversion and fallback remain explicit',()=>{
 const make=(id,tags,x)=>({id,tags,points:[[x,0,-50],[x+2,0,-50],[x+2,0,-48],[x,0,-48],[x,0,-50]]});
 const l=entranceNeighborhoodLayout({buildings:[make('height',{height:'7.4'},-140),make('levels',{'building:levels':'2'},-130),make('fallback',{},-120)]});
 assert.deepEqual(l.records.map(r=>r.height),[7.4,6,4.5]);assert.match(l.records[2].heightSource,/estimated/);
});

test('photographed Minami detail is limited to the uniquely closest NE public edge',()=>{
 const records=entranceNeighborhoodLayout(features).records,minami=records.find(r=>r.id==='way/260121332');
 assert.equal(minami.publicFacadeEdge,1);assert.equal(minami.height,5.2);assert.match(minami.heightSource,/photograph/);
 assert.equal(records.filter(r=>r.publicFacadeEdge!==null).length,1);
 const a=minami.points[1],b=minami.points[2],dx=b[0]-a[0],dz=b[2]-a[2];assert.ok(dz>0&&dx>0); // outward normal [dz,-dx] faces northeast
 const route=features.paths.find(p=>p.id==='way/105449676');
 const distance=(p,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[2])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[2]-t*dz);};
 const distances=minami.points.map((a,i)=>{const b=minami.points[(i+1)%minami.points.length],mid=[(a[0]+b[0])/2,(a[2]+b[2])/2];return Math.min(...route.points.slice(1).map((b,j)=>distance(mid,route.points[j],b)));});
 assert.equal(distances.indexOf(Math.min(...distances)),1);
});
