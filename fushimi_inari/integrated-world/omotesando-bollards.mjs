import * as THREE from 'three';
import {makeOmotesandoShoulderExclusion} from './omotesando-shoulders-layout.mjs';

// Directly observed in reference-0028.png and reference-0043.png, from
// https://www.youtube.com/watch?v=iqK2tg-TxbY. Three visible near/mid-ground
// pairs at most (mapped obstacles may omit a fixture). These are narrow modern
// light columns, not stone lanterns.
// OSM supplies the avenue axis; longitudinal stations and dimensions remain
// estimated. Do not extrapolate this short reconstruction across the avenue.
export const omotesandoBollardStations=Object.freeze([44,66,88]);

export function omotesandoBollardLayout(features){
  const path=features.paths.find(p=>p.id==='way/105449722');if(!path)return [];
  const blocked=makeOmotesandoShoulderExclusion(features),records=[];
  for(const station of omotesandoBollardStations){
    let remaining=station;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
      if(length<.001)continue;
      if(remaining>length){remaining-=length;continue;}
      const ux=dx/length,uz=dz/length,cx=a[0]+ux*remaining,cz=a[2]+uz*remaining;
      // Along this west-going path +normal points north. The south shoulder
      // is wider in both frames; retain the full 8 m mapped walking corridor.
      for(const side of [-1,1]){
        const offset=side===1?4.55:5.3,nx=-uz*side,nz=ux*side,x=cx+nx*offset,z=cz+nz*offset;
        if(blocked(x,z,.18))continue;
        records.push({station,side,x,z,yaw:Math.atan2(-nx,-nz),offset});
      }
      break;
    }
  }
  return records;
}

export function buildOmotesandoBollards(root,features,surfaces,materials,colliders){
  const name='Omotesando observed narrow approach lights';
  const existing=root.getObjectByName(name);if(existing)return existing.userData;
  const records=omotesandoBollardLayout(features);if(!records.length)return null;
  const group=new THREE.Group();group.name=name;
  const body=new THREE.MeshStandardMaterial({color:'#48554c',roughness:.76,metalness:.38});
  const diffuser=new THREE.MeshStandardMaterial({color:'#dadfd2',roughness:.58,emissive:'#b9c8a2',emissiveIntensity:.12});
  const metal=new THREE.MeshStandardMaterial({color:'#6f7970',roughness:.72,metalness:.42});
  const stone=materials.entryStoneMat??materials.stoneMat;
  const batches=new Map(),dummy=new THREE.Object3D();
  const put=(mat,w,h,d,x,y,z)=>{
    if(!batches.has(mat))batches.set(mat,[]);
    dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(w,h,d);dummy.updateMatrix();batches.get(mat).push(dummy.matrix.clone());
  };
  const placed=[];
  for(const record of records){
    const {x,z,yaw}=record,samples=[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]].map(([dx,dz])=>surfaces.height(x+dx,z+dz));
    if(samples.some(y=>!Number.isFinite(y)))throw Error('Nonfinite Omotesando light footing');
    const low=Math.min(...samples)-.025,base=Math.max(...samples),start=new Map([...batches].map(([mat,parts])=>[mat,parts.length]));
    put(stone,.28,base-low+.055,.28,0,(low+base+.055)/2,0);
    put(metal,.235,.045,.235,0,base+.07,0);
    put(body,.19,1.19,.19,0,base+.685,0);
    put(metal,.205,.035,.205,0,base+1.2975,0);
    // The two pale strips occupy adjacent faces, as exposed by the oblique
    // video views. They are solids inside the frame, with no added point light.
    put(diffuser,.112,.91,.012,0,base+.79,.101);
    put(diffuser,.012,.91,.112,-.101,base+.79,0);
    for(const dy of [.326,1.254]){
      put(metal,.15,.025,.018,0,base+dy,.105);
      put(metal,.018,.025,.15,-.105,base+dy,0);
    }
    const transform=new THREE.Matrix4().makeRotationY(yaw);transform.setPosition(x,0,z);
    for(const [mat,parts]of batches)for(let i=start.get(mat)??0;i<parts.length;i++)parts[i].premultiply(transform);
    placed.push({...record,base,footingBottom:low});
  }
  for(const [mat,matrices]of batches){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
  }
  for(const {x,z,base,footingBottom}of placed)colliders.push({type:'cylinder',args:[x,z,.16,footingBottom,base+1.32,'omotesando_narrow_light']});
  group.userData={records:placed,count:placed.length,materialBatches:batches.size,pointLights:0,
    provenance:'Video iqK2tg-TxbY 00:28 and 00:43, directly inspected local reference frames r56. Narrow grey-green light columns with pale vertical panels observed; at most three pairs, with mapped-obstacle exclusions; 44/66/88m axis stations, unequal shoulder offsets and 1.32m height visually inferred, not surveyed.',
    constraints:'OSM way/105449722 axis; central 8m corridor and transverse routes/building footprints excluded. No new buildings, trees, stone-lantern row or runtime lights.'};
  root.add(group);return group.userData;
}
