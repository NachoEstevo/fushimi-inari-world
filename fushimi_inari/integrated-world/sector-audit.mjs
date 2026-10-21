import {nearestNode,shortestRoute,routeMetrics} from '../geography/geo-core.mjs';

// Review itinerary, not new paths. Each connection must resolve on the existing
// OSM graph. Buildings snap to exterior nodes; gaps are reported, never paved.
export const sectorConnections=[
  ['entrance','romon'],['romon','temizuya'],['romon','gehaiden'],
  ['gehaiden','naihaiden'],['naihaiden','honden'],['naihaiden','gonden'],
  ['gonden','tamayama'],['honden','okumiya'],['okumiya','byakko'],
  ['okumiya','senbon'],['senbon','okusha'],['okusha','kumataka'],
  ['kumataka','mitsu'],['mitsu','yotsu'],['yotsu','chaya_s'],
  ['yotsu','chaya_n'],['yotsu','sannomine'],['sannomine','ninomine'],
  ['ninomine','summit'],['summit','mitsurugi'],['mitsurugi','gozendani'],
  ['gozendani','yotsu'],['yotsu','mitsu'],['mitsu','okusha'],
];

export function auditSectorConnections(spatial,walkHeight,obstacles){
  return sectorConnections.map(([from,to])=>{
    const a=nearestNode(spatial.graph,spatial.byId[from].target,80);
    const b=nearestNode(spatial.graph,spatial.byId[to].target,80);
    const route=a&&b&&shortestRoute(spatial.graph,a.node.id,b.node.id);
    const result={from,to,snapGaps:[a?.distance??null,b?.distance??null],
      topology:route?'connected':'disconnected',fidelity:'unverified'};
    if(!route)return result;
    Object.assign(result,routeMetrics(route));
    if(!walkHeight)return result;
    const points=[];
    for(let i=1;i<route.length;i++){
      const p=route[i-1],q=route[i],n=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[2]-p[2])/.25));
      for(let j=0;j<n;j++)points.push([p[0]+(q[0]-p[0])*j/n,p[2]+(q[2]-p[2])*j/n]);
    }
    points.push([route.at(-1)[0],route.at(-1)[2]]);
    const directions=[];
    for(const [direction,samples] of [['forward',points],['reverse',[...points].reverse()]]){
      let previous,maxJump=0,blocked=0,invalid=0;const examples=[];
      for(const [x,z] of samples){
        const y=walkHeight(x,z,previous);
        if(!Number.isFinite(y)){invalid++;previous=undefined;continue;}
        const jump=previous===undefined?0:Math.abs(y-previous);previous=y;
        maxJump=Math.max(maxJump,jump);
        const resolved=obstacles.resolvePlayer(x,y+1.7,z);
        const correction=Math.hypot(resolved.x-x,resolved.z-z);
        if(correction>.35)blocked++;
        if((jump>.4||correction>.35)&&examples.length<5)examples.push({x,z,y,jump,correction});
      }
      directions.push({direction,samples:samples.length,maxJump,blocked,invalid,examples});
    }
    return {...result,directions,walking:directions.some(d=>d.maxJump>.4||d.blocked||d.invalid)?'inspect':'sampled-centerline-clear'};
  });
}
