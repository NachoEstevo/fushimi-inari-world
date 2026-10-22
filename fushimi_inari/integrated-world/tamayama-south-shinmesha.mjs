import * as THREE from 'three';
import {staticParts,stonePalette,shide} from './mountain-landmarks-geometry.mjs';

export const SOUTH_SHINMESHA_ID='way/305214599';
export function southShinmeshaLayout(features){
  const feature=features.buildings?.find(b=>b.id===SOUTH_SHINMESHA_ID);
  const points=feature?.points;
  if(!points||points.length!==5||!points.every(p=>p.every(Number.isFinite)))return null;
  const a=points[0],b=points[3],back=points[1],width=Math.hypot(a[0]-b[0],a[2]-b[2]),depth=Math.hypot(back[0]-a[0],back[2]-a[2]);
  if(width<4||width>6||depth<4||depth>6)return null;
  return {id:SOUTH_SHINMESHA_ID,center:[(a[0]+points[2][0])/2,(a[2]+points[2][2])/2],
    yaw:-Math.atan2(a[2]-b[2],a[0]-b[0]),width,depth,
    heightStatus:'Estimated facade/roof proportions from October 2016 photograph; not surveyed',
    source:'https://plaza.rakuten.co.jp/asobikokoro2/diary/201610090000/'};
}

