import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const nearPrecinctShrineRowIds=Object.freeze(['way/305214367','way/305214360','way/305214365','way/305214364']);

// Four mapped roof footprints, never equally spaced illustrative copies.
export function nearPrecinctShrineRowPlan(features){
 return nearPrecinctShrineRowIds.flatMap(id=>{
  const f=features.buildings?.find(b=>b.id===id);if(!f)return [];
  const points=f.points.filter((p,i,a)=>i===0||p[0]!==a[0][0]||p[2]!==a[0][2]);
  if(points.length<3||points.some(p=>!p.every(Number.isFinite)))return [];
  const edges=points.map((p,i)=>{const q=points[(i+1)%points.length];return [q[0]-p[0],q[2]-p[2]];}).filter(([x,z])=>Math.abs(x)>Math.abs(z)).sort((a,b)=>Math.hypot(...b)-Math.hypot(...a));
  if(!edges.length)return [];let [ux,uz]=edges[0];const length=Math.hypot(ux,uz);ux/=length;uz/=length;if(ux<0){ux=-ux;uz=-uz;}
  const local=points.map(p=>[p[0]*ux+p[2]*uz,-p[0]*uz+p[2]*ux]);
  const lo=[Math.min(...local.map(p=>p[0])),Math.min(...local.map(p=>p[1]))],hi=[Math.max(...local.map(p=>p[0])),Math.max(...local.map(p=>p[1]))],u=(lo[0]+hi[0])/2,v=(lo[1]+hi[1])/2;
  return [{id,label:f.tags?.name??'Unnamed mapped subsidiary pavilion',center:[u*ux-v*uz,u*uz+v*ux],yaw:Math.atan2(-uz,ux),width:hi[0]-lo[0]-.06,depth:hi[1]-lo[1]-.06,dark:id==='way/305214360',ring:points.map(p=>[p[0],p[2]])}];
 });
}

