import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {heightAt,buildGraph,nearestNode,shortestRoute,routeMetrics,resample,pathWidth,isRestricted,distance} from './geo-core.mjs';

const $=id=>document.getElementById(id);
try {
  const [terrain,features,manifest]=await Promise.all(['terrain','features','manifest'].map(async name=>{
    const response=await fetch(`${name}.json`);if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);return response.json();
  }));
  const width=(terrain.cols-1)*terrain.step, depth=(terrain.rows-1)*terrain.step;
  const cx=terrain.xmin+width/2,cz=terrain.zmin+depth/2;
  const ground=(x,z)=>heightAt(terrain,x,z);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#263c36');
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  $('world').append(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.2,12000);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=3;controls.maxDistance=6000;
  scene.add(new THREE.HemisphereLight(0xe9f1e3,0x61765f,2.5));
  const sun=new THREE.DirectionalLight(0xffebcd,2.3);sun.position.set(-800,1400,-600);scene.add(sun);
  const terrainGeo=new THREE.BufferGeometry(), pos=[], colors=[], indices=[];
  const color=new THREE.Color();
  for(let r=0;r<terrain.rows;r++)for(let c=0;c<terrain.cols;c++){
    const i=r*terrain.cols+c,h=terrain.heights[i];
    pos.push(terrain.xmin+c*terrain.step,h,terrain.zmin+r*terrain.step);
    color.setHSL(.26-(h/240)*.05,.14+(h/240)*.12,.25+(h/240)*.13);
    colors.push(color.r,color.g,color.b);
    if(c<terrain.cols-1&&r<terrain.rows-1){const b=i+terrain.cols;indices.push(i,b,i+1,i+1,b,b+1);}
  }
  terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainGeo.setIndex(indices);terrainGeo.computeVertexNormals();
  const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
  terrainMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying float vElevation;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvElevation=position.y;');
    shader.fragmentShader='varying float vElevation;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float level=vElevation/10.0;
      float line=abs(fract(level-0.5)-0.5)/max(fwidth(level),0.0001);
      diffuseColor.rgb*=mix(0.72,1.0,smoothstep(0.0,1.0,line));`);
  };
  scene.add(new THREE.Mesh(terrainGeo,terrainMaterial));

  function meshFrom(vertices,material){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    return new THREE.Mesh(geo,material);
  }
  function appendRibbon(vertices,points,w,offset){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[2]-a[2]);
      if(len<.001)continue;
      const dx=-(b[2]-a[2])/len*w/2,dz=(b[0]-a[0])/len*w/2;
      const corners=[[a[0]+dx,a[2]+dz],[b[0]+dx,b[2]+dz],[b[0]-dx,b[2]-dz],[a[0]-dx,a[2]-dz]]
        .map(([x,z])=>[x,ground(x,z)+offset,z]);
      for(const j of [0,1,2,0,2,3])vertices.push(...corners[j]);
    }
  }
  const pathGroup=new THREE.Group();scene.add(pathGroup);
  const buckets={trail:[],street:[],restricted:[]};
  for(const p of features.paths){
    if(p.tags.tunnel==='yes'||p.tags.bridge==='yes')continue; // no invented surface bridges / tunnel elevations
    const key=isRestricted(p.tags)?'restricted':['path','footway','steps','pedestrian','track'].includes(p.tags.highway)?'trail':'street';
    appendRibbon(buckets[key],resample(p.points,terrain,3),pathWidth(p.tags),.2);
  }
  for(const [key,tint] of [['trail',0xe9c089],['street',0x72847c],['restricted',0x9a7974]]){
    pathGroup.add(meshFrom(buckets[key],new THREE.MeshBasicMaterial({color:tint,side:THREE.DoubleSide})));
  }

  // Footprints are sourced. Extrusion height is metadata-based or explicitly inferred.
  const buildingGroup=new THREE.Group();scene.add(buildingGroup);
  const buildings={ordinary:[],sacred:[]};
  let inferredHeightCount=0;
  for(const b of features.buildings){
    const ring=b.points.slice(0,-1), contour=ring.map(p=>new THREE.Vector2(p[0],p[2]));
    const sacred=b.tags.building==='shrine'||b.tags.religion==='shinto'||b.tags.amenity==='place_of_worship';
    const heightValue=Number.parseFloat(b.tags.height),levels=Number.parseFloat(b.tags['building:levels']);
    const h=Number.isFinite(heightValue)?heightValue:Number.isFinite(levels)?levels*3:sacred?4:6;
    if(!Number.isFinite(heightValue))inferredHeightCount++;
    const base=Math.min(...ring.map(p=>ground(p[0],p[2]))),roof=Math.max(...ring.map(p=>ground(p[0],p[2])))+h;
    const v=buildings[sacred?'sacred':'ordinary'];
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      const q=[[a[0],base,a[2]],[b[0],base,b[2]],[b[0],roof,b[2]],[a[0],roof,a[2]]];
      for(const j of [0,1,2,0,2,3])v.push(...q[j]);
    }
    for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[]))for(const j of triangle)v.push(ring[j][0],roof,ring[j][2]);
  }
  buildingGroup.add(meshFrom(buildings.ordinary,new THREE.MeshStandardMaterial({color:0x94a098,roughness:1,side:THREE.DoubleSide})));
  buildingGroup.add(meshFrom(buildings.sacred,new THREE.MeshStandardMaterial({color:0xbb6348,roughness:1,side:THREE.DoubleSide})));

  const waterVertices=[];
  for(const w of features.water){
    if(w.tags.natural!=='water'||w.points.length<4)continue;
    const ring=w.points.slice(0,-1),contour=ring.map(p=>new THREE.Vector2(p[0],p[2]));
    for(const triangle of THREE.ShapeUtils.triangulateShape(contour,[]))for(const j of triangle){
      const p=ring[j];waterVertices.push(p[0],ground(p[0],p[2])+.3,p[2]);
    }
  }
  scene.add(meshFrom(waterVertices,new THREE.MeshBasicMaterial({color:0x548f94,side:THREE.DoubleSide})));

  const translations={'楼門':'Rōmon','本殿':'Honden','外拝殿':'Gehaiden','内拝殿':'Naihaiden','奥社奉拝所':'Okusha Hōhaisho','熊鷹社':'Kumatakasha','新池':'Shin-ike',
    '一ノ峰':'Ichinomine','二ノ峰':'Ninomine','三ノ峰':'Sannomine','御劔社':'Mitsurugisha','御膳谷奉拝所':'Gozendani Hōhaisho','眼力社':'Ganrikisha',
    '四ツ辻':'Yotsutsuji','四ツ辻 (Yottsu tsuji)':'Yotsutsuji','四つ辻':'Yotsutsuji','四辻':'Yotsutsuji','三ツ辻':'Mitsutsuji','稲荷山':'Inariyama · cumbre','稲荷':'JR Inari','伏見稲荷':'Keihan Fushimi-Inari',
    '奥宮':'Okumiya','荒木神社':'Araki-jinja','伏見神宝神社 本殿':'Fushimi Kandakara-jinja'};
  const displayName=p=>translations[p.tags.name]??p.tags['name:en']??p.tags.name;
  const landmarks=features.pois.filter(p=>p.tags.name&&(p.tags.religion==='shinto'||p.tags.building==='shrine'
    ||p.tags.natural==='peak'||p.tags.natural==='water'||p.tags.railway==='station'||p.tags.tourism==='viewpoint'||p.id==='node/749327219'));
  landmarks.sort((a,b)=>displayName(a).localeCompare(displayName(b)));
  for(const p of landmarks){
    for(const id of ['start','destination','via']){
      const option=document.createElement('option');option.value=p.id;option.textContent=`${displayName(p)} · ${Math.round(p.point[1])} m`;$ (id).append(option);
    }
  }
  const startPoi=landmarks.find(p=>p.tags.name==='楼門')??landmarks[0];
  const endPoi=landmarks.find(p=>p.tags.name==='一ノ峰')??landmarks.at(-1);
  $('start').value=startPoi.id;$('destination').value=endPoi.id;
  const landmarkGroup=new THREE.Group();scene.add(landmarkGroup);
  const markerGeometry=new THREE.SphereGeometry(3.2,8,6),markerMaterial=new THREE.MeshBasicMaterial({color:0xf0b176});
  const markers=new THREE.InstancedMesh(markerGeometry,markerMaterial,landmarks.length),dummy=new THREE.Object3D();
  landmarks.forEach((p,i)=>{dummy.position.set(p.point[0],ground(p.point[0],p.point[2])+12,p.point[2]);dummy.updateMatrix();markers.setMatrixAt(i,dummy.matrix);});
  landmarkGroup.add(markers);
  const graph=buildGraph(features.paths,terrain);
  let activeRoute=[],routeLine=null,walking=false,routeProgress=0,travelled=0,lastTime=performance.now();
  const marker=new THREE.Mesh(new THREE.SphereGeometry(4,12,8),new THREE.MeshBasicMaterial({color:0xf5f7dd}));
  marker.visible=false;scene.add(marker);
  function overview(){
    walking=false;controls.enabled=true;
    controls.target.set(650,100,-90);camera.position.set(-1000,1700,1750);camera.up.set(0,1,0);controls.update();
    $('stop').disabled=true;$('walk').textContent=routeProgress>0?'Continuar':'Recorrer';
    $('position').textContent='Escala horizontal y vertical 1:1';
  }
  overview();
  function profile(points){
    const canvas=$('profile'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);canvas.style.display='block';
    const total=routeMetrics(points).length,lo=Math.min(...points.map(p=>p[1])),hi=Math.max(...points.map(p=>p[1]));
    let along=0;ctx.strokeStyle='#e8b979';ctx.lineWidth=2;ctx.beginPath();
    points.forEach((p,i)=>{if(i)along+=distance(points[i-1],p);const x=12+along/Math.max(total,1)*(w-24),y=h-28-(p[1]-lo)/Math.max(hi-lo,1)*(h-55);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    ctx.fillStyle='#acbdad';ctx.font='20px system-ui';ctx.fillText(`${Math.round(lo)}–${Math.round(hi)} m`,12,20);
  }
  function clearRoute(){
    walking=false;controls.enabled=true;activeRoute=[];routeProgress=0;travelled=0;marker.visible=false;
    $('walk').disabled=true;$('stop').disabled=true;$('profile').style.display='none';$('route-stops').textContent='';$('route-gaps').textContent='';
    if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();routeLine.material.dispose();routeLine=null;}
  }
  function trace(){
    clearRoute();
    $('custom-fields').hidden=$('itinerary').value!=='custom';
    let chosen=[$('start').value,...($('via').value?[$('via').value]:[]),$('destination').value].map(id=>landmarks.find(p=>p.id===id));
    if($('itinerary').value!=='custom'){
      const names=['楼門','奥社奉拝所','熊鷹社','四ツ辻 (Yottsu tsuji)','三ノ峰','二ノ峰','一ノ峰'];
      if($('itinerary').value==='loop')names.push('御劔社','御膳谷奉拝所','四ツ辻 (Yottsu tsuji)','楼門');
      chosen=names.map(name=>landmarks.find(p=>p.tags.name===name));
      chosen.splice(1,0,landmarks.find(p=>p.id==='node/6865347485'));
      if(chosen.some(p=>!p))throw new Error('Falta un hito del itinerario en la cartografía');
      $('start').value=chosen[0].id;$('destination').value=chosen.at(-1).id;$('via').value='';
    }
    const snapped=chosen.map(p=>nearestNode(graph,p.point,80));
    if(snapped.some(s=>!s)){$('route-info').textContent='No hay un camino accesible cartografiado a menos de 80 m de uno de estos puntos. No se inventó una conexión.';drawMap();return;}
    let route=[];
    for(let i=1;i<snapped.length;i++){
      const segment=shortestRoute(graph,snapped[i-1].node.id,snapped[i].node.id);
      if(!segment){$('route-info').textContent='Estos puntos pertenecen a componentes desconectados de la red disponible. Probá otro acceso; falta validar la conexión.';drawMap();return;}
      route.push(...(i===1?segment:segment.slice(1)));
    }
    activeRoute=resample(route,terrain,2);
    if(activeRoute.length<2){$('route-info').textContent='Origen y destino coinciden en el mismo punto de la red.';drawMap();return;}
    const stats=routeMetrics(activeRoute),gaps=snapped.map(s=>Math.round(s.distance));
    $('route-info').textContent=`${(stats.length/1000).toFixed(2)} km · ↑ ${Math.round(stats.ascent)} m · ↓ ${Math.round(stats.descent)} m. Desnivel estimado sobre DEM.`;
    $('route-stops').textContent=chosen.map(displayName).join(' → ');
    $('route-gaps').textContent=`Separación máxima entre hito y nodo: ${Math.max(...gaps)} m. Se recorre hasta los nodos del camino; no se agregan conexiones ficticias hasta los edificios.`;
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(activeRoute.map(p=>new THREE.Vector3(p[0],p[1]+1,p[2]))),
      new THREE.LineBasicMaterial({color:0xff7146,depthTest:false}));
    routeLine.renderOrder=20;scene.add(routeLine);profile(activeRoute);$('walk').disabled=false;$('walk').textContent='Recorrer';
    marker.position.set(activeRoute[0][0],activeRoute[0][1]+5,activeRoute[0][2]);marker.visible=true;drawMap();
  }
  $('route').onclick=trace;
  $('itinerary').onchange=trace;
  $('overview').onclick=overview;
  $('walk').onclick=()=>{
    if(!activeRoute.length)return;
    if(routeProgress>=activeRoute.length-1){routeProgress=0;travelled=0;}
    walking=true;controls.enabled=false;$('stop').disabled=false;$('walk').textContent='Recorriendo…';
  };
  $('stop').onclick=()=>{
    walking=false;controls.target.copy(camera.position).add(new THREE.Vector3(0,0,-10).applyQuaternion(camera.quaternion));
    controls.enabled=true;controls.update();$('stop').disabled=true;$('walk').textContent='Continuar';
  };
  $('buildings').onchange=e=>buildingGroup.visible=e.target.checked;
  $('paths').onchange=e=>{pathGroup.visible=e.target.checked;drawMap();};
  $('landmarks').onchange=e=>{landmarkGroup.visible=e.target.checked;drawMap();};
  for(const id of ['start','destination','via'])$(id).onchange=()=>{$('itinerary').value='custom';clearRoute();$('route-info').textContent='Selección cambiada. Trazá el nuevo recorrido.';drawMap();};
  const map=$('map'),ctx=map.getContext('2d'),pad=15;
  const scale=Math.min((map.width-2*pad)/width,(map.height-2*pad)/depth);
  const mx=x=>pad+(x-terrain.xmin)*scale,mz=z=>pad+(z-terrain.zmin)*scale;
  const relief=document.createElement('canvas');relief.width=terrain.cols;relief.height=terrain.rows;
  const rc=relief.getContext('2d'),im=rc.createImageData(terrain.cols,terrain.rows);
  terrain.heights.forEach((h,i)=>{
    const c=i%terrain.cols,r=Math.floor(i/terrain.cols);
    const slope=(terrain.heights[r*terrain.cols+Math.max(0,c-1)]-terrain.heights[r*terrain.cols+Math.min(terrain.cols-1,c+1)])*.6;
    const v=35+h*.2+slope;im.data.set([v*.82,v*1.12,v*.94,255],i*4);
  });rc.putImageData(im,0,0);
  function drawMap(){
    ctx.clearRect(0,0,map.width,map.height);ctx.drawImage(relief,pad,pad,width*scale,depth*scale);
    if($('paths').checked)for(const p of features.paths){
      ctx.strokeStyle=isRestricted(p.tags)?'#98756e':['footway','path','steps','pedestrian','track'].includes(p.tags.highway)?'#d6b78088':'#a4b1a43a';
      ctx.lineWidth=1;ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.stroke();
    }
    for(const p of features.water.filter(w=>w.tags.natural==='water')){
      ctx.fillStyle='#568c99';ctx.beginPath();p.points.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.fill();
    }
    if(activeRoute.length){ctx.strokeStyle='#ff8c5f';ctx.lineWidth=3;ctx.beginPath();activeRoute.forEach((q,i)=>i?ctx.lineTo(mx(q[0]),mz(q[2])):ctx.moveTo(mx(q[0]),mz(q[2])));ctx.stroke();}
    if($('landmarks').checked)for(const p of landmarks){
      ctx.fillStyle='#e1c69f';ctx.beginPath();ctx.arc(mx(p.point[0]),mz(p.point[2]),2.5,0,Math.PI*2);ctx.fill();
    }
    for(const id of [$('start').value,$('destination').value,$('via').value].filter(Boolean)){
      const p=landmarks.find(p=>p.id===id);ctx.fillStyle='#fff5d8';ctx.font='18px system-ui';
      ctx.fillText(displayName(p),Math.min(map.width-140,mx(p.point[0])+8),mz(p.point[2])-8);
    }
    if(marker.visible){ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(mx(marker.position.x),mz(marker.position.z),5,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#d8e2d3';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad,map.height-12);ctx.lineTo(pad+500*scale,map.height-12);ctx.stroke();
    ctx.fillStyle='#ccd8c9';ctx.font='16px system-ui';ctx.fillText('500 m',pad,map.height-20);
  }
  map.onclick=e=>{
    const rect=map.getBoundingClientRect(),x=(e.clientX-rect.left)*map.width/rect.width,z=(e.clientY-rect.top)*map.height/rect.height;
    let best=null,d=18;for(const p of landmarks){const gap=Math.hypot(mx(p.point[0])-x,mz(p.point[2])-z);if(gap<d){d=gap;best=p;}}
    if(best){$('itinerary').value='custom';$('destination').value=best.id;trace();controls.target.set(best.point[0],best.point[1],best.point[2]);camera.position.set(best.point[0]-120,best.point[1]+160,best.point[2]+160);}
  };
  const raycaster=new THREE.Raycaster();
  renderer.domElement.addEventListener('dblclick',e=>{
    raycaster.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);
    const hit=raycaster.intersectObject(markers)[0];
    if(hit&&landmarkGroup.visible){$('itinerary').value='custom';$('destination').value=landmarks[hit.instanceId].id;trace();}
  });
  $('summary').textContent=`${(width/1000).toFixed(2)} × ${(depth/1000).toFixed(2)} km de estudio · ${features.paths.length.toLocaleString('es')} tramos cartografiados · ${landmarks.length} puntos identificados`;
  $('loading').remove();trace();
  let mapTimer=0;
  function animate(time){
    requestAnimationFrame(animate);const dt=Math.min(.1,(time-lastTime)/1000);lastTime=time;
    if(walking&&activeRoute.length>1){
      let remaining=dt*Number($('speed').value);
      while(remaining>0&&routeProgress<activeRoute.length-1){
        const len=distance(activeRoute[routeProgress],activeRoute[routeProgress+1]),step=Math.min(remaining,len-travelled);
        travelled+=step;remaining-=step;
        if(travelled>=len-.0001){routeProgress++;travelled=0;}
      }
      const arrived=routeProgress>=activeRoute.length-1;
      if(arrived){walking=false;$('stop').disabled=true;$('walk').textContent='Volver a recorrer';}
      const a=activeRoute[Math.min(routeProgress,activeRoute.length-2)],b=activeRoute[Math.min(routeProgress+1,activeRoute.length-1)];
      const f=routeProgress>=activeRoute.length-1?1:travelled/Math.max(distance(a,b),.0001);
      const x=THREE.MathUtils.lerp(a[0],b[0],f),z=THREE.MathUtils.lerp(a[2],b[2],f),y=ground(x,z);
      camera.position.set(x,y+1.7,z);
      const look=routeProgress>=activeRoute.length-1
        ? [b[0]+b[0]-a[0],b[1],b[2]+b[2]-a[2]]
        : activeRoute[Math.min(routeProgress+5,activeRoute.length-1)];
      camera.lookAt(look[0],look[1]+1.7,look[2]);marker.position.set(x,y+5,z);
      if(arrived){controls.target.set(look[0],look[1]+1.7,look[2]);controls.enabled=true;}
      $('position').textContent=arrived?`Llegada · ${y.toFixed(1)} m s.n.m.`:`${y.toFixed(1)} m s.n.m. · ${$('speed').value} m/s · altura de ojos 1,70 m`;
      if(time-mapTimer>250){drawMap();mapTimer=time;}
    }else controls.update();
    renderer.render(scene,camera);
  }
  requestAnimationFrame(animate);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(error){
  console.error(error);$('loading').textContent=`No se pudo cargar la base geográfica: ${error.message}. Abrí esta página desde el servidor local.`;
}
