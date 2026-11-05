import * as THREE from 'three';
import {createDrinkVesselResources,DRINK_PRODUCTS} from './drink-vessels.mjs';

export function createZenHeldDrink({scene,camera,commerce,document:doc=globalThis.document,onConsume=()=>{}}){
 const group=new THREE.Group();group.name='A drink for the walk';group.visible=false;scene.add(group);
 const owned=commerce?.createDrink?null:createDrinkVesselResources(),models=new Map();
 for(const product of DRINK_PRODUCTS){const model=commerce?.createDrink?.(product.id)??owned?.create(product.id);if(!model)continue;
  model.position.y=-.065;model.visible=false;model.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;}});group.add(model);models.set(product.id,model);
 }
 const offset=new THREE.Vector3();let sips=0,elapsed=0,sipping=false,disposed=false,carrying=false,productId=null,consumed=0;
 const panel=doc?.createElement('div');let sipButton,stowButton;
 if(panel){panel.id='zen-held-drink';panel.className='zen-pocket-actions';panel.hidden=true;sipButton=doc.createElement('button');stowButton=doc.createElement('button');stowButton.textContent='Put away';panel.append(sipButton,stowButton);doc.body.append(panel);sipButton.onclick=()=>{api.sip();sipButton.blur();};stowButton.onclick=()=>{api.stow();stowButton.blur();};}
 function label(){if(sipButton){sipButton.textContent=sips?'Drink':'Empty';sipButton.disabled=!sips||sipping;}}
 const onKey=event=>{if(event.code!=='KeyB'||event.repeat||event.ctrlKey||event.metaKey||event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]')||doc?.querySelector('dialog[open]'))return;if(group.visible){event.preventDefault();api.sip();}};
 doc?.defaultView?.addEventListener('keydown',onKey);
 const api={group,preparationRoots:[...models.values()],collect(value){
  if(disposed)return false;
  const product=DRINK_PRODUCTS.find(p=>p.id===value.productId)??DRINK_PRODUCTS.find(p=>p.name===value.drink)??DRINK_PRODUCTS[0];
  if(!models.has(product.id))return false;productId=product.id;
  for(const [id,model]of models)model.visible=id===productId;
  sips=3;elapsed=0;sipping=false;carrying=true;group.visible=true;if(panel)panel.hidden=false;label();return true;
 },sip(){if(disposed||!group.visible||!sips||sipping)return false;sipping=true;elapsed=0;label();return true;},
 stow(){carrying=false;group.visible=false;sipping=false;if(panel)panel.hidden=true;},update(dt,{blocked=false}={}){
  if(disposed||!carrying)return;if(panel)panel.hidden=blocked;group.visible=!blocked;
  if(blocked)return;
  if(sipping){elapsed+=Number.isFinite(dt)?Math.max(0,Math.min(dt,.1)):0;if(elapsed>=1.4-1e-9){sipping=false;sips--;consumed++;label();onConsume({productId,remaining:sips});}}
  const lift=sipping?Math.sin(Math.PI*Math.min(1,elapsed/1.4)):0;offset.set(Math.min(.20,Math.tan(camera.fov*Math.PI/360)*.51*camera.aspect-.05)-lift*.15,-.12+lift*.10,-.51+lift*.16).applyQuaternion(camera.quaternion);
  group.position.copy(camera.position).add(offset);group.quaternion.copy(camera.quaternion);group.rotateX(.1+lift*.95);
 },get stats(){return {sips,sipping,visible:carrying,productId,consumed};},dispose(){if(disposed)return;api.stow();disposed=true;group.removeFromParent();group.clear();models.clear();api.preparationRoots.length=0;owned?.dispose();panel?.remove();doc?.defaultView?.removeEventListener('keydown',onKey);}};
 return api;
}
