import {installCityPanorama} from './city-panorama.mjs';
import {terrainTriangles} from './terrain-triangles.mjs?v=24';
import {installExplorationMenu} from './exploration-menu.mjs?v=32';
import {installPhotoMode} from './photo-mode.mjs?v=32';
import {protectOrbit} from './orbit-clearance.mjs';
import {installSky} from './sky.mjs?v=32';
import {installFlashlight} from './flashlight.mjs';
import {installVisitors} from './visitors.mjs?v=82';
import {spatialMeshes} from './spatial-mesh.mjs';
import {renderStats} from './render-stats.mjs';
import {distantCanopy} from './distant-canopy.mjs?v=33';
import {blendCourtyardGround} from './courtyard-ground.mjs?v=64';
import {blendEntranceGround} from './entrance-ground.mjs?v=48';
import {makePrecinctGroundCover} from './ground-cover.mjs?v=64';
import {installSeasons} from './seasons.mjs?v=25';
import {buildPathMeshes} from './path-meshes.mjs?v=68-near-precinct';
import {installExplorationHUD} from './exploration-hud.mjs?v=32';
import {integrate} from './integration.mjs?v=83-context';
import {installWalking} from './walking.mjs?v=35';
import {createAudio} from './audio.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {heightAt,buildGraph,nearestNode,shortestRoute,routeMetrics,resample,pathWidth,isRestricted,distance} from '../geography/geo-core.mjs';

