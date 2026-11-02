import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {appendOmamoriPouch,appendEmaTablet} from './heritage-goods.mjs';

// The official shrine catalogue documents cloth amulets. Arrangement and
// dimensions here are inferred; they are not a current stock/pricing claim.
export function buildReceptionCounterGoods(host,{wood,paper,cloth,levels}){
 const group=new THREE.Group();group.name='Reception amulets and votive tablets';host.add(group);
 const parts=staticParts(group);let pouches=0,tablets=0;
 for(const [start,end,z]of [[.65,10.9,11.69],[12.3,28.6,7.84]]){
  for(let x=start+.35;x<end;x+=1.7){
   if(z>10&&x+.32>1.4&&x-.32<3.1)continue;
   const y=1.2575+(x>levels.split+.1?levels.rise:0);
   for(const offset of [-.19,0,.19]){
    const position=[x+offset,y,z+.17];
    if((pouches+tablets)%3===0){appendEmaTablet(parts,{position,yaw:.06,width:.13,height:.15,depth:.014,wood,cord:paper});tablets++;}
    else{appendOmamoriPouch(parts,{position,yaw:offset*.3,width:.12,height:.17,depth:.055,body:cloth,cord:paper});pouches++;}
   }
  }
 }
 const stats={...parts.flush(),pouches,tablets,extraLights:0};group.userData={...stats,reference:'https://inari.jp/grace/omamori/',placement:'Inferred display on existing service counters'};return stats;
}
