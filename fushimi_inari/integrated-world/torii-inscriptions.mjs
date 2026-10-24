import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {spatialMeshes} from './spatial-mesh.mjs';
import {dedicationTexts} from './mountain-torii-profile.mjs';

let material;
// A shrine torii maker documents the paired front characters and the donor /
// date reverse: https://ameblo.jp/hasegawa-torii/entry-10897300628.html . Keep
// that distinction rather than inventing extra front donor inscriptions.
// Reverse strings remain the existing interpretive profile, not transcriptions.
export const toriiInkTiles=Object.freeze([...dedicationTexts,...Array.from({length:4},()=>['奉','納']).flat()]);
export function toriiInkTile(entry,side,front){
  if(front){const style=Number.isInteger(entry.inscription)?((entry.inscription%4)+4)%4:0;return 8+style*2+(side===1?1:0);}
  const tile=side===1?entry.dateInscription:entry.inscription;
  return Number.isInteger(tile)&&tile>=0&&tile<8?tile:side===1?4:0;
}
function inkMaterial(){
  if(material)return material;
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
  toriiInkTiles.forEach((text,tile)=>{
    const style=tile>=8?Math.floor((tile-8)/2):tile%4;
    ctx.fillStyle=['#181511','#24201a','#211914','#161715'][style];
    ctx.font=`${[600,700,500,600][style]} ${[112,116,110,114][style]}px "Yu Mincho", "MS Mincho", serif`;
    if(text.length===1){
      // Atlas tiles are tall; this compensates UV aspect without stretching
      // the physical glyph into the old narrow repeated mark. Four subtly
      // different weights/positions represent hand-painted variation only.
      ctx.save();ctx.scale(1,4.5);ctx.fillText(text,tile*128+64+[0,1,-1,0][style],512/4.5,116);ctx.restore();
    }else [...text].forEach((char,j)=>ctx.fillText(char,tile*128+64,84+j*856/(text.length-1),116));
  });
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  material=new THREE.MeshStandardMaterial({map,alphaTest:.35,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  return material;
}

// Curved ink conforms to the tapered post; no floating rectangular labels.
export function buildToriiInscriptions(root,entries,{halfSpan,bottomRadius,topRadius,bottomY,topY,small=false,frontOnly=false}){
  const geometries=[];
  function patch(entry,side,front,tile){
    const low=front?(small?1.42:1.97):(small?.63:.86);
    const high=front?low+(small?.30:.40):(small?1.55:2.12);
    const angle=front?1.8:1.05;
    // A six-segment curved patch's chord must remain outside the post, too:
    // moving just its vertices 2mm out lets thicker posts occlude the ink.
    const radius=y=>((bottomRadius+(topRadius-bottomRadius)*(y-bottomY)/(topY-bottomY))*(entry.thickness??1))/Math.cos(angle/12)+.001;
    const geo=new THREE.CylinderGeometry(radius(high),radius(low),high-low,6,1,true,(front?Math.PI:0)-angle/2,angle);
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(tile+uv.getX(i))/16,uv.getY(i));
    geo.translate(side*halfSpan,(low+high)/2,0);geo.applyMatrix4(entry.m);geometries.push(geo);
  }
  for(const entry of entries)for(const side of [-1,1]){
    patch(entry,side,true,toriiInkTile(entry,side,true));
    if(!frontOnly)patch(entry,side,false,toriiInkTile(entry,side,false));
  }
  if(!geometries.length)return;
  const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
  const chunks=spatialMeshes(merged,inkMaterial(),80);chunks.name='Torii dedication ink';root.add(chunks);merged.dispose();
}
