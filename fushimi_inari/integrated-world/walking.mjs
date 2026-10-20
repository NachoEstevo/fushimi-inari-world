import * as THREE from 'three';
import {SpatialCollisionWorld} from './collision.mjs';

export function installWalking({camera,renderer,controls,ground,assembly,audio,onStart}){
  const obstacles=new SpatialCollisionWorld(4);
  for(const c of assembly.colliders)obstacles[c.type==='box'?'addBox':'addCylinder'](...c.args);
  const audit={samples:0,blocked:0,maxCorrection:0,examples:[]};
  for(const p of [...assembly.spatial.main,...assembly.spatial.returning]){
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
  let active=false,footstep=0;
  function stop(){
    active=false;keys.clear();controls.enabled=true;crosshair.hidden=true;
    controls.target.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(8));
    document.body.classList.remove('walking');button.textContent='Caminar · WASD';
  }
  button.onclick=()=>{
    if(active){stop();return;}
    onStart();active=true;controls.enabled=false;crosshair.hidden=false;
    camera.position.y=assembly.walkHeight(camera.position.x,camera.position.z)+1.7;
    document.body.classList.add('walking');button.textContent='Salir · Esc';
  };
  let dragging=false,lastX=0,lastY=0;
  const euler=new THREE.Euler(0,0,0,'YXZ');
  renderer.domElement.addEventListener('pointerdown',e=>{
    if(!active)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener('pointerup',()=>dragging=false);
  renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!active||!dragging)return;
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
    panel.replaceChildren();
    const title=document.createElement('strong');title.textContent=data.title;
    const text=document.createElement('p');text.textContent=data.description;
    const note=document.createElement('small');note.textContent='Descripción heredada del proyecto original; fidelidad histórica no verificada en esta integración.';
    const close=document.createElement('button');close.textContent='Cerrar';close.onclick=()=>panel.hidden=true;
    panel.append(title,text,note,close);panel.hidden=false;
    data.onTrigger?.();
  }
  addEventListener('keydown',e=>{
    if(!active)return;
    if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}
    if(e.code==='KeyE')interact();
    if(e.code==='Escape')stop();
  });
  addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>{keys.clear();if(active)stop();});
  return {stop,update(dt){
    if(!active)return false;
    camera.getWorldDirection(direction);direction.y=0;direction.normalize();right.crossVectors(direction,camera.up).normalize();
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
    const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    if(forward||side){
      const velocity=direction.multiplyScalar(forward).addScaledVector(right,side).normalize();
      const distance=Math.min(dt,.05)*(keys.has('ShiftLeft')?5:1.6);
      const x=camera.position.x+velocity.x*distance,z=camera.position.z+velocity.z*distance;
      const resolved=obstacles.resolvePlayer(x,camera.position.y,z);
      camera.position.set(resolved.x,assembly.walkHeight(resolved.x,resolved.z,camera.position.y-1.7)+1.7,resolved.z);
      footstep+=distance;if(footstep>.7){audio.step(true);footstep=0;}
    }
    document.getElementById('position').textContent=`${(camera.position.y-1.7).toFixed(1)} m s.n.m. · WASD · arrastrar para mirar · Shift correr · E interactuar · Esc salir`;
    return true;
  }};
}
