// Tamayama's mapped west front and its north-running Okumiya connector.
// The 6 m Okumiya flight/upper landing stay owned by okumiya-grade.mjs.
const ACCESS=new Set(['way/105449693','way/1133055111','way/1133055112','way/649175020',
  'way/1133053715','way/1133055117','way/297888105','way/1133055118']);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// Terrain backing only: preserve mapped routes, widths, tread counts and
// walking elevations. Shoulder width and support depth are inferred, not a
// surveyed terrace or permission to add a broad slab between shrine rows.
export function tamayamaAccessTerrain(network,features={},previous=network.terrainHeight){
  const segments=network.segments.filter(s=>ACCESS.has(s.id));
  if(!segments.length)return previous;
  const shoulder=1,bounds=segments.reduce((b,s)=>{
    const r=s.width/2+.13+shoulder;
    for(const p of [s.a,s.b]){b[0]=Math.min(b[0],p[0]-r);b[1]=Math.max(b[1],p[0]+r);b[2]=Math.min(b[2],p[2]-r);b[3]=Math.max(b[3],p[2]+r);}
    return b;
  },[Infinity,-Infinity,Infinity,-Infinity]);
  const exclusions=[...(features.buildings??[]),...(features.water??[])].filter(p=>
    Math.max(...p.points.map(v=>v[0]))>=bounds[0]&&Math.min(...p.points.map(v=>v[0]))<=bounds[1]&&
    Math.max(...p.points.map(v=>v[2]))>=bounds[2]&&Math.min(...p.points.map(v=>v[2]))<=bounds[3]);
  const protectedStairs=network.segments.filter(s=>s.stair&&!ACCESS.has(s.id)&&
    Math.max(s.a[0],s.b[0])+s.width>=bounds[0]&&Math.min(s.a[0],s.b[0])-s.width<=bounds[1]&&
    Math.max(s.a[2],s.b[2])+s.width>=bounds[2]&&Math.min(s.a[2],s.b[2])-s.width<=bounds[3]);
  const inside=(x,z,points)=>{let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])yes=!yes;
  }return yes;};
  return (x,z)=>{
    const base=previous(x,z);
    if(x<bounds[0]||x>bounds[1]||z<bounds[2]||z>bounds[3])return base;
    if(exclusions.some(p=>inside(x,z,p.points)))return base;
    let nearest=null;
    for(const s of segments){
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;
      if(!length2)continue;
      const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2));
      const edge=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t)-s.width/2-.13;
      if(edge<shoulder&&(!nearest||edge<nearest.edge))nearest={s,t,edge};
    }
    if(!nearest)return base;
    for(const s of protectedStairs){
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;if(!length2)continue;
      const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2));
      if(Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t)<=s.width/2+.15)return base;
    }
    const {s,t,edge}=nearest;
    // Support below the lower tread, keeping the complete visible riser.
    // Viewer terrain offset -.06 leaves .105 m below a flat paving surface.
    const level=s.ya+(s.yb-s.ya)*t-(s.stair?s.rise:0)-.045;
    return base+(level-base)*(1-smooth(edge/shoulder));
  };
}
