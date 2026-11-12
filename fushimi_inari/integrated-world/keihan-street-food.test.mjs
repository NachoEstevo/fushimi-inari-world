import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {appendStreetFood} from './keihan-street-food.mjs';

function capture(kind,item,options){
 const pieces=[],batch={put:(geometry,key,color,stage)=>pieces.push({geometry,key,color,stage})};
 assert.equal(appendStreetFood(batch,kind,item,options),true);return pieces;
}
const bounds=piece=>{piece.geometry.computeBoundingBox();return piece.geometry.boundingBox;};

test('fox senbei has two pointed ears and baked facial detail while resting on its tray',()=>{
 const pieces=capture('senbei','fox-senbei',{pose:'flat'}),body=pieces.filter(p=>p.color==='#cfa168');
 assert.equal(body.length,1);for(const part of body){const box=bounds(part);assert.ok(Math.abs(box.min.y)<1e-6&&Math.abs(box.max.y-.0074)<1e-6);}
 const ears=body.flatMap(({geometry})=>{const p=geometry.attributes.position;return Array.from({length:p.count},(_,i)=>[p.getX(i),p.getZ(i)]);}).filter(([,z])=>z<-.12);
 assert.ok(ears.some(([x])=>x>.035)&&ears.some(([x])=>x<-.035),'both ears are part of the silhouette');
 assert.ok(pieces.filter(p=>p.color==='#704728').length>=3,'eyes and nose are physical baked marks');
 for(const piece of pieces)piece.geometry.dispose();
});

test('three rounded dango touch the grill independently and a skewer passes through them',()=>{
 const pieces=capture('grill','dango',{position:[0,1.141,0],pose:'horizontal'});
 const stick=bounds(pieces[0]),balls=pieces.filter(p=>['#c58e4f','#dbb979'].includes(p.color));
 assert.equal(balls.length,3);assert.ok(stick.max.x-stick.min.x>.18);
 const centers=balls.map(p=>{const b=bounds(p);assert.ok(Math.abs(b.min.y-1.111)<.002);return (b.min.x+b.max.x)/2;}).sort((a,b)=>a-b);
 assert.ok(centers[1]-centers[0]>.036&&centers[2]-centers[1]>.036);
 assert.ok(pieces.filter(p=>p.color==='#8b5b32').length===3,'restrained toasted patches are modeled');
 for(const piece of pieces)piece.geometry.dispose();
});

test('toasted dango marks lie within 0.3 mm of the actual food surface',()=>{
 const pieces=capture('grill','dango',{}),balls=pieces.filter(p=>['#c58e4f','#dbb979'].includes(p.color));
 const marks=pieces.filter(p=>['#8b5b32','#936037','#a96d38'].includes(p.color));
 assert.equal(marks.length,3);
 for(const mark of marks){
  const points=mark.geometry.attributes.position,ball=balls.reduce((best,p)=>{
   const center=bounds(p).getCenter(new THREE.Vector3()),point=new THREE.Vector3().fromBufferAttribute(points,0);
   return !best||center.distanceToSquared(point)<best.distance?{piece:p,distance:center.distanceToSquared(point)}:best;
  },null).piece.geometry;
  const index=ball.index,vertices=ball.attributes.position,triangle=new THREE.Triangle(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),nearest=new THREE.Vector3();
  for(let i=0;i<points.count;i++){
   const point=new THREE.Vector3().fromBufferAttribute(points,i);let distance=Infinity;
   for(let j=0;j<index.count;j+=3){a.fromBufferAttribute(vertices,index.getX(j));b.fromBufferAttribute(vertices,index.getX(j+1));c.fromBufferAttribute(vertices,index.getX(j+2));triangle.set(a,b,c).closestPointToPoint(point,nearest);distance=Math.min(distance,point.distanceTo(nearest));}
   assert.ok(distance<.0003,`mark vertex is ${distance*1000} mm from the faceted ball surface`);
  }
  assert.ok((mark.geometry.index?.count??points.count)/3<=100,'surface-conforming marks remain bounded');
 }
 for(const piece of pieces)piece.geometry.dispose();
});

test('tofu soft serve combines a supported cup and a piped spiral in the chosen flavor',()=>{
 for(const [item,color] of [['tofu','#f2ebd6'],['matcha','#8a9c6a']]){
  const pieces=capture('soft-serve',item,{}),cup=pieces[0],spiral=pieces.filter(p=>p.geometry.type==='TubeGeometry');
  assert.ok(Math.abs(bounds(cup).min.y)<1e-6);assert.equal(spiral.length,3);assert.ok(spiral.every(p=>p.color===color));
  const box=spiral.reduce((acc,p)=>acc.union(bounds(p)),new THREE.Box3());assert.ok(box.max.y-box.min.y>.10&&box.max.y<.22);
  assert.equal(pieces.filter(p=>p.geometry.type==='CylinderGeometry'&&p.color===color).length,3,'spiral is filled rather than hollow');
  for(const piece of pieces)piece.geometry.dispose();
 }
});

test('fox wafer is thin and grill marks span the food surface',()=>{
 const fox=capture('senbei','fox-senbei',{pose:'flat'}),body=fox.find(p=>p.color==='#cfa168');
 const thickness=bounds(body).getSize(new THREE.Vector3()).y;
 assert.ok(thickness<.010,'a pressed wafer has a thin baked edge');
 const food=capture('grill','dango',{}),marks=food.filter(p=>p.color==='#8b5b32');
 assert.equal(marks.length,3);
 for(const mark of marks){const size=bounds(mark).getSize(new THREE.Vector3());
  assert.ok(size.x>.03&&size.y>.008&&size.z>.025,'grill marks are elongated bands following the dumpling');
 }
 for(const piece of [...fox,...food])piece.geometry.dispose();
});


test('dango uses a smaller skewer and irregular broken grill marks',()=>{
 const pieces=capture('grill','dango',{pose:'horizontal',position:[0,1.141,0]});
 const stick=bounds(pieces[0]);assert.ok(stick.max.x-stick.min.x>.18&&stick.max.x-stick.min.x<.19);
 const marks=pieces.filter(p=>p.color==='#8b5b32');assert.equal(marks.length,3);
 for(const mark of marks){
  const pos=mark.geometry.attributes.position,normal=mark.geometry.attributes.normal;
  const bands=[new Set(),new Set()],center=.8*(.087+(mark.stage-1)*.049);
  for(let i=0;i<pos.count;i+=3){
   // Undo the horizontal pose to classify front-facing toasted sectors.
   const y=pos.getX(i)-.023;
   const nx=-normal.getY(i),nz=normal.getZ(i),angle=Math.atan2(nz,nx);
   if(angle>=0&&angle<=Math.PI)bands[y<center?0:1].add(Math.min(5,Math.floor(angle/Math.PI*6)));
  }
  assert.ok(bands.every(b=>b.size>=2&&b.size<5),'each stripe has visible gaps');
  assert.notDeepEqual([...bands[0]].sort(),[...bands[1]].sort(),'the two char marks break in different places');
 }
 for(const piece of pieces)piece.geometry.dispose();
});
