import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {heightAt} from '../geography/geo-core.mjs';
import {appendIseya,iseyaId} from './iseya-frontage.mjs';
import {createMappedBuildingFinishes} from './mapped-building-finishes.mjs';
import {clearIseyaTerrace} from './pilgrimage-terraces.mjs';
import {refineMitsurugiStoneAndWell} from './mitsurugi-stone-and-well.mjs';
import {replaceSummitMarker} from './ichinomine-elevation-sign.mjs';
import {refineGozendani} from './gozendani-prayer-hall.mjs';

const json=file=>JSON.parse(readFileSync(new URL('../geography/'+file,import.meta.url)));
const features=json('features.json'),terrain=json('terrain.json'),ground=(x,z)=>heightAt(terrain,x,z);
const byId=id=>features.buildings.find(b=>b.id===id);
function box(w,h,d,x,y,z){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial());
  mesh.position.set(x,y,z);return mesh;
}

test('Iseya opens the long public side, seats its toe and uses the slope for one continuous roof',()=>{
  const building=byId(iseyaId),shrine=byId('way/626313742'),ring=building.points.slice(0,-1);
  const collect=r=>{
    const points=[],options={building,buildings:[building,shrine],ring:r,ground,append:(kind,p,uv)=>points.push({kind,p,uv})};
    return {detail:appendIseya(options),points};
  };
  const {detail,points}=collect(ring);
  assert.equal(detail.edge,4);assert.equal(detail.windowFaces,6);assert.ok(detail.facadeWidth>7.9);
  assert.ok(detail.roof-detail.base<8.86);assert.ok(detail.roof-detail.frontFloor>4.75);
  assert.equal(detail.sources.length,2);
  assert.deepEqual(collect([...ring].reverse()).detail.frontFloor,detail.frontFloor);
  assert.ok(points.every(v=>[...v.p,...v.uv].every(Number.isFinite)));
  const roof=points.filter(p=>p.kind==='roof');
  assert.ok(ring.every(p=>roof.some(v=>v.p[0]===p[0]&&v.p[2]===p[2]&&v.p[1]>detail.frontFloor+4.5)));
  assert.equal(appendIseya({building,buildings:[building],ring,ground,append:()=>assert.fail('unidentified site drew geometry')}),null);
});

test('five sourced cafes retain their single mapped owners within the selection budgets',()=>{
  const paths=features.paths.flatMap(p=>p.points.slice(1).map((b,i)=>({a:p.points[i],b})));
  const r=createMappedBuildingFinishes({buildings:features.buildings,segments:paths,ground});
  for(const [id,kind] of [[iseyaId,'iseya'],['way/301527776','santokutei'],['way/301527778','kyoya'],['way/626313740','tsujitei'],['way/626313752','okamoto']]){
    const records=r.stats.records.filter(v=>v.id===id);assert.equal(records.length,1);
    assert.equal(records[0].upperCafe.kind,kind);assert.ok(r.detailedIds.has(id));
    if(kind==='kyoya'||kind==='santokutei'){assert.equal(records[0].upperCafe.edge,3);assert.ok(records[0].windowFaces>0);}
  }
  assert.ok(r.stats.buildings<=64&&r.stats.materials<=8);assert.equal(r.stats.perFrameWork,false);
  const glass=r.group.children.find(o=>o.children.some(m=>m.material.name==='Mapped context glazing'));
  assert.ok(glass);assert.equal(glass.children[0].material.map,null);
  r.dispose();
});

test('only the actually overlapping legacy terrace loses its collider, pick and candle registrations',()=>{
  const root=new THREE.Group(),group=new THREE.Group(),slab=box(4.6,.55,3.2,0,.275,0),stone=box(.42,1.65,.22,0,1.675,-.25);
  stone.userData.interactable={title:'Ai-no-mine Otsuka (間ノ峰・おせき大神)'};
  const flame=new THREE.Object3D(),other=new THREE.Object3D();group.add(slab,stone,flame);root.add(group,other);
  const legacy={interactables:[stone,other],flickeringCandleMeshes:[other,flame]};
  const c={type:'box',args:[0,0,2.2,1.6,0,0,2.8,'wayside_otsuka']},colliders=[c];
  assert.equal(clearIseyaTerrace(root,features,legacy,colliders),null);
  group.position.set(935,194,-13);c.args[0]=935;c.args[1]=-13;
  const result=clearIseyaTerrace(root,features,legacy,colliders);
  assert.ok(result.overlapM2>1);assert.equal(group.parent,null);assert.deepEqual(colliders,[]);
  assert.deepEqual(legacy.interactables,[other]);assert.deepEqual(legacy.flickeringCandleMeshes,[other]);
  assert.equal(clearIseyaTerrace(root,features,legacy,colliders),null);
});

