// Local, bounded diagnostics. GPU memory counters are object counts, not bytes.
export function installRendererHealth({renderer,getContext=()=>({}),audit=false,document=globalThis.document,now=()=>performance.now(),setInterval=globalThis.setInterval,clearInterval=globalThis.clearInterval,maxSamples=120,maxEvents=50}={}){
 const canvas=renderer.domElement,device=renderer.backend?.device,start=now(),samples=[],events=[];
 const sampleLimit=Math.max(1,Math.min(1000,Math.floor(maxSamples)||120)),eventLimit=Math.max(1,Math.min(200,Math.floor(maxEvents)||50));
 let disposed=false,failed=false,panel=null,timer=null,firstError=null;
 const bounded=(value,depth=0)=>{
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(typeof value==='string')return value.slice(0,300);
  if(depth>=4||typeof value!=='object')return null;
  if(Array.isArray(value))return value.slice(0,40).map(item=>bounded(item,depth+1));
  return Object.fromEntries(Object.entries(value).slice(0,40).map(([key,item])=>[key.slice(0,80),bounded(item,depth+1)]));
 };
 const elapsed=()=>Math.max(0,now()-start);
 function sample(){
  if(disposed)return;
  let context;try{context=bounded(getContext());}catch{context={error:'context unavailable'};}
  const memory=renderer.info?.memory??{};
  samples.push({elapsedMs:elapsed(),backend:renderer.backend?.isWebGPUBackend?'webgpu':'webgl2',memory:{geometries:Number.isFinite(memory.geometries)?memory.geometries:null,textures:Number.isFinite(memory.textures)?memory.textures:null},context});
  if(samples.length>sampleLimit)samples.shift();
 }
 const stats=()=>({failed,firstError:firstError?{...firstError}:null,samples:[...samples],events:[...events]});
 function exportDiagnostic(){
  sample();const blob=new Blob([JSON.stringify(stats(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='renderer-diagnostic.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),0);
 }
 function show(){
  if(panel)return;
  panel=document.createElement('section');panel.setAttribute?.('aria-label','Graphics diagnostics');if(panel.style)panel.style.cssText=`position:fixed;left:12px;bottom:${audit?70:12}px;z-index:10001;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px;background:#18201f;color:white;font:14px system-ui;max-width:90vw`;
  const text=document.createElement('span'),exportButton=document.createElement('button');
  text.textContent=failed?'Se perdió el dispositivo gráfico. Guardá el diagnóstico y recargá la página.':'Diagnóstico gráfico local';
  exportButton.type='button';exportButton.textContent='Exportar diagnóstico';exportButton.addEventListener('click',exportDiagnostic);panel.append(text,exportButton);
  if(failed){const reload=document.createElement('button');reload.type='button';reload.textContent='Recargar';reload.addEventListener('click',()=>document.defaultView?.location.reload());panel.append(reload);}
  document.body.append(panel);
 }
 function record(type,detail=''){
  if(disposed)return;
  const event={elapsedMs:elapsed(),type,detail:String(detail??'').slice(0,300)};
  // Secondary command-buffer errors can flood the ring after the actual cause.
  if(!firstError&&type!=='webglcontextrestored')firstError={...event,detail:String(detail??'').slice(0,1200)};
  events.push(event);if(events.length>eventLimit)events.shift();sample();
 }
 function lost(type,detail){if(disposed)return;failed=true;record(type,detail);if(panel){panel.remove();panel=null;}show();}
 const onError=event=>record('uncapturederror',event.error?.message??'');
 const onContextLost=event=>lost('webglcontextlost',event.statusMessage??'');
 const onContextRestored=()=>record('webglcontextrestored');
 device?.addEventListener?.('uncapturederror',onError);
 canvas?.addEventListener?.('webglcontextlost',onContextLost);canvas?.addEventListener?.('webglcontextrestored',onContextRestored);
 device?.lost?.then?.(info=>lost('device.lost',[info?.reason,info?.message].filter(Boolean).join(': ')),error=>record('device.lost.error',error?.message));
 if(audit){show();sample();timer=setInterval(sample,5000);}
 return {sample,get failed(){return failed;},get stats(){return stats();},dispose(){
  if(disposed)return;disposed=true;if(timer!==null)clearInterval(timer);device?.removeEventListener?.('uncapturederror',onError);
  canvas?.removeEventListener?.('webglcontextlost',onContextLost);canvas?.removeEventListener?.('webglcontextrestored',onContextRestored);panel?.remove();panel=null;
 }};
}
