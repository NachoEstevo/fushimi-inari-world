import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {buildOfficeGardenBanks,officeGardenPonds} from './office-garden-banks.mjs';
import {courtCuts} from './precinct-shrine-courts.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('mapped garden margins avoid water and buildings and preserve walking geometry',()=>{
 const root=new THREE.Group(),network={segments:[],terrainHeight:(x,z)=>46+x*.01+z*.002},sampler=network.terrainHeight;
 const r=buildOfficeGardenBanks(root,features,network);assert.deepEqual(r.ponds.map(p=>p.id),officeGardenPonds);assert.ok(r.area>15&&r.area<200);assert.ok(root.children[0].children.length<=2);
 const cuts=courtCuts(features,network,[69,86,-112,-62]),p=root.getObjectByName('Office pond planted margins').geometry.attributes.position;
 for(let i=0;i<p.count;i+=3){const tri=Array.from({length:3},(_,j)=>[p.getX(i+j),p.getZ(i+j)]);for(const cut of cuts)assert.ok(Math.abs(polygonArea(clipConvex(tri,cut)))<1e-5);}
 assert.equal(network.terrainHeight,sampler);assert.equal(buildOfficeGardenBanks(root,features,network),r);
});
test('missing mapped ponds creates no decorative substitute',()=>{const root=new THREE.Group();assert.equal(buildOfficeGardenBanks(root,{water:[]},{terrainHeight:()=>0}).area,0);assert.equal(root.children.length,0);});
