import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera} from 'three';
import {createPrewarmFrameBudget} from './prewarm-frame-budget.mjs';
test('idle preparation gets headroom while movement and a drained queue render immediately',()=>{
 const camera=new PerspectiveCamera(),budget=createPrewarmFrameBudget();
 assert.equal(budget.shouldRender(0,camera,true),true);assert.equal(budget.shouldRender(6,camera,true),true);
 assert.equal(budget.shouldRender(400,camera,true),true);assert.equal(budget.shouldRender(406,camera,true),false);assert.equal(budget.shouldRender(417,camera,true),true);
 camera.rotation.y=.01;assert.equal(budget.shouldRender(423,camera,true),true);assert.equal(budget.shouldRender(429,camera,true),true);
 assert.equal(budget.shouldRender(800,camera,true),true);assert.equal(budget.shouldRender(806,camera,false),true);
 camera.position.x+=.01;assert.equal(budget.shouldRender(807,camera,true),true);
});
