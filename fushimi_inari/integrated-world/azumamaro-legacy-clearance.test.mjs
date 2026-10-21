import test from 'node:test';
import assert from 'node:assert/strict';
import {clearAzumamaroLegacySugi} from './azumamaro-legacy-clearance.mjs';

const mesh=positions=>({count:positions.length,instanceMatrix:{array:new Float32Array(positions.flatMap(([x,z])=>[1,0,0,0,0,1,0,0,0,0,1,0,x,0,z,1]))}});
test('removes only entrance sugi, paired crowns and matching blocker, preserving maple and woodland',()=>{
  const trunks=mesh([[3,6],[20,6],[2,7]]),crowns=mesh([[3,6],[3,6],[20,6],[20,6]]);
  const legacy={foliage:[trunks,crowns]};
  const features={paths:[{id:'way/105449706',points:[[0,0,30],[0,0,0]]}]};
  const cylinder=(x,z,tag)=>({type:'cylinder',args:[x,z,.4,0,12,tag]});
  const colliders=[cylinder(3,6,'tree'),cylinder(20,6,'tree'),cylinder(2,7,'tree'),cylinder(3,6,'azumamaro_pine_trunk')];
  assert.equal(clearAzumamaroLegacySugi(legacy,features,colliders),1);
  assert.equal(trunks.instanceMatrix.array[0],0);
  assert.equal(crowns.instanceMatrix.array[0],0);
  assert.equal(crowns.instanceMatrix.array[16],0);
  assert.equal(trunks.instanceMatrix.array[16],1);
  assert.equal(trunks.instanceMatrix.array[32],1);
  assert.equal(crowns.instanceMatrix.array[32],1);
  assert.deepEqual(colliders.map(c=>c.args.at(-1)),['tree','tree','azumamaro_pine_trunk']);
  assert.equal(clearAzumamaroLegacySugi(legacy,features,colliders),0);
});

test('photo-audited boundary includes the two nearest sugi and keeps the next woodland trunk',()=>{
  const positions=[[10.9376,31.4049],[30.6367,28.9405],[-3.16,33.97],[10.6596,31.5205]];
  const trunks=mesh(positions),crowns=mesh(positions.slice(0,3).flatMap(p=>[p,p]));
  const legacy={foliage:[trunks,crowns]};
  const features={paths:[{id:'way/105449706',points:[[15.28,43.56,37.882],[17.068,43.9,13.826]]}]};
  assert.equal(clearAzumamaroLegacySugi(legacy,features,[]),2);
  assert.equal(trunks.instanceMatrix.array[0],0);
  assert.equal(trunks.instanceMatrix.array[16],0);
  assert.equal(trunks.instanceMatrix.array[32],1);
  assert.equal(trunks.instanceMatrix.array[48],1);
});
