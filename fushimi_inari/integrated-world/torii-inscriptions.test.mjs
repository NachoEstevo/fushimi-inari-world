import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildToriiInscriptions,toriiInkTile,toriiInkTiles} from './torii-inscriptions.mjs';
import {dedicationTexts} from './mountain-torii-profile.mjs';

const painted=[];
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({save(){},restore(){},scale(){},fillText(text,x,y,maxWidth){painted.push({text,x,y,maxWidth,font:this.font,color:this.fillStyle});}})})};
const options={halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27};
const make=(extra={},entry={})=>{const root=new THREE.Group();buildToriiInscriptions(root,[{m:new THREE.Matrix4(),inscription:2,dateInscription:6,...entry}],{...options,...extra});root.updateMatrixWorld(true);return root;};
const meshes=root=>{const result=[];root.traverse(o=>{if(o.isMesh)result.push(o);});return result;};

test('front retains the two real dedication characters while reverse stays multicharacter and unattributed',()=>{
 assert.equal(toriiInkTiles.length,16);assert.deepEqual(toriiInkTiles.slice(0,8),dedicationTexts);
 for(let variant=0;variant<4;variant++){
  const entry={inscription:variant,dateInscription:4+variant};
  assert.equal(toriiInkTiles[toriiInkTile(entry,-1,true)],'奉');assert.equal(toriiInkTiles[toriiInkTile(entry,1,true)],'納');
  assert.ok(toriiInkTiles[toriiInkTile(entry,-1,false)].length>1);assert.ok(toriiInkTiles[toriiInkTile(entry,1,false)].length>1);
 }
 assert.equal(new Set(Array.from({length:4},(_,inscription)=>toriiInkTile({inscription},-1,true))).size,4);
});

test('raycasts from uphill and downhill encounter the correct ink face and atlas column',()=>{
 const root=make();
 for(const front of [true,false])for(const side of [-1,1]){
  const z=front?-1:1,y=front?2.17:1.4,ray=new THREE.Raycaster(new THREE.Vector3(side*1.24,y,z),new THREE.Vector3(0,0,-z),0,2);
  const hit=ray.intersectObject(root,true)[0];assert.ok(hit);assert.equal(Math.floor(hit.uv.x*16),toriiInkTile({inscription:2,dateInscription:6},side,front));
  assert.equal(Math.sign(hit.point.z),Math.sign(z));assert.ok(hit.face.normal.z*z>0);
 }
});

test('thick-post ink facet interiors cannot sink into the tapered post',()=>{
 for(const thickness of [1,1.22,1.45])for(const small of [false,true]){
  const root=make({small},{thickness});
  for(const mesh of meshes(root)){
   const p=mesh.geometry.attributes.position;
   for(let i=0;i<p.count;i+=3){
    const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
    const postX=Math.sign(x)*options.halfSpan,r=(options.bottomRadius+(options.topRadius-options.bottomRadius)*(y-options.bottomY)/(options.topY-options.bottomY))*thickness;
    const gap=Math.hypot(x-postX,z)-r;assert.ok(gap>.0005&&gap<.006,'conforming ink clearance '+gap);
   }
  }
 }
});

test('front-only geometry, texture size and per-gate triangles retain original fixed budgets',()=>{
 const full=meshes(make()),front=meshes(make({frontOnly:true})),triangles=ms=>ms.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);
 assert.equal(triangles(full),48);assert.equal(triangles(front),24);assert.equal(full.length,4);assert.equal(front.length,2); // Identity gate straddles both 80m grid axes.
 assert.equal(new Set([...full,...front].map(m=>m.material)).size,1);assert.equal(full[0].material.map.image.width,2048);assert.equal(full[0].material.map.image.height,1024);
 assert.equal(painted.filter(p=>p.text==='奉').length,8);assert.equal(painted.filter(p=>p.text==='納').length,8); // Four reverse date strings also contain 奉納.
 assert.ok(painted.every(p=>p.x>0&&p.x<2048&&p.maxWidth<=116));
});
