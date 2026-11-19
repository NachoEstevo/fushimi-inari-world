import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {toriiCrossbeamGeometry} from './torii-crossbeam-geometry.mjs';

const senbon={width:2.95,height:.1,depth:.22,centerY:2.7,endRise:.075};
test('continuous torii beams have closed outward surfaces, unit normals and metre-scale UVs',()=>{
 for(const segments of [4,6]){
  const geometry=toriiCrossbeamGeometry({...senbon,segments}),p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,edges=new Map();
  assert.equal(geometry.index.count/3,segments*8+4);
  const point=i=>new THREE.Vector3().fromBufferAttribute(p,i),key=i=>point(i).toArray().map(v=>v.toFixed(6)).join(',');
  for(let i=0;i<p.count;i++){assert.ok(Math.abs(new THREE.Vector3().fromBufferAttribute(n,i).length()-1)<1e-6);assert.ok(Number.isFinite(uv.getX(i))&&Number.isFinite(uv.getY(i)));}
  for(let i=0;i<geometry.index.count;i+=3){
   const [a,b,c]=[0,1,2].map(j=>geometry.index.getX(i+j)),normal=point(b).sub(point(a)).cross(point(c).sub(point(a)));
   assert.ok(normal.length()>1e-6,'no zero-area or overlapping interior filler triangles');normal.normalize();
   for(const vertex of [a,b,c])assert.ok(normal.dot(new THREE.Vector3().fromBufferAttribute(n,vertex))>.98,'winding and smooth normals point outside');
   for(const [a,b]of [[geometry.index.getX(i),geometry.index.getX(i+1)],[geometry.index.getX(i+1),geometry.index.getX(i+2)],[geometry.index.getX(i+2),geometry.index.getX(i)]]){
    const edge=[key(a),key(b)].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);
   }
  }
  assert.ok([...edges.values()].every(count=>count===2),'each physical edge joins exactly two faces');
  const material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material);mesh.updateMatrixWorld(true);
  for(const side of [-1,1])for(let i=0;i<=30;i++){
   const x=-1.47+i*2.94/30,y=2.7+.075*Math.pow(Math.abs(x)/1.475,3);
   const hit=new THREE.Raycaster(new THREE.Vector3(x,y,side),new THREE.Vector3(0,0,-side)).intersectObject(mesh)[0];
   assert.ok(hit,'continuous painted face has no segment cracks');assert.ok(Math.abs(hit.point.z-side*.11)<1e-6);assert.ok(hit.face.normal.z*side>.99);
  }
  assert.ok(Math.abs(uv.getX(segments*2)-uv.getX(0)-2.95/1.5)<1e-6,'horizontal UV density is based on metres, not per-segment tiles');
  geometry.dispose();material.dispose();
 }
});

test('large continuous kasagi retains the exact old end-tip envelope and triangle count',()=>{
 const half=1.88+.225*Math.cos(.14)+.07*Math.sin(.14),peak=3.35+.225*Math.sin(.14)+.07*Math.cos(.14);
 const geometry=toriiCrossbeamGeometry({width:half*2,height:.14,depth:.25,centerY:3.31,endRise:peak-3.38,segments:4}),bounds=geometry.boundingBox;
 assert.equal(geometry.index.count/3,36,'three overlapping twelve-triangle boxes are replaced within the same budget');
 assert.ok(Math.abs(bounds.min.x+half)<1e-6&&Math.abs(bounds.max.x-half)<1e-6);assert.ok(Math.abs(bounds.min.y-3.24)<1e-6&&Math.abs(bounds.max.y-peak)<1e-6);
 geometry.dispose();
});

test('matching red and black Senbon profiles meet without an illuminated air slit',()=>{
 const red=toriiCrossbeamGeometry({width:2.78,height:.13,depth:.18,centerY:2.589,endRise:.075,curveWidth:2.95});
 const black=toriiCrossbeamGeometry(senbon),material=new THREE.MeshBasicMaterial(),redMesh=new THREE.Mesh(red,material),blackMesh=new THREE.Mesh(black,material);
 redMesh.updateMatrixWorld(true);blackMesh.updateMatrixWorld(true);
 for(let i=0;i<=40;i++){
  const x=-1.389+i*2.778/40;
  const redTop=new THREE.Raycaster(new THREE.Vector3(x,4,0),new THREE.Vector3(0,-1,0)).intersectObject(redMesh)[0].point.y;
  const blackBottom=new THREE.Raycaster(new THREE.Vector3(x,2,0),new THREE.Vector3(0,1,0)).intersectObject(blackMesh)[0].point.y;
  assert.ok(redTop>=blackBottom&&redTop-blackBottom<.008,'black protective cap overlaps its painted support by a few millimetres');
 }
 for(const geometry of [red,black])geometry.dispose();material.dispose();
 assert.throws(()=>toriiCrossbeamGeometry({...senbon,segments:0}),RangeError);
});

