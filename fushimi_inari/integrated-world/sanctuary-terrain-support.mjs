// These exact mapped ways already own the 3.6 m sanctuary approach aprons in
// sanctuary-landing.mjs. Other named links below retain their mapped widths.
const APRONS=new Set(['way/105449677','way/105449728','way/751194635','way/751194637','way/1106589423']);
// The exterior Honden link connects the two apron mouths at z=-20.694 and
// -14.115. Its north access is the mapped stair and short landing at z=-33.
const LINKS=new Set(['way/105449689','way/1213198208','way/1213198209']);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function project(segment,x,z){
  const dx=segment.b[0]-segment.a[0],dz=segment.b[2]-segment.a[2],length2=dx*dx+dz*dz;
  if(!length2)return null;
  const t=Math.max(0,Math.min(1,((x-segment.a[0])*dx+(z-segment.a[2])*dz)/length2));
  return {t,distance:Math.hypot(x-segment.a[0]-dx*t,z-segment.a[2]-dz*t)};
}

// Inferred terrain support, not another slab, route or surveyed terrace.
// Existing walking heights remain authoritative. Apron top is path-.035;
// support is another .045 below it. The viewer's additional -.06 terrain
// offset leaves .105 m visible apron edge and does not bury the paving.
export function sanctuaryTerrainSupport(network,previousTerrainHeight=network.terrainHeight){
  const segments=network.segments.filter(s=>(APRONS.has(s.id)&&!s.stair)||LINKS.has(s.id));
  if(!segments.length)return previousTerrainHeight;
  const shoulder=1.5;
  const half=s=>APRONS.has(s.id)?1.8:s.width/2+.13;
  const bounds=segments.reduce((b,s)=>{
    const radius=half(s)+shoulder;
    for(const p of [s.a,s.b]){b[0]=Math.min(b[0],p[0]-radius);b[1]=Math.max(b[1],p[0]+radius);b[2]=Math.min(b[2],p[2]-radius);b[3]=Math.max(b[3],p[2]+radius);}
    return b;
  },[Infinity,-Infinity,Infinity,-Infinity]);
  const stairs=network.segments.filter(s=>s.stair&&!LINKS.has(s.id)&&Math.max(s.a[0],s.b[0])+s.width>=bounds[0]&&
    Math.min(s.a[0],s.b[0])-s.width<=bounds[1]&&Math.max(s.a[2],s.b[2])+s.width>=bounds[2]&&Math.min(s.a[2],s.b[2])-s.width<=bounds[3]);
  return (x,z)=>{
    const base=previousTerrainHeight(x,z);
    if(x<bounds[0]||x>bounds[1]||z<bounds[2]||z>bounds[3])return base;
    let nearest=null;
    for(const s of segments){
      const p=project(s,x,z);
      const edge=p?p.distance-half(s):Infinity;
      if(p&&edge<shoulder&&(!nearest||edge<nearest.edge))nearest={...p,edge,s};
    }
    if(!nearest)return base;
    let weight=1-smooth(nearest.edge/shoulder);
    for(const stair of stairs){
      const p=project(stair,x,z);
      if(p)weight*=smooth((p.distance-stair.width/2-.15)/.5);
    }
    if(!weight)return base;
    const {s,t}=nearest,level=s.ya+(s.yb-s.ya)*t-(s.stair?s.rise:0)-(APRONS.has(s.id) ? .08 : .045);
    return base+(level-base)*weight;
  };
}
