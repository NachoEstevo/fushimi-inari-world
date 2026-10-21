import * as THREE from 'three';
import {pathOffset} from './path-frame.mjs';
import {upwardShoulderTriangles} from './omotesando-shoulders-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

export const gishikidenAccessSurfaceId='way/626313860';

// DSC_0516-1 shows fine grey hard access between the brick cherry bed and
// Gishikiden. The source gives a 5m footway, but no material tag: asphalt is a
// photographic interpretation, not a new OSM surface claim. Keep the existing
// walking profile and exact mapped corridor rather than painting a parcel.
export function buildGishikidenAccessSurface(root,features,surfaces){
  if(root.getObjectByName('Photographed Gishikiden lateral access finish'))return null;
  const segments=surfaces.segments.filter(s=>s.id===gishikidenAccessSurfaceId&&!s.stair);
  if(!segments.length)return null;
  const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
  const reach=bounds(segments.flatMap(s=>[s.a,s.b]).map(p=>[p[0],p[2]]));
  const region=[reach[0]-6,reach[1]+6,reach[2]-6,reach[3]+6],cuts=[];
  const addCut=points=>{const b=bounds(points);if(overlaps(region,b))cuts.push({points,bounds:b});};
  for(const feature of [...features.buildings,...(features.water??[])]){
    const ring=feature.points.map(p=>[p[0],p[2]]);
    if(!overlaps(region,bounds(ring)))continue;
    if(ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
    for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]))addCut(tri.map(i=>ring[i]));
  }
  for(const path of features.paths){
    if(path.id===gishikidenAccessSurfaceId)continue;
    const radius=pathWidth(path.tags??{})/2+.13;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.001)continue;
      const nx=-dz/length*radius,nz=dx/length*radius;
      addCut([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
    }
  }
  const positions=[],uv=[],colors=[];let cells=0,rejected=0,clippedTriangles=0;
  for(let i=0;i<segments.length;i++){
    const s=segments[i],previous=segments[i-1],next=segments[i+1];
    const connects=(p,q)=>Math.hypot(p[0]-q[0],p[2]-q[2])<.001;
    const na=pathOffset(s.a,s.b,previous&&connects(previous.b,s.a)?previous:null);
    const nb=pathOffset(s.a,s.b,next&&connects(s.b,next.a)?next:null,true);
    const width=s.width,columns=Math.ceil(width/.35);
    const point=(t,offset)=>{
      const n=[na[0]+(nb[0]-na[0])*t,na[1]+(nb[1]-na[1])*t];
      return [s.a[0]+(s.b[0]-s.a[0])*t+n[0]*offset,s.ya+(s.yb-s.ya)*t+.012,s.a[2]+(s.b[2]-s.a[2])*t+n[1]*offset];
    };
    for(let col=0;col<columns;col++){
      const lo=-width/2+width*col/columns,hi=-width/2+width*(col+1)/columns;
      const corners=[point(0,lo),point(1,lo),point(1,hi),point(0,hi)];
      const order=upwardShoulderTriangles(corners);let emitted=false;
      // Clip each of the actual ribbon triangles, then recover Y by its exact
      // barycentric plane. No discarded boundary cells reveal cobble stripes.
      for(let k=0;k<6;k+=3){
        const tri=order.slice(k,k+3).map(i=>corners[i]),flat=tri.map(p=>[p[0],p[2]]),b=bounds(flat);
        let pieces=[flat];
        for(const cut of cuts){if(overlaps(b,cut.bounds))pieces=pieces.flatMap(p=>subtractConvex(p,cut.points));if(!pieces.length)break;}
        const [a,bv,cv]=tri,den=(bv[2]-cv[2])*(a[0]-cv[0])+(cv[0]-bv[0])*(a[2]-cv[2]);
        if(Math.abs(den)<1e-10)continue;
        for(let piece of pieces){
          if(polygonArea(piece)<0)piece=[...piece].reverse();
          for(let j=1;j<piece.length-1;j++){
            if(Math.abs(polygonArea([piece[0],piece[j],piece[j+1]]))<1e-9)continue;
            for(const [px,pz]of [piece[0],piece[j+1],piece[j]]){
              const u=((bv[2]-cv[2])*(px-cv[0])+(cv[0]-bv[0])*(pz-cv[2]))/den,v=((cv[2]-a[2])*(px-cv[0])+(a[0]-cv[0])*(pz-cv[2]))/den;
              const y=u*a[1]+v*bv[1]+(1-u-v)*cv[1],tone=.93+.025*Math.sin(px*.61+pz*.43);
              if(![px,y,pz].every(Number.isFinite))throw Error('Nonfinite Gishikiden access surface');
              positions.push(px,y,pz);uv.push(px/2,pz/2);colors.push(tone,tone,tone);
            }
            emitted=true;clippedTriangles++;
          }
        }
      }
      if(emitted)cells++;else rejected++;
    }
  }
  if(!cells)return null;
  const size=128,pixels=new Uint8Array(size*size*4);let seed=6301;
  for(let i=0;i<pixels.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=107+seed%22;pixels[i]=grain;pixels[i+1]=grain+1;pixels[i+2]=grain;pixels[i+3]=255;}
  const map=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.004,vertexColors:true,roughness:.99,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Photographed Gishikiden lateral access finish';mesh.receiveShadow=true;
  const record={sourcePath:gishikidenAccessSurfaceId,sourceWidth:5,cells,rejected,clippedTriangles,triangles:positions.length/9,
    sourcePhoto:'https://www.goriluckey.com/wp-content/uploads/DSC_0516-1.jpg',
    surface:'Fine grey hard/asphalt appearance interpreted from photo; source has no surface tag',
    boundaries:'Exact polygon subtraction of other routes, buildings and water from original ribbon triangles; no whole-cell boundary rejection',
    walkingHeight:'Unchanged;12mm visual finish above existing ribbon',draws:1};
  mesh.userData=record;root.add(mesh);return record;
}
