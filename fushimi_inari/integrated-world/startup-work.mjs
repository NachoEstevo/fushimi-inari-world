// Startup only: bound CPU batches without changing construction order.
let regularTaskAt=-Infinity,yieldAudit=null;
export function startStartupYieldAudit(){yieldAudit={count:0,waitMs:0,worstWaitMs:0};return yieldAudit;}
function observed(work){if(!yieldAudit)return work;const begin=performance.now();return work.then(()=>{const wait=performance.now()-begin;yieldAudit.count++;yieldAudit.waitMs+=wait;yieldAudit.worstWaitMs=Math.max(yieldAudit.worstWaitMs,wait);});}
export function yieldStartupTask(){
 // Loading owns no gameplay frames yet. Batch short continuations together;
 // repeatedly leaving hot construction loops can greatly inflate startup CPU.
 if(performance.now()-regularTaskAt<100)return Promise.resolve();
 const scheduler=globalThis.scheduler;
 if(scheduler?.postTask)return observed(scheduler.postTask(()=>{regularTaskAt=performance.now();},{priority:'user-visible'}));
 return observed(new Promise(resolve=>setTimeout(()=>{regularTaskAt=performance.now();resolve();},0)));
}
export function createStartupCheckpoint({yieldWork=yieldStartupTask,clock=()=>performance.now(),budgetMs=32,onStep}={}){
 let deadline=clock()+budgetMs;
 return label=>{
  if(label)onStep?.(label,clock());
  if(clock()<deadline)return;
  return Promise.resolve(yieldWork()).then(()=>{deadline=clock()+budgetMs;});
 };
}
