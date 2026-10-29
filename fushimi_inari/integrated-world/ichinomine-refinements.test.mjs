import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineIchinomine} from './ichinomine-refinements.mjs';

function fixture(zone='summit'){
 const object=new THREE.Group();object.userData.zone=zone;
 const canopy=new THREE.Group(),roof=new THREE.Mesh(new THREE.BoxGeometry(6.65,.16,4.95),new THREE.MeshStandardMaterial());
 roof.position.set(0,3.49,0);const original=new THREE.Mesh(new THREE.PlaneGeometry(4.472,1.08,32,4),new THREE.MeshStandardMaterial({map:new THREE.Texture(),side:THREE.DoubleSide}));
 original.position.set(0,2.67,1.584);canopy.position.set(0,1.02,-1.35);canopy.add(roof,original);object.add(canopy);
 return {object,canopy,roof,original,materials:{vermilionMat:new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture()})}};
}
function canvas(){const texts=[],grains=[];return {width:0,height:0,texts,grains,getContext(){return {fillRect(){},beginPath(){},arc(){},moveTo(){},lineTo(){},ellipse(...args){grains.push(args);},fill(){},stroke(){},fillText(t){texts.push(t);},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set font(v){},set textAlign(v){},set textBaseline(v){}};}};}
test('summit-only signature yields split curtain, seven tassels and bounded detail batches',()=>{
 const f=fixture(),c=canvas();const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>c});
 assert.ok(result);assert.deepEqual(result.stats,{crests:2,tassels:7,extraBatches:4,lanterns:0,stairs:0});assert.ok(c.texts.includes('神大廣末'));assert.equal(c.width,1024);assert.equal(c.height,256);
 assert.ok(c.grains.length>80);for(const grain of c.grains){assert.ok(grain[1]-grain[2]>75&&grain[1]+grain[2]<235,'rice grain clipped or invading inscription');}
 assert.notEqual(f.original.geometry,result.originalGeometry);const p=f.original.geometry.attributes.position;
 const lower=[];for(let i=0;i<p.count;i++)if(p.getY(i)<-.2)lower.push([p.getX(i),p.getY(i)]);
 assert.ok(Math.min(...lower.filter(([x])=>Math.abs(x)>1.9).map(([,y])=>y))<Math.min(...lower.filter(([x])=>Math.abs(x)<.2).map(([,y])=>y)));
 const tassels=result.group.getObjectByName('Seven straw tassels').geometry.attributes.position;
 const tasselLower=[],upper=[];for(let i=0;i<tassels.count;i++){const y=tassels.getY(i);if(y<2.82)tasselLower.push(tassels.getX(i));if(y>3.28)upper.push(tassels.getX(i));}
 assert.ok(Math.max(...tasselLower)-Math.min(...tasselLower)>Math.max(...upper)-Math.min(...upper)+.1);
 const wood=result.group.getObjectByName('Dark timber lattice').material;assert.equal(wood.map,null);assert.equal(wood.normalMap,f.materials.vermilionMat.normalMap);assert.ok(f.materials.vermilionMat.map);
 assert.equal(refineIchinomine(f.object,f.materials,{createCanvas:()=>c}),result);
 assert.equal(refineIchinomine(fixture('ninomine').object,{}, {createCanvas:()=>canvas()}),null);
 const missing=fixture();missing.original.geometry=new THREE.PlaneGeometry(3,1);assert.equal(refineIchinomine(missing.object,{}, {createCanvas:()=>canvas()}),null);
});
test('dispose restores original curtain and does not dispose shared sources',()=>{
 const f=fixture(),geometry=f.original.geometry,material=f.original.material,texture=material.map;let sourceDisposals=0;
 for(const item of [geometry,material,texture,f.materials.vermilionMat,f.materials.vermilionMat.map,f.materials.vermilionMat.normalMap])item.addEventListener('dispose',()=>sourceDisposals++);
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()}),owned=[];
 result.group.traverse(o=>{if(o.isMesh){owned.push(o.geometry,o.material);}});owned.push(f.original.geometry,f.original.material,f.original.material.map);
 let count=0;for(const item of new Set(owned))item.addEventListener('dispose',()=>count++);
 result.dispose();result.dispose();assert.equal(f.original.geometry,geometry);assert.equal(f.original.material,material);assert.equal(sourceDisposals,0);
 assert.equal(count,new Set(owned).size);assert.equal(result.group.parent,null);
});

