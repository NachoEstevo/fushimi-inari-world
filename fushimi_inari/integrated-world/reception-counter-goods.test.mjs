import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildReceptionCounterGoods} from './reception-counter-goods.mjs';
test('amulets rest on both reception terrace counters without entering the service opening',()=>{
 const host=new THREE.Group(),wood=new THREE.MeshStandardMaterial(),paper=new THREE.MeshStandardMaterial(),cloth=new THREE.MeshStandardMaterial();
 const stats=buildReceptionCounterGoods(host,{wood,paper,cloth,levels:{split:11.6,rise:1.4}});
 assert.ok(stats.pouches>0&&stats.tablets>0);assert.equal(stats.batches,3);assert.ok(stats.triangles<18000);
 let low=Infinity,high=Infinity;host.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);assert.ok(x>=.70&&x<29);assert.ok(!(x>1.4&&x<3.1&&z>11),'keep the service opening clear');if(x<11.6)low=Math.min(low,y);else high=Math.min(high,y);}});
 assert.ok(Math.abs(low-1.2575)<1e-5);assert.ok(Math.abs(high-2.6575)<1e-5);
 host.traverse(o=>o.geometry?.dispose());wood.dispose();paper.dispose();cloth.dispose();
});
