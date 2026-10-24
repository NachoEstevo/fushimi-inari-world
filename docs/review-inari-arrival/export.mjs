import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const sourceHashes=Object.fromEntries(['integration.mjs','viewer.mjs','inari-station-arrival.mjs','inari-station-arrival-spec.mjs','inari-station-route.mjs','inari-station-frontage.mjs','train-arrival-experience.mjs','train-arrival-sequence.mjs'].map(name=>[name,createHash('sha256').update(fs.readFileSync('fushimi_inari/integrated-world/'+name)).digest('hex')]));
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
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
const features=read('fushimi_inari/geography/features.json');
if(!result.inariStation?.built||!result.inariStationRoute?.built)throw Error('Station arrival build failed');
const {buildPathMeshes}=await import('../../fushimi_inari/integrated-world/path-meshes.mjs');
result.root.add(buildPathMeshes(result.surfaces,result.legacy,result.ground));
let terrain=result.officePonds.clipTerrain(result.renderedTerrainPositions);
for(const owner of [result.mitsuFrontageAprons,result.mikoshikoPrecinct,result.shinsenjoPrecinct,result.shinikeWater])terrain=owner.clipTerrain?.(terrain)??terrain;
const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(terrain,3));
const tm=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({color:0x635c45}));tm.name='Actual clipped rendered terrain at -0.06';result.root.add(tm);
// Same mapped surrounding-building extrusion contract as viewer.mjs.
for(const b of features.buildings){
 if(result.excludesBuilding(b))continue;
 const ring=b.points.slice(0,-1),contour=ring.map(p=>new THREE.Vector2(p[0],p[2])),sacred=b.tags.building==='shrine'||b.tags.religion==='shinto'||b.tags.amenity==='place_of_worship';
 const hv=parseFloat(b.tags.height),levels=parseFloat(b.tags['building:levels']),h=Number.isFinite(hv)?hv:Number.isFinite(levels)?levels*3:sacred?4:6;
 const low=Math.min(...ring.map(p=>result.ground(p[0],p[2]))),high=Math.max(...ring.map(p=>result.ground(p[0],p[2])))+h,v=[];
 for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length],q=[[a[0],low,a[2]],[c[0],low,c[2]],[c[0],high,c[2]],[a[0],high,a[2]]];for(const j of [0,1,2,0,2,3])v.push(...q[j]);}
 for(const tri of THREE.ShapeUtils.triangulateShape(contour,[]))for(const j of tri)v.push(ring[j][0],high,ring[j][2]);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:sacred?0x87796c:0xaaa79e}));m.name='Mapped context '+b.id;result.root.add(m);
}
const station=result.inariStation,spec=station.spec;
const regions={moving:[-250,-120,-110,125],door:[-215,-120,-20,125],platform:[-215,-120,-20,125],gates:[-210,-120,0,100],frontage:[-215,-120,-25,115],crossing:[-215,-110,-20,115],overview:[-220,-115,-50,125],section:[-220,-115,-50,125],shops:[-220,-115,-50,125],handoff:[-215,-120,-20,125]};
const outDir=path.resolve('outputs/inari-arrival-review');fs.mkdirSync(outDir,{recursive:true});
const pose=spec.arrival.interiorPose,platform=spec.arrival.platformPose;
const offset=spec.arrival.travelDirection.map(n=>-n*spec.arrival.travelDistance*.55);
const move=p=>p.map((n,i)=>n+offset[i]);
const [ex,ey,ez]=spec.publicExit.position;
const cameras={
 moving:{view:{position:move(pose.position),target:move(pose.target),lens:24}},
 door:{view:{position:pose.position,target:pose.target,lens:24}},
 platform:{view:{position:platform.position,target:spec.arrival.interiorPose.position,lens:24}},
 gates:{view:{position:[spec.route.stairBottom[0]-.8,ey+1.7,spec.route.stairBottom[2]],target:[ex+8,ey+1.7,ez],lens:22}},
 frontage:{view:{position:[ex+14,ey+3,ez-13],target:[ex-2,ey+2.3,ez],lens:27}},
 crossing:{view:{position:[-161, result.walkHeight(-161,10.342)+1.7,10.342],target:[-138,35.5,10.76],lens:24}},
 overview:{view:{position:[-175,150,38],target:[-174,34,37],lens:32,ortho:175}},
 section:{view:{position:[-182,56,72],target:[-176,36,37],lens:25}},
 shops:{view:{position:[-152,37.8,20],target:[-166,37,7],lens:27}},
 handoff:{view:{position:platform.position,target:platform.target,lens:29}}
};
// Preserve reviewed cameras across regional re-exports; refresh explicitly.
if(!fs.existsSync(path.join(outDir,'cameras.json'))||process.argv.includes('--refresh-cameras'))fs.writeFileSync(path.join(outDir,'cameras.json'),JSON.stringify(cameras,null,2));
if(process.argv.includes('--cameras-only'))process.exit(0);
result.root.updateMatrixWorld(true);
const manifest={revision:'JR-Inari-arrival-1',sourceHashes,appearance:'Actual Three geometry, simple material colors; no texture, cutout alpha, shader, WebGL or native appearance equivalence claimed.',terrain:'Uses final viewer clipping chain; integratedTerrainTriangles already carries -0.06 datum.',regions:{},anchors:result.spatial.anchors??result.spatial.byId};
if(process.argv.includes('--region')&&fs.existsSync(path.join(outDir,'manifest.json')))manifest.regions=JSON.parse(fs.readFileSync(path.join(outDir,'manifest.json'))).regions;
for(const [region,bounds]of Object.entries(regions)){
 station.setTrainOffset(region==='moving'?offset:[0,0,0]);station.setDoorOpen(region==='door'?1:0);result.root.updateMatrixWorld(true);
 if(process.argv.includes('--region')&&process.argv[process.argv.indexOf('--region')+1]!==region)continue;
 const file=path.join(outDir,region+'.json'),fd=fs.openSync(file,'w');fs.writeSync(fd,'{"meshes":[');let meshes=0,triangles=0,instances=0;const maxTriangles=1400000;
 const sectionTriangle=vs=>{let polygon=[];const plane=spec.frame.origin[1]+.2;for(let i=0;i<3;i++){const a=vs[i],b=vs[(i+1)%3],ai=a.z<=plane,bi=b.z<=plane;if(ai)polygon.push(a);if(ai!==bi)polygon.push(a.clone().lerp(b,(plane-a.z)/(b.z-a.z)));}return polygon.length<3?[]:Array.from({length:polygon.length-2},(_,i)=>[polygon[0],polygon[i+1],polygon[i+2]]);};
 const inside=(v)=>v.x>=bounds[0]&&v.x<=bounds[1]&&v.z>=bounds[2]&&v.z<=bounds[3];
 function emit(o,matrix){
  const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const sphere=g.boundingSphere.clone().applyMatrix4(matrix);if(sphere.center.x+sphere.radius<bounds[0]||sphere.center.x-sphere.radius>bounds[1]||sphere.center.z+sphere.radius<bounds[2]||sphere.center.z-sphere.radius>bounds[3])return;
  const p=g.attributes.position;if(!p)return;const index=g.index,groups=g.groups.length?g.groups:[{start:0,count:index?.count??p.count,materialIndex:0}];
  for(const group of groups){const material=Array.isArray(o.material)?o.material[group.materialIndex]:o.material;if(!material||material.visible===false)continue;let positions=[];
   const flush=()=>{if(!positions.length)return;const record={name:o.name||o.type,positions,color:material.color?.toArray()??[.6,.6,.6],opacity:material.transparent?material.opacity:1};fs.writeSync(fd,(meshes++?',':'')+JSON.stringify(record));positions=[];};
   for(let i=group.start;i<Math.min(group.start+group.count,index?.count??p.count);i+=3){const vs=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix));if(!vs.some(inside))continue;for(const face of region==='section'?sectionTriangle(vs):[vs]){if(++triangles>maxTriangles)throw Error(region+' exceeds bounded triangle budget');for(const v of face)positions.push(v.x,v.y,v.z);}if(positions.length>=90000)flush();}flush();
  }
 }
 function visit(o){if(!o.visible)return;if(o.isMesh){if(o.isInstancedMesh){const m=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);emit(o,m);instances++;}}else emit(o,o.matrixWorld);}
  // Export one highest-detail LOD, avoiding duplicate alternate levels.
  if(o.isLOD){if(o.levels[0])visit(o.levels[0].object);return;}for(const c of o.children)visit(c);
 }visit(result.root);fs.writeSync(fd,']}');fs.closeSync(fd);manifest.regions[region]={bounds,triangles,meshes,instances,bytes:fs.statSync(file).size};console.log(region,manifest.regions[region]);
}
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));
