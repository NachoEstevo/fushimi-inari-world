import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const TAMAGAKI_RUNS=Object.freeze([
 [-10.5,-32.65,.22,17.7],[10.5,-32.65,.22,17.7],
 [0,-41.5,21,.22],[-8,-23.8,5,.22],[8,-23.8,5,.22],
]);
export const isHondenSolidFenceTriangle=vs=>TAMAGAKI_RUNS.some(([x,z,w,d])=>vs.every(p=>Math.abs(p[0]-x)<=w/2+.001&&Math.abs(p[2]-z)<=d/2+.001&&p[1]>=3.199&&p[1]<=4.851));
function batches(group){
 const parts=new Map();
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);};
 return {box:(w,h,d,x,y,z,m)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m),
 cylinder:(r,h,x,y,z,m)=>add(new THREE.CylinderGeometry(r,r,h,6).translate(x,y,z),m),
 flush:()=>{for(const [m,gs]of parts){const geo=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,m);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}return parts.size;}};
}
const find=(scene,name)=>{let mesh;scene.traverse(o=>{if(o.isMesh&&o.material?.name===name)mesh=o;});return mesh;};
const material=(m,key,color)=>m[key]??new THREE.MeshStandardMaterial({color,roughness:.85});

// Source-frame operation before remapping/matrix. Exact production signature
// prevents partial deletion if another asset/version occupies similar bounds.
export function refineHondenOpenEnclosure(scene,materials={}){
 const name='Honden open tamagaki R95',old=scene.getObjectByName(name);if(old)return old.userData;
 let red;scene.traverse(o=>{if(o.isMesh&&o.material?.name==='MAT_Vermilion_ShuIro'){o.geometry.computeBoundingBox();const bounds=o.geometry.boundingBox;if(Math.abs(bounds.min.z+41.61)<.02&&Math.abs(bounds.max.z+23.69)<.02)red=o;}});if(!red)return {built:false,reason:'Source vermilion unavailable'};
 const source=red.geometry.index?red.geometry.toNonIndexed():red.geometry,p=source.attributes.position,keep=[];let removed=0;
 for(let i=0;i<p.count;i+=3){const vs=[0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k)]);if(isHondenSolidFenceTriangle(vs))removed++;else keep.push(i,i+1,i+2);}
 if(removed!==540){if(source!==red.geometry)source.dispose();return {built:false,reason:'Complete five-wall source signature unavailable',removedCandidate:removed};}
 const replacement=new THREE.BufferGeometry();for(const [key,a]of Object.entries(source.attributes)){const values=new a.array.constructor(keep.length*a.itemSize);for(let i=0;i<keep.length;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.array[keep[i]*a.itemSize+k];replacement.setAttribute(key,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}
 const group=new THREE.Group();group.name=name;const b=batches(group),r=materials.vermilionMat??red.material,black=material(materials,'blackNemakiMat','#272b27');let pickets=0;
 for(const [x,z,w,d]of TAMAGAKI_RUNS){
  const alongX=w>d,length=Math.max(w,d),count=Math.ceil(length/.25),at=u=>alongX?[x+u,z]:[x,z+u];
  const box=(len,h,depth,u,y,m)=>{const [px,pz]=at(u);b.box(alongX?len:depth,h,alongX?depth:len,px,y,pz,m);};
  // Narrow black foot and two open rails replace the opaque face. Every
  // solid remains within the original .22m wall and 3.2..4.85m height.
  box(length,.10,.20,0,3.25,black);
  for(const y of [3.49,4.56])box(length,.085,.10,0,y,r);
  for(let i=0;i<=count;i++){const u=-length/2+.055+i*(length-.11)/count;box(.075,1.48,.10,u,4.04,r);box(.09,.065,.12,u,4.8125,black);pickets++;}
 }
 const drawBatches=b.flush();red.geometry=replacement;if(source!==red.geometry&&source!==replacement)source.dispose();
 group.userData={built:true,removedTriangles:removed,runs:5,pickets,materialBatches:drawBatches,source:'DSC_0472_20190331.jpg; P3600508_20190331.jpg',
  retained:'Original five perimeter runs, front opening, every non-fence source triangle and all collision/terrain owners',
  limits:'Open red/black fence vocabulary observed; full five-run extent inherited rather than surveyed, opposite-side finish inferred. Picket spacing/count estimated.'};scene.add(group);return group.userData;
}

export function refineNaihaidenPrayerFront(scene,materials={}){
 const name='Naihaiden lattice offering front and bell cords R95',old=scene.getObjectByName(name);if(old)return old.userData;
 const stone=find(scene,'MAT_Granite_Stone_Moss'),red=find(scene,'MAT_Vermilion_ShuIro');if(!stone||!red)return {built:false,reason:'Naihaiden source unavailable'};
 stone.geometry.computeBoundingBox();const bounds=stone.geometry.boundingBox;
 // Naihaiden-only podium excludes Honden and geographically transformed meshes.
 if(Math.abs(bounds.min.z+29.3)>.02||Math.abs(bounds.max.z+19.382)>.02||Math.abs(bounds.max.x-5.8)>.02)return {built:false,reason:'Unrecognized Naihaiden source frame'};
 const group=new THREE.Group();group.name=name;const b=batches(group),r=materials.vermilionMat??red.material,dark=material(materials,'blackNemakiMat','#282c2b'),cord=material(materials,'prayerCordMat','#8c4940'),gold=material(materials,'goldMat','#b39b59');
 // Front photograph shows dark gridded offering fronts between red posts,
 // below the open colonnade. Keep their depth behind the source podium edge.
 for(let bay=0;bay<4;bay++){
  const x=-3.6+bay*2.4;
  for(const y of [4.02,4.73])b.box(2.16,.065,.14,x,y,-23.63,r);
  for(let i=0;i<=18;i++)b.box(.025,.66,.035,x-1.04+i*2.08/18,4.37,-23.61,dark);
  for(let i=0;i<=6;i++)b.box(2.10,.018,.035,x,4.08+i*.098,-23.60,dark);
 }
 // Nine thin hanging ropes and small bells, independent of the already
 // refined broad shimenawa. No new interaction or public collider implied.
 for(let i=0;i<9;i++){
  // Suspension reaches the existing source lintel at Y7.35; stopping at the
  // small bell would leave nine visibly floating hangers below the beam.
  const x=-4.4+i*1.1;b.cylinder(.015,2.86,x,5.92,-23.68,cord);b.cylinder(.045,.08,x,6.51,-23.68,gold);b.cylinder(.025,.18,x,4.40,-23.68,cord);
 }
 group.userData={built:true,offeringBays:4,bellCords:9,materialBatches:b.flush(),source:'https://fushimiinari-guide.com/wp-content/uploads/DSC_0712_20190331.jpg',
  limits:'Offering-front grille and hanging bell cords observed; bay fitting, nine cords, spacing and heights inferred within inherited colonnade. No readable signs, donor names, unseen interior or public access introduced.',terrainChanged:false,collidersAdded:0};scene.add(group);return group.userData;
}

// Apply after R75 and before the prayer front. The entire front roof shell,
// fascia and existing ornaments share one continuous deformation; the rear
// junction, source plan and ridge retain their positions.
export function refineNaihaidenArchitecture(scene,materials={}){
 if(scene.userData.naihaidenArchitectureR95)return scene.userData.naihaidenArchitectureR95;
 const stone=find(scene,'MAT_Granite_Stone_Moss');if(!stone)return {built:false,reason:'Source podium unavailable'};
 stone.geometry.computeBoundingBox();if(Math.abs(stone.geometry.boundingBox.min.z+29.3)>.02)return {built:false,reason:'Unrecognized Naihaiden source'};
 const red=find(scene,'MAT_Vermilion_ShuIro');
 // R75 adds another red batch; locate the source core by its front plane.
 const faces=[];scene.traverse(o=>{if(!o.isMesh||!['MAT_Vermilion_ShuIro','MAT_White_Shikku_Plaster'].includes(o.material?.name))return;
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,keep=[],take=[];
  const front=o.material.name==='MAT_Vermilion_ShuIro'?-25.4:-25.3;
  for(let i=0;i<p.count;i+=3){const hit=[0,1,2].every(k=>Math.abs(p.getZ(i+k)-front)<.001&&Math.abs(p.getX(i+k))<4.91&&p.getY(i+k)>=3.919&&p.getY(i+k)<=7.526);(hit?take:keep).push(i,i+1,i+2);}
  if(take.length===30)faces.push({o,g,keep,take});else if(g!==o.geometry)g.dispose();
 });
 if(faces.length!==2){faces.forEach(f=>{if(f.g!==f.o.geometry)f.g.dispose();});return {built:false,reason:'Exact recessed core front faces unavailable',candidates:faces.length};}
 const group=new THREE.Group();group.name='Naihaiden recessed screen and transoms R95';
 const timber=material(materials,'naihaidenScreenMat','#302d28'),green=material(materials,'naihaidenTransomMat','#234f43'),r=materials.vermilionMat??red.material,b=batches(group);
 for(const {o,g,keep,take}of faces){
  const copy=ids=>{const out=new THREE.BufferGeometry();for(const [key,a]of Object.entries(g.attributes)){const values=new a.array.constructor(ids.length*a.itemSize);for(let i=0;i<ids.length;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.array[ids[i]*a.itemSize+k];out.setAttribute(key,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}return out;};
  const front=new THREE.Mesh(copy(take),timber);front.castShadow=front.receiveShadow=true;group.add(front);o.geometry=copy(keep);g.dispose();
 }
 // Dark closed screen planes retain the sacred core's solidity. Photo green
 // transoms and timber verticals read as the shaded backdrop, never a new room.
 for(let i=0;i<5;i++){
  const x=-3.84+i*1.92;b.box(1.68,.43,.045,x,6.13,-25.265,green);
  for(let j=0;j<=8;j++)b.box(.018,.42,.025,x-.79+j*.1975,6.13,-25.23,timber);
 }
 for(const y of [5.86,6.39])b.box(9.6,.11,.08,0,y,-25.24,r);
 for(let i=0;i<=10;i++)b.box(.045,1.82,.055,-4.75+i*.95,4.90,-25.34,timber);
 // The photographed curved pediment is pale plaster behind the inherited
 // painted relief, not an open black hole into the roof. Its top follows the
 // same subsequent deformation as the soffit bands and front shell.
 const pediment=[];for(let i=0;i<40;i++){
  const xa=-2.85+i*5.7/40,xb=-2.85+(i+1)*5.7/40,top=x=>7.40+.69*(1-Math.pow(Math.abs(x)/2.85,1.8));
  if(top(xa)>7.40001)for(const v of [[xa,7.40,-23.64],[xb,7.40,-23.64],[xa,top(xa),-23.64]])pediment.push(...v);
  if(top(xb)>7.40001)for(const v of [[xa,top(xa),-23.64],[xb,7.40,-23.64],[xb,top(xb),-23.64]])pediment.push(...v);
 }
 const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(pediment,3));pg.computeVertexNormals();const plaster=material(materials,'plasterMat','#ddd9cf'),panel=new THREE.Mesh(pg,plaster);panel.castShadow=panel.receiveShadow=true;group.add(panel);
 b.flush();scene.add(group);
 const cusp=(x,half,rise)=>{const t=Math.abs(x)/half;return t<1?rise*Math.pow((Math.cos(t*Math.PI)+1)/2,1.35):0;};
 let moved=0;scene.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone(),p=g.attributes.position;let changed=false;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(z<=-24.52||y<=7.30||Math.abs(x)>=4.2)continue;const t=Math.min(1,(z+24.52)/2.52),depth=t*t*(3-2*t),height=Math.min(1,(y-7.30)/.25),delta=(cusp(x,4.2,2.0)-cusp(x,3.036,.87))*depth*height;p.setY(i,y+delta);changed=true;moved++;}
  if(changed){g.computeVertexNormals();o.geometry=g;}else g.dispose();
 });
 const report={built:true,coreFacesRecolored:20,transoms:5,roofVerticesMoved:moved,frontCusp:{halfWidth:4.2,rise:2.0},rearCutoff:-24.52,
  source:'DSC_0712_20190331.jpg; DSC_0472_20190331.jpg',limits:'Broader/taller karahafu and dark screened core observed; exact curvature, five transoms and joinery inferred. Closed core retained; no interior, terrain or collider changes.'};scene.userData.naihaidenArchitectureR95=report;return report;
}
