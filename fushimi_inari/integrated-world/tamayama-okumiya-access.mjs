import {pathOffset} from './path-frame.mjs?v=10';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

// Two mapped junctions have broad, sloping landings whose ribbons overlap a
// narrower side path. Nearest-centreline ownership used to switch between two
// different planes (34–37 cm at the walking lanes). These small patches own
// the actual pavement union; their emitted triangles also supply walking Y.
// No source coordinates, stair levels/counts, widths or distant paths change.
const JUNCTIONS=[
  {id:'tamayama',landing:'way/1133055112',branches:['way/1133055113'],node:10564305290,
    stair:'way/1133055110',blend:1.5},
  {id:'okumiya',landing:'way/1392716577',branches:['way/105449724','way/1385048220'],node:2065278030,blend:1.5},
];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const bounds=polygon=>polygon.reduce((b,p)=>[Math.min(b[0],p[0]),Math.max(b[1],p[0]),Math.min(b[2],p[1]),Math.max(b[3],p[1])],[Infinity,-Infinity,Infinity,-Infinity]);
const inBounds=(x,z,b,pad=0)=>x>=b[0]-pad&&x<=b[1]+pad&&z>=b[2]-pad&&z<=b[3]+pad;
const inside=(x,z,poly)=>{
  let positive=false,negative=false;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],c=(b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0]);
    if(c>1e-8)positive=true;if(c< -1e-8)negative=true;
  }
  return !(positive&&negative);
};
function nearest(x,z,polygon){
  if(inside(x,z,polygon))return {x,z,distance:0};
  let best={distance:Infinity};
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
    const px=a[0]+dx*t,pz=a[1]+dz*t,distance=Math.hypot(x-px,z-pz);
    if(distance<best.distance)best={x:px,z:pz,distance};
  }
  return best;
}
function polygonDistance(a,b){
  if(clipConvex(a,b).length)return 0;
  return Math.min(...a.map(p=>nearest(...p,b).distance),...b.map(p=>nearest(...p,a).distance));
}
function ribbon(segments,index){
  const s=segments[index];
  const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
  const na=pathOffset(s.a,s.b,adjacent(segments[index-1],'b'));
  const nb=pathOffset(s.a,s.b,adjacent(segments[index+1],'a'),true);
  const point=(p,y,n,side)=>[p[0]+n[0]*s.width/2*side,y,p[2]+n[1]*s.width/2*side];
  const corners=[point(s.a,s.ya,na,-1),point(s.b,s.yb,nb,-1),point(s.b,s.yb,nb,1),point(s.a,s.ya,na,1)];
  const original=[...corners[0],...corners[2],...corners[1],...corners[0],...corners[3],...corners[2]];
  const polygon=corners.map(p=>[p[0],p[2]]);
  return {segment:s,polygon,bounds:bounds(polygon),original,originalHeight:makeShoulderTriangleHeight(original)};
}
function planeHeight(record,x,z){
  const hit=record.originalHeight(x,z);if(hit!==null)return hit;
  // Outside a ribbon, extend its centreline profile only as a transition
  // boundary condition; the rendered polygon never extends beyond the path.
  const s=record.segment,dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2];
  const t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz)));
  return s.ya+(s.yb-s.ya)*t;
}
function triangle(out,a,b,c){
  const area=(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
  if(Math.abs(area)<1e-9)return;
  out.push(...a,...(area>0?c:b),...(area>0?b:c));
}
function tessellate(record,cutouts,height,subdivide){
  const out=[],cell=.4;
  let pieces=[record.polygon];
  for(const hole of cutouts)pieces=pieces.flatMap(p=>subtractConvex(p,hole));
  for(const piece of pieces){
    const cells=[];
    if(subdivide){
      const pb=bounds(piece);
      for(let x=Math.floor(pb[0]/cell);x<=Math.floor(pb[1]/cell);x++)for(let z=Math.floor(pb[2]/cell);z<=Math.floor(pb[3]/cell);z++){
        const polygon=clipConvex(piece,[[x*cell,z*cell],[(x+1)*cell,z*cell],[(x+1)*cell,(z+1)*cell],[x*cell,(z+1)*cell]]);
        if(polygon.length)cells.push(polygon);
      }
    }else cells.push(piece);
    for(const polygon of cells){
      if(Math.abs(polygonArea(polygon))<1e-8)continue;
      const points=polygon.map(p=>[p[0],height(p[0],p[1]),p[1]]);
      for(let i=1;i<points.length-1;i++)triangle(out,points[0],points[i],points[i+1]);
    }
  }
  return out;
}
function sampleRecords(records,x,z){
  for(const record of records){
    if(!inBounds(x,z,record.bounds,1e-7))continue;
    const height=record.height(x,z);
    if(height!==null){
      const s=record.segment,dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz)));
      return {height,distance:Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz),segment:s};
    }
  }
  return null;
}

