import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';

// These source walls were absent from entranceMappedWallIds. No line is
// extended across the 7.5m source gap or joined to an inferred building.
export const approachWallIdsR87=Object.freeze(['way/1133052419','way/1133052421']);
const distance=(x,z,a,b)=>{
  const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);
};

export function buildApproachContextR87(root,features,barriers,surfaces,materials,colliders){
  const name='Mapped Temizuya lateral white boundaries R87',existing=root.getObjectByName(name);
  if(existing)return existing.userData;
  const group=new THREE.Group();group.name=name;
  const priorBoundaries=colliders.filter(c=>c.type==='box'&&/wall|boundary/.test(String(c.args.at(-1))));
  const footprintBlocked=makeOmotesandoShoulderExclusion({...features,paths:[]});
  const batches=new Map(),dummy=new THREE.Object3D(),records=[],skipped=[];
  const stone=materials.entryStoneMat??materials.stoneMat;
  const plaster=new THREE.MeshStandardMaterial({color:'#dfded5',roughness:.96});
  const coping=new THREE.MeshStandardMaterial({color:'#555e5d',roughness:.9});
  const trim=new THREE.MeshStandardMaterial({color:'#665b4a',roughness:.96});
  const put=(mat,x,y,z,w,h,d,yaw,slope=0)=>{
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
    const matrix=dummy.matrix.clone();matrix.elements[1]=slope*w;
    if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(matrix);
  };
  for(const way of Array.isArray(barriers)?barriers:barriers.ways??[]){
    if(!approachWallIdsR87.includes(way.id))continue;
    if(way.points?.some(p=>p.length!==2||!p.every(Number.isFinite)))throw Error('Invalid R87 wall source '+way.id);
    for(let j=1;j<way.points.length;j++){
      const a=way.points[j-1],b=way.points[j],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<.01)continue;
      const count=Math.ceil(length/.65),step=length/count,yaw=-Math.atan2(dz,dx),height=1.65;
      const heights=Array.from({length:count+1},(_,i)=>surfaces.terrainHeight(a[0]+dx*i/count,a[1]+dz*i/count));
      if(heights.some(h=>!Number.isFinite(h)))throw Error('Nonfinite R87 wall ground '+way.id);
      for(let i=0;i<count;i++){
        const t=(i+.5)/count,x=a[0]+dx*t,z=a[1]+dz*t,padding=step/2+.21;
        if(footprintBlocked(x,z,padding)){skipped.push({id:way.id,section:i,reason:'mapped building or water clearance'});continue;}
        // Source route widths remain authoritative. A wall fragment is omitted
        // rather than narrowing a stair/footway if coarse map data conflicts.
        if((features.paths??[]).some(p=>p.points.slice(1).some((v,k)=>distance(x,z,p.points[k],v)<pathWidth(p.tags??{})/2+padding))){skipped.push({id:way.id,section:i,reason:'mapped route clearance'});continue;}
        // Existing authored wall colliders retain ownership wherever present.
        if(priorBoundaries.some(c=>(()=>{
          const [cx,cz,hw,hd,angle]=c.args,rx=x-cx,rz=z-cz;
          return Math.abs(Math.cos(angle)*rx-Math.sin(angle)*rz)<hw+padding&&Math.abs(Math.sin(angle)*rx+Math.cos(angle)*rz)<hd+.21;
        })())){skipped.push({id:way.id,section:i,reason:'existing boundary ownership'});continue;}
        const ya=heights[i],yb=heights[i+1],base=(ya+yb)/2,slope=(yb-ya)/step;
        // Shared endpoint heights seat both faces in the actual terrain. The
        // wall's 1.65m elevation, .28m width and construction remain estimates.
        put(stone,x,base+.10,z,step,.28,.34,yaw,slope);
        put(plaster,x,base+.94,z,step,1.40,.28,yaw,slope);
        put(trim,x,base+.25,z,step,.07,.30,yaw,slope);
        put(coping,x,base+height+.025,z,step,.10,.42,yaw,slope);
        const low=Math.min(ya,yb)-.04,high=Math.max(ya,yb)+height+.075;
        colliders.push({type:'box',args:[x,z,step/2,.21,yaw,low,high,'mapped_temizuya_wall_r87']});
        records.push({sourceId:way.id,segment:j-1,section:i,centre:[x,base,z],length:step,yaw,ground:[ya,yb]});
      }
    }
  }
  for(const [material,matrices]of batches){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
  }
  group.userData={records,skipped,sourceIds:[...new Set(records.map(r=>r.sourceId))],drawBatches:group.children.length,triangles:records.length*48,
    provenance:'entrance-barriers.json OSM ways1133052419/2421: actual white concrete solid wall linework; height1.65m,width.28m,stone toe and shallow coping inferred from existing entrance wall vocabulary. Video iqK2tg-TxbY00:28/00:43 inspected for appearance only; not a dimensional survey.',
    limits:'No source line extensions, new houses, plants, lawns, lights or photographic exactness. Conflicting mapped routes and existing wall ownership omitted.'};
  root.add(group);return group.userData;
}
