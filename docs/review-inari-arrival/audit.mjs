import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createHash} from 'node:crypto';
const sourceFiles=['integration.mjs','inari-station-arrival.mjs','inari-station-arrival-spec.mjs','inari-station-route.mjs','inari-station-frontage.mjs'];
const sourceHashes=Object.fromEntries(sourceFiles.map(name=>[name,createHash('sha256').update(fs.readFileSync('fushimi_inari/integrated-world/'+name)).digest('hex')]));
const base=path.resolve('fushimi_inari/integrated-world');
const noop=()=>{};
const context=new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:()=>({data:new Uint8ClampedArray(16)}),createImageData:()=>({data:new Uint8ClampedArray(16)})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({width:64,height:64,style:{},getContext:()=>context,addEventListener(type,fn){this.listeners??={};this.listeners[type]=fn;},removeEventListener:noop,set src(v){this._src=v;queueMicrotask(()=>this.listeners?.load?.call(this));},get src(){return this._src;}});
globalThis.document={createElement:element,createElementNS:element,body:{dataset:{},appendChild:noop}};
globalThis.window={URL:globalThis.URL,innerWidth:1200,innerHeight:800};globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:64,height:64,close:noop});
globalThis.fetch=async input=>{const url=typeof input==='string'?input:input.url;const p=path.resolve(base,url);return new Response(fs.readFileSync(p));};
GLTFLoader.prototype.loadAsync=async function(url){const b=fs.readFileSync(path.resolve(base,url));return await new Promise((resolve,reject)=>this.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'',resolve,reject));};
const read=p=>JSON.parse(fs.readFileSync(p));
const {integrate}=await import('../../fushimi_inari/integrated-world/integration.mjs');
const result=await integrate(new THREE.Scene(),{capabilities:{getMaxAnisotropy:()=>1}},read('fushimi_inari/geography/terrain.json'),read('fushimi_inari/geography/features.json'),{progress:s=>console.log(s)});
const {SpatialCollisionWorld}=await import('../../fushimi_inari/integrated-world/collision.mjs');
if(!result.inariStation?.built||!result.inariStationRoute?.built)throw Error('Missing actual station/access assembly');
const {buildPathMeshes}=await import('../../fushimi_inari/integrated-world/path-meshes.mjs');
result.root.add(buildPathMeshes(result.surfaces,result.legacy,result.ground));
let terrain=result.officePonds.clipTerrain(result.renderedTerrainPositions);
for(const owner of [result.mitsuFrontageAprons,result.mikoshikoPrecinct,result.shinsenjoPrecinct,result.shinikeWater])terrain=owner.clipTerrain?.(terrain)??terrain;
const terrainGeo=new THREE.BufferGeometry();terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(terrain,3));
const terrainMesh=new THREE.Mesh(terrainGeo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));terrainMesh.name='Actual final clipped rendered terrain';result.root.add(terrainMesh);
const station=result.inariStation,route=result.inariStationRoute,spec=station.spec;
station.setTrainOffset([0,0,0]);station.setDoorOpen(1);result.root.updateMatrixWorld(true);
const meshes=[];result.root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)meshes.push(o);});
// Index actual postbatch world triangles once. Whole-world path meshes have
// enormous bounding spheres; native per-ray traversal repeats unrelated work.
// Vertical intersection is exact barycentric triangle math, not a height model.
const triangleCells=new Map(),cellSize=2,triangleBounds=[-220,-100,-45,130];let indexedTriangles=0;
const va=new THREE.Vector3(),vb=new THREE.Vector3(),vc=new THREE.Vector3();
for(const mesh of meshes){const p=mesh.geometry.attributes.position,index=mesh.geometry.index;if(!p)continue;
 for(let i=0;i<(index?.count??p.count);i+=3){
  va.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);vb.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);vc.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
  const minX=Math.min(va.x,vb.x,vc.x),maxX=Math.max(va.x,vb.x,vc.x),minZ=Math.min(va.z,vb.z,vc.z),maxZ=Math.max(va.z,vb.z,vc.z);
  if(maxX<triangleBounds[0]||minX>triangleBounds[1]||maxZ<triangleBounds[2]||minZ>triangleBounds[3])continue;
  const den=(vb.z-vc.z)*(va.x-vc.x)+(vc.x-vb.x)*(va.z-vc.z);if(Math.abs(den)<1e-10)continue;
  const tolerance=.00003/Math.abs(den),tri={a:va.toArray(),b:vb.toArray(),c:vc.toArray(),den,tolU:tolerance*Math.hypot(vb.x-vc.x,vb.z-vc.z),tolV:tolerance*Math.hypot(va.x-vc.x,va.z-vc.z),tolW:tolerance*Math.hypot(va.x-vb.x,va.z-vb.z),owner:mesh.name||mesh.parent?.name||'batched mesh'};indexedTriangles++;
  for(let x=Math.floor(Math.max(minX,triangleBounds[0])/cellSize);x<=Math.floor(Math.min(maxX,triangleBounds[1])/cellSize);x++)for(let z=Math.floor(Math.max(minZ,triangleBounds[2])/cellSize);z<=Math.floor(Math.min(maxZ,triangleBounds[3])/cellSize);z++){const key=x+','+z;if(!triangleCells.has(key))triangleCells.set(key,[]);triangleCells.get(key).push(tri);}
 }
}
console.log('Indexed exact regional triangles',indexedTriangles);
const sourceColliders=result.colliders;
function world(excludeDoor=false){const w=new SpatialCollisionWorld(4);for(const c of sourceColliders){if(excludeDoor&&c===station.closedDoorCollider)continue;w[c.type==='box'?'addBox':'addCylinder'](...c.args);}return w;}
const solids=world(),egressSolids=world(true);
function attribution(x,y,z,excludeDoor=false){
 const hits=[];for(const c of sourceColliders){if(excludeDoor&&c===station.closedDoorCollider)continue;const w=new SpatialCollisionWorld(4);w[c.type==='box'?'addBox':'addCylinder'](...c.args);const q=w.resolvePlayer(x,y,z);const d=Math.hypot(q.x-x,q.z-z);if(d>.001)hits.push({tag:c.args.at(-1),type:c.type,args:c.args,correction:d});}return hits;
}
function verticalHit(x,z,lo,hi,strict=false){let hit=null;for(const {a,b,c,den,tolU,tolV,tolW,owner}of triangleCells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))??[]){const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,w=1-u-v;if(u<-(strict?0:tolU)||v<-(strict?0:tolV)||w<-(strict?0:tolW))continue;const y=u*a[1]+v*b[1]+w*c[1];if(y<lo||y>hi)continue;if(!hit||y>hit.height)hit={height:y,owner};}return hit;}
function support(x,y,z){const hit=verticalHit(x,z,y-1.25,y+.35);return hit?{...hit,gap:y-hit.height}:null;}
function bodyHit(x,y,z){const hit=verticalHit(x,z,y+.12,y+1.65);return hit?{...hit,aboveFloor:hit.height-y}:null;}
function coplanarTopsAt(u,v,floor){
 const [x,z]=spec.local(u,v),tops=[];
 for(const {a,b,c,den,owner}of triangleCells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))??[]){
  if(den>=0)continue;const bu=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,bv=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den,bw=1-bu-bv;if(Math.min(bu,bv,bw)<=1e-7)continue;
  const y=bu*a[1]+bv*b[1]+bw*c[1];if(Math.abs(y-floor)<.00002)tops.push({height:y,owner});
 }
 return {local:[u,v],point:[x,floor,z],tops};
}
const hallProbePoints=[-3.09,-2.07,-1.13,.11,1.19,2.23,3.17].flatMap(u=>[-.217,.103,.239].map(v=>coplanarTopsAt(u,v,spec.publicFloor))),hallCoplanarTopProbe={scope:'21 strictly interior irregular hall points; upward emitted triangles within20micrometres of the public floor, excludes exact triangle-edge witnesses',samples:hallProbePoints.length,maximumTops:Math.max(...hallProbePoints.map(p=>p.tops.length)),duplicatePoints:hallProbePoints.filter(p=>p.tops.length>1),points:hallProbePoints};
const upperLandingProbePoints=[-9.20,-9.05,-8.90].flatMap(u=>[-.25,.13,.25].map(v=>coplanarTopsAt(u,v,spec.platformFloor))),upperLandingCoplanarTopProbe={scope:'9 upper landing witnesses from the station regression; actual postbatch upward tops at P2 level',samples:upperLandingProbePoints.length,minimumTops:Math.min(...upperLandingProbePoints.map(p=>p.tops.length)),maximumTops:Math.max(...upperLandingProbePoints.map(p=>p.tops.length)),duplicatePoints:upperLandingProbePoints.filter(p=>p.tops.length>1),points:upperLandingProbePoints};
const strictOffsets=[-.001,-.0001,-.00005,0,.00005,.0001,.001],strictNeighborhoods=[[-160.40713737668898,10.09365402964061],[-160.4069995440519,10.343653991644937]].map(([x,z])=>({center:[x,z],samples:strictOffsets.flatMap(dx=>strictOffsets.map(dz=>{const px=x+dx,pz=z+dz,y=result.walkHeight(px,pz),hit=verticalHit(px,pz,y-1.25,y+.35,true);return {point:[px,y,pz],offset:[dx,dz],hit,gap:hit?y-hit.height:null,walkable:result.isWalkable(px,pz)};}))}));
const strictSamples=strictNeighborhoods.flatMap(n=>n.samples),strictFailures=strictSamples.filter(s=>!s.hit||Math.abs(s.gap)>.055||!s.walkable),strictSeal={scope:'Strict exact Float32 emitted triangle intersection, zero barycentric edge tolerance, final assembly with frontage; former crossing-mouth seam and 98 two-dimensional neighbourhood samples',samples:strictSamples.length,maximumAbsoluteGap:Math.max(...strictSamples.filter(s=>s.hit).map(s=>Math.abs(s.gap))),failures:strictFailures,neighborhoods:strictNeighborhoods};
fs.writeFileSync('outputs/inari-arrival-review/independent-seal-audit.json',JSON.stringify({checkedAt:new Date().toISOString(),sourceHashes,...strictSeal},null,2));
if(process.argv.includes('--seal-only')){console.log(JSON.stringify({samples:strictSeal.samples,maximumAbsoluteGap:strictSeal.maximumAbsoluteGap,failures:strictFailures,sourceHashes},null,2));process.exit(strictFailures.length?1:0);}
function auditPath(name,points,{automatic=false}={}){
 const lanes=[];for(const offset of [-.25,0,.25])for(const reversed of [false,true]){
  const p=reversed?[...points].reverse():points,summary={offset,reversed,samples:0,maxStep:0,maxCollisionCorrection:0,maxAbsSupportGap:0,missingSupport:0,bodyIntersections:0,blocked:0,notWalkable:0,failures:[]};let previous;
  for(let i=1;i<p.length;i++){
   const a=p[i-1],b=p[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),count=Math.max(1,Math.ceil(length/.10));if(length<1e-7)continue;
   for(let j=i===1?0:1;j<=count;j++){
    const t=j/count,x=a[0]+dx*t-dz/length*offset,z=a[2]+dz*t+dx/length*offset;
    const y=automatic?a[1]+(b[1]-a[1])*t:result.walkHeight(x,z,previous?.y);
    const q=(automatic?egressSolids:solids).resolvePlayer(x,y+1.7,z),correction=Math.hypot(q.x-x,q.z-z),surface=support(x,y,z),body=bodyHit(x,y,z),step=previous?Math.abs(y-previous.y):0;
    const walkable=automatic||result.isWalkable(x,z);summary.samples++;summary.maxStep=Math.max(summary.maxStep,step);summary.maxCollisionCorrection=Math.max(summary.maxCollisionCorrection,correction);
    if(surface)summary.maxAbsSupportGap=Math.max(summary.maxAbsSupportGap,Math.abs(surface.gap));else summary.missingSupport++;
    if(body)summary.bodyIntersections++;if(correction>.01)summary.blocked++;if(!walkable)summary.notWalkable++;
    if((correction>.01||!surface||Math.abs(surface.gap)>.055||step>.24||body||!walkable)&&summary.failures.length<80)summary.failures.push({segment:i-1,t,point:[x,y,z],step,walkable,correction,surface,body,colliders:correction>.01?attribution(x,y+1.7,z,automatic):[]});
    previous={x,y,z};
   }
  }lanes.push(summary);
 }return {name,points,lanes};
}
const publicPoints=[spec.route.platformDoor,spec.route.stairTop,spec.route.stairBottom,spec.route.gate,spec.route.exit,...route.routePoints.slice(1)];
const platformToShrine=auditPath('Platform 2 -> stairs -> gates -> east exit -> existing crossing -> first torii',publicPoints);
station.setDoorOpen(1);result.root.updateMatrixWorld(true);
const autoPoints=[spec.arrival.interiorPose.position.map((v,i)=>i===1?v-1.7:v),spec.arrival.platformPose.position.map((v,i)=>i===1?v-1.7:v)];
const autoEgress=auditPath('Automatic open-door disembarkation (closed-door collider excluded only here)',autoPoints,{automatic:true});
station.setDoorOpen(0);result.root.updateMatrixWorld(true);
const dynamicMeshes=[];station.trainGroup.traverse(o=>{if(o.isMesh)dynamicMeshes.push(o);});
const before=new THREE.Box3().setFromObject(station.trainGroup).getCenter(new THREE.Vector3());station.setTrainOffset([0,0,-3]);result.root.updateMatrixWorld(true);const after=new THREE.Box3().setFromObject(station.trainGroup).getCenter(new THREE.Vector3());station.setTrainOffset([0,0,0]);
const doorLeaves=station.trainGroup.children.filter(o=>o.name.startsWith('Car ')&&o.children.length),doorBefore=doorLeaves.map(o=>[o.uuid,o.position.z]);station.setDoorOpen(1);const movedDoors=doorLeaves.filter((o,i)=>Math.abs(o.position.z-doorBefore[i][1])>.01).map(o=>o.name);station.setDoorOpen(0);
const closed=station.closedDoorCollider,cp=closed.args,closedProbe=solids.resolvePlayer(cp[0],spec.train.floor+1.7,cp[1]);
const sign=station.sign,signAttached=(()=>{let o=sign;while(o){if(o===result.root)return true;o=o.parent;}return false;})();
const boundaryNeighborhoods=[['crossing-mouth',-160.4069995440519,10.343653991644937],['exit-waypoint',-162.4813410708493,37.28495588260359],['exit-offset-corner',-162.47639664541933,37.534906983135606]].map(([name,x,z])=>({name,points:[-.01,-.001,0,.001,.01].flatMap(dx=>[-.01,-.001,0,.001,.01].map(dz=>{const px=x+dx,pz=z+dz,y=result.walkHeight(px,pz);return {point:[px,y,pz],surface:support(px,y,pz),body:bodyHit(px,y,pz)};}))}));
const replacementAudit=Object.fromEntries(Object.entries(document.body.dataset).filter(([key])=>key.toLowerCase().includes('inaristation')).map(([key,value])=>{try{return [key,JSON.parse(value)];}catch{return [key,value];}}));
const report={checkedAt:new Date().toISOString(),scope:'Actual CPU integrate, post-batching source geometry/colliders/walkHeight; exact vertical triangle hits with30micrometre edge tolerance for Float32; selected doors open for auto geometry probe; no browser, renderer, texture or visual acceptance',sourceHashes,replacementAudit,preservation:{interactables:result.legacy.interactables.length,originalStationSignRegistryOccurrences:result.legacy.interactables.filter(o=>o===sign).length,signAttached,signGeometry:sign.geometry.parameters,signInteraction:sign.userData.interactable,legacySolidCount:sourceColliders.filter(c=>c.args.at(-1)==='jr_inari_station').length,closedDoorColliderRegistered:sourceColliders.includes(closed),closedDoorProbeCorrection:Math.hypot(closedProbe.x-cp[0],closedProbe.z-cp[1]),dynamicTrainMeshCount:dynamicMeshes.length,trainGroupAttached:station.trainGroup.parent===station.group,dynamicBoundingCenterDelta:after.sub(before).toArray(),movedDoorLeaves:movedDoors,thresholdChildren:station.thresholdGroup.children.length},platformToShrine,autoEgress,boundaryNeighborhoods,strictSeal,hallCoplanarTopProbe,upperLandingCoplanarTopProbe};
fs.writeFileSync('outputs/inari-arrival-review/independent-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({preservation:report.preservation,paths:[platformToShrine,autoEgress].map(p=>({name:p.name,lanes:p.lanes.map(({failures,...r})=>({...r,failureCount:failures.length}))}))},null,2));