const $=id=>document.getElementById(id);
try {
  const [terrain,features,manifest]=await Promise.all(['terrain','features','manifest'].map(async name=>{
    const response=await fetch(`../geography/${name}.json`);if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);return response.json();
  }));
  const width=(terrain.cols-1)*terrain.step, depth=(terrain.rows-1)*terrain.step;
  const cx=terrain.xmin+width/2,cz=terrain.zmin+depth/2;
  let assembly=null;
  const ground=(x,z)=>assembly?assembly.ground(x,z):heightAt(terrain,x,z);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#263c36');
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  $('world').append(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.2,12000);
  const sky=installSky(scene,camera);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=3;controls.maxDistance=6000;
  const hemi=new THREE.HemisphereLight(0xe9f1e3,0x61765f,1.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffebcd,2.3);sun.position.set(-800,1400,-600);scene.add(sun);
  const audio=createAudio();
  assembly=await integrate(scene,renderer,terrain,features,{progress:message=>$('loading').textContent=message,bell:audio.bell,water:audio.water,map:()=>document.body.classList.remove('panels-hidden')});
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:200});
  sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun.target);
  const terrainGeo=new THREE.BufferGeometry();
  const pos=terrainTriangles(terrain,(c,r)=>{
    const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step;
    const nearby=assembly.spatial.anchors.some(a=>a.radius&&Math.hypot(x+5-a.target[0],z+5-a.target[2])<a.radius*1.5+10);
    const corridor=x>110&&x<1430&&z>-580&&z<330&&(assembly.pathDistance(x+5,z+5)?.distance??100)<8;
    return nearby||corridor;
  },(x,z)=>assembly.surfaces.terrainHeight(x,z)-.06);
  terrainGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  terrainGeo.computeVertexNormals();
  const soilLoader=new THREE.TextureLoader();
  const soil=await soilLoader.loadAsync('../assets/textures/nanobanana/surface_forest_soil_leaves.png');
  soil.colorSpace=THREE.SRGBColorSpace;soil.wrapS=soil.wrapT=THREE.RepeatWrapping;soil.anisotropy=8;
  const soilNormal=await soilLoader.loadAsync('../assets/textures/nanobanana/surface_forest_soil_leaves_normal.png');
  soilNormal.wrapS=soilNormal.wrapT=THREE.RepeatWrapping;
  const groundUV=[];for(let i=0;i<pos.length;i+=3)groundUV.push(pos[i]/1.5,pos[i+2]/1.5);
  terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(groundUV,2));
  const cover=[],precinctGrass=[],coverCache=new Map();
  const groundCover=makePrecinctGroundCover(features,{surfaceAreas:assembly.entranceSurfaces});
  for(let i=0;i<pos.length;i+=3){
    const x=pos[i],y=pos[i+1],z=pos[i+2],key=`${x},${z}`;
    if(!coverCache.has(key)){
      const slope=Math.hypot(ground(x+1,z)-ground(x-1,z),ground(x,z+1)-ground(x,z-1))/2;
      const distance=assembly.pathDistance(x,z)?.distance??100;
      coverCache.set(key,[groundCover(x,y,z,slope,distance),groundCover.precinct(x,y,z,slope,distance)]);
    }
    cover.push(coverCache.get(key)[0]);precinctGrass.push(coverCache.get(key)[1]);
  }
  terrainGeo.setAttribute('groundCover',new THREE.Float32BufferAttribute(cover,1));
  terrainGeo.setAttribute('precinctGrass',new THREE.Float32BufferAttribute(precinctGrass,1));
  coverCache.clear();
  const terrainMaterial=new THREE.MeshStandardMaterial({map:soil,normalMap:soilNormal,normalScale:new THREE.Vector2(.35,.35),roughness:1});
  const courtyard=assembly.legacy.materials.gravelMat;
  const romon=assembly.spatial.byId.romon;
  blendCourtyardGround(terrainMaterial,courtyard,romon);
  blendEntranceGround(terrainGeo,terrainMaterial,courtyard,romon,features);
  const landscape=spatialMeshes(terrainGeo,terrainMaterial,160);scene.add(landscape);terrainGeo.dispose();

  function meshFrom(vertices,material){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/2,vertices[i+2]/2);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;return mesh;
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
  const pathGroup=buildPathMeshes(assembly.surfaces,assembly.legacy,assembly.ground);scene.add(pathGroup);

  // Footprints are sourced. Extrusion height is metadata-based or explicitly inferred.
  const buildingGroup=new THREE.Group();scene.add(buildingGroup);buildingGroup.visible=$('buildings').checked;
  const buildings={ordinary:[],sacred:[]};
  let inferredHeightCount=0;
  for(const b of features.buildings){
    if(assembly.excludesBuilding(b))continue;
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
  // Existing OSM footprints, partitioned so offscreen neighbourhoods are culled.
  for(const [kind,tint] of [['ordinary',0xaaa79e],['sacred',0x87796c]]){
    const material=new THREE.MeshLambertMaterial({color:tint,side:THREE.DoubleSide});
    const mesh=meshFrom(buildings[kind],material);
    const normal=mesh.geometry.attributes.normal;
    const shades=[];
    for(let i=0;i<normal.count;i++){
      const shade=Math.abs(normal.getY(i))>.7?.48:1;
      shades.push(shade,shade,shade);
    }
    mesh.geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));material.vertexColors=true;
    const chunks=spatialMeshes(mesh.geometry,material,256);
    for(const child of chunks.children)child.receiveShadow=false;
    buildingGroup.add(chunks);mesh.geometry.dispose();
  }
  const panorama=installCityPanorama(scene,features,ground,assembly.excludesBuilding);
  const canopy=distantCanopy(features,ground,assembly.pathDistance,terrain);scene.add(canopy.group);
  document.body.dataset.aerialContext=JSON.stringify({footprints:features.buildings.length,crowns:canopy.group.userData.count,canopyTriangles:canopy.group.userData.count*20,provenance:'OSM footprints; satellite-interpreted woodland; estimated heights'});

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
    '四ツ辻':'Yotsutsuji','四ツ辻 (Yottsu tsuji)':'Yotsutsuji','四つ辻':'Yotsutsuji','四辻':'Yotsutsuji','三ツ辻':'Mitsutsuji','稲荷山':'Inariyama · summit','稲荷':'JR Inari','伏見稲荷':'Keihan Fushimi-Inari',
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
  const markerGeometry=new THREE.SphereGeometry(.65,8,6),markerMaterial=new THREE.MeshBasicMaterial({color:0xf0b176});
  const markers=new THREE.InstancedMesh(markerGeometry,markerMaterial,landmarks.length),dummy=new THREE.Object3D();
  landmarks.forEach((p,i)=>{dummy.position.set(p.point[0],ground(p.point[0],p.point[2])+12,p.point[2]);dummy.updateMatrix();markers.setMatrixAt(i,dummy.matrix);});
  landmarkGroup.add(markers);landmarkGroup.visible=false;
  const graph=buildGraph(features.paths,terrain);
  let activeRoute=[],routeLine=null,walking=false,routeProgress=0,travelled=0,lastTime=performance.now();
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.35,12,8),new THREE.MeshBasicMaterial({color:0xf5f7dd}));
  marker.visible=false;scene.add(marker);
  function overview(){
    walking=false;controls.enabled=true;
    controls.target.set(650,100,-90);camera.position.set(-1000,1700,1750);camera.up.set(0,1,0);controls.update();
    $('stop').disabled=true;$('walk').textContent=routeProgress>0?'Resume':'Follow route';
    $('position').textContent='Horizontal and vertical scale 1:1';
  }
  overview();
  function profile(points){
    const canvas=$('profile'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);canvas.style.display='block';
    const total=routeMetrics(points).length,lo=Math.min(...points.map(p=>p[1])),hi=Math.max(...points.map(p=>p[1]));
    let along=0;ctx.strokeStyle='#b8382b';ctx.lineWidth=2;ctx.beginPath();
    points.forEach((p,i)=>{if(i)along+=distance(points[i-1],p);const x=12+along/Math.max(total,1)*(w-24),y=h-28-(p[1]-lo)/Math.max(hi-lo,1)*(h-55);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    ctx.fillStyle='#593a33';ctx.font='20px system-ui';ctx.fillText(`${Math.round(lo)}–${Math.round(hi)} m`,12,20);
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
      const branch=features.paths.find(p=>p.id===$('branch').value);
      chosen.splice(1,0,branch?{id:branch.id,tags:{name:'Senbon · rama seleccionada'},point:branch.points[Math.floor(branch.points.length/2)]}:landmarks.find(p=>p.id==='node/6865347485'));
      if(chosen.some(p=>!p))throw new Error('An itinerary landmark is missing from the map');
      $('start').value=chosen[0].id;$('destination').value=chosen.at(-1).id;$('via').value='';
    }
    const snapped=chosen.map(p=>nearestNode(graph,p.point,80));
    if(snapped.some(s=>!s)){$('route-info').textContent='No accessible mapped path within 80 m of a selected point. No connection was invented.';drawMap();return;}
    let route=[];
    for(let i=1;i<snapped.length;i++){
      const segment=shortestRoute(graph,snapped[i-1].node.id,snapped[i].node.id,new Set($('branch').value?['way/260121328','way/377968455'].filter(id=>id!==$('branch').value):[]));
      if(!segment){$('route-info').textContent='These points are on disconnected trail networks. Try another access point.';drawMap();return;}
      route.push(...(i===1?segment:segment.slice(1)));
    }
    activeRoute=resample(route,terrain,2);
    if(activeRoute.length<2){$('route-info').textContent='Start and destination share the same network point.';drawMap();return;}
    const stats=routeMetrics(activeRoute),gaps=snapped.map(s=>Math.round(s.distance));
    $('route-info').textContent=`${(stats.length/1000).toFixed(2)} km · ↑ ${Math.round(stats.ascent)} m · ↓ ${Math.round(stats.descent)} m. Elevation estimated from DEM.`;
    $('route-stops').textContent=chosen.map(displayName).join(' → ');
    $('route-gaps').textContent=`Maximum landmark-to-path distance: ${Math.max(...gaps)} m. Routes reach mapped trail nodes, without invented links to buildings.`;
    routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(activeRoute.map(p=>new THREE.Vector3(p[0],p[1]+1,p[2]))),
      new THREE.LineBasicMaterial({color:0xff7146,depthTest:true}));
    routeLine.renderOrder=20;scene.add(routeLine);profile(activeRoute);$('walk').disabled=false;$('walk').textContent='Follow route';
    marker.position.set(activeRoute[0][0],activeRoute[0][1]+5,activeRoute[0][2]);marker.visible=true;drawMap();
  }
  $('route').onclick=trace;
  $('itinerary').onchange=trace;$('branch').onchange=trace;
  $('overview').onclick=()=>{walker.stop();overview();};
  $('walk').onclick=()=>{
    if(!activeRoute.length)return;
    if(routeProgress>=activeRoute.length-1){routeProgress=0;travelled=0;}
    walking=true;controls.enabled=false;$('stop').disabled=false;$('walk').textContent='Following route…';
  };
  $('stop').onclick=()=>{
    walking=false;controls.target.copy(camera.position).add(new THREE.Vector3(0,0,-10).applyQuaternion(camera.quaternion));
    controls.enabled=true;controls.update();$('stop').disabled=true;$('walk').textContent='Resume';
  };
  $('buildings').onchange=e=>buildingGroup.visible=e.target.checked;
  $('aerial-canopy').onchange=e=>canopy.group.visible=e.target.checked;
  $('paths').onchange=e=>{pathGroup.visible=e.target.checked;drawMap();};
  $('landmarks').onchange=e=>{landmarkGroup.visible=e.target.checked;drawMap();};
  for(const id of ['start','destination','via'])$(id).onchange=()=>{$('itinerary').value='custom';clearRoute();$('route-info').textContent='Selection changed. Plan the new route.';drawMap();};
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
  $('summary').textContent=`${(width/1000).toFixed(2)} × ${(depth/1000).toFixed(2)} km study area · ${features.paths.length.toLocaleString('es')} mapped segments · ${landmarks.length} identified landmarks`;
  const walker=installWalking({camera,renderer,controls,ground,assembly,audio,onStart:()=>{walking=false;$('stop').disabled=true;}});
  for(const a of assembly.spatial.anchors){const option=document.createElement('option');option.value=a.id;option.textContent=a.label;$('place').append(option);}
  function visit(){
    walker.stop();walking=false;controls.enabled=true;
    const a=assembly.spatial.byId[$('place').value],near=a.checkpoint??nearestNode(graph,a.target,80)?.node.point??a.target;
    controls.target.set(a.target[0],a.target[1]+3,a.target[2]);
    if(a.id==='romon'){
      camera.position.set(near[0]-35,ground(near[0]-35,near[2]+14)+8,near[2]+14);
    }else if(a.id==='chaya_s'){
      camera.position.set(798,170,-222);controls.target.set(814,168,-204);
    }else if(a.id==='chaya_n'){
      camera.position.set(804,176,-250);controls.target.set(816,174,-243);
    }else if(a.id==='senbon'){
      const eye=assembly.spatial.twins[0].at(.04).point,target=assembly.spatial.twins[0].at(.07).point;
      camera.position.set(eye[0],ground(eye[0],eye[2])+1.7,eye[2]);
      controls.target.set(target[0],ground(target[0],target[2])+1.7,target[2]);
    }else camera.position.set(near[0],(a.checkpoint?near[1]:ground(near[0],near[2]))+2,near[2]);
    if(a.lookAt)controls.target.set(...a.lookAt);
    controls.update();
    $('position').textContent=`${a.label} · ${a.target[1].toFixed(1)} m ASL`;
  }
  $('visit').onclick=visit;$('place').value='romon';visit();
  const hud=installExplorationHUD({camera,features,assembly,teleport:id=>{
    const anchor=assembly.spatial.byId[id],node=nearestNode(graph,anchor.target,80)?.node;
    if(!node)return;
    const main=['mitsurugi','gozendani'].includes(id)?assembly.spatial.returning:assembly.spatial.main;
    let closest=0;for(let i=1;i<main.length;i++)if(Math.hypot(main[i][0]-node.point[0],main[i][2]-node.point[2])<Math.hypot(main[closest][0]-node.point[0],main[closest][2]-node.point[2]))closest=i;
    const point=anchor.checkpoint??(id==='azumamaro_entry'?[16.91,assembly.surfaces.height(16.91,15.9),15.9]:id==='mitsurugi'?main[closest]:id==='yotsu'||id==='chaya_s'?[801.414,163.85,-213.322]:id==='chaya_n'?[809.642,171.7,-245.871]:node.point);
    const target=anchor.lookAt??(['kojingamine','west_view'].includes(id)?[anchor.target[0]-1000,60,anchor.target[2]+650]:id==='yotsu'?[-800,60,-300]:['summit','chaya_n','chaya_s','temizuya','reception','azumamaro_entry'].includes(id)?anchor.target:main[Math.min(closest+6,main.length-1)]);
    if(walker.teleport(point,target)){
      $('place').value=id;$('position').textContent=`${anchor.label} · Ready to walk`;
      document.body.dataset.checkpoint=id;
    }else $('position').textContent='No clear access found at this checkpoint.';
  }});
  const startGuided=$('walk').onclick;$('walk').onclick=()=>{walker.stop();startGuided();};
  $('panels').onclick=()=>{const hidden=document.body.classList.toggle('panels-hidden');$('panels').textContent=hidden?'Show panels':'Hide panels';};
  $('audio').onclick=()=>{$('audio').textContent=audio.toggle()?'Sound: on':'Sound: off';document.getElementById('ambient-toggle').textContent=$('audio').textContent;};
  $('light').onchange=()=>{
    const mode=$('light').value;
    sun.intensity=mode==='night'?.18:mode==='gold'?2.8:2.3;
    sun.color.set(mode==='gold'?0xffba75:mode==='night'?0x7c9ad4:0xffebcd);
    hemi.intensity=mode==='night'?.4:1.6;sky.setMode(mode);
    for(const light of assembly.legacy.lanternPointLights){light.intensity=mode==='night'?2:0;light.visible=mode==='night';}
  };$('light').onchange();
  const photo=installPhotoMode({renderer,scene,camera,walker,controls,overlays:()=>[routeLine,marker,landmarkGroup]});
  const menu=installExplorationMenu({walker,controls,camera,assembly});
  const flashlight=installFlashlight(scene,camera);
  const visitors=installVisitors(assembly);
  installSeasons(assembly,canopy);
  document.body.dataset.inventory=JSON.stringify(assembly.inventory);
  $('loading').remove();trace();

  const recordRender=renderStats(renderer);
  let mapTimer=0;
  function animate(time){
    requestAnimationFrame(animate);const dt=Math.min(.1,(time-lastTime)/1000);lastTime=time;if(document.hidden)return;
    if(walking&&activeRoute.length>1){
      let remaining=dt*Number($('speed').value);
      while(remaining>0&&routeProgress<activeRoute.length-1){
        const len=distance(activeRoute[routeProgress],activeRoute[routeProgress+1]),step=Math.min(remaining,len-travelled);
        travelled+=step;remaining-=step;
        if(travelled>=len-.0001){routeProgress++;travelled=0;}
      }
      const arrived=routeProgress>=activeRoute.length-1;
      if(arrived){walking=false;$('stop').disabled=true;$('walk').textContent='Restart route';}
      const a=activeRoute[Math.min(routeProgress,activeRoute.length-2)],b=activeRoute[Math.min(routeProgress+1,activeRoute.length-1)];
      const f=routeProgress>=activeRoute.length-1?1:travelled/Math.max(distance(a,b),.0001);
      const x=THREE.MathUtils.lerp(a[0],b[0],f),z=THREE.MathUtils.lerp(a[2],b[2],f),y=assembly.walkHeight(x,z,camera.position.y-1.7);
      camera.position.set(x,y+1.7,z);
      const look=routeProgress>=activeRoute.length-1
        ? [b[0]+b[0]-a[0],b[1],b[2]+b[2]-a[2]]
        : activeRoute[Math.min(routeProgress+5,activeRoute.length-1)];
      camera.lookAt(look[0],ground(look[0],look[2])+1.7,look[2]);marker.position.set(x,y+5,z);
      if(arrived){controls.target.set(look[0],look[1]+1.7,look[2]);controls.enabled=true;}
      $('position').textContent=arrived?`Arrived · ${y.toFixed(1)} m ASL`:`${y.toFixed(1)} m ASL · ${$('speed').value} m/s · eye height 1.70 m`;
      if(time-mapTimer>250){drawMap();mapTimer=time;}
    }else if(!photo.active&&!walker.update(dt)){
      controls.update();
      const guard=protectOrbit(camera,controls,assembly.surfaces.terrainHeight);
      document.body.dataset.orbitClearance=JSON.stringify(guard);
    }
    sun.target.position.copy(camera.position);sun.target.position.y-=1.7;
    sun.position.copy(sun.target.position).add(new THREE.Vector3(-45,65,35));
    for(const flame of assembly.legacy.flickeringCandleMeshes)flame.scale.y=.88+.12*Math.sin(time*.006+(flame.userData.phase??0));

    sky.update();flashlight.update();visitors.update(camera,time/1000);canopy.update(camera);assembly.precinctLife.update(camera);panorama.update(camera,$('buildings').checked);
    for(const {object,bounds} of assembly.forestChunks)object.visible=camera.position.distanceTo(bounds.center)<bounds.radius+400;
    // The neighbourhood massing is an aerial backdrop, never a replacement for
    // detailed architecture at walking distance. Chunk bounds make this cheap.
    for(const chunks of buildingGroup.children)for(const mesh of chunks.children){
      const b=mesh.geometry.boundingSphere;
      mesh.visible=camera.position.distanceTo(b.center)>b.radius+100;
    }
    const submitStart=performance.now();renderer.render(scene,camera);recordRender(time,performance.now()-submitStart);
    document.body.dataset.drawCalls=renderer.info.render.calls;
    document.body.dataset.camera=[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(2)).join(',');
    menu.update(time);hud.update(time);audio.update(camera,$('light').value==='night');

  }
  requestAnimationFrame(animate);
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(error){
  console.error(error);$('loading').textContent=`Could not load geographic data: ${error.message}. Open this page from the local server.`;
}
