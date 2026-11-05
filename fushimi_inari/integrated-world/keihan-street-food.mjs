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

function foxOutline(bitten){
 const s=new THREE.Shape();s.moveTo(0,0);s.quadraticCurveTo(.028,.001,.043,.020);
 s.quadraticCurveTo(.054,.036,.055,.065);
 if(bitten){
  // An irregular bitten edge belongs only to the prebuilt partial serving.
  s.quadraticCurveTo(.044,.059,.036,.066);s.quadraticCurveTo(.025,.057,.015,.065);
  s.quadraticCurveTo(.004,.057,-.006,.064);s.quadraticCurveTo(-.017,.057,-.027,.065);
  s.quadraticCurveTo(-.040,.058,-.055,.065);
 }else{
  s.quadraticCurveTo(.058,.086,.060,.103);s.quadraticCurveTo(.056,.122,.046,.132);
  s.quadraticCurveTo(.033,.127,.020,.108);s.quadraticCurveTo(0,.116,-.020,.108);
  s.quadraticCurveTo(-.033,.127,-.046,.132);s.quadraticCurveTo(-.056,.122,-.060,.103);
  s.quadraticCurveTo(-.058,.086,-.055,.065);
 }
 s.quadraticCurveTo(-.054,.036,-.043,.020);s.quadraticCurveTo(-.028,.001,0,0);s.closePath();return s;
}

function faceRibbon(side,kind){
 const s=new THREE.Shape(),x=value=>side*value;
 if(kind==='eye'){
  s.moveTo(x(.008),.076);s.quadraticCurveTo(x(.023),.097,x(.045),.088);
  s.quadraticCurveTo(x(.029),.088,x(.008),.076);
 }else if(kind==='brow'){
  s.moveTo(x(.009),.082);s.quadraticCurveTo(x(.024),.105,x(.046),.094);
  s.quadraticCurveTo(x(.027),.099,x(.009),.082);
 }else{
  s.moveTo(0,.032);s.quadraticCurveTo(x(.018),.018,x(.035),.035);
  s.quadraticCurveTo(x(.020),.023,0,.035);
 }
 s.closePath();const geometry=new THREE.ShapeGeometry(s,6),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i)/.043,y=(p.getY(i)-.063)/.050;
  p.setZ(i,.00365+.0014*Math.sqrt(Math.max(0,1-x*x-y*y))+.00018);
 }
 return geometry;
}

function foxSenbei(add,packaged){
 // Intact and bitten wafers are prebuilt; changing bites only toggles stages.
 for(const [bitten,stage] of packaged?[[true,1],[false,2]]:[[false,2]]){
  const body=new THREE.ExtrudeGeometry(foxOutline(bitten),{depth:.006,bevelEnabled:true,bevelThickness:.0007,bevelSize:.0007,bevelSegments:1,steps:1,curveSegments:3}).translate(0,0,-.003);
  add(body,'color','#cfa168',stage);
  // The front hemisphere is shallow pressed relief; its hidden rear is omitted.
  const dome=new THREE.SphereGeometry(1,5,6,0,Math.PI,bitten?Math.PI/2:0,bitten?Math.PI/2:Math.PI)
   .scale(.043,.050,.0014).translate(0,.063,.00365);
  add(dome,'color','#d3a873',stage);
 }
 for(const side of [-1,1]){
  add(faceRibbon(side,'eye'),'color','#704728',2);
  add(faceRibbon(side,'brow'),'color','#a87749',2);
  add(faceRibbon(side,'mouth'),'color','#98643d',2);
  if(packaged)add(faceRibbon(side,'mouth'),'color','#98643d',1);
 }
 const nose=()=>new THREE.CircleGeometry(.0035,6).scale(1,.72,1).translate(0,.036,.00512);
 add(nose(),'color','#704728',2);if(packaged)add(nose(),'color','#704728',1);
 if(packaged)add(new THREE.BoxGeometry(.078,.025,.020).translate(0,.0125,0),'white',undefined,0);
}

function softServe(add,item){
 add(new THREE.CylinderGeometry(.046,.033,.09,10).translate(0,.045,0),'color','#dbc5a1',0);
 add(new THREE.TorusGeometry(.045,.003,4,12).rotateX(Math.PI/2).translate(0,.09,0),'color','#b79a70',0);
 const tint=item==='matcha'?'#8a9c6a':'#f2ebd6',radius=t=>.030*(1-.90*t);
 for(let tier=0;tier<3;tier++){
  const from=tier/3,to=(tier+1)/3,h=.095/3;
  add(new THREE.CylinderGeometry(radius(to),radius(from),h,10).translate(0,.10+(tier+.5)*h,0),'color',tint,tier+1);
  const points=[];for(let i=0;i<=16;i++){
   const t=(tier+i/16)/3,r=.030*(1-t),a=t*Math.PI*7;
   points.push(new THREE.Vector3(Math.cos(a)*r,.10+t*.095,Math.sin(a)*r));
  }
  const curve=new THREE.CatmullRomCurve3(points),tube=new THREE.TubeGeometry(curve,16,1,6,false),vertices=tube.attributes.position;
  // Taper each cross-section toward a pointed tip while keeping three stages.
  for(let section=0;section<=16;section++){
   const center=curve.getPointAt(section/16),t=(tier+section/16)/3,r=.013*(1-.65*t)*Math.min(1,(1-t)*8+.08);
   for(let side=0;side<=6;side++){const i=section*7+side;
    vertices.setXYZ(i,center.x+(vertices.getX(i)-center.x)*r,center.y+(vertices.getY(i)-center.y)*r,center.z+(vertices.getZ(i)-center.z)*r);
   }
  }
  tube.computeVertexNormals();add(tube,'color',tint,tier+1);
 }
}

