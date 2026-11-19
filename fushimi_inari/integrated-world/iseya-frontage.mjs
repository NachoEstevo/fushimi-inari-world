// Living Kyo, July 2019, and akiko's January 2016 visit show the same
// timber bay, closed upper shutters, shallow lean-to and inset entrance.
import * as THREE from 'three';

export const iseyaId='way/626313745';
const shrineId='way/626313742';
const sources=[
  'https://livingkyo.com/wp-content/uploads/2019/08/500_19.png',
  'https://4travel.jp/travelogue/11095744#photo_42191868',
];

// Both independent photographs show an uninterrupted paved shop lane ending
// at the stone torii. The surrounding red gate stations are inferred at 1.5 m
// intervals. Limit the exclusion to this identifiable length of public path.
export function iseyaShopLane(features,plan){
  const shop=features.buildings.find(b=>b.id===iseyaId);
  const lane=features.paths.find(p=>p.id==='way/1372826375');
  const bend=features.paths.find(p=>p.id==='way/1372826374');
  if(!shop||!plan?.route?.point||lane?.points.length!==2||!bend||bend.points.length<2)return null;
  const [start,turn]=lane.points,lower=shop.points.find(p=>Math.hypot(p[0]-930.04,p[2]+12.067)<.25);
  if(!lower||Math.hypot(turn[0]-bend.points[0][0],turn[2]-bend.points[0][2])>.1)return null;
  const dx=turn[0]-start[0],dz=turn[2]-start[2],run=Math.hypot(dx,dz);
  const along=((lower[0]-start[0])*dx+(lower[2]-start[2])*dz)/run;
  const first=[start[0]+dx*(along-1.5)/run,0,start[2]+dz*(along-1.5)/run];
  const points=[first,turn,bend.points[1],plan.route.point];
  const sections=points.slice(1).map((b,i)=>{const a=points[i],x=b[0]-a[0],z=b[2]-a[2];return {a,x,z,length2:x*x+z*z};});
  return ({x,z})=>{
    if(Math.abs(x-turn[0])>15||Math.abs(z-turn[2])>15)return null;
    for(const s of sections){
      if(!s.length2)continue;
      const t=((x-s.a[0])*s.x+(z-s.a[2])*s.z)/s.length2;
      if(t>=0&&t<=1&&Math.hypot(x-s.a[0]-t*s.x,z-s.a[2]-t*s.z)<.70)return 'photographed Iseya–Kada paved lane';
    }
    return null;
  };
}

// A single locally drawn atlas serves the black cloth and the hanging #16
// sign visible in both photographs. No external lettering or image requests.
export function paintIseyaSign(ctx){
  ctx.fillStyle='#2c2825';ctx.fillRect(0,0,128,128);
  ctx.fillStyle='#c69c3e';ctx.fillRect(0,0,62,128);
  ctx.fillStyle='#ded1b0';ctx.fillRect(5,4,52,117);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#9c3c31';ctx.font='bold 43px sans-serif';ctx.fillText('●',31,37);
  ctx.fillStyle='#f3dfb3';ctx.font='bold 20px sans-serif';ctx.fillText('16',31,37);
  ctx.fillStyle='#34312b';ctx.font='bold 13px serif';
  ['い','せ','や'].forEach((letter,i)=>ctx.fillText(letter,31,69+15*i));
  // A drawn curtain strip occupies the unused margin between the sign and
  // the cloth lettering. Its four shades follow the fold of the backing.
  for(let x=64;x<84;x++){
    ctx.fillStyle=['#9a9071','#b3a888','#bec3a0','#a7ad91'][Math.floor((x-64)/5)];
    ctx.fillRect(x,0,1,128);
  }
  ctx.fillStyle='#dad4ba';ctx.font='bold 25px serif';
  ['い','せ','や'].forEach((letter,i)=>ctx.fillText(letter,99,29+32*i));
}

