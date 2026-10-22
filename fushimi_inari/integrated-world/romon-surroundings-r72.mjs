import * as THREE from 'three';
import {rigidPoint} from './spatial.mjs';

// IMG_6491_20210317 shows a continuous grated drain at the granite/cobble
// junction around the north Kairo end. Existing entrance-boundaries owns its
// short stair-threshold continuation, the terrace walls, and all handrails.
// These local runs connect to that threshold without occupying the gate arch.
export const romonCourtDrainRuns=Object.freeze([
  Object.freeze({a:Object.freeze([-19.85,-3.22]),b:Object.freeze([-5.60,-3.22])}),
  Object.freeze({a:Object.freeze([-19.85,-3.22]),b:Object.freeze([-19.85,1.35])}),
]);

export function buildRomonSurroundingsR72(root,romon,surfaces,materials){
  const name='Romon north court granite and grated drainage junction';
  const previous=root.getObjectByName(name);if(previous)return previous.userData;
  const group=new THREE.Group();group.name=name;
  const metal=new THREE.MeshStandardMaterial({color:'#626763',metalness:.48,roughness:.77});
  const recess=new THREE.MeshStandardMaterial({color:'#232824',roughness:1});
  const stone=materials.entryStoneMat??materials.stoneMat;
  const batches=new Map(),dummy=new THREE.Object3D(),unit=new THREE.BoxGeometry(1,1,1);
  const put=(material,w,h,d,x,y,z,yaw)=>{
    if(!batches.has(material))batches.set(material,[]);
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();batches.get(material).push(dummy.matrix.clone());
  };
  const datum=romon.target[1]-romon.source[1];
  const sample=(x,z)=>{const p=rigidPoint([x,0,z],romon.source,romon.target,romon.yaw);const y=surfaces.height(p[0],p[2])-datum;if(!Number.isFinite(y))throw Error('Nonfinite Romon court drain elevation');return y;};
  let grateBars=0,frames=0,length=0,maxGradeStep=0;
  for(const {a,b} of romonCourtDrainRuns){
    const dx=b[0]-a[0],dz=b[1]-a[1],span=Math.hypot(dx,dz),ux=dx/span,uz=dz/span,nx=-uz,nz=ux,yaw=Math.atan2(-uz,ux);
    const sections=Math.ceil(span/.38),pitch=span/sections;
    let previousY=null;
    for(let i=0;i<sections;i++){
      const x=a[0]+ux*(i+.5)*pitch,z=a[1]+uz*(i+.5)*pitch,y=sample(x,z);
      if(previousY!==null)maxGradeStep=Math.max(maxGradeStep,Math.abs(y-previousY));previousY=y;
      // Dark inset beneath actual spaced bars; no painted black stripe.
      put(recess,pitch,.014,.255,x,y+.009,z,yaw);
      for(const side of [-1,1]){
        put(stone,pitch-.006,.045,.12,x+nx*side*.205,y+.013,z+nz*side*.205,yaw);frames++;
        put(metal,pitch,.025,.025,x+nx*side*.125,y+.025,z+nz*side*.125,yaw);
      }
      // Two longitudinal bearers and six transverse, open-slot grate bars.
      for(const side of [-1,1])put(metal,pitch,.025,.017,x+nx*side*.043,y+.026,z+nz*side*.043,yaw);
      for(let j=0;j<6;j++){
        const offset=((j+.5)/6-.5)*pitch;
        put(metal,.022,.028,.25,x+ux*offset,y+.027,z+uz*offset,yaw);grateBars++;
      }
      // Cross seams read as removable inspection panels at measured intervals.
      put(metal,.024,.031,.27,x+ux*pitch/2,y+.026,z+uz*pitch/2,yaw);
    }
    length+=span;
  }
  for(const [material,matrices]of batches){
    const mesh=new THREE.InstancedMesh(unit,material,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.receiveShadow=true;mesh.castShadow=false;mesh.computeBoundingSphere();group.add(mesh);
  }
  group.position.fromArray(romon.target);group.rotation.y=romon.yaw;
  group.translateX(-romon.source[0]);group.translateY(-romon.source[1]);group.translateZ(-romon.source[2]);
  group.userData={runs:romonCourtDrainRuns.length,length,grateBars,stoneFrameSections:frames,drawCalls:batches.size,maxGradeStep,
    provenance:'https://fushimiinari-guide.com/wp-content/uploads/IMG_6491_20210317.jpg; appearance and continuous north-wing drainage junction observed; dimensions and stations inferred from inherited Kairo footprint. IMG_6489_20210317 corroborates court/stair stone vocabulary.',
    ownership:'New north court drain extension only; existing short threshold drain, walls, stairs, trees, buildings, and handrails preserved',
    collidersAdded:0,groundPolicy:'flush details sample surfaces.height; no terrain edits, raised curb, or route blockers'};
  root.add(group);return group.userData;
}
