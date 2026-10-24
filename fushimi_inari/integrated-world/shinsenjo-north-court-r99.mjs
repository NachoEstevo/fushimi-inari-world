import * as THREE from 'three';
import {courtCuts} from './precinct-shrine-courts.mjs';
import {clipConvex,subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {TAMAGAKI_RUNS} from './sanctuary-context-r95.mjs';
import {mikoshikoLayout} from './mikoshiko-precinct.mjs';
const NAME='Shinsenjo bounded north mineral court R99';
const APRONS=new Set(['way/105449677','way/105449728','way/751194635','way/751194637','way/1106589423']);
const bounds=p=>[Math.min(...p.map(q=>q[0])),Math.max(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[1]))];
const overlap=(a,b)=>a[0]<b[1]&&a[1]>b[0]&&a[2]<b[3]&&a[3]>b[2];
const rect=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
const projected=(owner,p)=>p.map(([x,z])=>{const v=new THREE.Vector3(x,0,z).applyMatrix4(owner.matrixWorld);return [v.x,v.z];});
// Existing renderer path quads are two fan triangles. Triangulate every cut
// before subtraction; mitered path quads need not be convex.
const fan=p=>p.slice(1,-1).map((_,i)=>[p[0],p[i+1],p[i+2]]).filter(t=>Math.abs(polygonArea(t))>1e-9);
const cutPieces=(pieces,cuts)=>cuts.reduce((polys,cut)=>polys.flatMap(p=>Math.abs(polygonArea(clipConvex(p,cut)))>1e-9?subtractConvex(p,cut):[p]),pieces);

// Resolve before terrain construction: the existing R93 west court, not a
// guessed terrain level or magic DEM cell, owns this small resolution request.
export function shinsenjoNorthCourtTerrainDetailR99(features){
 const ids=['way/305214596','way/305214828','way/1287564336'];
 if(!ids.every(id=>features.buildings?.some(b=>b.id===id)))return [];
 const layout=mikoshikoLayout(features);if(!layout||![layout.width,layout.depth,...layout.center,layout.yaw].every(Number.isFinite))return [];
 const {width,depth,center,yaw}=layout,co=Math.cos(yaw),si=Math.sin(yaw);
 const court=rect(-width/2-1.05,-width/2,-depth/2,depth/2).map(([x,z])=>[center[0]+co*x+si*z,center[1]-si*x+co*z]);
 return [bounds(court)];
}

