import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {findVotiveWaxToRetain,installCandleFlameInstances} from './candle-flame-instances.mjs';

function house(count=14){
  const parent=new THREE.Group(),geometry=new THREE.ConeGeometry(.028,.09,6),material=new THREE.MeshBasicMaterial({color:0xff9d2e}),flames=[];
  for(let i=0;i<count;i++){const flame=new THREE.Mesh(geometry,material);flame.position.set((i%7-3)*.15,.92+Math.floor(i/7)*.28,.35);flame.userData.phase=(i%7-3)*1.7+Math.floor(i/7)*3.1;parent.add(flame);flames.push(flame);}
  return {parent,geometry,material,flames};
}
function almost(actual,expected,tolerance=1e-6){for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]-expected[i])<=tolerance,`${i}: ${actual[i]} != ${expected[i]}`);}
function addWax(f){
  const geometry=new THREE.CylinderGeometry(.018,.020,.16,6),material=new THREE.MeshBasicMaterial({color:0xfff6e5});
  f.wax=f.flames.map(flame=>{flame.userData.baseY=flame.position.y;const wax=new THREE.Mesh(geometry,material);wax.position.copy(flame.position);wax.position.y-=.12;f.parent.add(wax);return wax;});
  return f;
}

test('fourteen flames become one draw with shared geometry, material and untouched house children',()=>{
  const f=house(),other=new THREE.Object3D();f.parent.add(other);
  for(const flame of f.flames){flame.castShadow=true;flame.receiveShadow=true;flame.renderOrder=3;flame.layers.set(2);}
  const controller=installCandleFlameInstances(f.flames),[batch]=controller.meshes;
  assert.equal(controller.stats.instancedFlames,14);assert.equal(controller.stats.batches,1);assert.equal(controller.stats.removedDrawCalls,13);
  assert.equal(batch.parent,f.parent);assert.equal(batch.geometry,f.geometry);assert.equal(batch.material,f.material);
  assert.equal(batch.castShadow,true);assert.equal(batch.receiveShadow,true);assert.equal(batch.renderOrder,3);assert.equal(batch.layers.mask,4);
  assert.equal(batch.instanceMatrix.usage,THREE.DynamicDrawUsage);assert.equal(other.parent,f.parent);assert.ok(f.flames.every(flame=>flame.parent===null));
});

test('instance transforms match the old absolute Y flicker for every phase and transformed parent',()=>{
  const f=house();f.parent.position.set(123,42,-87);f.parent.rotation.set(.1,.7,-.2);f.parent.scale.set(1.2,.8,.9);
  for(let i=0;i<f.flames.length;i++){f.flames[i].rotation.set(.12,.2,-.07);f.flames[i].scale.set(1.1,.5,.9);}
  const controller=installCandleFlameInstances(f.flames),[batch]=controller.meshes,local=new THREE.Matrix4(),expected=new THREE.Matrix4();
  f.parent.updateMatrixWorld(true);
  for(const time of [0,16.667,1234.5,54321]){
    controller.update(time);
    f.flames.forEach((flame,i)=>{
      batch.getMatrixAt(i,local);local.premultiply(f.parent.matrixWorld);
      const scale=new THREE.Vector3(flame.scale.x,.88+.12*Math.sin(time*.006+flame.userData.phase),flame.scale.z);
      expected.compose(flame.position,flame.quaternion,scale).premultiply(f.parent.matrixWorld);
      almost(local.elements,expected.elements);
    });
  }
});

test('initial authored transforms are retained until the first animation update',()=>{
  const f=house(2);f.flames[0].scale.y=.5;f.flames[1].scale.y=1.4;
  const originals=f.flames.map(flame=>{flame.updateMatrix();return flame.matrix.clone();});
  const controller=installCandleFlameInstances(f.flames),matrix=new THREE.Matrix4();
  originals.forEach((expected,i)=>{controller.meshes[0].getMatrixAt(i,matrix);almost(matrix.elements,expected.elements);});
});

