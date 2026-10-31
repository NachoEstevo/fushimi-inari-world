import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const KEY='ichinomineRefinement';
const near=(a,b)=>Math.abs(a-b)<.002;
function riceSheafCrest(ctx,x,y){
  ctx.lineWidth=2.2;ctx.fillStyle='#f4f0df';
  // Paired ears of rice surround an untouched red centre. Stems, grain and
  // the lower bindings interpret the photographed daki-ine; not traced pixels.
  for(const side of [-1,1])for(const radius of [43,52,61]){
    ctx.beginPath();ctx.arc(x,y,radius,side<0?Math.PI/2+.19:-Math.PI/2+.19,side<0?Math.PI*1.5-.19:Math.PI/2-.19);ctx.stroke();
    for(let i=0;i<10;i++){
      const angle=-1.33+i*2.66/9,cx=x+side*Math.cos(angle)*radius,cy=y+Math.sin(angle)*radius;
      ctx.beginPath();ctx.ellipse(cx,cy,5.5,1.9,side*angle+.58*side,0,Math.PI*2);ctx.fill();
    }
    ctx.beginPath();ctx.moveTo(x+side*radius*.19,y+radius*.98);ctx.lineTo(x+side*(radius*.19+6),y+radius+8);ctx.stroke();
  }
  ctx.beginPath();ctx.arc(x,y,30,0,Math.PI*2);ctx.stroke();
}
function curtainTexture(createCanvas){
  const canvas=createCanvas();canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Ichinomine curtain canvas unavailable');
  ctx.fillStyle='#a91319';ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#f4f0df';ctx.lineWidth=3;
  // 2018 frontal reference and jinjafan photograph 105 agree on the pair of
  // rice-sheaf crests. Their ornament and cloth dimensions are not surveyed.
  for(const x of [252,772])riceSheafCrest(ctx,x,151);
  ctx.fillStyle='#f4f0df';ctx.font='bold 40px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('神大廣末',512,52);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function curtainGeometry(width){
  const geometry=new THREE.PlaneGeometry(width,1.08,32,4),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),bottomWeight=(.54-y)/1.08;
    p.setY(i,y+Math.max(0,1-Math.abs(x)/(width*.5))*.43*bottomWeight);
    p.setZ(i,Math.sin(x*18)*.018);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
function box(parts,w,h,d,x,y,z){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);parts.push(g);}
function batch(group,parts,material,name){
  const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();
  geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  return mesh;
}

// A quarter-metre tile keeps the baked mineral clusters at granite grain scale.
function metricStepGeometry(source){
  const geometry=source.clone(),p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<p.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(ny>=nx&&ny>=nz)uv.setXY(i,p.getX(i)*4,p.getZ(i)*4);
    else if(nx>=ny&&nx>=nz)uv.setXY(i,p.getZ(i)*4,p.getY(i)*4);
    else uv.setXY(i,p.getX(i)*4,p.getY(i)*4);
  }
  uv.needsUpdate=true;return geometry;
}
function stoneDetails(object,materials){
  const source=materials.entryStoneMat;if(!source?.clone)return {lanterns:0,stairs:0,dispose(){}};
  const groups=[];
  object.traverse(group=>{
    if(!group.isGroup||!near(Math.abs(group.position.x),3.75)||!near(group.position.z,2.45)||group.children.length!==7)return;
    const expected=[[.62,.45,.62],[.22,1.65,.22],[.68,.14,.68],[.48,.52,.48],[.36,.40,.36],[.86,.24,.86]];
    if(expected.every((d,i)=>{const m=group.children[i],p=m.geometry?.parameters;return m.isMesh&&m.geometry.type==='BoxGeometry'&&near(p.width,d[0])&&near(p.height,d[1])&&near(p.depth,d[2]);})&&group.children[6].geometry?.type==='ConeGeometry')groups.push(group);
  });
  if(groups.length!==2||groups[0].parent!==groups[1].parent||groups[0].position.x*groups[1].position.x>=0)return {lanterns:0,stairs:0,dispose(){}};
  const compound=groups[0].parent,steps=compound.children.filter(mesh=>{const p=mesh.geometry?.parameters;return mesh.isMesh&&mesh.geometry.type==='BoxGeometry'&&near(p.width,4.8)&&near(p.height,.17)&&near(p.depth,.40);});
  const stone=source.clone();stone.color.set('#aaa9a0');stone.roughness=1;stone.metalness=0;
  const parts=[];for(const x of [-.215,.215])for(const z of [-.215,.215])box(parts,.05,.52,.05,x,0,z);
  box(parts,.48,.045,.48,0,.2375,0);box(parts,.48,.045,.48,0,-.2375,0);
  const frame=mergeGeometries(parts);for(const part of parts)part.dispose();frame.computeBoundingSphere();
  const changed=[];
  for(const group of groups)for(const i of [0,1,2,3,5,6]){
    const mesh=group.children[i];changed.push([mesh,mesh.geometry,mesh.material]);mesh.material=stone;if(i===3)mesh.geometry=frame;
  }
  const stairMaterial=steps.length===6?source.clone():null;
  const stepGeometries=[];
  if(stairMaterial)for(const mesh of steps){changed.push([mesh,mesh.geometry,mesh.material]);mesh.geometry=metricStepGeometry(mesh.geometry);stepGeometries.push(mesh.geometry);mesh.material=stairMaterial;}
  return {lanterns:2,stairs:stairMaterial?6:0,dispose(){
    for(const [mesh,originalGeometry,originalMaterial] of changed){if(mesh.geometry===frame||stepGeometries.includes(mesh.geometry))mesh.geometry=originalGeometry;if(mesh.material===stone||mesh.material===stairMaterial)mesh.material=originalMaterial;}
    frame.dispose();for(const geometry of stepGeometries)geometry.dispose();stone.dispose();stairMaterial?.dispose();
  }};
}

