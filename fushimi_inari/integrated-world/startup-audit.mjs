// Explicit loadAudit=1 diagnostics; no observer or timer in ordinary visits.
export function installStartupAudit(body,{clock=()=>performance.now(),Observer=globalThis.PerformanceObserver,
 watch=globalThis.MutationObserver,schedule=setInterval,cancel=clearInterval}={}){
 const started=clock(),tasks=[],focusAtStart=body.ownerDocument?.hasFocus?.()??null;let count=0,totalBlockingMs=0,worstMs=0,heartbeatLagMs=0,expected=started+100,finished=false;
 const collect=entries=>{for(const entry of entries){
  if(entry.duration<50)continue;count++;worstMs=Math.max(worstMs,entry.duration);totalBlockingMs+=Math.max(0,entry.duration-50);
  tasks.push({startMs:entry.startTime,durationMs:entry.duration});tasks.sort((a,b)=>b.durationMs-a.durationMs);if(tasks.length>64)tasks.length=64;
 }};
 let observer=null;
 if(Observer?.supportedEntryTypes?.includes('longtask')){
  observer=new Observer(list=>collect(list.getEntries()));observer.observe({type:'longtask',buffered:true});
 }
 const timer=schedule(()=>{const now=clock();heartbeatLagMs=Math.max(heartbeatLagMs,now-expected);expected=now+100;},100);
 function finish(){
  if(finished)return;finished=true;collect(observer?.takeRecords?.()??[]);observer?.disconnect();mutation?.disconnect();cancel(timer);
  const now=clock();heartbeatLagMs=Math.max(heartbeatLagMs,now-expected);
  let steps=[];try{steps=JSON.parse(body.dataset.startupSteps??'[]');}catch{}
  let stages=[];try{stages=JSON.parse(body.dataset.loadingStages??'[]');}catch{}
  const phase=ms=>{for(let i=stages.length-1;i>=0;i--)if(stages[i].ms<=ms)return stages[i].message;return 'Module loading and setup';};
  body.dataset.startupAudit=JSON.stringify({elapsedMs:now-started,readyMs:Number(body.dataset.loadReadyMs)||null,
   focusAtStart,focusAtEnd:body.ownerDocument?.hasFocus?.()??null,longTasks:count,totalBlockingMs,worstMs,heartbeatLagMs:Math.max(0,heartbeatLagMs),
   worstTasks:tasks.map(task=>({...task,phase:phase(task.startMs),step:(steps.find(entry=>entry.ms>=task.startMs&&entry.ms<=task.startMs+1)??steps.findLast(entry=>entry.ms<=task.startMs))?.message})),stages,steps,
   note:'CPU main-thread tasks and event-loop delay; not GPU execution time'});
 }
 const mutation=watch?new watch(()=>{if(body.dataset.loadReadyMs)finish();}):null;
 mutation?.observe(body,{attributes:true,attributeFilter:['data-load-ready-ms']});
 return {finish,dispose(){if(finished)return;finished=true;observer?.disconnect();mutation?.disconnect();cancel(timer);}};
}
