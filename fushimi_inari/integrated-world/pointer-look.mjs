export function installPointerLook({element,document:doc,enabled,look,onRelease=()=>{}}){
  let dragging=false,mouseArmed=false,lastX=0,lastY=0;
  const locked=()=>doc.pointerLockElement===element;
  function release(){dragging=false;mouseArmed=false;if(locked())doc.exitPointerLock?.();onRelease();}
  element.addEventListener('pointerdown',event=>{
    if(!enabled())return;
    // Keep a click-to-look fallback for embedded browsers that reject native lock.
    mouseArmed=event.pointerType!=='touch';
    dragging=true;lastX=event.clientX;lastY=event.clientY;
    if(mouseArmed&&element.requestPointerLock){
      try{const request=element.requestPointerLock();request?.catch?.(()=>{});}catch{}
    }
    if(!locked()){
      // Some embedded documents expose capture but reject it for their pointers.
      try{element.setPointerCapture?.(event.pointerId);}catch{}
    }
  });
  element.addEventListener('pointerup',()=>dragging=false);
  element.addEventListener('pointercancel',release);
  element.addEventListener('pointerenter',event=>{lastX=event.clientX;lastY=event.clientY;});
  element.addEventListener('pointermove',event=>{
    if(!enabled())return;
    if(locked()){look(event.movementX||0,event.movementY||0);return;}
    if(!dragging&&!mouseArmed)return;
    look(event.clientX-lastX,event.clientY-lastY);lastX=event.clientX;lastY=event.clientY;
  });
  doc.addEventListener?.('pointerlockchange',()=>{dragging=false;if(!locked()){mouseArmed=false;onRelease();}});
  // A denied native lock still leaves the click-armed canvas fallback usable.
  doc.addEventListener?.('pointerlockerror',()=>{onRelease();});
  doc.addEventListener?.('keydown',event=>{if(event.code==='Escape'&&(locked()||mouseArmed||dragging))release();});
  doc.defaultView?.addEventListener('blur',release);
  return {release,get locked(){return locked();},get engaged(){return locked()||mouseArmed||dragging;}};
}
