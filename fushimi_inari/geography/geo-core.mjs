// Shared spatial contract for mesh, route graph, minimap and camera.
export function heightAt(t, x, z) {
  const u = Math.max(0, Math.min(t.cols - 1, (x - t.xmin) / t.step));
  const v = Math.max(0, Math.min(t.rows - 1, (z - t.zmin) / t.step));
  const c = Math.min(t.cols - 2, Math.floor(u)), r = Math.min(t.rows - 2, Math.floor(v));
  const a = u - c, b = v - r, i = r * t.cols + c;
  const h=t.heights;
  // Match the actual mesh diagonal (NE–SW), not a bilinear surface between triangles.
  return a+b<=1 ? h[i]+(h[i+1]-h[i])*a+(h[i+t.cols]-h[i])*b
    : h[i+t.cols+1]+(h[i+t.cols]-h[i+t.cols+1])*(1-a)+(h[i+1]-h[i+t.cols+1])*(1-b);
}
export const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export const isRestricted = t => ['no','private'].includes(t.foot ?? t.access);
export const isWalkable = t => !isRestricted(t) && !['motorway','motorway_link','trunk','trunk_link','construction','proposed'].includes(t.highway)
  && t.area !== 'yes' && t.tunnel !== 'yes' && t.bridge !== 'yes';
export function pathWidth(tags) {
  const n = Number.parseFloat(tags.width);
  return Number.isFinite(n) && n > 0 ? Math.min(25,n)
    : ({steps:1.8,footway:2,path:1.3,pedestrian:4,track:2.8,service:3,residential:4.5}[tags.highway] ?? 6);
}
export function buildGraph(paths, terrain) {
  const nodes = new Map();
  for (const path of paths.filter(p=>isWalkable(p.tags))) {
    path.nodeIds.forEach((id,i)=>{
      const p = path.points[i];
      if (!nodes.has(id)) nodes.set(id,{id,point:[p[0],heightAt(terrain,p[0],p[2]),p[2]],edges:[]});
    });
    for(let i=1;i<path.nodeIds.length;i++){
      const a=nodes.get(path.nodeIds[i-1]), b=nodes.get(path.nodeIds[i]);
      if(a.id===b.id) continue;
      const length=distance(a.point,b.point);
      // Vehicle oneway does not imply pedestrian oneway.
      if(path.tags['oneway:foot']!=='-1') a.edges.push({id:b.id,length,pathId:path.id});
      if(path.tags['oneway:foot']!=='yes') b.edges.push({id:a.id,length,pathId:path.id});
    }
  }
  return nodes;
}
export function nearestNode(graph,point,maxDistance=Infinity) {
  let best=null, d=maxDistance;
  for(const node of graph.values()){
    const gap=Math.hypot(node.point[0]-point[0],node.point[2]-point[2]);
    if(gap<d){d=gap;best=node;}
  }
  return best ? {node:best,distance:d}:null;
}
export function shortestRoute(graph,start,end,excluded=new Set()) {
  if(!graph.has(start)||!graph.has(end)) return null;
  const costs=new Map([[start,0]]), prev=new Map(), heap=[];
  function push(item){
    heap.push(item);let i=heap.length-1;
    while(i){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p;}heap[i]=item;
  }
  function pop(){
    const top=heap[0],last=heap.pop();
    if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}
    return top;
  }
  push([0,start]);
  while(heap.length){
    const [cost,id]=pop();
    if(cost!==costs.get(id))continue;
    if(id===end)break;
    for(const edge of graph.get(id).edges){
      if(excluded.has(edge.pathId))continue;
      const candidate=cost+edge.length;
      if(candidate<(costs.get(edge.id)??Infinity)){
        costs.set(edge.id,candidate);prev.set(edge.id,id);push([candidate,edge.id]);
      }
    }
  }
  if(!costs.has(end))return null;
  const ids=[end];while(ids[0]!==start)ids.unshift(prev.get(ids[0]));
  return ids.map(id=>graph.get(id).point);
}
export function routeMetrics(points) {
  let length=0,ascent=0,descent=0;
  for(let i=1;i<points.length;i++){
    length+=distance(points[i-1],points[i]);
    const dy=points[i][1]-points[i-1][1];ascent+=Math.max(0,dy);descent+=Math.max(0,-dy);
  }
  return {length,ascent,descent};
}
export function resample(points, terrain, spacing=3) {
  const result=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/spacing));
    for(let j=0;j<n;j++){const f=j/n,x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f;result.push([x,heightAt(terrain,x,z),z]);}
  }
  if(points.length){const p=points.at(-1);result.push([p[0],heightAt(terrain,p[0],p[2]),p[2]]);}
  return result;
}
