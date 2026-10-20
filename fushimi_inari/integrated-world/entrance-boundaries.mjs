import * as THREE from 'three';
import {entryWallRuns} from './entrance-layout.mjs';
import {rigidPoint} from './spatial.mjs';

export function buildEntranceBoundaries(root,romon,features,surfaces,materials,colliders){
  const group=new THREE.Group();group.name='Romon terrace walls and mapped side handrail';
  const stone=materials.entryStoneMat,cap=stone.clone();cap.color.set('#8c9186');
  const rail=new THREE.MeshStandardMaterial({color:'#655b4b',metalness:.45,roughness:.55});
  const box=(w,h,d,x,y,z,mat,parent=group)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);};
  // Course joints are geometry gaps. Both runs stop outside the central stairs.
  for(const [start,end] of entryWallRuns){
    const count=Math.ceil((end-start)/1.15),width=(end-start)/count;
    for(let row=0;row<3;row++)for(let i=0;i<count;i++){
      box(width-.014,.45-.014,.34,start+(i+.5)*width,.225+row*.45,5.18,stone);
    }
    box(end-start+.08,.12,.46,(start+end)/2,1.41,5.18,cap);
    const p=rigidPoint([(start+end)/2,.7,5.18],romon.source,romon.target,romon.yaw);
    colliders.push({type:'box',args:[p[0],p[2],(end-start)/2,.23,romon.yaw,p[1]-.7,p[1]+.77,'romon_terrace_wall']});
  }
  group.position.fromArray(romon.target);group.rotation.y=romon.yaw;
  group.translateX(-romon.source[0]);group.translateY(-romon.source[1]);group.translateZ(-romon.source[2]);root.add(group);
  const path=features.paths.find(p=>p.id==='way/626313854');
  if(!path)return;
  const handrails=new THREE.Group();handrails.name='Mapped west stair handrails';root.add(handrails);
  const a=path.points[0],b=path.points.at(-1),dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length;
  const cylinder=(from,to,r)=>{
    const start=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),rail);
    mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());handrails.add(mesh);
  };
  for(const side of [-1,1]){
    const points=[];
    for(let i=0;i<=6;i++){
      const t=i/6,cx=a[0]+dx*t,cz=a[2]+dz*t,x=cx+nx*2.13*side,z=cz+nz*2.13*side;
      const y=surfaces.height(cx,cz);points.push([x,y+.92,z]);
      cylinder([x,y,z],[x,y+.92,z],.025);
      colliders.push({type:'cylinder',args:[x,z,.045,y,y+1,'entrance_handrail']});
    }
    for(let i=1;i<points.length;i++)cylinder(points[i-1],points[i],.032);
  }
}
