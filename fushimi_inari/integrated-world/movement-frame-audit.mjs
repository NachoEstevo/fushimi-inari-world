import {percentile} from './shadow-route-audit.mjs';

const DEFAULT_DURATION_MS=16000,MAX_SAMPLES=10000,MAX_SLOW_FRAMES=20;

// Opt-in observation only: the caller retains camera, movement and renderer ownership.
export function installMovementFrameAudit({camera,getContext=()=>({}),onStart=()=>{},durationMs=DEFAULT_DURATION_MS}){
 const duration=Number.isFinite(durationMs)?Math.min(120000,Math.max(1000,Math.round(durationMs))):DEFAULT_DURATION_MS;
 const maxSamples=Math.max(MAX_SAMPLES,Math.ceil(duration/1000*240));
 const doc=globalThis.document,section=doc.createElement('section'),button=doc.createElement('button'),output=doc.createElement('output');
 section.id='movement-frame-audit';section.style&&(section.style.cssText='position:fixed;left:12px;bottom:12px;z-index:10000;display:flex;gap:8px;align-items:center;padding:8px;background:#18201fe8;color:white;font:12px system-ui;max-width:90vw');
 button.type='button';button.textContent=`Record movement ${duration/1000}s`;section.append(button);section.append(output);doc.body.append(section);
 let phase='idle',result=null,error=null,disposed=false,startTime=null,lastTime=null,firstPose=null,lastPose=null,contextStart=null;
 let gaps=[],slowFrames=[],slowCpuFrames=[],count=0,updateSum=0,updateMax=0,submitSum=0,submitMax=0,worst=0,distanceWalked=0,angularCumulativeRadians=0;
 function emit(){
  doc.body.dataset.movementFrameAudit=JSON.stringify({phase,result,error});
  output.textContent=error??(result?`Complete · p95 ${result.p95?.toFixed(2)} ms · p99 ${result.p99?.toFixed(2)} ms · worst ${result.worst?.toFixed(2)} ms`:`${phase} · CPU update and render submission`);
 }
 function finish(next,reason=null){phase=next;error=reason?String(reason.message??reason):null;emit();}
 const context=()=>JSON.parse(JSON.stringify(getContext()??null));
 const pose=()=>({position:[camera.position.x,camera.position.y,camera.position.z],rotation:[camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w]});
 function run(){
  if(disposed||phase==='recording')return;
  phase='recording';result=null;error=null;startTime=null;lastTime=null;firstPose=null;lastPose=null;contextStart=null;
  gaps=[];slowFrames=[];slowCpuFrames=[];count=0;updateSum=0;updateMax=0;submitSum=0;submitMax=0;worst=0;distanceWalked=0;angularCumulativeRadians=0;
  if(doc.hidden){finish('error','Movement recording requires a visible document');return;}
  try{onStart();}catch(reason){finish('error',String(reason.message??reason));return;}emit();
 }
 function afterRender(time,submitMs,updateMs=0){
  if(disposed||phase!=='recording')return;
  if(doc.hidden){finish('aborted','Movement recording requires a visible document');return;}
  try{
   if(!Number.isFinite(time)||!Number.isFinite(submitMs)||submitMs<0||!Number.isFinite(updateMs)||updateMs<0||(lastTime!==null&&time<=lastTime))throw new Error('Movement recording received invalid CPU timing');
   const {x,y,z}=camera.position,q=camera.quaternion;
   if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(z)||!Number.isFinite(q.x)||!Number.isFinite(q.y)||!Number.isFinite(q.z)||!Number.isFinite(q.w)||Math.hypot(q.x,q.y,q.z,q.w)===0)throw new Error('Movement recording received invalid camera pose');
   if(startTime===null){startTime=time;lastTime=time;firstPose=pose();lastPose=pose();contextStart=context();return;}
   const p=lastPose.position,r=lastPose.rotation,gap=time-lastTime,elapsedMs=time-startTime;
   distanceWalked+=Math.hypot(x-p[0],y-p[1],z-p[2]);
   const dot=Math.abs(r[0]*q.x+r[1]*q.y+r[2]*q.z+r[3]*q.w)/(Math.hypot(...r)*Math.hypot(q.x,q.y,q.z,q.w));
   angularCumulativeRadians+=2*Math.acos(Math.min(1,dot));
   p[0]=x;p[1]=y;p[2]=z;r[0]=q.x;r[1]=q.y;r[2]=q.z;r[3]=q.w;
   lastTime=time;count++;updateSum+=updateMs;updateMax=Math.max(updateMax,updateMs);submitSum+=submitMs;submitMax=Math.max(submitMax,submitMs);worst=Math.max(worst,gap);
   if(gaps.length<maxSamples)gaps.push(gap);
   if(slowFrames.length<MAX_SLOW_FRAMES||gap>slowFrames.at(-1).gap){slowFrames.push({elapsedMs,gap,submitMs,updateMs});slowFrames.sort((a,b)=>b.gap-a.gap);if(slowFrames.length>MAX_SLOW_FRAMES)slowFrames.length=MAX_SLOW_FRAMES;}
   if(slowCpuFrames.length<MAX_SLOW_FRAMES||submitMs+updateMs>slowCpuFrames.at(-1).submitMs+slowCpuFrames.at(-1).updateMs){slowCpuFrames.push({elapsedMs,gap,submitMs,updateMs});slowCpuFrames.sort((a,b)=>(b.submitMs+b.updateMs)-(a.submitMs+a.updateMs));if(slowCpuFrames.length>MAX_SLOW_FRAMES)slowCpuFrames.length=MAX_SLOW_FRAMES;}
   if(elapsedMs>=duration){
    result={duration:duration/1000,startTimeMs:startTime,elapsedMs,frameCount:count,sampleCount:gaps.length,samplesTruncated:count>gaps.length,
     fps:count*1000/elapsedMs,p50:percentile(gaps,.5),p95:percentile(gaps,.95),p99:percentile(gaps,.99),worst,
     updateSum,updateMean:updateSum/count,updateMax,submitSum,submitMean:submitSum/count,submitMax,
     distanceWalked,angularCumulativeRadians,firstPose,lastPose,slowFrames,slowCpuFrames,contextStart,contextEnd:context(),
     timing:'CPU update and render submission in milliseconds; GPU time not measured'};
    finish('complete');
   }
  }catch(reason){result=null;finish('error',reason);}
 }
 const onClick=()=>{button.blur?.();run();};
 const onVisibilityChange=()=>{if(doc.hidden&&phase==='recording')finish('aborted','Movement recording requires a visible document');};
 button.addEventListener('click',onClick);doc.addEventListener('visibilitychange',onVisibilityChange);emit();
 return {get active(){return !disposed&&phase==='recording';},run,afterRender,dispose(){
  if(disposed)return;disposed=true;doc.removeEventListener('visibilitychange',onVisibilityChange);button.removeEventListener?.('click',onClick);
  if(phase==='recording')finish('aborted','Movement recording disposed');section.remove();gaps=[];slowFrames=[];slowCpuFrames=[];
 }};
}
