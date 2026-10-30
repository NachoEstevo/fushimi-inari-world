import test from 'node:test';
import assert from 'node:assert/strict';
import {REVISION} from 'three';
import {installRendererTextureBindings} from './renderer-texture-bindings.mjs';

function fixture(){
  const calls=[],result={};
  const manager={_init(group,extra){calls.push({context:this,group,extra});return result;}};
  return {renderer:{_bindings:manager},manager,calls,result};
}

test('r180 preserves valid bindings and init context, arguments and return',()=>{
  const {renderer,manager,calls,result}=fixture(),texture={isTexture:true};
  let updates=0;
  const missing={isSampledTexture:true,texture:undefined,textureNode:{value:texture},update(){updates++;this.texture=this.textureNode.value;}};
  const valid={isSampledTexture:true,texture,textureNode:{value:{isTexture:true}},update(){throw Error('valid binding changed');}};
  const absent={isSampledTexture:true,texture:null,textureNode:{value:null},update(){throw Error('missing source changed');}};
  const sampler={isSampler:true,texture,textureNode:{value:texture},update(){throw Error('valid sampler changed');}};
  const handle=installRendererTextureBindings(renderer,{revision:'180'}),group={bindings:[missing,valid,absent,sampler]};
  assert.equal(manager._init(group,'extra'),result);
  assert.deepEqual(calls,[{context:manager,group,extra:'extra'}]);
  assert.equal(updates,1);assert.equal(handle.stats.repaired,1);assert.equal(handle.stats.groups,1);
  assert.equal(valid.texture,texture);assert.equal(absent.texture,null);
  manager._init(group);assert.equal(updates,1);assert.equal(handle.stats.repaired,1);
  handle.dispose();
});

test('genuinely missing source errors propagate without substitution',()=>{
  const failure=new Error('source unavailable');
  const manager={_init(){throw failure;}},renderer={_bindings:manager};
  const handle=installRendererTextureBindings(renderer,{revision:'180'});
  assert.throws(()=>manager._init({bindings:[{isSampledTexture:true,texture:undefined,textureNode:{value:undefined}}]}),error=>error===failure);
  assert.equal(handle.stats.repaired,0);handle.dispose();
});

test('unsupported revisions and uninitialized renderers stay untouched',()=>{
  const {renderer,manager}=fixture(),original=manager._init;
  assert.equal(installRendererTextureBindings(renderer,{revision:'181'}).stats.enabled,false);
  assert.equal(manager._init,original);
  assert.equal(installRendererTextureBindings({}, {revision:'180'}).stats.enabled,false);
});

test('installation is idempotent and disposal restores original ownership without overwriting later wrappers',()=>{
  const {renderer,manager}=fixture(),original=manager._init;
  const handle=installRendererTextureBindings(renderer,{revision:'180'});
  assert.equal(installRendererTextureBindings(renderer,{revision:'180'}),handle);
  handle.dispose();handle.dispose();assert.equal(manager._init,original);assert.equal(handle.stats.enabled,false);
  const inherited=Object.create({_init:original}),next=installRendererTextureBindings({_bindings:inherited},{revision:'180'});
  assert.equal(Object.hasOwn(inherited,'_init'),true);next.dispose();assert.equal(Object.hasOwn(inherited,'_init'),false);
  const third=installRendererTextureBindings(renderer,{revision:'180'}),later=()=>{};
  manager._init=later;third.dispose();assert.equal(manager._init,later);
});

test('actual r180 cached sampled and sampler clones initialize after synchronization',{skip:REVISION!=='180'},async()=>{
  const [{NodeSampledTexture},{default:NodeSampler},{default:Bindings},{Texture}]=await Promise.all([
    import('three/src/renderers/common/nodes/NodeSampledTexture.js'),
    import('three/src/renderers/common/nodes/NodeSampler.js'),
    import('three/src/renderers/common/Bindings.js'),import('three')]);
  const node={value:undefined},cached=new NodeSampledTexture('map',node,{}),cachedSampler=new NodeSampler('map_sampler',node,{});
  node.value=new Texture();const cloned=cached.clone(),sampler=cachedSampler.clone(),group={bindings:[cloned,sampler]};
  let updates=0;
  const backend={createBindings(group){for(const binding of group.bindings)assert.ok(binding.texture?.isTexture,'missing sampler or sampled GPU binding');}};
  const manager=new Bindings(backend,null,{updateTexture(texture){assert.ok(texture?.isTexture,'missing GPU binding texture');updates++;}},null,{},null);
  assert.equal(cloned.texture,undefined);assert.equal(cloned.textureNode.value,node.value);
  assert.equal(sampler.texture,undefined);
  assert.throws(()=>manager._init(group),/missing GPU binding texture/);
  const handle=installRendererTextureBindings({_bindings:manager});
  manager.getForRender({getBindings:()=>[group]});assert.equal(updates,1);assert.equal(handle.stats.repaired,2);
  assert.equal(cloned.texture,node.value);assert.equal(sampler.texture,node.value);handle.dispose();node.value.dispose();
});


