import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original hand-drawn labels, informed by manufacturers' product pages and
// package photographs. No photographed label pixels or traced logos are used.
export const DRINK_PRODUCTS=Object.freeze([
 Object.freeze({id:'green-tea',name:'Green tea',color:'#81a85c',vessel:'bottle'}),
 Object.freeze({id:'water',name:'Water',color:'#78b7d5',vessel:'bottle'}),
 Object.freeze({id:'coffee',name:'Coffee',color:'#a87548',vessel:'can'}),
 Object.freeze({id:'citrus',name:'Citrus soda',color:'#e5b94e',vessel:'bottle'}),
]);

function drawLabels(c){
 c.textAlign='center';c.textBaseline='middle';
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const text=(value,x,y,size,color='#142322',font='sans-serif',width=230)=>{c.fillStyle=color;c.font=`bold ${size}px ${font}`;c.fillText(value,x,y,width);};
 const disk=(color,x,y,r)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 // The unwrapped circumference is much wider than the label is tall. Counter
 // that physical aspect ratio while drawing, so glyphs and circles are not
 // stretched on the curved face. Backgrounds remain continuous at the seam.
 const front=(center,squeeze,draw)=>{c.save();c.translate(center,0);c.scale(squeeze,1);c.translate(-center,0);draw();c.restore();};
 // Oi Ocha: long green sleeve with a green cap and amber tea showing above.
 rect('#76b83e',0,0,256,512);rect('#9bd15c',0,18,256,44);rect('#68a833',0,459,256,20);
 for(let x=10;x<256;x+=8)rect('rgba(255,255,255,.035)',x,70,1,376);
 front(128,.292,()=>{
  text('伊藤園',128,43,34,'#285b25','serif');disk('#d64b32',53,110,27);text('日本',53,110,19,'#fff7db','serif',48);
  for(const [i,ch] of Array.from('お〜い').entries())text(ch,180,124+i*55,62,'#154622','serif',90);
  for(const [i,ch] of Array.from('お茶').entries())text(ch,79,242+i*69,72,'#154622','serif',90);
  text('Oi Ocha',128,421,38,'#285c2c','serif');text('GREEN TEA',128,452,19,'#305d2d');
 });
 // Oishii Mizu: short white/blue sleeve and a cool water-ring motif.
 rect('#f5fbfa',256,0,256,512);rect('#398eb8',256,75,256,340);rect('#d4eef1',256,91,256,305);
 front(384,.169,()=>{
  disk('#9ed5e3',384,246,177);disk('#c5e8ec',384,246,135);disk('#edf9f7',384,246,92);
  text('Asahi',384,54,44,'#2476a5');text('おいしい水',384,139,44,'#154f80','serif');
  text('水',384,253,142,'#168b9f','serif');text('天然水',384,353,48,'#145b8b','serif');
  text('NATURAL WATER',384,400,20,'#236683');text('600 ml',384,461,28,'#1677a1');
 });
 // BOSS Black: original typographic treatment on printed black metal.
 rect('#14191a',512,0,256,512);rect('#bf9b48',512,18,256,9);rect('#bf9b48',512,485,256,9);
 front(640,.272,()=>{
  rect('#bd9845',523,45,14,416);text('SUNTORY COFFEE',640,70,25,'#e7dfcc');text('BOSS',640,145,86,'#f3f1e9','serif');
  disk('#e1d8c0',640,226,49);disk('#303631',640,226,39);text('COFFEE',640,226,17,'#eee4c9',undefined,76);
  text('BLACK',640,319,77,'#f2f1e8','serif');text('無糖',640,390,40,'#e4e0d2','serif');text('185 g',640,449,24,'#d4cbb8');
 });
 // Chelate Lemon: a white label on a small green bottle, with a lemon graphic.
 rect('#f6f5e8',768,0,256,512);rect('#e9eed7',768,458,256,54);
 front(896,.224,()=>{
  text('POKKA',896,52,30,'#a8432e');disk('#f3d329',896,174,90);
  c.fillStyle='#71a333';c.beginPath();c.ellipse(957,108,14,28,.7,0,Math.PI*2);c.fill();
  rect('#68a13f',884,126,24,94);rect('#68a13f',849,161,94,24);
  text('キレートレモン',896,293,45,'#252f28','serif');text('Vitamin C',896,353,38,'#5d963e');
  text('Sparkling',896,408,29,'#547e41','serif');text('LEMON',896,459,26,'#6b8649');
 });
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

function capGeometry(radius,height,y,radial,detail){
 const geometry=new THREE.CylinderGeometry(radius,radius,height,radial);
 if(detail){const vertices=geometry.attributes.position;for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i),z=vertices.getZ(i);
  if(Math.hypot(x,z)>radius*.8&&Math.cos(Math.atan2(x,z)*8)<0){vertices.setX(i,x*.97);vertices.setZ(i,z*.97);}
 }geometry.computeVertexNormals();}
 return geometry.translate(0,y,0);
}

