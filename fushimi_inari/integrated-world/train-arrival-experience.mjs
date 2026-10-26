import {createTrainArrivalSequence} from './train-arrival-sequence.mjs';

// Camera/walking adapter only: no scene construction, DOM, timers, or input hooks.
export function createTrainArrivalExperience({sequenceOptions,station,camera,controls,walker,
  onBegin=()=>{},onFallback=()=>false,onState=()=>{},allowDebugCamera=false}){
  let sequence=createTrainArrivalSequence(sequenceOptions),owned=false,externalPaused=false;
  let handoff=null,lastEmission=null,pendingSkip=false;
  const snapshot=()=>({...sequence.getSnapshot(),paused:owned&&externalPaused,handoff,skipPending:pendingSkip});
  function emit(){
    const state=snapshot(),key=`${state.phase}/${state.paused}/${state.handoff}/${state.skipPending}`;
    if(key!==lastEmission){lastEmission=key;onState(state);}
    return state;
  }
  function applyPose(pose){
    camera.position.set(...pose.position);camera.lookAt(...pose.target);
    controls.target?.set(...pose.target);
  }
  function applyStation(state){station.setTrainOffset(state.trainOffset);station.setDoorOpen(state.doorProgress);}
  function finish(state){
    if(!owned)return snapshot();
    // Release before teleport: walker.start may notify the surrounding UI.
    owned=false;externalPaused=false;pendingSkip=false;
    applyStation(state);applyPose(state.pose);walker.pause(false);
    const floor=state.pose.position.map((v,i)=>i===1?v-1.7:v);
    if(walker.teleport(floor,[...state.pose.target]))handoff='walking';
    else if(onFallback(state))handoff='fallback';
    else{walker.stop();handoff='unavailable';}
    controls.enabled=allowDebugCamera&&!walker.active;
    return emit();
  }
  return {
    get active(){return owned&&sequence.getSnapshot().active;},
    get snapshot(){return snapshot();},
    start({reducedMotion=false}={}){
      const durations={...sequenceOptions.durations};
      if(reducedMotion&&sequenceOptions.announcementLeadTime)durations.stopped=Math.max(durations.stopped??1,sequenceOptions.announcementLeadTime);
      const next=createTrainArrivalSequence({...sequenceOptions,durations,reducedMotion});
      onBegin();walker.stop();walker.pause(true);controls.enabled=false;
      sequence=next;owned=true;externalPaused=false;handoff=null;lastEmission=null;pendingSkip=false;
      const state=sequence.start();applyStation(state);applyPose(state.pose);
      return emit();
    },
    update(dt,{paused=false}={}){
      if(!owned)return snapshot();
      externalPaused=!!paused;controls.enabled=false;
      if(pendingSkip&&!externalPaused)return finish(sequence.skip());
      const state=sequence.update(dt,{paused:externalPaused});
      if(!externalPaused){
        if(!state.active)return finish(state);
        applyStation(state);applyPose(state.pose);
      }
      return emit();
    },
    skip({paused=false}={}){
      if(!owned)return snapshot();
      if(paused){pendingSkip=true;externalPaused=true;return emit();}
      return finish(sequence.skip());
    },
    cancel(){
      const wasOwned=owned;
      owned=false;externalPaused=false;handoff=null;pendingSkip=false;
      const state=sequence.cancel();applyStation(state);
      if(wasOwned){walker.pause(false);controls.enabled=allowDebugCamera&&!walker.active;}
      return emit();
    }
  };
}

// The welcome gesture releases camera ownership even if optional sound cannot
// initialize (for example, an unavailable AudioContext on a visiting browser).
export async function startTrainArrivalAfterWelcome({welcome,experience,reducedMotion=()=>false,onGesture=()=>{},onError=error=>console.warn('Arrival sound unavailable',error)}){
 const {gesture}=await welcome.ready();
 const state=experience.start({reducedMotion:reducedMotion()});
 if(gesture){try{await onGesture();}catch(error){onError(error);}}
 return state;
}