test('different parents, materials and rendering flags never merge ownership',()=>{
  const a=house(4),b=house(2);b.flames.forEach(flame=>{flame.geometry=a.geometry;flame.material=a.material;});
  a.flames[2].material=a.material.clone();a.flames[3].castShadow=true;
  const controller=installCandleFlameInstances([...a.flames,...b.flames]);
  assert.equal(controller.stats.batches,2);assert.equal(controller.stats.fallbackFlames,2);
  assert.ok(controller.meshes.some(mesh=>mesh.parent===a.parent));assert.ok(controller.meshes.some(mesh=>mesh.parent===b.parent));
  assert.equal(a.flames[2].parent,a.parent);assert.equal(a.flames[3].parent,a.parent);
});

test('fixed frustum bounds contain every flicker phase, including offset flame geometry',()=>{
  const f=house(2);f.geometry.translate(.1,1.2,-.2);f.flames[0].rotation.z=.4;f.flames[1].scale.set(1.1,1.4,.8);
  const controller=installCandleFlameInstances(f.flames),batch=controller.meshes[0],matrix=new THREE.Matrix4(),point=new THREE.Vector3();
  const position=f.geometry.attributes.position;
  for(const time of [0,200,500,1000,1500,2000]){
    controller.update(time);
    for(let i=0;i<batch.count;i++){batch.getMatrixAt(i,matrix);for(let j=0;j<position.count;j++){point.fromBufferAttribute(position,j).applyMatrix4(matrix);assert.equal(batch.boundingBox.containsPoint(point),true);assert.ok(batch.boundingSphere.containsPoint(point));}}
  }
});

test('hidden, child-owning and singleton flames remain in place and follow the original loop',()=>{
  const f=house(3);f.flames[0].visible=false;f.flames[1].add(new THREE.Object3D());
  const controller=installCandleFlameInstances(f.flames);controller.update(100);
  assert.equal(controller.stats.batches,0);assert.equal(controller.stats.fallbackFlames,3);
  assert.ok(f.flames.every(flame=>flame.parent===f.parent));assert.equal(f.flames[0].visible,false);
  for(const flame of f.flames)assert.equal(flame.scale.y,.88+.12*Math.sin(.6+flame.userData.phase));
});

test('interactive, transparent and per-object callback flames retain their original render owner',()=>{
  const f=house(3);f.flames[0].userData.interactable={title:'Light candle'};
  f.flames[1].material=f.material.clone();f.flames[1].material.transparent=true;
  f.flames[2].onBeforeRender=()=>{};
  const controller=installCandleFlameInstances(f.flames);controller.update(150);
  assert.equal(controller.stats.batches,0);assert.ok(f.flames.every(flame=>flame.parent===f.parent));
});

test('dispose restores original identities and last frame pose without disposing shared assets',()=>{
  const f=house(2);let geometryDisposals=0,materialDisposals=0;f.geometry.addEventListener('dispose',()=>geometryDisposals++);f.material.addEventListener('dispose',()=>materialDisposals++);
  const identities=[...f.flames],controller=installCandleFlameInstances(f.flames);controller.update(500);f.parent.visible=false;
  controller.dispose();controller.dispose();assert.deepEqual(f.flames,identities);assert.ok(identities.every(flame=>flame.parent===f.parent));
  for(const flame of f.flames)assert.equal(flame.scale.y,.88+.12*Math.sin(3+flame.userData.phase));
  assert.equal(f.parent.visible,false);assert.equal(geometryDisposals,0);assert.equal(materialDisposals,0);assert.ok(controller.meshes.every(mesh=>mesh.parent===null));
});

test('one instance buffer update per changed timestamp; invalid times and disposed controllers do nothing',()=>{
  const f=house(2),controller=installCandleFlameInstances(f.flames),batch=controller.meshes[0],initial=batch.instanceMatrix.version;
  controller.update(100);assert.equal(batch.instanceMatrix.version,initial+1);controller.update(100);controller.update(NaN);assert.equal(batch.instanceMatrix.version,initial+1);
  controller.update(200);assert.equal(batch.instanceMatrix.version,initial+2);controller.dispose();controller.update(300);assert.equal(batch.instanceMatrix.version,initial+2);
});

