import {DRINK_PRODUCTS} from './drink-vessels.mjs';

// A local selection UI over the existing machine controller. Commerce remains
// the only owner of stock state, dispensed models and collection events.
export function installDrinkMachineService({commerce,camera,walker,getBlocked=()=>false,announce=()=>{},document:doc=globalThis.document}){
 const machines=commerce?.machines??[],entries=new Map(),dialog=doc?.createElement('dialog');let menu=null,disposed=false;
 if(dialog){dialog.id='drink-machine-menu';dialog.className='street-choice-menu';dialog.setAttribute('aria-label','Choose a drink');const heading=doc.createElement('h2');heading.textContent='Choose a drink';const close=doc.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close drinks');close.onclick=closeMenu;
  const choices=doc.createElement('div');choices.className='street-food-choices';for(const product of DRINK_PRODUCTS){const button=doc.createElement('button');button.type='button';button.textContent=product.name;button.onclick=()=>{if(menu&&order(menu,product.id)){closeMenu();announce('Your drink is on its way.');}};choices.append(button);}dialog.append(heading,close,choices);doc.body.append(dialog);
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});dialog.addEventListener('close',()=>{if(!dialog.open){menu=null;walker.pause(getBlocked());}});
 }
 function near(entry){const [x,y,z]=entry.machine.spec.position;return Math.hypot(camera.position.x-x,camera.position.z-z)<=3.3&&Math.abs(camera.position.y-y-1.7)<1.2;}
 function closeMenu(){menu=null;if(dialog?.open)dialog.close();walker.pause(getBlocked());}
 function open(id){const entry=entries.get(id);if(disposed||!entry||!dialog||getBlocked()||walker.mode!=='walk'||entry.pending>0||entry.machine.controller.state.phase!=='ready'||!near(entry))return false;menu=id;walker.pause(true);dialog.showModal();dialog.querySelector('div button')?.focus();return true;}
 function order(id,productId){const entry=entries.get(id),index=DRINK_PRODUCTS.findIndex(p=>p.id===productId);if(disposed||!entry||index<0||entry.pending>0||getBlocked()||!near(entry)||entry.machine.controller.state.phase!=='ready')return false;
  const controller=entry.machine.controller;for(let n=0;n<DRINK_PRODUCTS.length&&controller.state.selected!==index;n++)controller.select();entry.pending=.65;return true;
 }
 for(const machine of machines){const id=machine.spec.id??machine.group.name,original=machine.group.userData.interactable,entry={machine,original,pending:0};entries.set(id,entry);
  const data={...original,directAction:()=>{if(disposed||getBlocked()||!near(entry))return '';if(entry.pending>0)return 'Your drink is on its way.';if(machine.controller.state.phase==='dispensed')return original.directAction();open(id);return '';}};
  Object.defineProperty(data,'prompt',{enumerable:true,get:()=>entry.pending>0?'Preparing drink':machine.controller.state.phase==='dispensed'?'Collect drink':'Choose a drink'});machine.group.userData.interactable=data;
 }
 return {open,order,get active(){return !!dialog?.open;},update(dt,{blocked=false}={}){if(disposed||blocked||dialog?.open||!Number.isFinite(dt)||dt<=0)return;for(const entry of entries.values())if(entry.pending>0){entry.pending=Math.max(0,entry.pending-Math.min(.1,dt));if(entry.pending<1e-8){entry.pending=0;entry.machine.controller.dispense();if(near(entry))announce('Your drink is ready.');}}},
  get stats(){return {menuOpen:!!dialog?.open,machines:entries.size,pending:[...entries.values()].filter(e=>e.pending>0).length};},
  dispose(){if(disposed)return;disposed=true;if(dialog?.open)dialog.close();dialog?.remove();for(const {machine,original}of entries.values())machine.group.userData.interactable=original;entries.clear();}
 };
}
