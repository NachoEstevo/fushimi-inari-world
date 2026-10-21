import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const sourcePhoto='https://fushimiinari-guide.com/wp-content/uploads/IMG_6470_20210313.jpg';
const shrineIds=['node/10236496678','node/10236503541','node/10236503542'];
// The photographed accessories are placed approximately in the gaps beside
// the mapped shrine fronts. Existing fences and shrine steps remain separate.
export function buildEntranceShrineCourtDetails(root,features,surfaces,materials,colliders){
  const group=new THREE.Group();group.name='Three-shrine court stone lanterns and information boards';
  const stone=(materials.entryStoneMat??materials.stoneMat??new THREE.MeshStandardMaterial()).clone();stone.color.set('#999b89');stone.roughness=1;
  const wood=new THREE.MeshStandardMaterial({color:'#827252',roughness:.94});
  const cream=new THREE.MeshStandardMaterial({color:'#d8cda8',roughness:.95});
  const shadow=new THREE.MeshStandardMaterial({color:'#33372f',roughness:1});
  const batches=new Map(),records=[];
  const put=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const cylinder=(rt,rb,h,x,y,z,mat,n=8)=>put(new THREE.CylinderGeometry(rt,rb,h,n).translate(x,y,z),mat);
  const sample=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite shrine court accessory surface');return y;};
  for(const [x,z]of [[-79.1,-14.25],[-74.9,-14.25]]){
    // A shallow buried footing seats the level stone base on the actual slope.
    const corners=[[-.25,-.25],[.25,-.25],[-.25,.25],[.25,.25]].map(([dx,dz])=>sample(x+dx,z+dz));
    const low=Math.min(...corners)-.025,base=Math.max(...corners),footH=base-low+.10;
    box(.54,footH,.54,x,low+footH/2,z,stone);
    const lanternStarts=new Map([...batches].map(([mat,parts])=>[mat,parts.length]));
    box(.44,.10,.44,x,base+.15,z,stone);
    cylinder(.105,.145,.75,x,base+.565,z,stone);
    cylinder(.24,.16,.14,x,base+1.01,z,stone);
    box(.36,.08,.36,x,base+1.11,z,stone);
    box(.23,.25,.23,x,base+1.275,z,shadow);
    for(const dx of [-.145,.145])for(const dz of [-.145,.145])box(.055,.29,.055,x+dx,base+1.275,z+dz,stone);
    box(.39,.075,.39,x,base+1.445,z,stone);
    // Low square hipped cap with projecting eaves and a small stone finial.
    put(new THREE.ConeGeometry(.43,.18,4).rotateY(Math.PI/4).translate(x,base+1.565,z),stone);
    box(.59,.05,.59,x,base+1.48,z,stone);
    cylinder(.045,.075,.11,x,base+1.69,z,stone);
    put(new THREE.SphereGeometry(.055,8,5).translate(x,base+1.765,z),stone);
    // Photo comparison corrected height; retain the original grounded footprint.
    for(const [mat,parts]of batches)for(let i=lanternStarts.get(mat)??0;i<parts.length;i++)parts[i].translate(0,-base,0).scale(1,1.10/1.82,1).translate(0,base,0);
    colliders.push({type:'box',args:[x,z,.28,.28,0,low,base+1.11,'shrine_court_stone_lantern']});
    records.push({kind:'stone_lantern',position:[x,base,z],estimatedHeight:1.10,placement:'approximate photo-based inter-shrine gap'});
  }
  const oxidized=new THREE.MeshStandardMaterial({color:'#527775',roughness:.88,metalness:.26});
  for(const x of [-84.3,-69.6]){
    const z=-14.1,base=sample(x,z),bottom=Math.min(...[-.22,.22].flatMap(dx=>[-.22,.22].map(dz=>sample(x+dx,z+dz))))-.03;
    box(.48,base-bottom+.18,.48,x,(bottom+base+.18)/2,z,stone);
    box(.36,.12,.36,x,base+.24,z,stone);
    cylinder(.07,.10,2.65,x,base+1.60,z,oxidized,8);
    cylinder(.15,.10,.13,x,base+2.96,z,oxidized,6);
    cylinder(.23,.18,.12,x,base+3.08,z,oxidized,6);
    cylinder(.19,.19,.37,x,base+3.31,z,cream,6);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      cylinder(.018,.018,.41,x+Math.cos(a)*.19,base+3.31,z+Math.sin(a)*.19,oxidized,5);
    }
    cylinder(.25,.22,.08,x,base+3.535,z,oxidized,6);
    put(new THREE.ConeGeometry(.36,.18,6).translate(x,base+3.66,z),oxidized);
    cylinder(.025,.045,.10,x,base+3.80,z,oxidized,6);
    colliders.push({type:'box',args:[x,z,.25,.25,0,bottom,base+3.86,'shrine_court_tall_exterior_lantern']});
    records.push({kind:'tall_exterior_lantern',position:[x,base,z],estimatedHeight:3.85,placement:'photo-inferred exterior end of three-shrine group',material:'blue green oxidized metal',lightSource:false});
  }
  const boardSpecs=[{id:shrineIds[0],x:-82.12,z:-14.67},{id:shrineIds[1],x:-78.08,z:-14.67},{id:shrineIds[2],x:-73.70,z:-14.67}];
  // Only verified POI names are printable. No historical prose or invented marks.
  const verified=boardSpecs.map(s=>features.pois?.find(p=>p.id===s.id)?.tags?.name??'');
  let labelMat;
  if(typeof document!=='undefined'&&verified.some(Boolean)){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.fillStyle='#d8cda8';ctx.fillRect(0,0,768,256);ctx.fillStyle='#3c382e';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='44px serif';
      verified.forEach((name,i)=>ctx.fillText(name,i*256+128,128,220));
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      labelMat=new THREE.MeshStandardMaterial({map:texture,roughness:.96,side:THREE.DoubleSide});
    }
  }
  boardSpecs.forEach((spec,i)=>{
    const {x,z}=spec,base=sample(x,z),w=.48,h=.54,panelY=base+.98;
    // Individual posts sample their own ground; the board stays level.
    for(const dx of [-.17,.17]){
      const foot=sample(x+dx,z)-.025,top=base+1.20;
      box(.045,top-foot,.055,x+dx,(foot+top)/2,z,wood);
    }
    box(w,h,.055,x,panelY,z,cream);
    for(const side of [-1,1])box(.035,h+.055,.075,x+side*w/2,panelY,z,wood);
    for(const side of [-1,1])box(w+.045,.035,.075,x,panelY+side*h/2,z,wood);
    box(w+.09,.045,.12,x,panelY+h/2+.03,z,wood);
    if(labelMat&&verified[i]){
      const geo=new THREE.PlaneGeometry(w-.055,h-.065);const uv=geo.getAttribute('uv');
      for(let k=0;k<uv.count;k++)uv.setX(k,(i+uv.getX(k))/3);
      geo.translate(x,panelY,z+.031);put(geo,labelMat);
    }
    colliders.push({type:'box',args:[x,z,.27,.07,0,base,base+1.30,'shrine_court_information_board']});
    records.push({kind:'information_board',sourceId:spec.id,verifiedName:verified[i]||null,position:[x,base,z],estimatedPanel:[w,h],placement:'beside, outside mapped front opening'});
  });
  for(const [material,parts]of batches){const merged=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!merged)throw Error('Shrine court accessory merge failed');const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
  group.userData={sourcePhoto,sourceIds:shrineIds,records,provenance:'Photo-based 1.10m stone lanterns, approximately 3.8m blue green exterior lanterns and cream timber board forms; all accessory positions and dimensions estimated. Names copied only from mapped POI tags. Footings and posts sample surfaces.height individually; mapped entrance gaps, fences, shrine bodies and steps unchanged.'};
  root.add(group);return {group,records};
}
export const builder=buildEntranceShrineCourtDetails;
