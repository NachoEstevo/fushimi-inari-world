import {buildGraph,nearestNode,shortestRoute} from '../geography/geo-core.mjs';

const finitePoint=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const gap=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const same=(a,b)=>gap(a,b)<1e-6;

// Owners supply their authored circulation. Only their mapped endpoint joins
// use the public graph; heights always come from the assembled floor owners.
export function buildStationApproachRoutes(assembly,features,terrain){
 const routes={keihan:null,keihan_omotesando:null,jr:null};
 if(typeof assembly?.walkHeight!=='function'||!Array.isArray(features?.paths)||!finitePoint(assembly.spatial?.main?.[0]))return routes;
 let graph;try{graph=buildGraph(features.paths,terrain);}catch{return routes;}
 const destination=assembly.spatial.main[0];
 function mappedJoin(a,b){
  const start=nearestNode(graph,a,.001),end=nearestNode(graph,b,.001);
  return start&&end?shortestRoute(graph,start.node.id,end.node.id):null;
 }
 function fromPlatform(station){
  const point=station?.spec?.route?.platformDoor,points=station?.routePoints;
  if(!station?.built||!finitePoint(point)||!Array.isArray(points)||points.some(p=>!finitePoint(p)))return null;
  const start=points.findIndex(p=>same(p,point));
  return start<0?null:points.slice(start);
 }
 function make(station,approach,stops){
  const platform=fromPlatform(station),onward=approach?.routePoints;
  if(!platform?.length||!approach?.built||!Array.isArray(onward)||!onward.length||onward.some(p=>!finitePoint(p)))return null;
  const corners=platform.map(p=>[...p]);
  function append(points){
   if(!same(corners.at(-1),points[0])){
    const join=mappedJoin(corners.at(-1),points[0]);if(!join)return false;
    for(const p of join)if(!same(corners.at(-1),p))corners.push([...p]);
   }
   for(const p of points)if(!same(corners.at(-1),p))corners.push([...p]);
   return true;
  }
  if(!append(onward)||!append([destination]))return null;
  const points=[];
  function sample(x,z,depth=0){
   if(assembly.isWalkable&&!assembly.isWalkable(x,z))throw Error('Route leaves its assembled walking surfaces');
   const previous=points.at(-1),y=assembly.walkHeight(x,z,previous?.[1]);if(!Number.isFinite(y))throw Error('Route floor unavailable');
   if(previous&&Math.hypot(x-previous[0],y-previous[1],z-previous[2])>2+1e-8){
    if(depth>=16)throw Error('Route floor cannot be joined by bounded walking steps');
    sample((previous[0]+x)/2,(previous[2]+z)/2,depth+1);sample(x,z,depth+1);return;
   }
   points.push([x,y,z]);
  }
  try{
   sample(corners[0][0],corners[0][2]);
   for(let i=1;i<corners.length;i++){
    const a=corners[i-1],b=corners[i],count=Math.max(1,Math.ceil(gap(a,b)/2));
    for(let j=1;j<=count;j++){const t=j/count;sample(j===count?b[0]:a[0]+(b[0]-a[0])*t,j===count?b[2]:a[2]+(b[2]-a[2])*t);}
   }
  }catch{return null;}
  return {points,stops:[...stops]};
 }
 routes.keihan=make(assembly.keihanStation,assembly.keihanApproach,['Keihan Fushimi-Inari · Platform 2','South gate','Inari-shinmichi','Inari bridge','Urasando','Rōmon']);
 // Keep the actual right turn at Hommachi and the first Omotesando torii.
 // A shortest-path request alone would choose the shorter Urasando approach.
 const hommachi=features.paths.find(p=>p.id==='way/79699850'),omotesando=features.paths.find(p=>p.id==='way/105449722');
 if(hommachi&&omotesando&&assembly.keihanApproach?.built){
  const junction=hommachi.points.at(-1),southTurn=omotesando.points.at(-1);
  const fork=assembly.keihanApproach.routePoints.findIndex(p=>same(p,junction));
  const south=[...hommachi.points].reverse(),turn=south.findIndex(p=>same(p,southTurn));
  if(fork>=0&&turn>=0){
   const routePoints=[...assembly.keihanApproach.routePoints.slice(0,fork+1),...south.slice(1,turn+1),...[...omotesando.points].reverse().slice(1)];
   routes.keihan_omotesando=make(assembly.keihanStation,{built:true,routePoints},['Keihan Fushimi-Inari · Platform 2','South gate','Inari bridge','JR crossing','Hommachi · Turn right','Omotesando · First torii','Rōmon']);
  }
 }
 routes.jr=make(assembly.inariStation,assembly.inariStationRoute,['JR Inari · Platform 2','East ticket gate','Omotesando · First torii','Rōmon']);
 return routes;
}
