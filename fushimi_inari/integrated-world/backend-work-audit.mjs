const RESOURCE_METHODS=new Set(['createAttribute','createIndexAttribute','createStorageAttribute','createIndirectStorageAttribute','createTexture','updateTexture','generateMipmaps']);
const METHODS=['createProgram','createRenderPipeline','updateAttribute',...RESOURCE_METHODS,'draw','beginRender','finishRender','createBindings','updateBindings'];
function metadata(value,options,identify,method,cacheIndex,bindingVersion){
 try{
  const object=value?.object??value,image=value?.source?.data??value?.image,array=value?.array??value?.data?.array??image?.data;
  const name=object?.name||value?.material?.name,candidate=object?.type??value?.stage;
  const type=typeof candidate==='string'?candidate:(value?.isTexture?'Texture':array?.constructor?.name);
  const result={};if(typeof name==='string')result.name=name.slice(0,160);if(typeof type==='string')result.type=type.slice(0,80);
  if(value?.object){
   if(typeof object.uuid==='string')result.objectId=object.uuid.slice(0,80);
   const material=value.material;
   if(typeof material?.type==='string')result.materialType=material.type.slice(0,80);
   if(typeof material?.name==='string'&&material.name)result.material=material.name.slice(0,160);else if(result.materialType)result.material=result.materialType;
   if(Number.isFinite(material?.id))result.materialId=material.id;
   result.pass=material?.isShadowPassMaterial===true?'shadow':'color';
   if(value.camera){result.cameraId=identify(value.camera,'camera');if(typeof value.camera.type==='string')result.cameraType=value.camera.type.slice(0,80);}
   if(value.geometry)result.geometryId=identify(value.geometry,'geometry');
   if(Number.isFinite(value.context?.id))result.contextId=value.context.id;
  }else if(value?.isTexture||value?.array||value?.data?.array){
   result.resourceId=identify(value,value.isTexture?'texture':'attribute');
   const version=value.version??value.data?.version;if(Number.isFinite(version))result.version=version;
   if(value.source){result.sourceId=identify(value.source,'source');if(Number.isFinite(value.source.version))result.sourceVersion=value.source.version;}
  }else if(method==='beginRender'||method==='finishRender'){
   if(Number.isFinite(value?.id))result.contextId=value.id;
   if(value?.renderTarget)result.renderTargetId=identify(value.renderTarget,'renderTarget');
   if(value?.depthTexture)result.depthTextureId=identify(value.depthTexture,'texture');
   for(const key of ['width','height'])if(Number.isFinite(value?.[key]))result[key]=value[key];
   if(Array.isArray(value?.textures))result.colorAttachmentCount=value.textures.length;
  }else if(method==='createBindings'||method==='updateBindings'){
   result.bindGroupId=identify(value,'bindGroup');
   if(Number.isFinite(value?.bindings?.length))result.bindingCount=value.bindings.length;
   if(Number.isFinite(cacheIndex))result.cacheIndex=cacheIndex;
   if(Number.isFinite(bindingVersion))result.bindingVersion=bindingVersion;
  }
  for(const [key,number]of [['width',image?.width??options?.width],['height',image?.height??options?.height],['depth',image?.depth??options?.depth],['byteLength',array?.byteLength],['count',value?.count],['itemSize',value?.itemSize]])if(Number.isFinite(number))result[key]=number;
  return result;
 }catch{return {};}
}

// Opt-in synchronous CPU timing only. Promise identities and GPU scheduling are
// untouched; no pipeline completion handlers or queue roundtrips are installed.
// Durations are inclusive: nested backend calls overlap in the summed totals.
export function installBackendWorkAudit(backend,{now=()=>performance.now(),limit=120,thresholdMs=2}={}){
 const hooks=[],recent=[],pipelines=[],resources=[],identities=new WeakMap(),size=Math.max(1,Math.min(1000,Math.floor(limit)||120)),threshold=Math.max(0,Number.isFinite(thresholdMs)?thresholdMs:2);
 let serial=0;
 const identify=(value,kind)=>{
  if(!value||(typeof value!=='object'&&typeof value!=='function'))return undefined;
  const id=typeof value.uuid==='string'?value.uuid.slice(0,80):Number.isFinite(value.id)?value.id:null;
  if(id!==null)return `${kind}:${id}`;
  if(!identities.has(value))identities.set(value,++serial);return `${kind}:audit-${identities.get(value)}`;
 };
 let phase='render',disposed=false,generation=0,count=0,totalMs=0,methods=Object.create(null),phases=Object.create(null);
 const add=(totals,key,ms)=>{const entry=totals[key]??={count:0,totalMs:0,maxMs:0};entry.count++;entry.totalMs+=ms;entry.maxMs=Math.max(entry.maxMs,ms);};
 for(const method of METHODS){
  const original=backend?.[method];if(typeof original!=='function')continue;
  const owned=Object.hasOwn(backend,method);
  function wrapped(...args){
   let start;try{start=now();}catch{}
   const epoch=generation,currentPhase=phase;
   try{return original.apply(this,args);}finally{
    if(!disposed&&epoch===generation)try{
     const ms=now()-start;
     if(Number.isFinite(ms)&&ms>=0){
      count++;totalMs+=ms;add(methods,method,ms);add(phases,currentPhase,ms);
      if(ms>=threshold||method==='createRenderPipeline'||RESOURCE_METHODS.has(method)){
       const event={startTimeMs:start,ms,method,phase:currentPhase,...metadata(args[0],args[1],identify,method,args[2],args[3])};
       if(ms>=threshold){recent.push(event);if(recent.length>size)recent.shift();}
       if(method==='createRenderPipeline'){pipelines.push({...event,mode:Array.isArray(args[1])?'async':'sync'});if(pipelines.length>size)pipelines.shift();}
       // First allocations and image uploads matter even below the slow-call
       // threshold. Keep them separate from per-frame matrix buffer updates.
       if(RESOURCE_METHODS.has(method)){resources.push(event);if(resources.length>size)resources.shift();}
      }
     }
    }catch{/* Diagnostics must never replace a backend return or exception. */}
   }
  }
  hooks.push({method,original,owned,wrapped});backend[method]=wrapped;
 }
 const copy=entries=>Object.fromEntries(Object.entries(entries).map(([key,value])=>[key,{...value}]));
 return {get stats(){return {totals:{count,totalMs,methods:copy(methods),phases:copy(phases)},recent:recent.map(event=>({...event})),pipelines:pipelines.map(event=>({...event})),resources:resources.map(event=>({...event}))};},
  setPhase(value){if(!disposed)phase=String(value).slice(0,80);},
  reset(){generation++;count=0;totalMs=0;methods=Object.create(null);phases=Object.create(null);recent.length=0;pipelines.length=0;resources.length=0;},
  dispose(){if(disposed)return;disposed=true;for(const {method,original,owned,wrapped}of hooks)if(backend[method]===wrapped){if(owned)backend[method]=original;else delete backend[method];}}
 };
}
