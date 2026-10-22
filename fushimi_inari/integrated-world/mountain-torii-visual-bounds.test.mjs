import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {toriiVisualBoundsCorners} from './mountain-torii.mjs';

test('gate visual bounds include full kasagi/end tips at actual station scale and yaw',()=>{
  const bounds=new THREE.Box3(new THREE.Vector3(-2.112567,0,-.144),new THREE.Vector3(2.112567,3.450713,.144));
  const matrix=new THREE.Matrix4().compose(new THREE.Vector3(577,104,-323),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.73),new THREE.Vector3(1.37,.98,1.13));
  const corners=toriiVisualBoundsCorners(bounds,matrix),worldBounds=new THREE.Box3().setFromPoints(corners.map(p=>new THREE.Vector3(...p)));
  assert.equal(corners.length,8);assert.ok(corners.flat().every(Number.isFinite));
  for(let x=-2.112567;x<2.112568;x+=.1)for(const z of [-.144,.144])assert.ok(worldBounds.containsPoint(new THREE.Vector3(x,3.450713,z).applyMatrix4(matrix)));
  assert.ok(Math.abs(worldBounds.max.y-(104+3.450713*.98))<1e-9);
  const original=corners[0].slice();bounds.min.x=-9;assert.deepEqual(corners[0],original);
});
