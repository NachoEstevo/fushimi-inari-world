import {createTrainArrivalSequence} from './train-arrival-sequence.mjs';
import {pathSampler} from './spatial.mjs';
import {SpatialCollisionWorld} from './collision.mjs';

// The edit adds a one-second black lead and three-second end card: 38s total.
export const SHOWCASE_DURATION=34;
export const SHOWCASE_SHOTS=Object.freeze([
 Object.freeze({id:'arrival',start:0,end:10}),
 Object.freeze({id:'romon',start:10,end:17}),
 Object.freeze({id:'main-halls',start:17,end:21}),
 Object.freeze({id:'senbon',start:21,end:27}),
 Object.freeze({id:'mountain-torii',start:27,end:34}),
]);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const mix=(a,b,t)=>a+(b-a)*t;
// Gentle acceleration/deceleration around a nearly constant walking pace.
export function showcaseTravelFraction(t){
 const u=clamp(t,0,1),r=.15;
 const ramp=x=>.5*(x-r/Math.PI*Math.sin(Math.PI*x/r))/(1-r);
 return u<r?ramp(u):u>1-r?1-ramp(1-u):(u-r/2)/(1-r);
}

// Precompute a short camera rail once, rather than snapping each frame to a
// different stair/platform sample. A 0.7m symmetric filter keeps the eye and
// heading continuous; the assembled collision/support audit checks its result.
export function createShowcaseWalkRail(pointAt,walkHeight,start,end){
 const step=.1,padding=7,first=Math.floor((Math.min(start,end)-padding)/step)*step;
 const count=Math.ceil((Math.abs(end-start)+padding*2)/step)+1;
 const raw=Array.from({length:count},(_,i)=>{
  const point=pointAt(first+i*step);
  return [point[0],walkHeight(point[0],point[2],point[1])+1.7,point[2]];
 });
 const radius=7,weights=Array.from({length:radius*2+1},(_,i)=>Math.exp(-.5*((i-radius)/3)**2));
 const points=raw.map((_,i)=>{
  const sum=[0,0,0];let weight=0;
  for(let offset=-radius;offset<=radius;offset++){
   const p=raw[clamp(i+offset,0,raw.length-1)],w=weights[offset+radius];
   for(let axis=0;axis<3;axis++)sum[axis]+=p[axis]*w;weight+=w;
  }
  return sum.map(value=>value/weight);
 });
 return {at(distance){
  const value=clamp((distance-first)/step,0,points.length-1),lo=Math.floor(value),hi=Math.min(lo+1,points.length-1);
  return points[lo].map((v,axis)=>mix(v,points[hi][axis],value-lo));
 }};
}

