import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

export const entranceParkingIds=Object.freeze(['way/1325613474','way/626313864','way/264074614']);
const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
function triangles(points){
  const ring=points.filter((p,i)=>i===0||p[0]!==points[i-1][0]||p[1]!==points[i-1][1]);
  if(ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
  return THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]).map(t=>t.map(i=>ring[i]));
}
// Mapped vehicle and bicycle parking footprints only. Ground remains unchanged: the thin paved
// surface follows it; buildings and all existing path corridors have precedence.
export function buildEntranceAreaSurfaces(root,data,features,ground){
  const ways=(Array.isArray(data)?data:data.ways??[]).filter(w=>entranceParkingIds.includes(w.id));
  if(!ways.length)return null;
  const exclusions=[];
  const exclude=p=>exclusions.push({points:p,bounds:bounds(p)});
  for(const building of features.buildings)for(const triangle of triangles(building.points.map(p=>[p[0],p[2]])))exclude(triangle);
  for(const path of features.paths){
    const radius=pathWidth(path.tags)/2+.13;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
      const nx=-dz/length*radius,nz=dx/length*radius;
      exclude([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
    }
  }
  const positions=[],uv=[],reports=[],grid=2,offset=.025;
  for(const way of ways){
    const source=triangles(way.points),wayBounds=bounds(way.points),cuts=exclusions.filter(e=>overlaps(wayBounds,e.bounds));
    let area=0,triangleCount=0;
    for(const triangle of source){
      const b=bounds(triangle);
      for(let x=Math.floor(b[0]/grid)*grid;x<b[1];x+=grid)for(let z=Math.floor(b[2]/grid)*grid;z<b[3];z+=grid){
        const clipped=clipConvex(triangle,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);if(!clipped.length)continue;
        const cellBounds=[x,x+grid,z,z+grid];let pieces=[clipped];
        for(const cut of cuts){
          if(!overlaps(cellBounds,cut.bounds))continue;
          pieces=pieces.flatMap(p=>subtractConvex(p,cut.points));if(!pieces.length)break;
        }
        for(let piece of pieces){
          if(polygonArea(piece)<0)piece=[...piece].reverse();
          area+=Math.abs(polygonArea(piece));
          for(let i=1;i<piece.length-1;i++){
            const a=piece[0],b=piece[i],c=piece[i+1];
            if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-5)continue;
            // Counterclockwise x/z order faces down in Three's y-up coordinates.
            for(const p of [piece[0],piece[i+1],piece[i]]){
              const y=ground(p[0],p[1])+offset;if(!Number.isFinite(y))throw Error('Nonfinite mapped parking surface elevation');
              positions.push(p[0],y,p[1]);uv.push(p[0]/3,p[1]/3);
            }
            triangleCount++;
          }
        }
      }
    }
    reports.push({id:way.id,area,triangles:triangleCount,materialSource:way.id==='way/264074614'?'2021 photograph IMG_7698_20210405 shows dark asphalt inside bicycle entrance; extending finish across mapped recess is inferred':way.tags.surface==='asphalt'?'OSM surface tag':'inferred asphalt from four mapped asphalt parking aisles'});
  }
  if(!positions.length)return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
  let seed=541;const pixels=ctx.createImageData(128,128);
  for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=92+(seed%15);pixels.data[i]=value;pixels.data[i+1]=value+1;pixels.data[i+2]=value;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
  const material=new THREE.MeshStandardMaterial({color:'#ffffff',map,roughness:1,side:THREE.FrontSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Mapped entrance parking terrain-conforming asphalt';mesh.castShadow=mesh.receiveShadow=false;
  mesh.userData={ways:reports,grid,offset,precedence:'Existing paths and building footprints subtracted exactly; parking sits 0.025m above unchanged ground, below ordinary roadbed offsets',provenance:'entrance-surfaces-r54.json OSM parking polygons; NPC asphalt explicit, south parking material inferred from mapped asphalt aisles. No terrain flattening or new grass.'};root.add(mesh);return mesh;
}
