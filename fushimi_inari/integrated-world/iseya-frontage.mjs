// Living Kyo, July 2019, and akiko's January 2016 visit show the same
// timber bay, closed upper shutters, shallow lean-to and inset entrance.
import * as THREE from 'three';

export const iseyaId='way/626313745';
const shrineId='way/626313742';
const sources=[
  'https://livingkyo.com/wp-content/uploads/2019/08/500_19.png',
  'https://4travel.jp/travelogue/11095744#photo_42191868',
];

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
  const roofRise=p=>Math.max(0,(p[0]-a[0])*nx+(p[2]-a[2])*nz)*.16;
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
  rect('plaster',.12,width-.12,2.89,height-.14,.17);
  for(let h=3.05;h<height-.18;h+=.14)rect('roof',.12,width-.12,h,h+.022,.15);
  for(let i=0;i<=5;i++){const u=.12+i*(width-.24)/5;rect('timber',u-.04,u+.04,2.80,height-.10,.13);}
  for(const y of [2.86,3.13])rect('timber',0,width,y,y+.07,.055);
  for(let i=0;i<18;i++){const u=(i+.5)*width/18;rect('timber',u-.035,u+.035,2.87,3.20,.06);}
  cover(0,width,height,-.30,.09);
  return {id:building.id,kind:'iseya',shrine:shrineId,edge,facadeWidth:width,frontFloor:floor,height,
    base:Math.min(floor,...terrain)-.12,roof:Math.max(...ring.map(roofY)),windowFaces:6,eaveDepth:.48,
    sources,source:sources[0],route:'way/1372826375',dimensions:'OSM six-corner footprint. Two photographed elevations. Door datum from terrain; all heights, pitch, joinery and unseen rear inferred.'};
}
