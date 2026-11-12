import * as THREE from 'three/webgpu';
import {pass,uniform,vec2,vec3,vec4,mix,float,Fn,If,uv,smoothstep,reference,perspectiveDepthToViewZ,textureSize,max,abs} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {ao} from 'three/addons/tsl/display/GTAONode.js';
import {installPendingPipelineGuard} from './pending-pipeline-guard.mjs';
import {normalizeVisualLook,LOOK_BLOOM,LOOK_GRADE} from './visual-look.mjs';
import {settleRenderer} from './renderer-settle.mjs';
import {compileScenePass} from './scene-pass-compilation.mjs';
import {createShaftVolumePass} from './shaft-volume-pass.mjs';

// The RenderPipeline applies this once in its output transform (renderOutput);
// the scene pass renders to a target, so materials never tone map themselves.
// Neutral keeps sunlit vermilion within 7-12 degrees of its albedo hue where
// ACES drifts from crimson to orange, and keeps mid-tone texture contrast.
export const OUTPUT_TONE_MAPPING=THREE.NeutralToneMapping;
// High-only ground-truth AO on the WebGPU backend (view-space metres). Normals
// are reconstructed from the existing scene-pass depth: no MRT attachment, so
// every lit pipeline and the precompiled scene pass stay identical per tier.
export const AO_RESOLUTION_SCALE=.5;
export const AO_RADIUS=.6;
export const AO_THICKNESS=.6;
export const AO_SAMPLES=12;
export const AO_INTENSITY=.7;
// Contact shade fades out with distance, where the half-resolution buffer is noisy.
export const AO_FADE_START=30,AO_FADE_END=60;
// Bright pixels are dominated by direct sun or emission (lanterns, candles):
// fade AO out over this pre-exposure luminance range so they never turn grey.
export const AO_LIGHT_PROTECT_START=.55,AO_LIGHT_PROTECT_END=1.35;
// Depth-aware 3x3 upsample/blur radius in AO texels; 0 samples the raw buffer.
export const AO_BLUR_TEXELS=1;
// Depth tolerance of the upsampling blur, as a fraction of view distance.
export const AO_BLUR_DEPTH_TOLERANCE=.05;
const presets={balanced:{maxPixels:2000000,maxRatio:1.25,shadowSize:2048},high:{maxPixels:4000000,maxRatio:2,shadowSize:2048}};
export function qualityPixelRatio(mode,dpr,width,height){
  const quality=mode==='ultra'?'high':mode;
  const preset=presets[quality]??presets.balanced;
  const ratio=quality==='high'?Math.max(dpr,1.5):dpr;
  // Bound every preset by physical pixels, including ultrawide and high-DPI screens.
  return Math.min(ratio,preset.maxRatio,Math.sqrt(preset.maxPixels/Math.max(1,width*height)));
}