test('authored wax preserves all vertices, material, flags, fixed bounds and original identity on disposal',()=>{
  const f=addWax(house());f.parent.position.set(23,8,-31);f.parent.rotation.y=.6;f.parent.scale.set(1.2,.8,.9);
  for(const wax of f.wax){wax.castShadow=true;wax.receiveShadow=true;wax.renderOrder=2;wax.layers.set(3);}
  f.parent.updateMatrixWorld(true);const originals=f.wax.map(wax=>wax.matrixWorld.clone());
  const controller=installCandleFlameInstances(f.flames),batch=controller.meshes.find(mesh=>mesh.name==='Instanced votive candle wax'),matrix=new THREE.Matrix4(),localPoint=new THREE.Vector3(),point=new THREE.Vector3(),expected=new THREE.Vector3();
  assert.equal(controller.stats.instancedWax,14);assert.equal(controller.stats.waxBatches,1);assert.equal(controller.stats.removedDrawCalls,26);
  assert.equal(batch.parent,f.parent);assert.equal(batch.geometry,f.wax[0].geometry);assert.equal(batch.material,f.wax[0].material);assert.equal(batch.castShadow,true);assert.equal(batch.receiveShadow,true);assert.equal(batch.renderOrder,2);assert.equal(batch.layers.mask,8);
  controller.update(1234);f.parent.updateMatrixWorld(true);
  for(let i=0;i<f.wax.length;i++){
    batch.getMatrixAt(i,matrix);
    for(let j=0;j<batch.geometry.attributes.position.count;j++){
      localPoint.fromBufferAttribute(batch.geometry.attributes.position,j);point.copy(localPoint).applyMatrix4(matrix);
      assert.equal(batch.boundingBox.containsPoint(point),true);assert.equal(batch.boundingSphere.containsPoint(point),true);
      point.applyMatrix4(batch.matrixWorld);expected.copy(localPoint).applyMatrix4(originals[i]);almost(point.toArray(),expected.toArray());
    }
  }
  const first=Array.from(batch.instanceMatrix.array);controller.update(5000);assert.deepEqual(Array.from(batch.instanceMatrix.array),first);
  let disposedAssets=0;batch.geometry.addEventListener('dispose',()=>disposedAssets++);batch.material.addEventListener('dispose',()=>disposedAssets++);
  controller.dispose();assert.ok(f.wax.every(wax=>wax.parent===f.parent));assert.equal(disposedAssets,0);
});

test('wax instance ray hits retain the same interactive ancestor and distance',()=>{
  const f=addWax(house()),owner=new THREE.Group();owner.userData.interactable={onTrigger:()=>42};owner.add(f.parent);
  owner.position.set(7,3,-8);owner.rotation.y=.6;owner.updateMatrixWorld(true);
  const center=f.wax[4].getWorldPosition(new THREE.Vector3()),forward=new THREE.Vector3(0,0,1).transformDirection(owner.matrixWorld),ray=new THREE.Raycaster(center.clone().addScaledVector(forward,2),forward.clone().negate());
  const resolve=hit=>{let target=hit.object;while(target&&!target.userData.interactable)target=target.parent;return target;};
  const before=ray.intersectObjects([owner],true)[0];assert.equal(before.object,f.wax[4]);assert.equal(resolve(before),owner);
  const controller=installCandleFlameInstances(f.flames);owner.updateMatrixWorld(true);
  const after=ray.intersectObjects([owner],true)[0];assert.equal(after.object.name,'Instanced votive candle wax');assert.equal(after.instanceId,4);assert.equal(resolve(after),owner);assert.equal(resolve(after).userData.interactable.onTrigger(),42);
  assert.ok(Math.abs(before.distance-after.distance)<1e-6);owner.visible=false;assert.equal(after.object.parent.parent,owner);assert.equal(owner.visible,false);
  controller.dispose();assert.equal(ray.intersectObjects([owner],true)[0].object,f.wax[4]);
});

test('wax conversion rejects incomplete, ambiguous, interactive or changed authored construction',()=>{
  for(const alter of [
    f=>f.wax[0].removeFromParent(),
    f=>{const duplicate=f.wax[0].clone();f.parent.add(duplicate);},
    f=>{f.wax[0].geometry=new THREE.CylinderGeometry(.02,.02,.16,6);},
    f=>{f.wax[0].userData.interactable={title:'Own interaction'};},
    f=>{f.wax[0].onBeforeRender=()=>{};},
    f=>{f.wax[0].material=f.wax[0].material.clone();},
    f=>{f.wax[0].material.transparent=true;},
    f=>{f.wax[0].scale.y=2;},
    f=>{delete f.flames[0].userData.baseY;}
  ]){
    const f=addWax(house());alter(f);const remaining=f.wax.filter(wax=>wax.parent),controller=installCandleFlameInstances(f.flames);
    assert.equal(controller.stats.instancedWax,0);assert.ok(remaining.every(wax=>wax.parent===f.parent));
  }
});

