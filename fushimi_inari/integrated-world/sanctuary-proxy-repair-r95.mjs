import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
const CHOJA='way/305214359';
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-5;
const box=(o,w,h,d)=>o.isMesh&&near(o.geometry?.parameters?.width,w)&&near(o.geometry?.parameters?.height,h)&&near(o.geometry?.parameters?.depth,d);

export function buildMappedChojaR95(root,features,materials,colliders,{terrainPositions}={}){
 let existing;root.traverse(o=>{if(o.userData.sourceFeature===CHOJA)existing=o;});if(existing)return existing.userData;
 const f=features.buildings.find(b=>b.id===CHOJA),stone=materials.entryStoneMat??materials.stoneMat,red=materials.vermilionMat,white=materials.plasterMat,dark=materials.blackNemakiMat??materials.woodMat,roofSource=materials.roofMat;
 if(!f||!terrainPositions?.length||!stone||!red||!white||!dark||!roofSource)return {builtIds:[],reason:'Mapped Choja footprint, rendered terrain and existing palette required'};
 const p=f.points,x0=Math.min(...p.map(v=>v[0])),x1=Math.max(...p.map(v=>v[0])),z0=Math.min(...p.map(v=>v[2])),z1=Math.max(...p.map(v=>v[2])),x=(x0+x1)/2,z=(z0+z1)/2,w=x1-x0-.06,d=z1-z0-.06;
 const terrain=[];for(let i=0;i<terrainPositions.length;i+=9){const a=terrainPositions;if(Math.max(a[i],a[i+3],a[i+6])<x0||Math.min(a[i],a[i+3],a[i+6])>x1||Math.max(a[i+2],a[i+5],a[i+8])<z0||Math.min(a[i+2],a[i+5],a[i+8])>z1)continue;for(let j=0;j<9;j++)terrain.push(a[i+j]);}
 const height=makeShoulderTriangleHeight(terrain),support=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(v=>height(...v)),front=[x-.8,x,x+.8].map(px=>height(px,z1-.2));if([...support,...front].some(y=>!Number.isFinite(y)))return {builtIds:[],reason:'Unresolved rendered Choja support'};
 const floor=front.toSorted((a,b)=>a-b)[1],bottom=Math.min(...support,floor)-.08,g=new THREE.Group();g.name='Mapped Choja shrine R95';g.position.set(x,floor,z);
 const roof=roofSource.clone();roof.side=THREE.DoubleSide;roof.color.set('#4e493c');const batches=new Map();
 const add=(geo,mat)=>{if(geo.index){const old=geo;geo=old.toNonIndexed();old.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
 const part=(ww,h,dd,xx,yy,zz,mat)=>add(new THREE.BoxGeometry(ww,h,dd).translate(xx,yy,zz),mat);
 part(w*.82,floor+.28-bottom,d*.76,0,(bottom-floor+.28)/2,-.08*d,stone);
 part(w*.68,2.16,d*.52,0,1.36,-.15*d,white);
 for(const xx of [-w*.34,w*.34])for(const zz of [-d*.41,d*.11])part(.12,2.55,.12,xx,1.55,zz,red);
 for(const y of [.40,1.24,2.58]){part(w*.76,.12,d*.64,0,y,-.15*d,red);}
 part(w*.59,1.30,.045,0,1.93,d*.122,dark);
 for(const xx of [-w*.27,0,w*.27])part(.10,2.10,.10,xx,1.57,d*.135,red);
 part(w*.35,.56,.32,0,.72,d*.26,dark);part(w*.39,.10,.38,0,1.03,d*.26,dark);
 // Photograph81555 left shrine: red/white narrow sanctuary, dark front,
 // long front nagare roof and ridge across X, not another identical row gable.
 const ridge=-.17*d,roofY=(xx,zz)=>{const t=zz>=ridge?(zz-ridge)/(d/2-ridge):(ridge-zz)/(ridge+d/2);return 3.98-1.08*(1-Math.pow(1-t,2))+.10*Math.pow(Math.abs(xx)/(w/2),6);},v=[],uv=[];
 for(const [a,b]of [[-d/2,ridge],[ridge,d/2]])for(let i=0;i<28;i++)for(let j=0;j<12;j++){const za=a+(b-a)*i/28,zb=a+(b-a)*(i+1)/28,xa=-w/2+j*w/12,xb=-w/2+(j+1)*w/12;for(const [xx,zz]of [[xa,za],[xa,zb],[xb,za],[xb,za],[xa,zb],[xb,zb]]){v.push(xx,roofY(xx,zz),zz);uv.push(xx,zz);}}
 const skin=new THREE.BufferGeometry();skin.setAttribute('position',new THREE.Float32BufferAttribute(v,3));skin.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));skin.computeVertexNormals();add(skin,roof);part(w*.94,.13,.22,0,4.06,ridge,dark);
 // Close the photographed plaster side walls up to the curved roof; the
 // projecting front porch remains open, not a daylight slit in a wall.
 for(const side of [-1,1])for(let i=0;i<20;i++){const za=-d*.41+i*d*.52/20,zb=-d*.41+(i+1)*d*.52/20,top=Math.min(roofY(side*w*.34,za),roofY(side*w*.34,zb))-.14;part(.055,top-2.44,zb-za+.004,side*w*.34,(top+2.44)/2,(za+zb)/2,white);}
 part(w*.68,roofY(0,-d*.41)-2.58,.055,0,(roofY(0,-d*.41)-.14+2.44)/2,-d*.41,white);
 // Match the actual swept roof at every fascia station. One flat centre-Y
 // beam previously detached from the raised edge by about10cm in the render.
 for(const zz of [-d/2+.06,d/2-.06])for(let i=0;i<24;i++){const xx=-w/2+(i+.5)*w/24;part(w/24+.002,.13,.12,xx,roofY(xx,zz)-.055,zz,red);}
 // Photographed gold hanging bell; no invented writing or carved identity.
 const gold=materials.goldMat??red;add(new THREE.SphereGeometry(.10,8,6).translate(0,2.20,d*.16),gold);
 for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);}
 g.userData={sourceFeature:CHOJA,builtIds:[CHOJA],floor,bottom,support,roofSize:[w,d],source:'OSM305214359 namedChoja; Pakutaso81555 actual photo red/white left shrine with long nagare front roof',limits:'Mapped footprint; photo-inferred proportions, no surveyed height/carving/hidden facade claim'};root.add(g);
 colliders.push({type:'box',args:[x,z-d*.08,w*.41,d*.38,0,bottom,floor+.28,'mapped_choja_plinth']},{type:'box',args:[x,z-d*.15,w*.34,d*.26,0,floor+.28,floor+2.58,'mapped_choja_body']});return g.userData;
}

