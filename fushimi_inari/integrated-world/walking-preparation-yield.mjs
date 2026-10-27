// Serial preparation waits for the next render opportunity, then resumes in a
// task after RAF callbacks. The caller checks its cancellation token on resume.
export function createWalkingPreparationYield({requestFrame=callback=>globalThis.requestAnimationFrame(callback),cancelFrame=id=>globalThis.cancelAnimationFrame(id),
 schedule=callback=>setTimeout(callback,0),cancelTask=clearTimeout}={}){
 const pending=new Set();let disposed=false;
 function finish(wait){
  if(!pending.delete(wait))return;
  if(wait.frame!==null)cancelFrame(wait.frame);
  if(wait.task!==null)cancelTask(wait.task);
  wait.resolve();
 }
 function cancel(){for(const wait of pending)finish(wait);}
 return {yield(){
  if(disposed)return Promise.resolve();
  return new Promise(resolve=>{
   const wait={resolve,frame:null,task:null};pending.add(wait);
   wait.frame=requestFrame(()=>{
    if(!pending.has(wait))return;
    wait.frame=null;wait.task=schedule(()=>finish(wait));
   });
  });
 },cancel,dispose(){if(disposed)return;disposed=true;cancel();}};
}
