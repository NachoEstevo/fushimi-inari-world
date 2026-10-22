import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {romonWingDimensions as D,romonWingLayout,isInheritedRomonWingTriangle,isInheritedRomonBarrelTriangle,romonWingRoofTop,isInheritedRomonWingRoofPoint,isInheritedRomonWingRoofFitting} from './romon-wings-layout.mjs?v=71b';

// IMG6484/6485: a windowed OUTER wall behind an OPEN court arcade.
// Preserve the inherited wing roof envelope/base and geographic adapter. The former
// solid plaster blocks and duplicate court screens incorrectly sealed it.
export function refineRomonWings(scene,m){
 if(scene.userData.romonWingDetail)return scene.userData.romonWingDetail;
 let removedTriangles=0;const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const role=mat=>mat===m.plasterMat||/White_Shikku_Plaster/.test(mat.name??'')?'white':mat===m.vermilionMat||/Vermilion_ShuIro/.test(mat.name??'')?'red':mat===m.copperRoofMat||/Copper_Patina_Green/.test(mat.name??'')?'green':/Straw_Shimenawa/.test(mat.name??'')?'barrels':/Blue_Hengaku_Plaque/.test(mat.name??'')?'crests':mat===m.goldMat||/Gold_Kanagu_Leaf/.test(mat.name??'')?'goldRoof':mat===m.blackNemakiMat||/Black_Lacquer_Nemaki/.test(mat.name??'')?'blackRoof':null;
 const selectedTriangle=(points,kind)=>kind==='blackRoof'||kind==='goldRoof'?isInheritedRomonWingRoofFitting(points,kind):kind==='barrels'||kind==='crests'?isInheritedRomonBarrelTriangle(points,kind==='crests'):isInheritedRomonWingTriangle(points);
 // The production GLB has baked coordinates. Validate its complete bounded
 // triangle signature before mutating any merged material mesh.
 const selected={white:0,red:0,green:0,barrels:0,crests:0,blackRoof:0,goldRoof:0},expected={white:216,red:2208,green:7560,barrels:1080,crests:1080,blackRoof:1080,goldRoof:1608};
 for(const mesh of meshes){const kind=role(mesh.material);if(!kind)continue;const g=mesh.geometry,p=g.attributes.position;
  for(let i=0;i<(g.index?.count??p.count);i+=3){const points=[0,1,2].map(j=>{const k=g.index?g.index.getX(i+j):i+j;return[p.getX(k),p.getY(k),p.getZ(k)];});if(selectedTriangle(points,kind))selected[kind]++;}
 }
 let roofTriangles=0;const roofMeshes=meshes.filter(o=>/Hiwadabuki_Bark_Roof/.test(o.material.name??''));
 for(const mesh of roofMeshes){const g=mesh.geometry,p=g.attributes.position;for(let i=0;i<(g.index?.count??p.count);i+=3){const points=[0,1,2].map(j=>{const k=g.index?g.index.getX(i+j):i+j;return[p.getX(k),p.getY(k),p.getZ(k)];});if(points.every(isInheritedRomonWingRoofPoint))roofTriangles++;}}
 if(roofTriangles!==8056)return {revision:'R71',reconstructed:false,reason:'Production wing roof signature changed; source left intact',roofTriangles};
 if(Object.keys(expected).some(k=>selected[k]!==expected[k]))return {revision:'R71',reconstructed:false,reason:'Production wing triangle signature changed; source left intact',selected,expected};
 // Correct only roof vertices matching the original wing profile. The outer
 // hip now begins at the existing end wall, as IMG6491/6485 show, rather than
 // halfway along the corridor. Original shell thickness and plan stay fixed.
 for(const mesh of roofMeshes){const old=mesh.geometry,geo=old.clone(),p=geo.attributes.position,normal=old.attributes.normal,changed=new Set();
  for(let i=0;i<p.count;i++){const v=[p.getX(i),p.getY(i),p.getZ(i)];if(!isInheritedRomonWingRoofPoint(v))continue;p.setY(i,v[1]+romonWingRoofTop(v[0],v[2],true)-romonWingRoofTop(v[0],v[2]));changed.add(i);}
  geo.computeVertexNormals();for(let i=0;i<p.count;i++)if(!changed.has(i))geo.attributes.normal.setXYZ(i,normal.getX(i),normal.getY(i),normal.getZ(i));geo.computeBoundingSphere();mesh.geometry=geo;old.dispose();
 }
 for(const mesh of meshes){
  const mat=mesh.material;if(!role(mat))continue;
  const old=mesh.geometry,source=old.index?old.toNonIndexed():old,p=source.attributes.position,keep=[];
  for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(j=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]);if(selectedTriangle(points,role(mat)))removedTriangles++;else keep.push(i,i+1,i+2);}
  if(keep.length===p.count){if(source!==old)source.dispose();continue;}
  if(!keep.length){mesh.removeFromParent();if(source!==old)source.dispose();old.dispose();continue;}
  const replacement=new THREE.BufferGeometry();
  for(const [name,attribute]of Object.entries(source.attributes)){
   const values=[];for(const i of keep)for(let k=0;k<attribute.itemSize;k++)values.push(attribute.array[i*attribute.itemSize+k]);
   replacement.setAttribute(name,new THREE.BufferAttribute(new attribute.array.constructor(values),attribute.itemSize,attribute.normalized));
  }
  replacement.computeBoundingSphere();mesh.geometry=replacement;if(source!==old)source.dispose();old.dispose();
 }
 const green=new THREE.MeshStandardMaterial({color:'#386d57',roughness:.82});
 const goldTrim=new THREE.MeshStandardMaterial({color:'#9b8953',roughness:.77,metalness:.24});
 const batches=new Map(),red=m.vermilionMat,pale=m.plasterMat;
 const part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
 const disc=(x,y,z,front=true)=>part(new THREE.CircleGeometry(.045,6).rotateY(front?0:Math.PI).translate(x,y,z),m.goldMat);
 // A physical aperture has green slats but no opaque backing sheet. The
 // window is shared by the approach and the court, not duplicated at both edges.
 const window=(x,z,width,axis='x')=>{
  const at=(u,y,out)=>axis==='x'?[x+u,y,z+out]:[x+out,y,z+u];
  const panel=(w,h,d,u,y,out,mat)=>{const a=at(u,y,out);if(axis==='x')box(w,h,d,...a,mat);else box(d,h,w,...a,mat);};
  const mid=(D.windowBottom+D.windowTop)/2,height=D.windowTop-D.windowBottom;
  for(const u of [-width/2,width/2])panel(.085,height+.16,.18,u,mid,0,red);
  for(const y of [D.windowBottom-.04,D.windowTop+.04])panel(width+.14,.09,.18,0,y,0,red);
  for(const u of [-width/2+.055,width/2-.055])panel(.025,height,.19,u,mid,0,goldTrim);
  for(const y of [D.windowBottom+.02,D.windowTop-.02])panel(width-.05,.025,.19,0,y,0,goldTrim);
  const count=Math.max(12,Math.round(width/.105));
  for(let i=0;i<count;i++)panel(.043,height-.08,.08,-width/2+.09+i*(width-.18)/(count-1),mid,0,green);
  for(const y of [D.windowBottom+.38,D.windowTop-.38])panel(width-.08,.036,.09,0,y,0,green);
 };
 const black=m.blackNemakiMat??meshes.find(o=>/Black_Lacquer_Nemaki/.test(o.material.name??''))?.material;
 const beam=(a,b,width,depth,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),geo=new THREE.BoxGeometry(width,v.length(),depth);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));part(geo.translate(...av.add(bv).multiplyScalar(.5).toArray()),mat);};
 const triangle=(points,mat)=>{const geo=new THREE.BufferGeometry(),positions=points.flat();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(points.flatMap(p=>[p[2],p[1]]),2));geo.computeVertexNormals();part(geo,mat);};
 for(const wing of romonWingLayout()){
  const length=wing.end-wing.start;
  box(length,.80,.14,wing.mid,2.45,D.wallZ,pale);
  box(length,.70,.14,wing.mid,5.00,D.wallZ,pale);
  // Narrow white piers separate the five window apertures. The south outer
  // bay is solid in IMG6484; it must not receive a fabricated extra screen.
  let cursor=wing.start;
  for(const bay of wing.bays){
   const a=bay.x-D.windowWidth/2,b=bay.x+D.windowWidth/2;
   if(a>cursor)box(a-cursor,1.80,.14,(a+cursor)/2,3.75,D.wallZ,pale);
   if(bay.screen)window(bay.x,D.wallZ,D.windowWidth);
   else box(D.windowWidth,1.80,.14,bay.x,3.75,D.wallZ,pale);
   cursor=b;
  }
  if(cursor<wing.end)box(wing.end-cursor,1.80,.14,(cursor+wing.end)/2,3.75,D.wallZ,pale);
  for(const y of [2.12,2.84,4.69,5.28])box(length,.12,.20,wing.mid,y,D.wallZ,red);
  for(const x of wing.posts){
   for(const z of [D.wallZ,D.courtColumnZ])box(.20,3.30,.20,x,3.70,z,red);
   for(const z of [D.wallZ+.115,D.wallZ-.115])for(const y of [2.84,4.69])disc(x,y,z,z>D.wallZ);
  }
  // Open court beam, ceiling/soffit and transverse ties stay beneath the
  // original roof. Lanterns and the public-facing barrier have another owner.
  box(12.9,.17,.20,wing.mid,5.23,D.courtColumnZ,red);
  box(12.8,.045,3.75,wing.mid,5.30,0,pale);
  for(const x of wing.posts)box(.15,.15,3.85,x,5.20,0,red);
  for(const z of [-2.43,2.43])for(let i=0;i<29;i++){
   const x=wing.mid-6.5+i*13/28;box(.075,.12,.80,x,5.24,z,red);box(.08,.12,.035,x,5.24,z+Math.sign(z)*.42,m.goldMat);
  }
  // Full-length dark ridge and properly seated outer gable, replacing
  // the old short ridge and floating rectangular gold 'gable' placeholders.
  box(12.95,.24,.294,wing.mid,7.48,0,black);
  box(13.00,.035,.312,wing.mid,7.615,0,black);
  for(const offset of [-4.7,0,4.7])for(const face of [-1,1])part(new THREE.CircleGeometry(.065,12).rotateY(face<0?Math.PI:0).translate(wing.mid+offset,7.48,face*.159),m.goldMat);
  const gx=wing.side*18.93,baseY=5.43,apexY=7.26;
  const a=[gx,baseY,-1.80],b=[gx,baseY,1.80],c=[gx,apexY,0];triangle(wing.side>0?[a,c,b]:[a,b,c],pale);
  const outer=wing.side*19.02;
  for(const z of [-1.80,1.80])beam([outer,baseY,z],[outer,apexY,0],.13,.12,red);
  beam([outer,baseY,-1.80],[outer,baseY,1.80],.13,.12,red);
  beam([outer,baseY,0],[outer,apexY,0],.12,.12,red);
  for(const z of [-1.53,0,1.53])part(new THREE.CircleGeometry(.066,12).rotateY(wing.side*Math.PI/2).translate(wing.side*19.09,z===0?7.14:5.57,z),m.goldMat);
  box(.18,.32,.34,wing.side*19.00,7.64,0,black);
  part(new THREE.CircleGeometry(.062,12).rotateY(wing.side*Math.PI/2).translate(wing.side*19.10,7.64,0),m.goldMat);
  // Existing outer end closure: north has a large lattice aperture in6491.
  const end=wing.outerX;
  if(wing.endScreen){
   box(.14,.80,3.8,end,2.45,0,pale);box(.14,.70,3.8,end,5.00,0,pale);
   for(const z of [-1.60,1.60])box(.14,1.80,.60,end,3.75,z,pale);
   window(end,0,2.60,'z');
  }else box(.14,3.30,3.80,end,3.70,0,pale);
  for(const z of [-1.85,1.85])box(.18,3.3,.18,end,3.7,z,red);
  for(const y of [2.12,2.84,4.69,5.28])box(.20,.12,3.85,end,y,0,red);
 }
 const group=new THREE.Group();group.name='Romon Kairo facade refinement';let triangles=0;
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!geometry)throw Error('Romon wing batch merge failed');triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 scene.add(group);const stats={revision:'R71',reconstructed:true,removedTriangles,removedUnsupportedBarrels:18,removedUnsupportedCrests:18,wingRoofTriangles:roofTriangles,roofHipBeginsAtEndWall:true,outerGables:2,materialBatches:batches.size,triangles,outerWallLocalZ:D.wallZ,openArcadeLocalZ:D.courtColumnZ,screenBays:9,northEndWindow:true,dimensions:'Inherited13.2m wing plan retained; panel/bay dimensions photo-inferred, not surveyed',references:['IMG_6484_20210317','IMG_6485_20210317','IMG_6491_20210317'],limits:'Original roof footprint/height and base/central gate retained; wing roof end profile and fittings corrected from photos, not survey. The gallery is protected by the photographed barrier; original kairo_L/R solid collision envelopes remain. No new public walk route is claimed.'};scene.userData.romonWingDetail=stats;return stats;
}
