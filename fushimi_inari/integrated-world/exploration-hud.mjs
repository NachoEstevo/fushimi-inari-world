export function installExplorationHUD({camera,features,assembly,teleport}){
  const panel=document.createElement('section');panel.id='navigation';panel.setAttribute('aria-label','Navegación a pie');
  panel.innerHTML=`<div class="row"><strong>INARIYAMA</strong><button id="nav-collapse" aria-label="Contraer minimapa">−</button></div>
    <div id="nav-content"><canvas id="walk-map" width="400" height="240" aria-label="Minimapa con posición y caminos"></canvas>
    <div class="row"><span id="nav-location"></span><select id="map-range" aria-label="Escala del minimapa"><option value="320">Cerca · 320 m</option><option value="1000">Sector · 1 km</option><option value="2700">Todo el predio</option></select></div>
    <label for="walk-speed">Velocidad a pie</label><select id="walk-speed"><option value="1.6">Paseo · 1,6 m/s</option><option value="3" selected>Ágil · 3 m/s</option><option value="6">Rápido · 6 m/s</option><option value="10">Explorar · 10 m/s</option></select>
    <label>Ir a un checkpoint</label><div id="checkpoint-buttons"></div>
    <label for="checkpoint-select">Todos los lugares</label><div class="row"><select id="checkpoint-select"></select><button id="checkpoint-go">Ir</button></div>
    <p>WASD · arrastrar para mirar · Shift acelera · Esc salir</p></div>`;
  document.body.append(panel);
  for(const input of panel.querySelectorAll('select'))input.onchange=()=>input.blur();
  const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d');
  const select=panel.querySelector('#checkpoint-select');
  for(const a of assembly.spatial.anchors){
    const option=document.createElement('option');option.value=a.id;option.textContent=a.label;select.append(option);
  }
  select.value='romon';
  const ids=['romon','senbon','okusha','kumataka','yotsu','sannomine','ninomine','summit','mitsurugi','gozendani'];
  for(const id of ids){
    const button=document.createElement('button');button.textContent=assembly.spatial.byId[id].label;
    button.onclick=()=>{select.value=id;teleport(id);};panel.querySelector('#checkpoint-buttons').append(button);
  }
  panel.querySelector('#checkpoint-go').onclick=()=>teleport(select.value);
  panel.querySelector('#nav-collapse').onclick=e=>{
    const content=panel.querySelector('#nav-content');content.hidden=!content.hidden;
    e.currentTarget.textContent=content.hidden?'+':'−';
    e.currentTarget.setAttribute('aria-label',content.hidden?'Expandir minimapa':'Contraer minimapa');
  };
  let last=0;
  return {update(time){
    if(time-last<150)return;last=time;
    const range=Number(panel.querySelector('#map-range').value),all=range>2000;
    const cx=all?660:camera.position.x,cz=all?-220:camera.position.z;
    const scale=(all?240:canvas.width)/range,px=x=>200+(x-cx)*scale,pz=z=>120+(z-cz)*scale;
    ctx.fillStyle='#162c25';ctx.fillRect(0,0,400,240);
    for(const b of features.buildings){
      if(!b.points.some(p=>Math.abs(p[0]-cx)<range*.6&&Math.abs(p[2]-cz)<range*.5))continue;
      ctx.fillStyle='#72857188';ctx.beginPath();b.points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));ctx.fill();
    }
    for(const p of features.paths){
      if(!p.points.some(p=>Math.abs(p[0]-cx)<range&&Math.abs(p[2]-cz)<range))continue;
      ctx.strokeStyle=p.tags.access==='private'?'#806360':p.tags.highway==='steps'?'#edb06c':'#9bb39a';
      ctx.lineWidth=p.tags.highway==='steps'?2:1.2;ctx.beginPath();
      p.points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));ctx.stroke();
    }
    for(const a of assembly.spatial.anchors){
      const x=px(a.target[0]),z=pz(a.target[2]);if(x<0||x>400||z<0||z>240)continue;
      ctx.fillStyle='#efc581';ctx.beginPath();ctx.arc(x,z,3,0,Math.PI*2);ctx.fill();
      if(!all){ctx.font='12px system-ui';ctx.fillText(a.label,Math.min(x+6,310),z-5);}
    }
    // Camera's local -Z transformed by its quaternion, without importing Three.
    const q=camera.quaternion,dx=-2*(q.x*q.z+q.w*q.y),dz=-(1-2*(q.x*q.x+q.y*q.y));
    ctx.save();ctx.translate(px(camera.position.x),pz(camera.position.z));ctx.rotate(Math.atan2(dx,-dz));
    ctx.fillStyle='#fff4dc';ctx.strokeStyle='#15241f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.fillStyle='#e3e6d7';ctx.font='14px system-ui';ctx.fillText('N ↑',12,22);
    const meters=all?500:range===1000?100:50;
    ctx.fillRect(12,217,meters*scale,2);ctx.fillText(`${meters} m`,12,208);
    panel.querySelector('#nav-location').textContent=`${Math.round(camera.position.y-1.7)} m s.n.m.`;
    canvas.dataset.position=`${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`;
  }};
}
