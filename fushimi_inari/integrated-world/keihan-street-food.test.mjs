import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {appendStreetFood} from './keihan-street-food.mjs';

function capture(kind,item,options){
 const pieces=[],batch={put:(geometry,key,color)=>pieces.push({geometry,key,color})};
 assert.equal(appendStreetFood(batch,kind,item,options),true);return pieces;
}
const bounds=piece=>{piece.geometry.computeBoundingBox();return piece.geometry.boundingBox;};

test('fox senbei has two pointed ears and baked facial detail while resting on its tray',()=>{
 const pieces=capture('senbei','fox-senbei',{pose:'flat'}),body=pieces[0].geometry,p=body.attributes.position;
 const box=bounds(pieces[0]);assert.ok(Math.abs(box.min.y)<1e-6&&Math.abs(box.max.y-.012)<1e-6);
 const ears=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getZ(i)]).filter(([,z])=>z<-.12);
 assert.ok(ears.some(([x])=>x>.035)&&ears.some(([x])=>x<-.035),'both ears are part of the silhouette');
 assert.ok(pieces.filter(p=>p.color==='#704728').length>=3,'eyes and nose are physical baked marks');
 for(const piece of pieces)piece.geometry.dispose();
});

test('three rounded dango touch the grill independently and a skewer passes through them',()=>{
 const pieces=capture('grill','dango',{position:[0,1.141,0],pose:'horizontal'});
 const stick=bounds(pieces[0]),balls=pieces.filter(p=>['#c58e4f','#dbb979'].includes(p.color));
 assert.equal(balls.length,3);assert.ok(stick.max.x-stick.min.x>.22);
 const centers=balls.map(p=>{const b=bounds(p);assert.ok(Math.abs(b.min.y-1.111)<.002);return (b.min.x+b.max.x)/2;}).sort((a,b)=>a-b);
 assert.ok(centers[1]-centers[0]>.045&&centers[2]-centers[1]>.045);
 assert.ok(pieces.filter(p=>p.color==='#8b5b32').length===3,'restrained toasted patches are modeled');
 for(const piece of pieces)piece.geometry.dispose();
});

test('tofu soft serve combines a supported cup and a piped spiral in the chosen flavor',()=>{
 for(const [item,color] of [['tofu','#f2ebd6'],['matcha','#8a9c6a']]){
  const pieces=capture('soft-serve',item,{}),cup=pieces[0],spiral=pieces.find(p=>p.geometry.type==='TubeGeometry');
  assert.ok(Math.abs(bounds(cup).min.y)<1e-6);assert.ok(spiral&&spiral.color===color);
  const b=bounds(spiral);assert.ok(b.max.y-b.min.y>.10&&b.max.y<.22);
  assert.ok(pieces.some(p=>p.geometry.type==='ConeGeometry'&&p.color===color),'spiral is filled rather than hollow');
  for(const piece of pieces)piece.geometry.dispose();
 }
});
