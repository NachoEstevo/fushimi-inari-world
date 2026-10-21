import * as THREE from 'three';
import {basinHedgeGap} from './entrance-roadside-basin.mjs?v=62';

// Only the two mapped interior hedges without a stone plinth receive inferred
// understory. The other three source hedges keep their visible stone base.
const interiorHedgeIds=new Set(['way/1051333119','way/1133052439']);

export function buildEntranceHedgeUnderstory(root,barriers,surfaces){
  const segments=[],sources=new Set();
  for(const way of Array.isArray(barriers)?barriers:barriers.ways??[]){
    if(!interiorHedgeIds.has(way.id))continue;
    for(let i=1;i<way.points.length;i++){
      const a=way.points[i-1],b=way.points[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(!Number.isFinite(length))throw new Error('Invalid mapped hedge understory points: '+way.id);
      if(length<.20)continue;
      segments.push({a,dx,dz,length,id:way.id});sources.add(way.id);
    }
  }
  if(!segments.length)return null;
  const positions=[];
  // Five fine, pointed blades, max horizontal radius .032m and height .18m.
  // No alpha texture, broad leaf cards, opaque lawn plane or new terrain patch.
  for(let i=0;i<5;i++){
    const angle=i*2.3999632297,c=Math.cos(angle),s=Math.sin(angle),h=.10+i*.02;
    positions.push(-s*.005,0,c*.005,s*.005,0,-c*.005,c*.032,h,s*.032);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,side:THREE.DoubleSide});
  const totalLength=segments.reduce((sum,s)=>sum+s.length,0),spacing=Math.max(.15,totalLength*2/1500);
  const plants=[];let seed=59031;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(const {a,dx,dz,length,id} of segments){
    const count=Math.max(1,Math.floor((length-.16)/spacing)),ux=dx/length,uz=dz/length;
    for(let i=0;i<count;i++)for(const side of [-1,1]){
      // End clearance preserves mapped gaps. Entire blade extent remains under
      // .32m from the mapped centreline, inside the existing .64m hedge core.
      const along=.08+(i+.5)*(length-.16)/count,offset=side*(.265+random()*.015);
      if(basinHedgeGap(id,along/length))continue;
      const x=a[0]+ux*along-uz*offset,z=a[1]+uz*along+ux*offset;
      const y=surfaces.terrainHeight(x,z);
      if(!Number.isFinite(y))throw new Error('Nonfinite mapped hedge understory ground at '+x+','+z);
      plants.push([x,y-.008,z,random()*Math.PI*2,.75+random()*.25]);
    }
  }
  const mesh=new THREE.InstancedMesh(geometry,material,plants.length),dummy=new THREE.Object3D(),color=new THREE.Color();
  plants.forEach(([x,y,z,yaw,scale],i)=>{
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.setScalar(scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    mesh.setColorAt(i,color.setHSL(.22+(i%5)*.008,.26,.17+(i%7)*.009));
  });
  mesh.name='Inferred fine grass inside two mapped interior hedge footprints';
  mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);
  const metadata={sourceIds:[...sources],tufts:plants.length,triangles:plants.length*5,maxHalfWidth:.312,
    provenance:'R59 inferred understory confined to existing OSM hedge footprints; excludes three stone-edged hedge sources; no new lawns or colliders'};
  mesh.userData.provenance=metadata;return metadata;
}
