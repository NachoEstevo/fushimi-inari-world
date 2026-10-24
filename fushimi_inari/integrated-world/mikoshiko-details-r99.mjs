import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {MIKOSHIKO_ID,mikoshikoLayout} from './mikoshiko-precinct.mjs';
const NAME='Mikoshiko north shutters and west eave details R99';
const close=(a,b)=>Math.abs(a-b)<1e-5;
/** Source2021 short face front/long west doors right identifies north (-V).
 * Gate12822895657 northeast of north wall and Shinsenjo atZ21+ corroborate it.
 * Call after R93 owner, before global static batching. No wall/door/fence edit.
 */
export function buildMikoshikoDetailsR99(root,features){
 const owner=root.getObjectByName('Mikoshiko precinct R93'),plan=mikoshikoLayout(features);
 if(!owner||!plan||!owner.userData.built||!owner.userData.builtIds?.includes(MIKOSHIKO_ID))return{built:false,reason:'Built mapped R93 Mikoshiko owner required'};
 const previous=owner.getObjectByName(NAME);if(previous)return previous.userData;
 const [x,z]=plan.center,w=plan.width,d=plan.depth;
 if(!close(owner.position.x,x)||!close(owner.position.z,z)||!close(owner.rotation.y,plan.yaw)||!close(owner.position.y,owner.userData.floor)||!close(owner.userData.width,w)||!close(owner.userData.depth,d)||owner.scale.toArray().some(v=>!close(v,1)))return{built:false,reason:'Unchanged mapped R93 transform required'};
 // Borrow only exact palette signatures inside this positively identified owner.
 const material=hex=>owner.children.find(o=>o.isMesh&&o.material?.color?.getHexString()===hex)?.material;
 const white=material('e4e0d3'),dark=material('242923'),timber=material('827b62');
 if(!white||!dark||!timber)return{built:false,reason:'Original R93 white/dark/timber palette required before batching'};
 const group=new THREE.Group();group.name=NAME;const parts=staticParts(group),v=-d/2,shutter={shortEnd:-1,center:[0,3.45,v-.10],width:1.22,height:1.07},hood={width:1.84,projection:.38,top:4.155},brackets=[],uprights=[],roofContacts=[];
 // Two closed white high leaves, fixed exterior relief over the existing wall.
 parts.box(1.34,1.19,.045,0,3.45,v-.062,white);
 for(const side of [-1,1]){const u=side*.3075;parts.box(.605,1.07,.055,u,3.45,v-.105,white);for(const y of [3.17,3.73]){parts.box(.11,.035,.022,side*.557,y,v-.148,dark);parts.beam([side*.615,y-.032,v-.15],[side*.615,y+.032,v-.15],.014,dark,.014,6);}parts.box(.022,.21,.016,side*.34,3.43,v-.15,dark);}
 // The narrow dark center seam is actual shutter joinery, not an open window.
 parts.box(.014,1.055,.012,0,3.45,v-.139,dark);
 for(const u of [-.73,.73]){parts.box(.10,.24,.10,u,3.865,v-.13,white);parts.beam([u,3.76,v-.075],[u,4.02,v-.33],.038,white,.038,6);}
 const hoodPosition=(u,t)=>[u,4.11-t*.105,v-.06-t*.38];
 parts.sheet([...hoodPosition(-.92,0),...hoodPosition(.92,0),...hoodPosition(-.92,1),...hoodPosition(-.92,1),...hoodPosition(.92,0),...hoodPosition(.92,1)],dark);
 parts.box(1.87,.055,.065,0,3.995,v-.44,dark);
 for(let i=0;i<=10;i++){const u=-.90+i*.18;parts.beam(hoodPosition(u,0),hoodPosition(u,1),.022,dark,.022,6);}
 // West gutter: open three-sided shallow channel beneath existing eave.
 const gu=-w/2-.52,gy=4.535,gl=d+1.10;
 parts.box(.135,.025,gl,gu,gy,0,dark);parts.box(.025,.11,gl,gu-.064,gy+.045,0,dark);parts.box(.025,.085,gl,gu+.064,gy+.032,0,dark);
 // One photographed north-end return/downpipe, no speculative other corners.
 const pipeU=-w/2-.24,pipeV=v-.29;
 parts.beam([gu,gy,v-.29],[pipeU,4.31,pipeV],.041,dark,.041,8);
 parts.beam([pipeU,4.31,pipeV],[pipeU,.34,pipeV],.041,dark,.041,8);
 for(const y of [.78,2.25,3.8])parts.box(.14,.035,.07,pipeU,y,pipeV+.006,dark);
 // Source white eave beam ends and brown upright reveals follow existing bays.
 const bay=(d-2.1)/4;
 for(let i=0;i<4;i++){const zz=-d/2+1.05+(d-2.1)*(i+.5)/4,jamb=zz-bay/2;
  parts.box(.29,.15,.16,-w/2-.18,4.055,jamb,white);parts.box(.46,.10,.12,-w/2-.30,4.205,jamb,white);
  // Engage the actual original R93 eave beam (underside4.475) rather than
  // leaving the bracket head below an air gap. Upper15mm overlaps receiver.
  parts.box(.08,.29,.12,-w/2-.505,4.345,jamb,white);roofContacts.push({u:-w/2-.505,v:jamb,bottom:4.20,top:4.49,receiverBottom:4.475});
  parts.beam([-w/2-.12,3.99,jamb],[-w/2-.49,4.20,jamb],.033,white,.033,6);
  // Thin contiguous reveals strengthen existing jamb/lintel rather than adding
  // a duplicate full post or a new freestanding arcade.
  parts.box(.055,3.62,.14,-w/2-.245,2.125,jamb,timber);parts.box(.06,.09,bay-.12,-w/2-.257,3.99,zz,timber);
  brackets.push({point:[-w/2-.30,4.205,jamb]});uprights.push({point:[-w/2-.245,2.125,jamb]});
 }
 const stats=parts.flush();group.userData={built:true,revision:'R99',sourceFeature:MIKOSHIKO_ID,shortEnd:-1,shutter,hood,gutter:{u:gu,y:gy,length:gl},downpipe:{u:pipeU,v:pipeV,bottom:.34,top:4.31},brackets,uprights,roofContacts,...stats,materialsReused:3,newMaterials:0,newColliders:0,footprintChanged:false,routesChanged:false,registration:'2021 short face front/west long face recedes right => north -V; northeast gate12822895657 and south Shinsenjo context corroborate accepted mapped transform',sources:['https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg','https://image.space.rakuten.co.jp/d/strg/ctrl/9/8510ca7752a74472051e7d4b360d3e1c586296e7.77.2.9.2.jpeg'],limits:'Detail sizes inferred. North end sign corroborated relative to existing west-door registration, not a surveyed camera. Shutters closed; no public entry/porch/elevator, new roof mass, fence, terrain, collider or route edit.'};
 owner.add(group);return group.userData;
}
