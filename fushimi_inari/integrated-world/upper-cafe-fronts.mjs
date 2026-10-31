// Architectural motifs from firsthand 2019 photographs:
// https://livingkyo.com/2699/ (Tsujitei and Okamoto). Footprints are OSM;
// exact bay spacing, height and which edge faces the shrine are inferred.
const SHOPS=new Map([
 ['way/626313740',{shrine:'way/626313736',kind:'tsujitei'}],
 ['way/626313752',{shrine:'way/626313751',kind:'okamoto'}],
]);
export const isReferencedUpperCafe=building=>SHOPS.has(building.id);
// The exterior photos show low shopfronts; exact dimensions are not surveyed.
export const upperCafeInferredHeight=building=>SHOPS.get(building.id)?.kind==='tsujitei'?3.1:SHOPS.has(building.id)?3.3:null;

// Append shallow, opaque details to the existing facade buckets. No extra
// building, floor, collider, texture, or per-frame work is introduced.
export function upperCafeFront({building,buildings,ring}){
 const spec=SHOPS.get(building.id),shrine=spec&&buildings.find(b=>b.id===spec.shrine);
 if(!shrine||ring.length<3)return null;
 const center=ring.reduce((p,q)=>[p[0]+q[0]/ring.length,p[1]+q[2]/ring.length],[0,0]);
 const target=shrine.points.reduce((p,q)=>[p[0]+q[0]/shrine.points.length,p[1]+q[2]/shrine.points.length],[0,0]);
 let best=null;
 for(let i=0;i<ring.length;i++){
  const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  if(length<2.8)continue;
  const t=Math.max(0,Math.min(1,((target[0]-a[0])*dx+(target[1]-a[2])*dz)/(length*length)));
  const distance=Math.hypot(target[0]-a[0]-t*dx,target[1]-a[2]-t*dz);
  if(!best||distance<best.distance)best={a,b,dx,dz,length,distance,edge:i};
 }
 if(!best)return null;
 return {...best,spec,center};
}

export function appendUpperCafeFront({building,buildings,ring,base,roof,append,front=upperCafeFront({building,buildings,ring})}){
 if(!front||roof-base<2.4)return null;
 const {spec,center,...best}=front;
 const {a,dx,dz,length,edge}=best,ux=dx/length,uz=dz/length;
 let nx=-uz,nz=ux;
 if(nx*(center[0]-(a[0]+best.b[0])/2)+nz*(center[1]-(a[2]+best.b[2])/2)>0){nx=-nx;nz=-nz;}
 const margin=Math.min(.3,length*.08),width=length-2*margin;
 const rect=(kind,u0,y0,u1,y1,offset)=>{
  const p=(u,y)=>[a[0]+ux*u+nx*offset,base+y,a[2]+uz*u+nz*offset];
  const pts=[p(u0,y0),p(u1,y0),p(u1,y1),p(u0,y1)],uw=kind==='cloth'?1:(u1-u0)/3,vh=kind==='cloth'?1:(y1-y0)/3,uv=[[0,0],[uw,0],[uw,vh],[0,vh]];
  for(const i of [0,1,2,0,2,3])append(kind,pts[i],uv[i]);
 };
 if(spec.kind==='tsujitei'){
  // Dark hanging cloth over timber-framed offering shelves; simplified goods.
  rect('roof',margin,.18,length-margin,2.52,.018);
  rect('timber',margin,.20,length-margin,1.68,.025);
  for(let i=0;i<=4;i++){const u=margin+width*i/4;rect('roof',u-.035,.20,u+.035,1.72,.035);}
  for(const y of [.50,.83,1.16,1.49])rect('roof',margin,y,length-margin,y+.045,.038);
  const cols=Math.min(24,Math.max(8,Math.floor(width/.22)));
  for(let row=0;row<3;row++)for(let i=0;i<cols;i++){
   const u=margin+width*(i+.5)/cols,w=Math.min(.055,width/cols*.25),y=.55+row*.33;
   rect(i%3?'plaster':'mineral',u-w,y,u+w,y+.17,.043);
  }
  // Individual narrow dark-brown noren panels, with small open seams.
  const panels=Math.ceil(width);for(let i=0;i<panels;i++)rect('cloth',margin+width*i/panels+.015,1.72,margin+width*(i+1)/panels-.015,2.48,.046);
 }else{
  // Glazed timber frontage and ochre valance; the pictured brick is a narrow
  // side pier, rather than a brick wall across the entire shop front.
  const pier=margin+width*.84;
  rect('roof',margin,.12,pier,2.45,.018);
  for(let i=0;i<=5;i++){const u=margin+(pier-margin)*i/5;rect('timber',u-.035,.12,u+.035,2.45,.026);}
  rect('timber',margin,.65,pier,.70,.027);rect('timber',margin,1.93,pier,1.99,.027);
  rect('awning',margin,2.02,pier,2.48,.032);
  rect('brick',pier,.12,length-margin,2.45,.018);
  for(let row=0;row<8;row++){
   const y=.12+row*.29;rect('roof',pier,y,length-margin,y+.018,.024);
   for(let u=pier+(row%2?.30:0);u<length-margin;u+=.60)rect('roof',u,y,Math.min(u+.018,length-margin),Math.min(y+.29,2.45),.025);
  }
 }
 return {id:building.id,shrine:spec.shrine,edge,kind:spec.kind,facadeWidth:width,source:'https://livingkyo.com/2699/'};
}
