const number=value=>Number.isFinite(value)?value:0;
const string=(value,limit)=>typeof value==='string'?value.slice(0,limit):'';
function scriptSnapshot(script){
  return {startTime:number(script.startTime),duration:number(script.duration),executionStart:number(script.executionStart),
    sourceURL:string(script.sourceURL,4096).split(/[?#]/,1)[0].slice(0,260),
    sourceFunctionName:string(script.sourceFunctionName,160),invoker:string(script.invoker,160)};
}
function entrySnapshot(entry){
  return {startTime:number(entry.startTime),duration:number(entry.duration),entryType:string(entry.entryType,160),
    blockingDuration:number(entry.blockingDuration),renderStart:number(entry.renderStart),styleAndLayoutStart:number(entry.styleAndLayoutStart),
    scripts:Array.from(entry.scripts??[],scriptSnapshot).sort((a,b)=>b.duration-a.duration).slice(0,8)};
}

export function installFrameStallAudit({Observer=globalThis.PerformanceObserver,now=()=>performance.now(),limit=60}={}){
  const supported=[],observers=[],recent=[];
  const cap=Number.isFinite(limit)?Math.max(0,Math.floor(limit)):60;
  let disposed=false,cutoff=-Infinity;
  const callback=list=>{
    if(disposed)return;
    for(const entry of list.getEntries())if(entry.startTime>=cutoff)recent.push(entrySnapshot(entry));
    recent.sort((a,b)=>a.startTime-b.startTime);
    if(recent.length>cap)recent.splice(0,recent.length-cap);
  };
  for(const type of ['longtask','long-animation-frame']){
    if(!Observer?.supportedEntryTypes?.includes(type))continue;
    let observer;
    try{observer=new Observer(callback);observer.observe({type,buffered:false});observers.push(observer);supported.push(type);}
    catch{observer?.disconnect?.();}
  }
  return {
    get stats(){return {supported:[...supported],recent:recent.map(entry=>({...entry,scripts:entry.scripts.map(script=>({...script}))}))};},
    reset(){recent.length=0;cutoff=now();},
    dispose(){if(disposed)return;disposed=true;for(const observer of observers)observer.disconnect();}
  };
}
