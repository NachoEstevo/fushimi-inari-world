import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';

// These mapped junctions have overlapping sloped path ribbons. The
// nearest centerline sampler can sit below another visible ribbon there.
const junctions=[['way/79699849','way/79699850'],['way/105449722','way/626313859'],['way/105449722','way/626313860'],['way/105449676','way/626313855']];

export function buildStationApproachSurfaceFixes(assembly,pathGroup,features){
 const base=assembly?.walkHeight,stats={regions:[],triangles:0,cells:0};
 if(typeof base!=='function'||!pathGroup?.traverse)return {built:false,walkHeight:base,stats};
 const regions=[];
 for(const ids of junctions){
  const paths=ids.map(id=>features?.paths?.find(p=>p.id===id));if(paths.some(p=>!p))continue;
  const shared=paths[0].nodeIds?.filter(id=>paths[1].nodeIds?.includes(id));if(shared?.length!==1)continue;
  const center=paths[0].points[paths[0].nodeIds.indexOf(shared[0])],other=paths[1].points[paths[1].nodeIds.indexOf(shared[0])];
  if(!center||!other||Math.hypot(center[0]-other[0],center[2]-other[2])>.001)continue;
  regions.push({ids,sourceNode:shared[0],center:[center[0],center[2]],radius:Math.max(...paths.map(p=>pathWidth(p.tags)))/2+.3});
 }
 if(!regions.length)return {built:false,walkHeight:base,stats};
 const size=2,allowed=new Set(),cells=new Map(),key=(x,z)=>x+','+z;
 for(const {center:[x,z],radius:r}of regions)for(let cx=Math.floor((x-r)/size);cx<=Math.floor((x+r)/size);cx++)for(let cz=Math.floor((z-r)/size);cz<=Math.floor((z+r)/size);cz++)allowed.add(key(cx,cz));
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),normal=new THREE.Vector3();pathGroup.updateMatrixWorld(true);
 pathGroup.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh)return;
  const position=mesh.geometry?.attributes.position,index=mesh.geometry?.index;if(!position)return;
  for(let i=0;i<(index?.count??position.count);i+=3){
   a.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);b.fromBufferAttribute(position,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);c.fromBufferAttribute(position,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
   normal.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a));if(normal.y<=0||normal.y/normal.length()<.75)continue;
   const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-10)continue;
   const keys=[];for(let x=Math.floor(Math.min(a.x,b.x,c.x)/size);x<=Math.floor(Math.max(a.x,b.x,c.x)/size);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/size);z<=Math.floor(Math.max(a.z,b.z,c.z)/size);z++)if(allowed.has(key(x,z)))keys.push(key(x,z));
   if(!keys.length)continue;const triangle={a:a.toArray(),b:b.toArray(),c:c.toArray(),den};stats.triangles++;
   for(const k of keys){if(!cells.has(k))cells.set(k,[]);cells.get(k).push(triangle);}
  }
 });
 stats.regions=regions;stats.cells=cells.size;
 if(!stats.triangles)return {built:false,walkHeight:base,stats};
 const walkHeight=(x,z,previous)=>{
  const original=base.call(assembly,x,z,previous);if(!Number.isFinite(original)||!regions.some(r=>Math.hypot(x-r.center[0],z-r.center[1])<=r.radius))return original;
  let height=original;
  for(const {a,b,c,den}of cells.get(key(Math.floor(x/size),Math.floor(z/size)))??[]){
   const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(Math.min(u,v,w)<0)continue;
   const candidate=u*a[1]+v*b[1]+w*c[1];if(candidate>height&&candidate<=original+.24+1e-8)height=candidate;
  }
  return height;
 };
 return {built:true,walkHeight,stats};
}
