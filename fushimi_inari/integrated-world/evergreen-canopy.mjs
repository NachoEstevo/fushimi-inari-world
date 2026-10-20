import * as THREE from 'three';
import {leafClusterMaterial} from './leaf-cluster.mjs';

// Evergreen sprays distributed through a three-dimensional crown volume.
// Shii/kashi presence is sourced; each tree and leaf arrangement is inferred.
export function evergreenCanopy(leafCount=384){
  const positions=[],colors=[],uv=[];
  let seed=137;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const vertex=(p,c)=>{positions.push(...p);colors.push(...c);};
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4,tip=[Math.cos(angle),.25,Math.sin(angle)],side=[-Math.sin(angle)*.012,0,Math.cos(angle)*.012];
    for(const tri of [[[0,-.01,0],tip,side],[[0,.01,0],side,tip]])for(const p of tri)vertex(p,[.14,.10,.06]);
  }
  for(let i=0;i<leafCount;i++){
    const angle=random()*Math.PI*2,r=Math.sqrt(random()),y=(random()-.5)*1.1*Math.sqrt(1-r*r);
    const center=new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);
    const along=new THREE.Vector3(Math.cos(angle+.6),(random()-.5)*.9,Math.sin(angle+.6)).normalize();
    const across=new THREE.Vector3(-along.z,.12,along.x).normalize();
    const densityScale=Math.sqrt(384/leafCount);
    const length=(.13+random()*.07)*densityScale,width=length*(.65+random()*.15);
    const tip=center.clone().addScaledVector(along,length),base=center.clone().addScaledVector(along,-length);
    const left=center.clone().addScaledVector(across,width),right=center.clone().addScaledVector(across,-width);
    const shade=.75+random()*.45;
    const c=[.16*shade,.30*shade,.095*shade];
    // A cutout spray uses two triangles, retaining the existing LOD budget.
    for(const tri of [[base,left,tip],[base,tip,right]])for(const p of tri)vertex(p.toArray(),c);
    uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  // The first 48 vertices are retained authored twigs, sampling a solid leaf.
  geo.setAttribute('uv',new THREE.Float32BufferAttribute([...Array(48).fill([.5,.5]).flat(),...uv],2));
  return {geometry:geo,material:leafClusterMaterial()};
}