// Production arrival plus short mapped camera rails. All inter-area transfers
// are edits; no route teleport or abrupt steering is shown inside a shot.
export function createShowcaseItinerary({assembly,station}){
 if(!station?.built||!station.spec?.arrival)throw new Error('Showcase needs a prepared train station');
 const precinctPoints=assembly.spatial.connected(['romon','honden']);
 if(precinctPoints.length<2)throw new Error('Showcase needs a connected shrine approach');
 const precinct=pathSampler(precinctPoints),tunnel=assembly.spatial.twins[0];
 const mountain=pathSampler(assembly.spatial.connected(['okusha','kumataka']));
 if(!(precinct.total>0)||!(tunnel?.total>0)||mountain.total<179)throw new Error('Showcase mapped camera rails are incomplete');
 let sequence=createTrainArrivalSequence(station.spec.arrival),arrivalState=sequence.start(),arrivalTime=0;
 const arrivalDuration=arrivalState.totalDuration;
 function arrivalAt(seconds){
  const desired=clamp(seconds/10,0,1)*arrivalDuration;
  if(desired<arrivalTime){sequence=createTrainArrivalSequence(station.spec.arrival);arrivalState=sequence.start();arrivalTime=0;}
  while(desired-arrivalTime>1e-8){const step=Math.min(.1,desired-arrivalTime);arrivalState=sequence.update(step);arrivalTime+=step;}
  return arrivalState;
 }
 const along=(path,distance)=>path.at(clamp(distance/path.total,0,1)).point;
 function approach(distance){
  if(distance>=0)return along(precinct,distance);
  const a=precinctPoints[0],b=precinctPoints[1],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
  return [a[0]+(b[0]-a[0])*distance/length,a[1],a[2]+(b[2]-a[2])*distance/length];
 }
 const makeRail=(pointAt,start,end)=>createShowcaseWalkRail(pointAt,(...args)=>assembly.walkHeight(...args),start,end);
 const rails={romon:makeRail(approach,-22,-13),
  halls:makeRail(d=>along(precinct,d),40,45),
  senbon:makeRail(d=>along(tunnel,d),12,20),
  mountain:makeRail(d=>along(mountain,d),166,173)};
 function sample(seconds){
  const time=clamp(seconds,0,SHOWCASE_DURATION),shot=SHOWCASE_SHOTS.find(shot=>time<shot.end)??SHOWCASE_SHOTS.at(-1);
  const fraction=showcaseTravelFraction((time-shot.start)/(shot.end-shot.start));
  if(shot.id==='arrival'){
   const train=arrivalAt(time);
   return {shot:shot.id,time,pose:train.pose,trainOffset:train.trainOffset,doorProgress:train.doorProgress};
  }
  let position,target;
  if(shot.id==='romon'){
   const distance=mix(-22,-13,fraction);position=rails.romon.at(distance);target=rails.romon.at(distance+6);target[1]+=.65;
  }else if(shot.id==='main-halls'){
   const distance=mix(40,45,fraction);position=rails.halls.at(distance);
   const hall=assembly.spatial.byId.naihaiden??assembly.spatial.byId.honden;target=[hall.target[0],hall.target[1]+3,hall.target[2]];
  }else if(shot.id==='senbon'){
   const distance=mix(12,20,fraction);position=rails.senbon.at(distance);target=rails.senbon.at(distance-5);
  }else{
   const distance=mix(166,173,fraction);position=rails.mountain.at(distance);target=rails.mountain.at(distance+5);
  }
  return {shot:shot.id,time,pose:{position,target},trainOffset:[0,0,0],doorProgress:0};
 }
 const preparationViews=SHOWCASE_SHOTS.flatMap(shot=>[shot.start,(shot.start+shot.end)/2,shot.end-.01]).map(time=>sample(time));
 return {duration:SHOWCASE_DURATION,shots:SHOWCASE_SHOTS,preparationViews,sample};
}

function recorderType(Recorder){
 for(const type of ['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'])if(!Recorder.isTypeSupported||Recorder.isTypeSupported(type))return type;
 throw new Error('This browser cannot record WebM video');
}

export function validateShowcaseWalk(itinerary,assembly){
 const world=new SpatialCollisionWorld(4);
 for(const collider of assembly.colliders??[])world[collider.type==='box'?'addBox':'addCylinder'](...collider.args);
 let samples=0,maxCorrection=0,maxVerticalStep=0,previous=null;
 for(let sample=SHOWCASE_SHOTS[0].end*10;sample<=SHOWCASE_DURATION*10;sample++){
  const time=sample/10;
  const frame=itinerary.sample(time),[x,y,z]=frame.pose.position;
  if(![x,y,z].every(Number.isFinite))throw new Error(`Showcase ${frame.shot} has an invalid floor height`);
  if(assembly.isWalkable&&!assembly.isWalkable(x,z)&&!assembly.isPublicWalkSupport?.(x,z))throw new Error(`Showcase ${frame.shot} leaves public walking support`);
  const [tx,,tz]=frame.pose.target,heading=Math.hypot(tx-x,tz-z)||1;
  for(const side of [-1,1]){
   const sx=x-(tz-z)/heading*.34*side,sz=z+(tx-x)/heading*.34*side;
   if(assembly.isWalkable&&!assembly.isWalkable(sx,sz)&&!assembly.isPublicWalkSupport?.(sx,sz))throw new Error(`Showcase ${frame.shot} is too close to a walking edge`);
  }
  if(previous?.shot===frame.shot)maxVerticalStep=Math.max(maxVerticalStep,Math.abs(y-previous.y));previous={shot:frame.shot,y};
  const resolved=world.resolvePlayer(x,y,z,.45),correction=Math.hypot(resolved.x-x,resolved.z-z);
  const cylinderCenter=(assembly.colliders??[]).some(collider=>collider.type!=='box'&&Math.hypot(collider.args[0]-x,collider.args[1]-z)<1e-4&&y+.15>=collider.args[3]&&y-1.55<=collider.args[4]);
  if(correction>.03||cylinderCenter)throw new Error(`Showcase ${frame.shot} intersects a solid at ${time.toFixed(1)} s; review this camera path`);
  maxCorrection=Math.max(maxCorrection,correction);samples++;
 }
 return {samples,maxCorrection,maxVerticalStep,bodyRadius:.45,walkingEdgeMargin:.34};
}

