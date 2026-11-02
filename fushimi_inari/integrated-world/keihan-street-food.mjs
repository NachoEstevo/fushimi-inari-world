import * as THREE from 'three';

// Original geometry; no copied branding or photo pixels. Hogyokudo's fox
// senbei: https://kyoto-okashi.jp/shop/fushimi_hogyokudo/
// Kyozuan's tofu and matcha: https://kyouzuan-hushimiinariten.take-eats.jp/
// Dango are sold on the approach: https://hirano-seishoan.com/fushimiinari/shop/
// The anonymous grill is interpretive, not an attribution to that business.
export const STREET_FOOD_ITEMS=Object.freeze({
 senbei:Object.freeze(['fox-senbei']),
 'soft-serve':Object.freeze(['tofu','matcha']),
 grill:Object.freeze(['dango']),
});

function foxSenbei(add,packaged){
 const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.026,.012);shape.lineTo(.052,.042);
 shape.lineTo(.059,.103);shape.lineTo(.044,.132);shape.lineTo(.019,.103);shape.lineTo(0,.108);
 shape.lineTo(-.019,.103);shape.lineTo(-.044,.132);shape.lineTo(-.059,.103);shape.lineTo(-.052,.042);shape.lineTo(-.026,.012);shape.closePath();
 const body=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,steps:1}).translate(0,0,-.006);
 add(body,'color','#cfa168');
 for(const side of [-1,1]){
  const eye=new THREE.CircleGeometry(.008,8).scale(1.25,.38,1).rotateZ(-side*.32).translate(side*.025,.069,.0065);
  add(eye,'color','#704728');
 }
 const nose=new THREE.CircleGeometry(.006,6).scale(1,.65,1).translate(0,.035,.0066);add(nose,'color','#704728');
 // A small folded sleeve supports the upright hand-off. Counter replicas are
 // laid directly on their tray and omit it.
 if(packaged)add(new THREE.BoxGeometry(.078,.025,.020).translate(0,.0125,0),'white');
}

function softServe(add,item){
 add(new THREE.CylinderGeometry(.046,.033,.09,10).translate(0,.045,0),'color','#dbc5a1');
 add(new THREE.TorusGeometry(.045,.003,4,12).rotateX(Math.PI/2).translate(0,.09,0),'color','#b79a70');
 const tint=item==='matcha'?'#8a9c6a':'#f2ebd6';
 add(new THREE.ConeGeometry(.035,.095,10).translate(0,.1375,0),'color',tint);
 const points=[];for(let i=0;i<=32;i++){
  const t=i/32,r=.032*(1-.80*t),a=t*Math.PI*5.5;
  points.push(new THREE.Vector3(Math.cos(a)*r,.10+t*.095,Math.sin(a)*r));
 }
 add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.014,5,false),'color',tint);
}

function dango(add,packaged){
 add(new THREE.CylinderGeometry(.003,.003,.23,6).translate(0,.115,0),'color','#ceb789');
 for(let i=0;i<3;i++){
  const y=.087+i*.049,g=new THREE.SphereGeometry(.030,10,6).scale(1,.88,.96).translate(0,y,0);
  add(g,'color',i===1?'#c58e4f':'#dbb979');
  // Small toasted patches are part of the food, not a baked cast shadow.
  const side=new THREE.SphereGeometry(.008,6,4).scale(.35,.65,1).translate(-.028,y+.003,.004);
  const front=new THREE.SphereGeometry(.007,6,4).scale(1,.6,.35).translate(.010,y-.005,.028);
  add(side,'color','#8b5b32');add(front,'color','#936037');
 }
 if(packaged)add(new THREE.CylinderGeometry(.019,.017,.028,8).translate(0,.014,0),'white');
}

// Pose is applied before placement: upright serving, a fox wafer resting face
// up, or a skewer lying across a grill. The existing batch owns all materials.
export function appendStreetFood(batch,kind,item,{position=[0,0,0],pose='upright',packaged=false}={}){
 if(!STREET_FOOD_ITEMS[kind]?.includes(item))return false;
 const pieces=[],add=(geometry,key,color)=>pieces.push({geometry,key,color});
 if(kind==='senbei')foxSenbei(add,packaged);
 else if(kind==='soft-serve')softServe(add,item);
 else dango(add,packaged);
 for(const {geometry,key,color} of pieces){
  if(pose==='flat')geometry.rotateX(-Math.PI/2).translate(0,.006,0);
  else if(pose==='horizontal')geometry.rotateZ(-Math.PI/2);
  geometry.translate(...position);batch.put(geometry,key,color);
 }
 return true;
}
