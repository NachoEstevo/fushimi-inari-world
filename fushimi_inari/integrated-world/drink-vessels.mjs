import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original hand-drawn labels, informed by the manufacturers' product pages.
// These are scene interpretations, not downloaded label photographs.
export const DRINK_PRODUCTS=Object.freeze([
 Object.freeze({id:'green-tea',name:'Green tea',color:'#81a85c',vessel:'bottle'}),
 Object.freeze({id:'water',name:'Water',color:'#78b7d5',vessel:'bottle'}),
 Object.freeze({id:'coffee',name:'Coffee',color:'#a87548',vessel:'can'}),
 Object.freeze({id:'citrus',name:'Citrus soda',color:'#e5b94e',vessel:'bottle'}),
]);

function drawLabels(c){
 c.textAlign='center';c.textBaseline='middle';
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const text=(value,x,y,size,color='#142322',font='sans-serif')=>{c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.fillText(value,x,y);};
 // Oi Ocha: a green sleeve and vertically arranged dark calligraphy.
 rect('#5aab31',0,0,256,512);rect('#83c94f',0,35,256,32);rect('#4b972e',0,463,256,22);
 text('伊藤園',128,58,21,'#174b26','serif');text('純国産茶葉',196,170,16,'#1a5a2b','serif');
 for(const [i,ch] of Array.from('お〜いお茶').entries())text(ch,125,130+i*46,45,'#103b22','serif');
 text('Oi Ocha',128,405,23,'#153c21','serif');text('GREEN TEA  600ml',128,438,13,'#245927');
 // Oishii Mizu: cool white and blue mineral-water label with mountains.
 rect('#e8f6f8',256,0,256,512);rect('#298bc1',256,0,256,50);rect('#c4e8ef',256,408,256,104);
 c.fillStyle='#a8dce9';c.beginPath();c.arc(384,234,98,0,Math.PI*2);c.fill();
 c.fillStyle='#d7f1f3';c.beginPath();c.arc(384,234,75,0,Math.PI*2);c.fill();
 text('Asahi',384,79,25,'#126d9c');text('おいしい水',384,135,29,'#1678a4','serif');text('水',384,233,79,'#0587b4','serif');
 text('天然水',384,335,33,'#136e9d','serif');text('六 甲',384,379,22,'#316986','serif');text('NATURAL MINERAL WATER',384,448,12,'#31778d');text('600 ml',384,480,15,'#167ca1');
 // BOSS: black, cream and gold, with a simple original coffee medallion.
 rect('#151b1e',512,0,256,512);rect('#bca87a',512,12,256,10);rect('#bca87a',512,488,256,10);
 text('SUNTORY COFFEE',640,70,16,'#e3dac0');text('BOSS',640,145,52,'#f3ead6','serif');
 c.fillStyle='#e1d8c0';c.beginPath();c.arc(640,249,55,0,Math.PI*2);c.fill();
 c.fillStyle='#29302e';c.beginPath();c.arc(640,249,39,0,Math.PI*2);c.fill();
 text('COFFEE',640,249,16,'#eee4c9');text('BLACK',640,360,36,'#f1e8d4');text('無糖',640,416,24,'#dfd5b9','serif');
 // Chelate Lemon: a lemon disk over the distinctive green diagonal sash.
 rect('#f7f5e8',768,0,256,512);rect('#f7d542',768,0,256,50);rect('#ecd02e',768,449,256,63);
 text('POKKA',896,72,18,'#b6412d');c.fillStyle='#f4d52d';c.beginPath();c.arc(896,176,61,0,Math.PI*2);c.fill();
 c.fillStyle='#74a92e';c.beginPath();c.ellipse(945,133,12,25,.7,0,Math.PI*2);c.fill();
 text('キレートレモン',896,267,26,'#26382c','serif');
 c.fillStyle='#328747';c.beginPath();c.moveTo(768,339);c.lineTo(1024,305);c.lineTo(1024,407);c.lineTo(768,441);c.closePath();c.fill();
 text('Sparkling',896,366,30,'#fffbea','serif');text('LEMON  500ml',896,475,15,'#495c27');
}

function createAtlas(doc){
 if(!doc?.createElement){const t=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);t.needsUpdate=true;return t;}
 const canvas=doc.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');
 if(!c){const t=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);t.needsUpdate=true;return t;}
 drawLabels(c);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}

function applyAtlas(geometry,index){
 const uv=geometry.attributes.uv;
 // Leave a gutter between neighboring products at lower mip levels.
 for(let i=0;i<uv.count;i++)uv.setX(i,(index+.015+uv.getX(i)*.97)/4);
 return geometry;
}

