export const outlooks=[[795,164,-216],[793,180,-315],[730,140,-270]];
export function panoramaVisible(position,wasVisible,enabled=true){
  if(!enabled||position.y<115||position.y>340)return false;
  return outlooks.some(([x,,z])=>Math.hypot(position.x-x,position.z-z)<(wasVisible?180:135));
}
