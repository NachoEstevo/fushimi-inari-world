import {flightDisplacement} from './flight-motion.mjs';
import {englishInteraction} from './interaction-english.mjs';
import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';
import {walkingSpeed,movementSteps} from './walking-motion.mjs';
import {auditSectorConnections} from './sector-audit.mjs';

export function installWalking({camera,renderer,controls,ground,assembly,audio,onStart}){
  const obstacles=new SpatialCollisionWorld(4);
  for(const c of assembly.colliders)obstacles[c.type==='box'?'addBox':'addCylinder'](...c.args);
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
  // Opt-in QA only: no additional per-frame or normal-startup cost.
  if(new URLSearchParams(location.search).has('audit')){
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
  }

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
  const keys=new Set(),direction=new THREE.Vector3(),right=new THREE.Vector3();
  const ray=new THREE.Raycaster(),panel=document.getElementById('interaction');
  const crosshair=document.getElementById('crosshair'),button=document.getElementById('freewalk');
  let active=false,footstep=0,paused=false,flying=false;
  function stop(){
    active=false;flying=false;keys.clear();dragging=false;controls.enabled=true;crosshair.hidden=true;
    controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8));
    document.body.classList.remove('walking');button.textContent='Walk · WASD';
  }
  function start(flight=false){
    document.activeElement?.blur();
    onStart();active=true;flying=flight;keys.clear();controls.enabled=false;crosshair.hidden=false;
    if(!flying)camera.position.y=assembly.walkHeight(camera.position.x,camera.position.z)+1.7;
    document.body.classList.add('walking');button.textContent='Orbit view';
  }
  button.onclick=()=>{if(active)stop();else start();};
  let dragging=false,lastX=0,lastY=0;
  const euler=new THREE.Euler(0,0,0,'YXZ');
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(!active||paused)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener('pointerup',()=>dragging=false);
  renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!active||paused||!dragging)return;
    euler.setFromQuaternion(camera.quaternion);euler.y-=(e.clientX-lastX)*.003;
    euler.x=THREE.MathUtils.clamp(euler.x-(e.clientY-lastY)*.003,-1.45,1.45);
    camera.quaternion.setFromEuler(euler);lastX=e.clientX;lastY=e.clientY;
  });
  function interact(){
    ray.setFromCamera(new THREE.Vector2(),camera);ray.far=7;
    const hit=ray.intersectObjects(assembly.legacy.interactables,true)[0];
    if(!hit)return;
    let target=hit.object;
    while(target&&!target.userData.interactable)target=target.parent;
    const data=target?.userData.interactable;
    if(!data)return;
    const english=data.language==='en'?data:englishInteraction(data);
    panel.replaceChildren();
    const title=document.createElement('strong');title.textContent=english.title;
    const text=document.createElement('p');text.textContent=english.description;
    const note=document.createElement('small');note.textContent=data.note??'Preserved from the original project; historical accuracy is not verified.';
    const close=document.createElement('button');close.textContent='Close';close.onclick=()=>panel.hidden=true;
    panel.append(title,text,note);
    for(const action of data.actions??[]){
      const actionButton=document.createElement('button');actionButton.textContent=action.label;
      actionButton.onclick=()=>{
        target.getWorldPosition(direction);
        if(camera.position.distanceTo(direction)>7){text.textContent='Move closer to interact.';return;}
        text.textContent=action.run();
      };panel.append(actionButton);
    }
    panel.append(close);panel.hidden=false;
    data.onTrigger?.();
  }
  addEventListener('keydown',e=>{
    if(!active||paused)return;
    if(e.target.closest?.('input,select,textarea'))return;
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyR','KeyF','Space','ControlLeft','ControlRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}
    if(e.code==='KeyE'&&!flying&&!e.repeat)interact();
  });
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{keys.clear();if(active)stop();});
  return {stop,start,fly:()=>start(true),get mode(){return active?(flying?'fly':'walk'):'orbit';},pause(value){paused=value;keys.clear();dragging=false;},get active(){return active;},teleport(point,target){
    keys.clear();dragging=false;panel.hidden=true;
    const candidates=[];
    for(let r=0;r<=2;r+=.25)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
      const x=point[0]+Math.cos(angle)*r,z=point[2]+Math.sin(angle)*r;
      if(!assembly.surfaces.sample(x,z))continue;
      const y=assembly.walkHeight(x,z)+1.7,resolved=obstacles.resolvePlayer(x,y,z);
      if(Math.hypot(resolved.x-x,resolved.z-z)<.05)candidates.push([x,y,z]);
    }
    if(!candidates.length)return false;
    camera.position.set(...candidates[0]);camera.lookAt(target[0],candidates[0][1],target[2]);
    start();return true;
  },update(dt){
    if(!active)return false;
    if(paused)return true;
    if(flying){
      camera.getWorldDirection(direction);right.crossVectors(direction,camera.up).normalize();
      const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const vertical=Number(keys.has('KeyR')||keys.has('Space'))-Number(keys.has('KeyF')||keys.has('ControlLeft')||keys.has('ControlRight'));
      const delta=flightDisplacement(direction.toArray(),forward,side,vertical,dt,document.getElementById('flight-speed')?.value??15,keys.has('ShiftLeft')||keys.has('ShiftRight'));
      camera.position.x+=delta[0];camera.position.y+=delta[1];camera.position.z+=delta[2];
      return true;
    }
    camera.getWorldDirection(direction);direction.y=0;direction.normalize();right.crossVectors(direction,camera.up).normalize();
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    if(forward||side){
      const velocity=direction.multiplyScalar(forward).addScaledVector(right,side).normalize();
      const speed=walkingSpeed(document.getElementById('walk-speed')?.value??3,keys.has('ShiftLeft')||keys.has('ShiftRight'));
      const step=movementSteps(dt,speed);
      for(let i=0;i<step.count;i++){
        const x=camera.position.x+velocity.x*step.distance,z=camera.position.z+velocity.z*step.distance;
        const resolved=obstacles.resolvePlayer(x,camera.position.y,z);
        camera.position.set(resolved.x,assembly.walkHeight(resolved.x,resolved.z,camera.position.y-1.7)+1.7,resolved.z);
      }
      footstep+=step.distance*step.count;if(footstep>.7){
        audio.step(assembly.surfaces.sample(camera.position.x,camera.position.z)?.segment.kind==='stone');footstep=0;
      }
    }
    document.getElementById('position').textContent=`${(camera.position.y-1.7).toFixed(1)} m ASL · WASD · drag to look · Shift boost · E interact · Esc menu`;
    return true;
  }};
}