function vesselParts(product,index,display=false){
 const pieces=[],put=(geometry,key,color)=>pieces.push({geometry,key,color});
 const radial=display?8:12;
 if(product.vessel==='bottle'){
  const citrus=product.id==='citrus',water=product.id==='water',radius=citrus?.0235:water?.031:.033;
  const body=citrus?'#52742f':water?'#d0e3e6':'#c2a964';
  const cap=citrus?'#e3c538':water?'#3b91ca':'#a1cc42';
  let points,labelBottom,labelHeight;
  if(citrus){
   // The 155 ml glass bottle has a short shoulder and a small yellow crown cap.
   points=[[.016,0],[.022,.002],[radius,.005],[radius,.082],[.0225,.091],[.019,.099],[.013,.106],[.012,.110],[.012,.113]];
   labelBottom=.016;labelHeight=.066;
  }else{
   // PET shoulder, neck ring and gently molded lower grip/base.
   const base=water?(display?[[.020,0],[.027,.002],[radius,.006],[radius*.96,.021],[radius,.027],[radius*.96,.039],[radius,.052]]:[[.020,0],[.027,.002],[radius,.006],[radius*.97,.010],[radius,.015],[radius*.96,.021],[radius,.027],[radius*.96,.033],[radius,.039],[radius*.97,.045],[radius,.052]]):
    [[.020,0],[.029,.002],[radius,.006],[radius*.96,.012],[radius,.018],[radius,.026]];
   points=[...base,[radius,.141],[radius*.98,.149],[radius*.89,.157],[.022,.172],[.014,.180],[.014,.184]];
   labelBottom=water?.073:.022;labelHeight=water?.066:.121;
  }
  put(new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),radial),'drinkBody',body);
  const capRadius=citrus?.013:.015,capHeight=citrus?.010:.015,capY=citrus?.117:.1915;
  put(capGeometry(capRadius,capHeight,capY,display?radial:16,!display),display?'drinkBody':'drinkCap',cap);
  // The cap hides this recessed opening until the first sip; reuse the body batch.
  if(!display){const [neckRadius,neckY]=points.at(-1);put(new THREE.CircleGeometry(neckRadius*.86,radial).rotateX(-Math.PI/2).translate(0,neckY-.0015,0),'drinkBody','#14251b');}
  const label=new THREE.CylinderGeometry(radius+.00035,radius+.00035,labelHeight,radial,1,true).rotateY(Math.PI).translate(0,labelBottom+labelHeight/2,0);
  put(applyAtlas(label,index),'drinkLabel');
 }else{
  const radius=.026;
  // Rolled metal rims, a subtly inset lid and a printed, nonmetallic sleeve.
  const points=[[.022,0],[.025,.002],[radius,.006],[radius,.097],[.024,.102],[.025,.104],[.023,.105]];
  put(new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),radial),'drinkMetal');
  put(new THREE.CylinderGeometry(.0225,.0225,.0015,radial).translate(0,.1055,0),'drinkMetal');
  if(!display)put(new THREE.RingGeometry(.0035,.006,8).scale(.75,1,1).rotateX(-Math.PI/2).translate(0,0,.003),'drinkTab');
  const label=new THREE.CylinderGeometry(radius+.00035,radius+.00035,.089,radial,1,true).rotateY(Math.PI).translate(0,.052,0);
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
 for(const [key,parts] of byMaterial){
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const material=key==='drinkCap'?materials.drinkBody:key==='drinkTab'?materials.drinkMetal:materials[key];
  const mesh=new THREE.Mesh(merged,material);mesh.name=key;if(key==='drinkTab')mesh.position.y=.107;template.add(mesh);
 }
 return template;
}

// One resource owner supplies immutable templates. Callers may remove clones,
// but only this owner disposes geometries, materials and the shared atlas.
export function createDrinkVesselResources({document:doc=globalThis.document}={}){
 const atlas=createAtlas(doc),materials={
  drinkBody:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:0}),
  drinkMetal:new THREE.MeshStandardMaterial({color:'#c7cbc7',roughness:.3,metalness:.72}),
  drinkLabel:new THREE.MeshStandardMaterial({map:atlas,roughness:.66}),
 };
 const templates=new Map(DRINK_PRODUCTS.map((product,index)=>[product.id,makeTemplate(product,index,materials)]));
 const displayTemplates=new Map(DRINK_PRODUCTS.map((product,index)=>[product.id,makeTemplate(product,index,materials,true)]));let disposed=false;
 return {atlas,materials,
  create(productId){
   const template=disposed?null:templates.get(productId);if(!template)return null;
   const model=template.clone(true),cap=model.getObjectByName('drinkCap'),tab=model.getObjectByName('drinkTab');
   // Closure geometry/materials are shared; updates only change transforms.
   model.userData.setOpenProgress=value=>{
    const progress=Math.max(0,Math.min(1,Number(value)||0));
    if(cap){cap.position.x=.012*progress;cap.position.y=.014*progress;cap.rotation.y=-Math.PI*progress;cap.visible=progress<1;}
    if(tab){tab.rotation.x=-.85*progress;tab.position.y=.107+.001*progress;}
   };
   return model;
  },
  append(batch,productId,{position=[0,0,0]}={}){
   const template=disposed?null:displayTemplates.get(productId);if(!template)return false;
   for(const mesh of template.children){const key=mesh.name==='drinkBody'?'color':mesh.name==='drinkMetal'?'metal':'drinkLabel';batch.put(mesh.geometry.clone().translate(...position),key);}
   return true;
  },
  dispose(){if(disposed)return;disposed=true;for(const collection of [templates,displayTemplates]){for(const template of collection.values())template.traverse(o=>o.geometry?.dispose());collection.clear();}for(const material of Object.values(materials))material.dispose();atlas.dispose();}
 };
}
