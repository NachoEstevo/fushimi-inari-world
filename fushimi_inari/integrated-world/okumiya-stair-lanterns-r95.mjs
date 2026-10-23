import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

export const okumiyaStairLanternIds=Object.freeze(['way/301527738','way/1051399549']);
const NAME='Mapped Okumiya stair roofed lanterns R95';
export function buildOkumiyaStairLanternsR95(root,features,network,materials,colliders,options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 if(!options.terrainPositions?.length)return {builtIds:[],reason:'Rendered terrain support required'};
 const stone=materials.entryStoneMat??materials.stoneMat,red=materials.vermilionMat,roofSource=materials.copperRoofMat??materials.roofMat,dark=materials.blackNemakiMat??materials.woodMat;
 if(!stone||!red||!roofSource||!dark)return {builtIds:[],reason:'Existing stone/vermilion/roof/dark materials required'};
 const roof=roofSource.clone();roof.side=THREE.DoubleSide;roof.color.set('#46534a');roof.roughness=.92;
 const nearby=[];for(let i=0;i<options.terrainPositions.length;i+=9){const p=options.terrainPositions;if(Math.max(p[i],p[i+3],p[i+6])<110||Math.min(p[i],p[i+3],p[i+6])>118||Math.max(p[i+2],p[i+5],p[i+8])< -28||Math.min(p[i+2],p[i+5],p[i+8])> -8)continue;for(let j=0;j<9;j++)nearby.push(p[i+j]);}
 const sample=makeShoulderTriangleHeight(nearby),group=new THREE.Group();group.name=NAME;const records=[],builtIds=[],pending=[];
 for(const id of okumiyaStairLanternIds){
  let owner=false;root.traverse(o=>{if(o.userData.sourceFeature===id)owner=true;});if(owner){builtIds.push(id);continue;}
  const f=features.buildings.find(b=>b.id===id);if(!f)continue;const points=f.points.slice(0,-1),x=points.reduce((s,p)=>s+p[0]/points.length,0),z=points.reduce((s,p)=>s+p[2]/points.length,0),yaw=-Math.PI/2+.06;
  const corners=[[-1.03,-1.03],[-1.03,1.03],[1.03,-1.03],[1.03,1.03]].map(([a,b])=>[x+a*Math.cos(yaw)+b*Math.sin(yaw),z-a*Math.sin(yaw)+b*Math.cos(yaw)]),support=corners.map(p=>sample(...p));if(support.some(y=>!Number.isFinite(y)))continue;
  const bottom=Math.min(...support)-.08,datum=Math.max(...support),g=new THREE.Group();g.name='Source roofed stair lantern '+id;g.userData.sourceFeature=id;g.position.set(x,datum,z);g.rotation.y=yaw;
  const batches=new Map(),part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  // Large tapered stone base photographed in June 2012. Rings preserve its
  // battered sides rather than replacing the lantern with a solid tall block.
  const rings=[[bottom-datum,2.06],[.12,2.06],[.28,1.80],[1.72,1.30],[1.86,1.48],[2.02,1.48]],vertices=[];
  for(let j=1;j<rings.length;j++){const [y0,w0]=rings[j-1],[y1,w1]=rings[j];for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4,b=(i+1)*Math.PI/2+Math.PI/4,p=[Math.cos(a)*w0/Math.SQRT2,y0,Math.sin(a)*w0/Math.SQRT2],q=[Math.cos(b)*w0/Math.SQRT2,y0,Math.sin(b)*w0/Math.SQRT2],r=[Math.cos(a)*w1/Math.SQRT2,y1,Math.sin(a)*w1/Math.SQRT2],s=[Math.cos(b)*w1/Math.SQRT2,y1,Math.sin(b)*w1/Math.SQRT2];vertices.push(...p,...r,...q,...q,...r,...s);}}
  const base=new THREE.BufferGeometry();base.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));base.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap((v,i)=>i%3===0?[v,vertices[i+1]]:[]),2));base.computeVertexNormals();part(base,stone);box(1.48,.06,1.48,0,2.05,0,stone);
  // Four open red corner posts, black inner lattice and red lintels/sill.
  for(const px of [-.67,.67])for(const pz of [-.67,.67])box(.13,1.95,.13,px,3.025,pz,red);
  for(const y of [2.13,3.91]){box(1.48,.13,1.48,0,y,0,red);box(1.21,.11,1.21,0,y+(y<3?.08:-.08),0,dark);}
  // Recessed black gauze/lattice panels leave the vermilion structure legible.
  for(const side of [-1,1])for(let j=-5;j<=5;j++){box(.023,1.55,.024,j*.106,3.03,side*.57,dark);box(.024,1.55,.023,side*.57,3.03,j*.106,dark);}
  for(const y of [2.40,2.72,3.04,3.36,3.68])for(const side of [-1,1]){box(1.15,.022,.024,0,y,side*.57,dark);box(.024,.022,1.15,side*.57,y,0,dark);}
  // Gabled hipped-looking swept eaves: front/back gable and continuous roof
  // planes, not a flat slab. Width/depth/rise are photographic estimates.
  const roofY=(x,z)=>4.00+.76*(1-Math.pow(Math.abs(x)/1.26,.70))+.13*Math.pow(Math.abs(x)/1.26,8)+.08*Math.pow(Math.abs(z)/1.10,6),rv=[];
  for(let i=0;i<24;i++)for(let j=0;j<6;j++){const a=-1.26+i*2.52/24,b=-1.26+(i+1)*2.52/24,c=-1.10+j*2.20/6,d=-1.10+(j+1)*2.20/6;for(const [px,pz]of [[a,c],[a,d],[b,c],[b,c],[a,d],[b,d]])rv.push(px,roofY(px,pz),pz);}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rv,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(rv.flatMap((v,i)=>i%3===0?[v,rv[i+2]]:[]),2));rg.computeVertexNormals();part(rg,roof);
  for(const side of [-1,1])for(let i=0;i<24;i++){const a=-1.26+i*2.52/24,b=-1.26+(i+1)*2.52/24,y=(roofY(a,side*1.1)+roofY(b,side*1.1))/2;box((b-a)+.008,.12,.10,(a+b)/2,y-.06,side*1.1,red);}
  box(.13,.12,2.30,0,4.81,0,dark);box(1.60,.10,1.55,0,3.99,0,red);
  let triangles=0;for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());geo.computeBoundingSphere();triangles+=geo.attributes.position.count/3;const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}group.add(g);builtIds.push(id);
  pending.push({type:'box',args:[x,z,1.03,1.03,yaw,bottom,datum+2.10,'okumiya_stair_lantern_'+id]});records.push({id,center:[x,datum,z],support,bottom,height:4.87,triangles});
 }
 // The actual refined shrine may be occluded by viewer fallback 301527733.
 // Exclude only with positive evidence that its complete real owner exists.
 let shrineOwner=false;root.traverse(o=>{if(o.isGroup&&o.userData.zone==='okumiya'&&o.userData.okumiyaDetail)shrineOwner=true;});if(shrineOwner)builtIds.push('way/301527733');
 group.userData={builtIds,records,shrineOwner,drawBatches:records.length*4,source:'Root fresh June2012 downhill/side/front StreetView captures R95; two mapped stair-head roofed lantern footprints',limits:'Stone taper/chamber/roof proportions inferred. No lighting, legible inscriptions or exact carving claim. Okumiya orientation retained; fallback exclusion requires actual refined owner.'};
 root.add(group);colliders.push(...pending);return group.userData;
}
