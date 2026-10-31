import * as THREE from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {SpatialCollisionWorld} from './collision.mjs';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

export function planZenStorySites(assembly){
 const spec=assembly.keihanStation?.spec,view=assembly.spatial?.byId?.yotsu,world=new SpatialCollisionWorld(4);
 for(const c of assembly.colliders??[])world[c.type==='box'?'addBox':'addCylinder'](...c.args);
 const supported=(x,z)=>assembly.isWalkable?.(x,z)??!!assembly.surfaces?.sample?.(x,z);
 function choose(point,offsets=[[.7,0],[-.7,0],[0,.7],[0,-.7],[0,0],[1.2,0],[-1.2,0]],avoid=null){
  if(!point)return null;
  for(const [dx,dz]of offsets){
   const x=point[0]+dx,z=point[2]+dz;if(avoid&&Math.hypot(x-avoid[0],z-avoid[2])<3)continue;if(!supported(x,z))continue;const y=assembly.walkHeight(x,z);if(!Number.isFinite(y))continue;
   const clear=world.resolvePlayer(x,y+1.55,z,.30);if(Math.hypot(clear.x-x,clear.z-z)<.005)return [x,y,z];
  }return null;
 }
 const station=choose(spec?.route?.turn??spec?.route?.platformDoor??spec?.publicExit?.position);
 let viewPoint=view?.checkpoint??view?.target;
 if(viewPoint&&assembly.spatial.main?.length){let closest=assembly.spatial.main[0],d=Infinity;for(const p of assembly.spatial.main){const q=(p[0]-viewPoint[0])**2+(p[2]-viewPoint[2])**2;if(q<d){closest=p;d=q;}}viewPoint=closest;}
 // Kyoto is west of this lookout. Keep Aki behind or beside its camera,
 // on a supported public surface, rather than in the centre of the outlook.
 const viewOffsets=[[3.2,0],[3.2,1.6],[3.2,-1.6],[4.2,0],[2.6,2],[2.6,-2],[0,3.4],[0,-3.4],[5.5,0],[6.5,1.5],[6.5,-1.5]];
 return {station,view:choose(viewPoint,viewOffsets,view?.checkpoint??view?.target),return:station};
}

const CONVERSATIONS={
 station:{title:'Aki',intro:'“I’m heading to Yotsutsuji. I want a photo of Kyoto for this postcard.”',choices:[['Which way?','“Through the torii, then uphill to Yotsutsuji. Look west for the rooftops.”'],['A good photo spot?','“Try one gate inside another on the way up. At Yotsutsuji, leave room for the hills.”']],farewell:'See you there.'},
 view:{title:'Aki',intro:'“Kyoto’s rooftops, then the hills. I’ll stop for tea at Suehiro-ya before heading back.”',choices:[['What should I frame?','“Face west. Keep the rooftops low, with the hills above. Leave a little sky.”'],['What if I already took one?','“Keep your favorite. A postcard only needs one view. Tea next?”']],farewell:'See you on the way down.'},
 return:{title:'Aki',intro:'“I’m taking the next train. The photo from Yotsutsuji is on my postcard.”',choices:[['Who is it for?','“My sister. She asked what Kyoto looks like from up there.”'],['Did you stop for tea?','“At Suehiro-ya, near the summit. I needed the rest.”']],farewell:'Have a good trip.'}
};

export function createAkiConversation(onAction=()=>{}){
 const met=new Set();let stage=null,responded=false;
 return {open(site){if(!CONVERSATIONS[site])return false;stage=site;responded=false;return true;},
  respond(index){if(!stage||!Number.isInteger(index)||!CONVERSATIONS[stage].choices[index])return false;responded=true;return true;},
  seedJourney(state={}){if(state.moments?.aki)met.add('station');if(state.photoPrompts?.['kyoto-view'])met.add('view');if(state.moments?.return)met.add('return');},
  hasMet:site=>met.has(site),finish(){if(!stage||!responded||met.has(stage))return false;met.add(stage);onAction({type:`meet${stage}`,site:stage,completed:true});return true;}
 };
}