test('wax never merges different candle houses even when their assets are shared',()=>{
  const a=addWax(house()),b=addWax(house());
  for(const wax of b.wax){wax.geometry=a.wax[0].geometry;wax.material=a.wax[0].material;}
  const controller=installCandleFlameInstances([...a.flames,...b.flames]),batches=controller.meshes.filter(mesh=>mesh.name==='Instanced votive candle wax');
  assert.equal(controller.stats.instancedWax,28);assert.equal(batches.length,2);assert.equal(batches[0].parent,a.parent);assert.equal(batches[1].parent,b.parent);
});

test('polished verified votives use rounded gradient flames, matte wax and one wick draw without lights',()=>{
  const f=addWax(house()),controller=installCandleFlameInstances(f.flames,{polish:true});
  const flame=controller.meshes.find(m=>m.name==='Instanced votive candle flames');
  const wax=controller.meshes.find(m=>m.name==='Instanced votive candle wax');
  const wick=controller.meshes.find(m=>m.name==='Instanced votive candle wicks');
  assert.equal(flame.geometry.type,'LatheGeometry');assert.ok(flame.geometry.index.count/3<=60);
  assert.equal(flame.material.vertexColors,true);assert.equal(flame.material.toneMapped,false);
  assert.equal(wax.material.isMeshStandardMaterial,true);assert.equal(wax.material.roughness,.86);
  assert.equal(wick.count,14);assert.equal(controller.stats.removedDrawCalls,25);
  assert.equal(f.parent.children.some(o=>o.isLight),false);
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),positions=flame.geometry.attributes.position;
  for(let time=0;time<5000;time+=37){
    controller.update(time);
    for(let i=0;i<14;i++){
      flame.getMatrixAt(i,matrix);const height=new THREE.Vector3().setFromMatrixScale(matrix).y;
      assert.ok(height>=.879&&height<=1.001);
      for(let vertex=0;vertex<positions.count;vertex++){point.fromBufferAttribute(positions,vertex).applyMatrix4(matrix);assert.ok(flame.boundingBox.containsPoint(point));}
    }
  }
  let disposed=0;flame.geometry.addEventListener('dispose',()=>disposed++);
  controller.dispose();controller.dispose();assert.equal(disposed,1);
  assert.ok(f.flames.every(part=>part.parent===f.parent));assert.ok(f.wax.every(part=>part.parent===f.parent));assert.equal(wick.parent,null);
});

test('polish leaves custom or incomplete candle construction untouched',()=>{
  const f=addWax(house());f.wax[0].removeFromParent();
  const controller=installCandleFlameInstances(f.flames,{polish:true});
  assert.equal(controller.meshes[0].geometry,f.geometry);assert.equal(controller.stats.wickBatches,0);
  controller.dispose();
});


test('pre-batch retention selects only exact wax from complete eligible flame houses',()=>{
  const complete=addWax(house()),incomplete=addWax(house()),custom=addWax(house());
  incomplete.wax[0].removeFromParent();custom.flames[0].userData.interactable={title:'Custom'};
  const neighbour=new THREE.Mesh(complete.wax[0].geometry,complete.wax[0].material);
  neighbour.position.set(10,10,10);complete.parent.add(neighbour);
  const all=[...complete.flames,...incomplete.flames,...custom.flames];
  const retained=findVotiveWaxToRetain([...all,...complete.flames]);
  assert.deepEqual(retained,complete.wax);assert.equal(retained.includes(neighbour),false);
  assert.ok(complete.wax.every(part=>part.parent===complete.parent));
  // Simulate static batching dropping every unretained ordinary mesh.
  for(const part of [...complete.parent.children])if(part.isMesh&&!all.includes(part)&&!retained.includes(part))part.removeFromParent();
  const controller=installCandleFlameInstances(all,{polish:true});
  assert.equal(controller.stats.wickBatches,1);assert.equal(controller.stats.instancedWax,14);
  controller.dispose();
});