function clipBand(polygon,height,keepAbove,slope,phase){
 const result=[],level=p=>p.y-p.x*slope-p.z*.04+.0010*Math.sin(p.x*135+p.z*80+phase+(keepAbove?0:1.7));
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],da=level(a)-height,db=level(b)-height;
  const insideA=keepAbove?da>=0:da<=0,insideB=keepAbove?db>=0:db<=0;
  if(insideA)result.push(a);
  if(insideA!==insideB)result.push(a.clone().lerp(b,da/(da-db)));
 }
 return result;
}

// Clip broken, slightly uneven char patches against the actual rice facets.
// The 0.1 mm offset avoids z-fighting without adding a second transparent layer.
function grillMarks(ball,y,variant){
 const positions=ball.attributes.position,index=ball.index,triangle=new THREE.Triangle();
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),vertices=[],normals=[],uv=[],colors=[];
 const sectors=[
  [[0,1,3,4,6,7],[1,2,4,5,6,8]],
  [[0,2,3,5,6,7],[0,1,3,5,6,8]],
  [[1,2,4,5,6,8],[0,2,3,5,6,7]],
 ][variant];
 const light=new THREE.Color('#a06d3e'),dark=new THREE.Color('#673a21'),shade=new THREE.Color();
 for(let i=0;i<index.count;i+=3){
  a.fromBufferAttribute(positions,index.getX(i));b.fromBufferAttribute(positions,index.getX(i+1));c.fromBufferAttribute(positions,index.getX(i+2));
  triangle.set(a,b,c).getNormal(normal);
  const angle=(Math.atan2(normal.z,normal.x)+Math.PI*2)%(Math.PI*2),sector=Math.floor(angle/(Math.PI/6));
  for(const [band,[low,high,slope]] of [[y-.011,y-.008,.10],[y+.007,y+.0105,-.08]].entries()){
   if(!sectors[band].includes(sector))continue;
   const phase=variant*1.7+band*2.2;
   const poly=clipBand(clipBand([a.clone(),b.clone(),c.clone()],low,true,slope,phase),high,false,slope,phase);
   shade.copy(light).lerp(dark,.28+.28*(.5+.5*Math.sin(angle*7+phase)));
   for(let j=1;j+1<poly.length;j++)for(const point of [poly[0],poly[j],poly[j+1]]){
    vertices.push(point.x+normal.x*.0001,point.y+normal.y*.0001,point.z+normal.z*.0001);
    normals.push(normal.x,normal.y,normal.z);uv.push(0,0);colors.push(shade.r,shade.g,shade.b);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return geometry;
}

function dango(add,packaged){
 add(new THREE.CylinderGeometry(.003,.003,.23,6).translate(0,.115,0),'color','#ceb789',0);
 for(let i=0;i<3;i++){
  const y=.087+i*.049,stage=i+1,g=new THREE.SphereGeometry(.030,12,8),p=g.attributes.position;
  const cream=new THREE.Color('#dbba82'),caramel=new THREE.Color(i===1?'#92552b':'#a66632'),colors=[];
  for(let j=0;j<p.count;j++){
   const x=p.getX(j),v=p.getY(j),z=p.getZ(j),tint=.20+.62*(.5+.5*Math.sin(x*110+z*70+i*1.2)*Math.cos(v*140-i));
   p.setXYZ(j,x*(i===1?.98:1.01)+.0009*Math.sin(v*80+i),v*(i===1?.90:.86)+y+.0006*Math.sin(x*95+z*70+i),z*(i===2?.94:.97));
   const color=cream.clone().lerp(caramel,tint);colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  add(g,'glaze',i===1?'#c58e4f':'#dbb979',stage);
  add(grillMarks(g,y,i),'color','#8b5b32',stage);
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
  if(kind==='grill')geometry.scale(.8,.8,.8);
  if(pose==='flat')geometry.rotateX(-Math.PI/2).translate(0,.0037,0);
  else if(pose==='horizontal'){geometry.rotateZ(-Math.PI/2);if(kind==='grill')geometry.translate(.023,-.006,0);}
  else if(kind==='senbei'&&stage>0)geometry.translate(0,.0007,0);
  geometry.translate(...position);batch.put(geometry,key,color,stage);
 }
 return true;
}
