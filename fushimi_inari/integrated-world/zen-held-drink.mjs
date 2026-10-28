import * as THREE from 'three';
export function createZenHeldDrink({scene,camera,document:doc=globalThis.document}){
 const group=new THREE.Group();group.name='A drink for the walk';group.visible=false;scene.add(group);
 const paint=new THREE.MeshStandardMaterial({color:'#81a85c',roughness:.42,metalness:.35}),metal=new THREE.MeshStandardMaterial({color:'#c6cac7',roughness:.29,metalness:.75});
 const shell=new THREE.Mesh(new THREE.CylinderGeometry(.034,.033,.135,16),paint);group.add(shell);
 for(const y of [-.067,.067]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.032,.002,4,16),metal);rim.rotation.x=Math.PI/2;rim.position.y=y;group.add(rim);}
 const lid=new THREE.Mesh(new THREE.CylinderGeometry(.031,.031,.003,16),metal);lid.position.y=.068;group.add(lid);
 const tab=new THREE.Mesh(new THREE.TorusGeometry(.007,.0015,4,10),metal);tab.rotation.x=Math.PI/2;tab.position.set(0,.071,.006);group.add(tab);
 const offset=new THREE.Vector3();let sips=0,elapsed=0,sipping=false,disposed=false,carrying=false,name='Drink';
 const panel=doc?.createElement('div');let sipButton,stowButton;
 if(panel){panel.id='zen-held-drink';panel.className='zen-pocket-actions';panel.hidden=true;sipButton=doc.createElement('button');stowButton=doc.createElement('button');stowButton.textContent='Put away';panel.append(sipButton,stowButton);doc.body.append(panel);sipButton.onclick=()=>{api.sip();sipButton.blur();};stowButton.onclick=()=>{api.stow();stowButton.blur();};}
 function label(){if(sipButton){sipButton.textContent=sips?`${name} · sip`:'An empty can';sipButton.disabled=!sips||sipping;}}
 const onKey=event=>{if(event.code!=='KeyB'||event.repeat||event.ctrlKey||event.metaKey||event.target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]')||doc?.querySelector('dialog[open]'))return;if(group.visible){event.preventDefault();api.sip();}};
 doc?.defaultView?.addEventListener('keydown',onKey);
 const api={group,collect(value){if(disposed)return;name=value.drink??'Drink';paint.color.set(value.color??'#81a85c');sips=3;elapsed=0;sipping=false;carrying=true;group.visible=true;if(panel)panel.hidden=false;label();},
 sip(){if(disposed||!group.visible||!sips||sipping)return false;sipping=true;elapsed=0;label();return true;},
 stow(){carrying=false;group.visible=false;sipping=false;if(panel)panel.hidden=true;},update(dt,{blocked=false}={}){
  if(disposed||!carrying)return;if(panel)panel.hidden=blocked;group.visible=!blocked;
  if(blocked)return;
  if(sipping){elapsed+=Math.max(0,Math.min(dt,2));if(elapsed>=1.4){sipping=false;sips--;label();}}
  const lift=sipping?Math.sin(Math.PI*Math.min(1,elapsed/1.4)):0;offset.set(.20-lift*.15,-.25+lift*.16,-.51+lift*.14).applyQuaternion(camera.quaternion);
  group.position.copy(camera.position).add(offset);group.quaternion.copy(camera.quaternion);group.rotateX(.1+lift*.95);
 },get stats(){return {sips,sipping,visible:carrying};},dispose(){if(disposed)return;disposed=true;group.removeFromParent();group.traverse(object=>object.geometry?.dispose());paint.dispose();metal.dispose();panel?.remove();doc?.defaultView?.removeEventListener('keydown',onKey);}};
 return api;
}
