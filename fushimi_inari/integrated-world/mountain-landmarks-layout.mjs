import {isWalkable,pathWidth} from '../geography/geo-core.mjs';

export const ainomineBuildingId='way/626313742';

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];

function nearbySegments(features,center){
  const segments=[];
  for(const path of features.paths??[]){
    if(!isWalkable(path.tags??{}))continue;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
      if(length<.001)continue;
      const t=Math.max(0,Math.min(1,((center[0]-a[0])*dx+(center[2]-a[2])*dz)/(length*length)));
      const point=[a[0]+dx*t,a[1]+(b[1]-a[1])*t,a[2]+dz*t],distance=Math.hypot(center[0]-point[0],center[2]-point[2]);
      if(distance<16)segments.push({id:path.id,a,b,point,distance,width:pathWidth(path.tags),direction:[dx/length,dz/length]});
    }
  }
  return segments.sort((a,b)=>a.distance-b.distance);
}

/**
 * Geographic placement only. The mapped 1.67 x 3.24 m building is retained;
 * the stone gate and furnishings are estimates from the official photograph.
 * No source paths, source elevations, or terrain function are modified.
 */
export function ainomineLayout(features,surfaceHeight){
  const building=features.buildings?.find(b=>b.id===ainomineBuildingId);
  const poi=features.pois?.find(p=>p.id===ainomineBuildingId);
  if(!building||!poi||!Array.isArray(building.points)||building.points.length<4)return null;
  const polygon=building.points.slice(0,-1),center=[...poi.point];
  if(!center.every(Number.isFinite)||!polygon.every(p=>p.every(Number.isFinite)))return null;
  const edges=polygon.map((p,i)=>{
    const q=polygon[(i+1)%polygon.length],x=q[0]-p[0],z=q[2]-p[2];
    return {direction:[x/Math.hypot(x,z),z/Math.hypot(x,z)],length:Math.hypot(x,z)};
  }).sort((a,b)=>b.length-a.length);
  const nearest=nearbySegments(features,center)[0];
  if(!nearest)return null;
  let front=[-edges[0].direction[1],edges[0].direction[0]];
  if(dot(front,[nearest.point[0]-center[0],nearest.point[2]-center[2]])<0)front=front.map(n=>-n);
  const right=[front[1],-front[0]],yaw=Math.atan2(front[0],front[1]);
  const local=polygon.map(p=>[dot([p[0]-center[0],p[2]-center[2]],right),dot([p[0]-center[0],p[2]-center[2]],front)]);
  const bounds={minU:Math.min(...local.map(p=>p[0])),maxU:Math.max(...local.map(p=>p[0])),minV:Math.min(...local.map(p=>p[1])),maxV:Math.max(...local.map(p=>p[1]))};
  const width=bounds.maxU-bounds.minU,depth=bounds.maxV-bounds.minV;
  const world=(u,v)=>[center[0]+right[0]*u+front[0]*v,center[2]+right[1]*u+front[1]*v];
  const height=(x,z)=>{
    const y=surfaceHeight?.(x,z);
    return Number.isFinite(y)?y:poi.point[1];
  };
  // A low foundation seats on the highest mapped corner. It does not flatten
  // the mountain or apply a broad legacy-compound radius to this small site.
  const floor=Math.max(...polygon.map(p=>height(p[0],p[2])))+.035;
  const gateV=Math.min(.68,bounds.maxV-.08),gateHalfSpan=1.10,gatePostRadius=.18,lanternV=-.42;
  const solids=[];
  const cylinder=(u,v,r,h,tag)=>{
    const p=world(u,v),seat=Math.min(floor,height(...p));
    solids.push({type:'cylinder',args:[p[0],p[1],r,seat-.08,floor+h,tag]});
  };
  const box=(u,v,w,d,h,tag)=>{
    const p=world(u,v);solids.push({type:'box',args:[p[0],p[1],w/2,d/2,yaw,floor-.06,floor+h,tag]});
  };
  for(const side of [-1,1]){
    cylinder(side*gateHalfSpan,gateV,gatePostRadius,2.72,'ainomine_stone_pillar');
    const p=world(side*1.89,lanternV),seat=Math.min(floor,height(...p));
    solids.push({type:'box',args:[p[0],p[1],.29,.29,yaw,seat-.03,seat+1.55,'ainomine_lantern_pedestal']});
    solids.push({type:'box',args:[p[0],p[1],.375,.375,yaw,seat+1.50,seat+1.99,'ainomine_lantern_roof']});
    box(side*1.43,.28,.18,.18,2.44,'ainomine_timber_post');
    box(side*1.45,-.20,.15,1.02,.76,'ainomine_side_screen');
  }
  box(0,-.70,2.95,.15,2.38,'ainomine_rear_wall');
  box(0,-.27,1.22,.63,1.45,'ainomine_altar');

  // The existing public route stays north of the building. Project the shrine
  // axis to that actual segment only to aim the checkpoint and short approach.
  // This is not a new graph edge or a claimed surveyed doorway.
  let routePoint=[...nearest.point],axisDistance=null;
  const delta=[nearest.b[0]-nearest.a[0],nearest.b[2]-nearest.a[2]],offset=[nearest.a[0]-center[0],nearest.a[2]-center[2]],den=cross(front,delta);
  if(Math.abs(den)>.00001){
    const along=cross(offset,delta)/den,t=cross(offset,front)/den;
    if(along>gateV&&along<12&&t>=0&&t<=1){
      axisDistance=along;routePoint=[nearest.a[0]+delta[0]*t,nearest.a[1]+(nearest.b[1]-nearest.a[1])*t,nearest.a[2]+delta[1]*t];
    }
  }
  routePoint[1]=height(routePoint[0],routePoint[2]);
  return {
    id:'ainomine',osm:ainomineBuildingId,center:[center[0],floor,center[2]],sourcePoint:[...poi.point],
    polygon,localPolygon:local,bounds,width,depth,
    roof:{halfWidth:width/2+.20,back:-1.06,front:.55,eave:2.48,ridge:3.10},
    front,right,yaw,world,floor,gateV,gateHalfSpan,gatePostRadius,lanternV,solids,
    route:{id:nearest.id,point:routePoint,halfWidth:nearest.width/2,direction:nearest.direction,axisDistance},
    provenance:'OSM building/POI placement; footprint-derived frontage aimed toward the existing northern public route. Architectural dimensions and last-metres approach inferred from the official low-resolution photo, not a site survey.'
  };
}

