// OSM footprints and shared Senbon endpoint constrain this inferred terrace.
export const okushaCourt={x:259,z:69,halfX:19,halfZ:10,feather:6};
export function okushaCourtWeight(x,z){
  const s=okushaCourt,dx=x-s.x,dz=z-s.z;
  const u=dx*.990216+dz*.139543,v=-dx*.139543+dz*.990216;
  const d=Math.max(Math.abs(u)-s.halfX,Math.abs(v)-s.halfZ,0)/s.feather;
  const t=Math.min(1,d);return 1-t*t*(3-2*t);
}
export function okushaCourtGrade(x,z,base,level){return base+(level-base)*okushaCourtWeight(x,z);}
