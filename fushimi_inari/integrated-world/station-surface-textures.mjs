import * as THREE from 'three';

// Original, tileable PBR fields. The dated platform photo informs scale and
// restrained concrete wear, never supplies photo pixels or baked sunlight:
// https://ameblo.jp/kaze-no-fukumamani/entry-12964772013.html
const SIZE=512,clamp=THREE.MathUtils.clamp;
const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;};
function noise(u,v,cells){
 const x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),h=(a,b)=>hash((a+cells)%cells,(b+cells)%cells);
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),sx),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),sx),sy);
}
function texture(data,width,height,name,colorSpace=THREE.NoColorSpace){
 const map=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);map.name=name;map.colorSpace=colorSpace;
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=8;map.needsUpdate=true;return map;
}
function surface(kind,floor){
 const count=SIZE*SIZE,color=new Uint8Array(count*4),packed=new Uint8Array(count*4),heights=new Float32Array(count),normal=new Uint8Array(count*4);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const u=x/SIZE,v=y/SIZE,n=hash(x+61,y+31),macro=noise(u,v,4),medium=noise(u,v,32),i=(y*SIZE+x)*4;
  let shade,height,rough,ao=1;
  if(kind==='deck'){
   // 3 m patch, with discreet 1.5 m construction joints and 6–12 mm aggregate.
   const edge=Math.min((u*2)%1,1-(u*2)%1,(v*2)%1,1-(v*2)%1);
   const joint=1-THREE.MathUtils.smoothstep(edge,0,.004);
   const fleck=n>.92?(n-.92)*2.6:n<.08?(n-.08)*1.7:0;
   shade=.89+(macro-.5)*.13+(medium-.5)*.07+(n-.5)*.05+fleck-joint*.12;
   height=(n-.5)*.0007+(medium-.5)*.0006-joint*.0012;rough=.90+(medium-.5)*.10+(n-.5)*.08;ao=1-joint*.08;
  }else{
   // 3.2 m wide painted concrete panels; weathering gathers near the base.
   const edge=Math.min(u,1-u),joint=1-THREE.MathUtils.smoothstep(edge,0,.0018);
   const base=Math.exp(-v*13),streak=Math.pow(noise(u,.36,64),3)*(.15+.85*(1-v));
   shade=.96+(macro-.5)*.045+(medium-.5)*.025+(n-.5)*.014-base*.11-streak*.045-joint*.16;
   height=(medium-.5)*.00025+(n-.5)*.00008-joint*.0011;rough=.87+(medium-.5)*.09+base*.04;ao=1-joint*.14-base*.03;
  }
  heights[y*SIZE+x]=height;
  for(let c=0;c<3;c++)color[i+c]=Math.round(clamp(shade*(c===2?.993:1),0,1)*255);
  color[i+3]=255;packed[i]=Math.round(ao*255);packed[i+1]=Math.round(clamp(rough,0,1)*255);packed[i+2]=0;packed[i+3]=255;
 }
 const metres=kind==='deck'?[3,3]:[3.2,3.1];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const h=(a,b)=>heights[((b+SIZE)%SIZE)*SIZE+(a+SIZE)%SIZE];
  const dx=(h(x+1,y)-h(x-1,y))*SIZE/(2*metres[0]),dy=(h(x,y+1)-h(x,y-1))*SIZE/(2*metres[1]);
  const length=Math.hypot(dx,dy,1),i=(y*SIZE+x)*4;
  normal[i]=Math.round((-.5*dx/length+.5)*255);normal[i+1]=Math.round((-.5*dy/length+.5)*255);normal[i+2]=Math.round((.5/length+.5)*255);normal[i+3]=255;
 }
 const maps={map:texture(color,SIZE,SIZE,`Station ${kind} albedo`,THREE.SRGBColorSpace),normalMap:texture(normal,SIZE,SIZE,`Station ${kind} physical normal`),roughnessMap:texture(packed,SIZE,SIZE,`Station ${kind} occlusion / roughness`)};
 for(const map of Object.values(maps)){
  map.repeat.set(1.5/metres[0],1.5/metres[1]);
  if(kind==='wall')map.offset.y=-floor/metres[1];
 }
 return maps;
}

export const STATION_CONTACT_BOUNDS=Object.freeze({minX:-323,maxX:-296,minZ:-305,maxZ:-148});
const segmentDistance=(x,z,a,b)=>{
 const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
 return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
};
function contact(){
 const width=512,height=1024,data=new Uint8Array(width*height*4),b=STATION_CONTACT_BOUNDS;
 const edge=[[-299.854,-152.040],[-298.340,-201.255],[-303.129,-201.611],[-305.136,-203.503],[-301.979,-303.891]];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const wx=b.minX+x/(width-1)*(b.maxX-b.minX),wz=b.minZ+y/(height-1)*(b.maxZ-b.minZ);
  let amount=1;
  // Static shelter visibility: strongest beside the closed wall, open at rail edge.
  if(wz< -152&&wz> -201&&wx> -306&&wx< -298)amount-=.22*THREE.MathUtils.smoothstep(wx,-306,-301);
  if(wz< -154&&wz> -301&&wx> -321&&wx< -317)amount-=.12;
  for(let i=1;i<edge.length;i++)amount-=.30*Math.exp(-segmentDistance(wx,wz,edge[i-1],edge[i])/.28);
  for(const z of [-184.9,-193])for(const px of [-300.4,-301.1])amount-=.22*Math.exp(-((wx-px)**2/.22+(wz-z)**2/.18));
  for(const px of [-305,-303.4,-301.8]){
   const dx=Math.max(0,Math.abs(wx-px)-.2),dz=Math.max(0,Math.abs(wz+151.45)-.725);
   amount-=.32*Math.exp(-(dx*dx+dz*dz)/.05);
  }
  const border=Math.min(x/(width-1),1-x/(width-1),y/(height-1),1-y/(height-1));
  amount=THREE.MathUtils.lerp(1,clamp(amount,.38,1),THREE.MathUtils.smoothstep(border,0,.01));
  const i=(y*width+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(amount*255);data[i+3]=255;
 }
 const map=texture(data,width,height,'Station static shelter and contact occlusion');map.channel=1;map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;return map;
}
export function createStationSurfaceTextures(floor=31){return {deck:surface('deck',floor),wall:surface('wall',floor),contact:contact()};}
