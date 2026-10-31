import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {coarseFoliageCards} from './foliage-card-lod.mjs';

function source(){
 const cards=Array.from({length:26},(_,i)=>{
  const g=new THREE.PlaneGeometry(2,3,3,3);g.rotateY(i*2.4);g.translate(i*.1,i*.04,Math.sin(i));return g;
 });
 return mergeGeometries(cards);
}

test('middle crowns retain every authored card, corner UV and normal while reducing curved geometry',()=>{
 const full=source(),before=Array.from(full.attributes.position.array),middle=coarseFoliageCards(full);
 assert.ok(middle);assert.equal(middle.index.count/3,26*8);assert.equal(full.index.count/3,26*18);
 assert.equal(middle.attributes.position.count,26*9);
 for(let card=0;card<26;card++)for(const [corner,index]of [0,3,12,15].entries()){
  for(const name of ['position','normal','uv'])for(let component=0;component<full.attributes[name].itemSize;component++){
   assert.equal(middle.attributes[name].getComponent(card*9+[0,2,6,8][corner],component),full.attributes[name].getComponent(card*16+index,component));
  }
 }
 full.computeBoundingBox();full.computeBoundingSphere();
 assert.deepEqual(middle.boundingBox,full.boundingBox);assert.deepEqual(middle.boundingSphere,full.boundingSphere);
 for(let card=0;card<26;card++){
  const p=middle.attributes.position,a=new THREE.Vector3().fromBufferAttribute(p,card*9),b=new THREE.Vector3().fromBufferAttribute(p,card*9+3),c=new THREE.Vector3().fromBufferAttribute(p,card*9+1);
  const normal=b.sub(a).cross(c.sub(a)).normalize(),expected=new THREE.Vector3().fromBufferAttribute(middle.attributes.normal,card*9);
  assert.ok(normal.dot(expected)>.99,'coarse triangles keep the original winding');
 }
 middle.attributes.position.setX(0,999);assert.deepEqual(Array.from(full.attributes.position.array),before,'coarse buffers do not alias source data');
});

test('unknown, partial, malformed and degenerate sources keep their existing LOD rather than guessing',()=>{
 assert.equal(coarseFoliageCards(new THREE.BoxGeometry()),null);
 assert.equal(coarseFoliageCards(new THREE.PlaneGeometry(2,3,2,2)),null);
 const malformed=source();malformed.index.setX(5,15);assert.equal(coarseFoliageCards(malformed),null);
 const partial=source();partial.setDrawRange(3,12);assert.equal(coarseFoliageCards(partial),null);
 const invalid=source();invalid.attributes.position.setX(0,NaN);assert.equal(coarseFoliageCards(invalid),null);
 const flat=source();flat.attributes.position.array.fill(0);assert.equal(coarseFoliageCards(flat),null);
});
