// Event edges use the assembled gate, never a timer that beeps near a station.
export function createRecordedSoundEvents(){
 let previous=null,phase=null,lastGate=-Infinity,lastSequence=0;
 return {reset(){previous=null;phase=null;lastGate=-Infinity;},update({position,gate,gateState,arrivalPhase,time,enabled=true,paused=false}){
  const events=[];
  if(!enabled||paused){previous=null;phase=arrivalPhase;lastSequence=gateState?.sequence??0;return events;}
  if(arrivalPhase!==phase){
   if(arrivalPhase==='closing')events.push('doors');
   phase=arrivalPhase;
  }
  if(gateState){if(gateState.sequence>lastSequence)events.push('gate');lastSequence=gateState.sequence;}
  if(!gateState&&previous&&gate&&time-lastGate>2){
   const distance=Math.hypot(...position.map((v,i)=>v-previous[i]));
   const dz=position[2]-previous[2],t=dz?(gate.center[2]-previous[2])/dz:-1;
   if(distance<5&&t>0&&t<=1){
    const x=previous[0]+(position[0]-previous[0])*t,y=previous[1]+(position[1]-previous[1])*t;
    if(Math.abs(x-gate.center[0])<gate.width/2&&Math.abs(y-gate.center[1]-1.7)<.7){events.push('gate');lastGate=time;}
   }
  }
  previous=[...position];return events;
 }};
}
