import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {installCandleFlameInstances} from '../../fushimi_inari/integrated-world/candle-flame-instances.mjs';
const base=path.resolve('fushimi_inari/integrated-world'),out=path.resolve('outputs/inari-followup-performance');
const sourceFiles=['integration.mjs','viewer.mjs','candle-flame-instances.mjs'];
const hashes=Object.fromEntries(sourceFiles.map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(base,name))).digest('hex')]));
const noop=()=>{},context=new Proxy({measureText:()=>({width:20}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:()=>({data:new Uint8ClampedArray(16)}),createImageData:()=>({data:new Uint8ClampedArray(16)})},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({width:64,height:64,style:{},getContext:()=>context,addEventListener(type,fn){this.listeners??={};this.listeners[type]=fn;},removeEventListener:noop,set src(v){this._src=v;queueMicrotask(()=>this.listeners?.load?.call(this));},get src(){return this._src;}});
globalThis.document={createElement:element,createElementNS:element,body:{dataset:{},appendChild:noop}};
globalThis.window={URL:globalThis.URL,innerWidth:1280,innerHeight:720};globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:64,height:64,close:noop});
globalThis.fetch=async input=>new Response(fs.readFileSync(path.resolve(base,typeof input==='string'?input:input.url)));
GLTFLoader.prototype.loadAsync=async function(url){const b=fs.readFileSync(path.resolve(base,url));return new Promise((resolve,reject)=>this.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'',resolve,reject));};
const read=p=>JSON.parse(fs.readFileSync(p)),{integrate}=await import('../../fushimi_inari/integrated-world/integration.mjs');
const assembly=await integrate(new THREE.Scene(),{capabilities:{getMaxAnisotropy:()=>1}},read('fushimi_inari/geography/terrain.json'),read('fushimi_inari/geography/features.json'),{progress:s=>console.log(s)});
const flames=assembly.legacy.flickeringCandleMeshes,spec=assembly.inariStation.spec,median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const poses={train:spec.arrival.interiorPose,platform:spec.arrival.platformPose,crossing:{position:[-157.407,35.364626,10.342],target:[-138,35.364626,10.76]},keihanTrain:assembly.keihanStation.spec.arrival.interiorPose,keihanPlatform:assembly.keihanStation.spec.arrival.platformPose};
const flameParents=new Set(flames.map(flame=>flame.parent));
const originalWax=[...flameParents].flatMap(parent=>parent.children.filter(part=>part.isMesh&&part.geometry.type==='CylinderGeometry'&&part.geometry.parameters.radiusTop===.018&&part.geometry.parameters.radiusBottom===.020&&part.geometry.parameters.height===.16&&part.material.color?.getHex()===0xfff6e5));
const interactiveWax=originalWax.filter(wax=>assembly.legacy.interactables.includes(wax));
if(interactiveWax.length)throw Error('Wax instance candidates include direct interactables');
function visibleFrame(pose){
 const camera=new THREE.PerspectiveCamera(45,1280/720,.2,12000);camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld(true);
 for(const {object,bounds}of assembly.forestChunks)object.visible=camera.position.distanceTo(bounds.center)<bounds.radius+400;
 assembly.root.traverse(o=>{if(o.isLOD&&o.autoUpdate)o.update(camera);});assembly.root.updateMatrixWorld(true);
 const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const shadow=new THREE.OrthographicCamera(-40,40,40,-40,1,200),target=camera.position.clone().add(new THREE.Vector3(0,-1.7,0));shadow.position.copy(target).add(new THREE.Vector3(-45,65,35));shadow.lookAt(target);shadow.updateMatrixWorld(true);
 const shadowFrustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(shadow.projectionMatrix,shadow.matrixWorldInverse));
 function count(f,shadowOnly=false){const result={meshes:0,triangles:0,candleMeshes:0,candleTriangles:0};function visit(o){if(!o.visible)return;if(o.isMesh&&(!shadowOnly||o.castShadow)&&(!o.frustumCulled||f.intersectsObject(o))){const triangles=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);result.meshes++;result.triangles+=triangles;if(flames.includes(o)||o.name==='Instanced votive candle flames'){result.candleMeshes++;result.candleTriangles+=triangles;}}for(const child of o.children)visit(child);}visit(assembly.root);return result;}
 return {main:count(frustum),shadow:count(shadowFrustum,true)};
}
const measure=fn=>{const samples=[];for(let i=0;i<250;i++){const t=performance.now();fn(i*16.667);samples.push(performance.now()-t);}return {count:samples.length,medianMs:median(samples),maxMs:Math.max(...samples)};};
const oldUpdate=time=>{for(const flame of flames)flame.scale.y=.88+.12*Math.sin(time*.006+(flame.userData.phase??0));};
const before=Object.fromEntries(Object.entries(poses).map(([name,pose])=>[name,visibleFrame(pose)]));
const interactiveFlames=flames.filter(flame=>assembly.legacy.interactables.includes(flame));
if(interactiveFlames.length)throw Error('Candle instance candidates include direct interactables');
const candidateCamera=new THREE.PerspectiveCamera(45,1397/854,.2,12000);candidateCamera.position.set(...poses.train.position);candidateCamera.lookAt(...poses.train.target);candidateCamera.updateMatrixWorld(true);
const candidateFrustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(candidateCamera.projectionMatrix,candidateCamera.matrixWorldInverse));
const staticSet=new Set(assembly.staticDetailMeshes??[]),flameSet=new Set(flames),interactionSet=new Set(assembly.legacy.interactables),missing=[];
assembly.root.traverseVisible(o=>{
 if(!o.isMesh||o.isInstancedMesh||staticSet.has(o)||!candidateFrustum.intersectsObject(o))return;
 if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();const bounds=o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld),depth=-bounds.center.clone().applyMatrix4(candidateCamera.matrixWorldInverse).z,distance=candidateCamera.position.distanceTo(bounds.center),radiusPx=depth>bounds.radius?854*candidateCamera.projectionMatrix.elements[5]/2*bounds.radius*distance/(depth*(depth-bounds.radius)):Infinity;
 if(distance-bounds.radius<=80||radiusPx>=.5)return;
 const ancestors=[];let interaction=false,lod=false;for(let parent=o;parent;parent=parent.parent){ancestors.push(parent.name||parent.type);interaction||=interactionSet.has(parent);lod||=!!parent.isLOD;}
 missing.push({name:o.name,type:o.type,geometry:o.geometry.type,flame:flameSet.has(o),interaction,lod,arrayMaterial:Array.isArray(o.material),materials:[].concat(o.material).map(m=>({type:m.type,color:m.color?.getHexString(),transparent:m.transparent})),distance,radius:bounds.radius,radiusPx,ancestors:ancestors.slice(0,6)});
});
fs.writeFileSync(path.join(out,'unbatched-subpixel-candidates.json'),JSON.stringify(missing,null,2));
const originalCost=measure(time=>{oldUpdate(time);assembly.root.updateMatrixWorld(true);});
const controller=installCandleFlameInstances(flames);controller.update(0);assembly.root.updateMatrixWorld(true);
const after=Object.fromEntries(Object.entries(poses).map(([name,pose])=>[name,visibleFrame(pose)]));
const instancedCost=measure(time=>{controller.update(time);assembly.root.updateMatrixWorld(true);});
const deltas=Object.fromEntries(Object.keys(poses).map(name=>[name,{removedMainMeshes:before[name].main.meshes-after[name].main.meshes,triangleDelta:after[name].main.triangles-before[name].main.triangles,shadowMeshDelta:after[name].shadow.meshes-before[name].shadow.meshes,shadowTriangleDelta:after[name].shadow.triangles-before[name].shadow.triangles}]));
const report={checkedAt:new Date().toISOString(),scope:'Actual integrate CPU frustum candidates at1280x720 FOV45; before/after same assembly; no WebGL/GPU or native FPS claim. CPU update costs include root.updateMatrixWorld(true).',sourceHashes:hashes,stats:controller.stats,preservation:{directInteractiveFlames:interactiveFlames.length,directInteractiveWax:interactiveWax.length,originalWax:originalWax.length,interactables:assembly.legacy.interactables.length},missingSubpixel:{count:missing.length,flames:missing.filter(m=>m.flame).length,interactive:missing.filter(m=>m.interaction).length,LOD:missing.filter(m=>m.lod).length,arrayMaterials:missing.filter(m=>m.arrayMaterial).length},before,after,deltas,originalCost,instancedCost};
controller.dispose();report.restoredFlames=flames.filter(flame=>flame.parent).length;report.restoredWax=originalWax.filter(wax=>wax.parent).length;
fs.writeFileSync(path.join(out,'candle-benchmark.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
