// Pure arrival timeline. World-space eye poses belong to the station layout.
export const TRAIN_ARRIVAL_PHASE_LABELS=Object.freeze({
  idle:'Ready to arrive',moving:'Arriving at Inari Station',decelerating:'Slowing down',
  stopped:'Train stopped',opening:'Doors opening',disembarking:'Stepping onto the platform',
  closing:'Doors closing',complete:'Welcome to Inari',cancelled:'Arrival cancelled'
});
export const TRAIN_ARRIVAL_DURATIONS=Object.freeze({
  moving:3,decelerating:4,stopped:1,opening:1.8,disembarking:3.4,closing:1.8
});
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>value*value*(3-2*value);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const copyPose=pose=>({position:[...pose.position],target:[...pose.target]});
function vector(value,label){
  if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))
    throw new TypeError(`${label} must contain three finite world coordinates`);
  return [...value];
}
function readPose(value,label){
  const pose={position:vector(value?.position,`${label}.position`),target:vector(value?.target,`${label}.target`)};
  if(Math.hypot(...pose.position.map((v,i)=>v-pose.target[i]))<1e-6)
    throw new TypeError(`${label} must look toward a distinct target`);
  return pose;
}

/**
 * update accepts seconds, capped at 0.1 so a restored tab cannot jump forward.
 * Pause time is discarded, never queued. The adapter owns menu/photo/visibility
 * pause, applying the returned camera pose, and the final walking handoff.
 * cancel relinquishes the camera (pose=null) before a teleport. skip/reset
 * instead return the safe platform pose with closed doors, including from idle.
 */
export function createTrainArrivalSequence({interiorPose,platformPose,travelDirection,
  travelDistance=24,reducedMotion=false,durations={}}={}){
  const interior=readPose(interiorPose,'interiorPose'),platform=readPose(platformPose,'platformPose');
  const direction=vector(travelDirection,'travelDirection'),length=Math.hypot(...direction);
  if(length<1e-6)throw new TypeError('travelDirection must have a direction');
  if(!Number.isFinite(travelDistance)||travelDistance<0)throw new TypeError('travelDistance must be finite and nonnegative');
  const axis=direction.map(v=>v/length),timing={...TRAIN_ARRIVAL_DURATIONS};
  for(const phase of Object.keys(timing)){
    if(durations[phase]!==undefined){
      if(!Number.isFinite(durations[phase])||durations[phase]<=0)
        throw new TypeError(`durations.${phase} must be finite and positive`);
      timing[phase]=durations[phase];
    }
  }
  const phases=Object.keys(timing).filter(phase=>!reducedMotion||!['moving','decelerating'].includes(phase));
  const totalDuration=phases.reduce((total,phase)=>total+timing[phase],0);
  if(!Number.isFinite(totalDuration))throw new TypeError('total arrival duration must be finite');
  // Constant approach speed joins a quadratic brake with matching velocity.
  const brakingDistance=travelDistance*(timing.decelerating/2)/(timing.moving+timing.decelerating/2);
  let phase='idle',elapsed=0,paused=false,revision=0;
  const active=()=>phases.includes(phase);

  function snapshot(){
    let start=0;
    for(const item of phases){if(item===phase)break;start+=timing[item];}
    const fraction=active()?clamp((elapsed-start)/timing[phase]):phase==='complete'?1:0;
    let distance=0;
    if(phase==='moving')distance=travelDistance+(brakingDistance-travelDistance)*fraction;
    if(phase==='decelerating')distance=brakingDistance*(1-fraction)**2;
    const trainOffset=axis.map(v=>v&&distance?-v*distance:0);
    let pose=null;
    if(active()){
      if(phase==='closing'||phase==='disembarking'&&reducedMotion)pose=copyPose(platform);
      else if(phase==='disembarking'){
        const t=smooth(fraction);
        pose={position:mix(interior.position,platform.position,t),target:mix(interior.target,platform.target,t)};
      }else{
        pose=copyPose(interior);
        pose.position=pose.position.map((v,i)=>v+trainOffset[i]);
        pose.target=pose.target.map((v,i)=>v+trainOffset[i]);
      }
    }else if(phase==='complete')pose=copyPose(platform);
    const doorProgress=phase==='opening'?smooth(fraction):phase==='disembarking'?1:phase==='closing'?1-smooth(fraction):0;
    return {phase,phaseLabel:TRAIN_ARRIVAL_PHASE_LABELS[phase],active:active(),paused,
      elapsed,time:elapsed,totalDuration,progress:clamp(elapsed/totalDuration),phaseProgress:fraction,
      revision,pose,trainOffset,doorProgress,controlsEnabled:!active(),reducedMotion:!!reducedMotion,
      prompt:active()?'Arrival in progress · Skip arrival to explore now':phase==='complete'?'WASD to explore · Drag to look · Esc for menu':''};
  }
  function replay(){phase=phases[0];elapsed=0;paused=false;revision++;return snapshot();}
  function skip(){
    if(phase!=='complete'||paused){phase='complete';elapsed=totalDuration;paused=false;revision++;}
    return snapshot();
  }
  return {
    getSnapshot:snapshot,
    start(){return active()?snapshot():replay();},
    replay,
    update(dt,{paused:externalPause=false}={}){
      if(!active()||paused||externalPause||!Number.isFinite(dt)||dt<=0)return snapshot();
      elapsed=Math.min(totalDuration,elapsed+Math.min(.1,dt));
      let boundary=0;
      phase='complete';
      for(const item of phases){boundary+=timing[item];if(elapsed<boundary-1e-9){phase=item;break;}}
      // Snap the terminal time for an exact and stable handoff.
      if(phase==='complete')elapsed=totalDuration;
      revision++;return snapshot();
    },
    pause(){if(active()&&!paused){paused=true;revision++;}return snapshot();},
    resume(){if(paused){paused=false;revision++;}return snapshot();},
    skip,
    reset:skip,
    cancel(){if(phase!=='cancelled'||paused){phase='cancelled';paused=false;revision++;}return snapshot();}
  };
}
