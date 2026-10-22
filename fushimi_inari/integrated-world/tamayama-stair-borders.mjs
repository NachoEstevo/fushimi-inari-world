import * as THREE from 'three';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {pathOffset} from './path-frame.mjs';

const NAME='Tamayama west stair rough stone retaining edges';
// Video 05:25, outputs/r77/video-0525.png: rough stone retaining faces flank
// the broad flight beneath the left roofed enclosure and right trees/bases.
// Alignment, width and heights belong to the resolved mapped flight. The
// .48 m thickness and .55 m exposed height are inferred, not surveyed. This
// owns only the low stone edge, not the enclosure, rail or pedestal monuments.
export function tamayamaStairBorderPlan(network,obstacles=[]){
  const flight=network.segments.filter(s=>s.id==='way/105449693'&&s.stair);
  if(!flight.length)return [];
  const bounds=p=>[Math.min(...p.map(q=>q[0])),Math.max(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[1]))];
  const region=bounds(flight.flatMap(s=>[s.a,s.b].map(p=>[p[0],p[2]]))),margin=Math.max(...flight.map(s=>s.width/2))+.63;
  const nearby=p=>{const b=bounds(p);return b[0]<=region[1]+margin&&b[1]>=region[0]-margin&&b[2]<=region[3]+margin&&b[3]>=region[2]-margin;};
  const cuts=obstacles.filter(nearby);
  for(const [i,s]of network.segments.entries()){
    if(s.id==='way/105449693')continue;
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const a=pathOffset(s.a,s.b,adjacent(network.segments[i-1],'b')),b=pathOffset(s.a,s.b,adjacent(network.segments[i+1],'a'),true),w=s.width/2+.15;
    const footprint=[[s.a[0]+a[0]*w,s.a[2]+a[1]*w],[s.b[0]+b[0]*w,s.b[2]+b[1]*w],[s.b[0]-b[0]*w,s.b[2]-b[1]*w],[s.a[0]-a[0]*w,s.a[2]-a[1]*w]];
    if(!nearby(footprint))continue;
    cuts.push(footprint);
    const p=s.accessJunctionTriangles??[];
    for(let j=0;j<p.length;j+=9)cuts.push([[p[j],p[j+2]],[p[j+3],p[j+5]],[p[j+6],p[j+8]]]);
  }
  const blocks=[];
  for(const [index,s]of flight.entries()){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);
    if(length<1e-6)continue;
    const nx=-dz/length,nz=dx/length,count=Math.ceil(length/.75);
    for(const side of [-1,1])for(let j=0;j<count;j++){
      const t0=j/count,t1=(j+1)/count;
      const at=(t,r)=>[s.a[0]+dx*t+nx*r*side,s.a[2]+dz*t+nz*r*side];
      const inner=s.width/2+.14,outer=inner+.48;
      let pieces=[[at(t0,inner),at(t1,inner),at(t1,outer),at(t0,outer)]];
      for(const cut of cuts)pieces=pieces.flatMap(p=>subtractConvex(p,cut));
      for(let polygon of pieces){
        if(Math.abs(polygonArea(polygon))<1e-7)continue;
        if(polygonArea(polygon)<0)polygon=[...polygon].reverse();
        const surface=(t)=>s.ya+(s.yb-s.ya)*t;
        const terrain=polygon.map(([x,z])=>network.terrainHeight(x,z));
        if(!terrain.every(Number.isFinite))throw Error('Nonfinite Tamayama retaining support');
        const bottom=Math.min(...terrain,surface(t0),surface(t1))-.12;
        // Small deterministic variation breaks a perfectly machined coping.
        const top=Math.max(...terrain,surface(t0),surface(t1))+.55+((index+j)%3-1)*.025;
        blocks.push({polygon,bottom,top,side});
      }
    }
  }
  return blocks;
}

export function buildTamayamaStairBorders(root,features,network,materials){
  if(root.getObjectByName(NAME))return null;
  const material=materials.stoneMat??materials.entryStoneMat;
  if(!material)return null;
  const obstacles=[];
  for(const f of [...(features.buildings??[]),...(features.water??[])]){
    const ring=f.points.map(p=>new THREE.Vector2(p[0],p[2]));
    if(ring[0]?.equals(ring.at(-1)))ring.pop();
    for(const tri of THREE.ShapeUtils.triangulateShape(ring,[]))obstacles.push(tri.map(i=>[ring[i].x,ring[i].y]));
  }
  const blocks=tamayamaStairBorderPlan(network,obstacles),positions=[],uv=[];
  const vertex=([x,z],y)=>{positions.push(x,y,z);uv.push((x+z)/1.4,y/1.4);};
  for(const {polygon:p,bottom,top}of blocks){
    for(let i=1;i<p.length-1;i++)for(const q of [p[0],p[i+1],p[i]])vertex(q,top);
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length];
      for(const [q,y]of [[a,bottom],[a,top],[b,top],[a,bottom],[b,top],[b,bottom]])vertex(q,y);
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=NAME;mesh.castShadow=mesh.receiveShadow=true;
  const record={sourcePath:'way/105449693',blocks:blocks.length,triangles:positions.length/9,materialBatches:1,estimatedThickness:.48,estimatedHeight:.55,
    provenance:'Video05:25 outputs/r77/video-0525.png; inferred low rough stone retaining edges outside resolved flight curb, clipped at other mapped paths/junctions/buildings/water; existing terrain and walking preserved. Roofed enclosure and monuments remain separate owners.'};
  mesh.userData=record;root.add(mesh);return record;
}
