import * as THREE from 'three';
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
