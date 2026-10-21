import * as THREE from 'three';
import {pathOffset} from './path-frame.mjs';
import {upwardShoulderTriangles,makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

// IMG7698 shows continuous dark mineral/asphalt around the bicycle passage.
// Only the two actual access ways receive a narrow estimated construction
// shoulder; their treads, centreline and walls are never flattened or moved.
const ids=new Set(['way/626313859','way/1133052416']);
export function buildEntranceBicycleSurfaceCollar(root,features,surfaces,ground){
  if(root.getObjectByName('Bicycle passage local asphalt step collars'))return null;
  const segments=surfaces.segments.filter(s=>ids.has(s.id));if(!segments.length)return null;
  const cuts=[];
  const addCut=p=>{if(Math.max(...p.map(v=>v[0]))>=-67&&Math.min(...p.map(v=>v[0]))<=-58&&Math.max(...p.map(v=>v[1]))>=3&&Math.min(...p.map(v=>v[1]))<=19)cuts.push(p);};
  for(const f of [...features.buildings,...(features.water??[])]){
    const ring=f.points.slice(0,-1).map(p=>[p[0],p[2]]);
    if(Math.max(...ring.map(v=>v[0]))< -67||Math.min(...ring.map(v=>v[0]))> -58||Math.max(...ring.map(v=>v[1]))<3||Math.min(...ring.map(v=>v[1]))>19)continue;
    for(const t of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]))addCut(t.map(i=>ring[i]));
  }
  for(const path of features.paths){
    if(ids.has(path.id))continue;
    const half=pathWidth(path.tags??{})/2+.13;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(!length)continue;
      const nx=-dz/length*half,nz=dx/length*half;
      addCut([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
    }
  }
  const positions=[],uv=[],width=.72;let accepted=0;
  const emit=corners=>{
    const order=upwardShoulderTriangles(corners);
    for(let k=0;k<6;k+=3){
      const tri=order.slice(k,k+3).map(i=>corners[i]);let pieces=[tri.map(p=>[p[0],p[2]])];
      for(const cut of cuts){pieces=pieces.flatMap(p=>subtractConvex(p,cut));if(!pieces.length)break;}
      const [a,b,c]=tri,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;
      for(let p of pieces){
        if(polygonArea(p)<0)p=[...p].reverse();
        for(let j=1;j<p.length-1;j++){
          if(Math.abs(polygonArea([p[0],p[j],p[j+1]]))<1e-9)continue;
          for(const [x,z]of [p[0],p[j+1],p[j]]){
            const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,y=u*a[1]+v*b[1]+(1-u-v)*c[1];
            positions.push(x,y,z);uv.push(x/3,z/3);
          }
          accepted++;
        }
      }
    }
  };
  const sampleGround=(x,z)=>{const y=ground(x,z);if(!Number.isFinite(y))throw Error('Nonfinite bicycle collar ground');return y+.025;};
  for(let index=0;index<segments.length;index++){
    const s=segments[index],prev=segments[index-1]?.id===s.id?segments[index-1]:null,next=segments[index+1]?.id===s.id?segments[index+1]:null;
    const na=pathOffset(s.a,s.b,prev),nb=pathOffset(s.a,s.b,next,true);
    for(const side of [-1,1])for(let col=0;col<6;col++){
      const vertex=(end,off)=>{
        const p=end?s.b:s.a,n=end?nb:na,edge=s.width/2+.105,x=p[0]+n[0]*side*(edge+off),z=p[2]+n[1]*side*(edge+off);
        const road=(end?s.yb:s.ya)-.045,base=sampleGround(x,z),t=off/width,w=t*t*(3-2*t);
        return [x,road*(1-w)+base*w,z];
      };
      const corners=[vertex(0,col/6*width),vertex(1,col/6*width),vertex(1,(col+1)/6*width),vertex(0,(col+1)/6*width)];
      emit(corners);
    }
  }
  // Short terminal collar seats the last exposed riser into adjacent mineral
  // ground. It stops .72m beyond the mapped end, not at a fabricated carpark.
  const last=segments.at(-1),dx=last.b[0]-last.a[0],dz=last.b[2]-last.a[2],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
  for(let col=0;col<8;col++){
    const corner=(across,forward)=>{const x=last.b[0]+dx/length*forward+nx*across,z=last.b[2]+dz/length*forward+nz*across,t=forward/width;return [x,(last.yb-.045)*(1-t)+sampleGround(x,z)*t,z];};
    const lo=-last.width/2+last.width*col/8,hi=-last.width/2+last.width*(col+1)/8;
    emit([corner(lo,0),corner(lo,width),corner(hi,width),corner(hi,0)]);
  }
  if(!accepted)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const existing=root.getObjectByName('Mapped entrance parking terrain-conforming asphalt');
  const material=existing?.material?.clone()??new THREE.MeshStandardMaterial({color:'#696a67',roughness:1});
  material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Bicycle passage local asphalt step collars';mesh.receiveShadow=true;
  const previous=surfaces.height.bind(surfaces),sample=makeShoulderTriangleHeight(geometry.attributes.position.array);
  surfaces.height=(x,z)=>sample(x,z)??previous(x,z);
  const record={sourcePaths:[...ids],estimatedCollarWidth:width,triangles:positions.length/9,
    walkingHeightRegistered:true,sourcePhoto:'https://fushimiinari-guide.com/wp-content/uploads/IMG_7698_20210405.jpg',
    limits:'Local .72m side and terminal edge support; no terrain flattening, tread changes or new parking connector'};
  mesh.userData=record;root.add(mesh);return record;
}
