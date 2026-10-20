import * as THREE from 'three';
import {rigidPoint} from './spatial.mjs';

// Connect the existing nine-step flight to the podium without floating aprons.
// Dimensions derive from the preserved building; surface vocabulary is video-led.
export function buildSanctuaryLanding(root,anchor,materials,colliders){
  const group=new THREE.Group();group.name='Naihaiden connected landing';
  const box=(w,h,d,x,y,z,material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);mesh.receiveShadow=true;group.add(mesh);
  };
  box(10.4,.12,1.4,0,3.15,-22.85,materials.precinctPaving);
  // Side landings leave the central stair and the side circulation corridors open.
  for(const side of [-1,1]){
    box(4,.12,9,side*8,3.15,-26.7,materials.precinctPaving);
    box(4,1.6,.22,side*8,2.4,-22.16,materials.entryStoneMat);
    const p=rigidPoint([side*8,2.4,-22.16],anchor.source,anchor.target,anchor.yaw);
    colliders.push({type:'box',args:[p[0],p[2],2,.11,anchor.yaw,p[1]-.8,p[1]+.8,'sanctuary_retaining']});
  }
  group.position.fromArray(anchor.target);group.rotation.y=anchor.yaw;
  group.translateX(-anchor.source[0]);group.translateY(-anchor.source[1]);group.translateZ(-anchor.source[2]);root.add(group);
}

// Follow mapped exterior circulation, not an invented shortcut through Honden.
export function buildSanctuaryApproaches(root,features,surfaces,materials){
  const ids=new Set(['way/105449677','way/105449728','way/751194635','way/751194637','way/1106589423']);
  const positions=[],uv=[];
  for(const path of features.paths.filter(p=>ids.has(p.id))){
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]),n=Math.ceil(len/1.5),nx=-(b[2]-a[2])/len,nz=(b[0]-a[0])/len;
      for(let j=0;j<n;j++){
        const points=[];
        for(const [t,side] of [[j/n,-1],[j/n,1],[(j+1)/n,-1],[(j+1)/n,1]]){
          const x=a[0]+(b[0]-a[0])*t,z=a[2]+(b[2]-a[2])*t;
          points.push([x+nx*side*1.8,surfaces.height(x,z)-.035,z+nz*side*1.8]);
        }
        for(const k of [0,1,2,2,1,3]){positions.push(...points[k]);uv.push(points[k][0]/2,points[k][2]/2);}
      }
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  const mat=materials.precinctPaving.clone();mat.side=THREE.DoubleSide;materials.sanctuaryApronMat=mat;
  const mesh=new THREE.Mesh(geo,mat);mesh.name='Mapped sanctuary side approach aprons';mesh.receiveShadow=true;root.add(mesh);
}
