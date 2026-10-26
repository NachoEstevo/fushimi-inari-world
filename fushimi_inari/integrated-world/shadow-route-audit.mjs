import {pathSampler} from './spatial.mjs';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b),i=clamp(p,0,1)*(sorted.length-1),lo=Math.floor(i),hi=Math.ceil(i);
 return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo);
}
const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
export function summarizeShadowFrames(frames){
 const gaps=frames.map(f=>f.gap).filter(Number.isFinite),field=k=>frames.map(f=>f[k]).filter(Number.isFinite);
 const shadow=frames.filter(f=>f.shadowUpdated),shadowField=k=>shadow.map(f=>f[k]).filter(Number.isFinite);
 const elapsed=gaps.reduce((a,b)=>a+b,0);
 return {fps:elapsed?gaps.length*1000/elapsed:null,p50:percentile(gaps,.5),p95:percentile(gaps,.95),p99:percentile(gaps,.99),worst:gaps.length?Math.max(...gaps):null,frameCount:frames.length,submitMean:mean(field('submitMs')),trianglesMean:mean(field('triangles')),callsMean:mean(field('calls')),shadowFrames:shadow.length,shadowSubmitMean:mean(shadowField('submitMs')),shadowTrianglesMean:mean(shadowField('triangles')),shadowCallsMean:mean(shadowField('calls'))};
}
export function createShadowRoute(assembly,duration=16){
 const points=assembly.spatial.returning,anchor=assembly.spatial.byId.mitsurugi?.checkpoint??assembly.spatial.byId.mitsurugi?.target;
 if(!Array.isArray(points)||points.length<2||!anchor||!Number.isFinite(duration)||duration<=0)throw new Error('Shadow route requires a valid Mitsurugi return path and duration');
 const path=pathSampler(points);let distance=0,best=Infinity,start=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
  if(!length)continue;
  const t=clamp(((anchor[0]-a[0])*dx+(anchor[2]-a[2])*dz)/(length*length),0,1),x=a[0]+dx*t,z=a[2]+dz*t,d=Math.hypot(anchor[0]-x,anchor[2]-z);
  if(d<best){best=d;start=distance+t*length;}distance+=length;
 }
 if(path.total-start<12)throw new Error('Shadow route needs 12 m after Mitsurugi');
 const at=d=>path.at(clamp(d/path.total,0,1)).point;
 const eye=p=>{const y=assembly.walkHeight(p[0],p[2],p[1])+1.7;if(!Number.isFinite(y))throw new Error('Shadow route has an invalid walk height');return [p[0],y,p[2]];};
 function sample(time){
  const fraction=clamp(time/duration,0,1),forward=fraction<.5,d=forward?fraction*24:(1-fraction)*24,absolute=start+d;
  let target=at(absolute+(forward?3:-3));
  if(Math.hypot(target[0]-at(absolute)[0],target[2]-at(absolute)[2])<.001)target=at(absolute+(forward?-3:3));
  return {time:clamp(time,0,duration),pose:{position:eye(at(absolute)),target:eye(target)}};
 }
 return {duration,sample,preparationViews:[0,1,2,3,4,5,6].map(step=>sample(duration*step/6))};
}
export function installShadowRouteAudit({camera,assembly,prepare=async()=>{},onBegin=()=>{},onEnd=()=>{},getStats=()=>({}),duration=16}){
 const route=createShadowRoute(assembly,duration),doc=globalThis.document;
 const section=doc.createElement('section');section.id='shadow-route-audit';
 const output=doc.createElement('output');
 let phase='idle',result=null,error=null,startTime=null,lastTime=null,frames=[],previousShadow=null,begun=false,disposed=false;
 const active=()=>['preparing','settling','running','preview'].includes(phase);
 const emit=()=>{const state={phase,result,error};doc.body.dataset.shadowRouteAudit=JSON.stringify(state);output.textContent=error??(result?JSON.stringify(result):phase);};
 const apply=frame=>{camera.position.set(...frame.pose.position);camera.lookAt(...frame.pose.target);};
 function finish(next,reason=null){phase=next;error=reason?String(reason.message??reason):null;if(begun){begun=false;try{onEnd();}catch(e){error=String(e.message??e);phase='error';}}emit();}
 async function begin(previewTime=null){
  if(active()||disposed)return;
  phase=previewTime===null?'preparing':'preview';result=null;error=null;frames=[];lastTime=null;startTime=null;previousShadow=null;emit();
  try{
   begun=true;onBegin();
   const views=previewTime===null?route.preparationViews:[route.sample(previewTime)];
   apply(views[0]);await prepare(views);
   if(disposed)return;
   if(previewTime!==null){apply(route.sample(previewTime));finish('idle');return;}
   phase='settling';startTime=null;emit();
  }catch(e){finish('error',e);}
 }
 function update(time){
  if(!active())return false;
  try{
   if(doc.hidden&&(phase==='settling'||phase==='running'))throw new Error('Shadow route requires a visible document');
   if(phase==='settling'){
    startTime??=time;const t=clamp((time-startTime)/2000,0,1);apply(route.sample(t*duration));
    if(t>=1){phase='running';startTime=null;lastTime=null;previousShadow=null;emit();}
   }else if(phase==='running'){
    startTime??=time;apply(route.sample((time-startTime)/1000));
   }
  }catch(e){finish('error',e);return false;}
  return true;
 }
 function afterRender(time,submitMs){
  if(phase!=='running'||startTime===null)return;
  try{
   if(doc.hidden)throw new Error('Shadow route requires a visible document');
   const stats=getStats()??{},updates=stats.shadowUpdates,shadowUpdated=Number.isFinite(updates)&&previousShadow!==null&&updates>previousShadow;
   if(!Number.isFinite(stats.calls)||stats.calls<=0||!Number.isFinite(stats.triangles)||stats.triangles<=0)throw new Error('Shadow route received invalid draw statistics');
   if(Number.isFinite(updates))previousShadow=updates;
   if(lastTime!==null&&frames.length<10000)frames.push({gap:time-lastTime,submitMs,calls:stats.calls,triangles:stats.triangles,shadowUpdated});
   lastTime=time;
   if(time-startTime>=duration*1000){result={...summarizeShadowFrames(frames),duration,preparationViews:route.preparationViews};finish('complete');}
  }catch(e){finish('error',e);}
 }
 function button(label,fn){const b=doc.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);section.append(b);}
 const onVisibilityChange=()=>{if(doc.hidden&&(phase==='settling'||phase==='running'))finish('error',new Error('Shadow route requires a visible document'));};
 doc.addEventListener?.('visibilitychange',onVisibilityChange);
 button('Run shadow route',()=>void begin());button('Preview start',()=>void begin(0));button('Preview midpoint',()=>void begin(duration/2));section.append(output);doc.body.append(section);emit();
 return {get active(){return active();},update,afterRender,run:()=>begin(),previewStart:()=>begin(0),previewMidpoint:()=>begin(duration/2),dispose(){if(disposed)return;disposed=true;doc.removeEventListener?.('visibilitychange',onVisibilityChange);if(active())finish('idle');section.remove();}};
}
