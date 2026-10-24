import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {okushaArchitecturePlan} from './okusha-architecture.mjs';

export const okushaDetailSourcesR101=Object.freeze([
  'https://inari.jp/en/wp-content/uploads/2016/09/okusyahouhaisyo-1.jpg',
  'https://fushimiinari-guide.com/wp-content/uploads/DSC_0616-2_20190205.jpg',
  'https://fushimiinari-guide.com/wp-content/uploads/P3620366_20190503.jpg',
]);

/** After R96 and before static batching. Add attached architectural fittings only.
 * No terrain, paving, interaction, existing geometry or collision mutation.
 */
export function buildOkushaDetailsR101(root,features,anchor,materials){
  if(root.children.some(o=>o.userData.okushaDetailsR101))return null;
  const plan=okushaArchitecturePlan(features,anchor?.target?.[1]);
  const hall=root.children.find(o=>o.userData.okushaArchitecture===88);
  const reception=root.children.find(o=>o.name==='Okusha gift and reception counter');
  const body=reception?.children.find(o=>o.isMesh&&o.geometry.parameters?.height===2.8);
  if(!plan||!hall||!body||!root.children.some(o=>o.userData.senbonRestR96))return null;
  const w=body.geometry.parameters.width,d=body.geometry.parameters.depth;
  if(![w,d].every(Number.isFinite)||w<2||d<2)return null;
  const group=new THREE.Group();group.name='Okusha attached gable, sanctuary lattice and reception lanterns R101';
  group.userData={okushaDetailsR101:true,sources:okushaDetailSourcesR101,
    provenance:'Observed fitting types and host facades; section sizes, lattice pitch and lantern stations estimated within existing mapped owners.'};
  const red=materials.vermilionMat;
  const dark=new THREE.MeshStandardMaterial({color:'#27332e',roughness:.85,metalness:.18});
  const gold=materials.goldMat;
  const worship=new THREE.Group();worship.name='Registered Okusha architectural fittings';
  worship.position.copy(hall.position);worship.rotation.copy(hall.rotation);group.add(worship);
  const p=staticParts(worship),cx=plan.width/2;
  // Suspended vermilion gable ornament: attached to the existing king post,
  // distinct from the lower shimenawa and R95 straw pendants.
  p.box(.105,.40,.09,cx,4.42,.23,red);
  for(const [x,y,r] of [[0,4.18,.13],[-.15,4.26,.09],[.15,4.26,.09]]){
    p.put(new THREE.CylinderGeometry(r,r,.075,10).rotateX(Math.PI/2).translate(cx+x,y,.25),red);
  }
  p.put(new THREE.CylinderGeometry(.065,.065,.085,6).rotateX(Math.PI/2).translate(cx,4.46,.28),gold);
  // 2019 frontal photograph clearly resolves a three-scroll ridge terminal.
  // Rings intersect their shared pedestal and the existing ridge (top 4.94).
  p.box(.28,.14,.16,cx,4.94,.24,dark);
  for(const [x,y,r] of [[-.19,5.035,.105],[0,5.105,.12],[.19,5.035,.105]]){
    p.put(new THREE.TorusGeometry(r,.027,5,12).translate(cx+x,y,.24),dark);
    p.beam([cx+x,4.97,.24],[cx+x,y-r+.02,.24],.027,dark,.027,6);
  }
  // Official oblique photo: dark upper sanctuary side bays behind red bars.
  // These sit on the existing opaque side walls, never create an interior or
  // extend the mapped footprint. Only the photographed forward bay is used.
  const bayDepth=Math.min(2.5,(plan.rear.front-plan.rear.back)*.65);
  const zc=plan.rear.front-.25-bayDepth/2;
  for(const side of [-1,1]){
    const wall=side<0?plan.rear.minX+.03:plan.rear.maxX-.03;
    p.box(.075,.86,bayDepth,wall,3.39,zc,dark);
    const face=wall+side*.055;
    for(const y of [2.96,3.39,3.82])p.box(.075,.075,bayDepth+.06,face,y,zc,red);
    const count=Math.ceil(bayDepth/.18);
    for(let i=0;i<=count;i++)p.box(.075,.86,.045,face,3.39,zc-bayDepth/2+i*bayDepth/count,red);
  }
  const hallStats=p.flush();
  const front=new THREE.Group();front.name='Reception suspended bronze lantern pair';
  front.position.copy(reception.position);front.rotation.copy(reception.rotation);group.add(front);
  const q=staticParts(front),z=-d/2-.42;
  // Counter photograph resolves two hanging lanterns. Hangers reach the
  // existing sloping roof at this exact local z, rather than floating below it.
  const roofY=4.15-1.10*Math.abs(z)/(d/2+.7);
  for(const x of [-w*.28,w*.28]){
    q.beam([x,roofY+.015,z],[x,2.64,z],.012,dark,.012,6);
    q.put(new THREE.CylinderGeometry(.15,.19,.075,6).translate(x,2.61,z),dark);
    q.box(.23,.28,.23,x,2.43,z,dark);
    for(const sx of [-1,1])for(const sz of [-1,1])q.box(.035,.31,.035,x+sx*.14,2.43,z+sz*.14,gold);
    // Raised perforation grid around an opaque shaded core; no emissive light.
    for(const sign of [-1,1])for(let i=0;i<4;i++){
      q.box(.29,.018,.018,x,2.32+i*.073,z+sign*.147,gold);
      q.box(.018,.018,.29,x+sign*.147,2.32+i*.073,z,gold);
    }
    q.put(new THREE.CylinderGeometry(.21,.14,.10,6).translate(x,2.235,z),dark);
    for(const sx of [-1,1])for(const sz of [-1,1])q.beam([x+sx*.09,2.21,z+sz*.09],[x+sx*.14,2.15,z+sz*.14],.024,dark,.018,6);
  }
  const receptionStats=q.flush();root.add(group);
  const stats={batches:hallStats.batches+receptionStats.batches,triangles:hallStats.triangles+receptionStats.triangles};
  group.userData.stats=stats;
  return {group,stats,lanterns:2,latticeBays:2,roofAttachmentY:roofY,plan};
}
