import * as THREE from 'three';
import {tamayamaForecourtPlan,tamayamaContinuationCourtPlan} from './tamayama-forecourt-layout.mjs?v=90';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathOffset} from './path-frame.mjs';

// Material overlay only. Existing apron, paths, transitions and colliders keep
// their heights/ownership; this does not create a raised forecourt platform.
export function buildTamayamaForecourt(root,features,network,materials,{terrainPositions=null}={}){
  if(root.getObjectByName('Tamayama photographed mineral forecourt'))return null;
  let shrine=null;
  root.traverse(o=>{if(o.isGroup&&o.userData.zone==='tamayama'&&o.userData.tamayamaDetail)shrine=o;});
  if(!shrine||!materials.gravelMat)return null;
  shrine.updateWorldMatrix(true,false);
  const matrix=shrine.matrixWorld.elements,outline=[...tamayamaForecourtPlan(matrix).envelope,...tamayamaContinuationCourtPlan(features).envelope];
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
  const plan=tamayamaForecourtPlan(matrix,cuts),continuation=terrainPositions?tamayamaContinuationCourtPlan(features,[...cuts,plan.envelope]):{polygons:[],area:0,sourceIds:[]},positions=[],uv=[],grid=.25;
  const polygons=[...plan.polygons,...continuation.polygons];
  if(terrainPositions){
    const indexed=polygons.map(p=>({polygon:p,bounds:bounds(p)}));
    for(let i=0;i<terrainPositions.length;i+=9){
      const tri=[0,3,6].map(k=>terrainPositions.slice(i+k,i+k+3)),flat=tri.map(p=>[p[0],p[2]]),tb=bounds(flat);if(!overlap(tb))continue;
      const [a,b,c]=tri,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-12)continue;
      for(const entry of indexed){
        const pb=entry.bounds;if(tb[0]>pb[1]||tb[1]<pb[0]||tb[2]>pb[3]||tb[3]<pb[2])continue;
        let p=clipConvex(entry.polygon,flat);if(polygonArea(p)<0)p=[...p].reverse();
        for(let j=1;j<p.length-1;j++){
          const points=[p[0],p[j+1],p[j]];if(Math.abs(polygonArea(points))<1e-9)continue;
          for(const [x,z]of points){const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;positions.push(x,u*a[1]+v*b[1]+(1-u-v)*c[1]+.003,z);uv.push(x/1.5,z/1.5);}
        }
      }
    }
  }else for(const polygon of polygons){
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
  const record={area:plan.area+continuation.area,shrineArea:plan.area,continuationArea:continuation.area,continuationSourceIds:continuation.sourceIds,continuationEstimatedWidth:continuation.estimatedWidth,terrainRegistration:terrainPositions?'shared rendered triangle planes +.003m':'legacy shrine-only raw height grid; continuation withheld',triangles:positions.length/9,materialBatches:1,grid:terrainPositions?null:grid,
    provenance:'Commons20100714_Kyoto_Fushimi_Inari_1728, guide IMG6591_20210308 and June2012 StreetView r76 + r90 south180/west270: mineral gravel around front lanterns and the south continuation gate/court. Original shrine extent retained; continuation is a photo-inferred6.4m width following actual1133055117/297888105/1133055118, ending at source junctions. Exact apron/pedestal/path/junction/building/water cutouts; no duplicate shrine-envelope overlap. Occluded distant perimeter unverified. Terrain/walking/colliders unchanged.'};
  mesh.userData=record;return record;
}
