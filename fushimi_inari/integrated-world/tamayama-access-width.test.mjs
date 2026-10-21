import test from 'node:test';
import assert from 'node:assert/strict';
import {tamayamaAccessFeatures} from './tamayama-access-width.mjs';
test('photo width affects only connected western approach without changing source or elevations',()=>{
  const paths=['105449693','1133055112','1133055111','649175020','626313768'].map(id=>({id:'way/'+id,tags:{width:'2'},points:[[1,3,2],[2,4,2]],nodeIds:[1,2]}));
  const source={paths};const result=tamayamaAccessFeatures(source);
  result.paths.forEach((p,i)=>{assert.equal(p.tags.width,i<4?'4.8':'2');assert.equal(p.points,paths[i].points);assert.equal(p.nodeIds,paths[i].nodeIds);assert.equal(paths[i].tags.width,'2');});
  assert.equal(result.paths[4],paths[4]);
});
