import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {buildOkushaNorthBoundaryR103,okushaNorthFenceR103} from './okusha-north-boundary-r103.mjs';
import {omokaruRearFenceR96} from './restboundary-r96.mjs';
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const y=62.334978,terrain=[260,y,58,279,y,58,260,y,66,279,y,58,279,y,66,260,y,66];
const fixture=()=>{const root=new THREE.Group(),old=new THREE.Group();old.userData.restBoundaryR96=true;root.add(old);return {root,old,materials:{vermilionMat:new THREE.MeshStandardMaterial()},colliders:[]};};

test('only mapped open north chain, actual triangle-embedded roots and source-height red paling',()=>{
  const f=fixture(),oldChildren=[...f.old.children],state=JSON.stringify(features);
  const r=buildOkushaNorthBoundaryR103(f.root,features,f.materials,f.colliders,{terrainPositions:terrain,walkHeight:()=>y+.2});
  assert.ok(r?.built);assert.equal(r.segments,4);assert.ok(Math.abs(r.length-18.206)<.002);assert.ok(r.slats<=105);assert.equal(r.stats.batches,1);assert.ok(r.stats.triangles<5000);
  assert.deepEqual(f.old.children,oldChildren);assert.equal(JSON.stringify(features),state);
  assert.deepEqual(r.endpoints,[okushaNorthFenceR103.points[0],okushaNorthFenceR103.points.at(-1)]);
  const p=okushaNorthFenceR103.points.at(-1),q=omokaruRearFenceR96.points[0];assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])>1.9,'do not close the mapped torii gap');
  r.group.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(Math.abs(b.min.y-(y-.025))<1e-4,'actual lower envelope intersects triangle support');assert.ok(b.max.y<=y+.2+1.071);for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));});
  assert.equal(r.minRouteEdgeMargin>.09,true);
  assert.equal(buildOkushaNorthBoundaryR103(f.root,features,f.materials,f.colliders,{terrainPositions:terrain}),null);
});

test('existing public route center and usable width margins remain clear for the player',()=>{
  const f=fixture();assert.ok(buildOkushaNorthBoundaryR103(f.root,features,f.materials,f.colliders,{terrainPositions:terrain,walkHeight:()=>y+.2}));
  const world=new SpatialCollisionWorld();for(const c of f.colliders)world[c.type==='box'?'addBox':'addCylinder'](...c.args);
  for(const id of ['way/301527762','way/301527759','way/1051656816']){
    const path=features.paths.find(p=>p.id===id);assert.ok(path);
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),margin=Math.max(0,(parseFloat(path.tags.width)||2)/2-.28);
      for(let j=0;j<=80;j++)for(const side of [-1,0,1]){
        const t=j/80,x=a[0]+dx*t-dz/len*side*margin,z=a[2]+dz*t+dx/len*side*margin,q=world.resolvePlayer(x,y+.2+1.55,z,.28);
        assert.ok(Math.hypot(q.x-x,q.z-z)<1e-7,`${id} center/width margin stays clear`);
      }
    }
  }
});

test('unknown terrain, height discontinuity and route conflict do not authorize partial fences',()=>{
  for(const [data,options]of [[features,{terrainPositions:[]}],[features,{terrainPositions:terrain,walkHeight:()=>99}],[{...features,paths:[{id:'test-conflict',tags:{width:'2'},points:[[261,y,60.6],[278,y,60.6]]}]},{terrainPositions:terrain}]]){
    const f=fixture();assert.equal(buildOkushaNorthBoundaryR103(f.root,data,f.materials,f.colliders,options),null);assert.equal(f.root.children.length,1);assert.equal(f.colliders.length,0);
  }
});

test('actual post vertices stay buried into all four sloping support corners',()=>{
  const f=fixture(),height=(x,z)=>62+.02*(x-260)+.01*(z-58),slope=terrain.map((v,i)=>i%3===1?height(terrain[i-1],terrain[i+1]):v);
  const r=buildOkushaNorthBoundaryR103(f.root,features,f.materials,f.colliders,{terrainPositions:slope});assert.ok(r);
  const a=r.group.children[0].geometry.attributes.position,start=a.count-r.posts*36;
  for(let i=start;i<a.count;i+=36){
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,minY=Infinity;
    for(let j=i;j<i+36;j++){minX=Math.min(minX,a.getX(j));maxX=Math.max(maxX,a.getX(j));minZ=Math.min(minZ,a.getZ(j));maxZ=Math.max(maxZ,a.getZ(j));minY=Math.min(minY,a.getY(j));}
    const supports=[height(minX,minZ),height(minX,maxZ),height(maxX,minZ),height(maxX,maxZ)];
    assert.ok(Math.abs(minY-(Math.min(...supports)-.025))<1e-4,'post lower envelope is physically seated across actual footprint');
  }
});
