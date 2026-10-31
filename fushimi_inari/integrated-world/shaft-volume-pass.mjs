import * as THREE from 'three/webgpu';
import {pass,texture,uniform} from 'three/tsl';
import {compileScenePass} from './scene-pass-compilation.mjs';

// Only the small shaft proxies are rendered here. The world depth stays owned
// by the existing scene pass; it is never copied or rendered a second time.
export function createShaftVolumePass({renderer,scene,camera,scenePass}){
 const volume=pass(scene,camera,{samples:0,depthBuffer:false});
 volume.name='Local sun shaft volumes';
 const active=uniform(0),clearColor=new THREE.Color();
 const nativeUpdate=volume.updateBefore.bind(volume);
 let initialized=false,disposed=false;
 const stats={renders:0,active:false,width:1,height:1};
 volume.updateBefore=frame=>{
  if(disposed)return;
  const enabled=scene.children.some(object=>object.visible&&(object.count===undefined||object.count>0));
  active.value=0;stats.active=false;
  if(!enabled&&initialized)return;
  const color=renderer.getClearColor(clearColor),alpha=renderer.getClearAlpha();
  const previous=renderer.getRenderTarget(),face=renderer.getActiveCubeFace?.(),mip=renderer.getActiveMipmapLevel?.();
  const previousMRT=renderer.getMRT(),mask=camera.layers.mask,context=renderer.contextNode,override=scene.overrideMaterial;
  const state=Object.fromEntries(['autoClear','autoClearColor','autoClearDepth','autoClearStencil','transparent','opaque','lighting'].map(key=>[key,renderer[key]]));
  try{
   if(!enabled){
    renderer.setClearColor(0,0);
    // The inactive graph samples transparent 1x1 storage. Balanced never
    // allocates a full-size volume target merely to multiply it by zero.
    volume.renderTarget.setSize(1,1);renderer.setRenderTarget(volume.renderTarget);renderer.clear();initialized=true;return;
   }
   // NodeFrame deduplicates FRAME nodes. This explicit dependency guarantees
   // current opaque depth even if graph traversal first reaches the volume.
   frame.updateBeforeNode(scenePass);
   renderer.setClearColor(0,0);nativeUpdate(frame);initialized=true;active.value=1;stats.active=true;stats.renders++;
   stats.width=volume.renderTarget.width;stats.height=volume.renderTarget.height;
  }finally{renderer.setRenderTarget(previous,face,mip);renderer.setMRT(previousMRT);renderer.setClearColor(color,alpha);
   Object.assign(renderer,state);renderer.contextNode=context;scene.overrideMaterial=override;camera.layers.mask=mask;}
 };
 return {pass:volume,node:volume.getTextureNode('output').rgb.mul(active),depth:texture(scenePass.renderTarget.depthTexture),stats,
  prepare(){
   const saved=scene.children.map(object=>({object,visible:object.visible,culled:object.frustumCulled,count:object.count}));
   try{
    for(const {object}of saved){object.visible=true;object.frustumCulled=false;if(object.count!==undefined)object.count=Math.max(1,object.count);}
    return compileScenePass(renderer,volume,scene,camera);
   }finally{for(const {object,visible,culled,count}of saved){object.visible=visible;object.frustumCulled=culled;if(count!==undefined)object.count=count;}}
  },
  dispose(){if(disposed)return;disposed=true;volume.dispose();}};
}
