import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const KEY='ichinomineRefinement';
const near=(a,b)=>Math.abs(a-b)<.002;
function curtainTexture(createCanvas){
  const canvas=createCanvas();canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Ichinomine curtain canvas unavailable');
  ctx.fillStyle='#a91319';ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#f4f0df';ctx.lineWidth=3;
  // The two circular motifs and inscription follow the 2018 reference; their
  // precise ornament and cloth dimensions are interpreted, not surveyed.
  for(const x of [252,772])for(const radius of [37,31,19]){ctx.beginPath();ctx.arc(x,151,radius,0,Math.PI*2);ctx.stroke();}
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
}

function metricStepGeometry(source){
  const geometry=source.clone(),p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
  for(let i=0;i<p.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(ny>=nx&&ny>=nz)uv.setXY(i,p.getX(i),p.getZ(i));
    else if(nx>=ny&&nx>=nz)uv.setXY(i,p.getZ(i),p.getY(i));
    else uv.setXY(i,p.getX(i),p.getY(i));
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
  let disposed=false;
  const result={group,originalGeometry,stats:{crests:2,tassels:7,extraBatches:group.children.length,lanterns:stone.lanterns,stairs:stone.stairs},dispose(){
    if(disposed)return;disposed=true;group.removeFromParent();
    for(const mesh of group.children){mesh.geometry.dispose();mesh.material.dispose();}
    if(curtain.geometry===geometry)curtain.geometry=originalGeometry;if(curtain.material===material)curtain.material=originalMaterial;
    geometry.dispose();material.dispose();texture.dispose();stone.dispose();if(object.userData[KEY]===result)delete object.userData[KEY];
  }};
  object.userData[KEY]=result;return result;
}
