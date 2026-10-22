import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {tamayamaContinuationLayout,buildTamayamaContinuationTorii,continuationTerrainFootLevels} from './tamayama-continuation-torii.mjs';
import {buildToriiInscriptions} from './torii-inscriptions.mjs';
import {gondenAccessToriiLayout} from './gonden-access-torii-layout.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
globalThis.document={createElement:()=>({width:2048,height:1024,getContext:()=>({fillText(){},save(){},scale(){},restore(){}})})};
function fixture(){const material=new THREE.MeshStandardMaterial({color:'#b44720'});return {root:new THREE.Group(),legacy:{toriiMeshes:[],materials:{vermilionMat:material,blackNemakiMat:material},torii:{fresh:material,weathered:material,geometry:new THREE.BoxGeometry(4.2,3.38,.3).translate(0,1.69,0),blackGeometry:new THREE.BoxGeometry(4.2,.12,.4).translate(0,3.3,0)}},surfaces:{height:()=>50,terrainHeight:()=>49.7},colliders:[]};}
test('right turn continues along the full mapped south branch; lower west gate remains separate',()=>{
  const before=JSON.stringify(features),p=tamayamaContinuationLayout(features);assert.deepEqual(p.center,[97.437,-22.676]);assert.equal(p.routeIds.length,6);
  const start=features.paths.find(p=>p.id==='way/1133055117').points[0];assert.ok(start[0]<98&&start[2]<-33);assert.ok(p.center[1]>start[2]);
  const end=features.paths.find(p=>p.id==='way/1392716577').points.at(-1);assert.ok(end[0]>117);assert.ok(end[2]>-19);
  assert.deepEqual(gondenAccessToriiLayout(features).center,[75.725,-33.708]);assert.equal(JSON.stringify(features),before);assert.match(p.placementStatus,/inferred/);assert.match(p.dimensionsStatus,/not surveyed/);
});
test('actual geometry envelope is reported, feet seat to terrain, and clear centre passage has post collision',()=>{
  const f=fixture(),stats=buildTamayamaContinuationTorii(f.root,f.legacy,features,f.surfaces,f.colliders);assert.ok(stats.built);assert.equal(f.colliders.length,2);assert.ok(stats.geometryBounds.max[0]-stats.geometryBounds.min[0]>9);
  assert.ok(Math.abs(stats.geometryBounds.max[1]-stats.base-stats.height)<.00001);
  const ink=f.root.getObjectByName('Torii dedication ink');assert.ok(ink);ink.traverse(o=>{if(!o.isMesh)return;for(const n of o.geometry.attributes.uv.array)assert.ok(Number.isFinite(n));const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>=.5&&uv.getX(i)<=.625,'unsupported reverse dedication emitted');});
  const world=new SpatialCollisionWorld();for(const c of f.colliders)world.addCylinder(...c.args);
  for(let dz=-3;dz<=3;dz+=.1)for(const offset of [-.75,0,.75]){const x=stats.center[0]+offset,z=stats.center[1]+dz,p=world.resolvePlayer(x,51.7,z);assert.ok(Math.hypot(p.x-x,p.z-z)<.0001);}
  for(const p of stats.posts){assert.ok(Math.abs(p.bottom-49.64)<.0001);const hit=world.resolvePlayer(p.x+.02,51.7,p.z);assert.ok(Math.hypot(hit.x-p.x-.02,hit.z-p.z)>.3);assert.ok(Math.hypot(p.x-94.1,p.z+28.9)>5,'landscape landing lantern conflicts with post');}
  const count=f.root.children.length;assert.deepEqual(buildTamayamaContinuationTorii(f.root,f.legacy,features,f.surfaces,f.colliders),stats);assert.equal(f.root.children.length,count);assert.equal(f.colliders.length,2);
});
test('no duplicate gate over a future existing active station or fabricated gate on broken route',()=>{
  const f=fixture(),plan=tamayamaContinuationLayout(features),existing=new THREE.InstancedMesh(f.legacy.torii.geometry,f.legacy.torii.fresh,1);existing.setMatrixAt(0,new THREE.Matrix4().makeTranslation(plan.center[0],50,plan.center[1]));f.root.add(existing);f.legacy.toriiMeshes.push(existing);
  assert.equal(buildTamayamaContinuationTorii(f.root,f.legacy,features,f.surfaces,f.colliders).reason,'existing-gate-at-station');assert.equal(f.colliders.length,0);
  const changed=structuredClone(features);changed.paths.find(p=>p.id==='way/1133055118').points[0][0]+=1;assert.equal(tamayamaContinuationLayout(changed),null);assert.equal(tamayamaContinuationLayout({paths:[]}),null);
  const other=fixture();other.colliders.push({type:'cylinder',args:[plan.center[0]+2.8,plan.center[1],.32,49,56,'other_owned_torii']});assert.equal(buildTamayamaContinuationTorii(other.root,other.legacy,features,other.surfaces,other.colliders).reason,'existing-static-gate-at-station');
});
test('foot seating raycasts the rendered coarse triangle rather than its nonlinear source function',()=>{
  const terrain={xmin:0,zmin:0,cols:2,rows:2,step:10,heights:[0,0,0,0]},surfaces={terrainHeight:(x,z)=>x*x/10+z*z/100};
  const [level]=continuationTerrainFootLevels(terrain,[],()=>null,surfaces,[{x:5,z:5}],.2);
  const expected=5.5-.2*Math.hypot(1,.1)-.06-.04;
  assert.ok(Math.abs(level-expected)<.002);assert.ok(level>surfaces.terrainHeight(5,5)+2,'seating used height function instead of actual face');
});
test('shared inscription helper keeps its full existing default and frontOnly emits only supported front glyphs',()=>{
  const full=new THREE.Group(),front=new THREE.Group(),entry={m:new THREE.Matrix4(),inscription:0,dateInscription:1};
  const options={halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27};
  buildToriiInscriptions(full,[entry],options);buildToriiInscriptions(front,[entry],{...options,frontOnly:true});
  const triangles=g=>{let n=0;g.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return n;};
  assert.ok(triangles(front)>0);assert.equal(triangles(full),triangles(front)*2);
});
