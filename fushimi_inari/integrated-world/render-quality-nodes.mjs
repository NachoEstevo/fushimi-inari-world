import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';

const presets={balanced:{maxPixels:2000000,maxRatio:1.25,shadowSize:2048},high:{maxPixels:4000000,maxRatio:2,shadowSize:2048}};
export function qualityPixelRatio(mode,dpr,width,height){
  const quality=mode==='ultra'?'high':mode;
  const preset=presets[quality]??presets.balanced;
  const ratio=quality==='high'?Math.max(dpr,1.5):dpr;
  // Bound every preset by physical pixels, including ultrawide and high-DPI screens.
  return Math.min(ratio,preset.maxRatio,Math.sqrt(preset.maxPixels/Math.max(1,width*height)));
}

// One scene pass feeds bloom and the output transform. There is no duplicate scene render.
export function createRenderQuality({renderer,scene,camera,sun,cityHorizon}){
  let mode='balanced',look='natural',disposed=false,transitioning=false;
  let pending=0,queue=Promise.resolve(),resolution;
  const originalTextures=new Map();
  const post=new THREE.PostProcessing(renderer);
  const scenePass=pass(scene,camera),foreground=scenePass.getTextureNode('output');
  const color=cityHorizon?cityHorizon.compose(foreground,scenePass.getTextureNode('depth')):foreground;
  const glow=bloom(color,.12,.35,1.2);
  post.outputNode=color.add(glow);
  const looks={natural:{strength:.12,radius:.35,threshold:1.2},sakura:{strength:.30,radius:.5,threshold:1.05},dreamcore:{strength:.65,radius:.7,threshold:.85}};
  function report(status=transitioning?'resizing':'ready'){
    document.body.dataset.renderQuality=JSON.stringify({mode,look,status,pixelRatio:renderer.getPixelRatio(),shadowSize:sun.shadow.mapSize.x,ao:false,bloom:glow.strength.value,detailScale:mode==='high'?1.25:1,maxPixels:presets[mode].maxPixels});
  }
  function setLook(next){
    look=Object.hasOwn(looks,next)?next:'natural';
    const values=looks[look];
    glow.strength.value=values.strength*(mode==='balanced'?.65:1);
    glow.radius.value=values.radius;glow.threshold.value=values.threshold;report();
  }
  function applySize(width,height){
    const ratio=qualityPixelRatio(mode,devicePixelRatio,width,height);
    const next=[width,height,ratio];
    const changed=resolution&&next.some((value,index)=>value!==resolution[index]);
    if(resolution&&!changed){report();return;}
    // setPixelRatio calls setSize internally. Commit the drawing buffer once so
    // WebGPU never destroys an intermediate multisampled canvas attachment.
    renderer.setDrawingBufferSize(width,height,ratio);
    if(renderer.domElement){renderer.domElement.style.width=width+'px';renderer.domElement.style.height=height+'px';}
    // PassNode and BloomNode resize their own targets during updateBefore.
    // Keep their texture and binding identities stable across canvas resizes.
    resolution=next;report();
  }
  function enqueue(change){
    if(disposed)return Promise.resolve();
    pending++;transitioning=true;report();
    const task=queue.then(async()=>{
      if(disposed)return;
      await renderer.waitForGPU?.();
      if(!disposed)change();
    });
    queue=task.catch(()=>{});
    return task.finally(()=>{pending--;transitioning=pending>0;if(!disposed)report();});
  }
  function resize(width=innerWidth,height=innerHeight){
    return enqueue(()=>applySize(width,height));
  }
  function textures(root=scene){
    const maxAnisotropy=Math.min(16,renderer.getMaxAnisotropy());
    root.traverse(o=>{for(const material of [o.material].flat().filter(Boolean))for(const texture of Object.values(material)){
      if(!texture?.isTexture||!texture.image||texture.isRenderTargetTexture)continue;
      if(!originalTextures.has(texture))originalTextures.set(texture,texture.anisotropy);
      const next=mode==='high'?maxAnisotropy:originalTextures.get(texture);
      if(texture.anisotropy!==next){texture.anisotropy=next;texture.needsUpdate=true;}
    }});
  }
  function applyMode(next){
    mode=next==='high'||next==='ultra'?'high':'balanced';textures();
    const shadowSize=presets[mode].shadowSize;
    // r180 caches shadow views in bind groups; use one atlas size for its lifetime.
    sun.shadow.mapSize.set(shadowSize,shadowSize);
    applySize(innerWidth,innerHeight);setLook(look);
  }
  function setMode(next){return enqueue(()=>applyMode(next));}
  function compileAsync(scope,view,targetScene){
    if(disposed)return Promise.reject(new Error('Render quality is disposed'));
    if(renderer.hasInitialized?.()===false)return Promise.reject(new Error('Initialize the renderer before compiling scene visuals'));
    // PassNode configures type and MSAA lazily during graph setup. Mirror its
    // actual setup before a pre-arrival compile, even before the first render.
    scenePass.setup({renderer});
    const previous={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),mrt:renderer.getMRT()};
    try{
      renderer.setRenderTarget(scenePass.renderTarget);renderer.setMRT(scenePass.getMRT());
      return renderer.compileAsync(scope,view,targetScene);
    }finally{
      // An initialized r180 renderer submits pipelines synchronously, then
      // awaits backend work. Restore state before returning that promise.
      renderer.setRenderTarget(previous.target,previous.face,previous.mip);renderer.setMRT(previous.mrt);
    }
  }
  function render(){
    if(disposed||transitioning)return;
    cityHorizon?.render();
    // Animation commits transforms before this call. The main pass and nested
    // shadow renders use the same world matrices; do not traverse/recompose
    // the whole world again for each shadow pass. Cameras retain their updates.
    const autoUpdate=scene.matrixWorldAutoUpdate;
    if(autoUpdate)scene.updateMatrixWorld();
    scene.matrixWorldAutoUpdate=false;
    try{post.render();}finally{scene.matrixWorldAutoUpdate=autoUpdate;}
  }
  // The menu emits changes only; establish balanced bloom and telemetry now.
  applyMode('balanced');
  return {setMode,setLook,resize,render,compileAsync,refreshTextures:textures,get detailScale(){return mode==='high'?1.25:1;},get mode(){return mode;},get look(){return look;},dispose(){if(disposed)return;disposed=true;cityHorizon?.dispose();glow.dispose();scenePass.dispose();post.dispose();originalTextures.clear();}};
}