export function createZenStoryPeople({assembly,camera,visitors,journey,onAction=()=>{},document:doc=globalThis.document}){
 const group=new THREE.Group();group.name='Aki · fictional fellow traveler';group.userData.zenMoment='aki';assembly.root.add(group);
 const sites=planZenStorySites(assembly),interactionRoots=[],ownedMaterials=[],ownedGeometry=[],skeletons=new Set(),conversation=createAkiConversation(onAction);
 conversation.seedJourney(journey?.snapshot?.());const unsubscribe=journey?.subscribe?.(state=>conversation.seedJourney(state));
 let disposed=false,blocked=false,time=0,stage=sites.station?'station':'view',dialogStage=null,answer=false,head=null,headRest=null,model=null;
 const stats={storyPeople:0,loadedModels:0,batches:0,triangles:0,assetRequests:0,sites:Object.keys(sites).filter(key=>sites[key]),positions:sites,fictional:true,get stage(){return stage;}};
 const dialog=doc?.createElement?.('dialog');
 if(dialog){dialog.id='zen-aki';dialog.className='zen-moment zen-conversation';dialog.setAttribute('aria-labelledby','zen-aki-title');dialog.innerHTML='<button class="zen-close" type="button" aria-label="Continue your walk">×</button><h2 id="zen-aki-title"></h2><p class="zen-aki-words" data-aki-words></p><div class="zen-aki-choices" data-aki-choices></div>';doc.body.append(dialog);}
 const $=selector=>dialog?.querySelector(selector);
 function close(){if(dialog?.open)dialog.close();dialogStage=null;}
 if(dialog){$('.zen-close').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{dialogStage=null;});}
 function render(){
  if(!dialog||!dialogStage)return;const story=CONVERSATIONS[dialogStage];$('#zen-aki-title').textContent=story.title;const choices=$('[data-aki-choices]');choices.replaceChildren();
  if(!answer){$('[data-aki-words]').textContent=story.intro;for(const [index,[label,reply]]of story.choices.entries()){const b=doc.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{answer=conversation.respond(index);$('[data-aki-words]').textContent=reply;renderFarewell();};choices.append(b);}}
  else renderFarewell();
 }
 function renderFarewell(){
  const choices=$('[data-aki-choices]');choices.replaceChildren();const b=doc.createElement('button');b.type='button';b.textContent=CONVERSATIONS[dialogStage].farewell;
  b.onclick=()=>{conversation.finish();close();};choices.append(b);b.focus();
 }
 const action=()=>{
  if(disposed||blocked||!model||!dialog||dialog.open||!withinZenInteractionReach(camera,group))return 'Aki is nearby.';
  dialogStage=stage;conversation.open(stage);answer=false;render();dialog.showModal();$('[data-aki-choices] button')?.focus();return 'Talking with Aki.';
 };
 group.userData.interactable={language:'en',title:'Aki',proximity:true,reach:2.5,cooldownMs:900,get prompt(){return conversation.hasMet(stage)?'Talk with Aki again':'Talk with Aki';},directAction:action};
 if(sites[stage]){group.position.set(...sites[stage]);assembly.legacy.interactables.push(group);interactionRoots.push(group);}
 group.visible=false;
 const ready=Promise.resolve(visitors?.ready).then(()=>{
  if(disposed)return;const source=visitors?.people?.find(p=>p.root?.children?.[0])?.root.children[0];if(!source){stats.loadError='Prepared visitor model unavailable';return;}
  model=clone(source);model.name='Aki · shared prepared visitor model';group.add(model);
  model.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);if(o.isMesh){stats.batches++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;o.frustumCulled=false;}});
  head=model.getObjectByName('Head');if(head?.isBone)headRest=head.quaternion.clone();else head=null;
  // A small cloth satchel makes this recurring visitor recognizable without
  // recoloring or disposing any geometry/material borrowed from the visitors.
  const bagMaterial=new THREE.MeshStandardMaterial({color:'#58676b',roughness:1}),bagGeometry=new THREE.BoxGeometry(.20,.24,.085),strapGeometry=new THREE.TorusGeometry(.25,.010,5,24,Math.PI*1.25);ownedMaterials.push(bagMaterial);ownedGeometry.push(bagGeometry,strapGeometry);
  const bag=new THREE.Mesh(bagGeometry,bagMaterial);bag.position.set(-.22,.88,.07);bag.rotation.z=-.10;
  const strap=new THREE.Mesh(strapGeometry,bagMaterial);strap.position.set(-.02,1.20,.05);strap.rotation.z=.25;strap.scale.set(.8,1.2,1);group.add(bag,strap);
  stats.loadedModels=1;stats.storyPeople=sites[stage]?1:0;stats.batches+=2;stats.triangles+=12+5*24*2;
 }).catch(error=>{stats.loadError=error.message;});
 return {group,interactionRoots,stats,ready,get active(){return !!dialog?.open;},update(dt,now,{blocked:hold=false}={}){
  if(disposed)return;time=now;blocked=hold;
  if(!dialogStage){
   const remote=camera.position.distanceToSquared(group.position)>2500;
   if(sites.view&&Math.hypot(camera.position.x-sites.view[0],camera.position.z-sites.view[2])<38&&(remote||sites[stage]===sites.view))stage='view';
   else if(conversation.hasMet('view')&&sites.return&&Math.hypot(camera.position.x-sites.return[0],camera.position.z-sites.return[2])<65&&(remote||sites[stage]===sites.return))stage=conversation.hasMet('station')?'return':'station';
  }
  const p=sites[stage];if(!p||!model){group.visible=false;return;}group.position.set(...p);const d=camera.position.distanceToSquared(group.position);group.visible=d<3600;if(!group.visible||hold)return;
  const yaw=Math.atan2(camera.position.x-p[0],camera.position.z-p[2]);group.rotation.y=THREE.MathUtils.damp(group.rotation.y,d<36?yaw:Math.PI*.8,4,Math.min(.1,dt));
  if(head){head.quaternion.copy(headRest);head.rotateX(Math.sin(time*.8)*.018);head.rotateY(Math.sin(time*.4)*.05);}
 },dispose(){if(disposed)return;disposed=true;unsubscribe?.();close();dialog?.remove();const index=assembly.legacy.interactables.indexOf(group);if(index>=0)assembly.legacy.interactables.splice(index,1);group.removeFromParent();for(const skeleton of skeletons)skeleton.dispose();for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterials)m.dispose();}};
}
