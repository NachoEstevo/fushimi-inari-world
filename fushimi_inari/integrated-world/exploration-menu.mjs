export function installExplorationMenu({walker,controls,camera,assembly}){
  const $=id=>document.getElementById(id);
  const menu=document.createElement('dialog');menu.id='exploration-menu';menu.setAttribute('aria-labelledby','menu-title');
  const tabs=['Movement','Checkpoints','Routes','Environment'];
  menu.innerHTML=`<div class="menu-heading"><h2 id="menu-title">Explore Inariyama</h2><button id="menu-close" aria-label="Close menu">×</button></div><div class="menu-tabs" role="tablist" aria-label="Settings">${tabs.map((t,i)=>`<button role="tab" id="tab-${i}" aria-controls="pane-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${t}</button>`).join('')}</div>${tabs.map((t,i)=>`<section role="tabpanel" id="pane-${i}" aria-labelledby="tab-${i}" ${i?'hidden':''}></section>`).join('')}`;
  menu.insertAdjacentHTML('beforeend','<p class="menu-credit">Made by <a href="https://nachoestevo.com" target="_blank" rel="noopener noreferrer">Ignacio Estevo</a></p>');
  document.body.append(menu);
  const move=(id,pane,label=false)=>{const el=$(id);if(label){const l=document.querySelector(`label[for="${id}"]`);if(l)$(pane).append(l);}$(pane).append(el);};
  move('walk-speed','pane-0',true);
  const modes=document.createElement('div');modes.className='movement-modes';
  modes.innerHTML='<button id="mode-walk">Walk</button><button id="mode-fly">Free flight</button><button id="mode-orbit">Orbit view</button>';$('pane-0').append(modes);
  $('pane-0').insertAdjacentHTML('beforeend','<label for="flight-speed">Flight speed</label><select id="flight-speed"><option value="6">Slow · 6 m/s</option><option value="15" selected>Normal · 15 m/s</option><option value="40">Fast · 40 m/s</option></select><p class="menu-help">WASD to move · drag to look · Shift to boost<br>Flight: R / Space up · F / Ctrl down<br>Walk: E to interact · Esc to pause</p>');
  move('overview','pane-0');
  const cp=$('checkpoint-select'),row=cp.parentElement;
  $('pane-1').append(document.querySelector('label[for="checkpoint-select"]'),row);
  $('checkpoint-buttons').hidden=false;move('checkpoint-buttons','pane-1');
  const sound=$('ambient-toggle').parentElement;sound.querySelector('summary').remove();$('pane-3').append(...sound.childNodes);sound.remove();move('light','pane-3',true);
  const aside=document.querySelector('aside');$('pane-2').append(aside);
  document.querySelector('label[for="place"]').hidden=true;$('place').hidden=true;$('visit').parentElement.hidden=true;
  // Remove obsolete HUD labels; the map retains only scale and altitude.
  for(const node of [...$('nav-content').children])if(node.matches('label,p,small'))node.remove();
  const trigger=document.createElement('button');trigger.id='menu-open';trigger.textContent='Menu · Esc';document.body.append(trigger);
  const activate=i=>{tabs.forEach((_,j)=>{const t=$(`tab-${j}`);t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;$(`pane-${j}`).hidden=i!==j;});};
  tabs.forEach((_,i)=>{const t=$(`tab-${i}`);t.onclick=()=>activate(i);t.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%4;else if(e.key==='ArrowLeft')n=(i+3)%4;else if(e.key==='Home')n=0;else if(e.key==='End')n=3;else return;e.preventDefault();activate(n);$(`tab-${n}`).focus();};});
  function open(){if(menu.open)return;if(!$('stop').disabled)$('stop').click();walker.pause(true);controls.enabled=false;$('interaction').hidden=true;menu.showModal();$('menu-close').focus();}
  function close(){if(menu.open)menu.close();}
  trigger.onclick=open;$('menu-close').onclick=close;
  $('mode-walk').onclick=()=>{walker.start();close();};$('mode-fly').onclick=()=>{walker.fly();close();};$('mode-orbit').onclick=()=>{walker.stop();close();};
  menu.addEventListener('close',()=>{walker.pause(false);controls.enabled=!walker.active&&$('stop').disabled;trigger.focus();});
  menu.addEventListener('cancel',e=>{e.preventDefault();close();});
  menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  addEventListener('keydown',e=>{if(e.code!=='Escape')return;e.preventDefault();e.stopImmediatePropagation();if(menu.open)close();else open();},true);
  for(const id of ['checkpoint-go','visit','freewalk','walk','overview'])$(id).addEventListener('click',close);
  $('checkpoint-buttons').addEventListener('click',e=>{if(e.target.closest('button'))close();});
  const title=document.querySelector('header h1');document.querySelector('header .eyebrow').textContent='FUSHIMI INARI TAISHA';
  let last=0;
  return {update(time){if(time-last<350)return;last=time;
    const nearest=assembly.spatial.anchors.reduce((best,a)=>{const distance=Math.hypot(camera.position.x-a.target[0],camera.position.z-a.target[2]);return !best||distance<best.distance?{a,distance}:best;},null);
    title.textContent=camera.position.y>400?'Inariyama':nearest.distance<45?nearest.a.label:`Trail · ${nearest.a.label}`;
    document.body.dataset.movementMode=walker.mode;
    for(const mode of ['walk','fly','orbit'])$(`mode-${mode}`).setAttribute('aria-pressed',String(walker.mode===mode));
  }};
}
