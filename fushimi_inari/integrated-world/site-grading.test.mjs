import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {yotsuGrade} from './site-grading.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
test('forecourt is locally graded without flattening the north or west stair flights',()=>{
  assert.equal(yotsuGrade(799,-216,168),163.9);
  assert.equal(yotsuGrade(810,-240,172),172);
  assert.equal(yotsuGrade(780,-213,158),158);
});
test('Yotsutsuji approaches retain mapped counts and positive, walkable rises',()=>{
  const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
  const terrain=JSON.parse(fs.readFileSync(new URL('../geography/terrain.json',import.meta.url)));
  const ids=['way/1052553392','way/1052553397','way/1372826379'];
  const network=makePathSurfaces({paths:features.paths.filter(p=>ids.includes(p.id))},(x,z)=>yotsuGrade(x,z,heightAt(terrain,x,z)));
  for(const [id,count] of [[ids[0],10],[ids[1],25],[ids[2],60]]){
    const steps=network.segments.filter(s=>s.id===id);
    assert.equal(steps.length,count);
    assert.ok(steps.every(s=>s.rise>.05&&s.rise<.24),id);
  }
});
