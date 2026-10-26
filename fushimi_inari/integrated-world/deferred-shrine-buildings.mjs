export const shrineBuildingIds=Object.freeze(['romon','gehaiden','naihaiden','honden']);

// Yield a task, not a microtask: input and rendering can run between CPU stages.
export const yieldShrineWork=()=>new Promise(resolve=>setTimeout(resolve,0));

// Streaming owns only visuals. Permanent floor/collision data is built by integration.
export function createDeferredShrineBuildings({anchor,load,prefetch,range=210,prefetchRange=280,report=()=>{},yieldWork=yieldShrineWork}){
 const states=new Map(shrineBuildingIds.map(id=>[id,{status:'deferred',promise:null,prefetchPromise:null,error:null,timings:{}}]));
 let tail=Promise.resolve();
 const stats=()=>({range,prefetchRange,buildings:Object.fromEntries([...states].map(([id,s])=>[id,{status:s.status,error:s.error,timings:{...s.timings}}]))});
 const enqueue=work=>{const promise=tail.then(async()=>{await yieldWork();return work();});tail=promise.catch(()=>{});return promise;};
 function stage(id){
  const state=states.get(id);if(state.prefetchPromise)return state.prefetchPromise;
  state.status='prefetch-queued';state.error=null;
  state.prefetchPromise=enqueue(async()=>{
   state.status='prefetching';report(stats());
   const value=await prefetch(id,(name,ms)=>{state.timings[name]=ms;report(stats());});
   state.status='prepared';report(stats());return value;
  }).catch(error=>{state.status='failed';state.error=String(error);state.prefetchPromise=null;report(stats());throw error;});
  report(stats());return state.prefetchPromise;
 }
 function ensure(id){
  if(id===undefined)return Promise.all(shrineBuildingIds.map(ensure));
  const state=states.get(id);if(!state)return Promise.reject(new Error(`Unknown shrine building: ${id}`));
  if(state.promise)return state.promise;
  state.error=null;
  // Resolve staged work before enqueueing activation to avoid a queue dependency cycle.
  const prepared=prefetch?stage(id):Promise.resolve(undefined);
  state.promise=prepared.then(value=>enqueue(async()=>{
   state.status='loading';report(stats());return load(id,value,(name,ms)=>{state.timings[name]=ms;report(stats());});
  })).then(value=>{state.status='ready';report(stats());return value;},error=>{
   state.status='failed';state.error=String(error);state.promise=null;report(stats());throw error;
  });
  report(stats());return state.promise;
 }
 function update(position){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return;
  const distance=Math.hypot(position.x-anchor[0],position.z-anchor[2]);
  if(prefetch&&distance<=prefetchRange)for(const [id,state]of states)if(state.status==='deferred')void stage(id).catch(()=>{});
  if(distance>range)return;
  // A failed transfer waits for an explicit retry instead of retrying each frame.
  for(const [id,state]of states)if(state.status!=='failed'&&!state.promise)void ensure(id).catch(()=>{});
 }
 report(stats());return {ensure,update,stats,prefetch:(id)=>{
  if(!prefetch)return Promise.resolve();
  if(id===undefined)return Promise.all(shrineBuildingIds.map(stage));
  if(!states.has(id))return Promise.reject(new Error(`Unknown shrine building: ${id}`));
  return stage(id);
 }};
}
