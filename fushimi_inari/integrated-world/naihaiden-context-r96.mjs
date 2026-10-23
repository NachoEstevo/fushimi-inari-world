import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const NAME='Naihaiden hanging lantern and shade architecture R96';
// Source GLB coordinates; append after all R75/R95 refinements, before remap.
// The broadened R95 roof is never deformed or reauthored by this owner.
export function refineNaihaidenContextR96(scene,materials={}){
 const old=scene.getObjectByName(NAME);if(old)return old.userData;
 if(!scene.userData.naihaidenArchitectureR95?.built||!scene.getObjectByName('Naihaiden lattice offering front and bell cords R95'))return {built:false,reason:'Required R95 architecture and prayer-front owners unavailable'};
 const source={};scene.traverse(o=>{if(o.isMesh&&o.material?.name)source[o.material.name]??=o;});
 const stone=source.MAT_Granite_Stone_Moss;if(!stone)return {built:false,reason:'Naihaiden podium unavailable'};stone.geometry.computeBoundingBox();const b=stone.geometry.boundingBox;
 if(Math.abs(b.min.z+29.3)>.02||Math.abs(b.max.z+19.382)>.02||Math.abs(b.max.x-5.8)>.02)return {built:false,reason:'Unrecognized Naihaiden source frame'};
 const vermilion=materials.vermilionMat??source.MAT_Vermilion_ShuIro?.material;
 const dark=materials.blackNemakiMat??source.MAT_Black_Lacquer_Nemaki?.material;
 const pale=materials.plasterMat??source.MAT_White_Shikku_Plaster?.material;
 const gold=materials.goldMat??source.MAT_Gold_Kanagu_Leaf?.material;
 if(!vermilion||!dark||!pale||!gold)return {built:false,reason:'Required source materials unavailable'};
 const group=new THREE.Group();group.name=NAME;const batches=new Map();let primitives=0;
 const add=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);primitives++;};
 const box=(w,h,d,x,y,z,m)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const horizontalRoll=(w,x,y,z)=>add(new THREE.CylinderGeometry(.055,.055,w,8).rotateZ(Math.PI/2).translate(x,y,z),pale);
 // Actual frontal photograph: paired rectangular red-framed hanging lanterns,
 // pale gridded faces and small pitched red roofs, directly before columns.
 // Source stair lanterns remain independent at the bottom of the stairs.
 for(const x of [-2.4,2.4]){
  const z=-23.12;
  box(.025,.54,.025,x,7.08,z,dark);
  box(.035,.035,.65,x,7.3325,-23.42,dark);
  const roof=new THREE.ConeGeometry(.40,.20,4).rotateY(Math.PI/4).translate(x,6.77,z);add(roof,vermilion);
  box(.47,.055,.47,x,6.655,z,vermilion);
  box(.43,.055,.43,x,5.91,z,vermilion);
  // Four pale paper/glass-like faces have visible red perimeter frames and
  // dark fine lattice. No emissive light or invented historic emblem.
  for(const sign of [-1,1]){
   box(.39,.66,.018,x,6.28,z+sign*.20,pale);
   box(.018,.66,.39,x+sign*.20,6.28,z,pale);
   for(const edge of [-1,1])box(.035,.72,.035,x+sign*.22,6.28,z+edge*.22,vermilion);
   for(let i=0;i<7;i++){
    box(.012,.65,.018,x-.17+i*.34/6,6.28,z+sign*.214,dark);
    box(.018,.65,.012,x+sign*.214,6.28,z-.17+i*.34/6,dark);
   }
   for(let i=0;i<4;i++){
    box(.38,.012,.018,x,6.02+i*.17,z+sign*.214,dark);
    box(.018,.012,.38,x+sign*.214,6.02+i*.17,z,dark);
   }
  }
  box(.07,.05,.07,x,6.895,z,gold);
 }
 // Five R95 green transoms already have upright bars. Add only their missing
 // horizontal mesh to that exact rear plane; do not add another front screen.
 for(let bay=0;bay<5;bay++){
  const x=-3.84+bay*1.92;
  for(let row=0;row<5;row++)box(1.59,.012,.018,x,5.965+row*.0825,-25.212,dark);
  // Photo shows a pale roll/valance immediately below the transoms. Keep a
  // shallow header, leaving all offering openings and bell cords unobstructed.
  horizontalRoll(1.68,x,5.77,-25.17);
  box(1.67,.18,.025,x,5.65,-25.16,pale);
  for(let i=0;i<19;i++)box(.006,.17,.008,x-.80+i*1.60/18,5.65,-25.141,dark);
 }
 for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.name=NAME+' material batch';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:true,revision:'R96',hangingLanterns:2,transomMeshBays:5,rolledShadeHeaders:5,materialBatches:batches.size,primitives,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),collidersAdded:0,terrainChanged:false,source:'https://fushimiinari-guide.com/wp-content/uploads/DSC_0712_20190331.jpg',bounds:{x:[-4.68,4.68],y:[5.55,7.35],z:[-25.23,-22.72]},limits:'Lantern pair, gridded transoms and pale shade headers observed; dimensions, counts, materials and recess depth inferred. Roof and original geometry unchanged. No unseen sidewall, light or new public access.'};scene.add(group);return group.userData;
}
