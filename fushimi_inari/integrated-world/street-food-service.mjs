import * as THREE from 'three';
import {createStreetFoodOrder} from './street-food-state.mjs';
import {createStreetHeldFood} from './street-held-food.mjs';

export function installStreetFoodService({scene,camera,assembly,commerce,walker,getBlocked=()=>false,onCollected=()=>{},onSound=()=>{},announce=()=>{},document:doc=globalThis.document}){
 const held=createStreetHeldFood({scene,camera,commerce,document:doc,onConsume:event=>onSound({type:'food.bite',position:camera.position.toArray(),...event})}),entries=new Map(),replaced=[],detailGroups=[],preparationRoots=[...held.preparationRoots];
 const dialog=doc?.createElement('dialog');let title,list,closeButton,menuSite=null,disposed=false;
 if(dialog){
  dialog.id='street-food-menu';dialog.setAttribute('aria-labelledby','street-food-title');
  title=doc.createElement('h2');title.id='street-food-title';closeButton=doc.createElement('button');closeButton.type='button';closeButton.textContent='×';closeButton.setAttribute('aria-label','Close food menu');
  list=doc.createElement('div');list.className='street-food-choices';dialog.append(title,closeButton,list);doc.body.append(dialog);
  closeButton.onclick=()=>closeMenu();dialog.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});
  dialog.addEventListener('close',()=>{if(!dialog.open){menuSite=null;walker.pause(getBlocked());}});
 }
 function closeMenu(){menuSite=null;if(dialog?.open)dialog.close();walker.pause(getBlocked());}
 function inReach(entry){entry.owner.getWorldPosition(point);return Math.hypot(camera.position.x-point.x,camera.position.z-point.z)<3.4&&Math.abs(camera.position.y-point.y-1.7)<1.2;}
 const point=new THREE.Vector3();
 function open(id){
  const entry=entries.get(id);if(disposed||!dialog||!entry||entry.state.phase!=='ready'||getBlocked()||walker.mode!=='walk'||!inReach(entry))return false;
  menuSite=id;title.textContent=entry.site.kind==='grill'?'Food counter':entry.site.name;list.replaceChildren();
  for(const item of entry.state.menu){const button=doc.createElement('button');button.type='button';button.textContent=item.name;button.onclick=()=>{if(order(id,item.id)){closeMenu();announce('Preparing your snack.');}};list.append(button);}
  walker.pause(true);dialog.showModal();list.querySelector('button')?.focus();return true;
 }
 function order(id,itemId){
  const entry=entries.get(id);if(disposed||!entry||getBlocked()||!inReach(entry)||!entry.models.has(itemId))return false;
  const accepted=entry.state.order(itemId);if(accepted){entry.greet?.();for(const model of entry.models.values())model.visible=false;}return accepted;
 }
 function interact(id){
  const entry=entries.get(id);if(disposed||!entry||getBlocked()||!inReach(entry))return '';
  if(entry.state.phase==='ready'){open(id);return '';}
  if(entry.state.phase==='preparing')return 'Preparing your snack.';
  const item=entry.state.collect();if(!item)return '';
  for(const model of entry.models.values())model.visible=false;
  return {message:'Enjoy your walk.',event:{type:'food.collected',siteId:id,kind:entry.site.kind,itemId:item.id,name:item.name}};
 }
 for(const site of commerce?.sites??[]){
  if(!site.position?.every(Number.isFinite)||!site.counterPosition?.every(Number.isFinite))continue;
  const state=createStreetFoodOrder(site.kind),owner=new THREE.Group(),models=new Map();owner.name='Street food service · '+site.id;owner.position.fromArray(site.position);
  for(const item of state.menu){const model=commerce.createServing(site.kind,item.id);if(!model)continue;model.position.set(...site.counterPosition.map((v,i)=>v-site.position[i]));model.rotation.y=Math.atan2(site.position[0]-site.counterPosition[0],site.position[2]-site.counterPosition[2]);model.visible=false;owner.add(model);models.set(item.id,model);preparationRoots.push(...(model.userData.preparationRoots??[model]));}
  if(!models.size)continue;
  const data={language:'en',title:site.name,proximity:true,reach:3.1,cooldownMs:450,directAction:()=>interact(site.id)};
  Object.defineProperty(data,'prompt',{enumerable:true,get:()=>state.phase==='served'?'Take '+state.item.name:state.phase==='preparing'?'Preparing your snack':'Order a snack'});
  owner.userData.interactable=data;owner.userData.detailRadius=30;assembly.root.add(owner);assembly.legacy.interactables.push(owner);detailGroups.push(owner);entries.set(site.id,{site,state,owner,models});
  const vendor=assembly.root.getObjectByName('Food attendant · '+site.id);
  if(vendor){const original=vendor.userData.interactable;entries.get(site.id).greet=original?.directAction;replaced.push([vendor,original]);vendor.userData.interactable=data;}
 }
 assembly.root.updateMatrixWorld(true);
 return {detailGroups,preparationRoots,held,get active(){return !!dialog?.open;},open,order,interact,
  collect(event){if(held.collect(event)){onCollected(event);onSound({...event,type:'food.collect',position:camera.position.toArray()});return true;}return false;},stow:()=>held.stow(),
  update(dt,{blocked=false}={}){
   if(disposed)return;for(const entry of entries.values()){
    const before=entry.state.phase;entry.state.update(dt,{paused:blocked||!!dialog?.open});
    if(before==='preparing'&&entry.state.phase==='served'){
     entry.models.get(entry.state.item.id).visible=true;if(inReach(entry))announce(entry.state.item.name+' is ready.');
    }
   }
  },afterCamera(dt,{blocked=false}={}){held.update(dt,{blocked:blocked||!!dialog?.open});},
  get stats(){return {sites:entries.size,boundVendors:replaced.length,menuOpen:!!dialog?.open,menuSite,held:held.stats,orders:[...entries].map(([id,e])=>({id,phase:e.state.phase,item:e.state.item?.id??null,collected:e.state.collected}))};},
  dispose(){if(disposed)return;disposed=true;if(dialog?.open)dialog.close();dialog?.remove();held.dispose();
   for(const [vendor,data]of replaced)vendor.userData.interactable=data;
   for(const {owner}of entries.values()){owner.removeFromParent();const index=assembly.legacy.interactables.indexOf(owner);if(index!==-1)assembly.legacy.interactables.splice(index,1);owner.clear();}entries.clear();preparationRoots.length=0;
  }};
}
