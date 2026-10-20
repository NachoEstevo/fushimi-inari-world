export function installExplorationMenu({walker,controls,camera,assembly}){
  const $=id=>document.getElementById(id);
  const menu=document.createElement('dialog');menu.id='exploration-menu';menu.setAttribute('aria-labelledby','menu-title');
  menu.innerHTML='<div class="menu-heading"><h2 id="menu-title">Tu recorrido</h2><button id="menu-close" aria-label="Cerrar menú">×</button></div><section id="menu-settings"></section><details id="menu-route"><summary>Planificar recorrido y vista</summary></details><p class="menu-help">WASD para caminar · arrastrá para mirar · Shift para correr · E para interactuar</p>';
  document.body.append(menu);
  const settings=$('menu-settings'),content=$('nav-content');
  let node=content.querySelector('label[for="walk-speed"]');
  while(node){const next=node.nextSibling;settings.append(node);node=next;}
  settings.querySelector('p')?.remove();
  settings.querySelector('#checkpoint-buttons')?.previousElementSibling?.remove();
  $('checkpoint-buttons').hidden=true;
  settings.insertBefore($('ambient-toggle'),settings.querySelector('details'));
  $('menu-route').append(document.querySelector('aside'));
  $('menu-route').append($('overview'));
  const trigger=document.createElement('button');trigger.id='menu-open';trigger.textContent='Menú · Esc';document.body.append(trigger);
  function open(){
    if(menu.open)return;
    if(!$('stop').disabled)$('stop').click();
    walker.pause(true);controls.enabled=false;
    $('interaction').hidden=true;menu.showModal();$('menu-close').focus();
  }
  function close(){if(menu.open)menu.close();}
  trigger.onclick=open;$('menu-close').onclick=close;
  menu.addEventListener('close',()=>{walker.pause(false);controls.enabled=!walker.active&&$('stop').disabled;trigger.focus();});
  menu.addEventListener('cancel',e=>{e.preventDefault();close();});
  menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  addEventListener('keydown',e=>{
    if(e.code!=='Escape')return;
    e.preventDefault();e.stopImmediatePropagation();if(menu.open)close();else open();
  },true);
  for(const id of ['checkpoint-go','visit','freewalk','walk','overview'])$(id).addEventListener('click',close);
  const title=document.querySelector('header h1'),eyebrow=document.querySelector('header .eyebrow');
  eyebrow.textContent='伏見稲荷大社 · FUSHIMI INARI';
  let last=0;
  return {update(time){
    if(time-last<350)return;last=time;
    const nearest=assembly.spatial.anchors.reduce((best,a)=>{
      const distance=Math.hypot(camera.position.x-a.target[0],camera.position.z-a.target[2]);
      return !best||distance<best.distance?{a,distance}:best;
    },null);
    title.textContent=camera.position.y>400?'Inariyama':nearest.distance<45?nearest.a.label:`Sendero · ${nearest.a.label}`;
  }};
}
