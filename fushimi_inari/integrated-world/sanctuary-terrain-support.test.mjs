import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sanctuaryTerrainSupport} from './sanctuary-terrain-support.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';

const segment={id:'way/105449728',a:[0,0,0],b:[10,0,0],ya:46,yb:47,width:2,stair:false,rise:0};
const network=segments=>({segments,terrainHeight:()=>40,height:()=>46});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('supports the existing wide apron wings while preserving network walking and geometry',()=>{
  const source=network([segment]),snapshot=JSON.stringify(source.segments),walking=source.height;
  const grade=sanctuaryTerrainSupport(source);
  for(const z of [0,1,1.8])near(grade(5,z),46.42);
  near((46.5-.035)-(grade(5,1.8)-.06),.105);
  assert.equal(JSON.stringify(source.segments),snapshot);assert.equal(source.height,walking);
  assert.equal(source.terrainHeight(5,1.8),40);
});

test('bounded support meets previous terrain continuously and leaves other routes untouched',()=>{
  const grade=sanctuaryTerrainSupport(network([segment]));
  assert.ok(Math.abs(grade(5,1.8-.0001)-grade(5,1.8+.0001))<1e-6);
  assert.ok(Math.abs(grade(5,3.3-.0001)-40)<1e-6);assert.equal(grade(5,3.3),40);
  for(const [x,z] of [[500,500],[5,4],[-4,0],[14,0]])assert.equal(grade(x,z),40);
  const source=network([{...segment,id:'way/1385037575'}]);
  assert.equal(sanctuaryTerrainSupport(source),source.terrainHeight);
});

test('mapped stairs and their risers retain previous terrain even across a supported route',()=>{
  const stair={...segment,id:'unrelated-stair',a:[5,0,-100],b:[5,0,100],width:2,stair:true,rise:.18};
  const grade=sanctuaryTerrainSupport(network([segment,stair]));
  assert.equal(grade(5,0),40);assert.equal(grade(6,0),40);
  near(grade(7,0),46.62);
  const source=network([{...segment,stair:true}]);
  assert.equal(sanctuaryTerrainSupport(source),source.terrainHeight);
});

test('actual Honden and Gonden approach identities receive local support without touching Okumiya',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const ids=['way/105449677','way/105449728','way/751194635','way/751194637','way/1106589423'];
  const paths=features.paths.filter(p=>ids.includes(p.id));assert.equal(paths.length,5);
  const source=makePathSurfaces({paths},()=>45),before=JSON.stringify(source.segments);
  const grade=sanctuaryTerrainSupport(source);
  for(const id of ids){
    const s=source.segments.find(s=>s.id===id),dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);
    const x=(s.a[0]+s.b[0])/2-dz/len*1.7,z=(s.a[2]+s.b[2])/2+dx/len*1.7;
    assert.ok(grade(x,z)>source.terrainHeight(x,z));near(grade(x,z),45.06);
  }
  assert.equal(JSON.stringify(source.segments),before);
  assert.equal(grade(117,-18),source.terrainHeight(117,-18));
});

test('Honden exterior crossing span and north access retain supported mapped curb widths',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const ids=['way/105449689','way/1213198208','way/1213198209'];
  const paths=features.paths.filter(p=>ids.includes(p.id));assert.equal(paths.length,3);
  const source=makePathSurfaces({paths},(x,z)=>45+x*.03),before=JSON.stringify(source.segments);
  const originalWalking=source.height(62.88,-16.11),grade=sanctuaryTerrainSupport(source);
  // The former hole sits between two supported apron mouths, on this actual
  // mapped exterior way. Its curb no longer spans unsupported ground there.
  const sample=source.sample(62.88,-16.11);
  assert.equal(sample.segment.id,'way/105449689');
  near(grade(62.88,-16.11),sample.height-.045);
  const s=source.segments.find(s=>s.id==='way/105449689'&&s.a[2]<-20&&s.b[2]>-20);
  const t=.5,x=(s.a[0]+s.b[0])/2,z=(s.a[2]+s.b[2])/2;
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz),offset=s.width/2+.13;
  near(grade(x-dz/len*offset,z+dx/len*offset),s.ya+(s.yb-s.ya)*t-.045);
  const stair=source.segments.find(s=>s.id==='way/1213198208');
  near(grade((stair.a[0]+stair.b[0])/2,(stair.a[2]+stair.b[2])/2),stair.ya-stair.rise-.045);
  assert.equal(source.height(62.88,-16.11),originalWalking);
  assert.equal(JSON.stringify(source.segments),before);
  assert.equal(grade(85,15),source.terrainHeight(85,15));
});
