// OSM access ways around Okumiya and Tamayama. The mapped stair centreline,
// endpoints and widths remain authoritative; shoulder dimensions are inferred.
const ACCESS = new Set(['way/626313768','way/1133055119','way/1392716577',
  'way/105449724','way/1385048220']);
const smooth = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// The 2.223 m mapped landing joins nodes 12892244785 and 2065278030.
// Its 6 m width means the stair and side paths overlap before their centreline
// endpoints meet. Direct-node-only curb clipping misses that physical mouth.
export function okumiyaLandingEdges(network,features,previous=network.edgeCovered){
  const connector=features.paths.find(p=>p.id==='way/1392716577');
  if(!connector)return previous;
  const nodes=new Set(connector.nodeIds??[]);
  const connected=new Set(features.paths.filter(p=>ACCESS.has(p.id)&&
    (p.nodeIds??[]).some(id=>nodes.has(id))).map(p=>p.id));
  const segments=network.segments.filter(s=>connected.has(s.id));
  const junction=connector.points;
  return (x,z,y,pathId)=>{
    if(previous(x,z,y,pathId))return true;
    if(!connected.has(pathId)||!junction.some(p=>Math.hypot(x-p[0],z-p[2])<6))return false;
    for(const s of segments){
      if(s.id===pathId)continue;
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;
      if(!length2)continue;
      const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2));
      if(Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)<s.width/2+.12&&
        Math.abs(y-s.ya-(s.yb-s.ya)*t)<.25)return true;
    }
    return false;
  };
}

// Terrain support only: never modify walking heights or create another slab.
// The renderer lowers terrain a further 6 cm, leaving a shallow paving edge.
export function okumiyaTerrainGrade(network,previousTerrainHeight=network.terrainHeight){
  const segments=network.segments.filter(s=>ACCESS.has(s.id));
  const bounds=segments.reduce((b,s)=>{
    const r=s.width/2+1.5;
    for(const p of [s.a,s.b]){b[0]=Math.min(b[0],p[0]-r);b[1]=Math.max(b[1],p[0]+r);b[2]=Math.min(b[2],p[2]-r);b[3]=Math.max(b[3],p[2]+r);}
    return b;
  },[Infinity,-Infinity,Infinity,-Infinity]);
  return (x,z)=>{
    if(x<bounds[0]||x>bounds[1]||z<bounds[2]||z>bounds[3])return previousTerrainHeight(x,z);
    let nearest=null;
    for(const s of segments){
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length2=dx*dx+dz*dz;
      if(!length2)continue;
      const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/length2));
      const distance=Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz);
      const edge=distance-s.width/2;
      if(edge>=1.5)continue;
      // Prefer the interior of a wide landing over a neighbouring narrow path.
      if(!nearest||edge<nearest.edge)nearest={s,t,edge};
    }
    if(!nearest)return previousTerrainHeight(x,z);
    const {s,t,edge}=nearest;
    // Stairs retain their full authored riser: the fill supports the lower
    // tread level, rather than covering the visible face of the next riser.
    const level=s.ya+(s.yb-s.ya)*t-(s.stair?s.rise:0)-.045;
    const blend=1-smooth(edge/1.5);
    // At the outer shoulder meet the existing terrain exactly. This bounded
    // fill/cut follows each mapped flight instead of flattening both shrines
    // to a shared datum (their real DEM elevations differ by several metres).
    const base=previousTerrainHeight(x,z);
    return base+(level-base)*blend;
  };
}
