import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

function brushedFinish(){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=((x*17+y*113)^(y*73))&31,v=193+(y%7)*5+n*.5,i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
 }
 const map=new THREE.DataTexture(data,size,size);map.name='Shared gate brushed finish';
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(3,3);map.generateMipmaps=true;
 map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=4;map.needsUpdate=true;
 return map;
}

function roundedCase(width,depth,height,radius){
 const shape=new THREE.Shape(),x=-width/2,z=-depth/2;
 shape.moveTo(x+radius,z);shape.lineTo(x+width-radius,z);
 shape.absarc(x+width-radius,z+radius,radius,-Math.PI/2,0,false);
 shape.absarc(x+width-radius,z+depth-radius,radius,0,Math.PI/2,false);
 shape.absarc(x+radius,z+depth-radius,radius,Math.PI/2,Math.PI,false);
 shape.absarc(x+radius,z+radius,radius,Math.PI,Math.PI*1.5,false);
 return new THREE.ExtrudeGeometry(shape,{depth:height-.008,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1,steps:1,curveSegments:3}).rotateX(-Math.PI/2);
}

// Original fittings within the existing housings, not a surveyed machine model.
// References establish station context; seams, readers and dimensions are inferred.
export function buildKeihanFareGateDetail(floor,z){
 const group=new THREE.Group();group.name='Keihan High gate fittings';group.visible=false;
 const map=brushedFinish(),metal=new THREE.MeshStandardMaterial({name:'Gate brushed stainless panels',color:'#b2bab9',metalness:.82,roughness:.48,roughnessMap:map});
 const dark=new THREE.MeshStandardMaterial({name:'Gate reader casing and service joints',color:'#17252d',roughness:.44,metalness:.16});
 const glass=new THREE.MeshPhysicalMaterial({name:'Gate opaque reader glass',color:'#173c47',metalness:.04,roughness:.14,clearcoat:.35,clearcoatRoughness:.22,envMapIntensity:.8});
 const indicator=new THREE.MeshBasicMaterial({name:'Gate card glyph and status',vertexColors:true,toneMapped:false});
 const parts=staticParts(group),colors={teal:new THREE.Color('#70cbbd'),white:new THREE.Color('#d4e8df')};
 const mark=(geometry,color)=>{
  const count=geometry.attributes.position.count,data=new Float32Array(count*3),c=colors[color];
  for(let i=0;i<count;i++)data.set([c.r,c.g,c.b],i*3);
  geometry.setAttribute('color',new THREE.BufferAttribute(data,3));parts.put(geometry,indicator);
 };
 for(const x of [-305,-303.4,-301.8]){
  const bodyZ=z-.05;
  for(const side of [-1,1]){
   // Skins stand only 1–2 mm proud of the existing .40 m housing width.
   parts.put(new THREE.PlaneGeometry(1.36,.76).rotateY(side*Math.PI/2).translate(x+side*.201,floor+.46,bodyZ),metal);
   for(const edge of [-1,1]){
    parts.box(.001,.58,.006,x+side*.2015,floor+.45,bodyZ+edge*.49,dark);
    parts.box(.001,.006,.98,x+side*.2015,floor+.45+edge*.29,bodyZ,dark);
   }
   for(const along of [-.48,.48])for(const height of [.18,.72]){
    const screw=new THREE.CylinderGeometry(.007,.007,.001,6).rotateZ(Math.PI/2).translate(x+side*.2015,floor+height,bodyZ+along);parts.put(screw,metal);
   }
   // A recessed black aperture and projecting upper/lower lips give the ticket
   // opening a section. The physical access logic remains in the original gate.
   parts.box(.225,.026,.002,x,floor+.77,bodyZ+side*.726,dark);
   for(const edge of [-1,1])parts.box(.245,.005,.004,x,floor+.77+edge*.019,bodyZ+side*.725,metal);
   parts.box(.24,.055,.003,x,floor+.875,bodyZ+side*.726,glass);
   mark(new THREE.BoxGeometry(.11,.007,.001).translate(x,floor+.875,bodyZ+side*.728),'teal');
  }
  parts.put(roundedCase(.29,.36,.065,.025).translate(x,floor+.975,z+.30),dark);
  parts.put(new THREE.BoxGeometry(.235,.006,.275).translate(x,floor+1.037,z+.30),glass);
  // Low radiance graphic geometry rather than a light or an extra texture.
  mark(new THREE.TorusGeometry(.075,.004,5,20).rotateX(-Math.PI/2).translate(x,floor+1.042,z+.30),'teal');
  for(const side of [-1,1]){
   mark(new THREE.BoxGeometry(.066,.001,.003).translate(x,floor+1.043,z+.30+side*.023),'white');
   mark(new THREE.BoxGeometry(.003,.001,.046).translate(x+side*.033,floor+1.043,z+.30),'white');
  }
  mark(new THREE.BoxGeometry(.042,.001,.002).translate(x-.003,floor+1.043,z+.292),'white');
 }
 const stats={...parts.flush(),textures:1,textureSize:128,draws:0,extraLights:0,source:'https://fushimiinari-guide.com/fushimiinari-station/',limits:'Interpretive fittings on the existing three housings; no surveyed gate manufacturer or dimensions.'};
 group.matrixAutoUpdate=false;
 for(const mesh of group.children){mesh.castShadow=false;mesh.receiveShadow=!mesh.material.isMeshBasicMaterial;mesh.matrixAutoUpdate=false;mesh.geometry.computeBoundingSphere();mesh.geometry.computeBoundingBox();}
 let disposed=false;
 return {group,stats,dispose(){if(disposed)return;disposed=true;group.visible=false;stats.draws=0;group.removeFromParent();for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}map.dispose();}};
}
