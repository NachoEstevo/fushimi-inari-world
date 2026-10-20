// Adapter to the preserved GLB podium (top 2.10 m in source coordinates).
// The old terrain stopped at 1.60 m, below the solid doorway threshold.
export function entryHeight(x,z,base){
  if(Math.abs(x)<=4.6&&z>=3.4&&z<=6.5)return 2.1*(6.5-z)/3.1;
  if(Math.abs(x)<=1.85&&z>=-3.4&&z<3.4)return 2.1;
  if(Math.abs(x)<=1.85&&z>=-5&&z<-3.4)return 1.6+.5*(z+5)/1.6;
  return base;
}