/** Clip an inferred side landing to the shrine side of the public path edge. */
export function clipAinomineApproach(points,plan){
  const {point,direction,halfWidth}=plan.route;
  let normal=[-direction[1],direction[0]];
  if(dot(normal,[plan.center[0]-point[0],plan.center[2]-point[2]])<0)normal=normal.map(n=>-n);
  const signed=p=>dot(normal,[p[0]-point[0],p[2]-point[2]])-halfWidth;
  const result=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],da=signed(a),db=signed(b);
    if(da>=-.00001)result.push(a);
    if((da>=0)!==(db>=0)){
      const t=da/(da-db);result.push(a.map((v,j)=>v+(b[j]-v)*t));
    }
  }
  return result;
}

/** Small terrain-seated treads, clipped before the unchanged public stairway. */
export function ainomineApproach(plan,surfaceHeight){
  if(!plan?.route.axisDistance||typeof surfaceHeight!=='function')return [];
  const start=plan.bounds.maxV,end=plan.route.axisDistance,run=.46,halfWidth=.80,steps=[];
  for(let a=start;a<end;a+=run){
    const b=Math.min(a+run,end),corners=[[-halfWidth,a],[halfWidth,a],[halfWidth,b],[-halfWidth,b]]
      .map(([u,v])=>{const [x,z]=plan.world(u,v);return [x,0,z];});
    const polygon=clipAinomineApproach(corners,plan);
    if(polygon.length<3)continue;
    let area=0;for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length];area+=p[0]*q[2]-q[0]*p[2];}
    if(Math.abs(area)<.012)continue;
    const ground=polygon.map(p=>surfaceHeight(p[0],p[2]));
    if(!ground.every(Number.isFinite))continue;
    const terrainSeat=Math.max(...ground)+.045;
    // The final step onto the small platform must satisfy walkHeight's .24 m
    // acceptance window even before its .025 m floor-ray offset is applied.
    const level=Math.min(plan.floor,Math.max(terrainSeat,steps.length===0?plan.floor-.20:-Infinity));
    steps.push({polygon:polygon.map(p=>[p[0],level,p[2]]),bottom:ground.map(h=>Math.min(h-.035,level-.10)),level});
  }
  return steps;
}

/**
 * Reserve the actual new approach and architectural envelopes before inferred
 * mountain gates are emitted. The .10 m allowance separates visible posts
 * from those surfaces; it is not a change to the public path or terrain.
 */
export function makeAinomineToriiExclusion(plan,steps){
  const local=(x,z)=>{
    const dx=x-plan.center[0],dz=z-plan.center[2];
    return [dx*plan.right[0]+dz*plan.right[1],dx*plan.front[0]+dz*plan.front[1]];
  };
  const rectangle=(u,v,halfW,halfD)=>[[u-halfW,v-halfD],[u+halfW,v-halfD],[u+halfW,v+halfD],[u-halfW,v+halfD]];
  const polygons=steps.map(s=>({reason:'ainomine-approach',points:s.polygon.map(p=>local(p[0],p[2]))}));
  polygons.push({reason:'ainomine-sanctuary',points:plan.localPolygon});
  const roof=plan.roof;
  polygons.push({reason:'ainomine-sanctuary',points:rectangle(0,(roof.front+roof.back)/2,roof.halfWidth,(roof.front-roof.back)/2)});
  for(const solid of plan.solids.filter(c=>c.args.at(-1)==='ainomine_lantern_roof')){
    const a=solid.args,[u,v]=local(a[0],a[1]);
    polygons.push({reason:'ainomine-lantern',points:rectangle(u,v,a[2],a[3])});
  }
  const allowance=.10,bounds=Math.max(...polygons.flatMap(p=>p.points.map(p=>Math.hypot(...p))))+allowance;
  const intersects=(point,radius,polygon)=>{
    let inside=false;
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
      const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
      const t=Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(length||1)));
      if(Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy)<=radius)return true;
    }
    return inside;
  };
  // The polygons and broad bound are prepared once. This callback is used
  // only during static gate construction, never while walking or rendering.
  return ({posts})=>{
    for(const post of posts){
      const p=local(post.x,post.z);
      if(Math.hypot(...p)>bounds+post.radius)continue;
      for(const polygon of polygons)if(intersects(p,post.radius+allowance,polygon.points))return polygon.reason;
    }
    return null;
  };
}
