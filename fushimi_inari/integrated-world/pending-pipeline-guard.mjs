// Three r180 caches a pipeline before createRenderPipelineAsync resolves.
// Guard its WebGPU draw boundary so unrelated ready objects can still render.
export function installPendingPipelineGuard(backend){
 if(!backend?.isWebGPUBackend||typeof backend.get!=='function'||typeof backend.draw!=='function')return {get stats(){return {skipped:0,lastObjectName:''};},dispose(){}};
 const original=backend.draw,owned=Object.hasOwn(backend,'draw');
 let skipped=0,lastObjectName='';
 function draw(renderObject,info){
  if(renderObject.pipeline&&!backend.get(renderObject.pipeline).pipeline){skipped++;lastObjectName=renderObject.object?.name||renderObject.object?.type||'';return;}
  return original.apply(this,arguments);
 }
 backend.draw=draw;
 return {get stats(){return {skipped,lastObjectName};},dispose(){if(backend.draw===draw){if(owned)backend.draw=original;else delete backend.draw;}}};
}
