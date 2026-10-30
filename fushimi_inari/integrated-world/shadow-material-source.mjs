import {REVISION} from 'three';

// r186/r187 evaluate source colorNode alpha in a colorless ShadowMaterial, but
// unbound MaterialReferenceNodes still read frame.material. Preserve the real
// source owner for shadow uniforms, including work queued by compileAsync.
// r187 source-material cache tracking does not change MaterialReferenceNode's
// frame owner. Other overrides and unverified revisions retain their native path.
export function installShadowMaterialSource(renderer,{revision=REVISION}={}){
 const manager=renderer?._nodes,original=manager?.getNodeFrameForRender;
 if(!['186','187'].includes(String(revision))||typeof original!=='function')return {dispose(){}};
 const descriptor=Object.getOwnPropertyDescriptor(manager,'getNodeFrameForRender');let active=true;
 function sourceFrame(renderObject){
  const frame=original.call(this,renderObject);
  if(active&&renderObject.material?.isShadowPassMaterial===true){
   let source=renderer._currentSourceMaterial;
   if(!source?.isMaterial||source.isShadowPassMaterial){
    const materials=renderObject.object?.material;
    source=Array.isArray(materials)?materials[renderObject.group?.materialIndex]:materials;
   }
   if(!source?.isMaterial||source.isShadowPassMaterial)source=renderObject._sourceMaterial;
   if(source?.isMaterial&&!source.isShadowPassMaterial)frame.material=source;
  }
  return frame;
 }
 manager.getNodeFrameForRender=sourceFrame;
 return {dispose(){
  if(!active)return;active=false;
  if(manager.getNodeFrameForRender===sourceFrame){
   if(descriptor)Object.defineProperty(manager,'getNodeFrameForRender',descriptor);else delete manager.getNodeFrameForRender;
  }
 }};
}
