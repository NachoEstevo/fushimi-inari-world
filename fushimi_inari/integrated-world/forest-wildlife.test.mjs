import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {birdPose,wildlifeAnchors,createForestWildlife,wildlifeBudget} from './forest-wildlife.mjs';

const trees=Array.from({length:12},(_,i)=>({type:'cylinder',args:[i*60,0,.4,50,60,'forest_tree']}));

test('only existing forest trees provide spaced anchors, capped at six',()=>{
  const anchors=wildlifeAnchors([{type:'cylinder',args:[0,0,1,0,9,'building']},...trees,trees[0]]);
  assert.equal(anchors.length,6);assert.equal(anchors[0].y,50);
  assert.equal(wildlifeAnchors(trees,0).length,0);
  assert.equal(wildlifeAnchors([]).length,0);
  assert.deepEqual(wildlifeAnchors(trees,6,x=>({distance:x<100?12:21})).map(a=>a.x),[0,60]);
});

test('flight stays clear of its anchor trunk; inactive birds are hidden instead of floating perched',()=>{
  const anchor={x:10,y:50,z:20};
  for(let t=0;t<64;t+=.1){
    const p=birdPose(anchor,0,t);
    assert.ok(Math.hypot(p.x-anchor.x,p.z-anchor.z)<4);
    assert.ok(Math.hypot(p.x-anchor.x,p.z-anchor.z)>2.3);
    assert.ok(p.y>=54.2-1e-8&&p.y<=59.2+1e-8);
  }
  assert.ok(Math.abs(birdPose(anchor,0,31.999).x-birdPose(anchor,0,32).x)<.01);
  assert.equal(birdPose(anchor,0,0).flying,false);
  assert.equal(birdPose(anchor,0,25).flying,true);
});

test('update culls distant birds, geometry is shared and disposal detaches only owned group',()=>{
  const root=new THREE.Group(),camera=new THREE.PerspectiveCamera();
  const wildlife=createForestWildlife({root,colliders:trees});
  assert.equal(wildlife.count,6);
  assert.equal(wildlife.group.children[0].children[0].geometry,wildlife.group.children[1].children[0].geometry);
  const bird=wildlife.group.children[0];
  let triangles=0;bird.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  assert.ok(triangles<=wildlifeBudget.trianglesPerBird);
  camera.position.set(0,54,0);wildlife.update(camera,25);assert.equal(bird.visible,true);
  wildlife.update(camera,0);assert.equal(bird.visible,false);
  camera.position.set(1000,54,1000);wildlife.update(camera,25);assert.equal(bird.visible,false);
  wildlife.dispose();assert.equal(root.children.length,0);
});