test('r186 native cloned bindings initialize, replace textures and release shared groups',{skip:REVISION!=='186'},async()=>{
  const [{NodeSampledTexture},{default:NodeSampler},{default:Bindings},{Texture}]=await Promise.all([
    import('three/src/renderers/common/nodes/NodeSampledTexture.js'),import('three/src/renderers/common/nodes/NodeSampler.js'),
    import('three/src/renderers/common/Bindings.js'),import('three')]);
  const first=new Texture(),second=new Texture(),node={value:first},sampled=new NodeSampledTexture('map',node,{}).clone(),sampler=new NodeSampler('map_sampler',node,{}).clone();
  const group={bindings:[sampled,sampler]},groups=[group],a={getBindings:()=>groups},b={getBindings:()=>groups};
  const textureData=new WeakMap(),backendData=new WeakMap(),uploads=[],samplers=[],rebindings=[];
  let creates=0,deletes=0,destroyedSamplers=0;
  const textures={get(texture){assert.ok(texture?.isTexture);if(!textureData.has(texture))textureData.set(texture,{generation:texture.id,bindGroups:new Set()});return textureData.get(texture);},
    updateTexture(texture){uploads.push(texture);this.get(texture);},updateSampler(binding){assert.ok(binding.texture?.isTexture);samplers.push(binding.texture);return String(binding.texture.id);}};
  const backend={get(value){if(!backendData.has(value))backendData.set(value,{});return backendData.get(value);},
    createBindings(value){assert.equal(value,group);assert.equal(sampled.texture,first);assert.equal(sampler.texture,first);creates++;},
    updateBindings(value){assert.equal(value,group);rebindings.push([sampled.texture,sampler.texture]);},
    destroySampler(binding){assert.equal(binding,sampler);destroyedSamplers++;},deleteBindGroupData(value){assert.equal(value,group);deletes++;}};
  const manager=new Bindings(backend,{updateGroup:()=>true},textures,null,{},null),render={_bindings:manager};
  const originalCreate=manager._createBindings,originalUpdate=manager._update,handle=installRendererTextureBindings(render);
  try{
    assert.equal(handle.stats.enabled,false);assert.equal(manager._createBindings,originalCreate);assert.equal(manager._update,originalUpdate);
    assert.equal(manager.getForRender(a),groups);assert.equal(manager.getForRender(b),groups);assert.equal(creates,1);
    assert.deepEqual(uploads,[first]);assert.deepEqual(samplers,[first]);
    manager.updateForRender(a);assert.deepEqual(rebindings,[[first,first]]);assert.ok(textures.get(first).bindGroups.has(group));
    manager.updateForRender(a);assert.equal(rebindings.length,1,'stable frames retain the native bind group');
    node.value=second;manager.updateForRender(a);
    assert.equal(sampled.texture,second);assert.equal(sampler.texture,second);assert.deepEqual(rebindings.at(-1),[second,second]);
    assert.ok(textures.get(second).bindGroups.has(group));assert.equal(rebindings.length,2);
    manager.updateForRender(b);assert.equal(rebindings.length,2,'another owner retains the updated bind group');
    manager.updateForRender(b);assert.equal(rebindings.length,2);
    manager.deleteForRender(a);assert.equal(deletes,0);assert.equal(sampled.texture,second);
    manager.deleteForRender(b);assert.equal(deletes,1);assert.equal(destroyedSamplers,1);
    assert.equal(sampled.texture,null);assert.equal(sampler.texture,null);assert.equal(textures.get(second).bindGroups.has(group),false);
  }finally{handle.dispose();first.dispose();second.dispose();}
});
