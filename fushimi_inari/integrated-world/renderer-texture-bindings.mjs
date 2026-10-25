import {REVISION} from 'three';

const installations=new WeakMap();

// r180 clones cached texture/sampler bindings before their reference is synced.
// Restrict this workaround to missing bindings with an already valid node value;
// genuinely missing textures must continue to fail in the renderer normally.
export function installRendererTextureBindings(renderer,{revision=REVISION}={}){
  if(installations.has(renderer))return installations.get(renderer);
  const manager=renderer._bindings;
  const stats={revision:String(revision),enabled:false,groups:0,repaired:0};
  if(String(revision)!=='180'||typeof manager?._init!=='function'){
    return {stats,dispose(){}};
  }
  const original=manager._init,owned=Object.hasOwn(manager,'_init');
  let active=true;
  stats.enabled=true;
  function initialize(bindGroup,...args){
    if(active){
      stats.groups++;
      for(const binding of bindGroup.bindings){
        if((binding.isSampledTexture===true||binding.isSampler===true)&&!binding.texture&&binding.textureNode?.value?.isTexture===true&&typeof binding.update==='function'){
          binding.update();
          if(binding.texture===binding.textureNode.value)stats.repaired++;
        }
      }
    }
    return original.call(this,bindGroup,...args);
  }
  manager._init=initialize;
  const handle={stats,dispose(){
    if(!active)return;
    active=false;stats.enabled=false;
    if(manager._init===initialize){if(owned)manager._init=original;else delete manager._init;}
    installations.delete(renderer);
  }};
  installations.set(renderer,handle);
  return handle;
}
