import * as THREE from 'three';
import {createZenJourney} from './zen-journey-state.mjs';
import {createZenPhotoAlbum} from './zen-photo-album.mjs';
import {installZenJourneyUI} from './zen-journey-ui.mjs';
import {createZenWorldMoments} from './zen-world-moments.mjs';
import {createZenWeather} from './zen-weather.mjs';
import {createZenReturnTrain} from './zen-return-train.mjs';
import {createZenSeatedCamera} from './zen-seated-camera.mjs';
import {createZenHeldDrink} from './zen-held-drink.mjs';

import {zenJourneyLocations} from './zen-locations.mjs';

// Connect optional activities through explicit completions. Existing walking,
// journal and route owners retain their responsibilities and their data.
export function installZenExperience({scene,camera,walker,controls,assembly,shop,visitors,streetCommerce,audio,onPhoto,openJournal,onIntention,onTimeOfDay,getTimeOfDay,getQuality,audit=false,getBlocked=()=>false}){
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./zen-experience.css',import.meta.url).href;document.head.append(style);
 let storage=null;try{storage=localStorage;}catch{}
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const locations=zenJourneyLocations(assembly,shop,streetCommerce),journey=createZenJourney({storage,locations}),album=createZenPhotoAlbum();
 let ui,world,boardingContext=null,disposed=false,lastObserve=-Infinity,worldWasActive=false,autoDay=true,lastMode=getTimeOfDay(),rested=false,departurePhase=null;
 let journeyState=journey.snapshot();
 const weather=createZenWeather({scene,camera,assembly,shop,getQuality});
 const seat=createZenSeatedCamera({camera,walker,controls,reducedMotion:()=>reducedMotion.matches});
 const drink=createZenHeldDrink({scene,camera});
 const direction=new THREE.Vector3();
 const context=()=>({position:camera.position.toArray(),direction:camera.getWorldDirection(direction).toArray(),mode:walker.mode,fov:camera.fov,weather:journeyState.weather,light:getTimeOfDay(),createdAt:Date.now()});
 const notice=document.createElement('p');notice.id='zen-experience-notice';notice.className='zen-experience-notice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');document.body.append(notice);let noticeUntil=0;
 const announce=text=>{notice.textContent=text;notice.hidden=false;noticeUntil=performance.now()+4200;};
 function applyTime(mode){if(getTimeOfDay()===mode)return;onTimeOfDay(mode);lastMode=mode;}
 const returning=createZenReturnTrain({station:assembly.keihanStation??assembly.inariStation,camera,walker,controls,reducedMotion:()=>reducedMotion.matches,
  onBegin(){boardingContext={...context(),mode:'walk',intent:'interact'};seat.stand();world?.setSeated(false);drink.stow();setUmbrella(false);if(autoDay&&rested&&getTimeOfDay()==='gold')applyTime('night');},
  onComplete(){if(boardingContext){journey.recordMoment('return',boardingContext);journey.finishVisit();boardingContext=null;}ui.showEnding();},
  onCancel(){boardingContext=null;announce('Back on the platform. Your walk is still yours.');}
 });
 const roots=assembly.legacy.interactables;if(returning.stats.available)roots.push(returning.interactionRoot);
 function startReturn(){
  if(world?.active||getBlocked()){announce('Close the current activity before boarding.');return false;}
  if(walker.mode!=='walk'){announce('Return to walking on the platform to board.');return false;}
  const result=returning.start();if(!result.ok)announce(result.reason);return result.ok;
 }
 function action(event){
  if(!event?.completed)return;
  const id=event.type==='meetstation'?'aki':event.type;
  if(['tea','cat','map','postcard','aki'].includes(id))journey.recordMoment(id,{...context(),intent:'interact'});
  if(id==='cat.pet')weather.purr?.();
  if(id==='tea'){rested=true;if(autoDay&&getTimeOfDay()==='day')applyTime('gold');announce('A warm cup, and a little time to rest.');}
 }
 world=createZenWorldMoments({scene,camera,assembly,shop,visitors,journey,onAction:action,onSeat:payload=>{
  if(payload.leave){seat.stand();world.setSeated(false);return;}
  const accepted=!returning.active&&!getBlocked()&&seat.sit({...payload,onLeave(){world?.setSeated(false);payload.onLeave?.();}});world.setSeated(!!accepted);
 },onReturn:startReturn});
 ui=installZenJourneyUI({journey,album,onPhoto,onReturn:startReturn,getContext:context,onOpen:openJournal,onIntention:id=>onIntention(id),onWeather:mode=>weather.setMode(mode)});
 weather.setMode(journeyState.weather);
 const unsubscribe=journey.subscribe(state=>{journeyState=state;weather.setMode(state.weather);});
 const extras=document.createElement('div');extras.className='zen-visit-extras';
 const umbrella=document.createElement('button');umbrella.type='button';umbrella.textContent='Open umbrella · U';umbrella.setAttribute('aria-pressed','false');
 let umbrellaOpen=false;function setUmbrella(value){umbrellaOpen=!!value;weather.setUmbrella(umbrellaOpen);umbrella.textContent=umbrellaOpen?'Close umbrella · U':'Open umbrella · U';umbrella.setAttribute('aria-pressed',String(umbrellaOpen));}
 function toggleUmbrella(){setUmbrella(!umbrellaOpen);}
 umbrella.onclick=toggleUmbrella;
 const label=document.createElement('label'),day=document.createElement('input');day.type='checkbox';day.checked=autoDay;day.onchange=()=>{autoDay=day.checked;};label.append(day,document.createTextNode(' Let the afternoon unfold as I rest and return'));
 extras.append(umbrella,label);document.getElementById('zen-visit').querySelector('.zen-weather').after(extras);
 const interactButton=document.createElement('button');interactButton.id='zen-interact';interactButton.type='button';interactButton.hidden=true;interactButton.onclick=()=>{interactButton.blur();walker.interact();};document.body.append(interactButton);
 const departure=document.createElement('section');departure.id='zen-departure';departure.hidden=true;departure.setAttribute('aria-label','Return train journey');
 const departureText=document.createElement('p'),cancel=document.createElement('button'),skip=document.createElement('button');cancel.textContent='Stay on the platform';skip.textContent='Skip departure';departure.append(departureText,cancel,skip);document.body.append(departure);
 cancel.onclick=()=>{if(!getBlocked())returning.cancel();};skip.onclick=()=>{if(getBlocked())return;for(let i=0;i<110&&returning.active;i++)returning.update(.1);};
 const unlock=event=>weather.setAudioEnabled(audio.enabled,{gesture:!event.repeat});
 document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
 const onKey=event=>{
  if(event.repeat||event.ctrlKey||event.metaKey||event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]'))return;
  if(event.code==='KeyU'&&!getBlocked()&&!world.active&&!returning.active){event.preventDefault();toggleUmbrella();}
 };
 document.addEventListener('keydown',onKey,true);
 let capturedPrompt=null;
 const runtime={journey,album,weather,world,returning,seat,get active(){return seat.active||world.active||returning.active;},get cameraOwned(){return seat.active||returning.active;},
  get preparationRoots(){return [...world.interactionRoots,...world.interactionRoots.map(root=>root.userData.teaSurface).filter(Boolean),...(streetCommerce?.machines??[]).map(machine=>machine.can),returning.interactionRoot,drink.group,weather.group].filter(Boolean);},
  async prepare(compile){await world.ready;if(disposed)return;world.update(0,performance.now()/1000,{blocked:true,mode:walker.mode,weather:journeyState.weather});await compile(runtime.preparationRoots.filter(root=>root!==weather.group));await weather.prepare(()=>compile([weather.group]));},
  async recordPhoto(details){
   if(disposed)return '';if(!journey.canRecordPhoto(details))return 'This view cannot be kept in the journal.';let thumbnail=null;try{thumbnail=await album.save(details.blob);}catch(error){announce(error.message);}
   const record=journey.recordPhoto({...details,thumbnailId:thumbnail?.id,promptId:capturedPrompt});capturedPrompt=null;
   if(!record)return 'This view cannot be kept in the journal.';
   return thumbnail?(thumbnail.persistent?'Kept in your journal.':'Kept for this visit · browser photo storage unavailable.'):'The memory is noted; the image preview could not be kept.';
  },selectPhotoPrompt(id){capturedPrompt=id;},collectDrink(event){drink.collect(event);journey.recordMoment('drink',{...context(),intent:'interact'});},
  cancelActivity(){seat.stand();world.setSeated(false);returning.cancel();},
  update(dt,time,{blocked=false}={}){
   if(disposed)return;
   const external=blocked||document.hidden;
   returning.update(dt,{paused:external});seat.update(dt,{paused:external||world.active||returning.active});
   world.update(dt,time/1000,{blocked:external||returning.active,mode:walker.mode,weather:journeyState.weather});
   if(world.active!==worldWasActive){worldWasActive=world.active;walker.pause(world.active||external||seat.active||returning.active);if(world.active)controls.enabled=false;}

   const hint=document.getElementById('interaction-hint'),canInteract=!external&&!runtime.active&&hint&&!hint.hidden;interactButton.hidden=!canInteract;if(canInteract&&interactButton.textContent!==hint.textContent)interactButton.textContent=hint.textContent;
   ui.update(time);departure.hidden=!returning.active||external;cancel.disabled=skip.disabled=external;if(departurePhase!==returning.stats.phase){departurePhase=returning.stats.phase;departureText.textContent=returning.active?({opening:'The doors open.',boarding:'Find a seat by the window.',closing:'One last look at the platform.',departing:'Taking a little of the mountain home.'}[returning.stats.phase]??'Your return journey'):'';}
   if(time-lastObserve>=500){lastObserve=time;weather.setAudioEnabled(audio.enabled);weather.setVolume(Number(document.getElementById('ambient-volume')?.value??55)/100);if(!external&&!returning.active)journey.observe(camera.position.toArray(),{mode:walker.mode});
    const mode=getTimeOfDay();if(mode!==lastMode){autoDay=false;day.checked=false;lastMode=mode;}
    if(audit)document.body.dataset.zenExperience=JSON.stringify({activity:{seated:seat.active,modal:world.active,returning:returning.active},weather:weather.stats,returnTrain:returning.stats,world:world.stats,carriedDrink:drink.stats,story:journeyState.story});
   }
   if(!notice.hidden&&time>noticeUntil)notice.hidden=true;
  },afterCamera(dt,time,{blocked=false}={}){if(disposed)return;weather.update(dt,time/1000,{blocked:blocked||document.hidden});drink.update(dt,{blocked:blocked||document.hidden||world.active||seat.active||returning.active});},dispose(){if(disposed)return;disposed=true;unsubscribe();seat.dispose();world.dispose();returning.dispose();weather.dispose();drink.dispose();ui.dispose();album.dispose();journey.dispose();
   const i=roots.indexOf(returning.interactionRoot);if(i>=0)roots.splice(i,1);extras.remove();notice.remove();departure.remove();interactButton.remove();style.remove();document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('keydown',onKey,true);
  }};
 return runtime;
}
