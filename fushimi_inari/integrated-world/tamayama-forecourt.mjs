import * as THREE from 'three';
import {tamayamaForecourtPlan} from './tamayama-forecourt-layout.mjs?v=76';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathOffset} from './path-frame.mjs';

// Material overlay only. Existing apron, paths, transitions and colliders keep
// their heights/ownership; this does not create a raised forecourt platform.
export function buildTamayamaForecourt(root,features,network,materials){
  if(root.getObjectByName('Tamayama photographed mineral forecourt'))return null;
  let shrine=null;
  root.traverse(o=>{if(o.isGroup&&o.userData.zone==='tamayama'&&o.userData.tamayamaDetail)shrine=o;});
  if(!shrine||!materials.gravelMat)return null;
  shrine.updateWorldMatrix(true,false);
  const matrix=shrine.matrixWorld.elements,outline=tamayamaForecourtPlan(matrix).envelope;
  const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const region=bounds(outline),overlap=b=>b[0]<=region[1]&&b[1]>=region[0]&&b[2]<=region[3]&&b[3]>=region[2],cuts=[];
  for(const f of [...(features.buildings??[]),...(features.water??[])]){
    const ring=f.points.map(p=>new THREE.Vector2(p[0],p[2]));
    if(!overlap(bounds(ring.map(p=>[p.x,p.y]))))continue;
    if(ring[0].equals(ring.at(-1)))ring.pop();
    for(const tri of THREE.ShapeUtils.triangulateShape(ring,[]))cuts.push(tri.map(i=>[ring[i].x,ring[i].y]));
  }
  for(const [i,s] of network.segments.entries()){
    const pad=s.width+1;
    if(!overlap([Math.min(s.a[0],s.b[0])-pad,Math.max(s.a[0],s.b[0])+pad,Math.min(s.a[2],s.b[2])-pad,Math.max(s.a[2],s.b[2])+pad]))continue;
    if(s.accessJunctionTriangles){
      const p=s.accessJunctionTriangles;
      for(let j=0;j<p.length;j+=9)cuts.push([[p[j],p[j+2]],[p[j+3],p[j+5]],[p[j+6],p[j+8]]]);
    }
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const na=pathOffset(s.a,s.b,adjacent(network.segments[i-1],'b')),nb=pathOffset(s.a,s.b,adjacent(network.segments[i+1],'a'),true);
    const w=s.width/2+(s.kind==='stone' ? .13 : 0);
    cuts.push([[s.a[0]+na[0]*w,s.a[2]+na[1]*w],[s.b[0]+nb[0]*w,s.b[2]+nb[1]*w],[s.b[0]-nb[0]*w,s.b[2]-nb[1]*w],[s.a[0]-na[0]*w,s.a[2]-na[1]*w]]);
  }
  const plan=tamayamaForecourtPlan(matrix,cuts),positions=[],uv=[],grid=.25;
  for(const polygon of plan.polygons){
    const b=bounds(polygon);
    for(let x=Math.floor(b[0]/grid)*grid;x<b[1];x+=grid)for(let z=Math.floor(b[2]/grid)*grid;z<b[3];z+=grid){
      let p=clipConvex(polygon,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);
      if(polygonArea(p)<0)p=[...p].reverse();
      for(let i=1;i<p.length-1;i++){
        const tri=[p[0],p[i+1],p[i]];if(Math.abs(polygonArea(tri))<1e-9)continue;
        for(const [px,pz]of tri){const y=network.terrainHeight(px,pz)+.012;if(!Number.isFinite(y))throw Error('Nonfinite Tamayama forecourt');positions.push(px,y,pz);uv.push(px/1.5,pz/1.5);}
      }
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const material=materials.gravelMat.clone();material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Tamayama photographed mineral forecourt';mesh.receiveShadow=true;root.add(mesh);
  const record={area:plan.area,triangles:positions.length/9,materialBatches:1,grid,
    provenance:'Commons20100714_Kyoto_Fushimi_Inari_1728, guide IMG6591_20210308 and June2012 StreetView outputs/r76/tamayama-streetview.png: mineral gravel around front lanterns and forward of apron around crossing paving; extent derived from current compound bases/fence/apron with photo-inferred .35m side/2m front margins. Occluded distant court perimeter unverified. Exact apron/pedestal/path/junction/building/water cutouts. Terrain/walking/colliders unchanged.'};
  mesh.userData=record;return record;
}
