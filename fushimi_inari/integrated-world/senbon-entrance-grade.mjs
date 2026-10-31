import {pathSampler} from './spatial.mjs';

// OSM gives the shared fork and both horizontal alignments, not individual
// paving elevations. The nearby DEM samples diverge across the twin mouths.
// Photographs show a shared entrance grade; blend to their mean only here.
const ids=['way/260121328','way/377968455'],forkNode=3055919122;
export function senbonEntranceGrades(paths,ground){
 const branches=ids.map(id=>{
  const path=paths.find(p=>p.id===id);if(!path)return null;
  const start=path.nodeIds?.[0]===forkNode,end=path.nodeIds?.at(-1)===forkNode;
  if(!start&&!end)return null;
  return {id,sampler:pathSampler(path.points),reversed:!start};
 });
 if(branches.some(b=>!b))return ()=>0;
 const height=(b,d)=>{const f=Math.min(1,d/b.sampler.total),p=b.sampler.at(b.reversed?1-f:f).point;return ground(p[0],p[2]);};
 return (id,distance)=>{
  const own=branches.find(b=>b.id===id);if(!own)return 0;
  const d=own.reversed?own.sampler.total-distance:distance;
  if(d<0||d>=30)return 0;
  const t=Math.max(0,Math.min(1,(d-10)/20)),weight=1-t*t*(3-2*t);
  return ((height(branches[0],d)+height(branches[1],d))/2-height(own,d))*weight;
 };
}
