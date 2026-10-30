// Opt-in diagnostic. Observe real node builds without changing cache keys,
// material ownership or shader output. No hook is installed for normal visitors.
export function installRenderBuildAudit(backend,{now=()=>performance.now(),limit=40}={}){
 if(typeof backend?.createNodeBuilder!=='function')throw new TypeError('A node-building backend is required');
 const original=backend.createNodeBuilder,owned=Object.hasOwn(backend,'createNodeBuilder');
 let count=0,totalMs=0,slow=[],generation=0,disposed=false,buildsAfterPrepared=0;
 let asyncStats={count:0,elapsedMs:0,buildsAfterPrepared:0,phases:{},slow:[]};
 const prepared=new WeakMap();
 const registered=new WeakMap();
 const seen=new WeakSet();
 let phase='render',phases={};
 function capture(builder,fallback){
  const epoch=generation,currentPhase=phase,object=builder.object??fallback,material=builder.material??object?.material;
  const prior=object&&prepared.get(object),wasPrepared=!!prior&&prior.materialId===material?.id;
  let owner=object;while(owner&&!registered.has(owner))owner=owner.parent;
  const bounds=owner&&registered.get(owner),camera=builder.camera;
  const detail={phase:currentPhase,objectId:object?.uuid,registered:!!bounds,ownerId:owner?.uuid,boundsDistance:bounds&&camera?bounds.distanceToPoint(camera.position):null,boundsCenter:bounds?.center?.toArray(),boundsRadius:bounds?.radius,prepared:wasPrepared,preparedVersion:prior?.version,materialVersion:material?.version,shadow:material?.isShadowPassMaterial===true,name:object?.name||object?.parent?.name||object?.type||'node',
   material:material?.name||material?.type||'',materialId:material?.id,
   materialColor:material?.color?.getHexString?.(),geometryDetail:object?.geometry?.parameters?.detail,view:camera?{position:camera.position?.toArray?.(),quaternion:camera.quaternion?.toArray?.(),near:camera.near,far:camera.far,fov:camera.fov,aspect:camera.aspect}:null,
   geometry:object?.geometry?.type,instances:object?.isInstancedMesh?object.count:1,
   camera:camera?.type??'',maps:['map','normalMap','roughnessMap','alphaMap'].filter(key=>material?.[key])};
  // Snapshot work is diagnostic overhead, not shader compilation CPU time.
  const start=now();return {start,epoch,detail:{...detail,startTimeMs:start}};
 }
 function begin(builder,fallback){try{return capture(builder,fallback);}catch{return null;}}
 function finish(sample,isAsync=false){
  if(!sample||disposed||sample.epoch!==generation)return;
  try{
   const ms=now()-sample.start,{detail}=sample;
   if(isAsync){
    asyncStats.count++;asyncStats.elapsedMs+=ms;
    const totals=asyncStats.phases[detail.phase]??={count:0,elapsedMs:0};totals.count++;totals.elapsedMs+=ms;
    if(detail.prepared)asyncStats.buildsAfterPrepared++;
    asyncStats.slow.push({...detail,elapsedMs:ms});asyncStats.slow.sort((a,b)=>b.elapsedMs-a.elapsedMs);asyncStats.slow.length=Math.min(asyncStats.slow.length,limit);
   }else{
    count++;totalMs+=ms;
    const totals=phases[detail.phase]??={count:0,ms:0};totals.count++;totals.ms+=ms;
    if(detail.prepared)buildsAfterPrepared++;
    slow.push({...detail,ms});slow.sort((a,b)=>b.ms-a.ms);slow.length=Math.min(slow.length,limit);
   }
  }catch{/* Diagnostics must not replace a native result or shader error. */}
 }
 function create(...args){
  const builder=original.apply(this,args);if(seen.has(builder))return builder;seen.add(builder);
  const build=builder.build,buildAsync=builder.buildAsync;let pendingAsync=0;
  if(typeof build==='function')builder.build=function(...buildArgs){
   // A delegated build belongs to its enclosing async build, including calls
   // after a yield. Different builders keep their independent CPU accounting.
   if(disposed||pendingAsync)return build.apply(this,buildArgs);
   const sample=begin(this,args[0]);
   try{return build.apply(this,buildArgs);}finally{finish(sample);}
  };
  if(typeof buildAsync==='function')builder.buildAsync=function(...buildArgs){
   if(disposed)return buildAsync.apply(this,buildArgs);
   const sample=begin(this,args[0]);pendingAsync++;
   let done=false;
   const complete=()=>{if(done)return;done=true;pendingAsync--;finish(sample,true);};
   let result;
   try{result=buildAsync.apply(this,buildArgs);}catch(error){complete();throw error;}
   // Preserve the native promise. Elapsed async time includes yields and is
   // deliberately excluded from the existing synchronous CPU totals.
   Promise.resolve(result).then(complete,complete);
   return result;
  };
  return builder;
 }
 backend.createNodeBuilder=create;
 const copyPhases=values=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{...value}]));
 return {get stats(){return {count,totalMs,buildsAfterPrepared,phases:copyPhases(phases),slow:[...slow],async:{...asyncStats,phases:copyPhases(asyncStats.phases),slow:[...asyncStats.slow]}};},setPhase(next){phase=next;},noteRegistered(entries){for(const {object,bounds} of entries)registered.set(object,bounds);},noteCompiled(objects){for(const object of objects)prepared.set(object,{materialId:object.material?.id,version:object.material?.version});},reset(){generation++;count=0;totalMs=0;buildsAfterPrepared=0;slow=[];phases={};asyncStats={count:0,elapsedMs:0,buildsAfterPrepared:0,phases:{},slow:[]};},dispose(){
  if(disposed)return;disposed=true;
  if(backend.createNodeBuilder===create){if(owned)backend.createNodeBuilder=original;else delete backend.createNodeBuilder;}
 }};
}
