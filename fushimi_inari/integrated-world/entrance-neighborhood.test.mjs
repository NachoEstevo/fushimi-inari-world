import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url),'utf8'));
test('permanent context retains only actual bounded footprint identities and unchanged polygons',()=>{
 const layout=entranceNeighborhoodLayout(features);assert.ok(layout.records.length>35);
 for(const r of layout.records){const b=features.buildings.find(b=>b.id===r.id);assert.deepEqual(r.points,b.points.slice(0,-1));assert.notEqual(b.tags.building,'roof');assert.ok(r.center[0]>=-160&&r.center[0]<=-18);assert.ok(r.height>0);}
 assert.ok(!layout.skippedLegacyShopOverlap.includes('way/305215314'));assert.equal(layout.records.filter(r=>r.id==='way/305215314').length,1);
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

test('only the photographed Gishikiden receives the explicit16m massing estimate',()=>{
 const records=entranceNeighborhoodLayout(features).records,gishikiden=records.find(r=>r.id==='way/223276575'),source=features.buildings.find(b=>b.id===gishikiden.id);
 assert.equal(gishikiden.height,16);assert.match(gishikiden.heightSource,/estimated16m/);assert.match(gishikiden.heightSource,/not storeys/);assert.deepEqual(gishikiden.points,source.points.slice(0,-1));
 for(const r of records.filter(r=>!['way/223276575','way/260121332'].includes(r.id))){const b=features.buildings.find(b=>b.id===r.id),h=Number.parseFloat(b.tags.height),levels=Number.parseFloat(b.tags['building:levels']);assert.equal(r.height,Number.isFinite(h)&&h>0?h:Number.isFinite(levels)&&levels>0?levels*3:4.5);}
});

// A mapped canopy, rather than camera interpretation, determines the entrance.
test('Gishikiden entrance edges are exactly shared by the mapped open canopy',()=>{
 const hall=features.buildings.find(b=>b.id==='way/223276575'),canopy=features.buildings.find(b=>b.id==='way/751194634');
 assert.equal(canopy.tags.building,'roof');
 const same=(a,b)=>a[0]===b[0]&&a[2]===b[2];
 for(const i of [20,21]){const a=hall.points[i],b=hall.points[i+1];assert.ok(canopy.points.slice(1).some((q,j)=>same(a,q)&&same(b,canopy.points[j])));}
 // Both outward normals face the mapped canopy, not the hall interior.
 for(const i of [20,21]){const a=hall.points[i],b=hall.points[i+1];assert.ok(b[2]-a[2]>0);}
});

test('only the three retained southern shop assets exclude mapped overlaps',()=>{
 const make=(id,x,z)=>({id,tags:{building:'yes'},points:[[x-1,0,z-1],[x+1,0,z-1],[x+1,0,z+1],[x-1,0,z+1],[x-1,0,z-1]]});
 const centers=[[-89.35,-7.96],[-78.34,-8.22],[-89.16,20.07],[-78.68,20.1],[-68.70,20.1]],layout=entranceNeighborhoodLayout({buildings:centers.map(([x,z],i)=>make('fixture'+i,x,z))});
 assert.deepEqual(layout.records.map(r=>r.id),['fixture0','fixture1']);
 assert.deepEqual(layout.skippedLegacyShopOverlap,['fixture2','fixture3','fixture4']);
});
