export const outlooks=[[795,164,-216],[793,180,-315],[730,140,-270]];
// Secondary OSM viewpoints indicate 180–270 degrees / SW. A small opening
// in generated vegetation preserves that direction; its extent is inferred.
export function outlookOpening(x,z){
  return outlooks.slice(1).some(([ox,,oz])=>{
    const dx=x-ox,dz=z-oz,d=Math.hypot(dx,dz);
    return d<7||(d<36&&(-dx+dz)>Math.SQRT2*(d-5)*.86);
  });
}
export function panoramaVisible(position,wasVisible,enabled=true){
  if(!enabled||position.y<115||position.y>340)return false;
  return outlooks.some(([x,,z])=>Math.hypot(position.x-x,position.z-z)<(wasVisible?180:135));
}


// The fixed 1800-building budget should cover the mapped outlook foreground
// before far city parcels. Source file ordering carries no visibility meaning.
export function panoramaBuildingCandidates(buildings){
 return buildings.flatMap((building,index)=>{
  const ring=building.points?.slice(0,-1);
  if(!ring||ring.length<3||!ring.every(p=>p.length>=3&&p.every(Number.isFinite)))return [];
  const x=ring.reduce((sum,p)=>sum+p[0],0)/ring.length;
  if(x>450)return [];
  const z=ring.reduce((sum,p)=>sum+p[2],0)/ring.length;
  const distance=Math.min(...outlooks.map(([ox,,oz])=>(x-ox)**2+(z-oz)**2));
  return [{building,distance,index}];
 }).sort((a,b)=>a.distance-b.distance||a.index-b.index).map(entry=>entry.building);
}
