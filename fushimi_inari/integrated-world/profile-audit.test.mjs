import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heightAt} from '../geography/geo-core.mjs';
import {mappedTreads} from './stair-profile.mjs';

test('both real paths falsely rejected by sampling retain their mapped totals',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
  for(const [id,count] of [['way/439990448',15],['way/1276691447',7]]){
    const path=features.paths.find(p=>p.id===id);
    const treads=mappedTreads(path.points,(x,z)=>heightAt(terrain,x,z),count);
    assert.equal(treads?.length,count,id);
    assert.ok(treads.every(t=>t.rise<=.24&&Math.hypot(t.b[0]-t.a[0],t.b[2]-t.a[2])>=.18),id);
  }
});
