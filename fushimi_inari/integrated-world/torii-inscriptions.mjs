import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {spatialMeshes} from './spatial-mesh.mjs';
import {dedicationTexts} from './mountain-torii-profile.mjs';

let material;
function inkMaterial(){
  if(material)return material;
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
  [...dedicationTexts,'奉','納'].forEach((text,tile)=>{
    ctx.fillStyle=tile%3===0?'#393029':'#171512';
    ctx.font=`${tile%2?'600':'400'} 112px "Yu Mincho", "MS Mincho", serif`;
    if(text.length===1){
      ctx.save();ctx.scale(1,7);ctx.fillText(text,tile*128+64,512/7,116);ctx.restore();
    }else [...text].forEach((char,j)=>ctx.fillText(char,tile*128+64,80+j*864/(text.length-1),116));
  });
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  material=new THREE.MeshStandardMaterial({map,alphaTest:.35,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  return material;
}

// Curved ink conforms to the tapered post; no floating rectangular labels.
export function buildToriiInscriptions(root,entries,{halfSpan,bottomRadius,topRadius,bottomY,topY,small=false,frontOnly=false}){
  const geometries=[];
  function patch(entry,side,front,tile){
    const low=front?(small?1.64:2.22):(small?.63:.86);
    const high=front?low+(small?.16:.25):(small?1.55:2.12);
    const radius=y=>(bottomRadius+(topRadius-bottomRadius)*(y-bottomY)/(topY-bottomY))*(entry.thickness??1)+.002;
    const angle=front?1.15:.9;
    const geo=new THREE.CylinderGeometry(radius(high),radius(low),high-low,6,1,true,(front?Math.PI:0)-angle/2,angle);
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(tile+uv.getX(i))/16,uv.getY(i));
    geo.translate(side*halfSpan,(low+high)/2,0);geo.applyMatrix4(entry.m);geometries.push(geo);
  }
  for(const entry of entries)for(const side of [-1,1]){
    patch(entry,side,true,side===1?9:8);
    if(!frontOnly)patch(entry,side,false,side===1?entry.dateInscription:entry.inscription);
  }
  if(!geometries.length)return;
  const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
  const chunks=spatialMeshes(merged,inkMaterial(),80);chunks.name='Torii dedication ink';root.add(chunks);merged.dispose();
}
