// Serialize preparation: renderer compilation and material uploads must not
// compete with another destination. Only the latest request may move the player.
export function createSectorPreparation({prepare,prepareSources,commit,run=action=>action(),onBusy=()=>{},report=()=>{},now=()=>performance.now()}){
 let serial=Promise.resolve(),generation=0,busy=false;
 const history=[];
 function request(destination){
  const token=++generation;busy=true;onBusy(true);
  const work=serial.then(async()=>{
   if(token!==generation)return false;
   const record={id:destination.id,status:'preparing',stages:[],started:now()};
   history.push(record);if(history.length>16)history.shift();
   const emit=()=>report({busy,history:history.map(r=>({...r,stages:[...r.stages]}))});
   const stage=async(name,action)=>{const start=now();record.stage=name;emit();try{return await action();}finally{record.stages.push({name,ms:Math.round((now()-start)*10)/10});emit();}};
   try{
    const isCurrent=()=>token===generation;
    // Deferred sources can finish with their own queued renderer preparation.
    // Await those outside renderer ownership to avoid a nested queue deadlock.
    if(prepareSources)await prepareSources(destination,stage,isCurrent);
    if(!isCurrent()){record.status='superseded';return false;}
    return await run(async()=>{
     if(!isCurrent()){record.status='superseded';return false;}
     await prepare(destination,stage,isCurrent);
     if(!isCurrent()){record.status='superseded';return false;}
     const moved=await commit(destination);record.status=moved===false?'blocked':'ready';return moved!==false;
    });
   }catch(error){record.status='failed';record.error=String(error);throw error;}
   finally{record.ms=Math.round(now()-record.started);delete record.stage;if(token===generation){busy=false;onBusy(false);}emit();}
  });
  serial=work.catch(()=>{});return work;
 }
 return {request,get busy(){return busy;}};
}

// Quality changes and complete checkpoint transactions share one renderer.
// Account for queued work immediately so walking prewarm can yield ownership
// before an action starts and remain blocked through all of its awaited stages.
export function createRenderPreparationQueue({onBusy=()=>{}}={}){
 let serial=Promise.resolve(),pending=0;
 function run(action){
  pending++;if(pending===1)onBusy(true);
  const work=serial.then(action).finally(()=>{pending--;if(pending===0)onBusy(false);});
  serial=work.catch(()=>{});return work;
 }
 return {run,get busy(){return pending>0;},get pending(){return pending;},async awaitIdle(){let observed;do{observed=serial;await observed;}while(observed!==serial);}};
}