test('only the matched summit lantern pair and six treads receive reversible stone finishes',()=>{
 const f=fixture(),compound=new THREE.Group();f.object.add(compound);
 const material=()=>new THREE.MeshStandardMaterial(),dims=[[.62,.45,.62],[.22,1.65,.22],[.68,.14,.68],[.48,.52,.48],[.36,.40,.36],[.86,.24,.86]];
 const lamps=[-1,1].map(side=>{const group=new THREE.Group();group.position.set(side*3.75,0,2.45);for(const d of dims)group.add(new THREE.Mesh(new THREE.BoxGeometry(...d),material()));group.add(new THREE.Mesh(new THREE.ConeGeometry(.10,.22,8),material()));compound.add(group);return group;});
 const steps=Array.from({length:6},()=>{const m=new THREE.Mesh(new THREE.BoxGeometry(4.8,.17,.40),material());compound.add(m);return m;});
 const original=lamps.map(l=>l.children.map(m=>({geometry:m.geometry,material:m.material}))),oldSteps=steps.map(m=>({geometry:m.geometry,material:m.material}));
 f.materials.entryStoneMat=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture()});
 let sharedDisposed=0;for(const v of [f.materials.entryStoneMat,f.materials.entryStoneMat.map,f.materials.entryStoneMat.normalMap])v.addEventListener('dispose',()=>sharedDisposed++);
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()});
 assert.equal(result.stats.lanterns,2);assert.equal(result.stats.stairs,6);assert.equal(lamps[0].children[3].geometry,lamps[1].children[3].geometry);
 assert.notEqual(lamps[0].children[3].geometry,original[0][3].geometry);assert.equal(lamps[0].children[4].material,original[0][4].material);
 assert.equal(lamps[0].children[1].material,lamps[1].children[1].material);assert.equal(steps[0].material.map,f.materials.entryStoneMat.map);
 const g=steps[0].geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;assert.notEqual(g,oldSteps[0].geometry);
 for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));const u=ny>=nx&&ny>=nz?p.getX(i):nx>=ny&&nx>=nz?p.getZ(i):p.getX(i);const v=ny>=nx&&ny>=nz?p.getZ(i):p.getY(i);assert.ok(Math.abs(uv.getX(i)-u*4)<1e-5&&Math.abs(uv.getY(i)-v*4)<1e-5);}
 let disposedSteps=0;for(const step of steps)step.geometry.addEventListener('dispose',()=>disposedSteps++);
 result.dispose();assert.equal(disposedSteps,6);for(let l=0;l<2;l++)for(let i=0;i<7;i++){assert.equal(lamps[l].children[i].geometry,original[l][i].geometry);assert.equal(lamps[l].children[i].material,original[l][i].material);}
 steps.forEach((s,i)=>{assert.equal(s.material,oldSteps[i].material);assert.equal(s.geometry,oldSteps[i].geometry);});assert.equal(sharedDisposed,0);
});

test('photographed low stone side returns leave the stair and frontage open and share existing granite maps',()=>{
 const f=fixture(),source=new THREE.MeshStandardMaterial({map:new THREE.Texture(),normalMap:new THREE.Texture()});f.materials.entryStoneMat=source;
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()});
 assert.equal(result.stats.stoneBoundary.segments,4);assert.equal(result.stats.stoneBoundary.draws,1);assert.equal(result.stats.stoneBoundary.newTextures,0);
 assert.ok(result.stats.stoneBoundary.triangles<5500);assert.ok(result.stats.stoneBoundary.blocks>=60);assert.equal(result.stats.stoneBoundary.posts,6);
 const walls=result.group.getObjectByName('Ichinomine low granite side returns');assert.ok(walls);assert.equal(walls.material.map,source.map);assert.equal(walls.material.normalMap,source.normalMap);
 walls.geometry.computeBoundingBox();const bounds=walls.geometry.boundingBox;assert.ok(bounds.min.x>=-5.71&&bounds.max.x<=5.71);assert.ok(bounds.min.z> -2.5&&bounds.max.z<=1.60,'front return overhangs its existing raised terrace');
 const colliders=result.getColliders();assert.equal(colliders.length,4);
 const inside=(c,x,z)=>{const a=c.args,dx=x-a[0],dz=z-a[1],cs=Math.cos(a[4]),sn=Math.sin(a[4]);return Math.abs(dx*cs-dz*sn)<a[2]&&Math.abs(dx*sn+dz*cs)<a[3];};
 for(let x=-3.3;x<=3.3;x+=.15)for(let z=-3.5;z<=5;z+=.25)assert.equal(colliders.some(c=>inside(c,x,z)),false,`central access blocked at ${x},${z}`);
 assert.equal(colliders.some(c=>inside(c,5.46,-1.4)),true);assert.equal(colliders.some(c=>inside(c,-5.46,-1.4)),true);
 assert.equal(colliders.some(c=>inside(c,6.3,-1.4)),false);assert.equal(colliders.some(c=>inside(c,-6.3,-1.4)),false);
 walls.updateWorldMatrix(true,false);const vertices=walls.geometry.attributes.position,point=new THREE.Vector3();
 for(let i=0;i<vertices.count;i++){
  point.fromBufferAttribute(vertices,i).applyMatrix4(walls.matrixWorld);
  assert.ok(colliders.some(c=>{const a=c.args;return Math.abs(point.x-a[0])<=a[2]+1e-6&&Math.abs(point.z-a[1])<=a[3]+1e-6&&point.y>=a[5]-1e-6&&point.y<=a[6]+1e-6;}),'rendered stone has no physical owner');
 }
 let shared=0;for(const value of [source,source.map,source.normalMap])value.addEventListener('dispose',()=>shared++);result.dispose();result.dispose();assert.equal(shared,0);
});

