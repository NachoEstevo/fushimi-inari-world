import * as THREE from 'three';

export const MITSURUGI_CANOPY_ID='way/1270763274';
const NAME='Mapped Mitsurugi open roof';

// OSM establishes a roof, not a solid building. The flat cover, 2.2m clearance,
// .10m thickness and four inset timber supports are conservative inferred forms;
// this does not identify a shrine, well, roof pitch or ornamental detail.
export function buildMappedRoofCanopies(root,features,surfaces,materials={},colliders=[]){
  const previous=root.getObjectByName(NAME);if(previous)return previous.userData;
  const feature=features.buildings?.find(b=>b.id===MITSURUGI_CANOPY_ID);
  if(feature?.tags?.building!=='roof'||feature.points?.length!==5)return {builtIds:[],reason:'mapped-roof-required'};
  const ring=feature.points.slice(0,-1);
  if(!ring.every(p=>p.length===3&&p.every(Number.isFinite)))return {builtIds:[],reason:'finite-roof-footprint-required'};
  const cx=ring.reduce((s,p)=>s+p[0],0)/4,cz=ring.reduce((s,p)=>s+p[2],0)/4;
  const posts=ring.map(p=>[cx+(p[0]-cx)*.78,cz+(p[2]-cz)*.78]);
  const levels=posts.map(p=>surfaces.height(...p));
  if(!levels.every(Number.isFinite))return {builtIds:[],reason:'finite-post-support-required'};
  const roofY=Math.max(...levels)+2.2,group=new THREE.Group();group.name=NAME;
  const roofMaterial=materials.roofMat??new THREE.MeshStandardMaterial({color:'#66645c',roughness:.95});
  const timber=materials.woodMat??materials.blackNemakiMat??new THREE.MeshStandardMaterial({color:'#51483b',roughness:.95});
  const contour=ring.map(p=>new THREE.Vector2(p[0],p[2])),vertices=[];
  for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[])){
    for(const j of [...triangle].reverse())vertices.push(ring[j][0],roofY+.10,ring[j][2]);
    for(const j of triangle)vertices.push(ring[j][0],roofY,ring[j][2]);
  }
  let area=0;for(let i=0;i<4;i++){const a=ring[i],b=ring[(i+1)%4];area+=a[0]*b[2]-b[0]*a[2];}
  for(let i=0;i<4;i++){
    let a=ring[i],b=ring[(i+1)%4];if(area<0)[a,b]=[b,a];
    for(const p of [[a[0],roofY,a[2]],[b[0],roofY+.10,b[2]],[b[0],roofY,b[2]],[a[0],roofY,a[2]],[a[0],roofY+.10,a[2]],[b[0],roofY+.10,b[2]]])vertices.push(...p);
  }
  const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]-cx,vertices[i+2]-cz);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const cover=new THREE.Mesh(geometry,roofMaterial);cover.name='Mapped open canopy roof';cover.castShadow=cover.receiveShadow=true;group.add(cover);
  posts.forEach(([x,z],i)=>{
    const height=roofY-levels[i],post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,height,8),timber);
    post.position.set(x,levels[i]+height/2,z);post.castShadow=post.receiveShadow=true;group.add(post);
    colliders.push({type:'cylinder',args:[x,z,.045,levels[i],roofY,'mitsurugi_canopy_post']});
  });
  group.userData={built:true,builtIds:[feature.id],sourceFeature:feature.id,roofY,posts,source:'geography/features.json building=roof',limits:'Mapped roof footprint; flat roof profile, 2.2m clearance and four inset supports inferred. No solid wall or floor added.'};
  root.add(group);return group.userData;
}
