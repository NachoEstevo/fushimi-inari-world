import test from 'node:test';
import assert from 'node:assert/strict';
import {makeEntranceGroundMask,blendEntranceGround,makeAzumamaroCourtGrade,makeNorthCourtGrade} from './entrance-ground.mjs';
import fs from 'node:fs';
import {rotateXZ} from './spatial.mjs';
import {heightAt,pathWidth} from '../geography/geo-core.mjs';

const anchor={target:[0,0,0],source:[0,0,0],yaw:0};
const empty={paths:[],buildings:[],water:[]};
const ring=(x,z)=>({points:[[x-2,0,z-2],[x+2,0,z-2],[x+2,0,z+2],[x-2,0,z+2],[x-2,0,z-2]]});

test('north shop public apron follows mapped fronts and leaves rear land and stairs intact',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const grade=makeNorthCourtGrade({target:[0,42.382249,0]},features);
  for(const [x,z] of [[0,-28],[10,-28],[10,-24],[-10,-28]])assert.equal(grade(x,z,44),42.382249,`${x},${z}`);
  for(const [x,z] of [[0,-40],[10,-40],[-20,-28],[20,-28],[0,0],[800,-216],[-10,-21]])assert.equal(grade(x,z,44),44,`${x},${z}`);
  assert.equal(makeNorthCourtGrade(anchor,empty)(0,-28,44),44);
  const front=-30.424+(-30.891+30.424)*(10-7.325)/(13.009-7.325);
  assert.equal(grade(10,front-1,44),44);
  assert.equal(grade(10,front,44),42.382249);
  const midpoint=grade(10,front-.4,44);
  assert.ok(midpoint>42.382249&&midpoint<44);
});

test('service lane removes the artificial crest while retaining endpoint and bounded shoulders',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
  const raw=(x,z)=>heightAt(terrain,x,z),romon={target:[0,42.382249,0]};
  const grade=makeAzumamaroCourtGrade(romon,features,raw),court=makeAzumamaroCourtGrade(romon,features);
  const lane=features.paths.find(p=>p.id==='way/223276650'),a=lane.points[0],b=lane.points.at(-1);
  const len=Math.hypot(b[0]-a[0],b[2]-a[2]),tx=(b[0]-a[0])/len,tz=(b[2]-a[2])/len;
  let previous=romon.target[1];
  for(let i=0;i<=200;i++){
    const t=i/200,x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t,y=grade(x,z,raw(x,z));
    assert.ok(y>=previous-1e-9,'service lane must not crest and descend');
    assert.ok(y<=raw(b[0],b[2])+1e-9);
    assert.ok(y-previous<.025,'bounded inferred service grade');previous=y;
  }
  assert.ok(Math.abs(grade(b[0],b[2],raw(b[0],b[2]))-raw(b[0],b[2]))<1e-9);
  const x=(a[0]+b[0])/2,z=(a[2]+b[2])/2,offset=pathWidth(lane.tags)/2+2.1;
  const ox=x+tz*offset,oz=z-tx*offset;
  assert.equal(grade(ox,oz,raw(ox,oz)),court(ox,oz,raw(ox,oz)));
  const stairFeatures={...features,paths:[...features.paths,{id:'protected-stairs',tags:{highway:'steps',width:'2'},points:[[x-2,0,z],[x+2,0,z]]}]};
  assert.equal(makeAzumamaroCourtGrade(romon,stairFeatures,raw)(x,z,raw(x,z)),raw(x,z));
  for(const feature of features.buildings){
    const x=feature.points.reduce((s,p)=>s+p[0]/feature.points.length,0),z=feature.points.reduce((s,p)=>s+p[2]/feature.points.length,0);
    assert.equal(grade(x,z,raw(x,z)),court(x,z,raw(x,z)),feature.id);
  }
});

test('Azumamaro mineral shoulders join the canonical court without changing far terrain',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const grade=makeAzumamaroCourtGrade({target:[-1.878,42.382249,.995]},features);
  for(const [x,z] of [[21,18],[25,20],[28,28],[30,32],[35,25],[35,35],[25,45]])
    assert.equal(grade(x,z,45),42.382249,`${x},${z}`);
  for(const [x,z] of [[50,30],[25,65],[-20,10],[799,-216],[17,6]])
    assert.equal(grade(x,z,45),45,`${x},${z}`);
  const shoulder=grade(42,28,45);
  assert.ok(shoulder>42.382249&&shoulder<45);
});

