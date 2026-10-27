const METHODS=['createProgram','createRenderPipeline','updateTexture','updateAttribute'];
function metadata(value){
 try{
  const object=value?.object??value,image=value?.source?.data??value?.image,array=value?.array??value?.data?.array;
  const name=object?.name||value?.material?.name,candidate=object?.type??value?.stage;
  const type=typeof candidate==='string'?candidate:(value?.isTexture?'Texture':array?.constructor?.name);
  const result={};if(typeof name==='string')result.name=name.slice(0,160);if(typeof type==='string')result.type=type.slice(0,80);
  if(value?.object){
   if(typeof object.uuid==='string')result.objectId=object.uuid.slice(0,80);
   const material=value.material;
   if(typeof material?.type==='string')result.materialType=material.type.slice(0,80);
   if(typeof material?.name==='string'&&material.name)result.material=material.name.slice(0,160);else if(result.materialType)result.material=result.materialType;
   if(Number.isFinite(material?.id))result.materialId=material.id;
  }
  for(const [key,number]of [['width',image?.width],['height',image?.height],['depth',image?.depth],['byteLength',array?.byteLength],['count',value?.count],['itemSize',value?.itemSize]])if(Number.isFinite(number))result[key]=number;
  return result;
 }catch{return {};}
}

// Opt-in synchronous CPU timing only. Promise identities and GPU scheduling are
// untouched; no pipeline completion handlers or queue roundtrips are installed.
export function installBackendWorkAudit(backend,{now=()=>performance.now(),limit=120,thresholdMs=2}={}){
 const hooks=[],recent=[],pipelines=[],size=Math.max(1,Math.min(1000,Math.floor(limit)||120)),threshold=Math.max(0,Number.isFinite(thresholdMs)?thresholdMs:2);
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
      if(ms>=threshold||method==='createRenderPipeline'){
       const event={startTimeMs:start,ms,method,phase:currentPhase,...metadata(args[0])};
       if(ms>=threshold){recent.push(event);if(recent.length>size)recent.shift();}
       if(method==='createRenderPipeline'){pipelines.push({...event,mode:Array.isArray(args[1])?'async':'sync'});if(pipelines.length>size)pipelines.shift();}
      }
     }
    }catch{/* Diagnostics must never replace a backend return or exception. */}
   }
  }
  hooks.push({method,original,owned,wrapped});backend[method]=wrapped;
 }
 const copy=entries=>Object.fromEntries(Object.entries(entries).map(([key,value])=>[key,{...value}]));
 return {get stats(){return {totals:{count,totalMs,methods:copy(methods),phases:copy(phases)},recent:recent.map(event=>({...event})),pipelines:pipelines.map(event=>({...event}))};},
  setPhase(value){if(!disposed)phase=String(value).slice(0,80);},
  reset(){generation++;count=0;totalMs=0;methods=Object.create(null);phases=Object.create(null);recent.length=0;pipelines.length=0;},
  dispose(){if(disposed)return;disposed=true;for(const {method,original,owned,wrapped}of hooks)if(backend[method]===wrapped){if(owned)backend[method]=original;else delete backend[method];}}
 };
}