// Pure planner: no mesh allocation, source mutation or opportunistic grading.
export function planShinsenjoNorthCourtR99(root,features,surfaces,colliders=[],options={}){
 const well=root.getObjectByName('Shinkosui mapped roofed well R96'),miko=root.getObjectByName('Mikoshiko precinct R93'),fence=root.getObjectByName('Honden open tamagaki R95');
 const shinsenjo=features.buildings?.find(b=>b.id==='way/305214596'),wellMap=features.buildings?.find(b=>b.id==='way/305214828'),mikoMap=features.buildings?.find(b=>b.id==='way/1287564336');
 if(!well?.userData.built||!miko?.userData.built||!fence||!miko.userData.courtBoundsLocal||!shinsenjo||!wellMap||!mikoMap)return {ready:false,reason:'registered-existing-owners-required',parts:[]};
 const terrain=options.terrainPositions;if(!terrain?.length||terrain.length%9||!terrain.every(Number.isFinite))return {ready:false,reason:'actual-rendered-triangles-required',parts:[]};
 root.updateWorldMatrix(true,true);
 const wr=bounds(wellMap.points.map(p=>[p[0],p[2]])),mr=bounds(mikoMap.points.map(p=>[p[0],p[2]]));
 const north=shinsenjo.points.slice(0,-1).map(p=>[p[0],p[2]]).filter(p=>p[1]<22.1).sort((a,b)=>a[0]-b[0]);
 if(north.length!==2||Math.abs(north[0][0]-62.744)>.02||Math.abs(north[1][0]-82.047)>.02)return {ready:false,reason:'registered-north-face-required',parts:[]};
 const zAt=x=>north[0][1]+(north[1][1]-north[0][1])*(x-north[0][0])/(north[1][0]-north[0][0]);
 const fenceBox=new THREE.Box3().setFromObject(fence);if(fenceBox.isEmpty()||![...fenceBox.min.toArray(),...fenceBox.max.toArray()].every(Number.isFinite))return {ready:false,reason:'registered-tamagaki-geometry-before-batching-required',parts:[]};
 const runs=TAMAGAKI_RUNS.map(([x,z,w,d])=>projected(fence,rect(x-w/2-.15,x+w/2+.15,z-d/2-.15,z+d/2+.15))),fenceEast=fenceBox.max.x+.15;
 const [lo,hi,back,front]=miko.userData.courtBoundsLocal,mikoCourt=projected(miko,rect(lo,hi,back,front)),outerWest=projected(miko,[[lo,back],[lo,front]]),courtWest=Math.min(...outerWest.map(p=>p[0]));
 const proposals=[{id:'well-to-north-face',envelope:[[wr[1],wr[3]],[mr[0],wr[3]],[mr[0],zAt(mr[0])],[wr[1],zAt(wr[1])]]},
  {id:'west-mikoshiko',envelope:rect(fenceEast,courtWest,mr[2],mr[3]),invalid:fenceEast>=courtWest}];
 const region=bounds(proposals.flatMap(p=>p.envelope)),network={...surfaces,segments:(surfaces.segments??[]).map(s=>APRONS.has(s.id)?{...s,width:Math.max(3.6,s.width)}:s)};
 const rawCuts=[...courtCuts(features,network,region),...runs,mikoCourt];
 // Actual named well plinth is inset under its mapped eave, independently
 // excluded even if a future source exporter changes its roof classification.
 const wp=well.userData;if(!Number.isFinite(wp.width)||!Number.isFinite(wp.depth))return {ready:false,reason:'well-source-dimensions-required',parts:[]};
 rawCuts.push(projected(well,rect(-(wp.width-.5)/2,(wp.width-.5)/2,-(wp.depth-.4)/2,(wp.depth-.4)/2)));
 const floor=wp.floor;
 for(const c of colliders){const a=c.args??[];if(c.type==='box'){
  if(a.length<5||(Number.isFinite(a[6])&&a[6]<floor-.15)||(Number.isFinite(a[5])&&a[5]>floor+.5))continue;
  const co=Math.cos(a[4]??0),si=Math.sin(a[4]??0),p=rect(-a[2]-.15,a[2]+.15,-a[3]-.15,a[3]+.15).map(([u,v])=>[a[0]+co*u+si*v,a[1]-si*u+co*v]);if(overlap(bounds(p),region))rawCuts.push(p);
 }else if(c.type==='cylinder'){
  if((Number.isFinite(a[4])&&a[4]<floor-.15)||(Number.isFinite(a[3])&&a[3]>floor+.5))continue;const r=a[2]+.15,p=Array.from({length:16},(_,i)=>[a[0]+r*Math.cos(i*Math.PI/8),a[1]+r*Math.sin(i*Math.PI/8)]);if(overlap(bounds(p),region))rawCuts.push(p);
 }}
 // Existing low paving/mineral owners beyond the mapped centreline also own
 // their actual upward ground faces. Roofs/walls and unrelated upper slabs do
 // not become broad bounding-box exclusions.
 root.traverse(o=>{if(o.name===NAME||!o.isMesh||o.isInstancedMesh||!o.geometry?.attributes.position||!/(paving|paved|approach|landing|mineral|gravel)/i.test(o.name))return;
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position;
  for(let i=0;i<p.count;i+=3){const v=[0,1,2].map(k=>new THREE.Vector3().fromBufferAttribute(p,i+k).applyMatrix4(o.matrixWorld)),flat=v.map(v=>[v.x,v.z]);if(!overlap(bounds(flat),region)||Math.min(...v.map(v=>v.y))<floor-.2||Math.max(...v.map(v=>v.y))>floor+.5)continue;const n=v[1].clone().sub(v[0]).cross(v[2].clone().sub(v[0]));if(n.y>0&&n.y/Math.max(n.length(),1e-9)>.9&&Math.abs(polygonArea(flat))>1e-8)rawCuts.push(flat);}
  if(g!==o.geometry)g.dispose();
 });
 const cuts=rawCuts.flatMap(fan),localTerrain=[];
 for(let i=0;i<terrain.length;i+=9){const xyz=[0,1,2].map(k=>Array.from(terrain.slice(i+k*3,i+k*3+3))),flat=xyz.map(p=>[p[0],p[2]]);if(!overlap(bounds(flat),region))continue;const [a,b,c]=xyz,det=(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);if(Math.abs(det)<1e-12)continue;
  const gx=((b[1]-a[1])*(c[2]-a[2])-(c[1]-a[1])*(b[2]-a[2]))/det,gz=((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))/det;
  localTerrain.push({flat,height:(x,z)=>a[1]+gx*(x-a[0])+gz*(z-a[2]),slope:Math.hypot(gx,gz)});
 }
 const parts=[];
 for(const proposal of proposals){
  if(proposal.invalid){parts.push({...proposal,accepted:false,reason:'no-width-between-existing-owners'});continue;}
  const polygons=cutPieces([proposal.envelope],cuts),area=polygons.reduce((n,p)=>n+Math.abs(polygonArea(p)),0);
  if(area<1){parts.push({...proposal,accepted:false,reason:'less-than-one-square-metre-after-owner-cuts',area,polygons});continue;}
  const vertices=[];let covered=0,min=Infinity,max=-Infinity,maxSlope=0;
  for(const t of localTerrain)for(const poly of polygons){let clipped=clipConvex(t.flat,poly);const a=Math.abs(polygonArea(clipped));if(a<1e-9)continue;covered+=a;maxSlope=Math.max(maxSlope,t.slope);
   for(const p of clipped){const y=t.height(...p);min=Math.min(min,y);max=Math.max(max,y);}
   if(polygonArea(clipped)>0)clipped=clipped.toReversed();for(let i=1;i<clipped.length-1;i++)for(const [x,z]of [clipped[0],clipped[i],clipped[i+1]])vertices.push(x,t.height(x,z)+.012,z);
  }
  const relief=max-min,complete=Math.abs(covered-area)<=Math.max(1e-5,area*1e-6),accepted=complete&&relief<=.18+1e-8&&maxSlope<=.10+1e-8;
  parts.push({...proposal,area,polygons,coveredArea:covered,terrainRange:[min,max],relief,maxSlope,accepted,reason:!complete?'incomplete-or-overlapping-rendered-coverage':relief>.18+1e-8?'whole-portion-relief-exceeds-.18m':maxSlope>.10+1e-8?'whole-portion-slope-exceeds-.10':'accepted',vertices:accepted?vertices:[]});
 }
 return {ready:parts.some(p=>p.accepted),reason:parts.some(p=>p.accepted)?'bounded-portions-accepted':'no-viable-source-backed-portions',parts,sourceOwners:{well:'way/305214828',mikoshiko:'way/1287564336',shinsenjoNorth:'way/305214596',tamagaki:'Honden open tamagaki R95'},cuts,limits:{relief:.18,slope:.10,minArea:1,heightOffset:.012}};
}

