export const yotsuForecourt=[[792,-220.7],[806,-220.7],[806.176,-214.156],[801.414,-213.322],[797.017,-212.687],[792,-212]];
// Small inferred forecourt only. Preserve the larger mountain slope and the
// north/south/west stair flights instead of flattening a 30 m circular pad.
export function yotsuGrade(x,z,base){
  let inside=false,distance=Infinity;
  for(let i=0,j=yotsuForecourt.length-1;i<yotsuForecourt.length;j=i++){
    const a=yotsuForecourt[j],b=yotsuForecourt[i],dx=b[0]-a[0],dz=b[1]-a[1];
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
    distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));
  }
  if(!inside&&distance>=2)return base;
  const weight=inside?1:(1-distance/2)**2;
  const grade=163.9+(x-799)*.07+(z+216)*.015;
  return base+(grade-base)*weight;
}
