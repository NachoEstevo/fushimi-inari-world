import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {okushaArchitecturePlan} from './okusha-architecture.mjs';

export function buildSenbonRestR95(root,features,anchor,materials){
  if(root.children.some(g=>g.userData.senbonRestR95))return null;
  const reception=root.children.find(g=>g.name==='Okusha gift and reception counter');
  const body=reception?.children.find(c=>c.isMesh&&c.geometry.parameters?.height===2.8);
  const hall=okushaArchitecturePlan(features,anchor.target[1]);
  if(!body||!hall)return null;
  const w=body.geometry.parameters.width,d=body.geometry.parameters.depth;
  const oldShutters=reception.children.filter(c=>c.isMesh&&c.geometry.parameters?.height===1.7&&c.geometry.parameters?.depth===.06);
  if(oldShutters.length!==4)return null;
  const group=new THREE.Group();group.name='Okusha source-supported frontage and worship fittings R95';
  group.userData={senbonRestR95:true,source:'User court stills 69a82189 / 3ee9aa06, inspected 2026-10-23',dimensions:'OSM footprint; facade bay distribution and heights estimated'};
  const front=new THREE.Group();front.position.copy(reception.position);front.rotation.copy(reception.rotation);group.add(front);
  const p=staticParts(front),wood=new THREE.MeshStandardMaterial({color:'#40382e',roughness:.94}),shutter=new THREE.MeshStandardMaterial({color:'#867158',roughness:.96}),
    pane=new THREE.MeshStandardMaterial({color:'#404c49',roughness:.46}),cloth=new THREE.MeshStandardMaterial({color:'#dad8ce',roughness:1}),edge=new THREE.MeshStandardMaterial({color:'#353b39',roughness:.84});
  // Replace only recognized repetitive reception panels/slats. The mapped toilet
  // building and its opaque envelope/collision remain under their own owner.
  const removal=reception.children.filter(c=>{
    const g=c.geometry?.parameters;return g&&((g.height===1.7&&g.depth===.06)||(g.height===.025&&g.depth===.07)||(g.height===.38&&g.depth===.08));
  });
  for(const c of removal)c.removeFromParent();
  const z=-d/2-.10,bay=w/4;
  for(let i=0;i<4;i++){
    const x=-w/2+(i+.5)*bay,bw=bay-.18;
    if(i<2){
      p.box(bw,1.66,.07,x,1.8,z,shutter);
      for(let j=0;j<16;j++)p.box(bw,.026,.09,x,1.04+j*.10,z-.04,wood);
    }else{
      // Opaque shaded panes keep the existing unsurveyed interior unexposed.
      p.box(bw,1.66,.07,x,1.8,z,pane);
      for(let j=0;j<=4;j++)p.box(.045,1.70,.10,x-bw/2+j*bw/4,1.8,z-.04,wood);
      for(let j=0;j<=3;j++)p.box(bw,.045,.10,x,.97+j*.55,z-.04,wood);
    }
    p.box(bw,.09,.15,x,.97,z-.03,wood);
  }
  // Source shows one long light upper cloth under the black eave, interrupted
  // by dark uprights. No text, emblems or inferred commercial signage added.
  p.box(w-.16,.42,.055,0,2.78,z-.015,cloth);
  for(let i=1;i<12;i++)p.box(.028,.44,.035,-w/2+i*w/12,2.77,z-.05,materials.plasterMat);
  p.box(w+.94,.19,.14,0,2.99,-d/2-.66,edge);
  // The screenshot's roof is visibly coursed rather than an unbroken plane.
  // Courses follow the exact current roof slope, below the existing ridge cap.
  for(const side of [-1,1])for(let i=1;i<15;i++){
    const t=i/15,rz=side*(d/2+.7)*t,ry=4.15-1.10*t;
    p.box(w+.98,.024,.045,0,ry+.012,rz,edge);
  }
  const frontStats=p.flush();
  const fitting=new THREE.Group();fitting.position.set(...hall.origin);fitting.rotation.y=hall.yaw;group.add(fitting);
  const q=staticParts(fitting),straw=new THREE.MeshStandardMaterial({color:'#ad9367',roughness:1});
  // Long straw pendants are plainly visible below the pavilion's shimenawa.
  // Keep the central walking opening and the previously registered hall intact.
  for(const fraction of [.34,.50,.66]){
    const x=hall.width*fraction;
    q.beam([x,2.98,.08],[x,2.26,.08],.045,straw,.035,8);
    for(let i=0;i<11;i++){
      const angle=i*Math.PI*2/11,r=.10;
      q.beam([x,2.50,.08],[x+Math.sin(angle)*r,2.07+(i%3)*.025,.08+Math.cos(angle)*r],.011,straw,.005,5);
    }
  }
  const fittingStats=q.flush();root.add(group);
  return {group,receptionReplaced:removal.length,frontage:frontStats,worshipFittings:fittingStats,features:4};
}
