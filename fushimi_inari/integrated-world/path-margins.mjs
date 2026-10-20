import * as THREE from 'three';
import {partitionInstances} from './spatial-mesh.mjs';

// Inferred understory and embedded rocks; never alter mapped path clearance.
export function buildPathMargins(root,network,ground,features,anchors){
  const blocked=features.buildings.concat(features.water).map(f=>({
    x0:Math.min(...f.points.map(p=>p[0]))-.4,x1:Math.max(...f.points.map(p=>p[0]))+.4,
    z0:Math.min(...f.points.map(p=>p[2]))-.4,z1:Math.max(...f.points.map(p=>p[2]))+.4,
  }));
  let seed=1515;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const stones=[],plants=[],seen=new Set(),dummy=new THREE.Object3D();
  for(const s of network.segments){
    if(s.kind!=='stone'||s.ya<55||s.a[0]<110||s.a[0]>1430||s.a[2]<-580||s.a[2]>330)continue;
    const key=`${s.id}:${Math.floor(s.distance/7)}`;if(seen.has(key))continue;seen.add(key);
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);
    for(const side of [-1,1]){
      if(random()<.3)continue;
      const offset=side*(s.width/2+.65+random()*.6),x=(s.a[0]+s.b[0])/2-dz/len*offset,z=(s.a[2]+s.b[2])/2+dx/len*offset,y=ground(x,z);
      if(network.sample(x,z)||Math.abs(y-(s.ya+s.yb)/2)>1.1)continue;
      if(blocked.some(b=>x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1))continue;
      if(anchors.some(a=>a.radius&&Math.hypot(x-a.target[0],z-a.target[2])<a.radius*.7))continue;
      dummy.position.set(x,y-.07,z);dummy.rotation.set(random()*.4,random()*6.28,random()*.2);
      dummy.scale.set(.18+random()*.22,.13+random()*.17,.18+random()*.24);dummy.updateMatrix();stones.push(dummy.matrix.clone());
      dummy.position.set(x+.14,y,z-.1);dummy.rotation.set(0,random()*6.28,0);dummy.scale.setScalar(.65+random()*.7);dummy.updateMatrix();plants.push(dummy.matrix.clone());
      if(stones.length>=1200)break;
    }
    if(stones.length>=1200)break;
  }
  const vertices=[];
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,r=.32+(i%3)*.04;
    for(let j=0;j<5;j++){
      const t=(j+1)/6,cx=Math.cos(a)*r*t,cz=Math.sin(a)*r*t,h=Math.sin(t*Math.PI)*.23+.04;
      for(const side of [-1,1])vertices.push(cx,h,cz,cx+Math.cos(a+side*.8)*.13*(1-t*.6),h-.025,cz+Math.sin(a+side*.8)*.13*(1-t*.6),cx+Math.cos(a)*.075,h+.018,cz+Math.sin(a)*.075);
    }
  }
  const foliage=new THREE.BufferGeometry();foliage.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));foliage.computeVertexNormals();
  const add=(geometry,material,matrices)=>{
    if(!matrices.length)return;const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;root.add(partitionInstances(mesh,128));
  };
  add(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#737269',roughness:1}),stones);
  add(foliage,new THREE.MeshStandardMaterial({color:'#526342',roughness:1,side:THREE.DoubleSide}),plants);
  return {rocks:stones.length,fernClumps:plants.length,placement:'inferred, outside mapped paths'};
}
