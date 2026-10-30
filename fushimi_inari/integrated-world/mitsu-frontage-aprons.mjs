import * as THREE from 'three';
import {createStartupCheckpoint,yieldStartupTask} from './startup-work.mjs';
import {pathWidth} from '../geography/geo-core.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

export const mitsuApronSourceIds=Object.freeze(['way/1372838160','way/1372838161']);

export function clipMitsuTerrain(positions,masks){
  const work=clipTerrainWork(positions,masks);let next=work.next();
  while(!next.done)next=work.next();return next.value;
}
export async function clipMitsuTerrainAsync(positions,masks,{yieldWork=yieldStartupTask,clock}={}){
  const checkpoint=createStartupCheckpoint({yieldWork,clock}),work=clipTerrainWork(positions,masks);let next=work.next();
  while(!next.done){const pause=checkpoint();if(pause)await pause;next=work.next();}
  return next.value;
}
function* clipTerrainWork(positions,masks){
  if(!masks.length)return Array.from(positions);
  const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const indexed=masks.map(p=>({p,b:bounds(p)})),out=[];
  const extent=[Math.min(...indexed.map(c=>c.b[0])),Math.max(...indexed.map(c=>c.b[1])),Math.min(...indexed.map(c=>c.b[2])),Math.max(...indexed.map(c=>c.b[3]))];
  for(let i=0;i<positions.length;i+=9){
    if(i%4608===0)yield;
    // Almost every world triangle is far from these small cuts. Reject using
    // raw coordinates before allocating triangle/polygon arrays for clipping.
    if(i+8>=positions.length){out.push(...positions.slice(i,i+9));continue;}
    const minX=Math.min(positions[i],positions[i+3],positions[i+6]),maxX=Math.max(positions[i],positions[i+3],positions[i+6]);
    const minZ=Math.min(positions[i+2],positions[i+5],positions[i+8]),maxZ=Math.max(positions[i+2],positions[i+5],positions[i+8]);
    let cuts=null;
    if(minX<=extent[1]&&maxX>=extent[0]&&minZ<=extent[3]&&maxZ>=extent[2]){
      for(const cut of indexed)if(minX<=cut.b[1]&&maxX>=cut.b[0]&&minZ<=cut.b[3]&&maxZ>=cut.b[2]){
        (cuts??=[]).push(cut);
      }
    }
    if(!cuts){out.push(positions[i],positions[i+1],positions[i+2],positions[i+3],positions[i+4],positions[i+5],positions[i+6],positions[i+7],positions[i+8]);continue;}
    const tri=[0,3,6].map(k=>positions.slice(i+k,i+k+3)),flat=tri.map(p=>[p[0],p[2]]);
    let pieces=[flat];for(const cut of cuts){pieces=pieces.flatMap(p=>subtractConvex(p,cut.p));if(!pieces.length)break;}
    const [a,b,c]=tri,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-12)continue;
    for(let p of pieces){if(polygonArea(p)>0)p=[...p].reverse();for(let j=1;j<p.length-1;j++){
      if(Math.abs(polygonArea([p[0],p[j],p[j+1]]))<1e-10)continue;
      for(const [x,z]of [p[0],p[j],p[j+1]]){const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;out.push(x,u*a[1]+v*b[1]+(1-u-v)*c[1],z);}
    }}
  }
  return out;
}

