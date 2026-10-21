import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pathWidth} from '../geography/geo-core.mjs';

// Photo IMG7698 registers to the shared footway/steps endpoint in the mapped
// white-wall gap. Parking polygon centre is not used as gate placement.
export function buildEntranceBicycleGate(root,features,barriers,surfaces,materials,colliders){
 const route=features.paths.find(p=>p.id==='way/626313859'),steps=features.paths.find(p=>p.id==='way/1133052416');
 if(!route||!steps)return null;
 const a=route.points.at(-2),b=route.points.at(-1);
 if(Math.hypot(b[0]-steps.points[0][0],b[2]-steps.points[0][2])>.15)return null;
 const ways=Array.isArray(barriers)?barriers:barriers.ways??[],left=ways.find(w=>w.id==='way/1133052410'),right=ways.find(w=>w.id==='way/1133052420');
 if(!left||!right)return null;
 const gapLeft=left.points.at(-1),gapRight=right.points[1];
 const cx=b[0],cz=b[2],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz),ux=dz/len,uz=-dx/len,yaw=-Math.atan2(uz,ux),clear=Math.max(2.4,pathWidth(route.tags)+.35);
 if(Math.hypot(gapRight[0]-gapLeft[0],gapRight[1]-gapLeft[1])<clear+.45)return null;
 const group=new THREE.Group();group.name='Photo-registered south bicycle parking timber gate';
 const wood=new THREE.MeshStandardMaterial({color:'#6c5a43',roughness:.94}),endGrain=new THREE.MeshStandardMaterial({color:'#c4bca6',roughness:.95});
 // A dedicated ceramic material avoids inheriting the legacy brown roof map.
 const roof=new THREE.MeshStandardMaterial({color:'#929b99',roughness:.82,side:THREE.DoubleSide});
 const grain=new Uint8Array(64*128*4);
 for(let y=0;y<128;y++)for(let x=0;x<64;x++){
  const line=Math.sin(x*.82+Math.sin(y*.035)*.65)*.5+.5,noise=(Math.sin(x*17.17+y*3.13)*43758.54%1+1)%1,v=Math.round(205+line*29+noise*17);
  grain.set([v,v,v,255],(y*64+x)*4);
 }
 const woodGrain=new THREE.DataTexture(grain,64,128,THREE.RGBAFormat);woodGrain.wrapS=woodGrain.wrapT=THREE.RepeatWrapping;woodGrain.needsUpdate=true;woodGrain.colorSpace=THREE.SRGBColorSpace;
 wood.map=woodGrain;wood.bumpMap=woodGrain;wood.bumpScale=.009;
 const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#999d92');stone.roughness=1;
 const batches=new Map(),sample=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite bicycle gate seat');return y;};
 const supportHeight=(x,z)=>{const path=sample(x,z),terrain=surfaces.terrainHeight?.(x,z);return Number.isFinite(terrain)?Math.min(path,terrain+.025):path;};
 const point=(u,v)=>[cx+ux*u+dx/len*v,cz+uz*u+dz/len*v];
 const put=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const box=(w,h,d,u,y,v,mat)=>{const [x,z]=point(u,v);put(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);};
 const beam=(pa,pb,r,mat)=>{const va=new THREE.Vector3(...pa),vb=new THREE.Vector3(...pb),delta=vb.clone().sub(va),geo=new THREE.CylinderGeometry(r,r,delta.length(),8);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...va.add(vb).multiplyScalar(.5).toArray());put(geo,mat);};
 const base=sample(cx,cz),eave=base+2.62,ridge=eave+.40,halfW=clear/2+.48,halfD=.70;
 for(const side of [-1,1]){
  const u=side*(clear/2+.12),p=point(u,0),foot=supportHeight(...p),h=eave-.20-foot;
  box(.25,h,.25,u,foot+h/2,0,wood);box(.34,.12,.34,u,foot+.02,0,stone);
  box(.40,.14,.36,u,eave-.26,0,wood);
  colliders.push({type:'box',args:[p[0],p[1],.145,.145,yaw,foot,eave,'bicycle_gate_timber_post']});
 }
 box(clear+.55,.22,.24,0,eave-.20,0,wood);
 for(const v of [-.45,.45])box(clear+.78,.12,.13,0,eave-.06,v,wood);
 // Ridge follows the frontage, with shallow front and back ceramic pitches.
 const verts=[],uv=[];
 for(const side of [-1,1])for(const [u,v,y]of [[-halfW,0,ridge],[halfW,0,ridge],[-halfW,side*halfD,eave],[halfW,0,ridge],[halfW,side*halfD,eave],[-halfW,side*halfD,eave]]){const p=point(u,v);verts.push(p[0],y,p[1]);uv.push(u,v);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();put(geo,roof);
 for(let u=-halfW+.07;u<halfW;u+=.20)for(const side of [-1,1]){
  const p=point(u,0),q=point(u,side*halfD);beam([p[0],ridge+.025,p[1]],[q[0],eave+.025,q[1]],.032,roof);
  box(.045,.06,.13,u,eave-.09,side*(halfD-.08),endGrain);
 }
 for(const v of [-halfD,halfD])box(halfW*2,.12,.10,0,eave-.06,v,wood);
 for(const y of [.04,.10,.16])box(halfW*2,.05,.13,0,ridge+y,0,roof);
 for(const side of [-1,1])box(.14,.20,.18,side*(halfW-.04),ridge+.12,0,roof);
 // The narrow black Parking arrow marker is photographed beside the left
 // post. No logos, historical inscriptions or unverified bike icon is added.
 const signU=clear/2+.61,signP=point(signU,-.12),signBase=supportHeight(...signP);
 box(.22,1.48,.13,signU,signBase+.74,-.12,wood);
 if(typeof document!=='undefined'){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;const ctx=canvas.getContext('2d');
  if(ctx){ctx.fillStyle='#383b37';ctx.fillRect(0,0,128,512);ctx.fillStyle='#dedfd6';ctx.textAlign='center';ctx.font='22px sans-serif';ctx.fillText('Parking',64,230);ctx.font='70px sans-serif';ctx.fillText('→',64,325);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshStandardMaterial({map,roughness:.97});const panel=new THREE.PlaneGeometry(.21,1.46);panel.rotateY(yaw+Math.PI);const p=point(signU,-.191);panel.translate(p[0],signBase+.74,p[1]);put(panel,mat);}
 }
 colliders.push({type:'box',args:[signP[0],signP[1],.12,.08,yaw,signBase,signBase+1.48,'bicycle_gate_parking_marker']});
 for(const [mat,parts]of batches){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!merged)throw Error('Bicycle gate merge failed');const mesh=new THREE.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
 group.userData={sourcePhoto:'https://fushimiinari-guide.com/wp-content/uploads/IMG_7698_20210405.jpg',mappedRegistration:['way/626313859','way/1133052416','way/1133052410','way/1133052420','way/264074614'],position:[cx,base,cz],estimatedClearWidth:clear,estimatedEaveHeight:2.62,estimatedRoofRise:.40,provenance:'Gate registered to exact shared footway/steps endpoint in mapped white-wall gap. Gate section dimensions and marker position estimated from photo; marker placed on avenue-view left after native QA, roof uses dedicated neutral silver-grey ceramic, timber grain procedural. Off-path supports seat at minimum of path surface and terrain+.025m to avoid adjacent-path elevation lifting their bases. Existing wall, shrubbery, path, steps and parking geometry not duplicated; no ground or route changes.'};
 root.add(group);return {group,clearWidth:clear};
}
export const builder=buildEntranceBicycleGate;
