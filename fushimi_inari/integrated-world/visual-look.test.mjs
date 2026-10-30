import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeVisualLook,LOOK_BLOOM} from './visual-look.mjs';

test('old creative selections remain valid while the public look has a simple canonical identity',()=>{
 assert.equal(normalizeVisualLook('dreamcore'),'soft-light');
 for(const name of ['natural','sakura','soft-light','aozora'])assert.equal(normalizeVisualLook(name),name);
 for(const value of [null,undefined,{},'unknown','__proto__'])assert.equal(normalizeVisualLook(value),'natural');
 const soft=LOOK_BLOOM['soft-light'];assert.ok(soft.strength<.4);assert.ok(soft.threshold>=1,'ordinary painted surfaces do not all trigger bloom');
});
