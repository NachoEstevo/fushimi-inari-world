import test from 'node:test';
import assert from 'node:assert/strict';
import {SpatialCollisionWorld} from './collision.mjs';
test('rotated collision boxes use Three.js Y rotation, not the opposite XZ convention',()=>{
  const world=new SpatialCollisionWorld(4);
  world.addBox(0,0,2,.5,Math.PI/4,0,3,'rotated shrine');
  const inside=world.resolvePlayer(1.2,1.7,-1.2);
  assert.ok(Math.hypot(inside.x-1.2,inside.z+1.2)>.1);
  assert.deepEqual(world.resolvePlayer(1.2,1.7,1.2),{x:1.2,z:1.2});
});
test('torii keep the central passage clear and prevent crossing a column',()=>{
  const world=new SpatialCollisionWorld(4);
  world.addCylinder(-.992,0,.09,0,3);
  world.addCylinder(.992,0,.09,0,3);
  assert.deepEqual(world.resolvePlayer(0,1.7,0),{x:0,z:0});
  assert.ok(world.resolvePlayer(.9,1.7,0).x<.7);
});
