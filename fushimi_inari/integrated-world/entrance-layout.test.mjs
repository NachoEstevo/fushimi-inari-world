import test from 'node:test';
import assert from 'node:assert/strict';
import {separatedTemizuya,entryWallRuns,entryGardenTiers,westStairHeight} from './entrance-layout.mjs';
import {rotateXZ} from './spatial.mjs';

test('pavilion clears inherited corridor roof and retains mapped lateral offset',()=>{
  const r={source:[0,1.6,0],target:[-1.878,42.39,.995],yaw:-Math.PI/2+.06};
  const t={source:[-10.5,0,11.5],target:[-6.951,41.97,-14.338]};
  const moved=separatedTemizuya(r,t),old=rotateXZ(t.target[0]-r.target[0],t.target[2]-r.target[2],-r.yaw);
  const local=rotateXZ(moved[0]-r.target[0],moved[2]-r.target[2],-r.yaw);
  assert.ok(Math.abs(local[0]-old[0])<1e-9);
  assert.ok(local[1]-2.3-4.9>1.8);
  assert.equal(moved[1],r.target[1]-r.source[1]);
  assert.deepEqual(t.target,[-6.951,41.97,-14.338]);
});
test('terrace wall runs leave the central 9.2m stair and western 4m stair open',()=>{
  for(const [a,b]of entryWallRuns){assert.ok(b< -4.6||a>4.6);assert.ok(a> -20.1);}
});
test('west stairs meet forecourt and upper terrace without a podium-height jump',()=>{
  assert.equal(westStairHeight(-22,13.8),0);assert.equal(westStairHeight(-22,1.89),1.6);
  assert.equal(westStairHeight(-10,6),null);
  let previous=0;for(let z=13.8;z>=1.89;z-=.1){const y=westStairHeight(-22,z);assert.ok(y-previous<.014);previous=y;}
});

test('upper landing remains level beyond the mapped stair endpoint',()=>{
  for(let z=1.89;z>=-3.4;z-=.1)assert.equal(westStairHeight(-22,z),1.6);
  assert.equal(westStairHeight(-22,-3.41),null);
});

test('planted tiers are set back with a continuous retaining level',()=>{
  const [lower,upper]=entryGardenTiers;
  assert.equal(upper.base,lower.top);
  assert.ok(upper.front<lower.back);
  for(const tier of entryGardenTiers){assert.ok(tier.front>tier.back);assert.ok(tier.top>tier.base);}
});
