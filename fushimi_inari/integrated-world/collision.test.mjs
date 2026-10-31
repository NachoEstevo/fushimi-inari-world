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

// Original full box scan is a reference oracle for broadphase ordering.
class BruteForceCollisionWorld extends SpatialCollisionWorld {
      resolvePlayer(px, py, pz, playerRadius = 0.28) {
        let x = px, z = pz;
        const footY = py - 1.55;
        const headY = py + 0.15;

        for (let iter = 0; iter < 3; iter++) {
          const gcx = Math.floor(x / this.cellSize);
          const gcz = Math.floor(z / this.cellSize);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              const bucket = this.grid.get(this._key(gcx + dx, gcz + dz));
              if (!bucket) continue;
              for (let i = 0; i < bucket.length; i++) {
                const c = bucket[i];
                if (headY < c.yMin || footY > c.yMax) continue;
                const vx = x - c.x;
                const vz = z - c.z;
                const distSq = vx * vx + vz * vz;
                const minDist = playerRadius + c.r;
                if (distSq < minDist * minDist && distSq > 1e-8) {
                  const dist = Math.sqrt(distSq);
                  const push = (minDist - dist);
                  x += (vx / dist) * push;
                  z += (vz / dist) * push;
                }
              }
            }
          }

          for (let i = 0; i < this.boxes.length; i++) {
            const b = this.boxes[i];
            if (headY < b.yMin || footY > b.yMax) continue;
            const relX = x - b.cx;
            const relZ = z - b.cz;
            const lx = relX * b.cos - relZ * b.sin;
            const lz = relX * b.sin + relZ * b.cos;
            const clampX = Math.max(-b.halfW, Math.min(b.halfW, lx));
            const clampZ = Math.max(-b.halfD, Math.min(b.halfD, lz));
            const dx = lx - clampX;
            const dz = lz - clampZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < playerRadius * playerRadius) {
              let nLx = 0, nLz = 0;
              if (distSq > 1e-7) {
                const dist = Math.sqrt(distSq);
                const push = playerRadius - dist;
                nLx = lx + (dx / dist) * push;
                nLz = lz + (dz / dist) * push;
              } else {
                const penX = b.halfW - Math.abs(lx);
                const penZ = b.halfD - Math.abs(lz);
                if (penX < penZ) {
                  nLx = (lx >= 0 ? 1 : -1) * (b.halfW + playerRadius);
                  nLz = lz;
                } else {
                  nLx = lx;
                  nLz = (lz >= 0 ? 1 : -1) * (b.halfD + playerRadius);
                }
              }
              x = b.cx + nLx * b.cosF - nLz * b.sinF;
              z = b.cz + nLx * b.sinF + nLz * b.cosF;
            }
          }
        }
        return { x, z };
      }
}

test('box broadphase exactly matches ordered brute force for rotated and overlapping fixtures',()=>{
 let state=192837465;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const indexed=new SpatialCollisionWorld(4),brute=new BruteForceCollisionWorld(4);
 for(let i=0;i<500;i++){
  const args=[rand()*100-50,rand()*100-50,.1+rand()*5,.1+rand()*5,rand()*Math.PI*2,-2+rand()*3,2+rand()*4];
  indexed.addBox(...args);brute.addBox(...args);
 }
 // Large fallback and overlapping push chains, including exact cell edges.
 for(const args of [[0,0,300,1,.25,-5,5],[1000,1000,500,500,0,-5,5],[4,0,1,2,0,-5,5],[6,0,1,2,0,-5,5],[8,0,1,2,0,-5,5]]){
  indexed.addBox(...args);brute.addBox(...args);
 }
 for(let i=0;i<4000;i++){
  const args=i<4?[i*4,1.7,0,.28]:[rand()*120-60,rand()*8-2,rand()*120-60,rand()*2];
  assert.deepEqual(indexed.resolvePlayer(...args),brute.resolvePlayer(...args),`query ${i}`);
 }
});

test('a cylinder push into a box preserves the ordered brute-force result',()=>{
 const indexed=new SpatialCollisionWorld(4),brute=new BruteForceCollisionWorld(4);
 for(const world of [indexed,brute]){
  world.addCylinder(0,0,.4,0,3);world.addBox(1.1,0,.2,.5,0,0,3);
 }
 const actual=indexed.resolvePlayer(.3,1.7,0);
 assert.deepEqual(actual,brute.resolvePlayer(.3,1.7,0));
 assert.notEqual(actual.x,.3);assert.ok(actual.x<.68);
});