export function clearMisplacedSanctuaryProxiesR95(root,colliders,{anchors}={}){
 const marker=root.userData.sanctuaryProxyRepairR95;if(marker)return marker;
 const required=[CHOJA,'way/305214367','way/305214365','way/305214364','way/305214599'];
 const owners=new Set();root.traverse(o=>{if(o.userData.sourceFeature)owners.add(o.userData.sourceFeature);if(o.userData.built===true)for(const id of o.userData.builtIds??[])owners.add(id);});
 const missing=required.filter(id=>!owners.has(id));if(missing.length||!anchors?.length)return {removedGroups:0,removedColliders:0,missing,reason:'Replacement owner/anchor evidence incomplete'};
 const selected=anchors.filter(a=>['romon','gehaiden','naihaiden','honden','okumiya'].includes(a.id));if(!selected.length)return {removedGroups:0,removedColliders:0,reason:'Source precinct anchors unavailable'};
 const specs=[{z:-24.8,tag:'south_subshrine',signature:g=>g.children.length===5&&g.children.some(o=>box(o,3.8,.55,3))&&g.children.some(o=>box(o,3.2,2.4,2.4))&&g.children.some(o=>box(o,4.4,.52,3.6))},{z:-29.8,tag:'south_subshrine',signature:g=>g.children.length===5&&g.children.some(o=>box(o,3.8,.55,3))&&g.children.some(o=>box(o,3.2,2.4,2.4))&&g.children.some(o=>box(o,4.4,.52,3.6))},{z:-35.2,tag:'shinmesha',signature:g=>g.children.length===6&&g.children.some(o=>box(o,3.8,.45,3.4))&&g.children.some(o=>box(o,3.4,2.5,2.8))&&g.children.some(o=>box(o,1.55,.72,.58))}];
 root.updateWorldMatrix(true,true);const pending=[];
 for(const spec of specs){const a=selected.reduce((best,a)=>Math.hypot(15.4-a.source[0],spec.z-a.source[2])<Math.hypot(15.4-best.source[0],spec.z-best.source[2])?a:best),dx=15.4-a.source[0],dz=spec.z-a.source[2],x=a.target[0]+Math.cos(a.yaw)*dx+Math.sin(a.yaw)*dz,z=a.target[2]-Math.sin(a.yaw)*dx+Math.cos(a.yaw)*dz,groups=[];
  root.traverse(o=>{if(!o.isGroup||!spec.signature(o))return;const p=o.getWorldPosition(new THREE.Vector3());if(Math.hypot(p.x-x,p.z-z)<.01)groups.push(o);});
  const solids=colliders.filter(c=>c.type==='box'&&c.args.at(-1)===spec.tag&&Math.hypot(c.args[0]-x,c.args[1]-z)<.01);
  if(groups.length!==1||solids.length!==1)return {removedGroups:0,removedColliders:0,reason:'Exact legacy source geometry/collider pairing ambiguous'};pending.push({group:groups[0],solid:solids[0],source:[15.4,spec.z],world:[x,z],tag:spec.tag});
 }
 for(const {group,solid}of pending){group.traverse(o=>{o.userData.legacyShrineConflictRemoved=true;});group.removeFromParent();colliders.splice(colliders.indexOf(solid),1);}
 const record={removedGroups:3,removedColliders:3,records:pending.map(({source,world,tag})=>({source,world,tag})),replacementOwners:required,interactionPruneFlag:'legacyShrineConflictRemoved',provenance:'Exact compressed source signature/anchor transform; actual named mapped replacement owners required; public paths and all real shrine collisions retained'};root.userData.sanctuaryProxyRepairR95=record;return record;
}
