import * as THREE from 'three';
import {makeOmotesandoShoulderExclusion,shoulderHeight,upwardShoulderTriangles,makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

// Reference photograph supplied for this pass shows small grey cobble margins
// beside the central slabs. Width2.8m per side is inferred, not surveyed.
// No speculative lamps, trees, pits or walls are added with this surface pass.
export function buildOmotesandoShoulders(root,features,ground,surfaces,materials){
  const path=features.paths.find(p=>p.id==='way/105449722');
  if(!path||path.points.length<2||!materials.precinctCobbles)return null;
  const xs=path.points.map(p=>p[0]),zs=path.points.map(p=>p[2]),margin=7.5;
  const bounds=[Math.min(...xs)-margin,Math.max(...xs)+margin,Math.min(...zs)-margin,Math.max(...zs)+margin];
  const halfWidth=4,shoulderWidth=2.8,excluded=makeOmotesandoShoulderExclusion(features,bounds),positions=[],uv=[];
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
        const ex=a[0]+dx*t+side*nx/nlen*halfWidth,ez=a[2]+dz*t+side*nz/nlen*halfWidth,y=shoulderHeight(off,surfaces.height(ex,ez),ground(x,z));
        return {p:[x,y,z],uv:[(along+length*t)/2,side*(halfWidth+off)/2]};
      };
      const corners=[vertex(row,col),vertex(row+1,col),vertex(row+1,col+1),vertex(row,col+1)],cx=corners.reduce((n,v)=>n+v.p[0],0)/4,cz=corners.reduce((n,v)=>n+v.p[2],0)/4;
      const radius=Math.max(...corners.map(v=>Math.hypot(v.p[0]-cx,v.p[2]-cz)));
      if(excluded(cx,cz,radius)||corners.some(v=>excluded(v.p[0],v.p[2]))){rejected++;continue;}
      for(const i of upwardShoulderTriangles(corners)){positions.push(...corners[i].p);uv.push(...corners[i].uv);}accepted++;
    }
    along+=length;
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const material=materials.precinctCobbles.clone();material.side=THREE.FrontSide;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Omotesando terrain-following cobble shoulders';mesh.receiveShadow=true;
  mesh.userData={sourcePath:path.id,centralWidth:8,estimatedSideWidth:shoulderWidth,acceptedCells:accepted,rejectedCells:rejected,provenance:'Supplied 2024 reference photo small grey cobble margins; inferred2.8m shoulder extent; mapped paths/buildings/water excluded'};
  // The narrow blend can sit above raw terrain near the slab edge. Register
  // the exact rendered planes so feet follow that blend, rather than its DEM.
  const previousHeight=surfaces.height.bind(surfaces),triangleHeight=makeShoulderTriangleHeight(geometry.attributes.position.array);
  surfaces.height=(x,z)=>triangleHeight(x,z)??previousHeight(x,z);
  mesh.userData.walkingHeightRegistered=true;
  root.add(mesh);return mesh;
}
