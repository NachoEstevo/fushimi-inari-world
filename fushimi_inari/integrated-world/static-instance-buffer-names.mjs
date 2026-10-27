import {REVISION,StaticDrawUsage} from 'three';

// r180's default NodeBuffer_<global id> defeats shader sharing across otherwise
// identical static cells. Reserve a local name BEFORE WGSL registers bindings;
// never rewrite shader text or change a node's data, ordering or descriptors.
export function installStaticInstanceBufferNames(backend,{objects,revision=REVISION}={}){
 const enabled=String(revision)==='180'&&backend?.isWebGPUBackend===true&&typeof backend.createNodeBuilder==='function'&&objects instanceof WeakSet;
 const original=backend?.createNodeBuilder,owned=backend&&Object.hasOwn(backend,'createNodeBuilder'),seen=new WeakSet();let disposed=false,builders=0,renamed=0;
 function create(...args){
  const builder=original.apply(this,args);
  if(!disposed&&builder&&typeof builder.getUniformFromNode==='function'&&!seen.has(builder)){
   seen.add(builder);builders++;const getUniform=builder.getUniformFromNode,names=new WeakMap(),reserved=new Map();let ordinal=0;
   const occupied=(name,node,stage)=>{
    if(reserved.has(name)&&reserved.get(name)!==node)return true;
    for(const key of [stage,builder.shaderStage])for(const property of [name,`${name}.value`]){
     const declaration=builder.declarations?.[key]?.[property];if(declaration&&declaration.node!==node)return true;
    }
    return false;
   };
   builder.getUniformFromNode=function(...uniformArgs){
    const [node,type,stage,name]=uniformArgs,object=builder.object,attribute=object?.instanceMatrix;
    if(typeof name==='string'&&name)reserved.set(name,node);
    if(!disposed&&(name==null||name==='')&&objects.has(object)&&object.isInstancedMesh&&attribute?.usage===StaticDrawUsage&&
     type==='buffer'&&node?.isBufferNode&&node.bufferType==='mat4'&&node.value===attribute.array){
     let selected=names.get(node);
     if(!selected||occupied(selected,node,stage)){
      do{selected=`fushimiStaticInstanceMatrices${ordinal++}`;}while(occupied(selected,node,stage));
      names.set(node,selected);reserved.set(selected,node);renamed++;
     }
     uniformArgs[3]=selected;
    }
    return getUniform.apply(this,uniformArgs);
   };
  }
  return builder;
 }
 if(enabled)backend.createNodeBuilder=create;
 return {enabled,get stats(){return {enabled,builders,renamed};},dispose(){if(disposed)return;disposed=true;if(enabled&&backend.createNodeBuilder===create){if(owned)backend.createNodeBuilder=original;else delete backend.createNodeBuilder;}}};
}
