import {REVISION,StaticDrawUsage,InstancedBufferAttribute} from 'three';

// r180/r186 emit uniform mat4 arrays sized from instanceMatrix.count for <=1000
// entries. Group storage capacities before FIRST compilation while preserving
// every authored matrix and the independent mesh.count used by draws/bounds.
// Pass only explicit immutable owners; growing into the spare slots is not an
// authored placement. Keep this mitigation within 64000 bytes even when r186's
// backend supports a larger uniform buffer; larger capacities stay untouched.
export function padStaticInstanceMatrices(roots,{revision=REVISION,onEligible=()=>{}}={}){
 const stats={eligible:0,padded:0,uniqueBefore:0,uniqueAfter:0,capacitiesBefore:[],capacitiesAfter:[],extraBytes:0};
 if(!['180','186'].includes(String(revision)))return stats;
 const seen=new Set(),before=new Set(),after=new Set();
 for(const root of roots)root?.traverse?.(mesh=>{
  if(seen.has(mesh)||!mesh.isInstancedMesh)return;seen.add(mesh);
  const source=mesh.instanceMatrix,capacity=source?.count;
  if(!source?.isInstancedBufferAttribute||source.usage!==StaticDrawUsage||!(source.array instanceof Float32Array)||source.itemSize!==16||
   !Number.isInteger(capacity)||capacity<0||capacity>1000||source.array.length!==capacity*16||!Number.isInteger(mesh.count)||mesh.count<0||mesh.count>capacity)return;
  const target=Math.min(1000,Math.max(16,2**Math.ceil(Math.log2(Math.max(1,capacity)))));
  stats.eligible++;before.add(capacity);after.add(target);
  if(target!==capacity){
   const array=new Float32Array(target*16);array.set(source.array);
   const attribute=new InstancedBufferAttribute(array,16,source.normalized,source.meshPerAttribute);
   attribute.name=source.name;attribute.setUsage(source.usage);attribute.gpuType=source.gpuType;attribute.version=source.version;
   attribute.onUploadCallback=source.onUploadCallback;attribute.updateRanges=source.updateRanges.map(range=>({...range}));
   mesh.instanceMatrix=attribute;stats.padded++;stats.extraBytes+=array.byteLength-source.array.byteLength;
  }
  onEligible(mesh);
 });
 stats.capacitiesBefore=[...before].sort((a,b)=>a-b);stats.capacitiesAfter=[...after].sort((a,b)=>a-b);
 stats.uniqueBefore=before.size;stats.uniqueAfter=after.size;return stats;
}
