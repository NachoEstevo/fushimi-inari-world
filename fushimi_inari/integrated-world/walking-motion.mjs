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

// Horizontal velocity eases linearly toward the requested vector: walking speed
// is reached in 150 ms and a release stops in 110 ms. Integration is exact for
// the piecewise-linear ramp, so travelled distance does not depend on frame rate.
export const WALK_ACCELERATION_SECONDS=.15,WALK_STOP_SECONDS=.11;
export function createWalkingVelocity(){
  const state={x:0,z:0,dx:0,dz:0,reset(){state.x=state.z=state.dx=state.dz=0;},
    // Writes this frame's displacement to dx/dz and the eased velocity to x/z.
    update(targetX,targetZ,referenceSpeed,dt){
      const seconds=walkingFrameSeconds(dt),reference=Math.max(0,Number(referenceSpeed)||0);
      if(!Number.isFinite(targetX)||!Number.isFinite(targetZ)){targetX=0;targetZ=0;}
      const x0=state.x,z0=state.z,ex=targetX-x0,ez=targetZ-z0,gap=Math.hypot(ex,ez);
      const stopping=targetX===0&&targetZ===0,rate=reference/(stopping?WALK_STOP_SECONDS:WALK_ACCELERATION_SECONDS);
      if(!seconds){state.dx=state.dz=0;return state;}
      const reach=rate>0?gap/rate:Infinity;
      if(reach<=seconds){
        state.dx=(x0+targetX)/2*reach+targetX*(seconds-reach);state.dz=(z0+targetZ)/2*reach+targetZ*(seconds-reach);
        state.x=targetX;state.z=targetZ;
      }else{
        const f=rate*seconds/gap,x1=x0+ex*f,z1=z0+ez*f;
        state.dx=(x0+x1)/2*seconds;state.dz=(z0+z1)/2*seconds;state.x=x1;state.z=z1;
      }
      return state;
    },
    // After collision, keep only the part of the velocity the world accepted, so a
    // wall or a closed gate cannot store momentum that would push into it again.
    constrain(realizedX,realizedZ){
      const length=Math.hypot(realizedX,realizedZ);
      if(length<1e-6){state.x=state.z=0;return state;}
      const ux=realizedX/length,uz=realizedZ/length,along=state.x*ux+state.z*uz;
      if(!(along>0)){state.x=state.z=0;return state;}
      state.x=ux*along;state.z=uz*along;return state;
    }};
  return state;
}

// View-only head bob: one vertical dip per footfall and one lateral sway per
// stride. Amplitudes are peak values; the envelope ramps linearly so a stop,
// a disabled setting or reduced motion reaches exactly zero.
export const HEAD_BOB={vertical:.0095,lateral:.0055,sprint:1.3,rampSeconds:.25};
export function createHeadBob(){
  let phase=0,envelope=0,phaseError=0;
  const bob={vertical:0,lateral:0,reset(){phase=envelope=phaseError=0;bob.vertical=bob.lateral=0;},
    update({dt,speedFraction=0,boost=false,interval=.52,enabled=true,footstep=false}){
      const seconds=walkingFrameSeconds(dt);
      if(!enabled){bob.reset();return bob;}
      if(!seconds)return bob;
      const fraction=Math.max(0,Math.min(1,Number.isFinite(speedFraction)?speedFraction:0));
      const target=fraction*(boost?HEAD_BOB.sprint:1),step=seconds/HEAD_BOB.rampSeconds;
      envelope=envelope<target?Math.min(target,envelope+step):Math.max(target,envelope-step);
      phase+=Math.PI*fraction*seconds/Math.max(.2,interval);
      // Footfalls pull the lowest point toward the audible step without a pop.
      if(footstep)phaseError=phase-Math.round(phase/Math.PI)*Math.PI;
      const correction=phaseError*Math.min(1,seconds*6);phase-=correction;phaseError-=correction;
      if(phase>Math.PI*64)phase-=Math.PI*64;
      if(envelope<=0){bob.vertical=bob.lateral=0;return bob;}
      bob.vertical=-HEAD_BOB.vertical*envelope*Math.cos(2*phase);bob.lateral=HEAD_BOB.lateral*envelope*Math.sin(phase);
      return bob;
    }};
  return bob;
}
export function footstepInterval(pace='slow',boost=false){return boost?.38:pace==='fast'?.44:.52;}

export function createFootstepCadence(){
  let distance=0,elapsed=0;
  return {reset(){distance=0;elapsed=0;},update(travelled,dt,pace='slow',boost=false){
    const seconds=walkingFrameSeconds(dt);
    if(!seconds)return false;
    const interval=footstepInterval(pace,boost);
    elapsed=Math.min(interval,elapsed+seconds);
    if(!Number.isFinite(travelled)||travelled<=1e-7){distance=0;return false;}
    distance=Math.min(.75,distance+travelled);
    if(distance<.75-1e-9||elapsed<interval-1e-9)return false;
    distance=0;elapsed=0;return true;
  }};
}