// The frontal and oblique photographs show short coursed retaining returns,
// granite end posts and an OPEN tamagaki behind them, not a tall perimeter wall.
// https://jinjafan.jp/2601658/spots/407/ (photographs 105, 106 and 107).
// Width, course height and concealed depth remain photographic estimates.
// Coordinates belong to the existing worship-canopy owner, above its terrace.
// The existing terrace ends at local z=1.60; even end-post caps stay behind it.
const STONE_RETURNS=Object.freeze([-1,1].flatMap(side=>[
 Object.freeze({x:side*4.6,z:1.36,width:2.12,depth:.38,along:'x'}),
 Object.freeze({x:side*5.46,z:-.5925,width:.38,depth:3.465,along:'z'})
]));
function stoneSideReturns(group,source){
 if(!source?.clone)return null;
 const stone=source.clone();stone.name='Ichinomine weathered granite boundary';stone.color.set('#92928a');stone.roughness=1;stone.metalness=0;
 const parts=[];let blocks=0;
 function block(w,h,d,x,y,z,phase=0){
  const bevel=Math.min(.012,h*.15),shape=new THREE.Shape(),hw=w/2-bevel,hh=h/2-bevel;
  shape.moveTo(-hw,-hh);shape.lineTo(hw,-hh);shape.lineTo(hw,hh);shape.lineTo(-hw,hh);shape.closePath();
  const original=new THREE.ExtrudeGeometry(shape,{depth:d-2*bevel,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:1});
  original.translate(0,0,-(d-2*bevel)/2);
  const geometry=metricStepGeometry(original);original.dispose();const uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)+phase*.37,uv.getY(i)+phase*.23);
  geometry.translate(x,y,z);parts.push(geometry);
 }
 for(const wall of STONE_RETURNS){
  const length=wall.along==='x'?wall.width:wall.depth;
  for(let row=0;row<4;row++){
   let start=-length/2,index=0;
   while(start<length/2-.025){
    const end=Math.min(length/2,start+(index===0&&row%2?.33:.66)),span=end-start-.014,offset=(start+end)/2;
    if(span>.025){block(wall.along==='x'?span:wall.width,.251,wall.along==='z'?span:wall.depth,
     wall.x+(wall.along==='x'?offset:0),.1395+row*.265,wall.z+(wall.along==='z'?offset:0),blocks++);}
    start=end;index++;
   }
  }
  // The returns end at a mortar joint: no coplanar overlapping cap slabs.
  block(wall.width+(wall.along==='z'?.035:0),.10,wall.depth+(wall.along==='x'?.035:0),wall.x,1.115,wall.z);
 }
 for(const side of [-1,1])for(const [x,z] of [[3.76,1.36],[5.46,1.36],[5.46,-2.125]]){
  block(.44,.14,.44,side*x,.07,z);block(.34,1.34,.34,side*x,.74,z);block(.44,.075,.44,side*x,1.4425,z);
 }
 const mesh=batch(group,parts,stone,'Ichinomine low granite side returns');
 const stats={segments:4,blocks,posts:6,draws:1,triangles:mesh.geometry.index?mesh.geometry.index.count/3:mesh.geometry.attributes.position.count/3,newTextures:0};
 const point=new THREE.Vector3(),scale=new THREE.Vector3();
 return {stats,getColliders(){
  group.updateWorldMatrix(true,true);const matrix=group.matrixWorld,e=matrix.elements;
  scale.setFromMatrixScale(matrix);const yaw=Math.atan2(e[8],e[10]);
  const bottom=point.set(0,0,0).applyMatrix4(matrix).y,top=point.set(0,1.48,0).applyMatrix4(matrix).y;
  return STONE_RETURNS.map(wall=>{
   point.set(wall.x,0,wall.z).applyMatrix4(matrix);
   return {type:'box',args:[point.x,point.z,(wall.width+.06)*scale.x/2,(wall.depth+.06)*scale.z/2,yaw,Math.min(bottom,top),Math.max(bottom,top),'ichinomine_stone_boundary']};
  });
 }};
}

