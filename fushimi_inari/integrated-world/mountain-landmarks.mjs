import * as THREE from 'three';
import {ainomineBuildingId,ainomineLayout,ainomineApproach,makeAinomineToriiExclusion} from './mountain-landmarks-layout.mjs';
import {stonePalette,staticParts,curvedLintel,shide,stoneLantern,simpleOfferingTorii,riceSheafCrestGeometry} from './mountain-landmarks-geometry.mjs';

function prism(parts,top,bottom,material){
  let area=0;for(let i=0;i<top.length;i++){const a=top[i],b=top[(i+1)%top.length];area+=a[0]*b[2]-b[0]*a[2];}
  const vertices=[];
  for(let i=1;i<top.length-1;i++)vertices.push(...top[0],...(area>0?top[i+1]:top[i]),...(area>0?top[i]:top[i+1]));
  for(let i=0;i<top.length;i++){
    const a=top[i],b=top[(i+1)%top.length],ba=[a[0],bottom[i],a[2]],bb=[b[0],bottom[(i+1)%top.length],b[2]];
    if(area>0)vertices.push(...a,...b,...ba,...b,...bb,...ba);
    else vertices.push(...a,...ba,...b,...b,...ba,...bb);
  }
  parts.sheet(vertices,material);
}

function stoneGate(parts,plan,palette,surfaces){
  const {stone,shaded}=palette,z=plan.gateV;
  for(const side of [-1,1]){
    const u=side*plan.gateHalfSpan,[x,wz]=plan.world(u,z),seat=Math.min(-.035,surfaces.height(x,wz)-plan.floor-.04);
    parts.box(.43,.10-seat,.43,u,(seat+.10)/2,z,shaded);
    // Two gently tapered stone sections. A recessed seam separates them;
    // the inclination remains inside the same .18 m physical pillar radius.
    parts.beam([u,.10,z],[u,1.42,z],.18,stone,.166);
    parts.beam([u,1.432,z],[u,2.70,z],.166,stone,.148);
    parts.beam([u,1.418,z],[u,1.434,z],.164,shaded);
  }
  curvedLintel(parts,3.52,.22,.39,0,2.92,z,stone,.15);
  curvedLintel(parts,3.28,.115,.31,0,2.755,z,shaded,.12);
  parts.box(3.05,.15,.24,0,2.36,z,stone);
  // Nune torii's defining pair of sasutsuka struts, not a red torii variant.
  for(const side of [-1,1]){
    const a=new THREE.Vector3(side*.72,2.43,z),b=new THREE.Vector3(side*.07,2.72,z),d=b.clone().sub(a);
    const geometry=new THREE.BoxGeometry(.095,d.length(),.16);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));
    parts.put(geometry.translate(...a.add(b).multiplyScalar(.5).toArray()),stone);
  }
  parts.box(.16,.31,.18,0,2.56,z,stone);
}

function sanctuary(parts,plan,palette){
  const {wood,dark,roof,red,paper,straw,shaded,stone,metal}=palette;
  parts.box(2.95,2.38,.15,0,1.19,-.70,wood);
  // Restrained plank and joinery relief, reused in the static material batch.
  for(let u=-1.38;u<1.4;u+=.17)parts.box(.013,2.26,.016,u,1.18,-.613,dark);
  for(const side of [-1,1]){
    parts.box(.18,2.44,.18,side*1.43,1.22,.28,wood);
    parts.box(.18,2.44,.18,side*1.43,1.22,-.64,wood);
    parts.box(.13,.15,1.40,side*1.43,2.36,-.13,wood);
    parts.box(.15,.70,1.02,side*1.45,.41,-.20,wood);
  }
  parts.box(3.22,.17,.18,0,2.40,.30,wood);
  parts.box(2.98,.12,.14,0,.72,-.63,wood);
  const {halfWidth:halfW,back,front,eave,ridge}=plan.roof;
  for(const side of [-1,1]){
    parts.sheet([0,ridge,back,0,ridge,front,side*halfW,eave,back,
      side*halfW,eave,back,0,ridge,front,side*halfW,eave,front],roof);
    parts.box(.10,.13,front-back+.1,side*halfW,eave-.04,(front+back)/2,wood);
  }
  parts.sheet([-halfW,2.47,front,halfW,2.47,front,0,3.09,front],wood);
  for(let u=-halfW+.12;u<halfW;u+=.22){
    const y=ridge-(ridge-eave)*Math.abs(u)/halfW;
    parts.beam([u,y+.018,back],[u,y+.018,front],.014,roof);
  }
  parts.box(.12,.10,front-back+.14,0,ridge+.035,(front+back)/2,roof);
  for(const v of [front+.018,back-.018])for(const side of [-1,1])parts.beam([0,ridge+.04,v],[side*halfW,eave,v],.045,wood);
  parts.box(1.22,.44,.63,0,.22,-.27,shaded);
  parts.box(1.32,.10,.72,0,.49,-.27,stone);
  const stele=new THREE.BoxGeometry(.64,.91,.22,10,4,1),position=stele.attributes.position;
  for(let i=0;i<position.count;i++)if(position.getY(i)>.18){
    const x=position.getX(i)/.32,t=(position.getY(i)-.18)/(.455-.18);
    position.setY(i,position.getY(i)-t*.14*(1-Math.sqrt(Math.max(0,1-x*x))));
  }
  stele.computeVertexNormals();parts.put(stele.translate(0,1.005,-.43),shaded);
  parts.box(.93,.27,.36,0,.80,.12,wood);
  for(let u=-.41;u<=.42;u+=.105)parts.box(.032,.025,.33,u,.95,.12,dark);
  for(const side of [-1,1])simpleOfferingTorii(parts,side*.46,.54,-.32,.72,red,dark);

  // The September 2018 Zen Mind Kyoto panorama resolves the paired rice-sheaf
  // crests and the curtain gathered at its centre. Lettering is not copied.
  const clothZ=(u,y)=>.40+.012*Math.sin(u*25)+.004*Math.cos(y*7);
  const crestTemplate=riceSheafCrestGeometry();
  for(const side of [-1,1]){
    const geometry=new THREE.PlaneGeometry(1.25,.64,16,3),p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const u=p.getX(i)+side*.625,t=(.32-p.getY(i))/.64,lower=1.60+.28*Math.pow(1-Math.abs(u)/1.25,1.5);
      const y=2.25-(2.25-lower)*t;p.setXYZ(i,u,y,clothZ(u,y));
    }
    geometry.computeVertexNormals();parts.put(geometry,red);
    const crest=crestTemplate.clone().translate(side*.77,1.89,0),cp=crest.attributes.position;
    for(let i=0;i<cp.count;i++)cp.setZ(i,clothZ(cp.getX(i),cp.getY(i))+.004);
    parts.put(crest,paper);
  }
  crestTemplate.dispose();
  parts.box(.11,.09,.055,0,1.88,.44,red);
  for(let i=0;i<10;i++){
    const u=-1.48+i*.296,v=-1.48+(i+1)*.296;
    parts.beam([u,2.35-.045*Math.cos(u),.46],[v,2.35-.045*Math.cos(v),.46],.027,straw);
  }
  for(const u of [-1.12,-.48,.48,1.12])shide(parts,u,2.32,.48,.40,paper);
  parts.beam([0,2.25,.52],[0,.74,.52],.027,straw);
  parts.beam([.031,1.71,.54],[.031,.72,.54],.012,red);
  // A pale cloth strip and red binding join the existing hanging central tie.
  parts.sheet([-.023,1.72,.55,-.009,1.72,.55,-.005,.76,.565,
    -.005,.76,.565,-.009,1.72,.55,.009,.76,.565],paper);
  parts.box(.085,.10,.075,0,1.14,.535,red);
  parts.put(new THREE.SphereGeometry(.083,12,8).scale(1,1.15,1).translate(0,2.17,.52),metal);
}