export function appendIseya({building,buildings,ring,ground,append}){
  if(building.id!==iseyaId||ring.length!==6||!buildings.some(b=>b.id===shrineId))return null;
  // Identify the documented upper corner and the edge leading downslope from
  // it. The neighbouring end wall is closer to the shrine centroid but faces
  // across, rather than along, the pictured approach. Permit a reordered ring.
  const anchor=p=>Math.hypot(p[0]-935.349,p[2]+6.189)<.25;
  const lower=p=>Math.hypot(p[0]-930.040,p[2]+12.067)<.25;
  const edge=ring.findIndex((p,i)=>anchor(p)&&lower(ring[(i+1)%6])||lower(p)&&anchor(ring[(i+1)%6]));
  if(edge<0)return null;
  const a=ring.find(anchor),b=ring.find(lower),dx=b[0]-a[0],dz=b[2]-a[2],width=Math.hypot(dx,dz);
  const tx=dx/width,tz=dz/width,nx=-tz,nz=tx;
  // u increases downhill, v into the building. All joinery sits on the shop
  // side of the OSM edge. Only the suspended roof projects over the stone toe.
  const at=(u,y,v)=>[a[0]+tx*u+nx*v,y,a[2]+tz*u+nz*v];
  const terrain=ring.map(p=>ground(p[0],p[2])),door=at(width*.70,0,0);
  const floor=ground(door[0],door[2])+.10;
  if(!terrain.every(Number.isFinite)||!Number.isFinite(floor))return null;
  const declared=Number.parseFloat(building.tags?.height),levels=Number.parseFloat(building.tags?.['building:levels']);
  const height=Number.isFinite(declared)?declared:Number.isFinite(levels)?levels*3:4.75;
  if(height<3.9)return null;
  const roofRise=p=>Math.max(0,(p[0]-a[0])*nx+(p[2]-a[2])*nz)*.11;
  const roofY=p=>floor+height+roofRise(p);
  const quad=(kind,p,q,r,s)=>{
    const scale=kind==='timber'||kind==='plaster'?1:3;
    const w=Math.hypot(...p.map((v,i)=>v-q[i]))/scale,h=Math.hypot(...r.map((v,i)=>v-q[i]))/scale;
    for(const [pt,uv] of [[p,[0,0]],[q,[w,0]],[r,[w,h]],[p,[0,0]],[r,[w,h]],[s,[0,h]]])append(kind,pt,uv);
  };
  const rect=(kind,u0,u1,h0,h1,v)=>quad(kind,at(u0,floor+h0,v),at(u1,floor+h0,v),at(u1,floor+h1,v),at(u0,floor+h1,v));
  const shelf=(kind,u0,u1,h,v0,v1)=>quad(kind,at(u0,floor+h,v0),at(u1,floor+h,v0),at(u1,floor+h,v1),at(u0,floor+h,v1));
  const end=(kind,u,h0,h1,v0,v1)=>quad(kind,at(u,floor+h0,v0),at(u,floor+h0,v1),at(u,floor+h1,v1),at(u,floor+h1,v0));
  const foot=(p,y)=>[p[0],y,p[2]];
  // One closed shell follows the six OSM corners, including the rear notch.
  for(let i=0;i<6;i++){
    const j=(i+1)%6,p=ring[i],q=ring[j];
    quad('mineral',foot(p,Math.min(floor-.12,terrain[i]-.12)),foot(q,Math.min(floor-.12,terrain[j]-.12)),foot(q,floor),foot(p,floor));
    if(i!==edge)quad('timber',foot(p,floor),foot(q,floor),foot(q,roofY(q)),foot(p,roofY(p)));
  }
  for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[])){
    for(const i of tri){const p=ring[i];append('roof',foot(p,roofY(p)),[p[0]/3,p[2]/3]);}
  }
  rect('timber',0,width,0,height,.24);
  for(const u of [0,width])end('timber',u,0,height,0,.24);
  // The projecting window box nearest the shrine and the recessed double door
  // are both visible in the two photos. The interior is outside the model.
  const bayEnd=width*.54,doorEnd=width*.84;
  shelf('mineral',0,width,.035,0,.25);
  for(const [lo,hi,v,count] of [[.08,bayEnd,0,3],[bayEnd+.06,doorEnd,.17,2],[doorEnd+.06,width-.08,.10,1]]){
    rect('timber',lo,hi,.045,.57,v);
    rect('glazing',lo,hi,.57,2.18,v);
    for(let i=0;i<=count;i++){
      const u=lo+(hi-lo)*i/count;
      rect('timber',Math.max(lo,u-.035),Math.min(hi,u+.035),.045,2.23,v-.018);
    }
    for(const y of [.11,.56,2.15])rect('timber',lo,hi,y,y+.065,v-.024);
    end('timber',lo,.045,2.23,v,.24);end('timber',hi,.045,2.23,v,.24);
  }
  const cover=(lo,hi,y,depth,rise)=>{
    quad('roof',at(lo,floor+y,.25),at(hi,floor+y,.25),at(hi,floor+y-rise,depth),at(lo,floor+y-rise,depth));
    quad('timber',at(lo,floor+y-.09,.25),at(hi,floor+y-.09,.25),at(hi,floor+y-rise-.09,depth),at(lo,floor+y-rise-.09,depth));
    rect('roof',lo,hi,y-rise-.09,y-rise,depth);
    for(const u of [lo,hi])quad('timber',at(u,floor+y,.25),at(u,floor+y-rise,depth),at(u,floor+y-rise-.09,depth),at(u,floor+y-.09,.25));
  };
  cover(0,width,2.79,-.48,.32);
  const printed=(p,q,r,s,u0,u1)=>{
    for(const [point,uv] of [[p,[u0,.02]],[q,[u1,.02]],[r,[u1,.98]],[p,[u0,.02]],[r,[u1,.98]],[s,[u0,.98]]])append('iseya-sign',point,uv);
  };
  // Pale drawn curtains are visible through the glazing in 2019. Two
  // partially drawn pairs and one door curtain leave glass visible between.
  for(const [u0,u1,v,folds] of [[.21,1.13,0,6],[1.62,2.38,0,5],[bayEnd+.13,bayEnd+.75,.17,4]]){
    for(let i=0;i<folds;i++){
      const lo=u0+(u1-u0)*i/folds,hi=u0+(u1-u0)*(i+1)/folds,mid=(lo+hi)/2;
      const bottom=floor+.68+.016*(i%2),top=floor+2.10;
      printed(at(mid,bottom-.016,v-.016),at(lo,bottom,v-.005),at(lo,top,v-.005),at(mid,top,v-.012),.508,.57);
      printed(at(hi,bottom,v-.005),at(mid,bottom-.016,v-.016),at(mid,top,v-.012),at(hi,top,v-.005),.57,.64);
    }
  }
  // The split valance sits below the awning. Its shop name is confined to
  // one end panel; the projecting number sign can be read from either end.
  for(let i=0;i<8;i++){
    const left=.11+i*(width-.22)/8,right=left+(width-.22)/8-.027,bottom=floor+2.18+(i%3)*.022;
    printed(at(right,bottom,-.37),at(left,bottom+.014,-.37),at(left,floor+2.43,-.31),at(right,floor+2.43,-.31),i===5?.667:.953,i===5?.916:.968);
  }
  const signU=bayEnd+.08,low=floor+1.83,top=floor+2.34,v0=-.43,v1=-.17;
  for(const [u,first,last] of [[signU,v0,v1],[signU+.22,v1,v0]])
    printed(at(u,low,first),at(u,low,last),at(u,top,last),at(u,top,first),.008,.476);
  printed(at(signU+.22,low,v0),at(signU,low,v0),at(signU,top,v0),at(signU+.22,top,v0),.008,.476);
  shelf('timber',signU,signU+.22,1.83,v0,v1);
  rect('plaster',.12,width-.12,2.89,height-.14,.17);
  for(let h=3.05;h<height-.18;h+=.14)rect('roof',.12,width-.12,h,h+.022,.15);
  for(let i=0;i<=5;i++){const u=.12+i*(width-.24)/5;rect('timber',u-.04,u+.04,2.80,height-.10,.13);}
  for(const y of [2.86,3.13])rect('timber',0,width,y,y+.07,.055);
  for(let i=0;i<18;i++){const u=(i+.5)*width/18;rect('timber',u-.035,u+.035,2.87,3.20,.06);}
  cover(0,width,height,-.30,.09);
  // At the uphill turn the viewer sees the end grain of the roof, a corner
  // post and the horizontal timber joint. Continue those structural members
  // along the return. The unphotographed side has no asserted openings.
  const uphill=ring.find(p=>Math.hypot(p[0]-940.458,p[2]+10.809)<.25);
  if(uphill){
    const length=Math.hypot(uphill[0]-a[0],uphill[2]-a[2]);
    const sidePoint=(t,h,out=0)=>[a[0]+(uphill[0]-a[0])*t-tx*out,floor+h,a[2]+(uphill[2]-a[2])*t-tz*out];
    const strip=(t0,t1,h0,h1,out,kind)=>quad(kind,sidePoint(t0,h0,out),sidePoint(t1,h0,out),sidePoint(t1,h1,out),sidePoint(t0,h1,out));
    strip(0,1,2.65,2.78,.035,'timber');
    for(const t of [0,.5,1]){
      const lo=Math.max(0,t-.045/length),hi=Math.min(1,t+.045/length);
      strip(lo,hi,0,height+roofRise(uphill)*lo-.12,.055,'timber');
      quad('timber',sidePoint(lo,0,.005),sidePoint(lo,0,.055),sidePoint(lo,height+roofRise(uphill)*lo-.12,.055),sidePoint(lo,height+roofRise(uphill)*lo-.12,.005));
    }
    const rise=roofRise(uphill);
    quad('roof',sidePoint(0,height,.005),sidePoint(1,height+rise,.005),sidePoint(1,height+rise-.04,.22),sidePoint(0,height-.04,.22));
    quad('timber',sidePoint(0,height-.13,.22),sidePoint(1,height+rise-.13,.22),sidePoint(1,height+rise-.04,.22),sidePoint(0,height-.04,.22));
    quad('timber',sidePoint(0,height-.13,.22),sidePoint(1,height+rise-.13,.22),sidePoint(1,height+rise-.09,0),sidePoint(0,height-.09,0));
  }
  return {id:building.id,kind:'iseya',shrine:shrineId,edge,facadeWidth:width,frontFloor:floor,height,
    base:Math.min(floor,...terrain)-.12,roof:Math.max(...ring.map(roofY)),windowFaces:6,eaveDepth:.48,
    sources,source:sources[0],route:'way/1372826375',dimensions:'OSM six-corner footprint. Two independently photographed views of the shrine approach. Door datum from terrain; all heights, pitch, joinery and unseen rear inferred.'};
}
