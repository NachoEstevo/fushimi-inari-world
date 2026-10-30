import {INARI_PLATFORM1,INARI_PLATFORM2,pointInStationPolygon} from './inari-station-arrival-spec.mjs';
import {KEIHAN_PLATFORM1,KEIHAN_PLATFORM2} from './keihan-station-spec.mjs';

const stationPlatforms=[INARI_PLATFORM1,INARI_PLATFORM2,KEIHAN_PLATFORM1,KEIHAN_PLATFORM2];

// Platform source polygons and their gate landings, rather than a west-side
// cutoff: the bridge, Urasando and Omotesando are all eligible walking routes.
function waitingAtStation({x,z}){
 return stationPlatforms.some(ring=>pointInStationPolygon(x,z,ring))||
  x>=-177&&x<=-161&&z>=22&&z<=53||x>=-311&&x<=-296&&z>=-153&&z<=-126;
}

// geography/features.json source centerlines, with the same mapped/pathWidth
// half-widths as the walkable paving: Omotesando and the two Urasando ways.
const shrineApproaches=[
 {id:'way/105449722',radius:4,points:[[-18.3,1.959],[-36.28,3.918],[-62.762,5.811],[-73.144,6.724],[-149.06,10.742],[-157.407,10.342]]},
 {id:'way/297888106',radius:2,points:[[-58.657,-69.029],[-62.744,-73.115],[-84.756,-75.096],[-124.95,-84.325],[-151.505,-87.319]]},
 {id:'way/105449676',radius:1,points:[[-20.434,-25.381],[-38.305,-49.771],[-52.828,-65.946],[-58.657,-69.029]]}
];
function inShrineApproach({x,z}){
 for(const {points,radius}of shrineApproaches)for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
  if((x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2<=radius*radius)return true;
 }
 return false;
}

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
 let serial=0,elapsed=0,lastTime=null,lastX=null,lastZ=null,distance=0,nextAt=12+random()*10,volume=.55,ducked=false;
 let phase='quiet',error=null,starts=0,completed=0,lastReport=-Infinity,approachOutside=false,approachCueUsed=false;
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
 function unavailable(){
  if(disposed||prepared<0)return;failed.add(prepared);pause(true);active=false;current=-1;prepared=-1;ready=false;
  error='Music could not load';phase='unavailable';nextAt=elapsed+45+random()*30;report(true);
 }
 function initialize(){
  if(media)return;media=createMedia();media.preload='none';media.loop=false;
  source=ctx.createMediaElementSource(media);source.connect(bus);
  media.oncanplay=()=>{if(disposed||prepared<0)return;ready=true;if(!active)phase='ready';if(active||distance>=20&&elapsed>=nextAt)play();report(true);};
  media.onended=()=>{
   if(disposed||!active)return;last=current;current=-1;prepared=-1;active=false;playing=false;starting=false;ready=false;completed++;
   nextAt=elapsed+45+random()*30;phase='quiet';hold();bus.gain.setValueAtTime(0,ctx.currentTime);report(true);
  };
  media.onerror=unavailable;
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
   if(token!==serial||disposed)return;if(reason?.name!=='NotAllowedError'){unavailable();return;}starting=false;playing=false;gestureBlocked=true;phase='awaiting-gesture';error=String(reason?.name??'Playback blocked');report(true);
  });
 }
 return {prepare,setEnabled(value){
  if(disposed)return;enabled=!!value;gestureBlocked=false;lastTime=null;
  if(enabled)initialize();else{pause(true);phase='muted';}report(true);
 },setMusicEnabled(value){
  if(disposed)return;preference=!!value;gestureBlocked=false;lastTime=null;
  if(!preference){pause(true);phase='muted';}else if(active)play();report(true);
 },setVolume(value){
  if(!Number.isFinite(value)||disposed)return;volume=Math.max(0,Math.min(1,value));if(volume===0)pause(true);else if(active)play();if(playing)envelope(.2);
 },pause(value){
  if(disposed||externalPause===!!value)return;externalPause=!!value;lastTime=null;
  if(externalPause)pause(true);
 },update(position,{paused=false,voice=false}={}){
  if(disposed)return;const now=ctx.currentTime,dt=lastTime===null?0:Math.max(0,Math.min(.25,now-lastTime));lastTime=now;
  const blocked=!!paused||!active&&waitingAtStation(position);
  if(blocked!==framePause){framePause=blocked;if(blocked&&(playing||starting))pause();}
  const moved=lastX===null?0:Math.hypot(position.x-lastX,position.z-lastZ);lastX=position.x;lastZ=position.z;
  if(allowed()){
   elapsed+=dt;if(moved<8)distance+=moved;
   if(!approachCueUsed){
    if(!inShrineApproach(position))approachOutside=true;
    else if(approachOutside){approachCueUsed=true;if(!active)nextAt=Math.min(nextAt,elapsed+3+random()*3);}
   }
   if(distance>=20&&elapsed>=nextAt-8)prepare();
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
