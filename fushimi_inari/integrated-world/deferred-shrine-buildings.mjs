export const shrineBuildingIds=Object.freeze(['romon','gehaiden','naihaiden','honden']);

// Streaming owns only visuals. Permanent floor/collision data is built by integration.
export function createDeferredShrineBuildings({anchor,load,range=210,report=()=>{}}){
 const states=new Map(shrineBuildingIds.map(id=>[id,{status:'deferred',promise:null,error:null}]));
 let tail=Promise.resolve();
 const stats=()=>({range,buildings:Object.fromEntries([...states].map(([id,s])=>[id,{status:s.status,error:s.error}]))});
 function ensure(id){
  if(id===undefined)return Promise.all(shrineBuildingIds.map(ensure));
  const state=states.get(id);if(!state)return Promise.reject(new Error(`Unknown shrine building: ${id}`));
  if(state.promise)return state.promise;
  state.status='queued';state.error=null;
  state.promise=tail.then(()=>{state.status='loading';report(stats());return load(id);}).then(value=>{state.status='ready';report(stats());return value;},error=>{
   state.status='failed';state.error=String(error);state.promise=null;report(stats());throw error;
  });
  // Keep fetch, parsing, refinement and viewer preparation bounded to one owner.
  // A rejected asset cannot strand later buildings behind a rejected queue tail.
  tail=state.promise.catch(()=>{});
  report(stats());return state.promise;
 }
 function update(position){
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return;
  if(Math.hypot(position.x-anchor[0],position.z-anchor[2])>range)return;
  // A failed transfer waits for an explicit retry instead of retrying each frame.
  for(const [id,state]of states)if(state.status==='deferred')void ensure(id).catch(()=>{});
 }
 report(stats());return {ensure,update,stats};
}