/** Southern, second Shinme pavilion. The smaller horse beside Tamayama is separate. */
export function buildTamayamaSouthShinmesha(root,materials,features,surfaces,colliders,options={}){
  const name='Southern Shinme pavilion R91',existing=root.getObjectByName(name);
  if(existing)return existing.userData;
  const plan=southShinmeshaLayout(features);if(!plan)return {built:false,reason:'unrecognized-footprint'};
  const {center:[x,z],width:w,depth:d}=plan;
  const frontDistance=d/2+.1;
  const floor=surfaces.height(x-Math.sin(plan.yaw)*frontDistance,z-Math.cos(plan.yaw)*frontDistance);
  if(!Number.isFinite(floor))return {built:false,reason:'invalid-floor'};
  const group=new THREE.Group();group.name=name;group.position.set(x,floor,z);group.rotation.y=plan.yaw;
  const p=stonePalette(materials),green=new THREE.MeshStandardMaterial({color:'#315a4d',roughness:.87}),parts=staticParts(group);
  const front=-d/2,back=d/2,wall=3.60,half=w/2,frontZ=front-.015;
  // Stone plinth occupies the registered footprint. Public route runs east of it.
  // Conservative skirt down to the lowest actual rendered triangle touching
  // the footprint. This is hidden support, not an invented change in ground.
  let foundationBottom=floor-.05;
  const positions=options.terrainPositions;
  if(positions){
    const c=Math.cos(plan.yaw),s=Math.sin(plan.yaw),pad=.03;
    for(let i=0;i<positions.length;i+=9){
      const local=[];
      for(let j=0;j<3;j++){const dx=positions[i+j*3]-x,dz=positions[i+j*3+2]-z;local.push([c*dx-s*dz,s*dx+c*dz,positions[i+j*3+1]]);}
      if(Math.max(...local.map(p=>p[0]))<-w/2-pad||Math.min(...local.map(p=>p[0]))>w/2+pad||Math.max(...local.map(p=>p[1]))<-d/2-pad||Math.min(...local.map(p=>p[1]))>d/2+pad)continue;
      foundationBottom=Math.min(foundationBottom,...local.map(p=>p[2]-.04));
    }
  }
  const bottom=foundationBottom-floor;
  parts.box(w,.23-bottom,d,0,(.23+bottom)/2,0,p.stone);
  parts.box(w,.12,d,0,.29,0,p.shaded);
  for(const side of [-1,1]){
    parts.box(.18,wall,d-.2,side*(half-.09),.35+wall/2,0,p.paper);
    for(const zz of [front+.1,back-.1]){const columnHeight=zz<0?3.35:wall;parts.box(.25,columnHeight,.25,side*(half-.13),.35+columnHeight/2,zz,p.red);}
    parts.box(.2,.17,d,side*(half-.1),.52,0,p.red);
    parts.box(.2,.19,d,side*(half-.1),3.58,0,p.red);
  }
  parts.box(w-.25,wall,.16,0,.35+wall/2,back-.08,p.paper);
  // Front photograph shows broad white side panels and a central green lattice.
  const opening=w*.52;
  for(const side of [-1,1]){
    const sideWidth=(w-opening)/2;
    parts.box(sideWidth,wall,.16,side*(opening/2+sideWidth/2),.35+wall/2,front+.08,p.paper);
    parts.box(.22,3.35,.23,side*(opening/2+.09),.35+3.35/2,front+.05,p.red);
    parts.box(.12,2.63,.15,side*(half-.55),1.95,frontZ,p.red);
  }
  parts.box(w,.2,.25,0,.48,front+.04,p.red);
  parts.box(w,.23,.28,0,3.58,front+.03,p.red);
  // Recessed dark interior and open geometric lattice avoid an opaque glass box.
  parts.box(opening,2.75,.04,0,1.86,front+1.55,p.dark);
  // White standing horse is visible behind the lattice (2014 close view).
  // Low-poly silhouette only; no invented dedication lettering or anatomy detail.
  const oval=(rx,ry,rz,xx,yy,zz,mat)=>parts.put(new THREE.SphereGeometry(1,12,8).scale(rx,ry,rz).translate(xx,yy,zz),mat);
  const hz=front+.66;
  oval(.73,.38,.26,.03,1.54,hz,p.paper);
  oval(.19,.60,.20,-.53,1.97,hz,p.paper);
  oval(.34,.18,.19,-.72,2.43,hz,p.paper);
  for(const xx of [-.49,.52])for(const zz of [hz-.15,hz+.15])parts.beam([xx,1.45,zz],[xx+.05,.62,zz],.064,p.paper,.074,8);
  for(const xx of [-.68,-.48])parts.beam([xx,2.51,hz],[xx-.015,2.72,hz],.055,p.paper,.015,6);
  parts.beam([.64,1.7,hz],[.90,.99,hz],.045,p.dark,.025,8);
  oval(.37,.11,.28,.06,1.88,hz,p.metal);
  for(let i=0;i<=10;i++)parts.box(.035,2.60,.055,-opening/2+opening*i/10,1.82,frontZ,green);
  for(let i=0;i<=9;i++)parts.box(opening,.035,.055,0,.52+2.60*i/9,frontZ,green);
  parts.box(.085,2.64,.09,0,1.84,front-.025,green);
  // Cloth valance and rope are present in the independent 2014 close photograph.
  for(let i=0;i<5;i++)parts.box(opening/5-.025,.31,.035,-opening/2+opening*(i+.5)/5,3.25,front-.06,p.paper);
  parts.beam([-opening/2,3.05,front-.10],[opening/2,3.05,front-.10],.035,p.straw,.035,8);
  for(const xx of [-.65,0,.65])shide(parts,xx,3.01,front-.12,.22,p.paper);
  // Photo-estimated curved gable, with ridge running from front to back.
  const roofHalf=half+.48,roofFront=front-.48,roofBack=back+.42;
  const roofY=u=>5.25-1.38*Math.pow(Math.abs(u)/roofHalf,.65)+.17*Math.pow(Math.abs(u)/roofHalf,7);
  for(const side of [-1,1])for(let i=0;i<20;i++){
    const a=side*roofHalf*i/20,b=side*roofHalf*(i+1)/20,ya=roofY(a),yb=roofY(b);
    const tri=[[a,ya,roofFront],[b,yb,roofFront],[a,ya,roofBack],[a,ya,roofBack],[b,yb,roofFront],[b,yb,roofBack]];
    if(side>0){[tri[1],tri[2]]=[tri[2],tri[1]];[tri[4],tri[5]]=[tri[5],tri[4]];}
    parts.sheet(tri.flat(),p.roof);
    for(const zz of [roofFront,roofBack]){
      parts.sheet([a,ya,zz,a,ya-.17,zz,b,yb,zz,b,yb,zz,a,ya-.17,zz,b,yb-.17,zz],p.dark);
      parts.beam([a,ya-.21,zz+.025],[b,yb-.21,zz+.025],.065,p.red,.065,6);
    }
  }
  for(const zz of [front+.08,back-.08]){
    for(let i=0;i<40;i++){
      const a=-half+w*i/40,b=-half+w*(i+1)/40,ya=roofY(a)-.2,yb=roofY(b)-.2;
      parts.sheet([a,3.68,zz,b,3.68,zz,a,ya,zz,a,ya,zz,b,3.68,zz,b,yb,zz],p.paper);
    }
    for(const side of [-1,1])parts.beam([side*(half-.12),3.77,zz-.03],[0,5.01,zz-.03],.065,p.red,.065,6);
    parts.box(.15,1.33,.15,0,4.35,zz,p.red);
    parts.box(w,.17,.18,0,3.72,zz,p.red);
  }
  parts.beam([0,5.28,roofFront],[0,5.28,roofBack],.10,p.dark,.10,8);
  const stats=parts.flush();root.add(group);
  // Solid pavilion, front is a display window. Collision stays inside mapped walls.
  colliders.push({type:'box',args:[x,z,w/2,d/2,plan.yaw,floor,floor+3.75,'south-shinmesha']});
  group.userData={built:true,...plan,floor,foundationBottom,...stats,builtIds:[SOUTH_SHINMESHA_ID]};return group.userData;
}
