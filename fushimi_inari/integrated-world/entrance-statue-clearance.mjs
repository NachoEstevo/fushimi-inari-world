import * as THREE from 'three';
import {statueWallShift} from './entrance-statue-clearance-layout.mjs';
import {entranceMappedWallIds,entranceMappedHedgeIds} from './entrance-mapped-boundaries.mjs?v=56';

export function clearEntranceStatues(root,barriers,features,surfaces,colliders){
 root.updateWorldMatrix(true,true);const foxes=[];root.traverse(o=>{if(o.userData.foxStatue&&Math.abs(o.position.z-38.5)<.001&&Math.abs(Math.abs(o.position.x)-5.6)<.001)foxes.push(o);});
 const walls=barriers.ways.filter(w=>entranceMappedWallIds.includes(w.id)||entranceMappedHedgeIds.includes(w.id)),path=features.paths.find(p=>p.id==='way/105449722'),reports=[];
 if(!path)return reports;
 for(const fox of foxes){
  const parent=fox.parent,sourceX=fox.position.x,pieces=parent.children.filter(o=>o===fox||o.isMesh&&Math.abs(o.position.x-sourceX)<.001&&Math.abs(o.position.z-38.5)<.001&&[1.65,1.28].includes(o.geometry?.parameters?.width));
  if(pieces.length!==3)continue;
  const bounds=new THREE.Box3();for(const p of pieces)bounds.union(new THREE.Box3().setFromObject(p));
  const center=bounds.getCenter(new THREE.Vector3()),old=[center.x,center.z];let publicPoint=null,nearest=Infinity;
  for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((center.x-a[0])*dx+(center.z-a[2])*dz)/(dx*dx+dz*dz)));
   const q=[a[0]+t*dx,a[2]+t*dz],d=Math.hypot(q[0]-center.x,q[1]-center.z);if(d<nearest){nearest=d;publicPoint=q;}
  }
  const corners=[[bounds.min.x,bounds.min.z],[bounds.min.x,bounds.max.z],[bounds.max.x,bounds.min.z],[bounds.max.x,bounds.max.z]],shift=[0,0];
  for(let pass=0;pass<3;pass++){const step=statueWallShift([old[0]+shift[0],old[1]+shift[1]],corners.map(p=>[p[0]+shift[0],p[1]+shift[1]]),walls,publicPoint);shift[0]+=step[0];shift[1]+=step[1];if(Math.hypot(...step)<.001)break;}
  if(Math.hypot(...shift)<.001){reports.push({sourceX,shift,unchanged:true});continue;}
  const base=surfaces.height(center.x+shift[0],center.z+shift[1]),dy=base-bounds.min.y;
  const group=new THREE.Group();group.name='Entrance kitsune with wall clearance';root.add(group);for(const p of pieces)group.attach(p);
  group.position.set(shift[0],dy,shift[1]);group.updateWorldMatrix(true,true);
  const collider=colliders.filter(c=>c.args.at(-1)==='omotesando_kitsune').sort((a,b)=>Math.hypot(a.args[0]-old[0],a.args[1]-old[1])-Math.hypot(b.args[0]-old[0],b.args[1]-old[1]))[0];
  if(collider&&Math.hypot(collider.args[0]-old[0],collider.args[1]-old[1])<2){collider.args[0]+=shift[0];collider.args[1]+=shift[1];collider.args[5]+=dy;collider.args[6]+=dy;}
  reports.push({sourceX,shift,base,provenance:'Minimal public-side clearance from mapped wall; statue placement remains inferred'});
 }
 return reports;
}
