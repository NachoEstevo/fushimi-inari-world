import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {refineShrineOfferings} from './shrine-offerings.mjs';

test('legacy offerings in every peak compound gain open centers without moving or losing interaction',()=>{
  for(const zone of ['mitsurugi','sannomine','ninomine','summit']){
    const group=new THREE.Group();group.userData.zone=zone;
    const material=new THREE.MeshStandardMaterial({color:0xd94816});
    const offering=new THREE.Mesh(new THREE.BoxGeometry(.36,.42,.06),material);
    offering.position.set(2,3,4);offering.rotation.x=-.18;
    const interact=()=>true;offering.userData.onInteract=interact;group.add(offering);
    offering.updateMatrix();const matrix=offering.matrix.clone();
    refineShrineOfferings(group);
    assert.equal(offering.geometry.type,'BufferGeometry',zone);
    assert.equal(offering.material,material);assert.equal(offering.userData.onInteract,interact);
    offering.updateMatrix();assert.deepEqual(offering.matrix.elements,matrix.elements);
    // Test local geometry: the former solid plate blocked this center ray.
    const local=new THREE.Mesh(offering.geometry,material);local.updateMatrixWorld();
    const ray=new THREE.Raycaster(new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1));
    assert.equal(ray.intersectObject(local).length,0,zone+' center must remain open');
    ray.set(new THREE.Vector3(.115,0,1),new THREE.Vector3(0,0,-1));
    assert.ok(ray.intersectObject(local).length>0,zone+' post remains present');
    const geometry=offering.geometry;refineShrineOfferings(group);assert.equal(offering.geometry,geometry);
  }
});

test('other zones, near-signature boxes and non-Mitsurugi stone retain their geometry',()=>{
  for(const zone of ['precinct','gozendani','summit']){
    const group=new THREE.Group();group.userData.zone=zone;
    const sizes=zone==='summit'?[[.36,.42,.07],[.54,1.24,.26]]:[[.36,.42,.06]];
    for(const size of sizes){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size));group.add(mesh);}
    const geometries=group.children.map(mesh=>mesh.geometry);refineShrineOfferings(group);
    assert.deepEqual(group.children.map(mesh=>mesh.geometry),geometries,zone);
  }
});
