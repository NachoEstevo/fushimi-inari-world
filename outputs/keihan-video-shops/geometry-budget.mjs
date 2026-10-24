// CPU geometry budget only. No browser, canvas rendering or WebGL context.
// Defaults to an immutable HEAD module snapshot; --working snapshots current
// source. --stdout reports without overwriting the preserved baseline.json.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const root=process.cwd(),base=path.resolve('fushimi_inari/integrated-world'),out=path.resolve('outputs/keihan-video-shops/baseline.json');
const working=process.argv.includes('--working'),stdout=process.argv.includes('--stdout');
if(!stdout&&fs.existsSync(out))throw Error('Preserved baseline.json already exists; use --stdout for another measurement');
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const files=execFileSync('git',['ls-tree','-r','--name-only',head,'--','fushimi_inari'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.mjs'));
if(working)for(const f of fs.readdirSync(base))if(f.endsWith('.mjs')&&!files.includes('fushimi_inari/integrated-world/'+f))files.push('fushimi_inari/integrated-world/'+f);
const sources={};
if(working){for(const file of files)if(fs.existsSync(file))sources[file]=fs.readFileSync(file,'utf8');}
else{
 const blobs=execFileSync('git',['cat-file','--batch'],{input:files.map(f=>head+':'+f).join('\n')+'\n',maxBuffer:80*1024*1024});let offset=0;
 for(const file of files){const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString(),size=Number(header.split(' ')[2]);if(!Number.isFinite(size))throw Error('Snapshot failed for '+file+': '+header);offset=end+1;sources[file]=blobs.subarray(offset,offset+size).toString();offset+=size+1;}
}
const hash=s=>createHash('sha256').update(s).digest('hex');
const sourceHashes=Object.fromEntries(Object.entries(sources).map(([file,source])=>[file,hash(source)])),normalizedSourceHashes=Object.fromEntries(Object.entries(sources).map(([file,source])=>[file,hash(source.replaceAll('\r\n','\n'))]));
const ownersBeforeBatch={},ownerMeshes={};
function meshesOf(object){const meshes=[];object?.traverse(o=>{if(o.isMesh)meshes.push(o);});return meshes;}
function inventory(meshes){
 const geometries=new Set(),materials=new Set(),textures=new Set(),maps={},textureSizes=[];let triangles=0,draws=0,instances=0,shadowMeshes=0,geometryBytes=0,transparentMeshes=0;
 for(const mesh of meshes){const g=mesh.geometry;if(!g?.attributes.position)continue;geometries.add(g);const count=g.index?.count??g.attributes.position.count,range=Math.min(count-g.drawRange.start,g.drawRange.count),mult=mesh.isInstancedMesh?mesh.count:1;triangles+=Math.max(0,range)/3*mult;instances+=mult;shadowMeshes+=Number(mesh.castShadow);
  const materialList=Array.isArray(mesh.material)?mesh.material:[mesh.material];draws+=Array.isArray(mesh.material)?g.groups.filter(group=>materialList[group.materialIndex]?.visible!==false&&group.start<g.drawRange.start+range&&group.start+group.count>g.drawRange.start).length:materialList[0]?.visible===false?0:1;
  if(materialList.some(m=>m?.transparent))transparentMeshes++;
  for(const material of materialList){if(!material)continue;materials.add(material);for(const [key,value]of Object.entries(material)){if(!value?.isTexture)continue;textures.add(value);maps[key]=(maps[key]??0)+1;}}
 }
 for(const geometry of geometries){for(const attribute of Object.values(geometry.attributes))geometryBytes+=attribute.array?.byteLength??0;geometryBytes+=geometry.index?.array.byteLength??0;}
 for(const texture of textures)textureSizes.push({name:texture.name,kind:texture.isCanvasTexture?'canvas':texture.isDataTexture?'data':'image',width:texture.image?.width??null,height:texture.image?.height??null});
 return {meshes:meshes.length,drawCandidates:draws,triangles,instances,geometries:geometries.size,geometryBytes,materials:materials.size,textureIdentities:textures.size,mapSlots:maps,textureSizes,shadowMeshes,transparentMeshes};
}
function ownerRecord(owner){const meshes=meshesOf(owner?.group);return {built:!!owner?.built,name:owner?.group?.name??null,builtIds:owner?.builtIds??[],bounds:meshes.length?new THREE.Box3().setFromObject(owner.group).getSize(new THREE.Vector3()).toArray():null,reported:owner?.stats??{drawBatches:owner?.drawBatches,triangles:owner?.triangles},geometry:inventory(meshes)};}
globalThis.__shopBudgetBeforeBatch=owners=>{for(const [name,owner]of Object.entries(owners)){owner?.group?.updateWorldMatrix(true,true);ownersBeforeBatch[name]=ownerRecord(owner);ownerMeshes[name]=meshesOf(owner?.group);}};
const integrationKey='fushimi_inari/integrated-world/integration.mjs',needle='const staticBatches=batchStaticScene(root,retained);';
if(!sources[integrationKey].includes(needle))throw Error('Static-batching capture contract changed');
sources[integrationKey]=sources[integrationKey].replace(needle,'globalThis.__shopBudgetBeforeBatch({keihanStation,keihanApproach,keihanFrontages,keihanStreetContext,keihanUrasando,keihanRail});'+needle);
const snapshot=Object.fromEntries(Object.entries(sources).map(([file,source])=>[pathToFileURL(path.join(root,file)).href,source]));
register('data:text/javascript,'+encodeURIComponent('let files;export function initialize(data){files=data;}export async function load(url,context,nextLoad){const key=url.split("?")[0];if(Object.hasOwn(files,key))return {format:"module",source:files[key],shortCircuit:true};return nextLoad(url,context);}'),{parentURL:import.meta.url,data:snapshot});
const noop=()=>{},context=new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:()=>({data:new Uint8ClampedArray(16)}),createImageData:()=>({data:new Uint8ClampedArray(16)})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({width:64,height:64,style:{},getContext:()=>context,addEventListener(type,fn){this.listeners??={};this.listeners[type]=fn;},removeEventListener:noop,set src(v){this._src=v;queueMicrotask(()=>this.listeners?.load?.call(this));},get src(){return this._src;}});
globalThis.document={createElement:element,createElementNS:element,body:{dataset:{},appendChild:noop}};globalThis.window={URL:globalThis.URL,innerWidth:1280,innerHeight:720};globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:64,height:64,close:noop});
globalThis.fetch=async input=>new Response(fs.readFileSync(path.resolve(base,typeof input==='string'?input:input.url)));
const pendingAssetLoads=[];
GLTFLoader.prototype.loadAsync=function(url){const b=fs.readFileSync(path.resolve(base,url)),promise=new Promise((resolve,reject)=>this.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'',resolve,reject));pendingAssetLoads.push(promise);return promise;};
const imports=await Promise.all(['integration','path-meshes','station-approach-surface-fixes','keihan-street-commerce','keihan-street-observed-details','candle-flame-instances','world-detail-chunks'].map(name=>import(pathToFileURL(path.join(base,name+'.mjs')).href)));
const [{integrate},{buildPathMeshes},{buildStationApproachSurfaceFixes},{installKeihanStreetCommerce},{buildKeihanStreetObservedDetails},{installCandleFlameInstances},{createWorldDetailChunks}]=imports;
const dataHashes={},read=name=>{const file='fushimi_inari/geography/'+name+'.json',bytes=fs.readFileSync(file);dataHashes[file]=hash(bytes);return JSON.parse(bytes);};
const features=read('features'),terrain=read('terrain'),scene=new THREE.Scene(),started=performance.now();
const assembly=await integrate(scene,{capabilities:{getMaxAnisotropy:()=>1}},terrain,features);const assemblyMs=performance.now()-started;
// integrate launches the reception-attendant visual upgrade without awaiting
// it. Wait for already-requested assets in BOTH snapshots before counting.
await Promise.allSettled(pendingAssetLoads);await Promise.resolve();
const pathGroup=buildPathMeshes(assembly.surfaces,assembly.legacy,assembly.ground);assembly.root.add(pathGroup);
const fixes=buildStationApproachSurfaceFixes(assembly,pathGroup,features);assembly.walkHeight=fixes.walkHeight;
const commerce=installKeihanStreetCommerce(assembly),observed=buildKeihanStreetObservedDetails(assembly),candles=installCandleFlameInstances(assembly.legacy.flickeringCandleMeshes);candles.update(0);
const postBuilders={commerce:ownerRecord(commerce),observedDetails:ownerRecord(observed)};
for(const [name,owner]of Object.entries({commerce,observedDetails:observed}))ownerMeshes[name]=meshesOf(owner.group);
let video=null;
if(sources['fushimi_inari/integrated-world/viewer.mjs'].includes('const videoMerchandise=buildKeihanVideoMerchandise(assembly)')){
 const {buildKeihanVideoMerchandise}=await import(pathToFileURL(path.join(base,'keihan-video-merchandise.mjs')).href);const start=performance.now();video=buildKeihanVideoMerchandise(assembly);postBuilders.videoMerchandise=ownerRecord(video);postBuilders.videoMerchandise.buildAndInventoryMs=performance.now()-start;ownerMeshes.videoMerchandise=meshesOf(video.group);
}
const totalBeforeVisibility=inventory(meshesOf(assembly.root));
const chunks=createWorldDetailChunks();for(const mesh of assembly.staticBatches.meshes)chunks.add(mesh);for(const {object,bounds}of assembly.forestChunks)chunks.add(object,{bounds,radius:260,margin:40});for(const group of observed.detailGroups??[])chunks.add(group,{radius:100,margin:20});for(const group of commerce.detailGroups??[])chunks.add(group,{radius:80,margin:20});for(const group of assembly.keihanRail?.detailGroups??[])chunks.add(group);
for(const group of video?.detailGroups??[])chunks.add(group,{radius:28,margin:8});
const eye=(x,z)=>[x,assembly.walkHeight(x,z)+1.7,z],food=assembly.spatial.byId.keihan_food;
const poses={stationStreet:{position:eye(-301.277,-124.745),target:eye(-291.042,-114.169)},foodCounter:{position:food.checkpoint.map((v,i)=>v+(i===1?1.7:0)),target:food.lookAt},urasandoEntrance:{position:eye(-151.505,-87.319),target:eye(-124.95,-84.325)},innerMerchantLane:{position:eye(-124.95,-84.325),target:eye(-84.756,-75.096)}};
const views={};let sample=0;
for(const [name,pose]of Object.entries(poses)){
 const camera=new THREE.PerspectiveCamera(45,1280/720,.2,12000);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld(true);chunks.restore();chunks.update(camera,sample++,1,true);assembly.root.traverse(o=>{if(o.isLOD&&o.autoUpdate)o.update(camera);});assembly.root.updateMatrixWorld(true);
 const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const visible=[];assembly.root.traverseVisible(o=>{if(o.isMesh&&(!o.frustumCulled||frustum.intersectsObject(o)))visible.push(o);});
 const sourceOwners=Object.fromEntries(Object.entries(ownerMeshes).map(([key,meshes])=>[key,inventory(meshes.filter(o=>!o.frustumCulled||frustum.intersectsObject(o)))]));
 const shadow=new THREE.OrthographicCamera(-40,40,40,-40,1,200),target=camera.position.clone().add(new THREE.Vector3(0,-1.7,0));shadow.position.copy(target).add(new THREE.Vector3(-45,65,35));shadow.lookAt(target);shadow.updateMatrixWorld(true);const sf=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(shadow.projectionMatrix,shadow.matrixWorldInverse)),shadowMeshes=[];assembly.root.traverseVisible(o=>{if(o.isMesh&&o.castShadow&&(!o.frustumCulled||sf.intersectsObject(o)))shadowMeshes.push(o);});
 views[name]={pose,main:inventory(visible),shadow:inventory(shadowMeshes),residency:chunks.stats(),sourceOwnerCandidates:sourceOwners};
}
const changedDuringRun=Object.entries(normalizedSourceHashes).filter(([file,digest])=>fs.existsSync(file)&&hash(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n'))!==digest).map(([file])=>file);
const report={checkedAt:new Date().toISOString(),sourceMode:working?'working source snapshot':'immutable HEAD source snapshot',commit:head,runtime:{node:process.version,three:THREE.REVISION},sourceHashes,dataHashes,workingTreeContentDifferencesFromSnapshotAtEnd:changedDuringRun,scope:'CPU assembly with prebatch owner capture, paths/final walking sampler, commerce, observed/video details, candle instances and current near-detail policy; no WebGL/GPU/FPS or visual acceptance. Viewer terrain/canopy/city/sky/water and additional street visitors are excluded; the existing reception-attendant asset replacement is awaited in both snapshots. Source-owner candidates are before static-sector merging and before residency; main/shadow totals use the postbatch assembly. GLTF image decoding is stubbed; missing GLTF maps are not a VRAM estimate. Canvas atlas dimensions are real authored dimensions, pixels are not rendered. mapSlots counts per-mesh material references, not distinct texture identities. Working content comparison ignores LF/CRLF differences.',assemblyMs,ownersBeforeBatch,postBuilders,totalBeforeVisibility,staticBatching:{mergedBatches:assembly.staticBatches.mergedBatches,sourceMeshes:assembly.staticBatches.sourceMeshes,resultMeshes:assembly.staticBatches.meshes.length},candleStats:candles.stats,views,plannedAddedDecorativeBudget:{triangles:15000,maxVisibleBatches:20},risks:['Shared material batches span several storefronts; keep new small merchandise in bounded per-store groups.','detailRadius metadata is not consumed by createWorldDetailChunks.add; register explicit ranges.','Existing grill detail spans frontages, commerce and observed fascia; avoid duplicate products/surfaces.','Video-open display bays retain the existing entrance blockers; they are not new walkable shop interiors.']};
if(!stdout){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));}
const compact=g=>({meshes:g.meshes,triangles:g.triangles,materials:g.materials,textures:g.textureIdentities});
console.log(JSON.stringify(stdout?report:{checkedAt:report.checkedAt,sourceMode:report.sourceMode,commit:head,assemblyMs,owners:Object.fromEntries(Object.entries({...ownersBeforeBatch,...postBuilders}).map(([name,o])=>[name,compact(o.geometry)])),views:Object.fromEntries(Object.entries(views).map(([name,v])=>[name,{main:compact(v.main),shadow:compact(v.shadow)}])),workingTreeContentDifferencesFromSnapshotAtEnd:changedDuringRun},null,2));
