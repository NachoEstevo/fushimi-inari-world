import {installPointerLook} from './pointer-look.mjs';
import {flightDisplacement} from './flight-motion.mjs';
import {createProximityInteractions,interactionInputBlocked} from './proximity-interaction.mjs?v=counter-reach-3';
import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {walkingSpeed,movementSteps,paceSpeed,WALKING_EYE_HEIGHT,smoothWalkingEye,createFootstepCadence,createWalkingVelocity,createHeadBob,footstepInterval} from './walking-motion.mjs?v=walk-feel-1';
import {auditSectorConnections} from './sector-audit.mjs';
import {createWalkSettings,lookAngles} from './walk-settings.mjs';
import {createGamepadInput,GAMEPAD_LOOK_RADIANS} from './gamepad-input.mjs';

export function installWalking({camera,renderer,controls,ground,assembly,audio,onStart,onInteraction=()=>{},canMove=()=>true,resolveMove,allowDebugCamera=false,settings=createWalkSettings(),gamepad=createGamepadInput()}){
  const obstacles=new SpatialCollisionWorld(4);
  for(const c of assembly.colliders)obstacles[c.type==='box'?'addBox':'addCylinder'](...c.args);
  // Route audits are QA output only (no runtime reader), so normal startup skips them.
  if(new URLSearchParams(location.search).has('audit'))runRouteAudits({assembly,ground,obstacles});
  const keys=new Set(),direction=new THREE.Vector3(),right=new THREE.Vector3();
  const panel=document.getElementById('interaction');
  const proximity=createProximityInteractions({targets:assembly.legacy?.interactables??[],camera});
  const hint=document.createElement('div');hint.id='interaction-hint';hint.hidden=true;hint.setAttribute('role','status');
  const hintKey=document.createElement('kbd'),hintText=document.createElement('span');hintKey.textContent='E';hint.append(hintKey,hintText);document.body.append(hint);
  const feedback=document.createElement('div');feedback.id='interaction-feedback';feedback.hidden=true;feedback.setAttribute('role','status');document.body.append(feedback);
  let feedbackUntil=0;
  const interactionParams=new URLSearchParams(location.search),interactionAudit=interactionParams.has('audit')||interactionParams.has('textureAudit');let lastInteractionAudit=0;
  const inputBlocked=(target,interaction=true)=>interactionInputBlocked({active,paused,flying:interaction&&flying,body:document.body,document,target});
  function updateInteraction(){
    const blocked=inputBlocked(document.activeElement),target=blocked?null:proximity.find(),data=target?.userData.interactable;
    hint.hidden=!target;
    const hintClass=target?.userData.fieldNote?'field-note-hint':'';if(hint.className!==hintClass)hint.className=hintClass;
    if(data){const prompt=data.prompt??data.actions?.[0]?.label??'Interact';if(hintText.textContent!==prompt)hintText.textContent=prompt;}
    feedback.hidden=blocked||performance.now()>feedbackUntil;
    if(interactionAudit&&performance.now()-lastInteractionAudit>500){lastInteractionAudit=performance.now();document.body.dataset.nearbyInteraction=JSON.stringify({active,paused,flying,blocked,focus:document.activeElement?.tagName,target:target?.name,candidates:proximity.inspect()});}
  }
  const crosshair=document.getElementById('crosshair'),button=document.getElementById('freewalk');
  const footsteps=createFootstepCadence(),moveFrom=[0,0,0],moveTo=[0,0,0];
  // Eased horizontal velocity and a view-only bob. `view` is the offset currently
  // added to camera.position; it is removed before any physics and on every
  // pause, stop, start or teleport so other camera owners never inherit it.
  const velocity=createWalkingVelocity(),bob=createHeadBob(),view={x:0,y:0,z:0},angles={yaw:0,pitch:0};
  let reducedMotion=null;try{reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')??null;}catch{}
  let active=false,paused=false,flying=false,pace='slow',supportY=0,menuHandler=null,cancelInteraction=null;
  function removeView(){camera.position.x-=view.x;camera.position.y-=view.y;camera.position.z-=view.z;view.x=view.y=view.z=0;}
  function settle(){removeView();bob.reset();velocity.reset();footsteps.reset();gamepad.reset();}
  function stop(){
    cancelInteraction?.();
    settle();
    hint.hidden=true;feedback.hidden=true;active=false;flying=false;keys.clear();pointerLook.release();controls.enabled=allowDebugCamera;crosshair.hidden=true;
    controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8));
    document.body.classList.remove('walking');button.textContent='Walk · WASD';
  }
  function start(flight=false){
    cancelInteraction?.();
    document.activeElement?.blur();settle();
    onStart();active=true;flying=flight&&allowDebugCamera;keys.clear();controls.enabled=false;crosshair.hidden=false;
    if(!flying){supportY=assembly.walkHeight(camera.position.x,camera.position.z);camera.position.y=supportY+WALKING_EYE_HEIGHT;}
    document.body.classList.add('walking');button.textContent=allowDebugCamera?'Orbit view':'Walk · WASD';
  }
  button.onclick=()=>{if(active&&allowDebugCamera)stop();else start();};
  const euler=new THREE.Euler(0,0,0,'YXZ');
  function rotateView(yaw,pitch){
    euler.setFromQuaternion(camera.quaternion);euler.y-=yaw;
    euler.x=THREE.MathUtils.clamp(euler.x-pitch,-1.45,1.45);
    camera.quaternion.setFromEuler(euler);
  }
  const pointerLook=installPointerLook({element:renderer.domElement,document,
    enabled:()=>active&&!paused,
    onRelease:()=>{keys.clear();footsteps.reset();},
    look:(dx,dy)=>{lookAngles(dx,dy,settings,angles);rotateView(angles.yaw,angles.pitch);}});
  function interact(){
    const result=proximity.run();if(!result)return;
    onInteraction(result.object,result.event);
    panel.hidden=true;feedback.textContent=result.message;feedbackUntil=result.message?performance.now()+2600:0;feedback.hidden=!result.message;
    updateInteraction();
  }
  addEventListener('keydown',e=>{if(e.code==='Escape'&&!e.repeat)cancelInteraction?.();},true);
  addEventListener('keydown',e=>{
    if(inputBlocked(e.target,e.code==='KeyE'))return;
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyR','KeyF','Space','ControlLeft','ControlRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}
  });
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{keys.clear();footsteps.reset();pointerLook.release();});
  // Gamepad: polled from update() only while walking is active and unpaused.
  function pollGamepad(dt){
    if(!gamepad.connected)return null;
    const pad=gamepad.poll();if(!pad.connected)return null;
    if(pad.menu&&menuHandler){menuHandler();return null;}
    const canceled=pad.back&&cancelInteraction?.();
    if(!canceled&&pad.interact&&!inputBlocked(null,true))interact();
    const seconds=Math.max(0,Math.min(Number(dt)||0,.1)),scale=GAMEPAD_LOOK_RADIANS*settings.sensitivity*seconds;
    if(pad.lookX||pad.lookY)rotateView(pad.lookX*scale,pad.lookY*scale*(settings.invertY?-1:1));
    return pad;
  }
  return {stop,start,settings,gamepad,setMenuHandler(fn){menuHandler=typeof fn==='function'?fn:null;},
    setCancelInteraction(fn){cancelInteraction=typeof fn==='function'?fn:null;},
    interact:()=>{if(!inputBlocked(null,true))interact();},get pointerLooking(){return pointerLook.engaged;},releasePointerLock:()=>pointerLook.release(),fly:()=>start(true),get mode(){return active?(flying?'fly':'walk'):'orbit';},get pace(){return pace;},setPace(value){pace=value==='fast'?'fast':'slow';},
    get viewOffset(){return {x:view.x,y:view.y,z:view.z};},
    pause(value){paused=value;keys.clear();settle();if(value){cancelInteraction?.();pointerLook.release();hint.hidden=true;feedback.hidden=true;}},get active(){return active;},get paused(){return paused;},teleport(point,target){
    cancelInteraction?.();
    keys.clear();settle();pointerLook.release();panel.hidden=true;
    const candidates=[];
    for(let r=0;r<=2;r+=.25)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
      const x=point[0]+Math.cos(angle)*r,z=point[2]+Math.sin(angle)*r;
      if(!(assembly.isWalkable?.(x,z)??assembly.surfaces.sample(x,z)))continue;
      const y=assembly.walkHeight(x,z)+1.7,resolved=obstacles.resolvePlayer(x,y,z);
      if(Math.hypot(resolved.x-x,resolved.z-z)<.05&&(!resolveMove||resolveMove([x,y,z],[x,y,z],.28)))candidates.push([x,y,z]);
    }
    if(!candidates.length)return false;
    camera.position.set(...candidates[0]);camera.lookAt(target[0],candidates[0][1],target[2]);
    start();return true;
  },update(dt){
    updateInteraction();
    if(!active)return false;
    if(paused)return true;
    removeView();
    const pad=pollGamepad(dt);
    if(!active||paused)return true;
    if(flying){
      velocity.reset();bob.reset();
      camera.getWorldDirection(direction);right.crossVectors(direction,camera.up).normalize();
      const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const vertical=Number(keys.has('KeyR')||keys.has('Space'))-Number(keys.has('KeyF')||keys.has('ControlLeft')||keys.has('ControlRight'));
      const delta=flightDisplacement(direction.toArray(),forward,side,vertical,dt,paceSpeed(pace,'fly'),keys.has('ShiftLeft')||keys.has('ShiftRight'));
      camera.position.x+=delta[0];camera.position.y+=delta[1];camera.position.z+=delta[2];
      return true;
    }
    camera.getWorldDirection(direction);direction.y=0;direction.normalize();right.crossVectors(direction,camera.up).normalize();
    let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    let side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    const keyLength=Math.hypot(forward,side);if(keyLength>1){forward/=keyLength;side/=keyLength;}
    // The stronger of keyboard and left stick wins; analog deflection scales speed.
    if(pad&&Math.hypot(pad.moveX,pad.moveY)>Math.hypot(forward,side)){forward=-pad.moveY;side=pad.moveX;}
    const boost=keys.has('ShiftLeft')||keys.has('ShiftRight')||!!pad?.sprint;
    const speed=walkingSpeed(paceSpeed(pace,'walk'),boost);
    velocity.update((direction.x*forward+right.x*side)*speed,(direction.z*forward+right.z*side)*speed,speed,dt);
    let travelled=0;
    const seconds=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0,intendedX=velocity.dx,intendedZ=velocity.dz,distance=Math.hypot(intendedX,intendedZ);
    if(distance>1e-9){
      const startX=camera.position.x,startZ=camera.position.z,ux=intendedX/distance,uz=intendedZ/distance;
      // Sub-steps stay below the player radius whatever the eased speed is.
      const step=movementSteps(dt,seconds>0?distance/seconds:0);
      for(let i=0;i<step.count;i++){
        const x=camera.position.x+ux*step.distance,z=camera.position.z+uz*step.distance;
        const physicalEye=supportY+WALKING_EYE_HEIGHT,resolved=obstacles.resolvePlayer(x,physicalEye,z);
        moveFrom[0]=camera.position.x;moveFrom[1]=physicalEye;moveFrom[2]=camera.position.z;
        moveTo[0]=resolved.x;moveTo[1]=physicalEye;moveTo[2]=resolved.z;
        if(resolveMove){
          const accepted=resolveMove(moveFrom,moveTo,.28);
          if(!accepted)break;
          moveTo[0]=accepted[0];moveTo[2]=accepted[2];
          const checked=obstacles.resolvePlayer(moveTo[0],physicalEye,moveTo[2]);
          if(Math.hypot(checked.x-moveTo[0],checked.z-moveTo[2])>.001)break;
          resolved.x=moveTo[0];resolved.z=moveTo[2];
        }
        if(!canMove(moveFrom,moveTo))break;
        travelled+=Math.hypot(resolved.x-camera.position.x,resolved.z-camera.position.z);
        supportY=assembly.walkHeight(resolved.x,resolved.z,supportY);
        camera.position.x=resolved.x;camera.position.z=resolved.z;
      }
      const realizedX=camera.position.x-startX,realizedZ=camera.position.z-startZ;
      if(Math.hypot(realizedX-intendedX,realizedZ-intendedZ)>1e-6)velocity.constrain(realizedX,realizedZ);
    }
    camera.position.y=smoothWalkingEye(camera.position.y,supportY,dt);
    const footstep=footsteps.update(travelled,dt,pace,boost);
    if(footstep){
      const segment=assembly.surfaces.sample(camera.position.x,camera.position.z)?.segment;
      audio.step(segment?.kind==='stone'||segment?.stair===true);
    }
    bob.update({dt,speedFraction:seconds>0?travelled/seconds/speed:0,boost,interval:footstepInterval(pace,boost),footstep,enabled:settings.headBob&&!reducedMotion?.matches});
    view.x=right.x*bob.lateral;view.z=right.z*bob.lateral;view.y=bob.vertical;
    camera.position.x+=view.x;camera.position.y+=view.y;camera.position.z+=view.z;
    return true;
  }};
}

