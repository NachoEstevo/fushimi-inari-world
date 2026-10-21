import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeOmotesandoShoulderExclusion,upwardShoulderTriangles} from './omotesando-shoulders-layout.mjs';

// IMG_7702 exposes the trough between clipped shrubs. This estimated opening
// applies only to its own source hedge; all other mapped lines stay intact.
export const basinHedgeGap=(wayId,station)=>wayId==='way/1133052439'&&Math.abs(station-.45)<.125;

// Registered ensemble: IMG_7702/7705 show the dry trough inside a brick-edged
// cherry bed. DSC_0516-1 ties that same trough/lantern bed to Gishikiden's
// east access; DSC_0537-2 sees the second torii/Romon from that cherry bed.
// Position is an explicit photo estimate relative to the mapped hedge, not an
// independently mapped basin POI or a surveyed historical placement.
export function buildEntranceRoadsideBasin(root,barriers,surfaces,materials,colliders,features){
  if(root.getObjectByName('Photo-registered unused roadside basin'))return null;
  const hedge=(Array.isArray(barriers)?barriers:barriers.ways??[]).find(w=>w.id==='way/1133052439');
  if(!hedge||hedge.points.length!==2)return null;
  const [a,b]=hedge.points,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  if(length<1)return null;
  const t=.45,inset=1.10;
  const x=a[0]+dx*t-dz/length*inset,z=a[1]+dz*t+dx/length*inset;
  const yaw=Math.atan2(-dz,dx),c=Math.cos(yaw),s=Math.sin(yaw);
  const terrain=(px,pz)=>{const y=surfaces.height(px,pz);if(!Number.isFinite(y))throw Error('Nonfinite roadside basin seat');return y;};
  const corners=[[-.95,-.40],[.95,-.40],[-.95,.40],[.95,.40]].map(([u,v])=>terrain(x+c*u+s*v,z-s*u+c*v));
  const bottom=Math.min(...corners)-.045,floor=Math.max(...corners)+.025,top=floor+.72;
  const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#a6a18b');stone.roughness=1;
  const inner=stone.clone();inner.color.set('#777563');
  const stoneParts=[],insideParts=[];
  const box=(out,w,h,d,px,py,pz)=>out.push(new THREE.BoxGeometry(w,h,d).translate(px,py,pz));
  // Four rims and a recessed dry bottom form an actual hollow trough. There
  // is deliberately no water surface, bamboo, ladle or active interaction.
  box(stoneParts,1.90,top-bottom,.12,0,(top+bottom)/2,-.34);
  box(stoneParts,1.90,top-bottom,.12,0,(top+bottom)/2,.34);
  for(const u of [-.89,.89])box(stoneParts,.12,top-bottom,.56,u,(top+bottom)/2,0);
  box(insideParts,1.66,.12,.56,0,floor+.15,0);
  const group=new THREE.Group();group.name='Photo-registered unused roadside basin';group.position.set(x,0,z);group.rotation.y=yaw;
  for(const [parts,material]of [[stoneParts,stone],[insideParts,inner]]){
    const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
    const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  }
  // A bounded 2.6 m garden-side strip follows the actual hedge, on the side
  // toward wall2438. This is a photo-estimated width, not a new landuse claim.
  // Its front brick edge is separate from the retained existing hedge owner.
  const garden=new THREE.Group();garden.name='Basin photographed brick garden and companion lantern';
  const at=(station,offset)=>[a[0]+dx*station-dz/length*offset,a[1]+dz*station+dx/length*offset];
  const exclusionFeatures={...features,paths:(features?.paths??[]).map(p=>p.id==='way/105449722'?{...p,id:'basin-main-path-exclusion'}:p)};
  const excluded=makeOmotesandoShoulderExclusion(exclusionFeatures);
  const brickParts=[],lanternParts=[],darkParts=[],greenPositions=[],greenColors=[],greenUV=[];
  const worldBox=(out,w,h,d,px,py,pz,angle=yaw)=>out.push(new THREE.BoxGeometry(w,h,d).rotateY(angle).translate(px,py,pz));
  let brickCount=0,gardenCells=0;
  for(let distance=.18;distance<length-.16;distance+=.34){
    const [px,pz]=at(distance/length,-.54);
    if(excluded(px,pz,.22))continue;
    const y=terrain(px,pz);
    for(let row=0;row<2;row++){
      worldBox(brickParts,.325,.115,.15,px,y+.0575+row*.12,pz);brickCount++;
    }
  }
  const terrainSeat=(px,pz)=>{const h=surfaces.terrainHeight?.(px,pz)??terrain(px,pz);if(!Number.isFinite(h))throw Error('Nonfinite basin garden terrain');return h+.025;};
  // Cells are conservatively excluded by their full half-diagonal, preserving
  // every mapped route, building and water outline instead of covering them.
  const step=.26;
  for(let along=.10;along<length-.10;along+=step)for(let inset=.04;inset<2.60;inset+=step){
    const end=Math.min(length-.10,along+step),back=Math.min(2.60,inset+step);
    const [cx,cz]=at((along+end)/2/length,(inset+back)/2);
    if(excluded(cx,cz,Math.hypot(end-along,back-inset)/2))continue;
    const corners=[[along,inset],[end,inset],[end,back],[along,back]].map(([u,v])=>{const [px,pz]=at(u/length,v);return [px,terrainSeat(px,pz),pz];});
    for(const i of upwardShoulderTriangles(corners)){
      const [px,,pz]=corners[i],shade=.86+.07*Math.sin(px*.77+pz*.31)+.035*Math.cos(px*.41-pz*.69);
      greenPositions.push(...corners[i]);greenColors.push(.27*shade,.32*shade,.15*shade);greenUV.push(px/2,pz/2);
    }
    gardenCells++;
  }
  if(greenPositions.length){
    const size=128,pixels=new Uint8Array(size*size*4);let seed=6206;
    for(let i=0;i<pixels.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=224+seed%30;pixels[i]=grain;pixels[i+1]=grain;pixels[i+2]=grain;pixels[i+3]=255;}
    const map=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(greenPositions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(greenColors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(greenUV,2));geometry.computeVertexNormals();
    const surface=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.004,vertexColors:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));surface.receiveShadow=true;garden.add(surface);
  }
  // The wide registration photo shows the companion lantern toward the
  // avenue end of this same bed. Station .87 is estimated, not a mapped POI.
  const [lx,lz]=at(.87,1.10),lanternBase=terrain(lx,lz),lanternBottom=lanternBase-.07;
  let lanternAdded=false;
  if(!excluded(lx,lz,.76)){
    const lbox=(w,h,d,y)=>worldBox(lanternParts,w,h,d,lx,lanternBase+y,lz);
    lbox(1.35,.30,1.12,.08);lbox(1.08,.23,.91,.345);
    const post=new THREE.CylinderGeometry(.21,.43,1.12,4).rotateY(Math.PI/4).translate(lx,lanternBase+1.02,lz);lanternParts.push(post);
    lbox(.92,.14,.80,1.64);lbox(.76,.12,.67,1.77);
    worldBox(darkParts,.43,.41,.38,lx,lanternBase+2.06,lz);
    for(const u of [-.28,.28])for(const v of [-.24,.24]){
      worldBox(lanternParts,.12,.49,.12,lx+c*u+s*v,lanternBase+2.06,lz-s*u+c*v);
    }
    lbox(.85,.12,.74,2.355);
    const roofVertices=[],rings=[[.76,2.44],[.55,2.50],[.32,2.67],[.13,2.80]];
    const corner=(r,i)=>{const [w,y]=rings[r],u=[-w,w,w,-w][i],v=[-w,-w,w,w][i];return [lx+c*u+s*v,lanternBase+y,lz-s*u+c*v];};
    for(let r=0;r<rings.length-1;r++)for(let i=0;i<4;i++){
      const j=(i+1)%4,p=[corner(r,i),corner(r,j),corner(r+1,j),corner(r+1,i)];for(const k of [0,2,1,0,3,2])roofVertices.push(...p[k]);
    }
    const roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute(roofVertices,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute(roofVertices.flatMap((v,i)=>i%3===0?[roofVertices[i]/2,roofVertices[i+2]/2]:[]),2));roof.setIndex(Array.from({length:roofVertices.length/3},(_,i)=>i));roof.computeVertexNormals();lanternParts.push(roof);
    lbox(.33,.15,.30,2.87);lanternParts.push(new THREE.SphereGeometry(.19,10,6).scale(1,1.2,1).translate(lx,lanternBase+3.09,lz));
    colliders.push({type:'box',args:[lx,lz,.72,.60,yaw,lanternBottom,lanternBase+3.32,'basin_companion_lantern']});lanternAdded=true;
  }
  const brick=new THREE.MeshStandardMaterial({color:'#9c654b',roughness:1});
  for(const [parts,material]of [[brickParts,brick],[lanternParts,stone],[darkParts,inner]])if(parts.length){
    const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;garden.add(mesh);
  }
  root.add(garden);
  const record={mappedReferences:['way/1133052439','way/626313860','way/223276575','way/359847610'],
    position:[x,floor,z],yaw,
    sourcePhotos:['https://fushimiinari-guide.com/wp-content/uploads/IMG_7702_20210405.jpg',
      'https://fushimiinari-guide.com/wp-content/uploads/IMG_7705_20210405.jpg',
      'https://www.goriluckey.com/wp-content/uploads/DSC_0516-1.jpg',
      'https://www.goriluckey.com/wp-content/uploads/DSC_0537-2.jpg'],
    placement:'Photo-registered Gishikiden access garden; estimated hedge station .45 and garden-side inset 1.10 m; not surveyed',
    dimensions:'Estimated1.90 x .80 x .72 m from photographs',
    garden:{mappedHedge:hedge.id,behindWall:'way/1133052438',estimatedWidth:2.60,brickCount,gardenCells,duplicateHedge:false},
    companionLantern:{added:lanternAdded,position:[lx,lanternBase,lz],estimatedHeight:3.32,station:.87,placement:'Photographed same bed; estimated relative offset, not a mapped POI'},
    state:'Unused dry trough; no invented lettering or purification interaction'};
  group.userData=record;root.add(group);
  colliders.push({type:'box',args:[x,z,.95,.40,yaw,bottom,top,'unused_roadside_basin']});
  return record;
}
