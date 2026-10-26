import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {spatialMeshes} from './spatial-mesh.mjs';
import {toriiInscriptionRecords} from './torii-inscription-records.mjs';

let material;
const frontTileStart=toriiInscriptionRecords.length*2;
// Two reverse tiles per source record, plus eight paired front treatments.
// The existing 8 MiB atlas accommodates 24 records without extra materials.
export const toriiInkAtlas=Object.freeze({width:2048,height:1024,columns:16,rows:4,tileWidth:128,tileHeight:256});
if(frontTileStart+16>toriiInkAtlas.columns*toriiInkAtlas.rows)throw new RangeError('Torii inscription atlas supports at most 24 records');
export const toriiInkTiles=Object.freeze([
  ...toriiInscriptionRecords.flatMap(record=>[record.donorLines.join('\n'),record.date??'']),
  ...Array.from({length:8},()=>['奉','納']).flat(),
]);
const styles=[
  {font:'"Yu Mincho", "MS Mincho", serif',weight:600,ink:'#181511',alpha:.96,size:1,align:.16,x:0},
  {font:'"Yu Mincho", "MS Mincho", serif',weight:700,ink:'#24201a',alpha:.91,size:.94,align:.25,x:1},
  {font:'"Yu Mincho", "MS Mincho", serif',weight:500,ink:'#211914',alpha:.94,size:.97,align:.12,x:-1},
  {font:'"Yu Gothic", "Meiryo", sans-serif',weight:600,ink:'#161715',alpha:.88,size:.91,align:.21,x:0},
  {font:'"Yu Mincho", "MS Mincho", serif',weight:700,ink:'#1d1814',alpha:.93,size:.96,align:.10,x:1},
  {font:'"Yu Mincho", "MS Mincho", serif',weight:400,ink:'#25211c',alpha:.90,size:.90,align:.29,x:-2},
  {font:'"Yu Gothic", "Meiryo", sans-serif',weight:500,ink:'#211d18',alpha:.95,size:.93,align:.18,x:2},
  {font:'"Yu Mincho", "MS Mincho", serif',weight:600,ink:'#151614',alpha:.89,size:.98,align:.23,x:-1},
];
const modulo=(value,length)=>((value%length)+length)%length;
// Photographed legal-form abbreviations occupy one upright square. Keep the
// source transcription literal; only painting uses the equivalent Unicode form.
function verticalGlyphs(text){return [...text.replaceAll('（有）','㈲').replaceAll('（株）','㈱')];}
function recordIndex(entry){return modulo(Number.isInteger(entry.recordIndex)?entry.recordIndex:Number.isInteger(entry.inscription)?entry.inscription:0,toriiInscriptionRecords.length);}
export function toriiInkTile(entry,side,front){
  const record=recordIndex(entry),column=side===1?1:0;
  if(front){const style=Number.isInteger(entry.inkStyle)?modulo(entry.inkStyle,styles.length):record%styles.length;return frontTileStart+style*2+column;}
  // A date is always taken from this same source record. Legacy independently
  // selected dateInscription values cannot create an invented donor/date pair.
  const tile=record*2+column;
  return toriiInkTiles[tile]?tile:-1;
}
export function toriiInkUvBounds(tile){
  if(!Number.isInteger(tile)||tile<0||tile>=toriiInkTiles.length)throw new RangeError('Unknown torii ink tile');
  const {width,height,columns,tileWidth,tileHeight}=toriiInkAtlas,column=tile%columns,row=Math.floor(tile/columns),inset=2;
  return {uMin:(column*tileWidth+inset)/width,uMax:((column+1)*tileWidth-inset)/width,
    vMin:1-((row+1)*tileHeight-inset)/height,vMax:1-(row*tileHeight+inset)/height};
}

