// This pass starts beyond the Okusha approach. Keep the entrance, the twin
// Senbon corridors and their authored arrival apron exactly as they were.
// The envelope is an implementation boundary, not a surveyed precinct boundary.
export function isMountainPathSegment(segment){
  if(segment.kind!=='stone'||['way/260121328','way/377968455'].includes(segment.id))return false;
  return [segment.a,segment.b].every(p=>p[0]>=255&&p[0]<=1450&&p[2]>=-620&&p[2]<=360)
    &&Math.min(segment.ya,segment.yb)>=60;
}

// A soil shoulder must meet the local ground, not remain at the elevation of
// the neighbouring tread. The old constant-height strips floated downhill.
// The 4 cm offset sits 2 cm above the viewer's -6 cm terrain skin; the curb
// covers the inner seam. This is support for the inferred roadbed, not a new
// measurement of a retaining wall or a drainage channel.
export function mountainShoulder(a,b,normalA,normalB,side,ground,blocked,spread=.36){
  if(![...a,...b,...normalA,...normalB,spread].every(Number.isFinite)||spread<=0)return null;
  const outside=(p,n)=>[p[0]+side*n[0]*spread,0,p[2]+side*n[1]*spread];
  const ea=outside(a,normalA),eb=outside(b,normalB);
  const mid=[(ea[0]+eb[0])/2,0,(ea[2]+eb[2])/2];
  if([ea,eb,mid].some(p=>blocked(p[0],p[2])))return null;
  const raw=[ground(a[0],a[2]),ground(b[0],b[2]),ground(ea[0],ea[2]),ground(eb[0],eb[2])];
  if(!raw.every(Number.isFinite))return null;
  // Do not span cliffs or the side of a separate raised platform with soil.
  if(Math.abs(raw[2]-a[1])>1.5||Math.abs(raw[3]-b[1])>1.5)return null;
  ea[1]=raw[2]-.04;eb[1]=raw[3]-.04;
  const ia=[a[0],Math.min(a[1]-.08,raw[0]-.04),a[2]];
  const ib=[b[0],Math.min(b[1]-.08,raw[1]-.04),b[2]];
  // Return the same clockwise-in-XZ convention used by path-meshes' reversed
  // triangulator. Both hillside directions then have upward-facing normals.
  const quad=side>0?[ia,ib,eb,ea]:[ea,eb,ib,ia];
  // Very short segments inside a tight OSM bend can have overlapping miter
  // offsets. Leave the existing ground visible instead of creating a folded
  // soil ribbon with an inverted triangle across the inside of that bend.
  for(const [i,j,k] of [[0,2,1],[0,3,2]]){
    const [a,b,c]=[quad[i],quad[j],quad[k]];
    const up=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
    if(up<=1e-8)return null;
  }
  return quad;
}

// Texture coordinates follow distance along the mapped path. They remain
// continuous through segment splits and bends instead of rotating with world X/Z.
export function mountainPathUV(segment,length){
  const across=segment.width/1.25;
  const from=segment.distance/1.25,to=(segment.distance+length)/1.25;
  return [[0,from],[0,to],[across,to],[across,from]];
}

export function mountainTreadUV(segment){
  const across=segment.width/.64;
  // The weathered front edge follows the actual riser on ascending AND
  // descending segments. No displacement is applied to the walking surface.
  const start=segment.riserAt==='b'?0:1,end=1-start;
  return [[0,start],[0,end],[across,end],[across,start]];
}
