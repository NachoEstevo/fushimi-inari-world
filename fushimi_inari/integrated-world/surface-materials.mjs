import * as THREE from 'three';
// One texture tile spans 1.5 m in the terrain UVs: fine aggregate, not boulders.
export function courtyardGravel(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#676c6e';ctx.fillRect(0,0,512,512);
  let seed=714;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<22000;i++){
    const x=rand()*512,y=rand()*512,r=.7+rand()*1.5,n=Math.floor(77+rand()*78);
    ctx.fillStyle=`rgb(${n},${n+2},${n+3})`;ctx.beginPath();ctx.ellipse(x,y,r,r*.7,rand()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,roughness:1,bumpMap:map,bumpScale:.008});
}
// User photos 1, 2 and 8: narrow joints, cool grey dressed stone, and small
// rectangular setts. The texture repeats over 2 metres on metric path UVs.
export function precinctPaving(cobbles=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#656762';ctx.fillRect(0,0,1024,1024);
  let seed=1621;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const cols=cobbles?16:4,rows=cobbles?24:3,w=1024/cols,h=1024/rows,joint=cobbles?2:1.6;
  for(let row=0;row<rows;row++)for(let col=-1;col<cols;col++){
    const x=(col+(row%2)*.5)*w,y=row*h,n=145+rand()*8;
    ctx.fillStyle=`rgb(${n},${n+1},${n-1})`;ctx.fillRect(x+joint,y+joint,w-2*joint,h-2*joint);
  }
  const pixels=ctx.getImageData(0,0,1024,1024),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const n=(rand()-.5)*24;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:cobbles?.012:.004,roughness:.94});
}
export function fineGranite(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(512,256);
  let seed=91;
  for(let i=0;i<pixels.data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=151+(seed/4294967296-.5)*50;
    pixels.data[i]=n+3;pixels.data[i+1]=n+2;pixels.data[i+2]=n-3;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,roughness:.96});
}
