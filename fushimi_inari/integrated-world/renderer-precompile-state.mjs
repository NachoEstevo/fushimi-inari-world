import {REVISION} from 'three';

// r187 queues target restoration with each compile item. Our scene-pass, city
// and station compilers restore their temporary target after submission, so
// each later native slice must restore the current outside view, not that
// temporary target. Otherwise the output quad samples its own attachments.
export function installPrecompileStateRestoration(renderer,{revision=REVISION}={}){
 const original=renderer?._beginPreCompile;
 const enabled=String(revision)==='187'&&typeof original==='function';
 if(!enabled)return {enabled:false,dispose(){}};
 const descriptor=Object.getOwnPropertyDescriptor(renderer,'_beginPreCompile');let active=true;
 function begin(state){
  if(!active||this!==renderer||state?.item==null)return original.apply(this,arguments);
  const outside={target:this.getRenderTarget(),face:this.getActiveCubeFace(),mip:this.getActiveMipmapLevel(),mrt:this.getMRT()};
  const result=original.apply(this,arguments);
  // Native begin consumes renderTarget/MRT/context and material side. Change
  // only the later finish destination, including resumes after native yields.
  restorePrecompileTarget(this,outside,{revision});return result;
 }
 renderer._beginPreCompile=begin;
 return {enabled:true,dispose(){
  if(!active)return;active=false;
  if(renderer._beginPreCompile===begin){
   if(descriptor)Object.defineProperty(renderer,'_beginPreCompile',descriptor);else delete renderer._beginPreCompile;
  }
 }};
}

// The first item begins synchronously while a scoped compiler's temporary
// target is still bound. Repair its destination before that caller restores
// outside state; later items and scheduler resumes use the installer above.
export function restorePrecompileTarget(renderer,previous,{revision=REVISION}={}){
 const state=renderer?._precompilationState;
 if(String(revision)!=='187'||state?.item==null)return false;
 Object.assign(state,{outputRenderTarget:previous.target,activeCubeFace:previous.face,
  activeMipmapLevel:previous.mip,outputMRT:previous.mrt});
 return true;
}
