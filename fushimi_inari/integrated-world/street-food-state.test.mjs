import test from 'node:test';
import assert from 'node:assert/strict';
import {createStreetFoodOrder,STREET_FOOD_MENUS} from './street-food-state.mjs';
test('an order completes only after preparation and can be collected exactly once',()=>{
 const s=createStreetFoodOrder('soft-serve');assert.equal(s.order('missing'),false);assert.equal(s.collect(),null);
 assert.equal(s.order('matcha'),true);assert.equal(s.order('tofu'),false);assert.equal(s.collect(),null);
 s.update(2,{paused:true});assert.equal(s.phase,'preparing');
 for(let i=0;i<12;i++)s.update(.1);assert.equal(s.phase,'served');assert.equal(s.item.id,'matcha');
 assert.equal(s.collect().id,'matcha');assert.equal(s.collect(),null);assert.equal(s.phase,'ready');assert.equal(s.collected,1);
 assert.equal(s.order('tofu'),true);assert.equal(STREET_FOOD_MENUS['soft-serve'].length,2);
});
test('invalid time and a long tab stall cannot instantly prepare a snack',()=>{
 const s=createStreetFoodOrder('senbei');s.order('fox-senbei');for(const dt of [-1,NaN,Infinity])s.update(dt);assert.equal(s.elapsed,0);
 s.update(60);assert.equal(s.phase,'preparing');assert.equal(s.elapsed,.1);assert.equal(createStreetFoodOrder('unknown').order('fox-senbei'),false);
});
