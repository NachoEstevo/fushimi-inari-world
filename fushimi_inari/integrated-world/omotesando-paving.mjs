import * as THREE from 'three';

// User walking video iqK2tg-TxbY 00:28 / 00:43: long grey slabs run along
// Omotesando, with fine transverse joints. Module sizes are visual estimates.
export function omotesandoPaving(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,512);let seed=5601;
 for(let y=0;y<512;y++)for(let x=0;x<256;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const col=Math.floor(x/128),row=Math.floor((y+col*128)/256),tone=[170,176,172][(col+row)%3];
  const grain=(seed/4294967296-.5)*17,cloud=2*Math.sin(x*.037)*Math.cos(y*.029),i=(y*256+x)*4;
  const seam=x%128<1||(y+col*128)%256<1,value=seam?112:tone+grain+cloud;
  pixels.data[i]=value;pixels.data[i+1]=value+1;pixels.data[i+2]=value-2;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
 return new THREE.MeshStandardMaterial({map,roughness:.94});
}
