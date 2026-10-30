import {REVISION} from 'three';
import {restorePrecompileTarget} from './renderer-precompile-state.mjs';

// r186 compiles at depth 0, but RenderPipeline reads its scene pass at depth 1.
// See https://github.com/mrdoob/three.js/issues/34681. Keep the workaround scoped
// to native submission; awaiting compilation must never retain renderer state.
export function compileScenePass(renderer,scenePass,scope,view,targetScene,{revision=REVISION}={}){
 if(renderer.hasInitialized?.()!==true)return Promise.reject(new Error('Initialize the renderer before compiling scene visuals'));
 scenePass.setup({renderer});
 const previous={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),mrt:renderer.getMRT()};
 const contexts=renderer._renderContexts,mrt=scenePass.getMRT();
 const original=contexts?.get,descriptor=contexts&&Object.getOwnPropertyDescriptor(contexts,'get');
 let active=false;
 function selectContext(target,attachments,depth){
  const args=Array.from(arguments);
  if(active&&this===contexts&&target===scenePass.renderTarget&&attachments===mrt&&(depth===undefined||depth===0))args[2]=1;
  return original.apply(this,args);
 }
 try{
  renderer.setRenderTarget(scenePass.renderTarget);renderer.setMRT(mrt);
  if(String(revision)==='186'&&typeof original==='function'){
   contexts.get=selectContext;active=true;
  }
  // An initialized r186 renderer selects the context synchronously, before its
  // first await. Preserve its native promise and synchronous error behavior.
  return renderer.compileAsync(scope,view,targetScene);
 }finally{
  restorePrecompileTarget(renderer,previous,{revision});
  active=false;
  if(contexts?.get===selectContext){
   if(descriptor)Object.defineProperty(contexts,'get',descriptor);else delete contexts.get;
  }
  try{renderer.setRenderTarget(previous.target,previous.face,previous.mip);}
  finally{renderer.setMRT(previous.mrt);}
 }
}
