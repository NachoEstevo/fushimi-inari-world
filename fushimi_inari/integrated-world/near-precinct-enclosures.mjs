import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

const ROW=['way/305214367','way/305214360','way/305214365','way/305214364'];
const bounds=b=>[Math.min(...b.points.map(p=>p[0])),Math.max(...b.points.map(p=>p[0])),Math.min(...b.points.map(p=>p[2])),Math.max(...b.points.map(p=>p[2]))];
// No precinct barrier linework is supplied in entrance-barriers.json. These
// short open runs are photo-inferred from mapped roof edges, never a surveyed
// enclosure loop. Keep Tamayama's existing local red fences under their owner.
export function nearPrecinctEnclosureRuns(features){
  const result=[],row=ROW.map(id=>features.buildings?.find(b=>b.id===id)).filter(Boolean);
  if(row.length===ROW.length){
    const bs=row.map(bounds),z=Math.min(...bs.map(b=>b[2]))-.42;
    result.push({id:'shrine-row-rear',kind:'white',a:[Math.min(...bs.map(b=>b[0])),z],b:[Math.max(...bs.map(b=>b[1])),z],height:1.8,sourceBuildings:ROW});
  }
  const okumiya=features.buildings?.find(b=>b.id==='way/301527733');
  if(okumiya){
    const b=bounds(okumiya),z=b[3]+.45;
    result.push({id:'okumiya-north-return',kind:'red',a:[b[0],z],b:[b[1],z],height:1.45,sourceBuildings:[okumiya.id]});
  }
  return result;
}

export function nearPrecinctEnclosurePlan(features,network){
  const cuts=[];
  for(const s of network.segments){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);if(!length)continue;
    const nx=-dz/length,nz=dx/length,w=s.width/2+.3;
    cuts.push([[s.a[0]+nx*w,s.a[2]+nz*w],[s.b[0]+nx*w,s.b[2]+nz*w],[s.b[0]-nx*w,s.b[2]-nz*w],[s.a[0]-nx*w,s.a[2]-nz*w]]);
    const p=s.accessJunctionTriangles??[];
    for(let j=0;j<p.length;j+=9)cuts.push([[p[j],p[j+2]],[p[j+3],p[j+5]],[p[j+6],p[j+8]]]);
  }
  const cutBounds=cuts.map(p=>[Math.min(...p.map(q=>q[0])),Math.max(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[1]))]);
  const sections=[];
  for(const run of nearPrecinctEnclosureRuns(features)){
    const dx=run.b[0]-run.a[0],dz=run.b[1]-run.a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,nx=-uz,nz=ux,count=Math.ceil(length/.8),step=length/count;
    for(let i=0;i<count;i++){
      const t=(i+.5)/count,x=run.a[0]+dx*t,z=run.a[1]+dz*t;
      const footprint=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([along,across])=>[x+ux*step/2*along+nx*.23*across,z+uz*step/2*along+nz*.23*across]);
      const area=Math.abs(polygonArea(footprint));
      // Reject the whole short section on contact. This preserves a generous
      // opening rather than leaving decorative slivers inside a mapped route.
      const fb=[Math.min(...footprint.map(p=>p[0])),Math.max(...footprint.map(p=>p[0])),Math.min(...footprint.map(p=>p[1])),Math.max(...footprint.map(p=>p[1]))];
      if(cuts.some((c,index)=>{
        const b=cutBounds[index];if(b[0]>fb[1]||b[1]<fb[0]||b[2]>fb[3]||b[3]<fb[2])return false;
        return Math.abs(area-subtractConvex(footprint,c).reduce((a,p)=>a+Math.abs(polygonArea(p)),0))>1e-7;
      }))continue;
      const ground=footprint.map(([px,pz])=>network.terrainHeight(px,pz));
      if(!ground.every(Number.isFinite))throw Error('Nonfinite near precinct enclosure footing');
      sections.push({...run,x,z,length:step,yaw:Math.atan2(-uz,ux),bottom:Math.min(...ground)-.08,base:Math.max(...ground),footprint});
    }
  }
  return sections;
}

export function buildNearPrecinctEnclosures(root,features,network,materials,colliders){
  const name='Near precinct photo inferred enclosures R78';if(root.getObjectByName(name))return null;
  const stone=materials.stoneMat??materials.entryStoneMat;if(!stone)return null;
  const plaster=materials.plasterMat,red=materials.vermilionMat,cap=materials.copperRoofMat??stone;
  if(!plaster||!red)return null;
  const batches=new Map(),sections=nearPrecinctEnclosurePlan(features,network);
  const box=(s,material,y,height,width,depth,offset=0)=>{
    if(height<=0)return;
    const g=new THREE.BoxGeometry(width,height,depth);g.rotateY(s.yaw);
    g.translate(s.x+Math.cos(s.yaw)*offset,y,s.z-Math.sin(s.yaw)*offset);
    if(!batches.has(material))batches.set(material,[]);batches.get(material).push(g);
  };
  for(const s of sections){
    box(s,stone,(s.bottom+s.base+.25)/2,s.base+.25-s.bottom,s.length,.36);
    if(s.kind==='white')box(s,plaster,s.base+(s.height+.25)/2,s.height-.25,s.length,.26);
    else{
      for(const y of [.4,s.height-.15])box(s,red,s.base+y,.09,s.length,.18);
      const count=Math.ceil(s.length/.13);
      for(let j=0;j<count;j++)box(s,red,s.base+(.28+s.height)/2,s.height-.28,.055,.11,(j+.5)*s.length/count-s.length/2);
    }
    box(s,cap,s.base+s.height+.055,.11,s.length+.012,.44);
    colliders.push({type:'box',args:[s.x,s.z,s.length/2,.22,s.yaw,s.bottom,s.base+s.height+.11,'near_precinct_'+s.id]});
  }
  if(!sections.length)return null;
  const group=new THREE.Group();group.name=name;let triangles=0;
  for(const [material,parts]of batches){
    const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
  }
  group.userData={sections:sections.length,triangles,materialBatches:batches.size,sourceRuns:nearPrecinctEnclosureRuns(features),
    provenance:'June2012 StreetView outputs/r77/streetview-landing.png: white rear wall behind adjacent shrine row. Video06:25 outputs/r77/video-0625.png: red paling beside Okumiya and large torii. Runs derived from mapped roof bounds with inferred .42/.45m offsets and1.8/1.45m heights; no surveyed barrier linework or closed loop. Mapped paths/junctions retain openings; Tamayama red fences unchanged.'};
  root.add(group);return group.userData;
}
