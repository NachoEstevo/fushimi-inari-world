import * as THREE from 'three';
// One texture tile spans 1.5 m in the terrain UVs: fine aggregate, not boulders.
export function courtyardGravel(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#b5afa1';ctx.fillRect(0,0,512,512);
  let seed=714;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<22000;i++){
    const x=rand()*512,y=rand()*512,r=.45+rand()*1.2,n=Math.floor(148+rand()*66);
    ctx.fillStyle=`rgb(${n+5},${n+2},${n-5})`;ctx.beginPath();ctx.ellipse(x,y,r,r*.7,rand()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,roughness:1,bumpMap:map,bumpScale:.008});
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
