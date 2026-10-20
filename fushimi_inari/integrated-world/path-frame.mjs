export function pathOffset(a,b,neighbor,atEnd=false){
  const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
  const normal=[-dz/len,dx/len];
  if(!neighbor)return normal;
  const joint=atEnd?b:a,other=atEnd?neighbor.b:neighbor.a;
  const nx=atEnd?other[0]-joint[0]:joint[0]-other[0];
  const nz=atEnd?other[2]-joint[2]:joint[2]-other[2];
  const nl=Math.hypot(nx,nz);if(nl<.001)return normal;
  const mx=normal[0]-nz/nl,mz=normal[1]+nx/nl;
  const denominator=mx*normal[0]+mz*normal[1];
  if(denominator<.5)return normal; // Avoid spikes at hairpins.
  return [mx/denominator,mz/denominator];
}
