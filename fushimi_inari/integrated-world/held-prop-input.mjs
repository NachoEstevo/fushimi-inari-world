import * as THREE from 'three';

// Only the canvas owns this gesture. Clicking menus or dragging the view must
// never finish a bite; ray tests happen on pointer down, never in the frame loop.
export function installHeldPropInput({element,camera,getItem,enabled=()=>true,onDrag=()=>{},onClaimUnlocked=()=>{},document:doc=globalThis.document}){
 if(!element)return {dispose(){}};
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),hits=[];let gesture=null;
 const primary=e=>e.button===0&&e.isPrimary!==false&&!e.ctrlKey&&!e.metaKey&&!e.altKey;
 const claim=e=>{e.preventDefault();e.stopImmediatePropagation();};
 function down(event){
  gesture=null;if(!primary(event)||!enabled())return;
  const item=getItem();if(!item?.group?.visible||item.canConsume?.()===false)return;
  const locked=doc?.pointerLockElement===element;
  if(!locked){
   const rect=element.getBoundingClientRect();if(!rect.width||!rect.height)return;
   pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
   camera.updateWorldMatrix(true,false);item.group.updateWorldMatrix(true,true);ray.setFromCamera(pointer,camera);hits.length=0;ray.intersectObject(item.group,true,hits);
   if(!hits.some(hit=>{for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;return true;}))return;
  }
  if(!locked)onClaimUnlocked();
  gesture={id:event.pointerId,item,x:event.clientX,y:event.clientY,moved:0,lastX:event.clientX,lastY:event.clientY,locked};claim(event);
  try{element.setPointerCapture?.(event.pointerId);}catch{}
 }
 function move(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const g=gesture;g.moved=Math.max(g.moved,g.locked?g.moved+Math.hypot(event.movementX||0,event.movementY||0):Math.hypot(event.clientX-g.x,event.clientY-g.y));
  if(!g.locked&&g.moved>8&&enabled()){onDrag(event.clientX-g.lastX,event.clientY-g.lastY);claim(event);}
  g.lastX=event.clientX;g.lastY=event.clientY;
 }
 function up(event){
  const current=gesture;if(!current||event.pointerId!==current.id)return;gesture=null;claim(event);
  if(!current.locked)current.moved=Math.max(current.moved,Math.hypot(event.clientX-current.x,event.clientY-current.y));
  if(primary(event)&&current.moved<=8&&enabled()&&getItem()===current.item&&current.item.group.visible)current.item.consume();
 }
 const cancel=()=>{gesture=null;};
 doc?.defaultView?.addEventListener('blur',cancel);doc?.addEventListener?.('pointerlockchange',cancel);element.addEventListener('lostpointercapture',cancel,true);
 element.addEventListener('pointerdown',down,true);element.addEventListener('pointermove',move,true);element.addEventListener('pointerup',up,true);element.addEventListener('pointercancel',cancel,true);
 return {dispose(){cancel();doc?.defaultView?.removeEventListener('blur',cancel);doc?.removeEventListener?.('pointerlockchange',cancel);element.removeEventListener('lostpointercapture',cancel,true);element.removeEventListener('pointerdown',down,true);element.removeEventListener('pointermove',move,true);element.removeEventListener('pointerup',up,true);element.removeEventListener('pointercancel',cancel,true);}};
}
