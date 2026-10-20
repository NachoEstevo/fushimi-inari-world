import test from 'node:test';
import assert from 'node:assert/strict';
import {roofHeight} from './roof-profile.mjs';

test('roof retains a central ridge and gently raised symmetric eaves',()=>{
  for(const rise of [.65,.94]){
    assert.equal(roofHeight(0,rise),rise);
    assert.ok(roofHeight(1,rise)>roofHeight(.9,rise));
    for(let i=0;i<=100;i++){
      const t=i/100,h=roofHeight(t,rise);
      assert.ok(Number.isFinite(h)&&h>0&&h<=rise);
      assert.equal(h,roofHeight(-t,rise));
    }
  }
});
