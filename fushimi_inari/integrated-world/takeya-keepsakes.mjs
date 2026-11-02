import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {appendMochi} from './heritage-goods.mjs';

const NAME='Takeya photographed keepsake counter';
const SOURCE='https://fushimiinari-guide.com/takeya/';
const PRODUCT_SOURCE='https://www.takeya-gofukumochi.com/shop';

function woodGrain(){
 const w=128,h=256,data=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const grain=Math.sin(x*.9+Math.sin(y*.035)*1.7)*3+Math.sin(x*2.1+y*.08)*2;
  const seam=x%32<1?22:0,i=(y*w+x)*4;
  data[i]=244+grain-seam;data[i+1]=233+grain-seam;data[i+2]=211+grain-seam;data[i+3]=255;
 }
 const map=new THREE.DataTexture(data,w,h);map.name='Takeya shared fine timber grain';map.colorSpace=THREE.SRGBColorSpace;
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.needsUpdate=true;return map;
}
function labels(){
 const canvas=globalThis.document?.createElement?.('canvas'),ctx=canvas?.getContext?.('2d');
 if(!ctx?.fillText)return null;
 canvas.width=384;canvas.height=128;ctx.fillStyle='#eee5d0';ctx.fillRect(0,0,384,128);
 ctx.fillStyle='#292b25';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='28px serif';
 ['五福餅','竹屋','鳥居'].forEach((text,i)=>ctx.fillText(text,64+i*128,64));
 const map=new THREE.CanvasTexture(canvas);map.name='Takeya shared package lettering';map.colorSpace=THREE.SRGBColorSpace;return map;
}