// Short granite paving panels on the existing side terrace, outside the
// worship canopy. The photographed stone approach establishes the material;
// side paving joints and panel sizes are an interpretation, not surveyed.
function sideCourtPaving(group,canopy,source){
 const compound=canopy.parent;
 const terrace=compound?.children.find(mesh=>{
  const p=mesh.geometry?.parameters;
  return mesh.isMesh&&mesh.geometry.type==='BoxGeometry'&&near(p.width,13.6)&&near(p.height,1.02)&&near(p.depth,11.5)&&near(mesh.position.y,.51)&&near(mesh.position.z,-5.5);
 });
 // Match the authored terrace and canopy transform before placing any stone.
 if(!terrace||!source?.clone||!near(canopy.position.x,0)||!near(canopy.position.y,1.02)||!near(canopy.position.z,-1.35)||canopy.rotation.x||canopy.rotation.y||canopy.rotation.z||!near(canopy.scale.x,1)||!near(canopy.scale.y,1)||!near(canopy.scale.z,1))return null;
 const stone=source.clone();stone.name='Ichinomine side court granite paving';stone.color.set('#aaa9a0');stone.roughness=1;stone.metalness=0;
 const parts=[];
 for(const side of [-1,1])for(let col=0;col<3;col++)for(let row=0;row<4;row++){
  const w=.59,d=.75,x=side*(3.38+(col+.5)*.60),z=-1.95+(row+.5)*.76;
  const original=new THREE.BoxGeometry(w,.018,d),tile=metricStepGeometry(original);original.dispose();tile.translate(x,.009,z);parts.push(tile);
 }
 const mesh=batch(group,parts,stone,'Ichinomine side terrace paving');
 // Pavement lies directly on the pre-existing terrace; it does not need a
 // second walking surface or any obstruction collider.
 mesh.castShadow=false;
 return {panels:24,draws:1,newColliders:0};
}

function removeUnsourcedSummitTrim(canopy){
  const removed=[],stats={plaque:0,goldBands:0};
  // Neither the 2018 frontal photograph nor jinjafan 105 has this legacy
  // plaque over the cloth inscription or the four bright pillar collars.
  // Match the authored dimensions AND placement, only in this canopy.
  canopy.children.forEach((mesh,index)=>{
    const p=mesh.geometry?.parameters,v=mesh.position;if(!mesh.isMesh||!p)return;
    const plaque=mesh.geometry.type==='BoxGeometry'&&near(p.width,.62)&&near(p.height,1.12)&&near(p.depth,.12)&&near(v.x,0)&&near(v.y,3.43)&&near(v.z,1.872);
    const band=mesh.geometry.type==='CylinderGeometry'&&near(p.radiusTop,.175)&&near(p.radiusBottom,.175)&&near(p.height,.12)&&near(Math.abs(v.x),2.288)&&near(v.y,3.07)&&near(Math.abs(v.z),1.512);
    if(plaque||band){removed.push({mesh,index});stats[plaque?'plaque':'goldBands']++;}
  });
  for(const {mesh} of removed)canopy.remove(mesh);
  return {stats,restore(){
    for(const {mesh,index} of removed)if(mesh.parent===null){
      canopy.add(mesh);canopy.children.splice(canopy.children.indexOf(mesh),1);canopy.children.splice(Math.min(index,canopy.children.length),0,mesh);
    }
  }};
}

