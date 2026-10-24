import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {romonWingDimensions as D} from './romon-wings-layout.mjs';
import {centralRoofR95} from './romon-gehaiden-roofs-r95.mjs';
const NAME='Entrance architectural equipment R101';
const APARTMENT='Photo-registered north entrance apartment R96';
const ID='way/305214938';
function parts(name){
 const group=new THREE.Group();group.name=name;const batches=new Map();
 const add=(g,m)=>{if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);};
 const box=(w,h,d,x,y,z,m,yaw=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),m);
 const beam=(a,b,w,d,m)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av),g=new THREE.BoxGeometry(w,v.length(),d);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()));add(g.translate(...av.add(bv).multiplyScalar(.5).toArray()),m);};
 const finish=()=>{for(const [m,gs]of batches){const geometry=mergeGeometries(gs);gs.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}return group;};
 return {group,add,box,beam,finish};
}

// Observed equipment on two existing architectures, not new footprints or an
// entrance re-author. Attach to actual registered owners before static batching.
export function buildEntranceDetailsR101(root,features){
 if(root.userData.entranceDetailsR101?.built)return root.userData.entranceDetailsR101;
 const apartment=root.getObjectByName(APARTMENT),feature=features.buildings?.find(b=>b.id===ID),romons=[];
 root.traverse(o=>{if(o.userData.romonWingDetail?.reconstructed&&o.userData.romonPrecinctR96?.built&&o.getObjectByName('Romon Kairo facade refinement'))romons.push(o);});
 if(!apartment?.userData.built||apartment.userData.sourceId!==ID||!feature||romons.length!==1)return {built:false,builtIds:[],reason:'unique-Romon-R71-R96-and-apartment-R96-owners-required'};
 const data=apartment.userData,points=data.footprint;
 if(!Number.isFinite(data.floor)||data.overallHeight!==9||!Array.isArray(points)||points.length!==4||!Array.isArray(feature.points)||feature.points.length!==5||!feature.points.every(p=>Array.isArray(p)&&p.length>=3&&p.every(Number.isFinite))||!points.every((p,i)=>Array.isArray(p)&&p.length>=3&&p.every(Number.isFinite)&&Math.hypot(p[0]-feature.points[i][0],p[2]-feature.points[i][2])<.001))return {built:false,builtIds:[],reason:'registered-apartment-envelope-required'};
 const south=Array.isArray(data.facades)?data.facades.find(f=>f.edge===1&&f.publicFacing==='south avenue'):null;
 if(!south||south.bays!==6||south.recessDepth!==.64)return {built:false,builtIds:[],reason:'registered-south-frontage-required'};
 const romon=romons[0],s=centralRoofR95.romon;
 if(!romon.userData.centralRoofR95?.built||romon.userData.centralRoofR95?.pediments!==2)return {built:false,builtIds:[],reason:'R95-central-roof-required'};
 const pale=new THREE.MeshStandardMaterial({color:'#b9b8aa',roughness:.86}),metal=new THREE.MeshStandardMaterial({color:'#353a35',roughness:.62,metalness:.34}),red=new THREE.MeshStandardMaterial({color:'#a32b21',roughness:.61,metalness:.12});
 const a=points[1],b=points[2],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length,yaw=-Math.atan2(dz,dx),at=(u,v)=>[a[0]+ux*u+uz*v,a[2]+uz*u-ux*v],apt=parts(NAME+' / apartment services'),units=[];
 const wallBox=(w,h,d,u,y,v,m)=>{const [x,z]=at(u,v);apt.box(w,h,d,x,data.floor+y,z,m,yaw);};
 // k01111: three pale wall-mounted units below the south balcony fascia,
 // above the hedge. Stations and mechanical dimensions are estimates.
 for(const ratio of [.18,.39,.57]){const u=ratio*length,mid=2.45;
  wallBox(.76,.55,.31,u,mid,-.205,pale);
  wallBox(.63,.42,.017,u,mid,-.368,metal);
  for(let j=0;j<8;j++)wallBox(.63,.022,.022,u,mid-.18+j*.052,-.38,pale);
  for(const du of [-.27,.27]){wallBox(.035,.10,.40,u+du,mid-.30,-.18,metal);wallBox(.035,.28,.035,u+du,mid-.25,-.015,metal);}
  wallBox(.04,.66,.04,u+.40,2.08,-.035,pale);
  const start=at(u+.40,-.035),end=at(u+.28,-.22);apt.beam([start[0],data.floor+2.41,start[1]],[end[0],data.floor+2.41,end[1]],.035,.035,pale);
  units.push({edge:1,station:u,relativeStation:ratio,mid:data.floor+mid,bottom:data.floor+mid-.275,projection:.391});
 }
 const tower=parts(NAME+' / Romon fittings'),rails=[];
 // IMG6487/6491: a dark suspended fitting rail is visible beneath both long
 // upper eaves. Preserve the roof envelope; no banner or lettering is inferred.
 for(const side of [-1,1]){const z=side*(s.halfWidth+.10),y=s.base-.46;
  tower.box(2*(s.halfLength-.40),.065,.065,0,y,z,metal);
  for(const x of [-6.4,-2.1,2.1,6.4])tower.beam([x,s.base-.10,side*(s.halfWidth-.24)],[x,y,z],.035,.045,metal);
  for(let i=0;i<8;i++){const x=-6.30+i*1.80;const ring=new THREE.TorusGeometry(.057,.009,4,8);tower.add(ring.translate(x,y-.095,z),metal);}
  for(const x of [-s.halfLength+.4,s.halfLength-.4])tower.box(.035,.20,.065,x,y-.067,z,metal);
  rails.push({side,z,level:y,length:2*(s.halfLength-.4),rings:8});
 }
 // IMG6485: one red bottle stands inside the north gallery at its outer end.
 // Keep it behind the existing pale rail, within the closed Kairo collider.
 const ex=-18.05,ez=-1.55,base=D.floor;
 tower.add(new THREE.CylinderGeometry(.082,.095,.47,12).translate(ex,base+.235,ez),red);
 tower.add(new THREE.SphereGeometry(.082,10,5,0,Math.PI*2,0,Math.PI/2).translate(ex,base+.47,ez),red);
 tower.box(.13,.035,.045,ex+.035,base+.55,ez,metal);tower.box(.07,.045,.07,ex,base+.505,ez,metal);
 tower.beam([ex+.07,base+.52,ez],[ex+.12,base+.10,ez],.018,.018,metal);
 tower.add(new THREE.CylinderGeometry(.097,.097,.035,12).translate(ex,base+.0175,ez),metal);
 tower.box(.11,.16,.012,ex,base+.31,ez-.092,pale);
 const aptGroup=apt.finish(),romonGroup=tower.finish();aptGroup.userData={sourceOwner:ID,source:'https://townphoto.net/kyoto/k01/k01111.jpg',units};romonGroup.userData={sourceOwner:'Romon R71/R95/R96 source frame',rails,extinguisher:{center:[ex,base+.30,ez],base,behindRail:true},source:['https://fushimiinari-guide.com/wp-content/uploads/IMG_6485_20210317.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6487_20210317.jpg','https://fushimiinari-guide.com/wp-content/uploads/IMG_6491_20210317.jpg']};
 apartment.add(aptGroup);romon.add(romonGroup);
 const groups=[aptGroup,romonGroup],report={built:true,builtIds:[],revision:'R101',families:3,condenserUnits:units.length,upperEaveRails:rails.length,hangingRings:16,extinguishers:1,materialBatches:groups.reduce((n,g)=>n+g.children.length,0),triangles:groups.reduce((n,g)=>n+g.children.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0),0),units,rails,collidersAdded:0,walkingChanged:false,terrainChanged:false,sourceGeometryChanged:false,sourceYears:[2016,2021],registration:'Apartment south edge inherited R96 mapped facade; Romon upper eave and north Kairo inherited R71/R95 source frame.',limits:'Equipment categories observed; stations, unit sizes, bracket/pipe details, rail length and ring count inferred. No logos, readable labels, remote services, mirrored extinguisher, hidden facade equipment, red pail, temporary festival flags, new route or surveyed/current-condition claim.'};
 root.userData.entranceDetailsR101=report;return report;
}
