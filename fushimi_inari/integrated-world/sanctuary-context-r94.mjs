import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const NAME='Honden photographed rear veranda balustrade R94';
// Source frame of honden.glb: X=-Blender Y, Y=Blender Z, Z=-Blender X.
// Photo establishes open red railing with gold collars above the veranda.
// Dimensions and post count are inferred; the inherited veranda is authoritative.
export function refineHondenRearVeranda(scene,materials={}){
  const previous=scene.getObjectByName(NAME);if(previous)return previous.userData;
  let red,stone;scene.traverse(o=>{if(!o.isMesh)return;if(o.material?.name==='MAT_Vermilion_ShuIro')red=o;if(o.material?.name==='MAT_Granite_Stone_Moss')stone=o;});
  if(!red||!stone)return {built:false,reason:'Honden source materials unavailable'};
  stone.geometry.computeBoundingBox();const b=stone.geometry.boundingBox;
  if(Math.abs(b.min.z+39.4)>.04||Math.abs(b.max.z+28.6)>.04||Math.abs(b.max.x-7.2)>.04)return {built:false,reason:'Unrecognized Honden source frame'};
  const group=new THREE.Group();group.name=NAME;
  const vermilion=materials.vermilionMat??red.material;
  const gold=materials.goldMat??new THREE.MeshStandardMaterial({color:'#bda354',roughness:.4,metalness:.65});
  const batches=new Map();
  const box=(w,h,d,x,y,z,m)=>{const g=new THREE.BoxGeometry(w,h,d).translate(x,y,z).toNonIndexed();if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
  // Back edge is inside the inherited 9.8m-deep veranda, not the outer
  // tamagaki or public perimeter. No enclosing wall or public opening added.
  for(const y of [4.83,5.32])box(12.8,.095,.11,0,y,-38.77,vermilion);
  for(let i=0;i<9;i++){
    const x=-6.28+i*1.57;
    box(.12,.91,.13,x,4.995,-38.77,vermilion);
    for(const y of [4.60,4.83,5.32])box(.16,.065,.17,x,y,-38.77,gold);
    box(.17,.045,.18,x,5.465,-38.77,gold);
  }
  for(const [m,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  group.userData={built:true,source:'https://fushimiinari-guide.com/wp-content/uploads/P3600508_20190331.jpg',posts:9,materialBatches:batches.size,collidersAdded:0,terrainChanged:false,
    bounds:{x:[-6.4,6.4],y:[4.54,5.49],z:[-38.86,-38.68]},
    provenance:'Rear red open balustrade and gold collars observed; source-frame veranda registration, nine posts and sizes inferred. No outer tamagaki, offering slot, gutter, hidden return or architectural exactness claimed.'};
  scene.add(group);return group.userData;
}
