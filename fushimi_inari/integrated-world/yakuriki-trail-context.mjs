import * as THREE from 'three';

const NAME='Yakuriki trail context';
const SHRINES=['way/626313719','way/626342324','way/626342322','way/626342320'];
const CAFE='way/626313722', ROOF='way/1270597605';
const source='https://www.yakuriki.jp/';

// These ways identify places, not their heights or architectural envelopes. The
// official site identifies Yakuriki, Ishii, Oseki and the cafe; the photos at
// https://www.nippoh-goshuin.net/2023/08/24/伏見稲荷大社/ show the setting.
// Unregistered shrine and roof forms are omitted pending individual survey.
export function buildYakurikiTrailContext(root,features,surfaces,materials={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const all=features.buildings??[], omitted=SHRINES.filter(id=>{const b=all.find(f=>f.id===id);return b?.tags?.building==='shrine'&&!b.tags.height&&!b.tags['building:levels'];});
 const roofFeature=all.find(b=>b.id===ROOF);
 if(roofFeature?.tags?.building==='roof'&&!roofFeature.tags.height&&!roofFeature.tags['building:levels'])omitted.push(ROOF);
 const cafe=all.find(b=>b.id===CAFE),ring=cafe?.points?.slice(0,-1),path=features.paths?.find(p=>p.id==='way/60272187');
 const group=new THREE.Group();group.name=NAME;
 const report={builtIds:omitted,triangles:0,source,omittedIds:[...omitted],limits:'Only named source records are retained. Unregistered shrine and roof proxy shapes omitted; no attribution of their architecture. Cafe roof, posts, eave height and exact position inferred from mapped footprint and path; no hidden facade asserted.'};
 const valid=cafe?.tags?.amenity==='cafe'&&!cafe.tags.height&&!cafe.tags['building:levels']&&ring?.length===7&&ring.every(p=>p.length===3&&p.every(Number.isFinite))&&path?.points?.length>=2&&path.points.every(p=>p.length===3&&p.every(Number.isFinite))&&typeof surfaces?.height==='function';
 if(valid){
  const center=ring.reduce((a,p)=>[a[0]+p[0]/ring.length,a[1]+p[2]/ring.length],[0,0]);
  let nearest=null;
  for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=dx*dx+dz*dz;
   if(!length)continue;
   const t=Math.max(0,Math.min(1,((center[0]-a[0])*dx+(center[1]-a[2])*dz)/length)),x=a[0]+t*dx,z=a[2]+t*dz,d=(x-center[0])**2+(z-center[1])**2;
   if(!nearest||d<nearest.d)nearest={x,z,d};
  }
  const floor=nearest?surfaces.height(nearest.x,nearest.z):NaN;
  const contour=ring.map(p=>new THREE.Vector2(p[0],p[2])),faces=THREE.ShapeUtils.triangulateShape(contour,[]);
  if(Number.isFinite(floor)&&faces.length){
   const roofY=floor+2.9,vertices=[];for(const face of faces)for(const i of face){const p=ring[i];vertices.push(p[0],roofY,p[2]);}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((v,i)=>i%3===0?[v/2,vertices[i+2]/2]:[]),2));geo.computeVertexNormals();
   const roof=(materials.roofMat?.clone()??new THREE.MeshStandardMaterial({color:'#55574f',roughness:.95}));roof.side=THREE.DoubleSide;
   const cover=new THREE.Mesh(geo,roof);cover.name='Inferred Yakuriki cafe roof';cover.castShadow=true;cover.receiveShadow=true;group.add(cover);report.triangles+=faces.length;
   const wood=materials.woodMat??materials.timberMat??new THREE.MeshStandardMaterial({color:'#51483b',roughness:.95});
   // Supports remain inside the footprint and away from every mapped route.
   const distance=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);};
   const paths=(features.paths??[]).filter(p=>p.points?.length>1);
   for(const p of ring){const x=p[0]*.85+center[0]*.15,z=p[2]*.85+center[1]*.15;let clear=Infinity;for(const route of paths)for(let i=1;i<route.points.length;i++)clear=Math.min(clear,distance(x,z,route.points[i-1],route.points[i]));const y=surfaces.height(x,z);if(clear<1.5||!Number.isFinite(y)||roofY-y<.5||roofY-y>5)continue;const post=new THREE.Mesh(new THREE.BoxGeometry(.12,roofY-y,.12),wood);post.position.set(x,(roofY+y)/2,z);post.name='Inferred cafe support';post.castShadow=true;group.add(post);report.triangles+=12;}
   report.builtIds.push(CAFE);report.floor=floor;report.roofY=roofY;report.cafeFrontage='open';
  }
 }
 group.userData=report;root.add(group);return report;
}
