import * as THREE from 'three';
import {entryWallRuns,entryGardenTiers} from './entrance-layout.mjs';

// Two shared draws, deterministic small leaves; no alpha cards or per-leaf shadows.
export function buildTerraceHedges(parent){
  const shrubs=[];
  for(const [start,end] of entryWallRuns)for(const {front,back,top} of entryGardenTiers){
    const count=Math.ceil((end-start-.5)/.5);
    for(let i=0;i<count;i++)shrubs.push([start+.3+(end-start-.6)*i/(count-1),top+.14,(front+back)/2]);
  }
  let seed=917;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const core=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,6),new THREE.MeshStandardMaterial({color:'#26341b',roughness:1}),shrubs.length);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-.045,0,0,0,.017,.024,.045,0,0,-.045,0,0,.045,0,0,0,-.017,.024],3));geo.computeVertexNormals();
  const leaves=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:'#ffffff',side:THREE.DoubleSide,roughness:.88}),shrubs.length*110);
  const dummy=new THREE.Object3D(),color=new THREE.Color();let leaf=0;
  shrubs.forEach(([x,y,z],i)=>{
    const h=.23+random()*.07;
    dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(.40,h,.35);dummy.updateMatrix();core.setMatrixAt(i,dummy.matrix);
    for(let j=0;j<110;j++){
      const a=random()*Math.PI*2,v=random()*1.6-.6,r=Math.sqrt(1-v*v);
      // Clamp to upper and lateral crown; hide the bare underside in the soil bed.
      dummy.position.set(x+Math.cos(a)*r*.42,y+v*h,z+Math.sin(a)*r*.37);
      dummy.rotation.set(random()*Math.PI,a,random()*Math.PI);dummy.scale.setScalar(.7+random()*.6);dummy.updateMatrix();leaves.setMatrixAt(leaf,dummy.matrix);
      color.setHSL(.22+random()*.05,.27+random()*.16,.13+random()*.10);leaves.setColorAt(leaf++,color);
    }
  });
  core.name='Terrace clipped hedge cores';leaves.name='Terrace evergreen leaf detail';
  core.receiveShadow=leaves.receiveShadow=true;parent.add(core,leaves);
}
