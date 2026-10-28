import * as THREE from 'three';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

export function createPaperMomentState(onAction=()=>{}){
 let kind=null,unfoldAt=null,stampAt=null,automaticStamp=false,mapDone=false,postcardDone=false;
 function finishStamp(time){const ready=kind==='postcard'&&!postcardDone&&stampAt!==null&&time-stampAt>=.65;stampAt=null;automaticStamp=false;if(!ready)return false;postcardDone=true;onAction({type:'postcard',site:'station',completed:true});return true;}
 return {get active(){return kind!==null;},get kind(){return kind;},get stamped(){return postcardDone;},get unfolded(){return mapDone;},
  get stamping(){return stampAt!==null;},
  get automaticStamp(){return automaticStamp;},
  seedJourney(state={}){mapDone||=!!state.moments?.map;postcardDone||=!!state.moments?.postcard;},
  open(value){kind=value;unfoldAt=null;stampAt=null;automaticStamp=false;},close(){kind=null;unfoldAt=null;stampAt=null;automaticStamp=false;},
  unfold(time){if(kind!=='map'||mapDone||unfoldAt!==null)return false;unfoldAt=time;return true;},
  beginStamp(time){if(kind!=='postcard'||postcardDone||stampAt!==null)return false;stampAt=time;automaticStamp=false;return true;},
  activateStamp(time){if(kind!=='postcard'||postcardDone||stampAt!==null)return false;stampAt=time;automaticStamp=true;return true;},
  cancelStamp(){stampAt=null;automaticStamp=false;},
  stampProgress(time){return stampAt===null?0:Math.max(0,Math.min(1,(time-stampAt)/.65));},
  finishStamp,
  update(time){if(kind==='map'&&!mapDone&&unfoldAt!==null&&time-unfoldAt>=.55){mapDone=true;onAction({type:'map',site:'station',completed:true});}if(automaticStamp&&stampAt!==null&&time-stampAt>=.65)finishStamp(time);}
 };
}

function paperTexture(kind,doc){
 if(!doc?.createElement)return new THREE.DataTexture(new Uint8Array([229,220,194,255]),1,1);
 const canvas=doc.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');
 if(!c)return new THREE.DataTexture(new Uint8Array([229,220,194,255]),1,1);
 c.fillStyle='#e7ddc4';c.fillRect(0,0,512,512);c.strokeStyle='#c6b99d';c.lineWidth=2;c.strokeRect(16,16,480,480);
 c.fillStyle='#514b3d';c.textAlign='center';c.font='22px serif';c.fillText(kind==='map'?'INARIYAMA · TRAIL NOTES':'A MOMENT FROM INARIYAMA',256,54);
 if(kind==='map'){
  c.strokeStyle='#ac4f3f';c.lineWidth=7;c.beginPath();c.moveTo(92,430);c.bezierCurveTo(440,385,95,175,380,100);c.stroke();
  for(const [x,y,name]of [[92,430,'Keihan'],[180,370,'Rōmon'],[240,290,'Okusha'],[240,210,'Yotsutsuji'],[380,100,'Ichinomine']]){c.fillStyle='#81694e';c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();c.font='18px serif';c.fillText(name,x,y-15);}
  c.fillStyle='#786e5a';c.font='15px sans-serif';c.fillText('A schematic keepsake · follow the real paths',256,478);
 }else{
  c.fillStyle='#a64e3d';c.fillRect(86,155,340,16);c.fillRect(106,190,300,12);c.fillRect(131,205,18,184);c.fillRect(362,205,18,184);
  c.strokeStyle='#8d9975';c.lineWidth=5;for(let i=0;i<5;i++){c.beginPath();c.moveTo(60+i*89,390);c.lineTo(130+i*63,270);c.lineTo(215+i*54,390);c.stroke();}
  c.fillStyle='#75654c';c.font='19px serif';c.fillText('Thousands of gates. One quiet walk.',256,440);
 }
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;return texture;
}

