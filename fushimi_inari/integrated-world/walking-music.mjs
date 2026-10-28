export const WALKING_MUSIC=Object.freeze([
 Object.freeze({id:'first-light',title:'First Light Particles',artist:'Yoiyami',url:'../assets/audio/walking-score/first-light.ogg'}),
 Object.freeze({id:'blue-hour',title:'Yoiyami Core Theme',artist:'Yoiyami',url:'../assets/audio/walking-score/blue-hour.ogg'})
]);

// One native streaming decoder feeds the existing Web Audio context. A whole
// three-minute score never becomes a 60 MB AudioBuffer on the walking thread.
export function createWalkingMusic(ctx,{tracks=WALKING_MUSIC,createMedia=()=>new Audio(),random=Math.random,
 idle=work=>globalThis.requestIdleCallback?requestIdleCallback(work,{timeout:3000}):setTimeout(work,0),
 cancelIdle=id=>globalThis.cancelIdleCallback?cancelIdleCallback(id):clearTimeout(id),
 schedule=setTimeout,cancel=clearTimeout,onStats=()=>{}}={}){
 const bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);
 let media=null,source=null,idleJob=null,pauseTimer=null,enabled=false,preference=true,externalPause=false,framePause=false,disposed=false;
 let prepared=-1,current=-1,last=-1,active=false,starting=false,playing=false,ready=false,gestureBlocked=false;
 let serial=0,elapsed=0,lastTime=null,lastX=null,lastZ=null,distance=0,nextAt=75+random()*45,volume=.55,ducked=false;
 let phase='quiet',error=null,starts=0,completed=0,lastReport=-Infinity;
 const failed=new Set();
 const allowed=()=>enabled&&preference&&!externalPause&&!framePause&&!disposed&&volume>0;
 function report(force=false){
  if(!force&&ctx.currentTime-lastReport<1)return;lastReport=ctx.currentTime;
  onStats({enabled,music:preference,phase,track:current<0?null:tracks[current].id,active:playing?1:0,starts,completed,
   eligibleSeconds:Math.floor(elapsed),nextInSeconds:Math.max(0,Math.ceil(nextAt-elapsed)),streaming:true,error});
 }
 function hold(){const gain=bus.gain,now=ctx.currentTime;if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);else{gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);}}
 function envelope(fade=5){
  if(!media)return;const now=ctx.currentTime,target=volume*.22*(ducked?.18:1),remaining=media.duration-media.currentTime;
  hold();bus.gain.linearRampToValueAtTime(target,now+fade);
  if(Number.isFinite(remaining)&&remaining>fade+8){bus.gain.setValueAtTime(target,now+remaining-8);bus.gain.linearRampToValueAtTime(0,now+remaining);}
 }
 function cancelPause(){if(pauseTimer!==null){cancel(pauseTimer);pauseTimer=null;}}
 function pause(immediate=false){
  serial++;starting=false;playing=false;cancelPause();hold();
  if(immediate){bus.gain.setValueAtTime(0,ctx.currentTime);media?.pause();}
  else{bus.gain.linearRampToValueAtTime(0,ctx.currentTime+.5);pauseTimer=schedule(()=>{pauseTimer=null;media?.pause();},600);}
  if(active)phase='paused';report(true);
 }
 function initialize(){
  if(media)return;media=createMedia();media.preload='none';media.loop=false;
  source=ctx.createMediaElementSource(media);source.connect(bus);
  media.oncanplay=()=>{ready=true;if(!active)phase='ready';report(true);};
  media.onended=()=>{
   if(disposed||!active)return;last=current;current=-1;prepared=-1;active=false;playing=false;starting=false;ready=false;completed++;
   nextAt=elapsed+240+random()*180;phase='quiet';hold();bus.gain.setValueAtTime(0,ctx.currentTime);report(true);
  };
  media.onerror=()=>{
   if(disposed)return;if(prepared>=0)failed.add(prepared);pause(true);active=false;current=-1;prepared=-1;ready=false;
   error='Music could not load';phase='unavailable';nextAt=elapsed+90;report(true);
  };
 }
 function choose(){
  for(let n=1;n<=tracks.length;n++){const index=(last+n)%tracks.length;if(!failed.has(index))return index;}
  return -1;
 }
 function prepare(){
  if(disposed||!enabled||!preference||idleJob!==null||prepared>=0||failed.size>=tracks.length)return;
  idleJob=idle(()=>{
   idleJob=null;if(!enabled||!preference||disposed)return;
   const index=choose();if(index<0)return;initialize();prepared=index;ready=false;error=null;phase='loading';
   media.preload='auto';media.src=tracks[index].url;media.load();report(true);
  });
 }
 function play(){
  if(!allowed()||starting||playing||gestureBlocked||!ready||prepared<0)return;
  cancelPause();initialize();active=true;current=prepared;starting=true;phase='starting';const token=++serial;
  let work;try{work=media.play();}catch(reason){work=Promise.reject(reason);}
  Promise.resolve(work).then(()=>{
   if(token!==serial||!allowed()){if(!allowed())media.pause();return;}
   starting=false;playing=true;phase='playing';starts++;error=null;envelope(media.currentTime>0?1.5:5);report(true);
  },reason=>{
   if(token!==serial||disposed)return;starting=false;playing=false;gestureBlocked=true;phase='awaiting-gesture';error=String(reason?.name??'Playback blocked');report(true);
  });
 }
 return {prepare,setEnabled(value){
  if(disposed)return;enabled=!!value;gestureBlocked=false;lastTime=null;
  if(enabled)initialize();else{pause(true);phase='muted';}report(true);
 },setMusicEnabled(value){
  if(disposed)return;preference=!!value;gestureBlocked=false;lastTime=null;
  if(!preference){pause(true);phase='muted';}else if(active)play();report(true);
 },setVolume(value){
  if(!Number.isFinite(value)||disposed)return;volume=Math.max(0,Math.min(1,value));if(playing)envelope(.2);
 },pause(value){
  if(disposed||externalPause===!!value)return;externalPause=!!value;lastTime=null;
  if(externalPause)pause(true);
 },update(position,{paused=false,voice=false}={}){
  if(disposed)return;const now=ctx.currentTime,dt=lastTime===null?0:Math.max(0,Math.min(.25,now-lastTime));lastTime=now;
  const blocked=!!paused||position.x<-150;
  if(blocked!==framePause){framePause=blocked;if(blocked&&(playing||starting))pause();}
  const moved=lastX===null?0:Math.hypot(position.x-lastX,position.z-lastZ);lastX=position.x;lastZ=position.z;
  if(allowed()){
   elapsed+=dt;if(moved<8)distance+=moved;
   if(distance>=20&&elapsed>=nextAt-25)prepare();
   if(active||distance>=20&&elapsed>=nextAt)play();
  }
  if(ducked!==!!voice){ducked=!!voice;if(playing)envelope(.25);}
  report();
 },dispose(){
  if(disposed)return;disposed=true;enabled=false;serial++;cancelPause();if(idleJob!==null){cancelIdle(idleJob);idleJob=null;}
  if(media){media.oncanplay=null;media.onended=null;media.onerror=null;media.pause();media.removeAttribute('src');media.load();}
  source?.disconnect();bus.disconnect();
 }};
}
