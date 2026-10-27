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
function canvas(){const texts=[];return {width:0,height:0,texts,getContext(){return {fillRect(){},beginPath(){},arc(){},stroke(){},fillText(t){texts.push(t);},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set font(v){},set textAlign(v){},set textBaseline(v){}};}};}
test('summit-only signature yields split curtain, seven tassels and bounded detail batches',()=>{
 const f=fixture(),c=canvas();const result=refineIchinomine(f.object,f.materials,{createCanvas:()=>c});
 assert.ok(result);assert.deepEqual(result.stats,{crests:2,tassels:7,extraBatches:4,lanterns:0,stairs:0});assert.ok(c.texts.includes('神大廣末'));assert.equal(c.width,1024);assert.equal(c.height,256);
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
 for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));const u=ny>=nx&&ny>=nz?p.getX(i):nx>=ny&&nx>=nz?p.getZ(i):p.getX(i);const v=ny>=nx&&ny>=nz?p.getZ(i):p.getY(i);assert.ok(Math.abs(uv.getX(i)-u)<1e-5&&Math.abs(uv.getY(i)-v)<1e-5);}
 let disposedSteps=0;for(const step of steps)step.geometry.addEventListener('dispose',()=>disposedSteps++);
 result.dispose();assert.equal(disposedSteps,6);for(let l=0;l<2;l++)for(let i=0;i<7;i++){assert.equal(lamps[l].children[i].geometry,original[l][i].geometry);assert.equal(lamps[l].children[i].material,original[l][i].material);}
 steps.forEach((s,i)=>{assert.equal(s.material,oldSteps[i].material);assert.equal(s.geometry,oldSteps[i].geometry);});assert.equal(sharedDisposed,0);
});
