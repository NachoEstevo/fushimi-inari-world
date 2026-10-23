import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {yotsutsujiContextPlanR95} from './yotsutsuji-context-r95.mjs';

const NAME='Yotsutsuji sitting court and outlook context R96';
export function routeClearR96(x,z,radius,segments){
 return segments.every(s=>{
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],d=dx*dx+dz*dz;
  const t=d?Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/d)):0;
  return Math.hypot(x-s.a[0]-t*dx,z-s.a[2]-t*dz)>s.width/2+radius+.18;
 });
}

/** Photo-informed furniture and planting; actual route envelopes reject
 * candidates instead of moving routes or introducing walking floors. */
export function buildYotsutsujiContextR96(root,features,ground,surfaces){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const frames=yotsutsujiContextPlanR95(features);
 if(!root.getObjectByName('Yotsutsuji mapped tea houses')||!frames||!Array.isArray(surfaces?.segments)||!surfaces.segments.length)return {built:false,reason:'Existing owner and surface network required'};
 const group=new THREE.Group();group.name=NAME;const parts=staticParts(group);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.96});
 const wood=material('#635341'),red=material('#923c35'),cream=material('#c6bc96'),pale=material('#babdb1'),dark=material('#35443e'),green=material('#486344'),leaf=material('#687448'),stone=material('#827e70');
 const records=[],skipped=[];
 const safe=(label,x,z,r)=>{if(!routeClearR96(x,z,r,surfaces.segments)){skipped.push(label);return false;}return Number.isFinite(ground(x,z));};
 // These seats already own their footprint, floor and collision. Both 2013
 // references establish red sitting covers; their use here is inferred.
 for(const x of [797,803]){
  const z=-219.75,y=ground(x,z)+.10;if(!Number.isFinite(y))return {built:false,reason:'Invalid existing bench terrain'};
  parts.box(2.32,.026,.46,x,y+.493,z,red);
  records.push({kind:'existing-bench-pad',x,z,radius:0,base:y+.48});
 }
 const [main,annex]=frames;
 const framedBox=(frame,u,v,h,w,height,depth,m)=>{
  const p=frame.world(u,v,h),g=new THREE.BoxGeometry(w,height,depth);
  const a=frame.world(0,0,0),b=frame.world(1,0,0),yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]);
  g.rotateY(yaw).translate(...p);parts.put(g,m);
 };
 for(const u of [1.15,4.35]){
  const p=annex.world(u,.64,0),r=.70,label='annex sitting platform '+u;
  if(!safe(label,p[0],p[2],r))continue;
  const feet=[[-.43,-.29],[.43,-.29],[-.43,.29],[.43,.29]].map(([du,dv])=>annex.world(u+du,.64+dv,0));
  const base=Math.max(...feet.map(q=>ground(q[0],q[2])+.10));if(!Number.isFinite(base))continue;
  const h=base-annex.floor;
  framedBox(annex,u,.64,h+.43,1.08,.10,.82,wood);
  framedBox(annex,u,.64,h+.49,1.03,.026,.77,red);
  for(const q of feet){const bottom=ground(q[0],q[2])+.10;parts.box(.085,base+.38-bottom,.085,q[0],(base+.38+bottom)/2,q[2],wood);}
  framedBox(annex,u,.58,h+.78,.65,.055,.40,cream);
  for(const du of [-.24,.24])framedBox(annex,u+du,.58,h+.63,.055,.26,.055,wood);
  records.push({kind:'annex-platform-table',x:p[0],z:p[2],radius:r,base});
 }
 // Unlettered pale display cabinet with simplified colored inventory, seen
 // under main awning. No logos, fabricated shop names or readable labels.
 {
  const u=3.1,v=.40,p=main.world(u,v,0),r=.66;
  if(safe('main display cabinet',p[0],p[2],r)){
   const base=ground(p[0],p[2])+.10,h=base-main.floor;
   framedBox(main,u,v,h+.65,1.10,1.30,.48,pale);
   framedBox(main,u,v+.25,h+.70,.94,.95,.025,dark);
   for(const row of [0,1,2])for(let col=0;col<7;col++)framedBox(main,u-.39+col*.13,v+.272,h+.37+row*.29,.07,.19,.025,col%3===0?red:cream);
   for(const y of [.22,.53,.82,1.11])framedBox(main,u,v+.29,h+y,.98,.025,.028,pale);
   records.push({kind:'main-display-cabinet',x:p[0],z:p[2],radius:r,base});
  }
 }
 // Low bank clumps frame west descent; do not fill its city-view aperture.
 for(const [i,x,z,r] of [[0,787.8,-208.9,.43],[1,789.2,-209,.48],[2,790.7,-209,.42],[3,792.1,-209,.45],[4,784.4,-215,.68],[5,786,-215.5,.60]]){
  if(!safe('bank planting '+i,x,z,r*1.1))continue;
  const base=ground(x,z),height=i<4?.70:.90;
  const rock=new THREE.DodecahedronGeometry(r*.74,0);rock.scale(1,.68,.87).translate(x,base+.16,z);parts.put(rock,stone);
  for(let j=0;j<3;j++){
   const a=j*2.399+i,g=new THREE.IcosahedronGeometry(r*.72,1);
   g.scale(1,.73,1).translate(x+Math.cos(a)*r*.34,base+height*.65+j*.10,z+Math.sin(a)*r*.34);parts.put(g,j%2?leaf:green);
  }
  for(let j=0;j<7;j++){
   const a=j*Math.PI*2/7,tip=[x+Math.cos(a)*r,base+.38,z+Math.sin(a)*r];
   parts.beam([x,base+.08,z],tip,.013,leaf,.006,4);
   for(let k=1;k<4;k++){
    const t=k/4,c=[x+(tip[0]-x)*t,base+.08+.30*t,z+(tip[2]-z)*t],w=.11*(1-t*.5);
    parts.sheet([...c,c[0]+Math.sin(a)*w,c[1]+.025,c[2]-Math.cos(a)*w,...tip],green);
   }
  }
  records.push({kind:'bank-hedge-rock-fern',x,z,radius:r*1.1,base});
 }
 // Two lower-slope crowns flank the photographed westward aperture. Entire
 // crown envelopes, rather than just trunk radii, must clear mapped routes.
 for(const [x,z] of [[783.8,-207.3],[783.5,-218.2]]){
  const radius=1.55;if(!safe('outlook side tree',x,z,radius))continue;
  const base=ground(x,z);
  parts.beam([x,base-.08,z],[x+.22,base+3.1,z+.10],.15,wood,.075,7);
  for(let j=0;j<5;j++){
   const a=j*2.399,q=[x+Math.cos(a)*.75,base+3.1+(j%3)*.38,z+Math.sin(a)*.75];
   parts.beam([x+.17,base+2,z+.08],q,.065,wood,.022,5);
   const g=new THREE.IcosahedronGeometry(.78,1);g.scale(1,.72,1).translate(...q);parts.put(g,j%2?leaf:green);
  }
  records.push({kind:'outlook-side-tree',x,z,radius,base});
 }
 const stats=parts.flush();
 group.userData={built:true,stats,records,skipped,collidersAdded:0,terrainChanged:false,
  sources:['https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji13.jpg','https://zekkeikana.com/kyoto/fusimiku/fushimiinari/yotsutsuji14.jpg','https://cdn.japan-travel-note.com/images/00523/26.jpg'],
  limits:'2013 red sitting platforms, pale tables and beverage cabinet; downhill hedge, rocks, fern forms and flanking trees. Dimensions, counts, species and placement inferred. Existing benches decorated; route envelopes reject new furniture/planting. No skyline reconstruction.'};
 root.add(group);return group.userData;
}