// Firsthand photographs show woven sweet baskets and packaged torii magnets.
// Product arrangement and display dimensions are inferred inside the existing
// mapped shop recess. The public path, its grade and its colliders stay owned
// by the original frontage builder; no public shop interior is invented.
export function buildTakeyaKeepsakes(root,frontage,materials,interactables){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const front=frontage?.frontage,floor=frontage?.floor;
 if(!front||!Number.isFinite(floor)||front.openingWidth<2.8)return {built:false,reason:'Registered Takeya frontage required'};
 const {a,b,length,inward:[nx,nz],openingCenter,openingWidth}=front;
 const ux=(b[0]-a[0])/length,uz=(b[2]-a[2])/length,yaw=-Math.atan2(uz,ux),handed=ux*nz-uz*nx;
 const left=openingCenter-openingWidth/2,center=left+.79;
 const group=new THREE.Group();group.name=NAME;group.position.set(a[0]+ux*center+nx*.61,floor,a[2]+uz*center+nz*.61);
 const at=(s,d,y)=>[a[0]+ux*s+nx*d-group.position.x,y,a[2]+uz*s+nz*d-group.position.z];
 const parts=staticParts(group),grain=woodGrain(),lettering=labels();
 const wood=new THREE.MeshStandardMaterial({color:'#d8b98a',map:grain,roughness:.82});
 const basket=new THREE.MeshStandardMaterial({color:'#b5a06b',roughness:.94});
 const paper=new THREE.MeshStandardMaterial({name:'Takeya paper wrappers',color:'#ebe7d9',roughness:.94});
 const red=materials.vermilionMat??new THREE.MeshStandardMaterial({color:'#b84629',roughness:.7});
 const black=materials.blackNemakiMat??new THREE.MeshStandardMaterial({color:'#292e28',roughness:.65});
 const kinako=new THREE.MeshStandardMaterial({name:'Takeya kinako mochi',color:'#c5aa7d',roughness:.98});
 const matcha=new THREE.MeshStandardMaterial({name:'Takeya matcha mochi',color:'#9daa7c',roughness:.98});
 const printed=new THREE.MeshStandardMaterial({color:'#eee5d0',...(lettering?{map:lettering,color:'#ffffff'}:{}),roughness:.8});
 const box=(w,h,d,s,y,inset,material)=>parts.put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(...at(s,inset,y)),material);
 const top=.79;
 box(1.42,.72,.53,center,.36,.64,wood);box(1.51,.055,.62,center,top-.0275,.62,wood);
 for(let i=0;i<5;i++)box(.025,.65,.018,left+.15+i*.31,.365,.367,wood);
 const stamp=(s,d,y,w,h,slot)=>{
  const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+slot)/3);
  parts.put(g.rotateX(-Math.PI/2).rotateY(yaw).translate(...at(s,d,y)),printed,false);
 };
 const packets=[paper,kinako,matcha];
 // Quiet folded paper parcels stand on the two shallow back shelves.
 for(const h of [.94,1.64])for(let i=0;i<8;i++){
  const s=left+.25+i*(openingWidth-.5)/7,w=i%3===0?.16:.20,height=i%3===0?.21:.16;
  const shape=new THREE.Shape();shape.moveTo(-w*.48,0);shape.lineTo(w*.48,0);shape.lineTo(w*.46,height*.69);
  shape.lineTo(w*.32,height*.85);shape.lineTo(0,height);shape.lineTo(-w*.32,height*.85);shape.lineTo(-w*.46,height*.69);shape.closePath();
  const parcel=new THREE.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:false,steps:1}).translate(0,0,-.0425);
  parts.put(parcel.rotateY(yaw).translate(...at(s,.98,h+.0325)),packets[i%3]);
  const fold=[at(s-w*.42,.934,h+.0325+height*.70),at(s,.927,h+.0325+height*.91),at(s+w*.42,.934,h+.0325+height*.70)];
  parts.sheet((handed<0?[fold[0],fold[2],fold[1]]:fold).flat(),packets[i%3]);
  const face=new THREE.PlaneGeometry(w*.70,height*.43),uv=face.attributes.uv,slot=i%4===1?1:0;
  for(let j=0;j<uv.count;j++)uv.setX(j,(uv.getX(j)+slot)/3);
  parts.put(face.rotateY(yaw+(handed>0?Math.PI:0)).translate(...at(s,.927,h+.0325+height*.40)),printed,false);
 }
 const foldedWrap=(s,d,y)=>{
  const p=(x,z,rise=0)=>at(s+x,d+z,y+rise),vertices=[];
  const tri=(a,b,c)=>vertices.push(...a,...(handed>0?c:b),...(handed>0?b:c));
  const corners=[p(-.030,-.030),p(.030,-.030),p(.030,.030),p(-.030,.030)];
  const outer=[p(0,-.045,.010),p(.045,0,.010),p(0,.045,.010),p(-.045,0,.010)];
  tri(corners[0],corners[1],corners[2]);tri(corners[0],corners[2],corners[3]);
  for(let i=0;i<4;i++)tri(corners[i],outer[i],corners[(i+1)%4]);
  parts.sheet(vertices,paper);
 };
 for(let tray=0;tray<3;tray++){
  const s=left+.29+tray*.47;
  // Separate rim and crossing strips leave a woven, shallow open basket.
  parts.put(new THREE.TorusGeometry(.18,.009,4,24).rotateX(Math.PI/2).scale(1.15,1,.78).rotateY(yaw).translate(...at(s,.43,top+.035)),basket);
  for(let i=-3;i<=3;i++){
   const t=i*.045,span=2*Math.sqrt(Math.max(0,.18*.18-t*t));
   box(span,.006,.009,s,top+.012,.43+t*.78,basket);
   box(.009,.006,span*.78,s+t,top+.015,.43,basket);
  }
  for(let i=0;i<5;i++){
   const u=s+(i%3-1)*.085,d=.42+Math.floor(i/3)*.075;
   foldedWrap(u,d,top+.020);
   appendMochi(parts,{position:at(u,d,top+.020),yaw,width:.077,height:.043,depth:.071,material:packets[tray]});
  }
  stamp(s,.58,top+.018,.20,.085,0);
 }
 // Six small red magnets on pale backing cards, within a black display tray.
 const display=openingCenter+.28;
 box(.70,.025,.39,display,top+.035,.71,black);
 for(let row=0;row<2;row++)for(let col=0;col<3;col++){
  const s=display+(col-1)*.205,d=.62+row*.17;
  box(.175,.006,.145,s,top+.052,d,paper);
  for(const side of [-1,1])box(.014,.009,.079,s+side*.038,top+.060,d,red);
  box(.125,.012,.018,s,top+.062,d-.035,red);
  box(.101,.010,.011,s,top+.062,d+.010,red);
 }
 stamp(display,.93,top+.016,.46,.105,2);
 const stats=parts.flush();
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});
 const shop=root.getObjectByName('Takeya mapped timber and open frontage R89');
 const reused=new Set();shop?.traverse(o=>{
  if(!o.isMesh||Array.isArray(o.material))return;
  const m=o.material;if([0x554331,0x36352c].includes(m.color?.getHex())&&!m.map){m.map=grain;m.needsUpdate=true;reused.add(m);}
 });
 const record={built:true,batches:stats.batches,triangles:stats.triangles,mochi:15,foldedWraps:15,shelfParcels:16,toriiMagnets:6,baskets:3,
  sourceFeature:'way/301527736',source:SOURCE,productSource:PRODUCT_SOURCE,extraLights:0,extraColliders:0,textures:1+Number(!!lettering),retexturedMaterials:reused.size,
  limits:'Mochi and kinako/matcha varieties follow the shop description; display, folded wraps and parcel arrangement are inferred. No prices or indoor route asserted.'};
 group.userData={...record,interactable:{language:'en',title:'Takeya · keepsakes',proximity:true,reach:2.5,cooldownMs:1200,
  prompt:'Browse the keepsakes',directAction:()=>'Soft mochi in folded paper and tiny torii magnets. A memory of the mountain.'}};
 root.add(group);interactables.push(group);return group.userData;
}