test('the Gozendani hall reuses its registered pick and aligns a single solid behind the public road',()=>{
  const root=new THREE.Group(),owner=new THREE.Group();owner.userData.zone='gozendani';owner.position.set(988.708,143,-265.114);root.add(owner);
  const hall=box(4.4,2.8,3.2,0,1.68,-.3),action=()=>17;hall.userData.interactable={onTrigger:action};
  const curtain=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.95)),candle=new THREE.Group(),flame=new THREE.Object3D();
  candle.position.set(1.85,.28,1.45);candle.add(flame);
  owner.add(hall,curtain,candle,box(5.6,.55,4.4,0,3.25,-.2),box(5.2,.55,4.2,0,.275,0));
  const materials={};for(const k of ['entryStoneMat','plasterMat','vermilionMat'])materials[k]=new THREE.MeshStandardMaterial();
  const legacy={materials,interactables:[hall],flickeringCandleMeshes:[flame]};
  const colliders=[{type:'box',args:[988.708,-265.114,2.5,2.2,0,143,146.6,'gozendani']}];
  const r=refineGozendani(root,features,{terrainHeight:ground},legacy,colliders);
  assert.ok(r.triangles>100&&r.triangles<3500);assert.ok(r.batches<=5);
  assert.equal(colliders.length,1);assert.equal(colliders[0].args[0],r.center[0]);assert.equal(colliders[0].args[4],owner.rotation.y);
  assert.equal(hall.parent,owner);assert.equal(hall.userData.interactable.onTrigger,action);
  assert.deepEqual(legacy.flickeringCandleMeshes,[]);assert.equal(curtain.parent,null);
  assert.equal(refineGozendani(root,features,{terrainHeight:ground},legacy,colliders),null);
});

test('sword stone has an uneven crown and the dedicated well is open below its pitched roof',()=>{
  const group=new THREE.Group(),base=box(1.4,.78,1.4,-3.8,1.41,.8),roof=box(2.2,.35,2.2,-3.8,3.17,.8);
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1.45,1),new THREE.MeshStandardMaterial());rock.position.x=3.2;
  group.add(base,roof,rock);const r=refineMitsurugiStoneAndWell(group);
  assert.ok(r.triangles<400);assert.equal(base.parent,null);assert.equal(roof.parent,null);
  assert.equal(rock.name,'Tsurugiishi rock');assert.equal(rock.parent,group);
  const well=group.getObjectByName('Mitsurugi well of the sword');well.updateWorldMatrix(true,true);
  assert.equal(new THREE.Raycaster(new THREE.Vector3(-3.8,well.position.y+.08,.8),new THREE.Vector3(0,-1,0)).intersectObject(well,true).length,0);
  assert.equal(refineMitsurugiStoneAndWell(group),null);
});

test('summit notice sits on the granite pedestal and the reversible replacement preserves unrelated markers',()=>{
  const compound=new THREE.Group(),canopy=new THREE.Group(),lantern=new THREE.Group();
  const base=box(.62,.45,.62,0,.225,0);lantern.position.set(-3.75,0,2.45);lantern.add(base);
  const post=box(.34,2.85,.34,-4.2,2.44,1.65),cap=new THREE.Mesh(new THREE.ConeGeometry(.28,.25,4));cap.position.set(-4.2,3.97,1.65);compound.add(canopy,lantern,post,cap);
  const text=[],canvas=()=>({getContext:()=>({fillRect(){},fillText(t){text.push(t);}})});
  const r=replaceSummitMarker(canopy,canvas);assert.ok(r);assert.equal(cap.parent,null);assert.equal(post.parent,null);
  assert.equal(base.children.length,1);assert.ok(text.includes('標高233m'));assert.equal(replaceSummitMarker(canopy,canvas),null);
  r.dispose();assert.equal(cap.parent,compound);assert.equal(post.parent,compound);assert.equal(base.children.length,0);
});
