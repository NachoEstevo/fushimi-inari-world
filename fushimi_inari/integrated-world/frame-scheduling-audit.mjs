// Opt-in scheduling evidence only: no renderer hooks, GPU waits or DOM writes.
// Attach recent heartbeat times to slow RAFs so a rendering gap can be compared
// with tasks that the main thread did (or did not) execute during that interval.
export function installFrameSchedulingAudit({now=()=>performance.now(),setTimer=(callback,delay)=>setTimeout(callback,delay),clearTimer=id=>clearTimeout(id),
 heartbeatMs=50,thresholdMs=50,limit=120}={}){
 const interval=Number.isFinite(heartbeatMs)&&heartbeatMs>0?heartbeatMs:50,threshold=Number.isFinite(thresholdMs)&&thresholdMs>=0?thresholdMs:50;
 const size=Math.max(1,Math.min(1000,Math.floor(limit)||120)),recent=[],heartbeatHistory=[];
 let timer=null,disposed=false,generation=0,lastFrame=null,heartbeats,frames;
 const append=event=>{recent.push(event);if(recent.length>size)recent.shift();};
 function schedule(){
  const epoch=generation,expectedTimeMs=now()+interval;
  timer=setTimer(()=>{
   if(disposed||epoch!==generation)return;timer=null;
   const timeMs=now(),driftMs=Math.max(0,timeMs-expectedTimeMs),beat={timeMs,expectedTimeMs,driftMs};
   heartbeats.count++;heartbeats.maxDriftMs=Math.max(heartbeats.maxDriftMs,driftMs);heartbeats.lastTimeMs=timeMs;
   heartbeatHistory.push(beat);if(heartbeatHistory.length>8)heartbeatHistory.shift();
   if(driftMs>=threshold)append({kind:'heartbeat',...beat});
   schedule();
  },interval);
 }
 function reset(){
  if(disposed)return;generation++;if(timer!==null)clearTimer(timer);timer=null;
  recent.length=0;heartbeatHistory.length=0;lastFrame=null;
  heartbeats={count:0,maxDriftMs:0,lastTimeMs:null};frames={count:0,maxEntryLagMs:0,maxGapMs:0,lastEntryMs:null};schedule();
 }
 function noteFrame(timestamp){
  if(disposed||!Number.isFinite(timestamp))return;
  const timeMs=now(),entryLagMs=Math.max(0,timeMs-timestamp),gapMs=lastFrame===null?0:Math.max(0,timestamp-lastFrame);
  lastFrame=timestamp;frames.count++;frames.lastEntryMs=timeMs;frames.maxEntryLagMs=Math.max(frames.maxEntryLagMs,entryLagMs);frames.maxGapMs=Math.max(frames.maxGapMs,gapMs);
  if(entryLagMs>=threshold||gapMs>=threshold)append({kind:'frame',timeMs,timestamp,entryLagMs,gapMs,heartbeats:heartbeatHistory.map(beat=>({...beat}))});
 }
 reset();
 return {noteFrame,reset,get stats(){return {heartbeatMs:interval,thresholdMs:threshold,heartbeats:{...heartbeats},frames:{...frames},heartbeatHistory:heartbeatHistory.map(beat=>({...beat})),
  recent:recent.map(event=>({...event,...(event.heartbeats?{heartbeats:event.heartbeats.map(beat=>({...beat}))}:{})}))};},
  dispose(){if(disposed)return;disposed=true;generation++;if(timer!==null)clearTimer(timer);timer=null;}
 };
}
