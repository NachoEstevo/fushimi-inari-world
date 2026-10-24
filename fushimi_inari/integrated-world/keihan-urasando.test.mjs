import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {SpatialCollisionWorld} from './collision.mjs';
import {entranceNeighborhoodLayout} from './entrance-neighborhood-layout.mjs';
import {buildKeihanUrasando,keihanUrasandoLayout,URASANDO_TORII_SOURCES} from './keihan-urasando.mjs';
const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url))),terrain=JSON.parse(readFileSync(new URL('../geography/terrain.json',import.meta.url))),surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z));
const make=()=>{const root=new THREE.Group(),colliders=[],result=buildKeihanUrasando(root,features,surfaces,{},colliders),world=new SpatialCollisionWorld();for(const c of colliders)c.type==='box'?world.addBox(...c.args):world.addCylinder(...c.args);root.updateMatrixWorld(true);return {root,colliders,result,world};};

test('Urasando owns registered street rows through the stone torii, preserving specialized shrine owners',()=>{
 const {result:r}=make(),old=entranceNeighborhoodLayout(features);assert.equal(r.built,true);assert.equal(r.builtIds.length,14);assert.ok(r.builtIds.every(id=>old.records.some(b=>b.id===id)));assert.ok(!r.builtIds.includes('way/223276575'));assert.ok(!r.builtIds.includes('way/260121332'));assert.ok(!r.builtIds.includes('way/305213644'));assert.ok(!r.builtIds.includes('way/305214372'));
 for(const s of r.frontages)assert.deepEqual(s.points,features.buildings.find(b=>b.id===s.id).points.slice(0,-1));assert.deepEqual(r.frontages.filter(s=>s.name).map(s=>s.name),['Sando Chaya']);
});
test('corridor centre and player shoulder offsets stay clear in both directions through both torii',()=>{
 const {world}=make();let count=0;for(const s of surfaces.segments.filter(s=>['way/297888106','way/105449676'].includes(s.id))){const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz),steps=Math.ceil(length/.06);for(const offset of [-.5,-.25,0,.25,.5])for(let i=0;i<=steps;i++){const x=s.a[0]+dx*i/steps-dz/length*offset,z=s.a[2]+dz*i/steps+dx/length*offset,y=s.ya+(s.yb-s.ya)*i/steps,c=world.resolvePlayer(x,y+1.7,z);assert.ok(Math.hypot(c.x-x,c.z-z)<1e-7,'public route narrowed '+[x,z]);count++;}}assert.ok(count>10000);
});
test('Sando public recess has a real floor while closed shutter interiors remain unowned',()=>{
 const {root,result:r}=make(),layout=keihanUrasandoLayout(features,surfaces),tea=layout.frontages.find(s=>s.kind==='sando-chaya');for(const [u,v]of [[tea.width*.45,-.30],[tea.width*.42,-1.20]]){const [x,z]=tea.at(u,v),y=r.surfaceHeight(x,z);assert.ok(Number.isFinite(y));const hits=new THREE.Raycaster(new THREE.Vector3(x,y+.02,z),new THREE.Vector3(0,-1,0),0,.04).intersectObject(root,true);assert.ok(hits.some(h=>Math.abs(h.point.y-y)<1e-5));}
 for(const s of layout.frontages.filter(s=>s.kind==='shutter-row')){const [x,z]=s.at(s.width/2,-.3);assert.equal(r.surfaceHeight(x,z),null);}assert.equal(r.surfaceHeight(0,0),null);
});
test('mapped torii are emitted once, keep their exact axes, and have physical posts',()=>{
 const {result:r,world}=make();assert.equal(r.torii.length,2);assert.equal(r.torii.filter(t=>t.duplicateNode).length,1);for(let i=0;i<2;i++){assert.deepEqual(r.torii[i].a,URASANDO_TORII_SOURCES[i].a);assert.deepEqual(r.torii[i].b,URASANDO_TORII_SOURCES[i].b);for(const p of [r.torii[i].a,r.torii[i].b]){const c=world.resolvePlayer(p[0]+.01,r.torii[i].base+1.7,p[1]);assert.ok(Math.hypot(c.x-p[0]-.01,c.z-p[1])>.3);}}
});
test('rows stay within a fixed static budget and do not add seasonal festival decorations',()=>{
 const {root,result:r}=make();assert.equal(r.drawBatches,8);assert.ok(r.triangles<20000);assert.ok(r.collidersAdded<200);let lights=0;root.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});assert.equal(lights,0);assert.equal(root.getObjectByName('festival lantern strings'),undefined);
});
test('missing source fails closed and repeated calls do not duplicate shells or colliders',()=>{
 const {root,result:r,colliders}=make();assert.equal(buildKeihanUrasando(root,features,surfaces,{},colliders).group,r.group);assert.equal(root.children.length,1);assert.equal(colliders.length,r.collidersAdded);const empty=new THREE.Group(),bad=buildKeihanUrasando(empty,{...features,buildings:features.buildings.filter(b=>b.id!=='way/295577541')},surfaces);assert.equal(bad.built,false);assert.deepEqual(bad.builtIds,[]);assert.equal(empty.children.length,0);assert.equal(keihanUrasandoLayout(features,{height:()=>2}),null);
 const moved={...features,buildings:features.buildings.map(b=>b.id==='way/295577541'?{...b,points:b.points.map(p=>[p[0]+5,p[1],p[2]])}:b)};assert.equal(keihanUrasandoLayout(moved,surfaces),null,'changed photographic frontage registration must be reviewed');
});
