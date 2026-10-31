import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {textureStreaming} from './texture-streaming.mjs?v=repair-20261025b';

const ID='way/626313677', NAME='Kandakara mapped shrine';
const SOURCE='https://kyototemples.jp/archives/3569';

// Clip each mapped roof triangle at the ridge so the pitched surface stays
// inside the concave OSM footprint, including the small projecting wings.
function clip(poly,axis,ridge,sign){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],da=sign*(a[axis]-ridge),db=sign*(b[axis]-ridge);
  if(da>=0)out.push(a);
  if((da<0&&db>0)||(da>0&&db<0)){
   const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);
  }
 }
 return out;
}
// OSM identifies the concave footprint. The 2019 photograph shows an open
// west-facing timber worship hall, gable and four shide. Roof profile, heights
// and internal layout are inferred; the geometry remains in the mapped outline.
export function buildKandakaraShrine(root,features,surfaces,materials){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const building=features.buildings.find(b=>b.id===ID);
 const ring=building?.points?.slice(0,-1);
 if(!ring||ring.length!==13||!ring.every(p=>Array.isArray(p)&&p.length>=3&&p.every(Number.isFinite)))return {builtIds:[],built:false};
 // The worship frontage is registered to the current west edge, not inferred
 // from arbitrary replacement polygon indices after a future map update.
 if(Math.hypot(ring[2][0]-382.238,ring[2][2]-67.092)>1)return {builtIds:[],built:false};
 const grades=ring.map(p=>surfaces.height(p[0],p[2]));
 if(!grades.every(Number.isFinite))return {builtIds:[],built:false};
 const base=Math.min(...grades),eave=Math.max(...grades)+2.8;
 const shape=ring.map(p=>new THREE.Vector2(p[0],p[2]));
 const triangles=THREE.ShapeUtils.triangulateShape(shape,[]);
 if(!triangles.length)return {builtIds:[],built:false};
 const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[2]);
 const axis=Math.max(...xs)-Math.min(...xs)>Math.max(...zs)-Math.min(...zs)?1:0;
 const values=axis===0?xs:zs,min=Math.min(...values),max=Math.max(...values),ridge=(min+max)/2;
 const roofHeight=p=>eave+1.25*(1-Math.abs(p[axis]-ridge)/((max-min)/2));
 const group=new THREE.Group();group.name=NAME;const parts=staticParts(group);
 const woodMap=textureStreaming.load(new URL('../assets/textures/kandakara-cedar-albedo-v1.webp',import.meta.url).href);
 woodMap.colorSpace=THREE.SRGBColorSpace;woodMap.wrapS=woodMap.wrapT=THREE.RepeatWrapping;
 const wood=new THREE.MeshStandardMaterial({color:'#e4d6c4',map:woodMap,roughness:.9,side:THREE.DoubleSide,vertexColors:true,
  normalMap:materials.vermilionMat?.normalMap??null,roughnessMap:materials.vermilionMat?.roughnessMap??null,
  normalScale:new THREE.Vector2(.16,.16)});
 wood.name='Kandakara timber';
 // Static local contact shading uses existing vertices and the timber batch.
 // Depth is measured from the registered west frontage; the transition is
 // gentle so the exposed posts remain light while the hall reads recessed.
 const shadeWood=geometry=>{
  const p=geometry.attributes.position,n=geometry.attributes.normal,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
   const foot=Math.max(0,1-(p.getY(i)-base)/.42),under=Math.max(0,-n.getY(i));
   const depth=THREE.MathUtils.clamp((p.getX(i)-ring[2][0]-.55)/4,0,1);
   const interior=depth*depth*(3-2*depth);
   const shade=(1-.13*foot-.10*under)*(1-.34*interior);colors.set([shade,shade,shade],i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));return geometry;
 };
 const roof=materials.copperRoofMat?.clone()??new THREE.MeshStandardMaterial();
 roof.name='Kandakara dark roof';roof.color.set('#485950');roof.map=null;roof.roughness=.9;roof.metalness=.08;roof.side=THREE.DoubleSide;
 const rope=new THREE.MeshStandardMaterial({color:'#c0aa7d',roughness:1});
 const paper=new THREE.MeshStandardMaterial({color:'#eeeae0',roughness:1,side:THREE.DoubleSide});
 const stone=(materials.entryStoneMat??materials.stoneMat??new THREE.MeshStandardMaterial({color:'#a3a297',roughness:1})).clone();
 stone.name='Kandakara visual-only stone';
 const wall=[];
 for(let i=0;i<ring.length;i++){
  if(i===1||i===2)continue; // photographed open west frontage
  const a=ring[i],b=ring[(i+1)%ring.length];
  wall.push(a[0],base,a[2],b[0],base,b[2],b[0],eave,b[2],a[0],base,a[2],b[0],eave,b[2],a[0],eave,a[2]);
 }
 // Close the gable below the pitch, splitting edges at the ridge.
 for(let i=0;i<ring.length;i++){
  if(i===1||i===2)continue;
  const a=[ring[i][0],ring[i][2]],b=[ring[(i+1)%ring.length][0],ring[(i+1)%ring.length][2]];
  const split=(a[axis]-ridge)*(b[axis]-ridge)<0;
  const t=split?(ridge-a[axis])/(b[axis]-a[axis]):0;
  const edge=split?[a,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],b]:[a,b];
  for(let j=1;j<edge.length;j++){
   const p=edge[j-1],q=edge[j];wall.push(p[0],eave,p[1],q[0],eave,q[1],q[0],roofHeight(q),q[1],p[0],eave,p[1],q[0],roofHeight(q),q[1],p[0],roofHeight(p),p[1]);
  }
 }
 const wallGeometry=new THREE.BufferGeometry();wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wall,3));wallGeometry.computeVertexNormals();parts.put(shadeWood(wallGeometry),wood);
 const roofVertices=[];
 for(const tri of triangles){
  const points=tri.map(i=>[ring[i][0],ring[i][2]]);
  for(const sign of [-1,1]){
   const polygon=clip(points,axis,ridge,sign);
   for(let i=1;i+1<polygon.length;i++)for(const p of [polygon[0],polygon[i],polygon[i+1]])roofVertices.push(p[0],roofHeight(p),p[1]);
  }
 }
 parts.sheet(roofVertices,roof);
 // The mapped approach terminates at the west-facing worship frontage.
 // The photo shows an open hall, thick posts, lintels, rafters, rope, four
 // streamers and low lattice. Keep details inside the registered footprint.
 const a=ring[1],b=ring[3],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
 const at=(t,y,inset=.16)=>[a[0]+dx*t+inset,y,a[2]+dz*t];
 const beam=(u,v,r,material=wood)=>{
  if(material!==wood)return parts.beam(u,v,r,material,r,6);
  const start=new THREE.Vector3(...u),end=new THREE.Vector3(...v),delta=end.clone().sub(start);
  const geometry=new THREE.BoxGeometry(r*2,delta.length(),r*2);
  // Box coordinates are still in beam space here: V follows its long axis.
  const positions=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<positions.count;i++){
   const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i));
   uv.setXY(i,(nx>ny?positions.getZ(i):positions.getX(i))/1.5,(ny>.9?positions.getZ(i):positions.getY(i))/1.5);
  }
  geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));
  return parts.put(shadeWood(geometry.translate(...start.add(end).multiplyScalar(.5).toArray())),material,false);
 };
 const yaw=Math.atan2(-dz,dx);
 const box=(width,height,depth,t,y,inset,material)=>{
  const geometry=new THREE.BoxGeometry(width,height,depth).rotateY(yaw).translate(...at(t,y,inset));
  parts.put(material===wood?shadeWood(geometry):geometry,material);
 };
 // The photo shows three shallow stone steps leading into the hall. Their
 // dimensions and floor datum are inferred, and these are visual geometry:
 // the existing public support and collider owners are left untouched.
 const frontGrade=surfaces.height(ring[2][0],ring[2][2]);
 for(let i=0;i<3;i++){
  const h=(i+1)*.15;
  box(length*.66,h,.46,.5,frontGrade+h/2,.34+i*.46,stone);
 }
 // The landing extends only across the mapped west hall, under the counter.
 // Cloned stone prevents automatic public floor admission by material identity.
 const counterY=frontGrade+.45,landingBottom=Math.min(base,frontGrade);
 box(length*.66,counterY-landingBottom,2.3,.5,(counterY+landingBottom)/2,2.65,stone);
 // A restrained counter inside the open hall, 2 m behind its front edge.
 box(1.5,.1,.5,.5,counterY+.82,2.05,wood);
 for(const t of [.5-0.6/length,.5+0.6/length])for(const depth of [1.88,2.22])
  box(.08,.77,.08,t,counterY+.385,depth,wood);
 // A shallow open lattice behind the counter gives the photographed hall a
 // readable interior while avoiding a newly invented enclosed building.
 for(const t of [.21,.36,.64,.79])beam(at(t,counterY+.04,3.3),at(t,eave-.12,3.3),.035);
 for(const y of [counterY+.48,counterY+1.05,counterY+1.62]){
  beam(at(.21,y,3.3),at(.36,y,3.3),.025);
  beam(at(.64,y,3.3),at(.79,y,3.3),.025);
 }
 beam(at(.36,counterY+.04,3.3),at(.36,eave-.12,3.3),.065);
 beam(at(.64,counterY+.04,3.3),at(.64,eave-.12,3.3),.065);
 beam(at(.36,eave-.12,3.3),at(.64,eave-.12,3.3),.065);
 // Narrow longitudinal timber seams are confined to the landing and ceiling.
 for(const t of [.24,.34,.44,.54,.64,.74]){
  beam(at(t,counterY+.014,1.56),at(t,counterY+.014,3.75),.009);
 }
 for(const t of [.08,.92])beam(at(t,base+.05,.24),at(t,eave-.02,.24),.12);
 beam(at(.08,eave-.18,.24),at(.92,eave-.18,.24),.12);
 // Roof trusses and visible rafters recede into the hall rather than adding
 // an overhang. Their precise dimensions are inferred from the photo.
 for(const inset of [.25,.75,1.25,1.75]){
  const peak=at(.48,eave+1.08,inset);
  beam(at(.08,eave-.03,inset),peak,.055);
  beam(peak,at(.92,eave-.03,inset),.055);
 }
 beam(at(.16,eave-.36,.18),at(.84,eave-.36,.18),.045,rope);
 for(const t of [.31,.43,.57,.69]){
  // A folded paper zigzag, all on the open facade plane.
  const vertices=[],step=.095,w=.095;
  for(let i=0;i<6;i++){
   const t0=t+(i%2?-.012:.012),t1=t+(i%2?.012:-.012);
   const y0=eave-.39-i*step,y1=y0-step;
   const p=at(t0-w/length/2,y0,.17),q=at(t0+w/length/2,y0,.17);
   const r=at(t1-w/length/2,y1,.17),s=at(t1+w/length/2,y1,.17);
   vertices.push(...p,...q,...r,...r,...q,...s);
  }
  parts.sheet(vertices,paper);
 }
 // Two low railings: horizontal rails and crossed thin lattice inside posts.
 for(const [lo,hi] of [[.10,.29],[.71,.90]]){
  for(const y of [counterY+.25,counterY+.95])beam(at(lo,y,.38),at(hi,y,.38),.035);
  for(let i=0;i<5;i++){
   const t=lo+(hi-lo)*i/5,u=lo+(hi-lo)*(i+1)/5;
   beam(at(t,counterY+.25,.38),at(u,counterY+.95,.38),.016);
   beam(at(t,counterY+.95,.38),at(u,counterY+.25,.38),.016);
  }
 }
 const stats=parts.flush();group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 group.userData={built:true,builtIds:[ID],source:SOURCE,sourceDate:'2019',dimensionsInferred:true,roofInferred:true,front:'west approach',frontGrade,landingY:counterY,shide:4,steps:3,stepRise:.15,landingInferred:true,counterInferred:true,visualFloorOnly:true,extraLights:0,extraColliders:0,...stats};
 root.add(group);return group.userData;
}
