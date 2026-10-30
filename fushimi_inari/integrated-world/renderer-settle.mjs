// Drain submitted work at explicit preparation/resize boundaries only. This
// throttles outstanding GPU work; it does not replace resource/pipeline readiness.
// Never use the renderer.waitForGPU() compatibility stub left by newer Three.
export async function settleRenderer(renderer){
 if(renderer?.hasInitialized?.()===false)throw new Error('Initialize the renderer before settling submitted work');
 const backend=renderer?.backend,queue=backend?.device?.queue;
 if(backend?.isWebGPUBackend===true&&typeof queue?.onSubmittedWorkDone==='function'){
  await queue.onSubmittedWorkDone();return true;
 }
 // r180's WebGL backend supplies a real client fence. Newer runtimes omit it.
 if(backend?.isWebGLBackend===true&&typeof backend.waitForGPU==='function'){
  await backend.waitForGPU();return true;
 }
 return false;
}
