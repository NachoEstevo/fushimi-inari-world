import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clearRearPrecinctLegacyTrees} from './rear-precinct-tree-clearance.mjs';
const mesh=points=>({count:points.length,instanceMatrix:{array:new Float32Array(points.flatMap(([x,z])=>[1,0,0,0,0,1,0,0,0,0,1,0,x,0,z,1]))}});
const c=(x,z,r=.4,tag='tree')=>({type:'cylinder',args:[x,z,r,40,60,tag]});
const id='way/305214596',features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
test('actual assembled trunk anchors clear only interior/intersecting sugi and exact colliders',()=>{
 const points=[[69.4944076538086,27.331567764282227],[69.75086212158203,21.676860809326172],[70.20948791503906,21.008419036865234]],legacy={foliage:[mesh(points),mesh(points.slice(0,2).flatMap(p=>[p,p])),mesh([points[2]])]},colliders=[c(...points[0],.335225),c(...points[1],.520049),c(...points[2],.533323),c(...points[0],.3,'authored-tree')];
 const r=clearRearPrecinctLegacyTrees(legacy,features,colliders,[id]);assert.deepEqual(r.removed.map(p=>p.index),[0,1]);assert.equal(colliders.length,2);assert.equal(legacy.foliage[0].instanceMatrix.array[32],1);assert.equal(legacy.foliage[2].instanceMatrix.array[0],1);assert.equal(clearRearPrecinctLegacyTrees(legacy,features,colliders,[id]).count,0);
});
test('built ownership required; maple pairing supported; unmatched trunk remains',()=>{
 const points=[[69,27],[70,27],[71,27]],legacy={foliage:[mesh(points),mesh([points[0],points[0]]),mesh(points.slice(1))]},colliders=[c(70,27)];assert.equal(clearRearPrecinctLegacyTrees(legacy,features,colliders).count,0);assert.equal(clearRearPrecinctLegacyTrees(legacy,features,colliders,[id]).count,1);assert.equal(legacy.foliage[2].instanceMatrix.array[0],0);assert.equal(legacy.foliage[2].instanceMatrix.array[16],1);assert.equal(legacy.foliage[0].instanceMatrix.array[0],1);
});
