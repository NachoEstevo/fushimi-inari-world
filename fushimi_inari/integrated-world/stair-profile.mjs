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

export function inferredTreads(points,ground,counts=null){
  const treads=[];let distance=0;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
    if(len<.001)continue;
    const h0=ground(a[0],a[2]),h1=ground(b[0],b[2]),profile=stairProfile(len,h0,h1,NaN);
    if(counts){profile.count=counts[i-1];profile.rise=Math.abs(h1-h0)/profile.count;}
    const at=f=>[a[0]+(b[0]-a[0])*f,0,a[2]+(b[2]-a[2])*f];
    for(let j=0;j<profile.count;j++){
      const level=h0+(h1-h0)*(h1>=h0?(j+1)/profile.count:j/profile.count);
      treads.push({a:at(j/profile.count),b:at((j+1)/profile.count),level,rise:profile.rise,riserAt:h1>=h0?'a':'b',distance:distance+j*len/profile.count});
    }
    distance+=len;
  }
  return treads;
}

// Sample the existing 10 m DEM inside long OSM edges; retain every original
// vertex. This improves conformance, without claiming new survey precision.
export function sampledStairAlignment(points,spacing=5){
  if(!Number.isFinite(spacing)||spacing<=0)throw new Error('Positive sample spacing required');
  if(!points.length)return [];
  const sampled=[points[0]];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/spacing));
    for(let j=1;j<=count;j++)sampled.push(j===count?b:[a[0]+(b[0]-a[0])*j/count,0,a[2]+(b[2]-a[2])*j/count]);
  }
  return sampled;
}

// Preserve a credible mapped total while respecting every intermediate node.
// The DEM cannot certify tread heights; infeasible allocations stay unresolved.
export function mappedTreads(points,ground,count){
  if(!Number.isInteger(count)||count<1)return null;
  // A credible total must also fit terrain between OSM vertices, not only
  // endpoint elevations. Keep the total or explicitly reject the conflict.
  const shaped=[points[0]];
  for(let i=1;i<points.length;i++){
    const samples=sampledStairAlignment([points[i-1],points[i]]);
    const heights=samples.map(p=>ground(p[0],p[2]));
    for(let j=1;j<samples.length-1;j++)if((heights[j]-heights[j-1])*(heights[j+1]-heights[j])<0)shaped.push(samples[j]);
    shaped.push(points[i]);
  }
  points=shaped;
  const flights=points.slice(1).map((b,i)=>{
    const a=points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    const rise=Math.abs(ground(b[0],b[2])-ground(a[0],a[2]));
    return {length,rise,count:Math.max(1,Math.ceil(rise/.24)),max:Math.floor(length/.18)};
  });
  if(!flights.length||flights.some(f=>f.count>f.max)||flights.reduce((s,f)=>s+f.count,0)>count||flights.reduce((s,f)=>s+f.max,0)<count)return null;
  let remaining=count-flights.reduce((s,f)=>s+f.count,0);
  while(remaining--){
    const eligible=flights.filter(f=>f.count<f.max);
    eligible.sort((a,b)=>(b.rise||b.length*.01)/(b.count+1)-(a.rise||a.length*.01)/(a.count+1));
    eligible[0].count++;
  }
  // Preserve source bends and detected peaks/valleys, but do not force a
  // separate integer flight at each arbitrary terrain sampling boundary.
  return inferredTreads(points,ground,flights.map(f=>f.count));
}
