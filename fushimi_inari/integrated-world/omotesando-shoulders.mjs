import * as THREE from 'three';
import {omotesandoContextSpecR95} from './omotesando-context-r95.mjs';
import {upwardShoulderTriangles,makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathWidth} from '../geography/geo-core.mjs';

// Reference photograph supplied for this pass shows small grey cobble margins
// beside the central slabs. Central4.8m plus1.6m margins per side is inferred, not surveyed.
// No speculative lamps, trees, pits or walls are added with this surface pass.
export function buildOmotesandoShoulders(root,features,ground,surfaces,materials){
  const path=features.paths.find(p=>p.id==='way/105449722');
  if(!path||path.points.length<2||!materials.precinctCobbles)return null;
  const xs=path.points.map(p=>p[0]),zs=path.points.map(p=>p[2]),margin=7.5;
  const bounds=[Math.min(...xs)-margin,Math.max(...xs)+margin,Math.min(...zs)-margin,Math.max(...zs)+margin];
  const halfWidth=omotesandoContextSpecR95.centralSlabWidth/2,shoulderWidth=(omotesandoContextSpecR95.totalMappedWidth-omotesandoContextSpecR95.centralSlabWidth)/2,positions=[],uv=[];
  const polygonBounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
  const cuts=[],addCut=p=>{const b=polygonBounds(p);if(overlaps(bounds,b))cuts.push({points:p,bounds:b});};
  for(const feature of [...(features.buildings??[]),...(features.water??[])]){
    const ring=feature.points.map(p=>[p[0],p[2]]);if(!overlaps(bounds,polygonBounds(ring)))continue;
    if(ring.length>2&&ring[0][0]===ring.at(-1)[0]&&ring[0][1]===ring.at(-1)[1])ring.pop();
    for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(...p)),[]))addCut(tri.map(i=>ring[i]));
  }
  for(const other of features.paths){
    if(other.id===path.id)continue;
    const radius=pathWidth(other.tags??{})/2+.15;
    for(let i=1;i<other.points.length;i++){
      const a=other.points[i-1],b=other.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.001)continue;
      const nx=-dz/length*radius,nz=dx/length*radius;
      addCut([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]]);
    }
  }
  const points=path.points,normalAt=(i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
    return [-dz/length,dx/length];
  };
  let along=0,accepted=0,rejected=0;
  for(let segment=1;segment<points.length;segment++){
    const a=points[segment-1],b=points[segment],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
    const n0=normalAt(segment-1),n1=normalAt(segment),rows=Math.ceil(length/.8),cols=4;
    for(const side of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const vertex=(r,k)=>{
        const t=r/rows,off=k/cols*shoulderWidth,nx=n0[0]+(n1[0]-n0[0])*t,nz=n0[1]+(n1[1]-n0[1])*t,nlen=Math.hypot(nx,nz),x=a[0]+dx*t+side*nx/nlen*(halfWidth+off),z=a[2]+dz*t+side*nz/nlen*(halfWidth+off);
        const y=surfaces.height(x,z);
        return {p:[x,y,z],uv:[(along+length*t)/2,side*(halfWidth+off)/2]};
      };
      const corners=[vertex(row,col),vertex(row+1,col),vertex(row+1,col+1),vertex(row,col+1)],order=upwardShoulderTriangles(corners);let emitted=false;
      // Cut original triangles at obstacle boundaries, preserving their exact
      // blended height/UV planes instead of rejecting complete boundary cells.
      for(let k=0;k<6;k+=3){
        const tri=order.slice(k,k+3).map(i=>corners[i]),flat=tri.map(v=>[v.p[0],v.p[2]]),cellBounds=polygonBounds(flat);
        let pieces=[flat];
        for(const cut of cuts){if(overlaps(cellBounds,cut.bounds))pieces=pieces.flatMap(p=>subtractConvex(p,cut.points));if(!pieces.length)break;}
        const [a,b,c]=tri.map(v=>v.p),den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-10)continue;
        for(let piece of pieces){
          if(polygonArea(piece)<0)piece=[...piece].reverse();
          for(let j=1;j<piece.length-1;j++){
            if(Math.abs(polygonArea([piece[0],piece[j],piece[j+1]]))<1e-9)continue;
            for(const [px,pz]of [piece[0],piece[j+1],piece[j]]){
              const u=((b[2]-c[2])*(px-c[0])+(c[0]-b[0])*(pz-c[2]))/den,v=((c[2]-a[2])*(px-c[0])+(a[0]-c[0])*(pz-c[2]))/den,w=1-u-v;
              const y=u*a[1]+v*b[1]+w*c[1];if(![px,y,pz].every(Number.isFinite))throw Error('Nonfinite clipped Omotesando shoulder');
              positions.push(px,y,pz);uv.push(...[0,1].map(i=>u*tri[0].uv[i]+v*tri[1].uv[i]+w*tri[2].uv[i]));
            }
            emitted=true;
          }
        }
      }
      if(emitted)accepted++;else rejected++;
    }
    along+=length;
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const material=materials.precinctCobbles.clone();material.side=THREE.FrontSide;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Omotesando terrain-following cobble shoulders';mesh.receiveShadow=true;
  mesh.userData={sourcePath:path.id,centralWidth:halfWidth*2,totalPublicWidth:omotesandoContextSpecR95.totalMappedWidth,estimatedSideWidth:shoulderWidth,acceptedCells:accepted,rejectedCells:rejected,exactBoundaryClipping:true,provenance:'Supplied 2024 reference photo small grey cobble margins; inferred4.8m central slabs/1.6m cobble margins inside mapped8m public corridor; exact mapped path/building/water polygon subtraction'};
  // Preserve the exact public-path grade and register emitted clipped planes.
  // Surface width remains8m; only its visual slab/cobble partition changes.
  const previousHeight=surfaces.height.bind(surfaces),triangleHeight=makeShoulderTriangleHeight(geometry.attributes.position.array);
  surfaces.height=(x,z)=>triangleHeight(x,z)??previousHeight(x,z);
  mesh.userData.walkingHeightRegistered=true;
  root.add(mesh);return mesh;
}
