import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The shrine describes otsuka as individually dedicated, inscribed stones.
// These inherited positions are illustrative, so their shared texture must not
// repeat the name of a specific deity across the mountain.
const near=(a,b)=>Math.abs(a-b)<1e-6;
function isLegacyStele(mesh,zone){
  const p=mesh.geometry?.parameters;
  if(mesh.geometry?.type!=='BoxGeometry'||!p)return false;
  if(zone==='kumataka'){
    for(let i=0;i<28;i++){
      const x=-9.2-i%4*1.35,z=-8.5+Math.floor(i/4)*2.5,h=1.10+i%3*.32;
      if(near(p.width,.56)&&near(p.depth,.30)&&near(p.height,h)&&near(mesh.position.x,x)&&near(mesh.position.z,z)&&near(mesh.position.y,h/2+i%4*.18))return true;
    }
    return false;
  }
  return ['mitsurugi','sannomine','ninomine','summit'].includes(zone)&&near(p.depth,.26)
    &&[.44,.54,.64].some(w=>near(p.width,w))&&[.90,1.24,1.58,1.92].some(h=>near(p.height,h));
}
function steleGeometry(w,h,d){
  const g=new THREE.BoxGeometry(w,h,d,8,4,1),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
  const crown=Math.min(w*.40,h*.18),bevel=Math.min(.018,d*.07);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),nz=n.getZ(i);
    const u=Math.abs(x)/(w/2),rise=Math.max(0,(y-(h/2-crown))/crown);
    p.setY(i,y-rise*crown*(1-Math.sqrt(Math.max(0,1-u*u))));
    // Keep the face legible; ease the vertical corners and convex back inside
    // the original footprint, including at the feet.
    if(Math.abs(x)>w/2-1e-6)p.setX(i,x-Math.sign(x)*bevel);
    if(Math.abs(z)>d/2-1e-6)p.setZ(i,z-Math.sign(z)*bevel*Math.pow(u,6));
    if(Math.abs(nz)>.5){
      if(nz>0)uv.setXY(i,.10+.8*(x/w+.5),.08+.84*(y/h+.5));
      else uv.setXY(i,.025,.15+.7*(y/h+.5));
    }else if(Math.abs(nx)>.5){uv.setXY(i,.025,.15+.7*(y/h+.5));}
    else uv.setXY(i,.025,.5);
  }
  g.computeVertexNormals();return g;
}
let sharedSteleTexture;
const steleMaterials=new WeakMap();
function steleTexture(){
  if(sharedSteleTexture)return sharedSteleTexture;
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  ctx.fillStyle='#b9bab0';ctx.fillRect(0,0,256,512);
  let seed=5491;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<4200;i++){
    const shade=90+Math.floor(random()*95);ctx.fillStyle=`rgba(${shade},${shade},${shade},.16)`;
    ctx.fillRect(random()*256,random()*512,.5+random()*1.3,.5+random()*1.3);
  }
  // Generic dedication only. No deity, donor or historical inscription claimed.
  ctx.fillStyle='#66685f';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='52px serif';
  ctx.fillText('奉',128,143);ctx.fillText('納',128,205);
  sharedSteleTexture=new THREE.CanvasTexture(canvas);sharedSteleTexture.colorSpace=THREE.SRGBColorSpace;
  return sharedSteleTexture;
}
function steleMaterial(original){
  const texture=steleTexture(),cached=texture&&steleMaterials.get(original);
  if(cached)return cached;
  const material=original.clone();material.color.set('#b4b4aa');material.roughness=.94;
  material.map=texture;material.normalMap=null;material.roughnessMap=null;
  // A headless invocation must never cache a textureless browser material.
  if(texture)steleMaterials.set(original,material);
  return material;
}

// Mitsurugi panorama, Luke Hall, April 2018: miniature torii have open
// centers. All four legacy peak compounds reuse the same solid offering proxy.
// Keep authored placements and dimensions; these are not surveyed.
export function refineShrineOfferings(object){
  const zone=object.userData.zone;
  if(!['kumataka','mitsurugi','sannomine','ninomine','summit'].includes(zone))return;
  const targets=[],geometries=new Map(),materials=new Map();
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&p.width===.36&&p.height===.42&&p.depth===.06)targets.push(mesh);
    if(!mesh.userData.otsukaShape&&isLegacyStele(mesh,zone)){
      const key=[p.width,p.height,p.depth].join('/');
      if(!geometries.has(key))geometries.set(key,steleGeometry(p.width,p.height,p.depth));
      if(!materials.has(mesh.material))materials.set(mesh.material,steleMaterial(mesh.material));
      mesh.geometry=geometries.get(key);mesh.material=materials.get(mesh.material);
      mesh.userData.otsukaShape=true;
    }
  });
  if(!targets.length)return;
  const pieces=[
    new THREE.BoxGeometry(.04,.38,.06).translate(-.115,-.02,0),
    new THREE.BoxGeometry(.04,.38,.06).translate(.115,-.02,0),
    new THREE.BoxGeometry(.36,.04,.06).translate(0,.19,0),
    new THREE.BoxGeometry(.29,.035,.05).translate(0,.10,0),
  ];
  const geometry=mergeGeometries(pieces);
  pieces.forEach(p=>p.dispose());
  for(const mesh of targets)mesh.geometry=geometry;
}
