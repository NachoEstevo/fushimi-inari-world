import * as THREE from 'three';

// These repeatable surfaces contain material variation, never cast shadows.
// Albedo images can stream later without replacing the texture or material.
const SIZE=256;
const ASSETS={
 timber:new URL('../assets/textures/architectural-r1/cedar-weathered-color.webp',import.meta.url).href,
 plaster:new URL('../assets/textures/architectural-r1/lime-plaster-color.webp',import.meta.url).href,
};
const COLORS={roof:[87,91,86],timber:[126,112,94],brick:[179,151,107],awning:[173,110,78],cloth:[62,47,38],mineral:[165,166,158],plaster:[188,185,176]};
const hash=(x,y)=>{let n=Math.imul(x+73,374761393)^Math.imul(y+91,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
function noise(u,v,cellsX,cellsY=cellsX){
 const x=u*cellsX,y=v*cellsY,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),sample=(a,b)=>hash((a+cellsX)%cellsX,(b+cellsY)%cellsY);
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(ix,iy),sample(ix+1,iy),sx),THREE.MathUtils.lerp(sample(ix,iy+1),sample(ix+1,iy+1),sx),sy);
}
function dataTexture(data,name,colorSpace){
 const t=new THREE.DataTexture(data,SIZE,SIZE,THREE.RGBAFormat);t.name=name;t.colorSpace=colorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;
}
function fallbackImage(data){
 if(typeof document==='undefined')return {width:SIZE,height:SIZE,data};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;
 const ctx=canvas.getContext('2d');if(!ctx)return {width:SIZE,height:SIZE,data};
 const pixels=ctx.createImageData(SIZE,SIZE);pixels.data.set(data);ctx.putImageData(pixels,0,0);return canvas;
}
function surfaceMaps(kind,loadTexture,assets){
 const color=new Uint8Array(SIZE*SIZE*4),packed=new Uint8Array(SIZE*SIZE*4),base=COLORS[kind];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const u=x/SIZE,v=y/SIZE,i=(y*SIZE+x)*4,fine=hash(x,y)-.5,cloud=noise(u,v,4)-.5;
  const grain=kind==='timber'?(noise(u,v,48,3)-.5)*10+(noise(u,v,95,7)-.5)*4:0;
  let variation=fine*5+cloud*10+(noise(u,v,16)-.5)*3+grain;
  let relief=.5+fine*.045+(kind==='timber'?grain*.002:0),rough=kind==='roof'?.96:kind==='timber'?.88:.94;
  if(kind==='roof'){
   const seam=x%64<2;variation-=seam?5:0;relief-=seam?.05:0;
  }
  for(let c=0;c<3;c++)color[i+c]=Math.max(0,Math.min(255,Math.round(base[c]+variation)));
  color[i+3]=255;packed[i]=Math.round(relief*255);packed[i+1]=Math.round(rough*255);packed[i+2]=0;packed[i+3]=255;
 }
 let map;
 if(loadTexture&&assets[kind]){
  map=loadTexture(assets[kind]);
  // The texture streaming Source is retained; its image changes in place.
  // An earlier user may already have loaded this source, so only replace the
  // streamer's 1-pixel placeholder, never an image it has already resolved.
  if(!map.image||(map.image.width<=1&&map.image.height<=1))map.image=fallbackImage(color);
  map.name=`Architectural ${kind} albedo`;map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=4;map.needsUpdate=true;
 }else map=dataTexture(color,`Architectural ${kind} albedo`,THREE.SRGBColorSpace);
 if(kind==='cloth'&&typeof document!=='undefined'){
  const canvas=fallbackImage(color),ctx=canvas.getContext?.('2d');
  if(ctx){ctx.fillStyle='#e8ddc8';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 49px serif';ctx.fillText('辻',128,98);ctx.fillText('亭',128,157);
   map.dispose();map=new THREE.CanvasTexture(canvas);map.name='Tsujitei noren with observed name';map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;map.anisotropy=4;
  }
 }
 const relief=dataTexture(packed,`Architectural ${kind} height / roughness`,THREE.NoColorSpace);
 return {map,bumpMap:relief,roughnessMap:relief};
}

// Geometry owns its UVs. One tile represents 1 m for the two photographed
// surfaces and 3 m for the legacy context finishes; noren uses per-panel UVs.
export function architecturalSurfaceTileMetres(kind){return kind==='timber'||kind==='plaster'?1:3;}
export function createArchitecturalSurfaceLibrary({loadTexture,assets={}}={}){
 const urls={...ASSETS,...assets},maps=new Map(),materials=new Map(),streamed=new Set();let disposed=false;
 function getMaps(kind){
  if(disposed)throw new Error('Architectural surface library is disposed');
  if(!Object.hasOwn(COLORS,kind))throw new Error(`Unknown architectural surface: ${kind}`);
  if(!maps.has(kind)){maps.set(kind,surfaceMaps(kind,loadTexture,urls));if(loadTexture&&urls[kind]&&kind!=='cloth')streamed.add(kind);}
  return maps.get(kind);
 }
 function get(kind){
  if(!materials.has(kind)){
   const textures=getMaps(kind);
   materials.set(kind,new THREE.MeshStandardMaterial({name:`Mapped context ${kind}`,...textures,bumpScale:kind==='roof'?.0004:.002,roughness:1,metalness:0,envMapIntensity:.3,side:THREE.DoubleSide}));
  }
  if(disposed)throw new Error('Architectural surface library is disposed');
  return materials.get(kind);
 }
 return {get,getMaps,tileMetres:architecturalSurfaceTileMetres,get stats(){
  const textures=new Set([...maps.values()].flatMap(value=>Object.values(value)));
  return {materials:materials.size,textures:textures.size,textureBytes:[...textures].reduce((n,t)=>n+(t.image?.data?.byteLength??(t.image?.width??0)*(t.image?.height??0)*4),0),streamed:streamed.size};
 },dispose(){
  if(disposed)return;disposed=true;
  for(const material of materials.values())material.dispose();
  for(const textures of maps.values())for(const texture of new Set(Object.values(textures)))texture.dispose();
  materials.clear();maps.clear();streamed.clear();
 }};
}
