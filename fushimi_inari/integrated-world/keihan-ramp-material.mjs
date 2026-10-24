import * as THREE from 'three';

// Original procedural interpretation of the metal panels and side guidance
// strip visible at 00:39 in K0UC5GkHbaU. Panel/strip dimensions are inferred.
export function keihanRampMaterial(){
 const width=512,height=256,color=new Uint8Array(width*height*4),relief=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width,v=y/height,tactile=u>=.72&&u<.84;
  const panel=u*6%1,seam=panel<.018||v<.012;
  const groove=!tactile&&panel>.10&&panel<.90&&(y%32>=12&&y%32<17);
  const ridge=tactile&&((u-.72)/.12*4%1)<.38;
  const grain=((x*13+y*7)%11)-5;
  const rgb=tactile?[176,143,51]:[133,141,143];
  const shade=seam?-31:groove?-39:ridge?13:0,b=seam?93:groove?100:ridge?151:128;
  const i=(y*width+x)*4;for(let k=0;k<3;k++){color[i+k]=Math.max(0,rgb[k]+shade+grain);relief[i+k]=b;}color[i+3]=relief[i+3]=255;
 }
 const texture=(data,srgb=false)=>{const t=new THREE.DataTexture(data,width,height);t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;};
 const material=new THREE.MeshStandardMaterial({map:texture(color,true),bumpMap:texture(relief),bumpScale:.004,roughness:.67,metalness:.26});
 material.name='Keihan grooved ramp panels and tactile guide';
 material.userData={source:'https://youtu.be/K0UC5GkHbaU?t=39',textureOrigin:'Original procedural texture; no video pixels copied',panelLength:.75,tactileAcross:[.72,.84],dimensions:'Inferred appearance; existing ramp geometry unchanged'};
 return material;
}
