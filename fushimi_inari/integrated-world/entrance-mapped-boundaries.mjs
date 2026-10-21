import * as THREE from 'three';

export const entranceMappedWallIds=Object.freeze(['way/1133052410','way/1133052420','way/1133052413','way/1133052417']);
export const entranceMappedHedgeIds=Object.freeze(['way/1133052411','way/1133052412','way/1133053711','way/1051333119','way/1133052439']);
const wallIds=new Set(entranceMappedWallIds);
const hedgeIds=new Set(entranceMappedHedgeIds);
// Actual OSM linework owns wall ends, returns and gaps. White plaster, restrained
// lower timber and tiled cap follow the supplied 2024 approach photograph;
// detailed construction and unspecified dimensions remain visual estimates.
export function buildEntranceMappedBoundaries(root,barriers,ground,materials,colliders){
  let seatedSections=0,groundIntrusionSections=0,buriedWallSections=0,maxGroundIntrusion=0;
  const sample=(x,z)=>{const y=ground(x,z);if(!Number.isFinite(y))throw new Error('Nonfinite mapped boundary ground at '+x+','+z);return y;};
  const group=new THREE.Group();group.name='Mapped outer Omotesando walls and hedges';
  const plaster=new THREE.MeshStandardMaterial({color:'#e0dfd5',roughness:.96});
  const timber=new THREE.MeshStandardMaterial({color:'#665e4d',roughness:.96});
  const stone=materials.entryStoneMat??materials.stoneMat;
  const hedgeCore=new THREE.MeshStandardMaterial({color:'#33432b',roughness:1});
  const roof=new THREE.MeshStandardMaterial({color:'#555e5d',roughness:.9});
  const batches=new Map(),dummy=new THREE.Object3D(),cube=new THREE.BoxGeometry(1,1,1);
  const put=(mat,x,y,z,sx,sy,sz,yaw=0,slope=0)=>{
    if(!batches.has(mat))batches.set(mat,[]);
    dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
    const matrix=dummy.matrix.clone();
    // Shear the longitudinal axis upward while retaining vertical wall ends.
    // Adjacent sections share endpoint elevations, so their tops meet exactly.
    matrix.elements[1]=slope*sx;batches.get(mat).push(matrix);
  };
  const tiles=[],hedgeLeaves=[],built=[],footingVertices=[];
  const footing=(ax,az,bx,bz,bottomA,bottomB,topA,topB,nx,nz)=>{
    const points=[[ax+nx*.17,bottomA,az+nz*.17],[bx+nx*.17,bottomB,bz+nz*.17],[bx+nx*.17,topB,bz+nz*.17],[ax+nx*.17,topA,az+nz*.17],
      [ax-nx*.17,bottomA,az-nz*.17],[bx-nx*.17,bottomB,bz-nz*.17],[bx-nx*.17,topB,bz-nz*.17],[ax-nx*.17,topA,az-nz*.17]];
    for(const face of [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])for(const i of [face[0],face[1],face[2],face[0],face[2],face[3]])footingVertices.push(...points[i]);
  };
  for(const way of Array.isArray(barriers)?barriers:barriers.ways??[]){
    const hedge=hedgeIds.has(way.id);if(!hedge&&!wallIds.has(way.id))continue;
    if(!Array.isArray(way.points)||way.points.some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])))throw new Error('Invalid mapped barrier points: '+way.id);
    const tagged=parseFloat(way.tags?.height),height=Number.isFinite(tagged)&&tagged>.3?tagged:(hedge ? .90 : 2.1);
    let lengthTotal=0;
    for(let segment=1;segment<way.points.length;segment++){
      const a=way.points[segment-1],b=way.points[segment],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      if(length<.02)continue;lengthTotal+=length;
      const ux=dx/length,uz=dz/length,nx=-uz,nz=ux,yaw=-Math.atan2(dz,dx);
      // Shared endpoint samples form a continuous sloping strip along each source
      // segment. No bridge is drawn across a source gap or between separate ways.
      const count=Math.ceil(length/1.2),step=length/count;
      const actualGround=Array.from({length:count+1},(_,i)=>sample(a[0]+dx*i/count,a[1]+dz*i/count));
      // Smooth wall cap is an estimated straight profile between original OSM
      // segment endpoints. Local DEM berms affect footings, never wave the cap.
      const profile=hedge?actualGround:actualGround.map((_,i)=>actualGround[0]+(actualGround[count]-actualGround[0])*i/count);
      const profileHeight=t=>{const q=Math.min(count,t*count),i=Math.min(count-1,Math.floor(q));return profile[i]+(profile[i+1]-profile[i])*(q-i);};
      for(let i=0;i<count;i++){
        const t=(i+.5)/count,x=a[0]+dx*t,z=a[1]+dz*t;
        const ya=profile[i],yb=profile[i+1],slope=(yb-ya)/step;
        const floor=(ya+yb)/2,low=Math.min(ya,yb,actualGround[i],actualGround[i+1])-.07,high=Math.max(ya,yb)+height;
        if(!(low<=Math.min(ya,yb)&&high>floor))throw new Error('Unseated mapped boundary section: '+way.id);
        seatedSections++;
        if(!hedge){
          const intrusion=Math.max(actualGround[i]-ya,actualGround[i+1]-yb);
          maxGroundIntrusion=Math.max(maxGroundIntrusion,intrusion);
          if(intrusion>.17)groundIntrusionSections++;
          if(intrusion>=height)buriedWallSections++;
          footing(x-ux*step/2,z-uz*step/2,x+ux*step/2,z+uz*step/2,
            Math.min(actualGround[i]-.07,ya+.10),Math.min(actualGround[i+1]-.07,yb+.10),ya+.17,yb+.17,nx,nz);
          put(timber,x,floor+.40,z,step,.49,.29,yaw,slope);
          put(plaster,x,floor+(.64+height)/2,z,step,height-.64,.28,yaw,slope);
          put(roof,x,floor+height+.035,z,step,.085,.51,yaw,slope);
          // Muted vertical lower boards are subordinate to the white wall face.
          for(let j=0;j<3;j++)for(const side of [-1,1])put(timber,x+ux*(j-1)*step/3+nx*.155*side,floor+.40+slope*(j-1)*step/3,z+uz*(j-1)*step/3+nz*.155*side,.035,.49,.025,yaw,slope);
        }
        if(hedge){
          const coreHeight=height*.82+.018*Math.sin(i*2.4);
          put(hedgeCore,x,floor+coreHeight/2,z,step,coreHeight,.64,yaw,slope);
        }
        colliders.push({type:'box',args:[x,z,step/2,hedge?.38:.17,yaw,low,high,hedge?'mapped_approach_hedge':'mapped_approach_wall']});
      }
      if(!hedge){
        const tileCount=Math.ceil(length/.28);
        for(let i=0;i<tileCount;i++){
          const t=(i+.5)/tileCount,x=a[0]+dx*t,z=a[1]+dz*t;
          dummy.position.set(x,profileHeight(t)+height+.095,z);
          dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(nx,0,nz));dummy.scale.set(.045,.48,.045);dummy.updateMatrix();tiles.push(dummy.matrix.clone());
        }
      }else{
        const leafCount=Math.ceil(length*92);
        for(let i=0;i<leafCount;i++){
          const t=(i+.5)/leafCount,x=a[0]+dx*t,z=a[1]+dz*t;
          const side=Math.sin(i*17.13)*.32,h=.10+((i*43)%97)/97*(height-.13);
          dummy.position.set(x+nx*side,sample(x+nx*side,z+nz*side)+h,z+nz*side);
          dummy.rotation.set(Math.sin(i)*.6,i*2.39996,Math.cos(i)*.3);dummy.scale.setScalar(.85+(i%5)*.07);dummy.updateMatrix();hedgeLeaves.push(dummy.matrix.clone());
        }
      }
    }
    built.push({id:way.id,kind:hedge?'hedge':'wall',length:lengthTotal,height,heightSource:Number.isFinite(tagged)?'OSM height tag':'visual estimate'});
  }
  for(const list of [...batches.values(),tiles,hedgeLeaves])for(const matrix of list){
    if(matrix.elements.some(value=>!Number.isFinite(value)))throw new Error('Nonfinite mapped boundary transform');
  }
  if(footingVertices.length){
    if(footingVertices.some(v=>!Number.isFinite(v)))throw new Error('Nonfinite mapped wall footing');
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(footingVertices,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(footingVertices.flatMap((_,i)=>i%3===0?[footingVertices[i]/2,footingVertices[i+1]/2]:[]),2));geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,stone);mesh.castShadow=mesh.receiveShadow=true;mesh.name='Terrain-seated mapped wall footing batch';group.add(mesh);
  }
  for(const [mat,list]of batches){
    const mesh=new THREE.InstancedMesh(cube,mat,list.length);list.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.name='Batched mapped approach wall construction';mesh.computeBoundingSphere();group.add(mesh);
  }
  if(tiles.length){
    const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,7),roof,tiles.length);tiles.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;mesh.name='Mapped wall individual curved tile caps';mesh.computeBoundingSphere();group.add(mesh);
  }
  if(hedgeLeaves.length){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.13,0,0,0,.035,.055,.13,0,0,-.13,0,0,.13,0,0,0,-.025,-.055],3));geometry.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,side:THREE.DoubleSide});
    const mesh=new THREE.InstancedMesh(geometry,mat,hedgeLeaves.length),color=new THREE.Color();
    hedgeLeaves.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,color.setHSL(.24+(i%4)*.008,.26,.20+(i%7)*.015));});mesh.receiveShadow=true;mesh.name='Mapped approach hedge fine evergreen leaves';mesh.computeBoundingSphere();group.add(mesh);
  }
  root.add(group);const metadata={ways:built,validation:{finiteTransforms:true,seatedSections,groundIntrusionSections,buriedWallSections,maxGroundIntrusion,wallCapProfile:'linear between original OSM segment endpoint ground elevations'},provenance:'OSM entrance-barriers.json compact line paths; supplied 2024 Omotesando photograph for white-wall and dark lower-board appearance; unstated heights and tile details estimated'};group.userData.provenance=metadata;return metadata;
}
