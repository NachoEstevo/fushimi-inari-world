import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

// June 2012 Street View Pz3bmbgFMiX2Wz6UnoH4lA: rubble banks flank
// the twin tunnel exit. Endpoints and heights are photo-inferred, not surveyed.
export const okushaExitBanks=[[[240.8,64.3],[249.7,64.3]],[[240.8,72.5],[247.5,72.7]]];
export function buildOkushaExitFlanks(root,materials,ground,network,colliders){
 if(root.getObjectByName('Okusha twin exit rubble banks'))return null;
 const group=new THREE.Group();group.name='Okusha twin exit rubble banks';
 const parts=staticParts(group),stone=materials.entryStoneMat,dark=materials.stoneMat,leaf=new THREE.MeshStandardMaterial({color:'#536a42',roughness:1});
 let sections=0,cobbles=0,bankGrowth=0;
 const clear=(x,z)=>!(network.segments??[]).some(s=>{
  const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t)<s.width/2+.75;
 });
 for(const [bankIndex,[a,b]] of okushaExitBanks.entries()){
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(length/.65),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
   if(!clear(x,z))continue;
   const seat=ground(x,z),base=Math.min(seat,ground(x-.32,z-.34),ground(x+.32,z+.34))-.12;
   if(!Number.isFinite(base))continue;
   const top=seat+.88,span=length/count;
   parts.put(new THREE.BoxGeometry(span+.02,top-base,.50).rotateY(yaw).translate(x,(base+top)/2,z),dark);
   for(let row=0;row<3;row++)for(const side of [-1,1]){
    const g=new THREE.IcosahedronGeometry(1,0);g.scale(span*.55,.17+((i+row)%3)*.015,.13);g.rotateZ(((i*7+row)%5-2)*.055);g.rotateY(yaw);
    g.translate(x,seat+.14+row*.28,z+side*.24);parts.put(g,stone);cobbles++;
   }
   // The inspected June2012 exit photograph shows growth spilling over the
   // LEFT/north rubble bank. Keep these anonymous sprigs on that existing
   // bank only, outside the public corridor; no new planted parcel or tree.
   if(bankIndex===0&&i%3===1){
    const px=x,pz=z-.12,baseY=top-.08;
    if(clear(px,pz)){
     const stem=new THREE.CylinderGeometry(.012,.020,.48,5).translate(px,baseY+.24,pz);parts.put(stem,dark);
     for(let n=0;n<5;n++){
      const side=n%2?1:-1,geometry=new THREE.OctahedronGeometry(1,0);
      geometry.scale(.10,.035,.21);geometry.rotateZ(side*.4);geometry.rotateY(side*.65+n*.23);
      geometry.translate(px+side*.095,baseY+.15+n*.075,pz-.035*n);parts.put(geometry,leaf);
     }
     bankGrowth++;
    }
   }
   colliders.push({type:'box',args:[x,z,span/2,.35,yaw,base,top,'okusha_exit_bank']});sections++;
  }
 }
 const stats=parts.flush();group.userData={provenance:'June2012 Street View Pz3bmbgFMiX2Wz6UnoH4lA, inspected outputs/okusha-complete-route/streetview-exit.png: rubble retaining bank and leafy growth on north/left upper edge. Inferred endpoints/heights and plant size/count/species. Existing ground and public path clearances retained.',sections,cobbles,bankGrowth,inferred:'Anonymous upper-bank sprigs interpret visible vegetation only; no species, current condition, new tree, structure, planted parcel or walkable surface claim.'};root.add(group);
 return {sections,cobbles,bankGrowth,...stats};
}
