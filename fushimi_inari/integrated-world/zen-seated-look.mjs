// Input belongs to the seated camera only; no pointer lock is requested.
export function installZenSeatedLook({element,document,seat,enabled}){
 const held=new Set(),keys=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
 let pointer=null,lastX=0,lastY=0,disposed=false;
 const view=document.defaultView;
 function release(){if(pointer!==null){try{element?.releasePointerCapture?.(pointer);}catch{}pointer=null;}}
 function clear(){held.clear();release();}
 function down(e){if(!enabled()||e.button!==0||pointer!==null)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;try{element.setPointerCapture?.(pointer);}catch{}}
 function move(e){if(!enabled()){clear();return;}const locked=document.pointerLockElement===element;if(!locked&&e.pointerId!==pointer)return;const dx=locked?e.movementX:e.clientX-lastX,dy=locked?e.movementY:e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;seat.look(-dx*.003,-dy*.003);}
 function up(e){if(e.pointerId===pointer)release();}
 function lostCapture(e){if(e.pointerId===pointer)pointer=null;}
 function keydown(e){if(!keys.has(e.code)||!enabled()||e.ctrlKey||e.metaKey||e.altKey||e.target?.closest?.('input,select,textarea,button,a,[contenteditable]:not([contenteditable="false"])'))return;held.add(e.code);e.preventDefault();}
 function keyup(e){held.delete(e.code);}
 element?.addEventListener('pointerdown',down);element?.addEventListener('pointermove',move);element?.addEventListener('pointerup',up);element?.addEventListener('pointercancel',up);element?.addEventListener('lostpointercapture',lostCapture);
 document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);view?.addEventListener('blur',clear);
 return {update(dt){if(disposed)return;if(!enabled()){clear();return;}if(!Number.isFinite(dt)||dt<0)return;const step=Math.min(dt,.1)*.8;seat.look((held.has('ArrowLeft')-held.has('ArrowRight'))*step,(held.has('ArrowUp')-held.has('ArrowDown'))*step);},dispose(){if(disposed)return;disposed=true;clear();element?.removeEventListener('pointerdown',down);element?.removeEventListener('pointermove',move);element?.removeEventListener('pointerup',up);element?.removeEventListener('pointercancel',up);element?.removeEventListener('lostpointercapture',lostCapture);document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);view?.removeEventListener('blur',clear);}};
}