// Call after final terrain grades, before generic viewer footprint extrusions.
// Add returned builtIds to excludesBuilding. Existing named architecture wins.
export function buildNearPrecinctShrineRow(root,features,surfaces,materials,colliders){
 const name='Mapped subsidiary shrine row R78',previous=root.getObjectByName(name);if(previous)return previous.userData;
 const group=new THREE.Group();group.name=name;const records=[],skipped=[];
 const red=new THREE.MeshStandardMaterial({color:'#b24426',roughness:.90}),white=materials.plasterMat??new THREE.MeshStandardMaterial({color:'#e2ded3',roughness:.96}),stone=materials.stoneMat??new THREE.MeshStandardMaterial({color:'#85817a',roughness:.97});
 const timber=new THREE.MeshStandardMaterial({color:'#493c2d',roughness:.96}),ink=new THREE.MeshStandardMaterial({color:'#32392f',roughness:.96}),roof=new THREE.MeshStandardMaterial({color:'#514b3d',roughness:.98,side:THREE.DoubleSide});
 for(const p of nearPrecinctShrineRowPlan(features)){
  let owned=false;root.traverse(o=>{if(o.userData.sourceFeature===p.id||o.userData.featureId===p.id)owned=true;});
  if(owned){skipped.push({id:p.id,reason:'existing source-feature owner'});continue;}
  const c=Math.cos(p.yaw),s=Math.sin(p.yaw),world=(x,z)=>[p.center[0]+x*c+z*s,p.center[1]-x*s+z*c];
  const levels=[[-.35*p.width,.4*p.depth],[0,.4*p.depth],[.35*p.width,.4*p.depth]].map(([x,z])=>surfaces.height(...world(x,z)));
  if(!levels.every(Number.isFinite)||Math.max(...levels)-Math.min(...levels)>.35){skipped.push({id:p.id,reason:'nonfinite or unresolved terrace grade'});continue;}
  const floor=levels.toSorted((a,b)=>a-b)[1],g=new THREE.Group();g.name=`Mapped subsidiary shrine ${p.id}`;g.position.set(p.center[0],floor,p.center[1]);g.rotation.y=p.yaw;g.userData.sourceFeature=p.id;
  const batches=new Map(),part=(geo,mat)=>{if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
  const box=(w,h,d,x,y,z,mat)=>part(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
  const w=p.width,d=p.depth,h=p.dark?2.00:2.65,frame=p.dark?timber:red,wall=p.dark?timber:white;
  // Bodies and all steps stay inside their existing mapped roof footprint.
  const base=Math.min(...p.ring.map(([x,z])=>surfaces.height(x,z)),floor)-.04;
  if(!Number.isFinite(base)){skipped.push({id:p.id,reason:'nonfinite plinth support'});continue;}
  const foundationHeight=Math.max(.28,floor-base+.28);box(w*.84,foundationHeight,d*.78,0,.28-foundationHeight/2,-.04*d,stone);
  box(w*.70,h-.62,d*.58,0,(h-.62)/2+.30,-.08*d,wall);
  for(const x of [-.35*w,.35*w])for(const z of [-.37*d,.21*d])box(.10,h-.63,.10,x,(h-.63)/2+.28,z,frame);
  for(const y of [.35,h-.38])box(w*.80,.11,d*.72,0,y,-.07*d,frame);
  box(w*.48,h*.48,.035,0,h*.46,.22*d,timber);
  for(let i=0;i<7;i++)box(.022,h*.47,.025,-w*.22+i*w*.44/6,h*.46,.245*d,frame);
  for(const y of [h*.25,h*.70])box(w*.50,.05,.04,0,y,.25*d,frame);
  for(let i=0;i<3;i++)box(w*.57,.07*(i+1),d*.09,0,.035*(i+1),d*(.43-i*.09),stone);
  // Landing photograph: ridge runs front-back, with the white/red curved
  // triangular gable facing the terrace (+Z), not the side of the pavilion.
  const profile=x=>{const t=Math.abs(x)/(w/2);return h+.55-.85*(1-(1-t)**2)+.06*t**8;},positions=[],uv=[];
  for(const [a,b]of [[-.5*w,0],[0,.5*w]])for(let i=0;i<20;i++){const xa=a+(b-a)*i/20,xb=a+(b-a)*(i+1)/20;for(const q of [[xa,profile(xa),-.5*d],[xa,profile(xa),.5*d],[xb,profile(xb),-.5*d],[xb,profile(xb),-.5*d],[xa,profile(xa),.5*d],[xb,profile(xb),.5*d]]){positions.push(...q);uv.push(q[0],q[2]);}}
  const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));skin.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));skin.computeVertexNormals();part(skin,roof);
  for(const x of [-w/2+.025,w/2-.025])box(.05,.09,d,x,profile(x)-.025,0,ink);
  box(.11,.12,d*.85,0,h+.60,0,ink);
  const gables=[];for(const z of [-d*.37,d*.22])for(let i=0;i<40;i++){const xa=-w*.47+w*.94*i/40,xb=-w*.47+w*.94*(i+1)/40;for(const q of [[xa,h-.32,z],[xa,profile(xa)-.06,z],[xb,h-.32,z],[xb,h-.32,z],[xa,profile(xa)-.06,z],[xb,profile(xb)-.06,z]])gables.push(...q);}
  const closure=new THREE.BufferGeometry();closure.setAttribute('position',new THREE.Float32BufferAttribute(gables,3));closure.computeVertexNormals();const doubleWall=wall.clone();doubleWall.side=THREE.DoubleSide;part(closure,doubleWall);
  box(w*.94,.09,.07,0,h-.38,d*.255,frame);
  box(.09,.68,.07,0,h+.08,d*.255,frame);
  for(const [a,b]of [[-w*.47,0],[0,w*.47]]){const count=20;for(let i=0;i<count;i++){const xa=a+(b-a)*i/count,xb=a+(b-a)*(i+1)/count,ya=profile(xa)-.16,yb=profile(xb)-.16;
   const beam=new THREE.BoxGeometry(.075,Math.hypot(xb-xa,yb-ya),.065);beam.rotateZ(-Math.atan2(xb-xa,yb-ya));beam.translate((xa+xb)/2,(ya+yb)/2,d*.265);part(beam,frame);
  }}
  for(const [material,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(o=>o.dispose());const mesh=new THREE.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}
  group.add(g);colliders.push({type:'box',args:[...p.center,w*.42,d*.39,p.yaw,base,floor+.28,`near_row_plinth_${p.id}`]},{type:'box',args:[...world(0,-.08*d),w*.35,d*.29,p.yaw,floor+.28,floor+h,`near_row_body_${p.id}`]});
  records.push({id:p.id,label:p.label,center:p.center,yaw:p.yaw,roofSize:[w,d],roofRidgeAxis:'local Z; front gable +Z',floor,height:h+.66,dark:p.dark});
 }
 group.userData={builtIds:records.map(r=>r.id),records,skipped,sources:['geography/features.json','outputs/r77/streetview-landing.png','outputs/r77/video-0625.png'],limits:'Mapped roof positions; inferred heights and three red-white versus one timber finish. Unnamed identities and roof ornamental details unverified. No rear wall or public terrace duplication.'};
 if(records.length)root.add(group);return group.userData;
}