export function refineTamayamaOkumiyaAccess(network,features){
  if(network.accessJunctions)return network.accessJunctions;
  const records=[],mouths=[],stats={junctions:[],segments:0,triangles:0,replacedTriangles:0,extraMaterials:0,extraColliders:0};
  const indexed=network.segments.map((s,index)=>({s,index}));
  for(const config of JUNCTIONS){
    const landing=features.paths.find(p=>p.id===config.landing);
    const branches=config.branches.map(id=>features.paths.find(p=>p.id===id));
    if(!landing?.nodeIds?.includes(config.node)||branches.some(p=>!p?.nodeIds?.includes(config.node)))continue;
    const primary=indexed.filter(({s})=>s.id===config.landing&&!s.stair).map(({index})=>ribbon(network.segments,index));
    if(!primary.length)continue;
    const branchRecords=branches.map(path=>indexed.filter(({s})=>s.id===path.id&&!s.stair).map(({index})=>ribbon(network.segments,index)).filter(r=>primary.some(p=>polygonDistance(r.polygon,p.polygon)<=config.blend)));
    // Tamayama's short side connector finishes at a mapped stair within the
    // broad landing's nominal width. Reserve the unchanged tread footprint
    // and ease the landing to its lower approach, instead of covering it.
    const protectedStairs=config.stair?indexed.filter(({s})=>s.id===config.stair&&s.stair).map(({index})=>ribbon(network.segments,index)):[];
    const protectedPolygons=protectedStairs.map(r=>r.polygon);
    let landingHeight=(r,x,z)=>planeHeight(r,x,z);
    if(config.stair&&branchRecords[0]?.length){
      const path=branches[0],a=path.points[0],b=path.points.at(-1),dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),width=branchRecords[0][0].segment.width;
      landingHeight=(r,x,z)=>{
        const along=((x-a[0])*dx+(z-a[2])*dz)/length,lateral=Math.abs((z-a[2])*dx-(x-a[0])*dz)/length;
        // Keep the central west/east walking lanes on the original landing
        // grade. The side approach eases only beyond 85 cm from its axis.
        const weight=smooth((along-.85)/Math.max(.5,length-1.10))*(1-smooth((lateral-width/2)/.28));
        const base=planeHeight(r,x,z);if(!weight)return base;
        let closest=null;
        for(const branch of branchRecords[0]){const point=nearest(x,z,branch.polygon);if(!closest||point.distance<closest.point.distance)closest={branch,point};}
        return base+(planeHeight(closest.branch,closest.point.x,closest.point.z)-base)*weight;
      };
    }
    const local=[];
    const finish=(record,positions)=>{
      record.positions=positions;record.height=makeShoulderTriangleHeight(positions);
      record.segment.accessJunction=config.id;record.segment.accessJunctionTriangles=positions;
      local.push(record);records.push(record);stats.segments++;stats.triangles+=positions.length/9;stats.replacedTriangles+=2;
    };
    for(const record of primary)finish(record,tessellate(record,protectedPolygons,(x,z)=>landingHeight(record,x,z),Boolean(config.stair)));
    const occupied=primary.map(r=>r.polygon);
    for(const branch of branchRecords){
      const references=[...local],referencePolygons=[...occupied];
      for(const record of branch){
        const height=(x,z)=>{
          const base=planeHeight(record,x,z);let point=null;
          for(const polygon of referencePolygons){const candidate=nearest(x,z,polygon);if(!point||candidate.distance<point.distance)point=candidate;}
          if(!point||point.distance>=config.blend)return base;
          const target=sampleRecords(references,point.x,point.z)?.height;
          return target===undefined?base:base+(target-base)*(1-smooth(point.distance/config.blend));
        };
        finish(record,tessellate(record,[...occupied,...protectedPolygons],height,true));
      }
      occupied.push(...branch.map(r=>r.polygon));
    }
    mouths.push({records:[...primary,...branchRecords.flat(),...protectedStairs],ids:new Set([config.landing,...config.branches,config.stair].filter(Boolean))});
    stats.junctions.push({id:config.id,segments:local.length,triangles:local.reduce((n,r)=>n+r.positions.length/9,0),protectedStairs:protectedStairs.length});
  }
  if(!records.length)return stats;
  const previousSample=network.sample,previousHeight=network.height,previousTerrain=network.terrainHeight,previousEdge=network.edgeCovered;
  const sample=(x,z)=>sampleRecords(records,x,z);
  network.sample=(x,z)=>sample(x,z)??previousSample(x,z);
  network.height=(x,z)=>sample(x,z)?.height??previousHeight(x,z);
  // Apply after the existing support grades: neither DEM nor old side-path
  // fill may protrude through the shared, corrected pavement.
  network.terrainHeight=(x,z)=>{const road=sample(x,z),base=previousTerrain(x,z);return road?Math.min(base,road.height-.045):base;};
  network.edgeCovered=(x,z,y,pathId)=>{
    for(const mouth of mouths)if(mouth.ids.has(pathId))for(const r of mouth.records){
      if(r.segment.id!==pathId&&inBounds(x,z,r.bounds,1e-7)&&inside(x,z,r.polygon))return true;
    }
    return previousEdge(x,z,y,pathId);
  };
  network.accessJunctionEdgeHeight=(s,x,z,fallback)=>s.accessJunction?(sample(x,z)?.height??fallback):fallback;
  network.accessJunctions=stats;
  return stats;
}
