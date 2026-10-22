import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {tamayamaStairBorderPlan,buildTamayamaStairBorders} from './tamayama-stair-borders.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const flight={id:'way/105449693',a:[0,0,0],b:[6,0,0],ya:2,yb:4,width:4.8,stair:true};
const network=()=>({segments:[{...flight}],terrainHeight:(x,z)=>2+x/3-Math.abs(z)*.02,height:()=>17});

test('stone edges follow actual flight widths/heights, remain outside curb, and enter supporting terrain',()=>{
  const n=network(),before=JSON.stringify(n.segments),blocks=tamayamaStairBorderPlan(n);
  assert.equal(blocks.length,16);
  for(const b of blocks){
    for(const [x,z]of b.polygon){
      assert.ok(Math.abs(z)>=flight.width/2+.139999);
      assert.ok(Math.abs(z)<=flight.width/2+.620001);
      assert.ok(b.bottom<n.terrainHeight(x,z));
      assert.ok(b.top>n.terrainHeight(x,z));
      assert.ok(b.top-b.bottom<1.1,'bounded low retaining face');
    }
  }
  assert.equal(JSON.stringify(n.segments),before);
  assert.deepEqual(tamayamaStairBorderPlan({segments:[],terrainHeight:()=>0}),[]);
});

test('crossing paths and obstacle footprints cut the edges instead of closing the access',()=>{
  const n=network();
  n.segments.push({id:'branch',a:[3,0,-5],b:[3,0,5],ya:3,yb:3,width:1,stair:false});
  const obstacle=[[.1,2.5],[1.4,2.5],[1.4,3.2],[.1,3.2]];
  const cuts=[obstacle,[[2.35,-5],[3.65,-5],[3.65,5],[2.35,5]]];
  const blocks=tamayamaStairBorderPlan(n,[obstacle]);
  assert.ok(blocks.length>0);
  for(const b of blocks)for(const cut of cuts){
    const area=Math.abs(polygonArea(b.polygon));
    assert.ok(Math.abs(area-subtractConvex(b.polygon,cut).reduce((sum,p)=>sum+Math.abs(polygonArea(p)),0))<1e-7);
  }
});

test('builder reuses stone material in one batch, is idempotent, and preserves walking ownership',()=>{
  const root=new THREE.Group(),n=network(),height=n.height,terrain=n.terrainHeight,stone=new THREE.MeshStandardMaterial();
  const record=buildTamayamaStairBorders(root,{},n,{stoneMat:stone});
  assert.equal(record.materialBatches,1);assert.ok(record.triangles<500);
  assert.equal(root.children.length,1);assert.equal(root.children[0].material,stone);
  assert.equal(n.height,height);assert.equal(n.terrainHeight,terrain);
  const p=root.children[0].geometry.attributes.position;
  for(const v of p.array)assert.ok(Number.isFinite(v));
  for(let i=0;i<p.count;i+=3){
    const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
    assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-12,'nondegenerate geometry');
  }
  assert.equal(buildTamayamaStairBorders(root,{},n,{stoneMat:stone}),null);
});
