import {heightAt,buildGraph,nearestNode,shortestRoute,resample} from '../geography/geo-core.mjs';

export function rotateXZ(x,z,yaw){return [Math.cos(yaw)*x+Math.sin(yaw)*z,-Math.sin(yaw)*x+Math.cos(yaw)*z];}
export function rigidPoint(p,source,target,yaw){
  const [x,z]=rotateXZ(p[0]-source[0],p[2]-source[2],yaw);
  return [target[0]+x,target[1]+p[1]-source[1],target[2]+z];
}
export function pathSampler(points){
  const lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][2]-points[i-1][2]));
  const total=lengths.at(-1);
  return {total,at(f){
    const d=Math.max(0,Math.min(1,f))*total;
    let lo=0,hi=lengths.length-1;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(lengths[mid]<=d)lo=mid;else hi=mid;}
    const a=points[lo],b=points[Math.min(lo+1,points.length-1)],t=(d-lengths[lo])/Math.max(.0001,lengths[lo+1]-lengths[lo]);
    return {point:a.map((v,j)=>v+(b[j]-v)*t),yaw:Math.atan2(b[0]-a[0],b[2]-a[2])};
  }};
}
export function pathClearance(paths){
  const cells=new Map(),size=24;
  for(const path of paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],segment={a,b};
    for(let x=Math.floor((Math.min(a[0],b[0])-6)/size);x<=Math.floor((Math.max(a[0],b[0])+6)/size);x++)
      for(let z=Math.floor((Math.min(a[2],b[2])-6)/size);z<=Math.floor((Math.max(a[2],b[2])+6)/size);z++){
        const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(segment);
      }
  }
  return (x,z)=>{
    let best=null;
    for(const {a,b} of cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)??[]){
      const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
      const px=a[0]+t*dx,pz=a[2]+t*dz,d=Math.hypot(x-px,z-pz);
      if(!best||d<best.distance)best={x:px,z:pz,distance:d,normal:[-dz/(Math.hypot(dx,dz)||1),dx/(Math.hypot(dx,dz)||1)]};
    }return best;
  };
}
export function makeSpatial(terrain,features,spec){
  const graph=buildGraph(features.paths,terrain);
  const anchors=spec.anchors.map(a=>{
    const point=a.osm?features.pois.find(p=>p.id===a.osm)?.point:a.target;
    if(!point)throw Error(`Missing geographic anchor ${a.id}`);
    return {...a,target:[point[0],heightAt(terrain,point[0],point[2]),point[2]],yaw:-Math.PI/2+.06};
  });
  const byId=Object.fromEntries(anchors.map(a=>[a.id,a]));
  const snap=a=>nearestNode(graph,a.target,80)?.node;
  function connected(ids){
    const points=[];
    for(let i=1;i<ids.length;i++){
      const a=snap(byId[ids[i-1]]),b=snap(byId[ids[i]]);
      const segment=a&&b&&shortestRoute(graph,a.id,b.id);
      if(!segment)throw Error(`Disconnected mapped route: ${ids[i-1]} → ${ids[i]}`);
      points.push(...(i===1?segment:segment.slice(1)));
    }
    return resample(points,terrain,1.5);
  }
  const mainIds=['romon','honden','senbon','okusha','kumataka','mitsu','yotsu','sannomine','ninomine','summit'];
  const main=connected(mainIds);
  const returning=connected(['summit','mitsurugi','gozendani','yotsu']);
  const twins=['way/260121328','way/377968455'].map(id=>{
    const path=features.paths.find(p=>p.id===id);
    if(!path)throw Error(`Missing Senbon branch ${id}`);
    let points=path.points;
    const start=byId.senbon.target;
    if(Math.hypot(points[0][0]-start[0],points[0][2]-start[2])>Math.hypot(points.at(-1)[0]-start[0],points.at(-1)[2]-start[2]))points=[...points].reverse();
    return pathSampler(resample(points,terrain,1));
  });
  return {anchors,byId,graph,mainIds,main,returning,twins,connected};
}
