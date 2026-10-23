import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {removeSourceBoxes} from './source-component-boxes.mjs';
import {refineCentralIrimoyaR95} from './romon-gehaiden-roofs-r95.mjs';

const evidence='Photo 09_romon_day_front.jpg / 10_gehaiden.jpg; https://fushimiinari-guide.com/gehaiden/ and IMG_7366_20210324.jpg inspected. Existing source-frame dimensions retained; joinery, reed pitch and lantern dimensions inferred.';
const tag=(mesh,name)=>`${mesh.name} ${mesh.material?.name}`.includes(name);


function batches(){
 const group=new THREE.Group(),parts=new Map();
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!parts.has(m))parts.set(m,[]);parts.get(m).push(g);};
 const box=(w,h,d,x,y,z,m,yaw=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);
 const finish=()=>{for(const [m,gs]of parts){const geo=mergeGeometries(gs);gs.forEach(g=>g.dispose());geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,m);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}return group;};
 return {group,add,box,finish};
}

export function refineRomonGehaidenR95(scene,zone,materials={}){
 if(!['romon','gehaiden'].includes(zone))return {built:false,reason:'Unsupported zone'};
 if(scene.userData.romonGehaidenR95)return scene.userData.romonGehaidenR95;
 const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#b83b24',roughness:.64});
 const gold=materials.goldMat??new THREE.MeshStandardMaterial({color:'#b39758',metalness:.6,roughness:.45});
 const dark=new THREE.MeshStandardMaterial({color:'#292c26',metalness:.36,roughness:.74});
 const pale=new THREE.MeshStandardMaterial({color:'#dcd7bc',roughness:1,side:THREE.DoubleSide});
 const b=batches(),{box,add}=b;let removedSlabs=0,lanterns=0,panels=0;
 if(zone==='romon'){
  const redMesh=meshes.find(m=>tag(m,'Vermilion_ShuIro')),goldMesh=meshes.find(m=>tag(m,'Gold_Kanagu_Leaf'));
  if(!redMesh||!goldMesh)return {built:false,reason:'Original Romon material meshes required'};
  const repairs=[[redMesh,removeSourceBoxes(redMesh,[6.65,6.90,7.14].map(y=>({size:[12.08,.09,6.88],center:[0,y,0]})))],[goldMesh,removeSourceBoxes(goldMesh,[{size:[12.14,.07,6.94],center:[0,7.21,0]}])]];
  removedSlabs=repairs.reduce((n,[,r])=>n+r.count,0);
  if(removedSlabs!==4){repairs.forEach(([,r])=>r.geometry.dispose());return {built:false,reason:'Romon balcony source signature changed',removedSlabs};}
  for(const [m,r]of repairs)m.geometry=r.geometry;
  // Three open perimeter rails. Existing balusters and deck remain the owners.
  for(const y of [6.65,6.90,7.14]){
   for(const z of [-3.44,3.44])box(12.08,.09,.09,0,y,z,red);
   for(const x of [-6.04,6.04])box(.09,.09,6.88,x,y,0,red);
  }
  // Photo shows discrete fittings rather than a continuous gold ceiling slab.
  for(const x of [-5.98,-4,-2,0,2,4,5.98])for(const z of [-3.49,3.49])box(.19,.13,.035,x,7.14,z,gold);
  // Upper-storey exposed timber subdivides the previously uninterrupted white
  // block. Ends register on its retained faces, not on a new building shell.
  for(const z of [-2.43,2.43])for(const x of [-4.8,-3.2,-1.6,0,1.6,3.2,4.8])box(.15,2.83,.11,x,8.15,z,red);
  for(const x of [-4.93,4.93])for(const z of [-1.5,0,1.5])box(.11,2.83,.15,x,8.15,z,red);
 }else{
  const blinds=meshes.filter(m=>tag(m,'Sudare_Bamboo_Blind')),bronze=meshes.filter(m=>tag(m,'Dark_Bronze_Kitsune')),glow=meshes.filter(m=>tag(m,'Lantern_Warm_Glow')),white=meshes.find(m=>tag(m,'White_Shikku_Plaster'));
  if(blinds.length!==1||bronze.length!==1||glow.length!==1||!white)return {built:false,reason:'Original Gehaiden blind and lantern mesh signature required'};
  const count=m=>(m.geometry.index?.count??m.geometry.attributes.position.count)/3;
  if(count(blinds[0])!==1728||count(bronze[0])!==2256||count(glow[0])!==240||count(white)!==11340)return {built:false,reason:'Gehaiden production triangle signature changed'};
  // The original exclusive blind/lantern materials own no other building
  // geometry. White ribbons/shide occupy y 4.205..5.46; plaster starts 5.475.
  const source=white.geometry,p=source.attributes.position,index=source.index,retained=[];let removedWhite=0;
  for(let i=0;i<(index?.count??p.count);i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);if(ids.every(k=>p.getY(k)<5.47&&p.getY(k)>4.19))removedWhite++;else retained.push(...ids);}
  if(removedWhite!==11232)return {built:false,reason:'Original Gehaiden ribbon signature missing',removedWhite};
  const geometry=source.clone();geometry.setIndex(retained);geometry.computeBoundingBox();geometry.computeBoundingSphere();white.geometry=geometry;
  [...blinds,...bronze,...glow].forEach(m=>m.removeFromParent());
  // Subdivide the white upper band with the two-tier exposed timber pictured
  // above the blinds. Retain its original corners, columns and beam envelopes.
  for(const z of [-15.675,-9.325]){
   box(10.0,.13,.10,0,6.12,z,red);
   for(const x of [-5,-3,-1,1,3,5])box(.15,1.34,.10,x,6.15,z,red);
  }
  for(const x of [-5,5]){box(.10,.13,6.35,x,6.12,-12.5,red);for(const z of [-15.65,-13.55,-11.45,-9.35])box(.10,1.34,.15,x,6.15,z,red);}
  const bamboo=new THREE.MeshStandardMaterial({color:'#9b743e',roughness:.96}),tape=new THREE.MeshStandardMaterial({color:'#a9a69b',roughness:1});
  const panel=(cx,cz,width,yaw)=>{
   const put=(w,h,d,u,y,v,m)=>{const x=cx+Math.cos(yaw)*u+Math.sin(yaw)*v,z=cz-Math.sin(yaw)*u+Math.cos(yaw)*v;box(w,h,d,x,y,z,m,yaw);};
   // Actual gaps between reeds; all panels terminate at the source blind hem.
   for(let j=0;j<47;j++)put(width,.020,.022,0,4.22+j*.025,0,bamboo);
   put(width,.11,.035,0,5.365,0,tape);put(width,.042,.05,0,4.205,0,dark);
   for(const u of [-.62,-.22,.22,.62]){
    put(.055,1.18,.032,u,4.8,.024,tape);
    // Small alternating pale woven chevrons instead of solid plaster boards.
    for(let j=0;j<8;j++)put(.034,.034,.006,u,4.29+j*.14,.044,pale);
   }
   // Three physical folded paper strips suspended from a continuous cord.
   put(width,.022,.025,0,5.49,.09,pale);
   for(const u of [-width*.32,0,width*.32]){
    for(let j=0;j<4;j++){
     const g=new THREE.PlaneGeometry(.11,.115);g.rotateZ((j%2?1:-1)*.55);g.rotateY(yaw);g.translate(cx+Math.cos(yaw)*(u+(j%2?.028:-.028))+Math.sin(yaw)*.10,5.40-j*.075,cz-Math.sin(yaw)*(u+(j%2?.028:-.028))+Math.cos(yaw)*.10);add(g,pale);
    }
   }
   panels++;
  };
  for(let i=0;i<5;i++)for(const z of [-15.68,-9.32])panel(-4+i*2,z,1.82,z<-12.5?Math.PI:0);
  for(let i=0;i<3;i++)for(const x of [-4.98,4.98])panel(x,-12.5+(-2.13+i*2.13),1.92,x<0?-Math.PI/2:Math.PI/2);
  // Source guide resolves 4 west + 2 south + 4 east + 2 north. Positions
  // follow the existing building frame; only distribution is source-supported.
  const lantern=(x,z)=>{
   box(.018,1.05,.018,x,6.10,z,dark);box(.43,.055,.43,x,5.55,z,dark);box(.30,.055,.30,x,5.12,z,dark);
   const roof=new THREE.ConeGeometry(.34,.13,4).rotateY(Math.PI/4).translate(x,5.63,z);add(roof,dark);
   for(const dx of [-.145,.145])for(const dz of [-.145,.145])box(.026,.39,.026,x+dx,5.335,z+dz,dark);
   // Pierced lattice faces have real holes, no emitting solid paper cylinder.
   for(const side of [-1,1])for(let k=0;k<5;k++){
    box(.014,.34,.014,x-.112+k*.056,5.335,z+side*.15,dark);box(.014,.014,.30,x+side*.15,5.20+k*.067,z,dark);
    box(.30,.014,.014,x,5.20+k*.067,z+side*.15,dark);box(.014,.34,.014,x+side*.15,5.335,z-.112+k*.056,dark);
   }
   lanterns++;
  };
  for(const z of [-16.15,-8.85])for(const x of [-4.2,-1.4,1.4,4.2])lantern(x,z);
  for(const x of [-5.55,5.55])for(const z of [-14.15,-10.85])lantern(x,z);
 }
 const roofRepair=refineCentralIrimoyaR95(scene,zone,materials);
 const group=b.finish();group.name=`${zone} source-referenced architectural completion R95`;scene.add(group);
 const triangles=group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);
 const record={built:true,zone,removedSlabs,lanterns,blindPanels:panels,materialBatches:group.children.length,triangles,roofRepair,anchorUnchanged:true,collidersAdded:0,sourceFrame:true,provenance:evidence,limits:'No surveyed dimensional exactness; zodiac figurative cutouts unresolved. Existing podium, roof footprint/apex, gallery wings, outer fence and public circulation retained. Browser visual acceptance pending.'};
 scene.userData.romonGehaidenR95=record;return record;
}
