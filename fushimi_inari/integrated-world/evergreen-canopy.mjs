import * as THREE from 'three';

// Evergreen broadleaf silhouette: lanceolate/elliptic leaves rather than
// enlarged fern cards. Shii/kashi presence is sourced; each tree is inferred.
export function evergreenCanopy(leafCount=192){
  const positions=[],colors=[];
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
    const densityScale=Math.sqrt(192/leafCount);
    const length=(.095+random()*.065)*densityScale,width=length*(.4+random()*.18);
    const tip=center.clone().addScaledVector(along,length),base=center.clone().addScaledVector(along,-length);
    const left=center.clone().addScaledVector(across,width),right=center.clone().addScaledVector(across,-width);
    const ridge=center.clone().add(new THREE.Vector3(0,.035,0)),shade=.7+random()*.5;
    const c=[.16*shade,.30*shade,.095*shade];
    for(const tri of [[base,left,ridge],[left,tip,ridge],[tip,right,ridge],[right,base,ridge]])for(const p of tri)vertex(p.toArray(),c);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  return {geometry:geo,material:new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.58})};
}
