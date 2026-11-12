import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkSettings,loadWalkSettings,saveWalkSettings,lookAngles,normalizeWalkSettings,DEFAULT_WALK_SETTINGS,WALK_SETTINGS_KEY,SENSITIVITY_MAX,prefersReducedMotion} from './walk-settings.mjs';
const memory=()=>{const data=new Map();return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))};};
test('settings round-trip through one namespaced storage key',()=>{
  const storage=memory(),settings=createWalkSettings({storage});
  assert.deepEqual(settings.snapshot(),{...DEFAULT_WALK_SETTINGS});
  let seen=null;settings.subscribe(v=>seen=v);settings.set({sensitivity:1.6,invertY:true,headBob:false});
  assert.deepEqual([...storage.data.keys()],[WALK_SETTINGS_KEY]);assert.equal(seen.invertY,true);
  assert.deepEqual(createWalkSettings({storage}).snapshot(),{sensitivity:1.6,invertY:true,headBob:false});
});
test('corrupted, hostile or unavailable storage falls back to defaults',()=>{
  for(const raw of ['{not json','null','[]','{"sensitivity":"x","invertY":"yes","headBob":1}'])assert.deepEqual(loadWalkSettings({getItem:()=>raw}),{...DEFAULT_WALK_SETTINGS});
  assert.deepEqual(loadWalkSettings({getItem(){throw Error('denied');}}),{...DEFAULT_WALK_SETTINGS});
  assert.equal(saveWalkSettings({sensitivity:2},{setItem(){throw Error('quota');}}),false);
  assert.deepEqual(loadWalkSettings(null),{...DEFAULT_WALK_SETTINGS});
  const s=createWalkSettings({storage:{getItem(){throw Error('x');},setItem(){throw Error('x');}}});assert.equal(s.set({headBob:false}).headBob,false);
  assert.equal(normalizeWalkSettings({sensitivity:99}).sensitivity,SENSITIVITY_MAX);
});
test('sensitivity scales look deltas and invert flips only the vertical axis',()=>{
  const out={yaw:0,pitch:0};
  lookAngles(10,-4,{sensitivity:1,invertY:false},out);assert.ok(Math.abs(out.yaw-.03)<1e-12);assert.ok(Math.abs(out.pitch+.012)<1e-12);
  lookAngles(10,-4,{sensitivity:2,invertY:true},out);assert.ok(Math.abs(out.yaw-.06)<1e-12);assert.ok(Math.abs(out.pitch-.024)<1e-12);
  assert.equal(lookAngles(NaN,undefined,null,out).yaw,0);
});
test('reduced-motion query is read safely',()=>{
  assert.equal(prefersReducedMotion({matchMedia:q=>({matches:q.includes('reduce')})}),true);
  assert.equal(prefersReducedMotion({}),false);assert.equal(prefersReducedMotion({matchMedia(){throw Error('x');}}),false);
});
