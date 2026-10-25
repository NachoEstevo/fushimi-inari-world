const ICONS={
  menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',
  photo:'<path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="4"/>',
  soundOn:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  soundOff:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9.5 5 5M22 9.5l-5 5"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// One top-right bar (pace · sound · photo · menu) and a three-tab sheet.
export function installExplorationMenu({walker,controls,camera,assembly,places,sound,onNavigate=()=>{},cameraOwned=()=>false,onRenderQuality=()=>{},onDetailDistance=()=>{},allowDebugCamera=false,allowFastTravel=false}){
  const $=id=>document.getElementById(id);
  const menu=document.createElement('dialog');menu.id='exploration-menu';menu.setAttribute('aria-labelledby','menu-title');
  const tabs=['Explore','Routes','Settings'];
  menu.innerHTML=`<div class="menu-heading"><div><h2 id="menu-title">Explore Inariyama</h2><p id="menu-context">Fushimi Inari Taisha</p></div><button id="menu-close" aria-label="Close menu">×</button></div><div class="menu-tabs" role="tablist" aria-label="Menu sections">${tabs.map((t,i)=>`<button role="tab" id="tab-${i}" aria-controls="pane-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${t}</button>`).join('')}</div>${tabs.map((t,i)=>`<section role="tabpanel" id="pane-${i}" aria-labelledby="tab-${i}" ${i?'hidden':''}></section>`).join('')}`;
  menu.insertAdjacentHTML('beforeend','<p class="menu-credit">Made by <a href="https://nachoestevo.com" target="_blank" rel="noopener noreferrer">Ignacio Estevo</a></p>');
  document.body.append(menu);

  $('pane-0').innerHTML=`<h3 class="menu-section">How to move</h3>
    <div class="movement-modes"><button id="mode-walk">Walk</button>${allowDebugCamera?'<button id="mode-fly">Fly</button><button id="mode-orbit">Orbit</button>':''}</div>
    <ul class="menu-keys"><li><kbd>W A S D</kbd> move</li><li><kbd>Click</kbd> enter mouse look · <kbd>Esc</kbd> release</li><li><kbd>Drag</kbd> look on touch screens</li><li><kbd>Shift</kbd> run</li><li><kbd>E</kbd> interact</li><li><kbd>M</kbd> mute</li><li><kbd>L</kbd> flashlight</li>${allowDebugCamera?'<li><kbd>R</kbd> / <kbd>F</kbd> fly up / down</li>':''}</ul>
    ${allowFastTravel?'<h3 class="menu-section">Go to a place</h3>':''}`;
  places.hidden=!allowFastTravel;$('pane-0').append(places);
  $('overview').hidden=!allowDebugCamera;$('overview').textContent='Aerial overview';$('overview').classList.add('menu-link');$('pane-0').append($('overview'));
  $('pane-1').append(document.querySelector('aside'));
  for(const id of ['walk','stop','speed'])$(id).hidden=!allowFastTravel;
  document.querySelector('label[for="speed"]').hidden=!allowFastTravel;

  $('pane-2').innerHTML=`<h3 class="menu-section">Sound</h3>
    <label class="switch"><input id="sound-switch" type="checkbox"> Sound</label>
    <div id="sound-settings"><label for="ambient-volume">Volume</label><input id="ambient-volume" type="range" min="0" max="100" value="55">
    <label class="check"><input id="ambient-birds" type="checkbox" checked> Uguisu · field recording</label>
    <label class="check"><input id="ambient-wind" type="checkbox" checked> Breeze and leaves</label>
    <label class="check"><input id="ambient-chimes" type="checkbox" checked> Chimes near tea houses</label></div>
    <h3 class="menu-section">Scene</h3><div id="scene-settings"></div>
    <label for="render-quality">Rendering quality</label><select id="render-quality"><option value="balanced">Balanced</option><option value="high">High resolution</option><option value="ultra">Ultra · enhanced shadows and resolution</option></select>
    ${allowDebugCamera?'<label for="detail-distance">Detail distance</label><select id="detail-distance"><option value="near">Nearby - 220 m</option><option value="full">Entire world</option></select>':''}
    <div id="menu-arrival"></div>`;
  const light=document.querySelector('label[for="light"]');light.textContent='Time of day';$('scene-settings').append(light,$('light'));
  $('render-quality').onchange=()=>onRenderQuality($('render-quality').value);
  if(allowDebugCamera)$('detail-distance').onchange=()=>onDetailDistance($('detail-distance').value);
  document.querySelector('label[for="place"]').hidden=true;$('place').hidden=true;$('visit').parentElement.hidden=true;

  const bar=document.createElement('nav');bar.id='hud-actions';bar.setAttribute('aria-label','Quick controls');
  bar.innerHTML=`<div class="pace" role="group" aria-label="Walking speed"><button data-pace="slow">Slow</button><button data-pace="fast">Fast</button></div>
    <button id="sound-toggle" class="icon-button"></button>
    <button id="menu-open" aria-label="Menu · Esc">${icon('menu')}<span>Menu</span><kbd>Esc</kbd></button>`;
  document.body.append(bar);
  // Photo mode installs its own button; it joins the bar between sound and menu.
  const photo=$('photo-open');if(photo){photo.classList.add('icon-button');photo.title='Photo mode';photo.innerHTML=icon('photo');$('menu-open').before(photo);}
  const trigger=$('menu-open');

  const paceButtons=[...bar.querySelectorAll('[data-pace]')];
  function setPace(value){walker.setPace(value);for(const b of paceButtons)b.setAttribute('aria-pressed',String(b.dataset.pace===walker.pace));document.body.dataset.pace=walker.pace;}
  for(const b of paceButtons)b.onclick=()=>{setPace(b.dataset.pace);b.blur();};
  setPace(walker.pace);
  function syncSound(){
    const on=sound.enabled,button=$('sound-toggle');
    button.innerHTML=icon(on?'soundOn':'soundOff');button.setAttribute('aria-pressed',String(!on));
    button.setAttribute('aria-label',on?'Mute sound · M':'Turn sound on · M');button.title=on?'Mute · M':'Sound on · M';
    $('sound-switch').checked=on;$('sound-settings').classList.toggle('muted',!on);document.body.dataset.sound=on?'on':'off';
  }
  const toggleSound=()=>{sound.set(!sound.enabled);syncSound();};
  $('sound-toggle').onclick=e=>{toggleSound();e.currentTarget.blur();};
  $('sound-switch').onchange=()=>{sound.set($('sound-switch').checked);syncSound();};
  syncSound();

  const activate=i=>{tabs.forEach((_,j)=>{const t=$(`tab-${j}`);t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;$(`pane-${j}`).hidden=i!==j;});};
  const count=tabs.length;
  tabs.forEach((_,i)=>{const t=$(`tab-${i}`);t.onclick=()=>activate(i);t.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%count;else if(e.key==='ArrowLeft')n=(i+count-1)%count;else if(e.key==='Home')n=0;else if(e.key==='End')n=count-1;else return;e.preventDefault();activate(n);$(`tab-${n}`).focus();};});
  function open(){if(menu.open||document.body.classList.contains('welcome-open'))return;walker.pause(true);controls.enabled=false;$('interaction').hidden=true;menu.showModal();$('menu-close').focus();}
  function close(){if(menu.open)menu.close();}
  trigger.onclick=open;$('menu-close').onclick=close;
  $('mode-walk').onclick=()=>{onNavigate();walker.start();close();};if(allowDebugCamera){$('mode-fly').onclick=()=>{onNavigate();walker.fly();close();};$('mode-orbit').onclick=()=>{onNavigate();walker.stop();close();};}
  menu.addEventListener('close',()=>{walker.pause(cameraOwned());controls.enabled=allowDebugCamera&&!cameraOwned()&&!walker.active&&$('stop').disabled;trigger.focus();});
  menu.addEventListener('cancel',e=>{e.preventDefault();close();});
  menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  addEventListener('keydown',e=>{if(e.code!=='Escape')return;if(document.pointerLockElement||walker.pointerLooking){walker.releasePointerLock?.();document.exitPointerLock?.();e.preventDefault();e.stopImmediatePropagation();return;}e.preventDefault();e.stopImmediatePropagation();if(menu.open)close();else open();},true);
  addEventListener('keydown',e=>{
    if(e.code!=='KeyM'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,select,textarea'))return;
    if(document.body.classList.contains('welcome-open'))return;
    toggleSound();
  });
  for(const id of ['checkpoint-go','visit','freewalk','walk','overview'])$(id).addEventListener('click',close);
  $('checkpoint-buttons').addEventListener('click',e=>{if(e.target.closest('button'))close();});
  const title=document.querySelector('header h1');document.querySelector('header .eyebrow').textContent='Fushimi Inari Taisha';
  title.parentElement.insertAdjacentHTML('afterbegin','<svg class="place-mark" viewBox="0 0 32 36" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M2 5q14 4 28 0M4 10h24M5 17h22M9 11 7 33M23 11l2 22M16 11v6"/></svg>');
  let last=0;
  return {get active(){return menu.open;},syncSound,update(time){if(time-last<350)return;last=time;
    const nearest=assembly.spatial.anchors.reduce((best,a)=>{const distance=Math.hypot(camera.position.x-a.target[0],camera.position.z-a.target[2]);return !best||distance<best.distance?{a,distance}:best;},null);
    title.textContent=camera.position.y>400?'Inariyama':nearest.distance<45?nearest.a.label:`Trail · ${nearest.a.label}`;
    $('menu-context').textContent=`${title.textContent} · ${Math.round(camera.position.y-1.7)} m ASL`;
    document.body.dataset.movementMode=walker.mode;
    for(const mode of allowDebugCamera?['walk','fly','orbit']:['walk'])$(`mode-${mode}`).setAttribute('aria-pressed',String(walker.mode===mode));
  }};
}
