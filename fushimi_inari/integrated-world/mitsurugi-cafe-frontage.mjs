import * as THREE from 'three';
export const MITSURUGI_CAFE_ID='way/626313723';
const NAME='Mapped Mitsurugi cafe frontage';

// Photo400_35: dark timber roadside cafe, open frontage and pitched dark roof.
// Source: https://livingkyo.com/2638/ (2019), 2019/08/400_35.png.
// OSM supplies footprint and cafe identity. East-facing frontage is inferred
// from its long edge nearest path1270597604, not a surveyed camera bearing.
// Heights, bays, unseen walls and single roof pitch remain conservative inference.
export function buildMitsurugiCafeFrontage(root,features,surfaces,colliders=[],materials={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const feature=features.buildings?.find(b=>b.id===MITSURUGI_CAFE_ID),path=features.paths?.find(p=>p.id==='way/1270597604');
 if(!feature||feature.tags?.amenity!=='cafe'||feature.points?.length!==11||!path)return {builtIds:[],reason:'mapped-cafe-and-front-path-required'};
 const ring=feature.points.slice(0,-1),[a,b]=ring;
 if(!ring.every(p=>p.every(Number.isFinite)))return {builtIds:[],reason:'finite-footprint-required'};
 const length=Math.hypot(b[0]-a[0],b[2]-a[2]),ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,nx=-uz,nz=ux;
 // The existing map signature identifies its long eastern front unambiguously.
 if(length<8.8||length>9.1||nx>-.8)return {builtIds:[],reason:'mapped-front-signature-required'};
 const mid=[(a[0]+b[0])/2,(a[2]+b[2])/2];let nearest;
 for(let i=1;i<path.points.length;i++){const p=path.points[i-1],q=path.points[i],dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,((mid[0]-p[0])*dx+(mid[1]-p[2])*dz)/(dx*dx+dz*dz||1))),x=p[0]+dx*t,z=p[2]+dz*t,d=Math.hypot(x-mid[0],z-mid[1]);if(!nearest||d<nearest.d)nearest={x,z,d};}
 const floor=surfaces.height(nearest.x,nearest.z),supports=ring.map(p=>surfaces.height(p[0],p[2]));
 if(!Number.isFinite(floor)||!supports.every(Number.isFinite)||nearest.d>2)return {builtIds:[],reason:'finite-adjacent-path-support-required'};
 const depth=Math.max(...ring.map(p=>(p[0]-a[0])*nx+(p[2]-a[2])*nz));
 const roofY=(x,z)=>floor+2.65+.70*Math.max(0,((x-a[0])*nx+(z-a[2])*nz)/depth);
 const rootGroup=new THREE.Group();rootGroup.name=NAME;
 const timber=(materials.woodMat??materials.timberMat??materials.roofMat)?.clone()??new THREE.MeshStandardMaterial();timber.color.set('#514b3d');timber.roughness=.96;
 const roof=materials.roofMat?.clone()??new THREE.MeshStandardMaterial();roof.color.set('#55574f');roof.roughness=.95;roof.side=THREE.DoubleSide;
 const foundation=materials.stoneMat?.clone()??new THREE.MeshStandardMaterial();foundation.color.set('#999a8d');foundation.roughness=.98;
 const put=(vertices,material,name)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const uv=[],n=g.attributes.normal;for(let i=0;i<vertices.length;i+=3){const j=i/3,horizontal=Math.abs(n.getY(j))>.7;uv.push((horizontal?vertices[i]:Math.abs(n.getX(j))>Math.abs(n.getZ(j))?vertices[i+2]:vertices[i])/.8,(horizontal?vertices[i+2]:vertices[i+1])/.8);}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;rootGroup.add(mesh);};
 const walls=[],base=[],eaves=[];
 for(let i=1;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],j=(i+1)%ring.length,lo=Math.min(supports[i],floor-.12),lq=Math.min(supports[j],floor-.12),bottom=floor+.05;
  base.push(p[0],lo,p[2],q[0],lq,q[2],q[0],bottom,q[2],p[0],lo,p[2],q[0],bottom,q[2],p[0],bottom,p[2]);
  // A shallow timber fascia articulates the inferred top edge without adding openings.
  const py=roofY(p[0],p[2]),qy=roofY(q[0],q[2]);eaves.push(p[0],py-.14,p[2],q[0],qy-.14,q[2],q[0],qy,q[2],p[0],py-.14,p[2],q[0],qy,q[2],p[0],py,p[2]);
  walls.push(p[0],bottom,p[2],q[0],bottom,q[2],q[0],roofY(q[0],q[2]),q[2],p[0],bottom,p[2],q[0],roofY(q[0],q[2]),q[2],p[0],roofY(p[0],p[2]),p[2]);
 }
 // Neutral closed unseen sides; only the photo-supported roadside is open.
 timber.side=foundation.side=THREE.DoubleSide;put(base,foundation,'Terrain-seated cafe foundation');put(walls,timber,'Simple dark cafe side envelope');
 const fascia=timber.clone();fascia.color.set('#6a604d');fascia.polygonOffset=true;fascia.polygonOffsetFactor=-1;fascia.polygonOffsetUnits=-1;put(eaves,fascia,'Inferred timber eave trim');
 const top=[];for(const triangle of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]))for(const j of triangle){const p=ring[j];top.push(p[0],roofY(p[0],p[2]),p[2]);}put(top,roof,'Inferred sloped cafe roof within mapped eave');
 const box=(w,h,d,x,y,z,yaw=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),timber);mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.castShadow=mesh.receiveShadow=true;rootGroup.add(mesh);};
 const yaw=Math.atan2(-uz,ux),setback=.10;
 for(let i=0;i<=5;i++){const t=.06+.88*i/5,x=a[0]+ux*length*t+nx*setback,z=a[2]+uz*length*t+nz*setback,h=2.65;box(.11,h,.11,x,floor+h/2,z,yaw);colliders.push({type:'cylinder',args:[x,z,.078,floor,floor+h,'mitsurugi_cafe_front_post']});}
 box(length-.20,.15,.14,mid[0]+nx*setback,floor+2.55,mid[1]+nz*setback,yaw);
 rootGroup.userData={built:true,builtIds:[feature.id],sourceFeature:feature.id,floor,front:[a,b],nearestPath:[nearest.x,nearest.z],sourcePhoto:'https://livingkyo.com/wp-content/uploads/2019/08/400_35.png',observed:'Dark timber roadside frontage, open bays, sloped dark roof',inferred:'East frontage from nearest mapped long edge; 2.65m eave, .70m roof rise, six posts, shallow eave trim, unseen sides and terrain foundation. Shared existing timber/bark and stone textures use .8m UV units. Original mapped footprint retained; no shop text or invented activities.'};root.add(rootGroup);return rootGroup.userData;
}