// Pure layout keeps tategaki columns readable: the first column is on the
// right; characters proceed downwards. Glyph scale compensates the physical
// post patch rather than squeezing a long donor name into a fixed-width mark.
export function toriiInkTileLayout(tile){
  const front=tile>=frontTileStart,text=toriiInkTiles[tile];
  if(typeof text!=='string')throw new RangeError('Unknown torii ink tile');
  const styleIndex=front?Math.floor((tile-frontTileStart)/2):Math.floor(tile/2)%styles.length;
  const style=styles[styleIndex],columns=text?text.split('\n'):[],maxLength=Math.max(1,...columns.map(line=>verticalGlyphs(line).length));
  const scaleY=front?1.17:.216;
  const fontSize=Math.min(112,104/Math.max(1,columns.length),224/(maxLength*scaleY*1.04))*style.size;
  const columnWidth=104/Math.max(1,columns.length),glyphs=[];
  columns.forEach((line,column)=>{
    const chars=verticalGlyphs(line),size=fontSize*(column? .84:1),advance=size*scaleY*1.04;
    const top=front?128-advance/2:12+(232-chars.length*advance)*style.align;
    chars.forEach((char,index)=>glyphs.push({char,x:64+(columns.length-1)*columnWidth/2-column*columnWidth+style.x,
      y:top+(index+.5)*advance,size,rotate:/[ー（）()]/u.test(char)}));
  });
  return {front,role:front?'dedication':tile%2?'date':'donor',styleIndex,style,scaleY,glyphs};
}

function inkMaterial(){
  if(material)return material;
  const canvas=document.createElement('canvas');canvas.width=toriiInkAtlas.width;canvas.height=toriiInkAtlas.height;
  const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
  toriiInkTiles.forEach((text,tile)=>{
    if(!text)return;
    const layout=toriiInkTileLayout(tile),left=tile%toriiInkAtlas.columns*toriiInkAtlas.tileWidth,top=Math.floor(tile/toriiInkAtlas.columns)*toriiInkAtlas.tileHeight;
    ctx.fillStyle=layout.style.ink;ctx.globalAlpha=layout.style.alpha;
    for(const glyph of layout.glyphs){
      ctx.font=`${layout.style.weight} ${glyph.size}px ${layout.style.font}`;
      ctx.save();ctx.translate(left+glyph.x,top+glyph.y);ctx.scale(1,layout.scaleY);
      if(glyph.rotate)ctx.rotate(Math.PI/2);
      ctx.fillText(glyph.char,0,0);ctx.restore();
    }
  });
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  material=new THREE.MeshStandardMaterial({map,alphaTest:.35,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  return material;
}

// Curved ink conforms to the tapered post; no floating rectangular labels.
export function buildToriiInscriptions(root,entries,{halfSpan,bottomRadius,topRadius,bottomY,topY,small=false,frontOnly=false}){
  const geometries=[];
  function patch(entry,side,front,tile){
    if(tile<0)return;
    const low=front?(small?1.42:1.97):(small?.63:.86);
    const high=front?low+(small?.30:.40):(small?1.55:2.12);
    // A thicker post should not stretch the same painted character sideways.
    const angle=(front?1.8:1.05)/Math.max(1,entry.thickness??1);
    // A six-segment curved patch's chord must remain outside the post, too:
    // moving just its vertices 2mm out lets thicker posts occlude the ink.
    const radius=y=>((bottomRadius+(topRadius-bottomRadius)*(y-bottomY)/(topY-bottomY))*(entry.thickness??1))/Math.cos(angle/12)+.001;
    const geo=new THREE.CylinderGeometry(radius(high),radius(low),high-low,6,1,true,(front?Math.PI:0)-angle/2,angle);
    const uv=geo.attributes.uv,bounds=toriiInkUvBounds(tile);
    for(let i=0;i<uv.count;i++)uv.setXY(i,bounds.uMin+uv.getX(i)*(bounds.uMax-bounds.uMin),bounds.vMin+uv.getY(i)*(bounds.vMax-bounds.vMin));
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