// Repair only the observed north/left terrain-to-curb seam in front of the
// registered gift frontage. Existing tread elevations and widths stay intact.
export function buildMitsuFrontageAprons(root,features,surfaces,materials){
  const name='Mitsutsuji north frontage mineral seam R89',old=root.getObjectByName(name);
  if(old)return old.userData;
  const sections=(surfaces.segments??[]).filter(s=>mitsuApronSourceIds.includes(s.id));
  if(!sections.length)return {sourceIds:[],triangles:0,reason:'No authoritative emitted path surfaces'};
  const cuts=[];
  for(const f of [...(features.buildings??[]),...(features.water??[])]){
    if(!f.points.some(p=>p[0]>552&&p[0]<580&&p[2]>-342&&p[2]<-318))continue;
    const ring=f.points.slice(0,-1).map(p=>new THREE.Vector2(p[0],p[2]));
    for(const t of THREE.ShapeUtils.triangulateShape(ring,[]))cuts.push(t.map(i=>ring[i].toArray()));
  }
  for(const path of features.paths??[]){
    if(mitsuApronSourceIds.includes(path.id))continue;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i];if(Math.max(a[0],b[0])<552||Math.min(a[0],b[0])>580||Math.max(a[2],b[2])< -342||Math.min(a[2],b[2])> -318)continue;
      const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<.001)continue;
      const radius=pathWidth(path.tags??{})/2+.15,nx=-dz/len*radius,nz=dx/len*radius;
      cuts.push([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
    }
  }
  const positions=[],uv=[],records=[],terrainMasks=[];
  for(const s of sections){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);if(length<.001)continue;
    const nx=dz/length,nz=-dx/length,inner=s.width/2+.13,width=.42,rows=Math.max(1,Math.ceil(length/.35));
    // Existing central slabs and both curbs already own this surface. Remove
    // only the raw DEM triangles underneath, never lower or flatten the DEM.
    terrainMasks.push([[s.a[0]+nx*inner,s.a[2]+nz*inner],[s.b[0]+nx*inner,s.b[2]+nz*inner],[s.b[0]-nx*inner,s.b[2]-nz*inner],[s.a[0]-nx*inner,s.a[2]-nz*inner]]);
    const vertex=(t,k)=>{
      const offset=inner+k*width,x=s.a[0]+dx*t+nx*offset,z=s.a[2]+dz*t+nz*offset;
      // Viewer terrain skin is terrainHeight-.06. Meeting that exact plane
      // closes the outer edge; terrainHeight+.014 left a visible .074m slot
      // after the buried DEM triangles were correctly clipped away.
      const edge=s.ya+(s.yb-s.ya)*t+(s.curbLip??.025)+.003,outer=surfaces.terrainHeight(x,z)-.06,y=edge*(1-k)+outer*k;
      if(![x,y,z].every(Number.isFinite))throw Error('Nonfinite Mitsutsuji apron height');return [x,y,z];
    };
    let emitted=0;
    for(let row=0;row<rows;row++)for(let col=0;col<3;col++){
      const v=[vertex(row/rows,col/3),vertex((row+1)/rows,col/3),vertex((row+1)/rows,(col+1)/3),vertex(row/rows,(col+1)/3)];
      for(const order of [[0,1,2],[0,2,3]]){
        const tri=order.map(i=>v[i]),flat=tri.map(p=>[p[0],p[2]]);let pieces=[flat];
        for(const cut of cuts){pieces=pieces.flatMap(p=>subtractConvex(p,cut));if(!pieces.length)break;}
        const [a,b,c]=tri,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
        if(Math.abs(den)<1e-12)continue;
        for(let p of pieces){
          if(polygonArea(p)>0)p=[...p].reverse();
          for(let i=1;i<p.length-1;i++){
            if(Math.abs(polygonArea([p[0],p[i],p[i+1]]))<1e-10)continue;
            for(const [x,z]of [p[0],p[i],p[i+1]]){
              const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,w=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,y=u*a[1]+w*b[1]+(1-u-w)*c[1];
              positions.push(x,y,z);uv.push(x/1.5,z/1.5);
            }
            emitted++;
          }
        }
      }
    }
    records.push({sourceId:s.id,a:s.a,b:s.b,ya:s.ya,yb:s.yb,stair:s.stair,width:s.width,collarWidth:width,offset:inner,triangles:emitted});
  }
  if(!positions.length)return {sourceIds:[],triangles:0,reason:'All seam surfaces excluded by mapped ownership'};
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=(materials.entryStoneMat??materials.stoneMat).clone();material.color.set('#96978c');material.roughness=1;material.side=THREE.FrontSide;
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.receiveShadow=true;
  const previous=surfaces.height.bind(surfaces),sample=makeShoulderTriangleHeight(geometry.attributes.position.array);surfaces.height=(x,z)=>sample(x,z)??previous(x,z);
  const priorShoulderExclusion=surfaces.omitEarthShoulder;
  surfaces.omitEarthShoulder=(segment,side)=>(mitsuApronSourceIds.includes(segment.id)&&side===-1)||Boolean(priorShoulderExclusion?.(segment,side));
  mesh.userData={sourceIds:[...new Set(records.filter(r=>r.triangles).map(r=>r.sourceId))],records,drawBatches:1,triangles:positions.length/9,collarWidth:.42,side:'north/left uphill only',walkingHeightRegistered:true,
    provenance:'R88 native review pinpointed coarse brown terrain wedges x561..564/z-333..-330; inspected IMG_6659_20210328 wide lane shows mineral margins. Narrow inferred collar outside actual emitted .13m curb, follows each authoritative tread/segment plane and raw terrain at outer edge. Exact source building/water/other-route cuts.',
    limits:'No terrain edit, broad grading, new stairs, altered tread count, new collider or shop floor claim. Appearance and .42m mineral collar width inferred.'};
  for(let i=0;i<positions.length;i+=9)terrainMasks.push([[positions[i],positions[i+2]],[positions[i+3],positions[i+5]],[positions[i+6],positions[i+8]]]);
  mesh.userData.clipTerrain=input=>clipMitsuTerrain(input,terrainMasks);
  mesh.userData.clipTerrainAsync=(input,options)=>clipMitsuTerrainAsync(input,terrainMasks,options);
  root.add(mesh);return mesh.userData;
}
