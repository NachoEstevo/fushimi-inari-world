import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

export function createZenTeaTable({assembly,shop,camera,onAction=()=>{},onSeat=()=>{},document:doc=globalThis.document}){
 const group=new THREE.Group();group.name='Suehiro-ya · quiet tea setting';
 const interactionRoots=[],borrowed=[],geometries=[],materials=[];
 let disposed=false,seated=false,pending=false,blocked=false,phase='empty',elapsed=0,recorded=false,currentSite='suehiro';
 const stats={teaTables:0,benchSeats:0,batches:0,triangles:0,lights:0,textures:0};
 const mat=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.88});materials.push(m);return m;};
 const wood=mat('#65503a'),ceramic=mat('#d5dac9'),tea=mat('#718158'),metal=mat('#4d5147');
 ceramic.name='Quiet tea · glazed ceramic';ceramic.roughness=.34;ceramic.envMapIntensity=.65;tea.roughness=.28;
 const front=shop?.stats?.front,floor=shop?.stats?.floor;
 let cup=null,teapot=null,tableSite=null;
 function requestSeat(owner,position,target,site){
  if(disposed||blocked||pending||seated||!withinZenInteractionReach(camera,owner))return 'Come closer to take a seat.';
  pending=true;currentSite=site;onSeat({position,target,onLeave:()=>setSeated(false),site});return 'Take a seat. A quiet cup of tea can wait for you here.';
 }
 if(front&&Number.isFinite(floor)){
  const dx=front.b[0]-front.a[0],dz=front.b[2]-front.a[2],length=Math.hypot(dx,dz),t=[dx/length,dz/length],n=front.outward;
  const u=Math.max(.6,Math.min(length-.6,length*.70));
  group.position.set(front.a[0]+t[0]*u-n[0]*.20,floor,front.a[2]+t[1]*u-n[1]*.20);group.rotation.y=-Math.atan2(t[1],t[0]);
  const p=staticParts(group);p.put(new THREE.CylinderGeometry(.33,.34,.055,24).translate(0,.70,0),wood);p.put(new THREE.CylinderGeometry(.045,.075,.65,10).translate(0,.35,0),metal);
  p.put(new THREE.CylinderGeometry(.22,.26,.045,16).translate(0,.025,0),metal);
  // The small stool stays on the shop side of the existing two-metre trail.
  p.put(new THREE.CylinderGeometry(.21,.21,.055,18).translate(0,.43,-.75),wood);
  for(const [x,z]of [[-.13,-.64],[.13,-.64],[0,-.90]])p.beam([x,.405,z],[x*1.15,.025,-.75+(z+.75)*1.15],.018,metal,.018,6);
  p.flush();
  cup=new THREE.Group();cup.name='Tea cup · lift and return';cup.position.set(-.11,.735,0);group.add(cup);
  // One continuous cross-section closes the underside, curves over the rim,
  // and returns down the inward-facing wall to the visible ceramic floor.
  const cupProfile=[[0,0],[.042,0],[.047,.005],[.049,.020],[.057,.067],[.059,.075],[.058,.080],[.055,.082],[.052,.079],[.051,.072],[.044,.023],[.040,.014],[0,.014]].map(([r,y])=>new THREE.Vector2(r,y));
  const c=staticParts(cup);c.put(new THREE.LatheGeometry(cupProfile,32),ceramic,false);
  const surface=new THREE.Mesh(new THREE.CircleGeometry(.054,20),tea);surface.rotation.x=-Math.PI/2;surface.position.y=.065;surface.visible=false;cup.add(surface);c.flush();
  teapot=new THREE.Group();teapot.name='Small ceramic tea pot';teapot.position.set(.13,.735,.055);group.add(teapot);const pot=staticParts(teapot);
  pot.put(new THREE.SphereGeometry(.095,32,20).scale(1,.77,1).translate(0,.075,0),ceramic);pot.put(new THREE.CylinderGeometry(.045,.065,.025,32).translate(0,.15,0),ceramic);pot.put(new THREE.SphereGeometry(.017,16,10).translate(0,.173,0),wood);
  pot.beam([-.05,.07,0],[-.14,.12,0],.025,ceramic,.016,16);pot.put(new THREE.TorusGeometry(.055,.012,8,28,Math.PI*1.5).rotateY(Math.PI/2).rotateZ(-Math.PI*.25).translate(.08,.075,0),wood);pot.flush();
  tableSite={position:[group.position.x+n[0]*.75,floor+1.22,group.position.z+n[1]*.75],target:[group.position.x,floor+.80,group.position.z]};
  group.userData.zenMoment='tea';group.userData.interactable={language:'en',title:'Suehiro-ya · a cup of tea',proximity:true,reach:2.5,cooldownMs:900,prompt:'Sit for a cup of tea',directAction:()=>requestSeat(group,tableSite.position,tableSite.target,'suehiro')};
  assembly.root.add(group);assembly.legacy.interactables.push(group);interactionRoots.push(group);stats.teaTables=1;
  group.traverse(o=>{if(o.isMesh){geometries.push(o.geometry);stats.batches++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  group.userData.teaSurface=surface;
 }
 // The accepted benches retain their original geometry, materials and collision.
 for(const owner of assembly.legacy.interactables){
  let zone=null;for(let parent=owner;parent;parent=parent.parent)if(['chaya_s','chaya_n'].includes(parent.userData.zone)){zone=parent.userData.zone;break;}
  if(!zone||!owner.isMesh||owner.geometry?.parameters?.width!==1.25)continue;
  owner.updateWorldMatrix(true,false);const bounds=new THREE.Box3().setFromObject(owner),center=bounds.getCenter(new THREE.Vector3());
  const previous=owner.userData.interactable;borrowed.push({owner,previous});
  owner.userData.interactable={...previous,language:'en',title:zone==='chaya_s'?'Nishimura-tei · rest a while':'Okumura-tei · rest a while',proximity:true,reach:2.5,cooldownMs:900,prompt:'Sit and look over Kyoto',directAction:()=>requestSeat(owner,[center.x,bounds.max.y+.82,center.z],[center.x-1000,70,center.z+150],zone)};
  owner.userData.zenMoment='seat';interactionRoots.push(owner);stats.benchSeats++;
 }
 const overlay=doc?.createElement?.('section');
 if(overlay){overlay.id='zen-tea';overlay.className='zen-tea';overlay.hidden=true;overlay.setAttribute('aria-label','A quiet rest');overlay.innerHTML='<p class="zen-kicker">A SMALL PAUSE</p><p data-tea-note>A warm cup, the mountain around you.</p><div><button type="button" data-tea-action>Pour tea · E</button><button type="button" data-tea-leave>Stand up</button></div>';doc.body.append(overlay);overlay.querySelector('[data-tea-action]').onclick=performTeaAction;overlay.querySelector('[data-tea-leave]').onclick=()=>onSeat({leave:true});}
 const note=overlay?.querySelector('[data-tea-note]'),actionButton=overlay?.querySelector('[data-tea-action]');
 function render(){if(!overlay)return;overlay.hidden=!seated;if(actionButton){actionButton.hidden=currentSite!=='suehiro';actionButton.disabled=phase==='pouring'||phase==='lifting';actionButton.textContent=phase==='ready'?'Lift your cup · E':phase==='done'?'Enjoy the view':'Pour tea · E';}if(note)note.textContent=currentSite!=='suehiro'?'Let your eyes follow the roofs of Kyoto. Stay as long as you like.':phase==='empty'?'Take your time. Pour a little tea.':phase==='pouring'?'The tea settles into the cup.':phase==='ready'?'A small warm cup, ready to lift.':phase==='lifting'?'A slow sip. The mountain can wait.':'The cup returns to the table. Nothing else is needed.';}
 function setSeated(value){seated=!!value;pending=false;if(!seated){if(phase==='lifting')phase='ready';if(phase==='pouring')phase='empty';if(cup){cup.position.y=.735;cup.rotation.z=0;}if(teapot)teapot.rotation.z=0;elapsed=0;if(overlay?.contains(doc.activeElement))doc.activeElement.blur();}render();}
 function performTeaAction(){
  if(disposed||!seated||blocked||currentSite!=='suehiro')return 'Take a seat beside the tea first.';
  if(phase==='pouring'||phase==='lifting')return phase==='pouring'?'Let the tea settle into the cup.':'A slow sip, then return the cup.';
  if(phase==='empty'){phase='pouring';elapsed=0;render();return 'Pouring a little tea into the cup.';}
  if(phase==='ready'){phase='lifting';elapsed=0;render();return 'Lift the cup for a quiet sip.';}
  return 'Stay a little longer, if you like.';
 }
 const key=event=>{if(!seated||event.code!=='KeyE'||event.repeat||event.target?.closest?.('input,textarea,select'))return;event.preventDefault();performTeaAction();};doc?.addEventListener?.('keydown',key);
 render();
 return {group,interactionRoots,stats,setSeated,performTeaAction,update(dt,now,{blocked:hold=false}={}){
  if(disposed)return;blocked=hold;if(hold||!seated)return;
  elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
  if(phase==='pouring'){if(teapot)teapot.rotation.z=Math.sin(Math.min(1,elapsed/1.5)*Math.PI)*.40;if(elapsed>=1.5){phase='ready';if(group.userData.teaSurface)group.userData.teaSurface.visible=true;render();}}
  if(phase==='lifting'){if(cup){const lift=Math.sin(Math.min(1,elapsed/2.1)*Math.PI);cup.position.y=.735+lift*.30;cup.rotation.z=lift*.18;}if(elapsed>=2.1){phase='done';if(!recorded){recorded=true;onAction({type:'tea',site:'suehiro',completed:true});}render();}}
 },dispose(){if(disposed)return;disposed=true;for(const {owner,previous}of borrowed){owner.userData.interactable=previous;delete owner.userData.zenMoment;}const i=assembly.legacy.interactables.indexOf(group);if(i>=0)assembly.legacy.interactables.splice(i,1);group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();doc?.removeEventListener?.('keydown',key);overlay?.remove();}};
}
