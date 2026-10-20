import {spacedGateStations} from './torii-variation.mjs';

// Photo-based common exit frontage; OSM's shared node is a routing connection,
// not a place for two gates. The 2.5 m apron setback is inferred, not surveyed.
export function senbonLayout(twins,spacing){
  const headings=twins.map(p=>p.at(.9).yaw);
  const yaw=Math.atan2(headings.reduce((v,a)=>v+Math.sin(a),0),headings.reduce((v,a)=>v+Math.cos(a),0));
  const axis=[Math.sin(yaw),Math.cos(yaw)];
  const projection=p=>p[0]*axis[0]+p[2]*axis[1];
  const frontage=Math.min(...twins.map(p=>projection(p.at(1).point)))-2.5;
  return twins.map((path,index)=>{
    const other=twins[1-index];
    const otherPoints=Array.from({length:170},(_,i)=>other.at(i/169).point);
    let start=0;
    while(start<path.total*.3){
      const p=path.at(start/path.total).point;
      if(Math.min(...otherPoints.map(q=>Math.hypot(p[0]-q[0],p[2]-q[2])))>2.15)break;
      start+=.25;
    }
    // Find the first crossing before the terminal connecting bend.
    let lo=.7,hi=1;
    for(let i=0;i<40;i++){
      const mid=(lo+hi)/2;
      if(projection(path.at(mid).point)<frontage)lo=mid;else hi=mid;
    }
    const end=(lo+hi)/2*path.total;
    const stations=spacedGateStations(end-start,{...spacing,seed:133742+index*509}).map(d=>d+start);
    while(stations.length&&end-stations.at(-1)<spacing.minimum)stations.pop();
    stations.push(end);
    return {stations,start,end,exitYaw:yaw};
  });
}