export function buildShinsenjoNorthCourtR99(root,features,surfaces,materials={},colliders=[],options={}){
 const old=root.getObjectByName(NAME);if(old)return old.userData;
 const plan=planShinsenjoNorthCourtR99(root,features,surfaces,colliders,options);
 if(!plan.ready)return {built:false,builtIds:[],reason:plan.reason,parts:plan.parts};
 if(!materials.gravelMat)return {built:false,builtIds:[],reason:'existing-gravel-material-required',parts:plan.parts};
 const positions=plan.parts.filter(p=>p.accepted).flatMap(p=>p.vertices);if(!positions.length)return {built:false,builtIds:[],reason:'no-accepted-geometry',parts:plan.parts};
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(positions.flatMap((_,i)=>i%3===0?[positions[i]/1.5,positions[i+2]/1.5]:[]),2));g.computeVertexNormals();g.applyMatrix4(root.matrixWorld.clone().invert());
 const material=materials.gravelMat.clone();material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
 const mesh=new THREE.Mesh(g,material);mesh.name=NAME;mesh.receiveShadow=true;
 mesh.userData={built:true,builtIds:[],revision:'R99',sourceOwners:plan.sourceOwners,limits:plan.limits,parts:plan.parts.map(({vertices,...p})=>p),area:plan.parts.filter(p=>p.accepted).reduce((n,p)=>n+p.area,0),materialBatches:1,triangles:positions.length/9,terrainChanged:false,walkingChanged:false,collidersAdded:0,source:'https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/; https://www.goriluckey.com/wp-content/uploads/IMG_5749_20210412.jpg',provenance:'Observed mineral north/west court; bounded envelopes inferred from mapped north facade and existing well/Mikoshiko/tamagaki owners. Actual triangle contact and whole-portion .18m/.10 slope gates. Full Shinsenjo grade, south wing, retaining wall/elevator heights and generic building retain separate ownership.'};root.add(mesh);return mesh.userData;
}