test('stone return collisions follow the same transformed owner and stay within rendered post height',()=>{
 const f=fixture();f.materials.entryStoneMat=new THREE.MeshStandardMaterial({map:new THREE.Texture()});
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()}),before=result.getColliders();
 f.object.position.set(120,30,-70);f.object.rotation.y=.73;f.object.scale.setScalar(1.4);
 const after=result.getColliders(),point=new THREE.Vector3();
 f.object.updateWorldMatrix(true,true);
 for(let i=0;i<before.length;i++){
  const a=before[i].args,b=after[i].args;point.set(a[0],a[5],a[1]).applyMatrix4(f.object.matrixWorld);
  assert.ok(Math.abs(b[0]-point.x)<1e-7&&Math.abs(b[1]-point.z)<1e-7&&Math.abs(b[5]-point.y)<1e-7);
  assert.ok(Math.abs(b[2]-a[2]*1.4)<1e-7&&Math.abs(b[3]-a[3]*1.4)<1e-7);assert.ok(Math.abs(b[4]-.73)<1e-7);
  assert.ok(Math.abs(b[6]-b[5]-1.48*1.4)<1e-7);assert.equal(b.at(-1),'ichinomine_stone_boundary');
 }
});

function addLegacyOrnaments(f){
 const gold=new THREE.MeshStandardMaterial({metalness:.88}),texture=new THREE.Texture();
 const plaque=new THREE.Mesh(new THREE.BoxGeometry(.62,1.12,.12),new THREE.MeshStandardMaterial({map:texture}));plaque.position.set(0,3.43,1.872);plaque.rotation.x=.10;
 const bands=[];for(const x of [-2.288,2.288])for(const z of [-1.512,1.512]){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.175,.175,.12,14),gold);mesh.position.set(x,3.07,z);bands.push(mesh);}
 f.canopy.add(plaque,...bands);return {plaque,bands,texture,gold};
}
test('only canonical summit plaque and pillar collars disappear from the photographed open frontage',()=>{
 const f=fixture(),ornaments=addLegacyOrnaments(f);
 const neighborPlaque=ornaments.plaque.clone();neighborPlaque.position.x=.12;
 const neighborBand=ornaments.bands[0].clone();neighborBand.position.z+=.12;
 const differentBand=new THREE.Mesh(new THREE.CylinderGeometry(.175,.175,.13,14),ornaments.gold);differentBand.position.copy(ornaments.bands[0].position);
 const nested=new THREE.Group(),nestedPlaque=ornaments.plaque.clone();nested.add(nestedPlaque);f.canopy.add(neighborPlaque,neighborBand,differentBand,nested);
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()});
 assert.equal(ornaments.plaque.parent===null,true);for(const band of ornaments.bands)assert.equal(band.parent===null,true);
 assert.deepEqual(result.stats.referenceCorrections,{plaque:1,goldBands:4});
 for(const mesh of [neighborPlaque,neighborBand,differentBand,nested])assert.equal(mesh.parent===f.canopy,true);assert.equal(nestedPlaque.parent===nested,true);
 for(const zone of ['ninomine','sannomine']){const other=fixture(zone),trim=addLegacyOrnaments(other);assert.equal(refineIchinomine(other.object,other.materials,{createCanvas:()=>canvas()}),null);for(const mesh of [trim.plaque,...trim.bands])assert.equal(mesh.parent===other.canopy,true);}
});
test('disposing reference correction restores original sibling order without releasing borrowed trim or texture',()=>{
 const f=fixture(),ornaments=addLegacyOrnaments(f),original=[...f.canopy.children],sources=new Set([ornaments.texture,ornaments.gold]);
 for(const mesh of [ornaments.plaque,...ornaments.bands]){sources.add(mesh.geometry);sources.add(mesh.material);}
 let disposals=0;for(const source of sources)source.addEventListener('dispose',()=>disposals++);
 const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>canvas()});result.dispose();result.dispose();
 assert.deepEqual(f.canopy.children.map(mesh=>mesh.uuid),original.map(mesh=>mesh.uuid));assert.equal(disposals,0);assert.equal(ornaments.plaque.material.map===ornaments.texture,true);
});