test('mapped court release starts behind its enclosing buildings with continuous slopes',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const grade=makeAzumamaroCourtGrade({target:[0,42.382249,0]},features);
  const [b,a]=features.paths.find(p=>p.id==='way/105449706').points;
  const length=Math.hypot(b[0]-a[0],b[2]-a[2]),tx=(b[0]-a[0])/length,tz=(b[2]-a[2])/length;
  const project=p=>[(p[0]-a[0])*tx+(p[2]-a[2])*tz,(p[0]-a[0])*tz-(p[2]-a[2])*tx];
  const side=Math.min(...features.buildings.find(p=>p.id==='way/952815193').points.map(p=>project(p)[1]));
  const rear=Math.max(...features.buildings.find(p=>p.id==='way/305214824').points.map(p=>project(p)[0]));
  const sample=(along,lateral)=>grade(a[0]+along*tx+lateral*tz,a[2]+along*tz-lateral*tx,46);
  assert.equal(sample(12,side),42.382249);
  assert.equal(sample(rear,8),42.382249);
  for(const end of [side,side+8]){
    const h=.001,left=(sample(12,end)-sample(12,end-h))/h,right=(sample(12,end+h)-sample(12,end))/h;
    assert.ok(Math.abs(left-right)<.001);
  }
  for(const end of [rear,rear+12]){
    const h=.001,left=(sample(end,8)-sample(end-h,8))/h,right=(sample(end+h,8)-sample(end,8))/h;
    assert.ok(Math.abs(left-right)<.001);
  }
});

test('Azumamaro grading preserves mapped stairs and is inactive without its mapped approach',()=>{
  const approach={id:'way/105449706',points:[[0,0,24],[0,0,0]]};
  const grade=makeAzumamaroCourtGrade({target:[0,42,0]}, {paths:[approach,
    {tags:{highway:'steps',width:'2'},points:[[4,0,8],[10,0,8]]}]});
  assert.equal(grade(6,8,44),44);
  assert.equal(grade(6,12,44),42);
  assert.equal(makeAzumamaroCourtGrade(anchor,empty)(6,12,44),44);
});
test('localized mineral apron preserves the central court, gardens and distant terrain',()=>{
  const mask=makeEntranceGroundMask(anchor,empty);
  assert.equal(mask(40,0),1);assert.equal(mask(-40,0),1);
  assert.equal(mask(0,0),0);assert.equal(mask(10,4),0);
  assert.equal(mask(100,0),0);assert.equal(mask(40,60),0);
  assert.ok(mask(64,0)>0&&mask(64,0)<1);
});
test('mapped paths, building footprints and water remain excluded',()=>{
  const mask=makeEntranceGroundMask(anchor,{paths:[{tags:{width:'6'},points:[[25,0,0],[55,0,0]]}],buildings:[ring(40,12)],water:[ring(-40,12)]});
  assert.equal(mask(40,0),0);assert.equal(mask(40,3),0);
  assert.equal(mask(40,12),0);assert.equal(mask(-40,12),0);
  assert.equal(mask(40,-10),1);
});
test('apron follows the translated and rotated Romon frame',()=>{
  const romon={...anchor,target:[100,5,-80],yaw:1.2},mask=makeEntranceGroundMask(romon,empty);
  const [x,z]=rotateXZ(40,0,romon.yaw);
  assert.equal(mask(100+x,-80+z),1);assert.equal(mask(100,-80),0);
});
test('material extension retains the courtyard hook and cache identity',()=>{
  class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize;}getX(i){return this.array[i*this.itemSize];}getZ(i){return this.array[i*this.itemSize+2];}}
  const geometry={attributes:{position:new Attribute([40,0,0,0,0,0],3)},setAttribute(k,v){this.attributes[k]=v;}};
  const material={onBeforeCompile(s){
    s.uniforms.existing={value:1};
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat courtWeight=1.;');
    s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','vec3 untexturedNormal=normal;\n#include <normal_fragment_maps>\nnormal=normalize(mix(normal,untexturedNormal,courtWeight));');
  },customProgramCacheKey:()=> 'court'};
  blendEntranceGround(geometry,material,{map:'gravel'},anchor,empty);
  assert.deepEqual([...geometry.attributes.entranceGround.array],[1,0]);
  const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <color_fragment>\n#include <normal_fragment_maps>'};
  material.onBeforeCompile(shader);
  assert.equal(shader.uniforms.existing.value,1);assert.equal(shader.uniforms.entranceGravel.value,'gravel');
  assert.match(material.customProgramCacheKey(),/^court-entrance/);
  assert.equal(shader.fragmentShader.match(/#include <normal_fragment_maps>/g).length,1);
  assert.ok(shader.fragmentShader.indexOf('entranceBaseNormal=normal')<shader.fragmentShader.indexOf('#include <normal_fragment_maps>'));
  assert.ok(shader.fragmentShader.indexOf('entranceBaseNormal,entranceWeight')<shader.fragmentShader.indexOf('untexturedNormal,courtWeight'));
  assert.match(shader.fragmentShader,/mix\(diffuseColor.rgb,entranceMineral,entranceWeight\)/);
});
