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
