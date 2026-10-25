import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';

const presets={balanced:{maxPixels:2000000,maxRatio:1.25,shadowSize:1024},high:{maxPixels:3000000,maxRatio:1.7,shadowSize:2048},ultra:{maxPixels:4000000,maxRatio:2,shadowSize:4096}};
export function qualityPixelRatio(mode,dpr,width,height){
  const preset=presets[mode]??presets.balanced;
  const ratio=mode==='ultra'?Math.max(dpr,1.5):dpr;
  // Bound every preset by physical pixels, including ultrawide and high-DPI screens.
  return Math.min(ratio,preset.maxRatio,Math.sqrt(preset.maxPixels/Math.max(1,width*height)));
}

// One scene pass feeds bloom and the output transform. There is no duplicate scene render.
export function createRenderQuality({renderer,scene,camera,sun}){
  let mode='balanced',look='natural',disposed=false;
  const originalTextures=new Map();
  const post=new THREE.PostProcessing(renderer);
  const scenePass=pass(scene,camera),color=scenePass.getTextureNode('output');
  const glow=bloom(color,.12,.35,1.2);
  post.outputNode=color.add(glow);
  const looks={natural:{strength:.12,radius:.35,threshold:1.2},sakura:{strength:.30,radius:.5,threshold:1.05},dreamcore:{strength:.65,radius:.7,threshold:.85}};
  function report(status='ready'){
    document.body.dataset.renderQuality=JSON.stringify({mode,look,status,pixelRatio:renderer.getPixelRatio(),shadowSize:sun.shadow.mapSize.x,ao:false,bloom:glow.strength.value,detailScale:mode==='ultra'?1.25:1,maxPixels:presets[mode].maxPixels});
  }
  function setLook(next){
    look=Object.hasOwn(looks,next)?next:'natural';
    const values=looks[look];
    glow.strength.value=values.strength*(mode==='balanced'?.65:1);
    glow.radius.value=values.radius;glow.threshold.value=values.threshold;report();
  }
  function resize(width=innerWidth,height=innerHeight){
    renderer.setPixelRatio(qualityPixelRatio(mode,devicePixelRatio,width,height));renderer.setSize(width,height);report();
  }
  function textures(root=scene){
    const maxAnisotropy=Math.min(16,renderer.getMaxAnisotropy());
    root.traverse(o=>{for(const material of [o.material].flat().filter(Boolean))for(const texture of Object.values(material)){
      if(!texture?.isTexture||!texture.image||texture.isRenderTargetTexture)continue;
      if(!originalTextures.has(texture))originalTextures.set(texture,texture.anisotropy);
      const next=mode==='ultra'?maxAnisotropy:originalTextures.get(texture);
      if(texture.anisotropy!==next){texture.anisotropy=next;texture.needsUpdate=true;}
    }});
  }
  async function setMode(next){
    if(disposed)return;
    mode=['balanced','high','ultra'].includes(next)?next:'balanced';textures();
    const shadowSize=presets[mode].shadowSize;
    // ShadowNode owns its cached render target and resizes it on the next shadow
    // render. Preserve its target/texture identities so compiled bindings stay valid.
    if(sun.shadow.mapSize.x!==shadowSize){sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.needsUpdate=true;}
    setLook(look);resize();
  }
  function render(){if(!disposed)post.render();}
  // The menu emits changes only; establish balanced bloom and telemetry now.
  setMode('balanced');
  return {setMode,setLook,resize,render,refreshTextures:textures,get detailScale(){return mode==='ultra'?1.25:1;},get mode(){return mode;},get look(){return look;},dispose(){if(disposed)return;disposed=true;glow.dispose();scenePass.dispose();post.dispose();originalTextures.clear();}};
}
