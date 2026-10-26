import * as THREE from 'three';

// Static fields shared by every context facade; one tile spans 1.5 metres.
// These affect finish only, leaving mapped parcel silhouettes and tints intact.
function finishTexture(name,metal=false){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let seed=Math.imul(x+37,374761393)^Math.imul(y+71,668265263);
  seed=Math.imul(seed^(seed>>>13),1274126177);
  const grain=((seed^(seed>>>16))>>>0)/4294967295;
  const value=Math.round(243+grain*12+(metal?Math.sin(y*Math.PI/4)*1.5:0));
  const offset=(y*size+x)*4;
  data[offset]=data[offset+1]=data[offset+2]=Math.min(255,value);data[offset+3]=255;
 }
 const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
 texture.name=name;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.anisotropy=4;texture.needsUpdate=true;
 return texture;
}

export function createKeihanContextMaterials(){
 const plasterFinish=finishTexture('Keihan context plaster finish');
 const shutterFinish=finishTexture('Keihan context shutter finish',true);
 const palette={
  plaster:new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.96,roughnessMap:plasterFinish,bumpMap:plasterFinish,bumpScale:.0007}),
  roof:new THREE.MeshStandardMaterial({color:'#555d5b',roughness:.94}),
  timber:new THREE.MeshStandardMaterial({color:'#564a3c',roughness:.88}),
  glass:new THREE.MeshStandardMaterial({color:'#526b6b',roughness:.43,metalness:.14}),
  shutter:new THREE.MeshStandardMaterial({color:'#b1b0a4',roughness:.85,roughnessMap:shutterFinish,bumpMap:shutterFinish,bumpScale:.0002}),
  cloth:new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.97})
 };
 let disposed=false;
 return {palette,textures:[plasterFinish,shutterFinish],dispose(){
  if(disposed)return;disposed=true;
  for(const material of Object.values(palette))material.dispose();
  plasterFinish.dispose();shutterFinish.dispose();
 }};
}

// Call after geometry rotation/translation, before merging. Box/plane normals
// identify the facade tangent, including oblique mapped street frontages.
export function applyMetricUVs(geometry){
 const position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
 if(!position||!normal)throw new TypeError('Metric facade UVs require positions and normals');
 const uv=new Float32Array(position.count*2);
 for(let i=0;i<position.count;i++){
  const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i),length=Math.hypot(nx,nz);
  uv[i*2]=(Math.abs(ny)>.9?position.getX(i):(position.getX(i)*nz-position.getZ(i)*nx)/length)/1.5;
  uv[i*2+1]=(Math.abs(ny)>.9?position.getZ(i):position.getY(i))/1.5;
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 return geometry;
}
