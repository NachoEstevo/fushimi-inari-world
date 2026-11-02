import * as THREE from 'three';
import {STREET_FOOD_MENUS} from './street-food-state.mjs';

// Commerce owns the shared geometry/materials. Equipping a snack only switches
// prepared clones; eating never allocates geometry or builds a new shader.
export function createStreetHeldFood({scene,camera,commerce,document:doc=globalThis.document}){
 const group=new THREE.Group();group.name='A snack for the walk';group.visible=false;scene.add(group);
 const models=new Map();
 for(const [kind,menu]of Object.entries(STREET_FOOD_MENUS))for(const item of menu){
  const model=commerce?.createServing?.(kind,item.id);if(!model)continue;model.visible=false;
  model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});group.add(model);models.set(kind+'/'+item.id,model);
 }
 const offset=new THREE.Vector3();let carrying=false,eating=false,elapsed=0,bites=0,disposed=false;
 const panel=doc?.createElement('div'),eat=doc?.createElement('button'),stow=doc?.createElement('button');
 if(panel){panel.id='street-held-food';panel.className='zen-pocket-actions';panel.hidden=true;eat.textContent='Eat';stow.textContent='Put away';panel.append(eat,stow);doc.body.append(panel);eat.onclick=()=>{api.eat();eat.blur();};stow.onclick=()=>{api.stow();stow.blur();};}
 const onKey=event=>{if(event.code==='KeyB'&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!doc?.querySelector('dialog[open]')&&!event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]')&&group.visible){event.preventDefault();api.eat();}};
 doc?.defaultView?.addEventListener('keydown',onKey);
 const api={group,preparationRoots:[...models.values()],collect(event){
  if(disposed)return false;const model=models.get(event.kind+'/'+event.itemId);if(!model)return false;
  for(const value of models.values())value.visible=value===model;
  carrying=true;eating=false;elapsed=0;bites=2;if(eat)eat.disabled=false;group.visible=true;if(panel)panel.hidden=false;return true;
 },eat(){if(disposed||!carrying||eating||bites<=0)return false;eating=true;elapsed=0;if(eat)eat.disabled=true;return true;},
 stow(){carrying=false;eating=false;group.visible=false;if(panel)panel.hidden=true;if(eat)eat.disabled=false;},
 update(dt,{blocked=false}={}){
  if(disposed||!carrying)return;group.visible=!blocked;if(panel)panel.hidden=blocked;if(blocked)return;
  if(eating){elapsed+=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;if(elapsed>=1.1){bites--;eating=false;elapsed=0;if(eat)eat.disabled=false;if(!bites){api.stow();return;}}}
  const lift=eating?Math.sin(Math.PI*Math.min(1,elapsed/1.1)):0;offset.set(.18-lift*.14,-.29+lift*.22,-.49+lift*.17).applyQuaternion(camera.quaternion);
  group.position.copy(camera.position).add(offset);group.quaternion.copy(camera.quaternion);group.rotateX(.06+lift*.35);
 },get stats(){return {carrying,eating,bites};},dispose(){if(disposed)return;api.stow();disposed=true;group.removeFromParent();group.clear();models.clear();api.preparationRoots.length=0;panel?.remove();doc?.defaultView?.removeEventListener('keydown',onKey);}};
 return api;
}
