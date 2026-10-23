import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {okushaArrival} from './okusha-arrival.mjs';
import {pathOffset} from './path-frame.mjs';

export const okushaCourtSurfaceR95=Object.freeze({top:.14,halfX:19,halfZ:10,yaw:-.14,x:259,z:69});
export function okushaCourtSurfacePlanR95(features,network=null){
  const s=okushaCourtSurfaceR95,c=Math.cos(s.yaw),sn=Math.sin(s.yaw);
  const local=(x,z)=>[(x-s.x)*c-(z-s.z)*sn,(x-s.x)*sn+(z-s.z)*c];
  const cuts=[];
  const add=p=>{if(Math.max(...p.map(q=>q[0]))>=-19&&Math.min(...p.map(q=>q[0]))<=19&&Math.max(...p.map(q=>q[1]))>=-10&&Math.min(...p.map(q=>q[1]))<=10)cuts.push(p);};
  if(network?.segments){
    const segments=network.segments;
    for(let i=0;i<segments.length;i++){
      const s=segments[i];
      const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
      const n0=pathOffset(s.a,s.b,adjacent(segments[i-1],'b')),n1=pathOffset(s.a,s.b,adjacent(segments[i+1],'a'),true),radius=s.width/2;
      const point=(p,n,side)=>local(p[0]+n[0]*side*radius,p[2]+n[1]*side*radius);
      const quad=[point(s.a,n0,-1),point(s.b,n1,-1),point(s.b,n1,1),point(s.a,n0,1)];
      // A resampled turn's miter quad can be concave. The renderer emits this
      // exact diagonal; subtract its two convex triangles, never a convex hull.
      add([quad[0],quad[2],quad[1]]);add([quad[0],quad[3],quad[2]]);
    }
  }else for(const path of features.paths){
    if(path.tags.tunnel==='yes'||path.tags.bridge==='yes')continue;
    const radius=pathWidth(path.tags)/2;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<.001)continue;
      const nx=-dz/len*radius,nz=dx/len*radius;
      add([[a[0]+nx,a[2]+nz],[b[0]+nx,b[2]+nz],[b[0]-nx,b[2]-nz],[a[0]-nx,a[2]-nz]].map(p=>local(...p)));
    }
  }
  const r=okushaArrival;cuts.push([[r.minX,r.minZ],[r.maxX,r.minZ],[r.maxX,r.maxZ],[r.minX,r.maxZ]].map(p=>local(...p)));
  const ribbon=[[-9.5,-1.5],[5.5,-1.5],[5.5,1.5],[-9.5,1.5]];
  const subtract=(polygons,cut)=>polygons.flatMap(p=>subtractConvex(p,cut));
  let mineral=[[[-19,-10],[19,-10],[19,10],[-19,10]]],paving=[ribbon];
  mineral=subtract(mineral,ribbon);
  for(const cut of cuts){mineral=subtract(mineral,cut);paving=subtract(paving,cut);}
  return {mineral,paving,cuts,local};
}
export function buildOkushaCourtSurfacesR95(court,features,materials,network=null){
  const plan=okushaCourtSurfacePlanR95(features,network);
  for(const [key,polygons,material] of [['mineral',plan.mineral,materials.gravelMat],['paving',plan.paving,materials.precinctPaving]]){
    const positions=[],uv=[];
    for(let polygon of polygons){if(polygonArea(polygon)<0)polygon=[...polygon].reverse();for(let i=1;i<polygon.length-1;i++){
      const triangle=[polygon[0],polygon[i+1],polygon[i]];
      if(Math.abs(polygonArea(triangle.map(p=>p.map(Math.fround))))<1e-8)continue;
      for(const p of triangle){positions.push(p[0],.14,p[1]);uv.push(p[0]/1.5,p[1]/1.5);}
    }}
    if(!positions.length)continue;
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,material);mesh.name=`Okusha flush ${key} · mapped paths excluded`;mesh.receiveShadow=true;mesh.userData.okushaCourtSurfaceR95=true;court.add(mesh);
  }
  // Preserve the old apron owner's closed outside edge down to rendered terrain;
  // replacing its box with a top sheet must not leave a new floating perimeter.
  const border=[[-19,-10],[19,-10],[19,10],[-19,10]],walls=[],uv=[];
  for(let i=0;i<4;i++){
    const a=border[i],b=border[(i+1)%4];
    for(const [x,y,z]of [[a[0],-.06,a[1]],[a[0],.14,a[1]],[b[0],-.06,b[1]],[a[0],.14,a[1]],[b[0],.14,b[1]],[b[0],-.06,b[1]]]){walls.push(x,y,z);uv.push((x+z)/1.5,y/1.5);}
  }
  const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));wallGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));wallGeo.computeVertexNormals();
  const skirt=new THREE.Mesh(wallGeo,materials.gravelMat);skirt.name='Okusha existing apron perimeter closure';skirt.receiveShadow=true;court.add(skirt);
  return plan;
}
