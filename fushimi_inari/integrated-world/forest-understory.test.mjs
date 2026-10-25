import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHash} from 'node:crypto';
import {extendForest} from './forest.mjs';
import {pathClearance} from './spatial.mjs';
import {understoryGeometry,understoryBudget,createUnderstoryPlacement,understoryGround,understoryLOD} from './forest-understory.mjs';

test('near and far foliage have finite normals and real outlines within the shared clearance budget',()=>{
  for(const detail of ['near','far']){
    const g=understoryGeometry(detail),p=g.attributes.position,n=g.attributes.normal;
    assert.ok(p.count/3<=understoryBudget[detail==='near'?'nearTriangles':'farTriangles']);
    for(let i=0;i<p.count;i++){
      assert.ok(Math.hypot(p.getX(i),p.getZ(i))<=understoryBudget.radius);
      assert.ok(p.getY(i)>=0&&p.getY(i)<.9);
      assert.ok(Number.isFinite(n.getX(i)+n.getY(i)+n.getZ(i)));
      assert.ok(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))>.99);
    }
    assert.equal(g.attributes.color.count,p.count);g.dispose();
  }
});

const path=(width,z=0)=>({tags:{highway:'footway',width},points:[[-20,0,z],[20,0,z]]});
test('full plant silhouette clears wide mapped paths, branch intersections and endpoints',()=>{
  const place=createUnderstoryPlacement([path('12'),{tags:{highway:'steps'},points:[[0,0,-10],[0,0,20]]}]);
  assert.equal(place(10,6.9,.8),false,'centre outside a road is insufficient');
  assert.equal(place(.5,9,.8),false,'second branch is also excluded');
  assert.equal(place(20.7,0,.8),false,'segment end is a capsule, not a rectangle');
  assert.equal(place(10,7.2,.8),true);
});

test('anchor openings and irregular groups retain gaps; rejected candidates do not occupy space',()=>{
  const place=createUnderstoryPlacement([],[{radius:3,target:[0,0,0]}]);
  assert.equal(place(3.5,0,.8),false);
  assert.equal(place(5,0,.8),true);
  assert.equal(place(5.2,0,.8),false);
  assert.equal(place(6.4,0,.8),true);
  assert.equal(place(NaN,20,.8),false);
  assert.equal(place(20,20,10),false);
});

test('placement is deterministic and uses full width even beyond the old 6 m path lookup reach',()=>{
  const run=()=>{
    const place=createUnderstoryPlacement([path('25')]);
    return [[0,13],[3,14],[4,14],[6,14]].map(([x,z])=>place(x,z,.8));
  };
  assert.deepEqual(run(),[false,true,false,true]);assert.deepEqual(run(),run());
});

test('grounding rejects invalid samples and abrupt ledges instead of bridging them with foliage',()=>{
  assert.ok(Math.abs(understoryGround((x,z)=>60+x*.1+z*.1,3,4,.8)-60.7)<1e-10);
  assert.equal(understoryGround(x=>x>0?61:60,0,0,.8),null);
  assert.equal(understoryGround(x=>x>0?NaN:60,0,0,.8),null);
});

test('LOD preserves transforms and pigment, uses one material, and returns to detail before a nearby plant',()=>{
  const material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide});
  const near=new THREE.InstancedMesh(understoryGeometry(),material,2);
  near.setMatrixAt(0,new THREE.Matrix4().makeTranslation(0,60,0));
  near.setMatrixAt(1,new THREE.Matrix4().makeTranslation(78,60,0));
  near.setColorAt(0,new THREE.Color(.8,.9,.7));near.setColorAt(1,new THREE.Color(1,.95,.8));
  const lod=understoryLOD(near,understoryGeometry('far')),far=lod.levels[1].object;
  assert.equal(lod.userData.nearForest,true);assert.equal(near.material,far.material);
  assert.deepEqual(far.instanceMatrix.array,near.instanceMatrix.array);
  assert.deepEqual(far.instanceColor.array,near.instanceColor.array);
  assert.equal(near.castShadow,false);assert.equal(far.castShadow,false);
  assert.equal(material.map,null);assert.equal(material.normalMap,null);
  const camera=new THREE.PerspectiveCamera();lod.updateMatrixWorld(true);
  camera.position.set(1000,60,0);camera.updateMatrixWorld(true);lod.update(camera);
  assert.equal(near.visible,false);assert.equal(far.visible,true);
  camera.position.set(100,60,0);camera.updateMatrixWorld(true);lod.update(camera);
  assert.equal(near.visible,true);assert.equal(far.visible,false);
});

test('understory changes preserve the pre-change forest seed, tree transforms and collision owners',()=>{
  const previousDocument=globalThis.document;
  globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>new Proxy({},{get:()=>()=>{}})})};
  try{
    const root=new THREE.Group(),colliders=[];
    const legacy={foliage:Array.from({length:4},()=>new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshStandardMaterial()))};
    const paths=[{tags:{highway:'footway',width:'2'},points:[[110,60,0],[180,60,0]]}];
    const ground=(x,z)=>x>=110&&x<170&&Math.abs(z)<40?60:0;
    const report=extendForest(root,legacy,{paths,buildings:[],water:[]},[],ground,pathClearance(paths),colliders);
    const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
    // Captured from the original generator before replacing its understory.
    assert.equal(report.trees,72);assert.equal(report.broadleaf,50);
    assert.equal(hash(colliders),'aa43e3fbe2a46e945384bc7da16e11551a2230cf7f374e988e2b4622a3ce404b');
    const matrices=[];let cells=0;
    for(const child of root.children){
      if(child.name==='Forest understory · static fern/sedge LOD'){cells++;continue;}
      child.traverse(o=>{if(o.isInstancedMesh)matrices.push(Array.from(o.instanceMatrix.array));});
    }
    assert.equal(hash(matrices),'feddb69428767ff00c80e6acbf95df22da8a6bc0d91fcf6596ff80eb3bc72d06');
    assert.ok(cells>0&&report.understory>0&&report.understory<=169);
  }finally{
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  }
});
