import * as THREE from 'three';

export function qualityPixelRatio(mode,dpr,width,height){
  if(mode!=='ultra')return Math.min(dpr,mode==='high'?1.7:1.25);
  return Math.min(Math.max(dpr,1.5),2,Math.sqrt(4000000/Math.max(1,width*height)));
}
export function createRenderQuality({renderer,scene,camera,sun}){
  let mode='balanced',composer=null,version=0,disposed=false,lastSize='';
  const originalTextures=new Map(),size=new THREE.Vector2();
  const report=(status='ready')=>{document.body.dataset.renderQuality=JSON.stringify({mode,status,pixelRatio:renderer.getPixelRatio(),shadowSize:sun.shadow.mapSize.x,ao:!!composer,detailScale:mode==='ultra'?1.25:1,maxPixels:mode==='ultra'?4000000:null});};
  function release(){if(composer){for(const pass of composer.passes)pass.dispose?.();composer.dispose();composer=null;}lastSize='';}
  function resize(width=innerWidth,height=innerHeight){renderer.setPixelRatio(qualityPixelRatio(mode,devicePixelRatio,width,height));renderer.setSize(width,height);lastSize='';report();}
  function textures(){
    scene.traverse(o=>{for(const material of [o.material].flat().filter(Boolean))for(const t of Object.values(material)){
      if(!t?.isTexture||!t.image||t.isRenderTargetTexture)continue;
      if(!originalTextures.has(t))originalTextures.set(t,t.anisotropy);
      const next=mode==='ultra'?Math.min(16,renderer.capabilities.getMaxAnisotropy()):originalTextures.get(t);
      if(t.anisotropy!==next){t.anisotropy=next;t.needsUpdate=true;}
    }});
  }
  async function setMode(next){
    mode=['balanced','high','ultra'].includes(next)?next:'balanced';const request=++version;
    release();textures();
    const shadowSize=mode==='ultra'?Math.min(4096,renderer.capabilities.maxTextureSize):2048;
    if(sun.shadow.mapSize.x!==shadowSize){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.needsUpdate=true;}
    resize();if(mode!=='ultra')return;
    report('preparing');
    try{
      const [{EffectComposer},{RenderPass},{SSAOPass},{OutputPass}]=await Promise.all([
        import('three/addons/postprocessing/EffectComposer.js'),import('three/addons/postprocessing/RenderPass.js'),
        import('three/addons/postprocessing/SSAOPass.js'),import('three/addons/postprocessing/OutputPass.js')]);
      if(disposed||request!==version)return;
      // Alpha cards and emissive overlays must not become opaque AO rectangles.
      class SolidAO extends SSAOPass{
        // Three r164's SSAOPass.dispose omits these two owned resources.
        dispose(){super.dispose();this.noiseTexture.dispose();this.ssaoMaterial.dispose();}
        setSize(w,h){super.setSize(Math.max(1,Math.round(w*.6)),Math.max(1,Math.round(h*.6)));}
        render(renderer,...args){
          this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(camera.projectionMatrix);
          this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
          const update=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;
          try{super.render(renderer,...args);}finally{renderer.shadowMap.autoUpdate=update;}
        }
        overrideVisibility(){super.overrideVisibility();this.scene.traverse(o=>{
          if(o.isMesh&&[o.material].flat().some(m=>m&&(m.transparent||m.alphaTest>0||!m.depthWrite||m.isMeshBasicMaterial||m.isShaderMaterial)))o.visible=false;
        });}
      }
      const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType});target.samples=2;
      composer=new EffectComposer(renderer,target);composer.setPixelRatio(1);
      composer.addPass(new RenderPass(scene,camera));
      const ao=new SolidAO(scene,camera,1,1,16);ao.kernelRadius=.55;ao.minDistance=.015/(camera.far-camera.near);ao.maxDistance=1.2/(camera.far-camera.near);
      composer.addPass(ao);composer.addPass(new OutputPass());lastSize='';report();
    }catch(error){release();report('AO unavailable; enhanced shadows and resolution active');console.warn('Ultra AO unavailable',error);}
  }
  function render(){
    // Also used by photo capture: follow its actual temporary drawing-buffer size.
    if(composer){renderer.getDrawingBufferSize(size);const key=`${size.x},${size.y}`;
      if(key!==lastSize){composer.setSize(size.x,size.y);lastSize=key;}
      composer.render();
    }else renderer.render(scene,camera);
  }
  return {setMode,resize,render,get detailScale(){return mode==='ultra'?1.25:1;},get mode(){return mode;},dispose(){disposed=true;version++;release();}};
}
