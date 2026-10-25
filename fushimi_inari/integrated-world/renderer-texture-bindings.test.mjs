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
