import * as THREE from 'three';

const MAX_DISTANCE=3.3,DRAG_THRESHOLD=8;
const primary=event=>event.button===0&&event.isPrimary!==false&&!event.ctrlKey&&!event.metaKey&&!event.altKey;
const visible=object=>{for(let node=object;node;node=node.parent)if(!node.visible)return false;return true;};
const claim=event=>{event.preventDefault();event.stopImmediatePropagation();};

// Capture only a gesture aimed at a physical control. The existing walk input
// keeps all other clicks and retains pointer-lock look while the pointer moves.
export function installVendingPointerInput({element,camera,machines,enabled=()=>true,onSelect=()=>{},onCollect=()=>{},onDrag=()=>{},onClaimUnlocked=()=>{},isOccluded=()=>false,document:doc=globalThis.document}){
 if(!element||!camera)return {dispose(){}};
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),inverse=new THREE.Matrix4();
 const localOrigin=new THREE.Vector3(),localDirection=new THREE.Vector3(),worldPoint=new THREE.Vector3();
 let gesture=null;

 function pick(event,locked){
  if(locked)pointer.set(0,0);
  else{
   const rect=element.getBoundingClientRect();
   if(!rect.width||!rect.height||event.clientX<rect.left||event.clientX>rect.left+rect.width||event.clientY<rect.top||event.clientY>rect.top+rect.height)return null;
   pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  }
  camera.updateWorldMatrix(true,false);raycaster.setFromCamera(pointer,camera);
  let best=null,bestDistance=MAX_DISTANCE;
  for(const machine of machines??[]){
   const group=machine?.group;if(!group||!visible(group))continue;
   group.updateWorldMatrix(true,false);if(Math.abs(group.matrixWorld.determinant())<1e-12)continue;
   inverse.copy(group.matrixWorld).invert();localOrigin.copy(raycaster.ray.origin).applyMatrix4(inverse);
   localDirection.copy(raycaster.ray.direction).transformDirection(inverse);
   if(localDirection.z>=-1e-9)continue; // Local +Z is the visitor-facing side.
   const targets=[...(machine.productButtons??[]),machine.collectionTarget].filter(Boolean);
   for(const target of targets){
    const p=target.position;if(!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)||!(target.width>0&&target.height>0))continue;
    const t=(p[2]-localOrigin.z)/localDirection.z;if(t<0)continue;
    const x=localOrigin.x+localDirection.x*t,y=localOrigin.y+localDirection.y*t;
    if(Math.abs(x-p[0])>target.width/2||Math.abs(y-p[1])>target.height/2)continue;
    worldPoint.set(x,y,p[2]).applyMatrix4(group.matrixWorld);
    const distance=worldPoint.distanceTo(raycaster.ray.origin);if(distance>bestDistance)continue;
    if(isOccluded(raycaster.ray.origin.clone(),worldPoint.clone(),machine))continue;
    best={machine,target};bestDistance=distance;
   }
  }
  return best;
 }

 function cancel(){
  const current=gesture;gesture=null;
  if(current&&element.hasPointerCapture?.(current.id))try{element.releasePointerCapture(current.id);}catch{}
 }
 function down(event){
  if(gesture||!primary(event)||!enabled())return;
  const locked=doc?.pointerLockElement===element,hit=pick(event,locked);if(!hit)return;
  if(!locked)onClaimUnlocked();
  gesture={...hit,id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,moved:0,dragging:false,locked};
  claim(event);try{element.setPointerCapture?.(event.pointerId);}catch{}
 }
 function move(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const g=gesture;
  if(g.locked){g.moved+=Math.hypot(event.movementX||0,event.movementY||0);return;}
  claim(event);if(!enabled()){cancel();return;}
  g.moved=Math.max(g.moved,Math.hypot(event.clientX-g.x,event.clientY-g.y));
  if(g.moved>DRAG_THRESHOLD){
   const dx=event.clientX-(g.dragging?g.lastX:g.x),dy=event.clientY-(g.dragging?g.lastY:g.y);
   g.dragging=true;onDrag(dx,dy);
  }
  g.lastX=event.clientX;g.lastY=event.clientY;
 }
 function up(event){
  const current=gesture;if(!current||event.pointerId!==current.id)return;
  cancel();claim(event);
  if(!current.locked)current.moved=Math.max(current.moved,Math.hypot(event.clientX-current.x,event.clientY-current.y));
  if(!primary(event)||current.moved>DRAG_THRESHOLD||!enabled()||(doc?.pointerLockElement===element)!==current.locked)return;
  const hit=pick(event,current.locked);if(!hit||hit.machine!==current.machine||hit.target!==current.target)return;
  if(hit.target===hit.machine.collectionTarget)onCollect(hit.machine);else onSelect(hit.machine,hit.target.productId);
 }
 const cancelPointer=event=>{if(gesture&&event.pointerId===gesture.id)cancel();};
 doc?.defaultView?.addEventListener('blur',cancel);doc?.addEventListener?.('pointerlockchange',cancel);
 element.addEventListener('lostpointercapture',cancelPointer,true);element.addEventListener('pointercancel',cancelPointer,true);
 element.addEventListener('pointerdown',down,true);element.addEventListener('pointermove',move,true);element.addEventListener('pointerup',up,true);
 return {dispose(){cancel();doc?.defaultView?.removeEventListener('blur',cancel);doc?.removeEventListener?.('pointerlockchange',cancel);
  element.removeEventListener('lostpointercapture',cancelPointer,true);element.removeEventListener('pointercancel',cancelPointer,true);
  element.removeEventListener('pointerdown',down,true);element.removeEventListener('pointermove',move,true);element.removeEventListener('pointerup',up,true);}};
}
