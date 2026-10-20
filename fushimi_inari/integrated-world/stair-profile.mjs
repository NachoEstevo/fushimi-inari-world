// Keep source counts as evidence, but do not turn conflicting coarse DEM data
// into metre-high risers. A fallback is a playable estimate, not a new survey.
export function stairProfile(length,h0,h1,sourceCount){
  const rise=Math.abs(h1-h0),mapped=Number.isFinite(sourceCount)&&sourceCount>0?Math.round(sourceCount):null;
  const maxCount=Math.max(1,Math.floor(length/.28));
  const inferred=Math.max(1,Math.min(maxCount,Math.ceil(rise/.16)));
  const conflict=mapped!==null&&rise/mapped>.24;
  const count=conflict?inferred:(mapped??inferred);
  const unresolved=rise<.1||rise/count>.24||length/count<.18||conflict;
  return {count,rise:rise/count,mapped,conflict,unresolved,
    status:conflict?'inferred-count-source-dem-conflict':rise<.1?'dem-unresolved':mapped?'mapped-count-dem-heights':'inferred'};
}

export function inferredTreads(points,ground){
  const treads=[];let distance=0;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if(len<.001)continue;
    const h0=ground(a[0],a[2]),h1=ground(b[0],b[2]),profile=stairProfile(len,h0,h1,NaN);
    const at=f=>[a[0]+(b[0]-a[0])*f,0,a[2]+(b[2]-a[2])*f];
    for(let j=0;j<profile.count;j++){
      const level=h0+(h1-h0)*(h1>=h0?(j+1)/profile.count:j/profile.count);
      treads.push({a:at(j/profile.count),b:at((j+1)/profile.count),level,rise:profile.rise,riserAt:h1>=h0?'a':'b',distance:distance+j*len/profile.count});
    }
    distance+=len;
  }
  return treads;
}
