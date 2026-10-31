// Historical June 2012 street-view capture: fushimi_inari/outputs/r49/north-close.png.
// Lower western wing has timber boards and a green shop awning; dimensions are inferred.
import * as THREE from 'three';

export function northCourtTimberTexture(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=Math.sin(x*.59+Math.sin(y*.035)*.6)*3+Math.sin(x*.17+y*.014)*2;
  const noise=((x*17+y*31)%9)-4,value=Math.round(224+grain+noise*.6),i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);texture.name='North court fine weathered timber';texture.colorSpace=THREE.SRGBColorSpace;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.needsUpdate=true;return texture;
}

export function northCourtLowFrontEdges(points,local){
 const edges=[];
 for(let i=0;i<points.length;i++){
  const a=local(points[i]),b=local(points[(i+1)%points.length]);
  if(a[1]>=1.95||b[1]>=1.95||Math.abs(a[1]-b[1])>.12||Math.abs(a[0]-b[0])<2)continue;
  edges.push({u0:Math.min(a[0],b[0]),u1:Math.max(a[0],b[0]),v:(a[1]+b[1])/2});
 }
 return edges;
}
