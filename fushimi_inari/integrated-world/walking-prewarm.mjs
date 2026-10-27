import {Sphere,Vector3} from 'three';

const scheduleBackground=task=>globalThis.scheduler?.postTask?.(task,{priority:'background'})??setTimeout(task,0);

// Bounds are supplied by static residency owners. This service never walks the
// live scene, activates geometry, or mutates objects across an asynchronous wait.
// compile(root,{isCurrent}) must check isCurrent between its own small batches.
export function createWalkingPrewarm({entries=[],compile,schedule=scheduleBackground,onError=()=>{},cellSize=128,radius=80,lookAhead=40,minMovement=6,intervalMs=1500,refillIntervalMs=intervalMs,maxPending=8}={}){
 if(typeof compile!=='function')throw new TypeError('Walking prewarm requires compile(root, {isCurrent})');
 if(!Number.isFinite(refillIntervalMs)||refillIntervalMs<0)throw new RangeError('Refill interval must be finite and non-negative');
 const cells=new Map(),large=new Set(),registered=new Map();let warmed=new WeakMap(),failed=new WeakSet();
 let queue=[],active=null,activeWork=null,scheduled=false,blocked=false,disposed=false,generation=0,token=0,lastPosition=null,lastDirection=null,lastTime=-Infinity,lastSpatialTime=-Infinity,hasMore=false;
 const forward=new Vector3();
 const counts={queries:0,checked:0,compiled:0,rendered:0,prepared:0,cancelled:0,failed:0,skippedBounds:0};
 const limit=Math.max(1,Math.floor(maxPending)||8),cell=Math.max(1,cellSize);
 function append(next){
  if(disposed)return;
  for(const {object,bounds}of next){
   if(!object||registered.has(object))continue;
   const sphere=bounds?.center&&Number.isFinite(bounds.radius)?new Sphere(new Vector3().copy(bounds.center),bounds.radius):bounds?.isBox3?bounds.getBoundingSphere(new Sphere()):null;
   if(!sphere||sphere.radius<0||![...sphere.center.toArray(),sphere.radius].every(Number.isFinite)){counts.skippedBounds++;continue;}
   const entry={object,sphere};registered.set(object,entry);
   const minX=Math.floor((sphere.center.x-sphere.radius)/cell),maxX=Math.floor((sphere.center.x+sphere.radius)/cell),minZ=Math.floor((sphere.center.z-sphere.radius)/cell),maxZ=Math.floor((sphere.center.z+sphere.radius)/cell);
   if((maxX-minX+1)*(maxZ-minZ+1)>64)large.add(entry);
   else for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const key=x+','+z;if(!cells.has(key))cells.set(key,new Set());cells.get(key).add(entry);}
  }
  // Appended deferred roots become eligible at the next normal update.
  lastPosition=null;
 }
 function pump(){
  if(disposed||blocked||scheduled||active||!queue.length)return;
  scheduled=true;
  try{
   const pending=schedule(()=>{scheduled=false;return run();});
   pending?.catch?.(error=>{scheduled=false;onError(error);});
  }catch(error){scheduled=false;onError(error);}
 }
 function run(){
  if(disposed||blocked||active||!queue.length)return;
  while(queue.length&&warmed.get(queue[0].object)===generation)queue.shift();
  if(!queue.length)return;
  const entry=queue.shift(),startedGeneration=generation,startedToken=token;
  active=entry;
  const isCurrent=()=>!disposed&&!blocked&&generation===startedGeneration&&token===startedToken;
  const work=(async()=>{
   try{
    const result=await compile(entry.object,{isCurrent,generation:startedGeneration});
    if(!isCurrent()){counts.cancelled++;if(!disposed&&!queue.includes(entry))queue.unshift(entry);}
    else if(result!==false){warmed.set(entry.object,generation);counts.compiled++;}
    else failed.add(entry.object);
   }catch(error){
    if(!isCurrent()){counts.cancelled++;if(!disposed&&!queue.includes(entry))queue.unshift(entry);}
    else {failed.add(entry.object);counts.failed++;onError(error,entry.object);}
   }finally{
    queue.length=Math.min(queue.length,limit);active=null;activeWork=null;pump();
   }
  })();
  // A synchronous compiler throw can finish the worker before assignment.
  activeWork=active?work:null;return work;
 }
 function setBlocked(value){
  const next=Boolean(value);if(next===blocked)return;
  blocked=next;if(blocked)token++;else {lastPosition=null;pump();}
 }
 function update(position,timeMs,{blocked:pause=false,direction}={}){
  if(disposed)return;setBlocked(pause);if(blocked)return;
  if(![position.x,position.y,position.z,timeMs].every(Number.isFinite))return;
  forward.set(direction?.x??0,0,direction?.z??0);
  if(!Number.isFinite(forward.lengthSq())||forward.lengthSq()===0){forward.copy(position);if(lastPosition)forward.sub(lastPosition);else forward.set(0,0,0);forward.y=0;if(!forward.lengthSq()&&lastDirection)forward.copy(lastDirection);}
  forward.normalize();
  const moved=!!lastPosition&&lastPosition.distanceToSquared(position)>=minMovement*minMovement;
  const turned=!!lastDirection&&forward.lengthSq()>0&&lastDirection.dot(forward)<Math.SQRT1_2;
  const refill=hasMore&&!queue.length&&!active&&!scheduled;
  const relocate=!lastPosition||((moved||turned)&&timeMs-lastSpatialTime>=intervalMs);
  if(!relocate&&(!refill||timeMs-lastTime<refillIntervalMs)){pump();return;}
  if(relocate){failed=new WeakSet();lastDirection=forward.lengthSq()?forward.clone():null;lastPosition=new Vector3().copy(position);lastSpatialTime=timeMs;}
  const queryPosition=lastPosition,predicted=new Vector3().copy(queryPosition);
  if(lastDirection)predicted.addScaledVector(lastDirection,lookAhead);
  lastTime=timeMs;counts.queries++;
  const nearby=new Set(large);
  for(const center of [queryPosition,predicted])for(let x=Math.floor((center.x-radius)/cell);x<=Math.floor((center.x+radius)/cell);x++)for(let z=Math.floor((center.z-radius)/cell);z<=Math.floor((center.z+radius)/cell);z++)for(const entry of cells.get(x+','+z)??[])nearby.add(entry);
  const selected=[];
  for(const entry of nearby){
   if(entry===active||warmed.get(entry.object)===generation||failed.has(entry.object))continue;
   counts.checked++;const centerDistance=Math.min(entry.sphere.center.distanceTo(queryPosition),entry.sphere.center.distanceTo(predicted));
   const distance=Math.max(0,centerDistance-entry.sphere.radius);if(distance<=radius)selected.push({entry,distance,centerDistance});
  }
  selected.sort((a,b)=>a.distance-b.distance||a.centerDistance-b.centerDistance);hasMore=selected.length>limit;queue=selected.slice(0,limit).map(item=>item.entry);pump();
 }
 function markWarmed(object,reason){
  if(disposed||!registered.has(object)||warmed.get(object)===generation)return;
  warmed.set(object,generation);counts[reason]++;
 }
 append(entries);
 return {append,update,setBlocked,markRendered(object){markWarmed(object,'rendered');},markPrepared(object){markWarmed(object,'prepared');},setRadius(next){if(!Number.isFinite(next)||next<=0)throw new RangeError('Walking prewarm radius must be finite and positive');if(disposed||next===radius)return;radius=next;lastPosition=null;},invalidate(){if(disposed)return;generation++;token++;lastPosition=null;warmed=new WeakMap();failed=new WeakSet();},async awaitIdle(){while(activeWork)await activeWork;},get stats(){return {...counts,registered:registered.size,cells:cells.size,queued:queue.length,active:!!active,scheduled,blocked,generation};},dispose(){disposed=true;token++;queue=[];cells.clear();large.clear();registered.clear();warmed=new WeakMap();failed=new WeakSet();}};
}