function runRouteAudits({assembly,ground,obstacles}){
  const audit={samples:0,blocked:0,maxCorrection:0,examples:[]};
  const heightAudit={samples:0,maxJump:0,jumps:[]};
  for(const route of [assembly.spatial.main,assembly.spatial.returning]){
    let previous=null;
    for(let i=1;i<route.length;i++){
      const a=route[i-1],b=route[i],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.25));
      for(let j=0;j<count;j++){
        const f=j/count,x=a[0]+(b[0]-a[0])*f,z=a[2]+(b[2]-a[2])*f,y=assembly.walkHeight(x,z,previous?.y);
        if(previous){const jump=Math.abs(y-previous.y);heightAudit.maxJump=Math.max(heightAudit.maxJump,jump);
          if(jump>.4&&heightAudit.jumps.length<20)heightAudit.jumps.push({x,z,jump,y,previous:previous.y,base:assembly.surfaces.height(x,z),path:assembly.surfaces.sample(x,z)?.segment.id});}
        previous={y};heightAudit.samples++;
      }
    }
  }
  document.body.dataset.walkHeightAudit=JSON.stringify(heightAudit);
  document.body.dataset.sectorAudit=JSON.stringify(auditSectorConnections(assembly.spatial,assembly.walkHeight,obstacles));
  const profiles=[];
  for(const review of assembly.surfaces.stats.profileReview){
    const segments=assembly.surfaces.segments.filter(s=>s.id===review.id);
    const points=segments.flatMap(s=>{
      const count=Math.max(1,Math.ceil(Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2])/.25));
      return Array.from({length:count},(_,i)=>[s.a[0]+(s.b[0]-s.a[0])*i/count,s.a[2]+(s.b[2]-s.a[2])*i/count]);
    });
    if(segments.length)points.push([segments.at(-1).b[0],segments.at(-1).b[2]]);
    let maxJump=0,blocked=0;
    for(const route of [points,[...points].reverse()]){
      let previous;
      for(const [x,z] of route){const y=assembly.walkHeight(x,z,previous);if(previous!==undefined)maxJump=Math.max(maxJump,Math.abs(y-previous));previous=y;
        const resolved=obstacles.resolvePlayer(x,y+1.7,z);if(Math.hypot(resolved.x-x,resolved.z-z)>.35)blocked++;
      }
    }
    profiles.push({id:review.id,samples:points.length*2,maxJump,blocked,status:maxJump>.4||blocked?'inspect-access':'centerline-check-passed; fidelity-unverified'});
  }
  document.body.dataset.profileWalkAudit=JSON.stringify(profiles);
  const localBranches=assembly.surfaces.segments.filter(s=>s.kind!=='restricted'&&s.a[0]>735&&s.a[0]<840&&s.a[2]>-280&&s.a[2]<-170)
    .map(s=>[(s.a[0]+s.b[0])/2,(s.ya+s.yb)/2,(s.a[2]+s.b[2])/2]);
  audit.localBranchSamples=localBranches.length;
  for(const p of [...assembly.spatial.main,...assembly.spatial.returning,...localBranches]){
    const resolved=obstacles.resolvePlayer(p[0],assembly.surfaces.height(p[0],p[2])+1.7,p[2]);
    const correction=Math.hypot(resolved.x-p[0],resolved.z-p[2]);
    audit.samples++;
    if(correction>.35){
      audit.blocked++;
      const tags=assembly.colliders.filter(c=>{
        const a=c.args,foot=ground(p[0],p[2])+.15,head=foot+1.7,mi=c.type==='box'?5:3;
        if(head<a[mi]||foot>a[mi+1])return false;
        const dx=p[0]-a[0],dz=p[2]-a[1];
        if(c.type==='cylinder')return Math.hypot(dx,dz)<a[2]+.28;
        const x=dx*Math.cos(a[4])-dz*Math.sin(a[4]),z=dx*Math.sin(a[4])+dz*Math.cos(a[4]);
        return Math.hypot(x-THREE.MathUtils.clamp(x,-a[2],a[2]),z-THREE.MathUtils.clamp(z,-a[3],a[3]))<.28;
      }).map(c=>c.args.at(-1));
      if(audit.examples.length<40)audit.examples.push({point:p,tags});
    }
    audit.maxCorrection=Math.max(audit.maxCorrection,correction);
  }
  document.body.dataset.collisionAudit=JSON.stringify(audit);
  document.body.dataset.peakColliders=JSON.stringify(assembly.colliders.filter(c=>c.args.at(-1)==='peak_sanctuary'));
}