// One scene pass feeds bloom and the output transform. There is no duplicate scene render.
export function createRenderQuality({renderer,scene,camera,sun,cityHorizon,shaftScene}){
  let mode='balanced',look='natural',disposed=false,transitioning=false;
  let pending=0,compiling=0,queue=Promise.resolve(),resolution;
  const pipelineGuard=installPendingPipelineGuard(renderer.backend);
  const originalTextures=new Map();
  // Set before the pipeline exists so its first output transform is final.
  const previousToneMapping=renderer.toneMapping;renderer.toneMapping=OUTPUT_TONE_MAPPING;
  const post=new THREE.RenderPipeline(renderer);
  const scenePass=pass(scene,camera),foreground=scenePass.getTextureNode('output'),depth=scenePass.getTextureNode('depth');
  const baseColor=cityHorizon?cityHorizon.compose(foreground,depth):foreground;
  const shaftPass=shaftScene?createShaftVolumePass({renderer,scene:shaftScene,camera,scenePass}):null;
  // One graph serves both tiers. Balanced keeps AO strength at 0: the GTAO
  // render is skipped and the composite is behind a uniform branch.
  const occlusion=createAmbientOcclusion({renderer,camera,depth,color:baseColor});
  // AO darkens opaque scene light before the additive shaft volume. Bloom reads
  // the unoccluded colour, so its half-resolution pass never evaluates AO.
  const occluded=occlusion?baseColor.rgb.mul(occlusion.factor):baseColor.rgb;
  const shafted=rgb=>shaftPass?rgb.add(shaftPass.node):rgb;
  const color=occlusion||shaftPass?vec4(shafted(occluded),baseColor.a):baseColor;
  const glow=bloom(occlusion?vec4(shafted(baseColor.rgb),baseColor.a):color,.12,.35,1.2);
  const saturation=uniform(1),tint=uniform(new THREE.Vector3(1,1,1));
  const luminance=color.rgb.dot(vec3(.2126,.7152,.0722));
  const graded=mix(vec3(luminance),color.rgb,saturation).mul(tint).max(0);
  post.outputNode=vec4(graded,color.a).add(glow);
  const looks=LOOK_BLOOM;
  function report(status=transitioning?'resizing':'ready'){
    document.body.dataset.renderQuality=JSON.stringify({mode,look,status,pixelRatio:renderer.getPixelRatio(),shadowSize:sun.shadow.mapSize.x,ao:!!occlusion?.active,bloom:glow.strength.value,detailScale:mode==='high'?1.25:1,maxPixels:presets[mode].maxPixels});
  }
  function setLook(next){
    look=normalizeVisualLook(next);
    const values=looks[look];
    saturation.value=LOOK_GRADE[look].saturation;tint.value.fromArray(LOOK_GRADE[look].tint);
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
      await settleRenderer(renderer);
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
    occlusion?.setActive(mode==='high');
    applySize(innerWidth,innerHeight);setLook(look);
  }
  function setMode(next){return enqueue(()=>applyMode(next));}
  function compileAsync(scope,view,targetScene){
    if(disposed)return Promise.reject(new Error('Render quality is disposed'));
    if(renderer.hasInitialized?.()===false)return Promise.reject(new Error('Initialize the renderer before compiling scene visuals'));
    compiling++;
    try{
      // PassNode configures type and MSAA lazily during graph setup. Mirror its
      // actual setup before a pre-arrival compile, even before the first render.
      const work=compileScenePass(renderer,scenePass,scope,view,targetScene);
      return Promise.resolve(work).finally(()=>{compiling--;});
    }catch(error){compiling--;throw error;}
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
  return {setMode,setLook,resize,render,compileAsync,get shaftDepth(){return shaftPass?.depth;},prepareShafts:()=>shaftPass?.prepare(),get shaftVolumeStats(){return shaftPass?.stats;},refreshTextures:textures,get compiling(){return compiling>0;},get pipelineStats(){return pipelineGuard.stats;},get detailScale(){return mode==='high'?1.25:1;},get mode(){return mode;},get look(){return look;},get ambientOcclusion(){return occlusion?.stats??{supported:false,active:false,renders:0};},dispose(){if(disposed)return;disposed=true;pipelineGuard.dispose();cityHorizon?.dispose();shaftPass?.dispose();occlusion?.dispose();glow.dispose();scenePass.dispose();post.dispose();originalTextures.clear();if(renderer.toneMapping===OUTPUT_TONE_MAPPING)renderer.toneMapping=previousToneMapping;}};
}

// GTAO from scene depth alone. Sky and other background depth are discarded by
// GTAO; depthWrite:false transparents (water, halos, petals, sky dome) and
// alpha-tested leaf texels never form depth rectangles; the additive shaft
// volume is composited afterwards. WebGL2 fallback: disabled (returns null).
export function createAmbientOcclusion({renderer,camera,depth,color}){
  if(!renderer.backend?.isWebGPUBackend)return null;
  const node=ao(depth,null,camera);
  node.resolutionScale=AO_RESOLUTION_SCALE;node.radius.value=AO_RADIUS;node.thickness.value=AO_THICKNESS;node.samples.value=AO_SAMPLES;
  const strength=uniform(0),stats={supported:true,active:false,renders:0};
  // The node stays registered in the one graph; Balanced skips its render.
  const render=node.updateBefore.bind(node);
  node.updateBefore=frame=>{if(!stats.active)return;stats.renders++;return render(frame);};
  const aoTexture=node.getTextureNode(),near=reference('near','float',camera),far=reference('far','float',camera);
  const distanceAt=position=>perspectiveDepthToViewZ(depth.sample(position).r,near,far).negate();
  const factor=Fn(()=>{
    const result=float(1).toVar();
    If(strength.greaterThan(0),()=>{
      const center=uv(),centerDistance=distanceAt(center).toVar();
      const texel=vec2(1).div(vec2(textureSize(aoTexture,0)));
      const tolerance=centerDistance.mul(AO_BLUR_DEPTH_TOLERANCE).add(.05);
      const sum=float(0).toVar(),weight=float(0).toVar();
      for(let x=-AO_BLUR_TEXELS;x<=AO_BLUR_TEXELS;x++)for(let y=-AO_BLUR_TEXELS;y<=AO_BLUR_TEXELS;y++){
        const position=x||y?center.add(vec2(x,y).mul(texel)):center;
        const w=x||y?float(1).sub(smoothstep(0,tolerance,abs(distanceAt(position).sub(centerDistance)))):float(1);
        sum.addAssign(aoTexture.sample(position).r.mul(w));weight.addAssign(w);
      }
      const shade=sum.div(max(weight,1e-4));
      const fade=max(smoothstep(AO_FADE_START,AO_FADE_END,centerDistance),smoothstep(AO_LIGHT_PROTECT_START,AO_LIGHT_PROTECT_END,color.rgb.dot(vec3(.2126,.7152,.0722))));
      result.assign(mix(float(1),shade,strength.mul(fade.oneMinus())));
    });
    return result;
  })();
  return {node,factor,stats,get active(){return stats.active;},setActive(value){
    stats.active=!!value;strength.value=stats.active?AO_INTENSITY:0;
    // Release the half-resolution buffer outside High; GTAO resizes it per frame.
    if(!stats.active)node.setSize(1,1);
  },dispose(){node.dispose();}};
}
