import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {appendUpperCafeFront} from './upper-cafe-fronts.mjs';
import {createMappedBuildingFinishes} from './mapped-building-finishes.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const byId=id=>features.buildings.find(b=>b.id===id);
const cases=[['way/626313740','way/626313736','tsujitei'],['way/626313752','way/626313751','okamoto']];
test('upper cafe details attach only to mapped source edges and fail closed without shrine identity',()=>{
 for(const [id,shrine,kind] of cases){
  const building=byId(id),ring=building.points.slice(0,-1),triangles=[];
  const options={building,buildings:features.buildings,ring,base:200,roof:206,append:(kind,p)=>triangles.push({kind,p})};
  const result=appendUpperCafeFront(options);assert.equal(result.id,id);assert.equal(result.kind,kind);assert.equal(result.shrine,shrine);
  assert.ok(triangles.length>100);const a=ring[result.edge],b=ring[(result.edge+1)%ring.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  for(const {p} of triangles){const along=((p[0]-a[0])*dx+(p[2]-a[2])*dz)/length,offset=Math.abs((p[0]-a[0])*dz-(p[2]-a[2])*dx)/length;assert.ok(along>=-.001&&along<=length+.001);assert.ok(offset<.05);assert.ok(p[1]>=200&&p[1]<203);}
  assert.equal(appendUpperCafeFront({...options,buildings:[building]}),null);
 }
});
test('mapped finish integrates both photographed shops in bounded batches without changing inputs',()=>{
 const buildings=cases.flatMap(([id,shrine])=>[byId(id),byId(shrine)]),before=JSON.stringify(buildings);
 const segments=cases.map(([id])=>{const [a,b]=byId(id).points;return {a,b,kind:'stone'};});
 const result=createMappedBuildingFinishes({buildings,segments,ground:()=>200,maxDistance:24,maxBuildings:10});
 const records=result.stats.records.filter(r=>r.upperCafe);assert.equal(records.length,2);assert.equal(result.stats.extraLights,0);assert.ok(result.stats.batches<=12);assert.equal(JSON.stringify(buildings),before);
 result.dispose();result.dispose();
});

test('real mapped upper cafes receive priority within the existing route and cell budgets',()=>{
 const segments=features.paths.flatMap(path=>path.points.slice(1).map((b,i)=>({a:path.points[i],b})));
 const ids=cases.map(([id])=>id),make=options=>createMappedBuildingFinishes({buildings:features.buildings,segments,ground:()=>200,...options});
 const result=make({});
 for(const id of ids)assert.ok(result.detailedIds.has(id),`${id} not selected`);
 assert.ok(result.stats.buildings<=64);
 const cells=new Map();for(const record of result.stats.records){const b=record.bounds,key=`${Math.floor((b[0]+b[2])/2/256)},${Math.floor((b[1]+b[3])/2/256)}`;cells.set(key,(cells.get(key)??0)+1);}
 for(const count of cells.values())assert.ok(count<=8);
 result.dispose();
 const excluded=make({excludesBuilding:b=>ids.includes(b.id)});
 for(const id of ids)assert.equal(excluded.detailedIds.has(id),false);
 assert.equal(excluded.stats.records.some(record=>record.upperCafe),false);excluded.dispose();
 const distant=make({segments:[],maxDistance:24});for(const id of ids)assert.equal(distant.detailedIds.has(id),false);assert.equal(distant.group.children.length,0);distant.dispose();
});

 test('referenced low eaves use inferred heights only when source height and levels are absent',()=>{
 const cafe=byId('way/626313740'),shrine=byId('way/626313736'),segments=[{a:cafe.points[0],b:cafe.points[1]}];
 for(const [tags,height,source] of [[{},3.1,'inferred'],[{height:'4.2'},4.2,'height'],[{'building:levels':'2'},6,'levels']]){
  const building={...cafe,tags:{...cafe.tags,...tags}},result=createMappedBuildingFinishes({buildings:[building,shrine],segments,ground:()=>200});
  const record=result.stats.records.find(r=>r.id===cafe.id);assert.equal(record.height,height);assert.equal(record.heightSource,source);result.dispose();
 }
});

test('real summit slopes support each shopfront at the high point of its facing edge',async()=>{
 const {heightAt}=await import('../geography/geo-core.mjs');
 const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
 const ground=(x,z)=>heightAt(terrain,x,z),buildings=cases.flatMap(([id,shrine])=>[byId(id),byId(shrine)]);
 const segments=cases.map(([id])=>{const [a,b]=byId(id).points;return {a,b};});
 const result=createMappedBuildingFinishes({buildings,segments,ground});
 for(const [id,,kind] of cases){
  const record=result.stats.records.find(r=>r.id===id),b=byId(id),a=b.points[record.upperCafe.edge],c=b.points[record.upperCafe.edge+1];
  const grades=Array.from({length:5},(_,i)=>ground(a[0]+(c[0]-a[0])*i/4,a[2]+(c[2]-a[2])*i/4));
  assert.ok(Math.abs(record.upperCafe.frontFloor-Math.max(...grades))<1e-9);
  assert.ok(record.upperCafe.frontFloor-record.base>1.5,`${id} fixture did not exercise slope`);
  assert.ok(Math.abs(record.roof-record.upperCafe.frontFloor-(kind==='tsujitei'?3.1:3.3))<1e-9);
 }
 result.dispose();
});

test('Tsujitei has narrow cloth panels with per-panel UVs and observed vertical name',()=>{
 const texts=[],old=globalThis.document;globalThis.document={createElement(){return {width:0,height:0,getContext(){return {createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){},fillText(text){texts.push(text);},set fillStyle(v){},set textAlign(v){},set textBaseline(v){},set font(v){}};}};}};
 try{
  const cafe=byId('way/626313740'),shrine=byId('way/626313736'),parts=[];
  const detail=appendUpperCafeFront({building:cafe,buildings:[cafe,shrine],ring:cafe.points.slice(0,-1),base:200,roof:204,append:(kind,p,uv)=>{if(kind==='cloth')parts.push({p,uv});}});
  assert.equal(parts.length,Math.ceil(detail.facadeWidth)*6);assert.ok(parts.every(v=>v.uv.every(c=>c>=0&&c<=1)));
  const result=createMappedBuildingFinishes({buildings:[cafe,shrine],segments:[{a:cafe.points[0],b:cafe.points[1]}],ground:()=>200});
  assert.deepEqual(texts,['辻','亭']);assert.ok(result.stats.textureBytes>0);result.dispose();
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
