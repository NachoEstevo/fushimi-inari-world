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
 // The intact wafer and the bitten wafer are prebuilt variants, so the intact
 // silhouette stays seamless and no geometry changes when a bite is taken.
 const lower=new THREE.Shape();lower.moveTo(0,0);lower.lineTo(.026,.012);lower.lineTo(.052,.042);
 lower.lineTo(.0546,.065);lower.lineTo(-.0546,.065);lower.lineTo(-.052,.042);lower.lineTo(-.026,.012);lower.closePath();
 const full=new THREE.Shape();full.moveTo(0,0);full.lineTo(.026,.012);full.lineTo(.052,.042);
 full.lineTo(.059,.103);full.lineTo(.044,.132);full.lineTo(.019,.103);full.lineTo(0,.108);
 full.lineTo(-.019,.103);full.lineTo(-.044,.132);full.lineTo(-.059,.103);full.lineTo(-.052,.042);full.lineTo(-.026,.012);full.closePath();
 for(const [shape,stage] of packaged?[[lower,1],[full,2]]:[[full,2]]){
  const body=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelThickness:.0006,bevelSize:.0006,bevelSegments:1,steps:1}).translate(0,0,-.006);
  add(body,'color','#cfa168',stage);
 }
 for(const side of [-1,1]){
  const eye=new THREE.CircleGeometry(.008,8).scale(1.25,.38,1).rotateZ(-side*.32).translate(side*.025,.069,.0068);
  add(eye,'color','#704728',2);
 }
 const nose=()=>new THREE.CircleGeometry(.006,6).scale(1,.65,1).translate(0,.035,.0068);
 add(nose(),'color','#704728',2);if(packaged)add(nose(),'color','#704728',1);
 if(packaged)add(new THREE.BoxGeometry(.078,.025,.020).translate(0,.0125,0),'white',undefined,0);
}

function softServe(add,item){
 add(new THREE.CylinderGeometry(.046,.033,.09,10).translate(0,.045,0),'color','#dbc5a1',0);
 add(new THREE.TorusGeometry(.045,.003,4,12).rotateX(Math.PI/2).translate(0,.09,0),'color','#b79a70',0);
 const tint=item==='matcha'?'#8a9c6a':'#f2ebd6',radius=t=>.035*(1-.82*t);
 for(let tier=0;tier<3;tier++){
  const from=tier/3,to=(tier+1)/3,h=.095/3;
  add(new THREE.CylinderGeometry(radius(to),radius(from),h,10).translate(0,.10+(tier+.5)*h,0),'color',tint,tier+1);
  const points=[];for(let i=0;i<=12;i++){
   const t=(tier+i/12)/3,r=.032*(1-.80*t),a=t*Math.PI*5.5;
   points.push(new THREE.Vector3(Math.cos(a)*r,.10+t*.095,Math.sin(a)*r));
  }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.014*(1-.30*(tier+.5)/3),5,false),'color',tint,tier+1);
 }
}

function toastedMark(ball,target,radius){
 const positions=ball.attributes.position,index=ball.index,triangle=new THREE.Triangle();
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),mid=new THREE.Vector3();
 let nearest=Infinity,center,normal;
 for(let i=0;i<index.count;i+=3){
  a.fromBufferAttribute(positions,index.getX(i));b.fromBufferAttribute(positions,index.getX(i+1));c.fromBufferAttribute(positions,index.getX(i+2));
  triangle.set(a,b,c);triangle.getMidpoint(mid);const distance=mid.distanceToSquared(target);
  if(distance<nearest){nearest=distance;center=mid.clone();normal=triangle.getNormal(new THREE.Vector3());}
 }
 const mark=new THREE.CircleGeometry(radius,6);
 mark.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal));
 return mark.translate(...center.addScaledVector(normal,.00012).toArray());
}

function dango(add,packaged){
 add(new THREE.CylinderGeometry(.003,.003,.23,6).translate(0,.115,0),'color','#ceb789',0);
 for(let i=0;i<3;i++){
  const y=.087+i*.049,stage=i+1,g=new THREE.SphereGeometry(.030,10,6).scale(1,.88,.96).translate(0,y,0);
  add(g,'color',i===1?'#c58e4f':'#dbb979',stage);
  // Place marks just above actual sphere facets rather than attaching raised
  // little spheres; this stays flat even on the low-poly grilled replicas.
  const side=toastedMark(g,new THREE.Vector3(-.030,y+.003,.004),.003);
  const front=toastedMark(g,new THREE.Vector3(.010,y-.005,.0288),.003);
  add(side,'color','#8b5b32',stage);add(front,'color','#936037',stage);
  // A restrained translucent-looking sauce highlight uses an opaque glossy
  // finish: no transparent draw layers or per-food lights.
  const glaze=toastedMark(g,new THREE.Vector3(-.008,y+.006,.0288),.0025);
  add(glaze,'glaze','#a96d38',stage);
 }
 if(packaged)add(new THREE.CylinderGeometry(.019,.017,.028,8).translate(0,.014,0),'white',undefined,0);
}

// Pose is applied before placement: upright serving, a fox wafer resting face
// up, or a skewer lying across a grill. Stage 0 is the inedible support.
export function appendStreetFood(batch,kind,item,{position=[0,0,0],pose='upright',packaged=false}={}){
 if(!STREET_FOOD_ITEMS[kind]?.includes(item))return false;
 const pieces=[],add=(geometry,key,color,stage=0)=>pieces.push({geometry,key,color,stage});
 if(kind==='senbei')foxSenbei(add,packaged);
 else if(kind==='soft-serve')softServe(add,item);
 else dango(add,packaged);
 for(const {geometry,key,color,stage} of pieces){
  if(pose==='flat')geometry.rotateX(-Math.PI/2).translate(0,.0066,0);
  else if(pose==='horizontal')geometry.rotateZ(-Math.PI/2);
  else if(kind==='senbei'&&stage>0)geometry.translate(0,.0007,0);
  geometry.translate(...position);batch.put(geometry,key,color,stage);
 }
 return true;
}
