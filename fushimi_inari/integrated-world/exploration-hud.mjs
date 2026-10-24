import {isRestricted} from '../geography/geo-core.mjs';

export function installExplorationHUD({camera,features,assembly,teleport,getRoute=()=>[]}){
  const panel=document.createElement('section');panel.id='navigation';panel.setAttribute('aria-label','Navigation');
  panel.innerHTML=`<div class="row"><strong>Inariyama map</strong><button id="nav-collapse" aria-label="Collapse minimap">−</button></div>
    <div id="nav-content"><canvas id="walk-map" width="400" height="240" aria-label="Minimap with position and trails"></canvas>
    <div class="row"><span id="nav-location"></span><select id="map-range" aria-label="Minimap scale"><option value="320">Nearby · 320 m</option><option value="1000">Area · 1 km</option><option value="2700">Entire area</option></select></div>
    <small>Rose: trails · amber: stairs · blue: water · dashed: restricted or grade-separated</small>
    <label for="walk-speed">Walking speed</label><select id="walk-speed"><option value="1.6">Stroll · 1.6 m/s</option><option value="3" selected>Brisk · 3 m/s</option><option value="6">Fast · 6 m/s</option><option value="10">Explore · 10 m/s</option></select>
    <label>Quick checkpoints</label><div id="checkpoint-buttons"></div>
    <label for="checkpoint-select">Destination</label><div class="row"><select id="checkpoint-select"></select><button id="checkpoint-go">Teleport</button></div>
    <details><summary>Spring ambience</summary>
    <button id="ambient-toggle">Sound: off</button>
    <label for="ambient-volume">Ambient volume</label><input id="ambient-volume" type="range" min="0" max="100" value="55">
    <label><input id="ambient-birds" type="checkbox" checked> Uguisu · field recording</label>
    <label><input id="ambient-wind" type="checkbox" checked> Breeze and leaves</label>
    <label><input id="ambient-chimes" type="checkbox"> Chimes near tea houses</label>
    <small>Interpretive chimes. <a href="../assets/audio/CREDITS.md" target="_blank" rel="noopener">Audio credits</a></small></details>
    <p>WASD · drag to look · Shift to boost · Esc menu</p></div>`;
  document.body.append(panel);
  panel.querySelector('#ambient-toggle').onclick=()=>{document.getElementById('audio').click();document.getElementById('ambient-toggle').textContent=document.getElementById('audio').textContent;};
  for(const input of panel.querySelectorAll('select'))input.onchange=()=>input.blur();
  const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d');
  const select=panel.querySelector('#checkpoint-select');
  for(const a of assembly.spatial.anchors){
    const option=document.createElement('option');option.value=a.id;option.textContent=a.label;select.append(option);
  }
  select.value='romon';
  const ids=['keihan_platform','keihan_gate','inari_bridge','urasando','inari_platform','omotesando_entry','romon','senbon','okusha','kumataka','yotsu','kojingamine','west_view','sannomine','ninomine','summit','mitsurugi','gozendani'].filter(id=>assembly.spatial.byId[id]);
  for(const id of ids){
    const button=document.createElement('button');button.textContent=id==='yotsu'?'Yotsutsuji · Kyoto view':assembly.spatial.byId[id].label;
    button.setAttribute('aria-label',button.textContent);
    button.onclick=()=>{select.value=id;teleport(id);};panel.querySelector('#checkpoint-buttons').append(button);
  }
  panel.querySelector('#checkpoint-go').onclick=()=>teleport(select.value);
  panel.querySelector('#nav-collapse').onclick=e=>{
    const content=panel.querySelector('#nav-content');content.hidden=!content.hidden;
    e.currentTarget.textContent=content.hidden?'+':'−';
    e.currentTarget.setAttribute('aria-label',content.hidden?'Expand minimap':'Collapse minimap');
  };
  let last=0;
  const secondary=features.pois.filter(p=>p.tags.name&&(p.tags.religion==='shinto'||p.tags.natural==='peak'||p.tags.tourism==='viewpoint')
    &&!assembly.spatial.anchors.some(a=>a.osm===p.id||Math.hypot(a.target[0]-p.point[0],a.target[2]-p.point[2])<10));
  return {update(time){
    if(time-last<150)return;last=time;
    const range=Number(panel.querySelector('#map-range').value),all=range>2000;
    const cx=all?660:camera.position.x,cz=all?-220:camera.position.z;
    const scale=(all?240:canvas.width)/range,px=x=>200+(x-cx)*scale,pz=z=>120+(z-cz)*scale;
    ctx.fillStyle='#edeFE8';ctx.fillRect(0,0,400,240);
    for(const water of features.water){
      if(!water.points.some(p=>Math.abs(p[0]-cx)<range&&Math.abs(p[2]-cz)<range))continue;
      ctx.beginPath();water.points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));
      ctx.fillStyle='#4d8d99';ctx.strokeStyle='#4d8d99';
      if(water.tags.natural==='water')ctx.fill();else ctx.stroke();
    }
    if(assembly.keihanApproach?.canal){
      ctx.beginPath();assembly.keihanApproach.canal.ring.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[1])):ctx.moveTo(px(p[0]),pz(p[1])));ctx.fillStyle='#4d8d99';ctx.fill();
    }
    for(const b of features.buildings){
      if(!b.points.some(p=>Math.abs(p[0]-cx)<range*.6&&Math.abs(p[2]-cz)<range*.5))continue;
      ctx.fillStyle='#abb0a3aa';ctx.beginPath();b.points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));ctx.fill();
    }
    for(const p of features.paths){
      if(!p.points.some(p=>Math.abs(p[0]-cx)<range&&Math.abs(p[2]-cz)<range))continue;
      ctx.strokeStyle=isRestricted(p.tags)?'#c98780':p.tags.highway==='steps'?'#a36b32':'#8f625b';
      ctx.setLineDash(isRestricted(p.tags)||p.tags.tunnel==='yes'||p.tags.bridge==='yes'?[3,3]:[]);
      ctx.lineWidth=p.tags.highway==='steps'?2:1.2;ctx.beginPath();
      p.points.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));ctx.stroke();
    }
    const route=getRoute();
    if(route.length){ctx.setLineDash([]);ctx.strokeStyle='#d64c2e';ctx.lineWidth=2.5;ctx.beginPath();route.forEach((p,i)=>i?ctx.lineTo(px(p[0]),pz(p[2])):ctx.moveTo(px(p[0]),pz(p[2])));ctx.stroke();}
    ctx.setLineDash([]);
    const labels=assembly.spatial.anchors.map(a=>{
      const x=Math.min(px(a.target[0])+6,310),y=pz(a.target[2])-5;
      return {x,y,w:a.label.length*7,h:14};
    });
    for(const p of secondary){
      const x=px(p.point[0]),z=pz(p.point[2]);if(x<0||x>400||z<0||z>240)continue;
      ctx.fillStyle='#6f756b';ctx.fillRect(x-2,z-2,4,4);
      ctx.font='11px system-ui';const name=p.tags['name:en']??p.tags.name;
      const label={x:Math.min(x+5,300),y:z-5,w:ctx.measureText(name).width,h:13};
      if(!all&&z>35&&!labels.some(b=>label.x<b.x+b.w+5&&label.x+label.w+5>b.x&&label.y<b.y+b.h+3&&label.y+label.h+3>b.y)){
        labels.push(label);ctx.fillText(name,label.x,label.y);
      }
    }
    const anchorLabels=[];
    const sortedAnchors=[...assembly.spatial.anchors].sort((a,b)=>Math.hypot(a.target[0]-camera.position.x,a.target[2]-camera.position.z)-Math.hypot(b.target[0]-camera.position.x,b.target[2]-camera.position.z));
    for(const a of sortedAnchors){
      const x=px(a.target[0]),z=pz(a.target[2]);if(x<0||x>400||z<0||z>240)continue;
      ctx.fillStyle='#af322c';ctx.beginPath();ctx.arc(x,z,3,0,Math.PI*2);ctx.fill();
      if(!all&&z>35&&z<190){
        ctx.font='12px system-ui';const w=ctx.measureText(a.label).width;
        const label={x:Math.max(4,Math.min(x+6,396-w)),y:z-5,w,h:14};
        if(!anchorLabels.some(b=>label.x<b.x+b.w+5&&label.x+label.w+5>b.x&&label.y<b.y+b.h+3&&label.y+label.h+3>b.y)){
          anchorLabels.push(label);ctx.fillText(a.label,label.x,label.y);
        }
      }
    }
    // Camera's local -Z transformed by its quaternion, without importing Three.
    const q=camera.quaternion,dx=-2*(q.x*q.z+q.w*q.y),dz=-(1-2*(q.x*q.x+q.y*q.y));
    ctx.save();ctx.translate(px(camera.position.x),pz(camera.position.z));ctx.rotate(Math.atan2(dx,-dz));
    ctx.fillStyle='#b52c27';ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    ctx.fillStyle='#414a3d';ctx.font='14px system-ui';ctx.fillText('N ↑',12,22);
    const meters=all?500:range===1000?100:50;
    ctx.fillRect(12,217,meters*scale,2);ctx.fillText(`${meters} m`,12,208);
    panel.querySelector('#nav-location').textContent=`${Math.round(camera.position.y-1.7)} m ASL`;
    canvas.dataset.position=`${camera.position.x.toFixed(2)},${camera.position.z.toFixed(2)}`;
  }};
}
