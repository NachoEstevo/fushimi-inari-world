import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';

// The photographs establish drainage vocabulary, not surveyed stations.
// Keep two short transverse runs at photographed public landing interfaces;
// never generate drainage along every mapped path or across stair treads.
export function nearPrecinctDrainRuns(features){
 const specs=[{id:'Tamayama approach drain',path:'way/1133053715',station:.45},{id:'Okumiya upper landing drain',path:'way/1392716577',station:.65}];
 return specs.flatMap(spec=>{
  const p=features.paths?.find(p=>p.id===spec.path);if(!p||p.tags?.highway==='steps')return [];
  const a=p.points[0],b=p.points.at(-1),dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.1)return [];
  const x=a[0]+dx*spec.station,z=a[2]+dz*spec.station,nx=-dz/length,nz=dx/length,half=pathWidth(p.tags??{})/2-.10;
  return [{...spec,a:[x-nx*half,z-nz*half],b:[x+nx*half,z+nz*half]}];
 });
}

export function buildNearPrecinctDrains(root,features,surfaces,materials){
 const name='Near precinct flush grated drains R78',old=root.getObjectByName(name);if(old)return old.userData;
 const stone=materials.entryStoneMat??materials.stoneMat;if(!stone)return null;
 const metal=new THREE.MeshStandardMaterial({color:'#555b58',metalness:.45,roughness:.8}),recess=new THREE.MeshStandardMaterial({color:'#242825',roughness:1});
 const batches=new Map(),unit=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D(),records=[];
 const put=(mat,w,d,x,z,yaw,top)=>{
  if(!Number.isFinite(top))throw Error('Nonfinite near precinct drain elevation');
  dummy.position.set(x,top-.003,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,.006,d);dummy.updateMatrix();
  if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(dummy.matrix.clone());
 };
 for(const run of nearPrecinctDrainRuns(features)){
  const dx=run.b[0]-run.a[0],dz=run.b[1]-run.a[1],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,nx=-uz,nz=ux,yaw=Math.atan2(-uz,ux),count=Math.ceil(length/.08),pitch=length/count;
  // Decline a run when the established walking plane has a discontinuity or
  // sharp crossfall: a flush grate must not bridge an unresolved grade seam.
  const heights=[];for(let i=0;i<=count;i++){const x=run.a[0]+ux*i*pitch,z=run.a[1]+uz*i*pitch;heights.push(surfaces.height(x,z));}
  if(heights.some(y=>!Number.isFinite(y)))throw Error('Nonfinite near precinct drain grade');
  const maxStep=heights.slice(1).reduce((m,y,i)=>Math.max(m,Math.abs(y-heights[i])),0);
  if(maxStep>.08){records.push({id:run.id,built:false,reason:'walking-grade discontinuity',maxStep});continue;}
  for(let i=0;i<count;i++){
   const x=run.a[0]+ux*(i+.5)*pitch,z=run.a[1]+uz*(i+.5)*pitch;
   const sample=(x,z)=>surfaces.height(x,z);
   put(recess,pitch,.20,x,z,yaw,sample(x,z)+.001);
   for(const side of [-1,1]){
    const sx=x+nx*side*.145,sz=z+nz*side*.145;
    put(stone,pitch-.002,.08,sx,sz,yaw,sample(sx,sz)+.004);
    const mx=x+nx*side*.095,mz=z+nz*side*.095;put(metal,pitch,.012,mx,mz,yaw,sample(mx,mz)+.005);
   }
   put(metal,.016,.19,x,z,yaw,sample(x,z)+.006);
  }
  records.push({id:run.id,built:true,path:run.path,station:run.station,endpoints:[run.a,run.b],length,grateBars:count,maxStep});
 }
 const group=new THREE.Group();group.name=name;
 for(const [material,matrices] of batches){const mesh=new THREE.InstancedMesh(unit,material,matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name='Flush drain '+(material===stone?'stone frame':material===metal?'metal grate':'dark recess');mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);}
 group.userData={records,drawCalls:batches.size,collidersAdded:0,maximumTopOffset:.006,source:'outputs/r77/streetview-landing.png; video iqK2tg-TxbY 325/365/385s establishes stone landings and drainage setting',limits:'Two inferred stations and widths, not a surveyed drainage network; shallow flush geometry samples final walking surface and declines abrupt grade seams. No hydraulic or walking acceptance claim.'};
 root.add(group);return group.userData;
}