/** Call after mapped path surfaces exist and before static merge/floor extraction. */
export function buildAinomine(root,features,surfaces,materials,colliders){
  if(root.children.some(g=>g.userData?.mountainLandmark==='ainomine'))return null;
  const plan=ainomineLayout(features,surfaces.height);if(!plan)return null;
  const group=new THREE.Group();group.name='Ainomine · stone nune torii and Kada-sha';
  group.position.set(...plan.center);group.rotation.y=plan.yaw;
  group.userData={mountainLandmark:'ainomine',osm:ainomineBuildingId,
    reference:'https://inari.jp/en/map/spot_12/',photo:'https://inari.jp/en/wp-content/uploads/2016/09/ainomine.jpg',
    curtainReference:'Google Maps 360, Zen Mind Kyoto, September 2018, panorama CIHM0ogKEICAgICE3p3atQE',
    provenance:plan.provenance,estimatedGateHeight:3.18,estimatedGatePostSpan:plan.gateHalfSpan*2};
  const palette=stonePalette(materials),parts=staticParts(group);
  const localPoint=p=>[(p[0]-plan.center[0])*plan.right[0]+(p[2]-plan.center[2])*plan.right[1],p[1]-plan.floor,
    (p[0]-plan.center[0])*plan.front[0]+(p[2]-plan.center[2])*plan.front[1]];
  const platform=plan.polygon.map(p=>localPoint([p[0],plan.floor,p[2]]));
  prism(parts,platform,plan.polygon.map(p=>surfaces.height(p[0],p[2])-plan.floor-.06),palette.floor);
  const approach=ainomineApproach(plan,surfaces.height);
  for(const step of approach)prism(parts,step.polygon.map(localPoint),step.bottom.map(h=>h-plan.floor),palette.floor);
  stoneGate(parts,plan,palette,surfaces);
  sanctuary(parts,plan,palette);
  for(const side of [-1,1]){
    const u=side*1.89,v=plan.lanternV,[x,z]=plan.world(u,v),seat=Math.min(0,surfaces.height(x,z)-plan.floor);
    stoneLantern(parts,u,v,seat,palette);
  }
  const geometry=parts.flush();root.add(group);colliders.push(...plan.solids);
  const anchor={id:'ainomine',label:'Ainomine · Kada-sha',osm:ainomineBuildingId,target:[...plan.center],radius:0,
    checkpoint:[...plan.route.point],lookAt:[plan.center[0],plan.floor+1.3,plan.center[2]]};
  const stats={...geometry,steps:approach.length,colliders:plan.solids.length,
    sourceBuilding:ainomineBuildingId,mappedFootprint:[plan.width,plan.depth],
    sourceAltitude:plan.sourcePoint[1],platformAltitude:plan.floor,provenance:plan.provenance};
  group.userData.stats=stats;
  return {group,anchor,builtIds:[ainomineBuildingId],stats,plan,excludeGate:makeAinomineToriiExclusion(plan,approach)};
}
