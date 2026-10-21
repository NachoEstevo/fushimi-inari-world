import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const material=(color,roughness=.8)=>new THREE.MeshStandardMaterial({color,roughness});
const sphere=new THREE.SphereGeometry(1,24,18);
function add(g,geo,m,pos=[0,0,0],scale=[1,1,1]){const o=new THREE.Mesh(geo,m);o.position.set(...pos);o.scale.set(...scale);g.add(o);return o;}
const oval=(g,m,p,s)=>add(g,sphere,m,p,s);
// Elliptical rings form reference-informed silhouettes and continuous clothing.
function loft(rings,segments=24){
  const vertices=[],indices=[];
  for(const [x,y,z,rx,rz] of rings)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function cord(g,m,points,radius=.006){return add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false),m);}
function consolidate(g){
  g.updateMatrixWorld(true);const buckets=new Map();
  g.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);
    if(!geo.attributes.uv){const p=geo.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)*2,p.getY(i)*2);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
    const list=buckets.get(o.material)??[];const expanded=geo.index?geo.toNonIndexed():geo;if(expanded!==geo)geo.dispose();list.push(expanded);buckets.set(o.material,list);});
  g.clear();for(const [m,geos] of buckets){const joined=mergeGeometries(geos,false),o=add(g,joined,m);o.castShadow=true;o.receiveShadow=true;for(const geo of geos)geo.dispose();}return g;
}
let stoneMaterial;
function stone(){
  if(stoneMaterial)return stoneMaterial;
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),data=ctx.createImageData(256,256);let seed=31;
  for(let i=0;i<data.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296*24;data.data[i]=178+n;data.data[i+1]=173+n;data.data[i+2]=158+n;data.data[i+3]=255;}ctx.putImageData(data,0,0);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,2);
  stoneMaterial=new THREE.MeshStandardMaterial({color:'#c7c3b5',map:texture,bumpMap:texture,bumpScale:.008,roughness:.95});return stoneMaterial;
}
export function createKitsune(){
  const g=new THREE.Group(),s=stone(),recess=material('#59574d'),cloth=material('#b93827'),hem=material('#d66744');
  // Long upright chest, seated haunches, paired straight forelegs.
  add(g,loft([[0,.05,.10,.18,.18],[0,.17,.10,.30,.29],[0,.42,.12,.31,.29],[0,.67,.06,.23,.23],[0,.92,-.02,.17,.17],[0,1.20,-.07,.14,.14],[0,1.34,-.08,.12,.12]]),s);
  for(const side of [-1,1]){
    oval(g,s,[side*.21,.29,.13],[.13,.23,.18]);
    add(g,loft([[side*.16,.04,-.18,.075,.10],[side*.16,.18,-.18,.068,.08],[side*.17,.48,-.15,.06,.07],[side*.145,.79,-.10,.075,.085]]),s);
    oval(g,s,[side*.16,.055,-.23],[.09,.055,.15]);
    for(const dx of [-.035,0,.035])cord(g,recess,[[side*.16+dx,.066,-.37],[side*.16+dx,.084,-.31]],.002);
  }
  // Narrow skull with long tapered muzzle, not a round cat face.
  add(g,loft([[0,1.24,-.12,.065,.08],[0,1.31,-.085,.13,.14],[0,1.42,-.06,.15,.16],[0,1.51,-.025,.12,.13],[0,1.56,0,.035,.04]]),s);
  const muzzle=add(g,loft([[0,0,0,.10,.075],[0,.12,0,.074,.055],[0,.25,0,.035,.03]],20),s,[0,1.325,-.19]);muzzle.rotation.x=-Math.PI/2;
  oval(g,recess,[0,1.33,-.445],[.034,.021,.021]);
  for(const side of [-1,1]){
    add(g,loft([[side*.115,1.49,-.04,.085,.075],[side*.15,1.64,-.015,.062,.052],[side*.175,1.79,.008,.004,.004]],16),s);
    const inner=add(g,new THREE.ShapeGeometry(new THREE.Shape().moveTo(-.039,0).lineTo(.014,.19).lineTo(.045,.015).closePath()),recess,[side*.14,1.54,-.075]);inner.rotation.z=-side*.14;
    const eye=oval(g,recess,[side*.136,1.416,-.227],[.037,.012,.012]);eye.rotation.z=-side*.25;
    cord(g,s,[[side*.105,1.45,-.232],[side*.146,1.45,-.213],[side*.17,1.425,-.18]],.009);
    cord(g,recess,[[side*.04,1.275,-.432],[side*.09,1.273,-.34],[side*.13,1.29,-.25]],.0025);
  }
  add(g,loft([[.20,.08,.30,.07,.08],[.34,.25,.32,.12,.14],[.42,.54,.29,.115,.13],[.43,.82,.23,.09,.10],[.40,1.05,.18,.055,.06],[.34,1.22,.14,.003,.003]]),s);
  // Draped bib with a curved chest-facing surface and a scalloped lower edge.
  const v=[],idx=[],cols=18,rows=8;
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const t=x/cols*2-1,f=y/rows,width=.15+.09*f;v.push(t*width,1.15-f*.32-.025*Math.cos(t*Math.PI/2)*f,-.075-Math.sqrt(Math.max(0,1-t*t))*(.17+.035*f));}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+cols+1;idx.push(a,a+1,b,a+1,b+1,b);}
  const bib=new THREE.BufferGeometry();bib.setAttribute('position',new THREE.Float32BufferAttribute(v,3));bib.setIndex(idx);bib.computeVertexNormals();cloth.side=THREE.DoubleSide;add(g,bib,cloth);
  cord(g,hem,[[-.24,.83,-.075],[-.16,.81,-.23],[0,.805,-.28],[.16,.81,-.23],[.24,.83,-.075]],.009);
  return consolidate(g);
}
export function createAttendant(){
  const g=new THREE.Group();g.name='Stylized reception attendant';
  const ivory=material('#eae6dc'),fold=material('#c9c7bd'),skin=material('#c99978',.75),hair=material('#262321',.7),ink=material('#46342e'),lips=material('#965f50'),red=material('#a52927');
  add(g,loft([[0,.94,0,.14,.10],[0,1.06,0,.16,.11],[0,1.28,0,.20,.12],[0,1.40,0,.18,.105],[0,1.45,0,.08,.075]]),ivory);
  add(g,new THREE.CylinderGeometry(.053,.065,.15,16),skin,[0,1.48,0]);
  // Jaw tapers into the chin; eyes stay small and quiet in the stylized face.
  add(g,loft([[0,1.535,.015,.025,.035],[0,1.56,.01,.061,.070],[0,1.61,0,.089,.086],[0,1.68,-.008,.096,.09],[0,1.75,-.018,.087,.078],[0,1.79,-.02,.04,.04],[0,1.80,-.02,.002,.002]]),skin);
  oval(g,skin,[0,1.635,.086],[.014,.025,.022]);
  for(const side of [-1,1]){
    oval(g,skin,[side*.092,1.644,-.006],[.018,.035,.018]);
    oval(g,ink,[side*.039,1.669,.078],[.016,.005,.005]);
    cord(g,hair,[[side*.023,1.69,.074],[side*.041,1.695,.073],[side*.057,1.689,.067]],.003);
    // Soft draped sleeve profile runs from shoulder to a generous hanging cuff.
    add(g,loft([[side*.245,1.02,.085,.10,.095],[side*.26,1.11,.07,.115,.12],[side*.24,1.24,.025,.105,.11],[side*.18,1.38,0,.07,.08]]),ivory);
    cord(g,fold,[[side*.26,1.04,.18],[side*.275,1.16,.17],[side*.215,1.31,.11]],.004);
    const hand=oval(g,skin,[side*.16,1.17,.245],[.045,.025,.074]);hand.rotation.y=side*.28;
    for(let j=0;j<4;j++)oval(g,skin,[side*.16+(j-1.5)*.018,1.167,.302],[.009,.014,.035]);
    oval(g,skin,[side*.205,1.18,.25],[.017,.018,.037]);
    cord(g,ivory,[[side*.27,1.19,.14],[side*.20,1.18,.19],[side*.16,1.17,.22]],.037);
  }
  cord(g,lips,[[-.024,1.59,.077],[0,1.586,.085],[.024,1.59,.077]],.0025);
  // Close-fitting cap, side locks and a low tied bun, all one shared material.
  const cap=add(g,new THREE.SphereGeometry(1,28,18,0,Math.PI*2,0,Math.PI*.55),hair,[0,1.697,-.017],[.103,.108,.094]);
  oval(g,hair,[0,1.65,-.078],[.095,.105,.052]);oval(g,hair,[0,1.60,-.118],[.064,.057,.052]);
  for(const side of [-1,1])cord(g,hair,[[side*.08,1.747,.035],[side*.094,1.69,.02],[side*.094,1.62,-.005]],.013);
  cord(g,hair,[[-.08,1.72,.055],[-.03,1.728,.076],[.03,1.75,.064],[.078,1.74,.035]],.017);
  // Crossed robe collar, not a Western V-neck or two floating white bars.
  cord(g,fold,[[-.065,1.445,.071],[.015,1.30,.12],[.055,1.12,.12]],.025);
  cord(g,ivory,[[.065,1.445,.071],[-.035,1.27,.13],[-.07,1.11,.12]],.023);
  add(g,new THREE.BoxGeometry(.29,.055,.025),red,[0,1.03,.112]);
  return consolidate(g);
}
