// Opt-in r180 diagnostic. Observe real node builds without changing cache keys,
// material ownership or shader output. No hook is installed for normal visitors.
export function installRenderBuildAudit(backend,{now=()=>performance.now(),limit=40}={}){
 if(typeof backend?.createNodeBuilder!=='function')throw new TypeError('A node-building backend is required');
 const original=backend.createNodeBuilder,owned=Object.hasOwn(backend,'createNodeBuilder');
 let count=0,totalMs=0,slow=[],generation=0,disposed=false;
 function create(...args){
  const builder=original.apply(this,args),build=builder.build;
  builder.build=function(...buildArgs){
   const start=now(),epoch=generation;
   try{return build.apply(this,buildArgs);}finally{
    if(!disposed&&epoch===generation){
     const ms=now()-start,object=this.object??args[0],material=this.material??object?.material;
     count++;totalMs+=ms;
     slow.push({ms,name:object?.name||object?.parent?.name||object?.type||'node',
      material:material?.name||material?.type||'',materialId:material?.id,
      geometry:object?.geometry?.type,instances:object?.isInstancedMesh?object.count:1,
      camera:this.camera?.type??'',maps:['map','normalMap','roughnessMap','alphaMap'].filter(key=>material?.[key])});
     slow.sort((a,b)=>b.ms-a.ms);slow.length=Math.min(slow.length,limit);
    }
   }
  };
  return builder;
 }
 backend.createNodeBuilder=create;
 return {get stats(){return {count,totalMs,slow:[...slow]};},reset(){generation++;count=0;totalMs=0;slow=[];},dispose(){
  if(disposed)return;disposed=true;
  if(backend.createNodeBuilder===create){if(owned)backend.createNodeBuilder=original;else delete backend.createNodeBuilder;}
 }};
}
