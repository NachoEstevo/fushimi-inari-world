// Two paces shared by walking and free flight; Shift still boosts either one.
export const PACES={slow:{walk:5,fly:30},fast:{walk:8,fly:40}};
export function paceSpeed(pace,mode){return (PACES[pace]??PACES.slow)[mode==='fly'?'fly':'walk'];}
export function walkingSpeed(selected,boost=false){
  const value=Number(selected);
  return Math.max(1.6,Math.min(10,Number.isFinite(value)?value:3))*(boost?1.5:1);
}
// Each collision query advances less than the player radius even at fast speed.
export function movementSteps(dt,speed){
  const distance=walkingFrameSeconds(dt)*speed;
  const count=Math.max(1,Math.ceil(distance/.12));
  return {count,distance:distance/count};
}

const walkingFrameSeconds=dt=>Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;
export const WALKING_EYE_HEIGHT=1.7;

// Only the view follows the stairs gradually. Collision and support retain the
// exact tread height. Downhill lag stays inside the capsule's 15 cm head margin.
export function smoothWalkingEye(eyeY,supportY,dt){
  const target=supportY+WALKING_EYE_HEIGHT,seconds=walkingFrameSeconds(dt);
  if(!seconds)return eyeY;
  if(!Number.isFinite(eyeY)||Math.abs(target-eyeY)>.6)return target;
  const bounded=Math.max(target-.20,Math.min(target+.12,eyeY));
  return target+(bounded-target)*Math.exp(-18*seconds);
}

export function createFootstepCadence(){
  let distance=0,elapsed=0;
  return {reset(){distance=0;elapsed=0;},update(travelled,dt,pace='slow',boost=false){
    const seconds=walkingFrameSeconds(dt);
    if(!seconds)return false;
    const interval=boost?.38:pace==='fast'?.44:.52;
    elapsed=Math.min(interval,elapsed+seconds);
    if(!Number.isFinite(travelled)||travelled<=1e-7){distance=0;return false;}
    distance=Math.min(.75,distance+travelled);
    if(distance<.75-1e-9||elapsed<interval-1e-9)return false;
    distance=0;elapsed=0;return true;
  }};
}