function vesselParts(product,index,display=false){
 const pieces=[],put=(geometry,key,color)=>pieces.push({geometry,key,color});
 const radial=display?8:10;
 if(product.vessel==='bottle'){
  const radius=product.id==='water'?.031:.033;
  const amber=product.id==='green-tea'?'#ba9953':product.id==='water'?'#d9e8e7':'#e0c65a';
  const cap=product.id==='green-tea'?'#8cbc3b':product.id==='water'?'#398acb':'#e7e9e1';
  // Molded base, cylindrical labeled portion, rounded shoulder and neck.
  const base=product.id==='water'&&!display?[[.020,0],[radius*.94,.003],[radius,.009],[radius*.96,.016],[radius,.020],[radius*.96,.026],[radius,.030],[radius*.96,.036],[radius,.040]]:
   display?[[.020,0],[radius,.009]]:[[.020,0],[radius*.94,.003],[radius,.009],[radius*.96,.016],[radius,.023]];
  const points=[...base,[radius,.137],[radius*.98,.147],[radius*.90,.155],[.022,.169],...(display?[]:[[.015,.178]]),[.014,.184]];
  put(new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),radial),'drinkBody',amber);
  const capGeometry=new THREE.CylinderGeometry(.015,.015,.015,display?radial:16);
  if(!display){const vertices=capGeometry.attributes.position;for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i);if(Math.hypot(x,z)>.01&&Math.cos(Math.atan2(x,z)*8)<0){vertices.setX(i,x*.975);vertices.setZ(i,z*.975);}}capGeometry.computeVertexNormals();}
  put(capGeometry.translate(0,.1915,0),'drinkBody',cap);
  const labelHeight=product.id==='water'?.085:.109,labelBottom=product.id==='water'?.05:.0255;
  const label=new THREE.CylinderGeometry(radius+.0004,radius+.0004,labelHeight,radial,1,true).rotateY(Math.PI).translate(0,labelBottom+labelHeight/2,0);
  put(applyAtlas(label,index),'drinkLabel');
 }else{
  const radius=.026;
  const points=[[.022,0],[.025,.002],[radius,.006],[radius,.097],[.024,.102],[.025,.104],[.023,.105]];
  put(new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),radial),'drinkMetal');
  put(new THREE.CylinderGeometry(.0225,.0225,.0015,radial).translate(0,.1055,0),'drinkMetal');
  if(!display)put(new THREE.RingGeometry(.0035,.006,8).scale(.75,1,1).rotateX(-Math.PI/2).translate(0,.107,.003),'drinkMetal');
  const label=new THREE.CylinderGeometry(radius+.0004,radius+.0004,.089,radial,1,true).rotateY(Math.PI).translate(0,.052,0);
  put(applyAtlas(label,index),'drinkLabel');
 }
 return pieces;
}

function makeTemplate(product,index,materials,display=false){
 const byMaterial=new Map();
 for(const {geometry:source,key,color} of vesselParts(product,index,display)){
  const geometry=source.index?source.toNonIndexed():source;if(geometry!==source)source.dispose();
  if(color){const c=new THREE.Color(color),values=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(values,3));}
  if(!byMaterial.has(key))byMaterial.set(key,[]);byMaterial.get(key).push(geometry);
 }
 const template=new THREE.Group();template.name=`Drink ${product.id}`;template.userData.productId=product.id;
 for(const [key,parts] of byMaterial){const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(merged,materials[key]);mesh.name=key;template.add(mesh);}
 return template;
}

// One resource owner supplies immutable templates. Callers may remove clones,
// but only this owner disposes geometries, materials and the shared atlas.
export function createDrinkVesselResources({document:doc=globalThis.document}={}){
 const atlas=createAtlas(doc),materials={
  drinkBody:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.03}),
  drinkMetal:new THREE.MeshStandardMaterial({color:'#c7cbc7',roughness:.3,metalness:.72}),
  drinkLabel:new THREE.MeshStandardMaterial({map:atlas,roughness:.48}),
 };
 const templates=new Map(DRINK_PRODUCTS.map((product,index)=>[product.id,makeTemplate(product,index,materials)]));
 const displayTemplates=new Map(DRINK_PRODUCTS.map((product,index)=>[product.id,makeTemplate(product,index,materials,true)]));let disposed=false;
 return {atlas,materials,
  create(productId){return disposed?null:templates.get(productId)?.clone(true)??null;},
  append(batch,productId,{position=[0,0,0]}={}){
   const template=disposed?null:displayTemplates.get(productId);if(!template)return false;
   for(const mesh of template.children){const key=mesh.name==='drinkBody'?'color':mesh.name==='drinkMetal'?'metal':'drinkLabel';batch.put(mesh.geometry.clone().translate(...position),key);}
   return true;
  },
  dispose(){if(disposed)return;disposed=true;for(const collection of [templates,displayTemplates]){for(const template of collection.values())template.traverse(o=>o.geometry?.dispose());collection.clear();}for(const material of Object.values(materials))material.dispose();atlas.dispose();}
 };
}