export function createZenPaperMoments({assembly,camera,journey,onAction=()=>{},document:doc=globalThis.document}){
 const group=new THREE.Group();group.name='Trail paper keepsakes';assembly.root.add(group);
 const interactionRoots=[],geometries=[],materials=[],textures=[];let time=0,blocked=false,disposed=false;
 const state=createPaperMomentState(onAction),stats={paperProps:0,batches:0,triangles:0,textures:0,lights:0};
 state.seedJourney(journey?.snapshot?.());const unsubscribe=journey?.subscribe?.(value=>{state.seedJourney(value);if(state.active)render();});
 const dialog=doc?.createElement?.('dialog');
 if(dialog){dialog.id='zen-paper';dialog.className='zen-moment';dialog.setAttribute('aria-labelledby','zen-paper-title');dialog.innerHTML='<button class="zen-close" type="button" aria-label="Put away keepsake">×</button><p class="zen-kicker">SOMETHING TO TAKE WITH YOU</p><h2 id="zen-paper-title"></h2><p data-paper-note></p><div class="zen-paper-object" data-paper-object><svg class="zen-paper-route" viewBox="0 0 360 185" aria-label="Schematic walking route from Keihan through the shrine to Ichinomine"><path class="zen-route-hills" d="m110 150 52-75 30 34 49-69 55 110M25 150l44-56 44 56"/><path class="zen-route-line" d="M24 150C170 169 93 117 177 105S217 71 315 38"/><g class="zen-route-stops"><circle cx="24" cy="150" r="4"/><circle cx="116" cy="141" r="4"/><circle cx="177" cy="105" r="4"/><circle cx="237" cy="75" r="4"/><circle cx="315" cy="38" r="4"/></g><g class="zen-route-names"><text x="24" y="175">Keihan</text><text x="111" y="162">Rōmon</text><text x="164" y="128">Okusha</text><text x="226" y="98">Yotsutsuji</text><text x="280" y="23">Ichinomine</text></g></svg><svg class="zen-paper-torii" viewBox="0 0 180 140" aria-hidden="true"><path d="M10 20q80 12 160 0M20 40h140M29 66h122M50 42l-9 91m89-91 9 91M90 42v24"/></svg><span data-paper-label></span><span class="zen-paper-seal" data-paper-seal>INARIYAMA<br>一歩</span></div><button type="button" data-paper-action></button><p class="zen-small" data-paper-status role="status"></p>';doc.body.append(dialog);}
 const $=selector=>dialog?.querySelector(selector),button=$('[data-paper-action]'),paper=$('[data-paper-object]');
 function clearPressing(){paper?.classList.remove('is-pressing');paper?.classList.remove('is-unfolding');paper?.style.removeProperty('--stamp-pressure');}
 function close(){state.close();clearPressing();if(dialog?.open)dialog.close();}
 function render(){
  if(!dialog)return;const map=state.kind==='map';
  $('#zen-paper-title').textContent=map?'Unfold the trail map':'A postcard from your walk';
  $('[data-paper-note]').textContent=map?'Open the folds. The mountain becomes a line you can follow.':'Leave a small red mark on the postcard. Hold the stamp, then lift it away. You can also activate it with the keyboard.';
  $('[data-paper-label]').textContent=map?'KEIHAN → RŌMON → OKUSHA → YOTSUTSUJI → ICHINOMINE':'THOUSANDS OF GATES. ONE QUIET WALK.';
  paper.classList.toggle('is-map',map);paper.classList.toggle('is-unfolded',map&&state.unfolded);paper.classList.toggle('is-stamped',!map&&state.stamped);
  button.textContent=map?(state.unfolded?'Map unfolded':'Unfold the map'):(state.stamped?'Postcard stamped':state.stamping?'Pressing the stamp…':'Stamp postcard');button.disabled=map?state.unfolded:state.stamped||state.automaticStamp;
  $('[data-paper-status]').textContent=map?(state.unfolded?'Your trail map is unfolded. Take your time along the way.':'A schematic keepsake of this reconstructed world.'):(state.stamped?'The ink is dry. A small keepsake of your walk.':'Mouse or touch: hold for a moment, then release. Keyboard: activate the stamp button.');
 }
 function open(kind,owner){
  if(disposed||blocked||state.active||!dialog||!withinZenInteractionReach(camera,owner))return 'Come closer to the keepsake.';
  state.open(kind,time);render();dialog.showModal();button.focus();return kind==='map'?'A folded trail map rests in your hands.':'A postcard and a small red stamp.';
 }
 if(dialog){
  $('.zen-close').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});dialog.addEventListener('close',()=>{state.close();clearPressing();});
  button.onclick=event=>{if(state.kind==='map'&&state.unfold(time)){paper.classList.add('is-unfolding');button.disabled=true;}else if(state.kind==='postcard'&&(event?.detail??0)===0&&state.activateStamp(time)){paper.classList.add('is-pressing');render();}};
  const begin=event=>{if(state.kind!=='postcard')return;event.preventDefault();if(state.beginStamp(time))paper.classList.add('is-pressing');};
  const finish=event=>{if(state.kind!=='postcard')return;event.preventDefault();state.finishStamp(time);clearPressing();render();};
  button.addEventListener('pointerdown',event=>{button.setPointerCapture?.(event.pointerId);begin(event);});button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',()=>{state.cancelStamp();clearPressing();render();});
 }
 function addPaper(kind,position,yaw){
  const owner=new THREE.Group();owner.name=kind==='map'?'Folded trail map on station seat':'Unsent postcard on station seat';owner.position.set(...position);owner.rotation.y=yaw;owner.userData.zenMoment=kind;group.add(owner);
  const texture=paperTexture(kind,doc),material=new THREE.MeshStandardMaterial({map:texture,roughness:.98,side:THREE.DoubleSide}),geometry=new THREE.PlaneGeometry(kind==='map'?.24:.22,.17,2,1);
  const p=geometry.attributes.position;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.001)p.setZ(i,.012);geometry.computeVertexNormals();geometry.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;owner.add(mesh);textures.push(texture);materials.push(material);geometries.push(geometry);
  owner.userData.interactable={language:'en',title:kind==='map'?'Folded trail map':'A postcard from Inariyama',proximity:true,reach:2.5,cooldownMs:900,prompt:kind==='map'?'Unfold the trail map':'Pick up a postcard',directAction:()=>open(kind,owner)};
  assembly.legacy.interactables.push(owner);interactionRoots.push(owner);stats.paperProps++;stats.batches++;stats.triangles+=4;stats.textures++;
 }
 const floor=assembly.keihanStation?.spec?.platformFloor;if(Number.isFinite(floor))addPaper('map',[-301.1,floor+.55,-193],0);
 if(Number.isFinite(floor))addPaper('postcard',[-300.4,floor+.55,-193],0);
 return {group,interactionRoots,stats,get active(){return !!dialog?.open;},update(dt,now,{blocked:hold=false}={}){
  if(disposed)return;time=now;blocked=hold;const unfolded=state.unfolded,stamped=state.stamped;state.update(time);if(unfolded!==state.unfolded||stamped!==state.stamped){if(state.stamped)clearPressing();render();}
  if(dialog?.open)paper.style.setProperty('--stamp-pressure',state.stampProgress(time));
 },dispose(){if(disposed)return;disposed=true;unsubscribe?.();close();dialog?.remove();for(const owner of interactionRoots){const i=assembly.legacy.interactables.indexOf(owner);if(i>=0)assembly.legacy.interactables.splice(i,1);}group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
