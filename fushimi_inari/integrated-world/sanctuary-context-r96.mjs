import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const NAME='Honden rear and side architectural envelope R96';
export const HONDEN_R96_ENVELOPE=Object.freeze({x:[-8.25,8.25],y:[4.35,8.53],z:[-39.59,-29.95]});
// Source coordinates, before the legacy placement matrix. The inherited podium
// and white rear wall register the detail; neither their floor nor terrain moves.
export function refineHondenServiceEnvelopeR96(scene,materials={}){
 const previous=scene.getObjectByName(NAME);if(previous)return previous.userData;
 const source={};scene.traverse(o=>{if(o.isMesh&&o.material?.name)source[o.material.name]??=o;});
 const stone=source.MAT_Granite_Stone_Moss,white=source.MAT_White_Shikku_Plaster,red=source.MAT_Vermilion_ShuIro;
 if(!stone||!white||!red)return {built:false,reason:'Honden source materials unavailable'};
 stone.geometry.computeBoundingBox();white.geometry.computeBoundingBox();const a=stone.geometry.boundingBox,b=white.geometry.boundingBox;
 if(Math.abs(a.min.z+39.4)>.02||Math.abs(a.max.x-7.2)>.02||Math.abs(a.max.y-4.35)>.02||Math.abs(b.min.z+38.3)>.02||Math.abs(b.max.y-9.25)>.02)return {built:false,reason:'Unrecognized Honden podium/rear wall signature'};
 const group=new THREE.Group();group.name=NAME;
 const vermilion=materials.vermilionMat??red.material;
 const gold=materials.goldMat??source.MAT_Gold_Kanagu_Leaf?.material??new THREE.MeshStandardMaterial({color:'#b69a53',roughness:.48,metalness:.55});
 const dark=materials.blackNemakiMat??source.MAT_Black_Lacquer_Nemaki?.material??new THREE.MeshStandardMaterial({color:'#292b27',roughness:.88});
 const parts=new Map();let solids=0;
 const add=(g,m)=>{const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();if(!parts.has(m))parts.set(m,[]);parts.get(m).push(n);solids++;};
 const box=(w,h,d,x,y,z,m)=>add(new THREE.BoxGeometry(w,h,d).translate(x,y,z),m);
 const pipe=(p,q,r,m)=>{const start=new THREE.Vector3(...p),end=new THREE.Vector3(...q),delta=end.clone().sub(start);const g=new THREE.CylinderGeometry(r,r,delta.length(),8);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());add(g,m);};
 // Rear photo shows the open red veranda continuing around the side corners.
 // R94 owns the rear run. The side returns join its end through short corner connectors,
 // preserving its post/collar owner and remaining inside the inherited podium.
 for(const x of [-6.8,6.8]){
  for(const y of [4.83,5.32]){
   box(.11,.095,8.72,x,y,-34.41,vermilion);
   box(.40,.095,.11,Math.sign(x)*6.6,y,-38.77,vermilion);
  }
  for(let i=0;i<6;i++){
   const z=-38.77+i*1.734;box(.13,.91,.12,x,4.995,z,vermilion);
   for(const y of [4.60,4.83,5.32])box(.17,.065,.16,x,y,z,gold);
   box(.18,.045,.17,x,5.465,z,gold);
  }
 }
 // Repeated pale rafter ends form a deep continuous bank beneath the rear
 // eave in P3600508. They are geometry, not a painted stripe or a new roof.
 for(let i=0;i<49;i++){
  const x=-7.92+i*.33;
  box(.12,.15,.51,x,8.32,-39.18,vermilion);
  box(.125,.15,.13,x,8.32,-39.39,gold);
 }
 // Photographed broad golden gutter and its bent downpipe. Model a U-shaped
 // trough (open top) and socket/bands; do not invent a buried drainage route.
 box(16.4,.055,.22,0,8.405,-39.45,gold);
 for(const z of [-39.56,-39.34])box(16.4,.14,.035,0,8.455,z,gold);
 const drainX=-2.25;
 pipe([drainX,8.405,-39.45],[drainX,7.77,-39.45],.065,gold);
 pipe([drainX,7.77,-39.45],[drainX,7.43,-38.88],.065,gold);
 pipe([drainX,7.43,-38.88],[drainX,4.42,-38.88],.065,gold);
 for(const y of [4.72,6.0,7.2]){
  box(.21,.06,.19,drainX,y,-38.88,dark);
  box(.20,.045,.53,drainX,y,-38.58,gold);
 }
 // Rear photo shows dark protective-net support cables against the white
 // upper wall, including visibly sagging vertical ties. No opaque wall or
 // invented window grid is added; the fine mesh itself remains unmodeled.
 for(const y of [6.90,7.84])pipe([-5.95,y,-38.34],[5.95,y,-38.34],.012,dark);
 for(let bay=0;bay<5;bay++){
  const x=-4.8+bay*2.4;
  for(let i=0;i<12;i++){
   const at=t=>[x+.25*Math.sin(Math.PI*t),8.27-1.36*t,-38.35-.08*Math.sin(Math.PI*t)];
   pipe(at(i/12),at((i+1)/12),.012,dark);
  }
 }
 for(const [mat,gs]of parts){const geometry=mergeGeometries(gs);gs.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.name=NAME+' material batch';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:true,revision:'R96',sideVerandaReturns:2,sidePosts:12,rearRafterEnds:49,gutterRuns:1,downpipes:1,netSupportTies:5,materialBatches:parts.size,solids,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),uv:'Box face UVs and cylinder radial UVs; existing materials reused, no new textures',terrainChanged:false,collidersAdded:0,walkingClearance:'All additions inside existing Honden outer tamagaki; side rails inside podium. Existing sacred-enclosure collider remains authoritative.',bounds:HONDEN_R96_ENVELOPE,source:'https://fushimiinari-guide.com/wp-content/uploads/P3600508_20190331.jpg',limits:'Photographed categories; dimensions, count and source-frame placement inferred. Side return symmetry inferred. No surveyed reconstruction or new public access.'};
 scene.add(group);return group.userData;
}