// No renderer or animation loop is created. The existing loop calls update
// before world updates, then afterRender immediately after its regular render.
export function createShowcaseCapture({canvas,camera,controls,station,assembly,prepare,overlays=[],
 onBegin=()=>{},onEnd=()=>{},onState=()=>{},onComplete=()=>{},
 Recorder=globalThis.MediaRecorder,isHidden=()=>globalThis.document?.hidden??false,visibilityTarget=globalThis.document}){
 if(typeof prepare!=='function')throw new TypeError('Showcase requires a prewarm callback');
 const itinerary=createShowcaseItinerary({assembly,station});
 let phase='idle',walkAudit=null,elapsed=0,startedAt=null,lastFrameTime=null,frameCount=0,maxFrameGap=0,recorder=null,stream=null,restore=null,chunks=[],pendingStart=null,pendingStop=false,result=null,run=0,settleRecording=null;
 const snapshot=()=>({phase,elapsed,duration:itinerary.duration,shot:itinerary.sample(elapsed).shot,result,walkAudit,frameCount,averageFPS:elapsed?frameCount/elapsed:0,maxFrameGap});
 const emit=()=>onState(snapshot());
 const active=()=>phase==='preparing'||phase==='recording';
 function apply(frame){camera.position.set(...frame.pose.position);camera.lookAt(...frame.pose.target);controls?.target?.set(...frame.pose.target);station.setTrainOffset(frame.trainOffset);station.setDoorOpen(frame.doorProgress);}
 function release(){
  stream?.getTracks().forEach(track=>track.stop());stream=null;
  if(restore){camera.position.copy(restore.position);camera.quaternion.copy(restore.rotation);if(restore.target)controls.target.copy(restore.target);if(controls)controls.enabled=restore.enabled;for(const [object,visible] of restore.visibility)object.visible=visible;restore=null;}
  station.setTrainOffset([0,0,0]);station.setDoorOpen(0);onEnd();
 }
 function stopRecorder(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
 function fail(error){
  if(!active())return;
  phase='failed';run++;pendingStart=null;stopRecorder();release();emit();settleRecording?.reject(error);settleRecording=null;
 }
 async function record(){
  if(active())throw new Error('A showcase capture is already running');
  if(!Recorder||typeof canvas.captureStream!=='function')throw new Error('Canvas recording is unavailable in this browser');
  const mimeType=recorderType(Recorder),token=++run;
  result=null;elapsed=0;startedAt=null;lastFrameTime=null;frameCount=0;maxFrameGap=0;chunks=[];pendingStart=null;pendingStop=false;phase='preparing';
  restore={position:camera.position.clone(),rotation:camera.quaternion.clone(),target:controls?.target?.clone(),enabled:controls?.enabled,visibility:overlays.filter(Boolean).map(object=>[object,object.visible])};
  try{
   emit();
   for(const [object] of restore.visibility)object.visible=false;
   onBegin();if(controls)controls.enabled=false;
   await prepare(itinerary.preparationViews);
   if(token!==run)return null;
   if(isHidden())throw new Error('Keep the showcase tab visible while recording');
   walkAudit=validateShowcaseWalk(itinerary,assembly);
   apply(itinerary.sample(0));
   const completion=new Promise((resolve,reject)=>{settleRecording={resolve,reject};});
   // Start only after the regular renderer has drawn the arrival pose, so the
   // first encoded frame cannot contain the final prewarm view.
   pendingStart=()=>{
    try{
     stream=canvas.captureStream(30);recorder=new Recorder(stream,{mimeType,videoBitsPerSecond:14000000});
     recorder.ondataavailable=event=>{if(token===run&&phase==='recording'&&event.data?.size)chunks.push(event.data);};
     recorder.onerror=event=>{if(token===run)fail(event.error??new Error('Video recording failed'));};
     recorder.onstop=()=>{
      if(token!==run||phase!=='recording')return;
      const blob=new Blob(chunks,{type:recorder.mimeType||mimeType});
      if(!blob.size){fail(new Error('Recording produced no video data. Check the renderer and retry the showcase.'));return;}
      const completion=settleRecording;settleRecording=null;
      try{result=blob;phase='complete';release();emit();onComplete(result,snapshot());completion?.resolve(result);}
      catch(error){completion?.reject(error);}
     };
     phase='recording';startedAt=lastFrameTime;recorder.start(1000);emit();
    }catch(error){fail(error);}
   };
   return await completion;
  }catch(error){fail(error);throw error;}
 }
 // The viewer skips its animation loop while hidden, so visibility interruption
 // must also work without waiting for another rendered frame.
 const onVisibility=()=>{if(active()&&isHidden())fail(new Error('Capture interrupted because the tab became hidden'));};
 visibilityTarget?.addEventListener('visibilitychange',onVisibility);
 return {
  get active(){return active();},
  // While compileAsync/upload owns the renderer, the viewer must skip its
  // regular render and world mutations. Once armed, one regular frame is needed.
  get preparing(){return phase==='preparing'&&pendingStart===null;},
  get snapshot(){return snapshot();},record,
  update(time){
   if(!active())return false;
   if(phase==='preparing'){lastFrameTime=time;return true;}
   if(isHidden()){fail(new Error('Capture interrupted because the tab became hidden'));return true;}
   if(startedAt===null)startedAt=time;
   if(lastFrameTime!==null)maxFrameGap=Math.max(maxFrameGap,(time-lastFrameTime)/1000);
   lastFrameTime=time;frameCount++;
   elapsed=clamp((time-startedAt)/1000,0,itinerary.duration);apply(itinerary.sample(elapsed));
   if(elapsed>=itinerary.duration)pendingStop=true;
   emit();return true;
  },
  afterRender(){if(pendingStart&&phase==='preparing'){const start=pendingStart;pendingStart=null;start();}else if(pendingStop&&phase==='recording'){pendingStop=false;stopRecorder();}},
  cancel(){
   if(!active())return;
   phase='cancelled';run++;pendingStart=null;stopRecorder();release();emit();settleRecording?.resolve(null);settleRecording=null;
  },
  dispose(){this.cancel();visibilityTarget?.removeEventListener('visibilitychange',onVisibility);},
 };
}

export function installShowcaseCapture(options){
 if(new URLSearchParams(globalThis.location?.search??'').get('showcase')!=='1')return null;
 const panel=document.createElement('aside'),button=document.createElement('button'),status=document.createElement('output'),download=document.createElement('a');
 panel.id='showcase-capture';panel.style.cssText='position:fixed;right:18px;bottom:18px;z-index:10000;display:grid;gap:8px;padding:12px;background:#151714eb;color:white;font:13px system-ui;border-radius:8px;max-width:280px';
 button.type='button';button.textContent=`Record ${SHOWCASE_DURATION}-second showcase`;status.setAttribute('aria-live','polite');download.hidden=true;download.textContent='Download WebM';download.style.color='#fff';
 panel.append(button,status,download);document.body.append(panel);
 let url=null;
 const capture=createShowcaseCapture({...options,onState(state){
  button.disabled=state.phase==='preparing'||state.phase==='recording';
  status.textContent=state.phase==='recording'?`${state.shot} · ${state.elapsed.toFixed(1)} / ${SHOWCASE_DURATION} s`:state.phase;
  options.onState?.(state);
 },onComplete(blob,state){
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);download.href=url;download.download=`fushimi-inari-showcase-${SHOWCASE_DURATION}s.webm`;download.hidden=false;download.click();options.onComplete?.(blob,state);
 }});
 button.onclick=()=>{download.hidden=true;capture.record().catch(error=>{status.textContent=error.message;});};
 const dispose=capture.dispose.bind(capture);capture.dispose=()=>{dispose();panel.remove();if(url)URL.revokeObjectURL(url);};
 return capture;
}