test('four tapered nuki keys are watertight and rise from the timber only beside the posts',async()=>{
 const {toriiNukiWedges}=await import('./torii-crossbeam-geometry.mjs');
 const halfSpan=1.24,reach=.29,height=.095,depth=.115,seatY=2.722;
 const g=toriiNukiWedges({halfSpan,reach,height,depth,seatY}),p=g.attributes.position,n=g.attributes.normal;
 assert.equal(g.index.count/3,32);
 const point=i=>new THREE.Vector3().fromBufferAttribute(p,i);
 for(let wedge=0;wedge<4;wedge++){
  const edges=new Map();
  for(let i=wedge*24;i<(wedge+1)*24;i+=3){
   const ids=[0,1,2].map(j=>g.index.getX(i+j)),[a,b,c]=ids.map(point),normal=b.clone().sub(a).cross(c.clone().sub(a));
   assert.ok(normal.length()>1e-5);
   assert.ok(normal.normalize().dot(new THREE.Vector3().fromBufferAttribute(n,ids[0]))>.999);
   for(let j=0;j<3;j++){
    const key=[point(ids[j]).toArray().join(','),point(ids[(j+1)%3]).toArray().join(',')].sort().join('|');
    edges.set(key,1+(edges.get(key)??0));
   }
  }
  assert.ok([...edges.values()].every(count=>count===2));
 }
 const material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(g,material);
 const hit=x=>new THREE.Raycaster(new THREE.Vector3(x,3,0),new THREE.Vector3(0,-1,0)).intersectObject(mesh)[0];
 for(const post of [-halfSpan,halfSpan])for(const side of [-1,1]){
  const x=post+side*reach*.85;
  assert.ok(Math.abs(hit(x).point.y-(seatY+height*.85))<1e-6);
 }
 assert.equal(hit(0),undefined);
 g.dispose();material.dispose();
});

test('the assembled mountain gate joins the curved red support to the black cap from end to end',async()=>{
 const {readFileSync}=await import('node:fs');
 const {toriiNukiWedges,sleevedToriiPost}=await import('./torii-crossbeam-geometry.mjs');
 const source=readFileSync(new URL('./legacy-builders.mjs',import.meta.url),'utf8');
 const start=source.indexOf('    function mergeBufferGeometries('),end=source.indexOf('    const { vermilionGeo: toriiVermGeo',start);
 const deps={THREE,toriiNukiWedges,sleevedToriiPost,toriiCrossbeamGeometry,applyMetricUVs:g=>g};
 const unit=new Function(...Object.keys(deps),source.slice(start,end)+'\nreturn createToriiUnitGeometries();')(...Object.values(deps));
 const material=new THREE.MeshBasicMaterial(),red=new THREE.Mesh(unit.vermilionGeo,material),black=new THREE.Mesh(unit.blackGeo,material);
 const ray=(mesh,x,y,dy)=>new THREE.Raycaster(new THREE.Vector3(x,y,0),new THREE.Vector3(0,dy,0)).intersectObject(mesh)[0];
 for(let i=0;i<100;i++){
  const x=-1.829+3.658*i/99,top=ray(red,x,4,-1).point.y,cap=ray(black,x,2.9,1).point.y;
  assert.ok(top>=cap&&top-cap<.03,'the red support seats into the cap across the complete overlap');
 }
 for(const post of [-1.24,1.24])for(const side of [-1,1]){
  const key=ray(red,post+side*.29*.85,2.9,-1);
  assert.ok(Math.abs(key.point.y-(2.722+.095*.85))<1e-6);
 }
 assert.ok(Math.abs(ray(red,0,.5,1).point.y-2.555)<1e-6);
 assert.equal((red.geometry.index.count+black.geometry.index.count)/3,352);
 red.geometry.dispose();black.geometry.dispose();material.dispose();
});