// The original canopy and interaction remain owners. The added geometry is an
// interpretation of the photo; source meshes and shared textures are untouched.
export function refineIchinomine(object,materials={}, {createCanvas=()=>document.createElement('canvas')}={}){
  if(!object?.isGroup||object.userData.zone!=='summit')return null;
  if(object.userData[KEY])return object.userData[KEY];
  const candidates=[];
  object.traverse(mesh=>{const p=mesh.geometry?.parameters;
    if(mesh.isMesh&&mesh.geometry.type==='PlaneGeometry'&&near(p.width,4.472)&&near(p.height,1.08)&&mesh.material?.map)candidates.push(mesh);
  });
  if(candidates.length!==1)return null;
  const curtain=candidates[0],canopy=curtain.parent;
  const roof=canopy.children.find(mesh=>{const p=mesh.geometry?.parameters;return mesh.isMesh&&mesh.geometry.type==='BoxGeometry'&&near(p.width,6.65)&&near(p.depth,4.95);});
  if(!roof)return null;
  const texture=curtainTexture(createCanvas),originalGeometry=curtain.geometry,originalMaterial=curtain.material;
  const geometry=curtainGeometry(4.472),material=originalMaterial.clone();material.map=texture;material.color.set('#ffffff');material.roughness=.94;
  curtain.geometry=geometry;curtain.material=material;
  const group=new THREE.Group();group.name='Ichinomine reference details';canopy.add(group);
  const straw=new THREE.MeshStandardMaterial({color:'#b9aa85',roughness:1});
  const ropeGeometry=new THREE.CylinderGeometry(.05,.05,4.55,8);ropeGeometry.rotateZ(Math.PI/2);ropeGeometry.translate(0,3.31,1.64);batch(group,[ropeGeometry],straw,'Shimenawa');
  const tassels=[];for(let i=0;i<7;i++){const part=new THREE.CylinderGeometry(.025,.10,.48,8);part.translate((i-3)*.62,3.05,1.65);tassels.push(part);}
  const tasselMaterial=straw.clone();batch(group,tassels,tasselMaterial,'Seven straw tassels');
  const wood=(materials.vermilionMat?.clone?.()??new THREE.MeshStandardMaterial());wood.map=null;wood.color.set('#30241c');wood.roughness=.95;wood.metalness=0;
  const lattice=[];for(const side of [-1,1]){for(let i=0;i<6;i++)box(lattice,.035,1.3,.045,side*(.35+i*.36),1.05,1.35);for(const y of [.55,1.25,1.7])box(lattice,2.0,.04,.045,side*1.25,y,1.35);}
  batch(group,lattice,wood,'Dark timber lattice');
  const metal=new THREE.MeshStandardMaterial({color:'#7c807d',roughness:.86,metalness:.25});const edges=[];
  for(const side of [-1,1]){box(edges,1.62,.045,.06,side*1.53,.82,1.68);for(const x of [.77,2.29])box(edges,.045,.78,.05,side*x,.43,1.68);}
  box(edges,6.65,.055,.08,0,roof.position.y+.76*.28+.08,2.50);batch(group,edges,metal,'Low handrail and roof edge');
  const stone=stoneDetails(object,materials);
  const boundary=stoneSideReturns(group,materials.entryStoneMat);
  const paving=sideCourtPaving(group,canopy,materials.entryStoneMat);
  const trim=removeUnsourcedSummitTrim(canopy);
  let disposed=false;
  const result={group,originalGeometry,getColliders:()=>disposed?[]:boundary?.getColliders()??[],stats:{crests:2,tassels:7,extraBatches:group.children.length,lanterns:stone.lanterns,stairs:stone.stairs,...(boundary?{stoneBoundary:boundary.stats}:{}),...(paving?{sideCourtPaving:paving}:{}),...(trim.stats.plaque+trim.stats.goldBands?{referenceCorrections:trim.stats}:{})},dispose(){
    if(disposed)return;disposed=true;group.removeFromParent();
    for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}
    if(curtain.geometry===geometry)curtain.geometry=originalGeometry;if(curtain.material===material)curtain.material=originalMaterial;
    geometry.dispose();material.dispose();texture.dispose();stone.dispose();trim.restore();if(object.userData[KEY]===result)delete object.userData[KEY];
  }};
  object.userData[KEY]=result;return result;
}
