import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {polygonArea,clipConvex} from './entrance-area-surfaces-layout.mjs';
import {okushaCourtSurfacePlanR95,buildOkushaCourtSurfacesR95} from './okusha-court-surface-r95.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('actual Okusha court excludes arrival and incoming/outgoing mapped ribbons without extending footprint',()=>{
  const plan=okushaCourtSurfacePlanR95(features);assert.ok(plan.cuts.length>=5);assert.ok(plan.mineral.length>0&&plan.paving.length>0);
  for(const polygon of [...plan.mineral,...plan.paving]){
    for(const [x,z]of polygon)assert.ok(x>=-19-1e-7&&x<=19+1e-7&&z>=-10-1e-7&&z<=10+1e-7);
    for(const cut of plan.cuts)assert.ok(Math.abs(polygonArea(clipConvex(polygon,cut)))<1e-6);
  }
  for(const a of plan.mineral)for(const b of plan.paving)assert.ok(Math.abs(polygonArea(clipConvex(a,b)))<1e-6);
});
test('replacement mineral and ribbon are finite upward faces on same +.14 arrival datum',()=>{
  const court=new THREE.Group(),material=new THREE.MeshStandardMaterial();
  buildOkushaCourtSurfacesR95(court,features,{gravelMat:material,precinctPaving:material});
  assert.equal(court.children.length,3);let triangles=0;
  for(const mesh of court.children.slice(0,2)){const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;triangles+=p.count/3;
    for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getZ(i)));assert.ok(Math.abs(p.getY(i)-.14)<1e-7);assert.ok(n.getY(i)>.99);}
  }
  assert.ok(triangles<1500);
});
test('exact rendered mitered path envelopes clear cross-owner overlap and retain the former right junction void',()=>{
  const network=makePathSurfaces(features,()=>62.394978),plan=okushaCourtSurfacePlanR95(features,network);
  const inside=(p,polygon)=>{let pos=false,neg=false;for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],cross=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(cross>1e-7)pos=true;if(cross< -1e-7)neg=true;}return !(pos&&neg);};
  const overlaps=plan.local(258.8382099572611,70.94563502478199),gap=plan.local(257.02933874747356,72.46860456081697);
  assert.equal([...plan.mineral,...plan.paving].filter(p=>inside(overlaps,p)).length,0,'mapped paving owns former white/stone duplicate');
  for(const [x,z] of [[257.2009213455756,70.76845678573859],[257.26752472209057,71.26798210960008]])assert.equal([...plan.mineral,...plan.paving].filter(p=>inside(plan.local(x,z),p)).length,0,'concave miter quad is cut as its actual emitted triangles');
  assert.equal([...plan.mineral,...plan.paving].filter(p=>inside(gap,p)).length,1,'court owns the former raw/miter cutout gap');
  // Audit the full original rectangle, not just hand-picked screenshot rays.
  // Every interior sample belongs to the court once or the rendered path union.
  for(let x=-18.873;x<19;x+=.25)for(let z=-9.879;z<10;z+=.25){
    const p=[x,z],path=plan.cuts.some(c=>inside(p,c)),court=[...plan.mineral,...plan.paving].filter(c=>inside(p,c)).length;
    assert.equal(court,path?0:1,`court/path coverage at local ${x},${z}`);
  }
  for(const polygon of [...plan.mineral,...plan.paving])for(const cut of plan.cuts)assert.ok(Math.abs(polygonArea(clipConvex(polygon,cut)))<1e-6,'no court triangle overlaps any actual emitted path triangle');
});
