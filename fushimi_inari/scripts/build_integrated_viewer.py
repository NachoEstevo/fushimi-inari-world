"""Adapt the geographic explorer, keeping the original viewer files untouched."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
out=root/"integrated-world"
html=(root/"geography/index.html").read_text(encoding="utf-8")
html=html.replace('href="style.css"','href="../geography/style.css"><link rel="stylesheet" href="world.css"')
html=html.replace("Inariyama · Territorio a escala real","Fushimi Inari · Mundo integrado")
html=html.replace("La montaña, a su escala.","El recinto y la montaña.")
html=html.replace("ESTUDIO DEL TERRITORIO","MUNDO INTEGRADO · REVISIÓN 10")
html=html.replace('<aside>','''<button id="panels">Ocultar paneles</button><aside>
    <label for="place">Visitar sector integrado</label><select id="place"></select>
    <div class="row"><button id="visit">Visitar</button><button id="freewalk">Caminar · WASD</button></div>
    <label for="light">Iluminación</label><select id="light"><option value="day">Día</option><option value="gold">Atardecer</option><option value="night">Noche</option></select>
    <button id="audio">Sonido: apagado</button>
''')
html=html.replace("Los volúmenes son un blockout, no arquitectura reconstruida.",
                  "Los volúmenes grises son contexto. Los edificios detallados reutilizan el proyecto anterior; su distribución local sigue siendo interpretativa.")
html=html.replace('href="manifest.json"','href="../geography/manifest.json"')
html=html.replace('href="../index.html"','href="../interactive_viewer/index.html"')
html=html.replace('id="landmarks" checked','id="landmarks"')
html=html.replace('id="buildings" checked','id="buildings"')
html=html.replace('<button id="route"', '<label for="branch">Túnel de Senbon</label><select id="branch"><option value="">Automático</option><option value="way/260121328">Primera rama cartografiada</option><option value="way/377968455">Segunda rama cartografiada</option></select><button id="route"')
html=html.replace('<script type="module"', '<div id="interaction" hidden></div><div id="crosshair" hidden>+</div><script type="module"')
(out/"index.html").write_text(html,encoding="utf-8")
js=(root/"geography/viewer.mjs").read_text(encoding="utf-8")
js=js.replace("from './geo-core.mjs'","from '../geography/geo-core.mjs'")
js="import {installExplorationHUD} from './exploration-hud.mjs';\nimport {integrate} from './integration.mjs?v=10c';\nimport {installWalking} from './walking.mjs';\nimport {createAudio} from './audio.mjs';\n"+js
js=js.replace("fetch(`${name}.json`)","fetch(`../geography/${name}.json`)")
js=js.replace("const ground=(x,z)=>heightAt(terrain,x,z);","let assembly=null;\n  const ground=(x,z)=>assembly?assembly.ground(x,z):heightAt(terrain,x,z);")
js=js.replace("renderer.outputColorSpace=", "renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;\n  renderer.outputColorSpace=")
js=js.replace("scene.add(new THREE.HemisphereLight(0xe9f1e3,0x61765f,2.5));","const hemi=new THREE.HemisphereLight(0xe9f1e3,0x61765f,1.6);scene.add(hemi);")
needle="  const terrainGeo=new THREE.BufferGeometry()"
at=js.index(needle)
js=js[:at]+"""  const audio=createAudio();
  assembly=await integrate(scene,renderer,terrain,features,{progress:message=>$('loading').textContent=message,bell:audio.bell,water:audio.water,map:()=>document.body.classList.remove('panels-hidden')});
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:200});
  sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;scene.add(sun.target);
""" +js[at:]
start=js.index("  for(let r=0;r<terrain.rows;r++)")
end=js.index("  terrainGeo.setAttribute",start)
js=js[:start]+"""  for(let r=0;r<terrain.rows-1;r++)for(let c=0;c<terrain.cols-1;c++){
    const x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step;
    const nearby=assembly.spatial.anchors.some(a=>a.radius&&Math.hypot(x+5-a.target[0],z+5-a.target[2])<a.radius*1.5+10);
    const corridor=x>110&&x<1430&&z>-580&&z<330&&(assembly.pathDistance(x+5,z+5)?.distance??100)<8;
    const subdivisions=nearby||corridor?10:1,step=terrain.step/subdivisions;
    for(let iz=0;iz<subdivisions;iz++)for(let ix=0;ix<subdivisions;ix++){
      const sx=x+ix*step,sz=z+iz*step,corners=[[sx,sz],[sx,sz+step],[sx+step,sz],[sx+step,sz+step]];
      for(const j of [0,1,2,2,1,3]){
        const [px,pz]=corners[j],h=assembly.surfaces.terrainHeight(px,pz)-.06;
        indices.push(pos.length/3);pos.push(px,h,pz);
        color.setHSL(.26,.22,.12+h/240*.04);colors.push(color.r,color.g,color.b);
      }
    }
  }
""" +js[end:]
start=js.index("  terrainMaterial.onBeforeCompile")
end=js.index("\n  function meshFrom",start)
js=js[:start]+"""  const courtyard=assembly.legacy.materials.gravelMat.clone();courtyard.color.set('#c2bbae');
  const romon=assembly.spatial.byId.romon;
  const landscape=spatialMeshes(terrainGeo,terrainMaterial,160,(x,z)=>{
    const dx=x-romon.target[0],dz=z-romon.target[2],c=Math.cos(romon.yaw),s=Math.sin(romon.yaw);
    const lx=c*dx-s*dz,lz=s*dx+c*dz;
    return Math.abs(lx)<25&&lz>-20&&lz<22?courtyard:terrainMaterial;
  });scene.add(landscape);terrainGeo.dispose();
""" +js[end:]
js=js.replace("return new THREE.Mesh(geo,material);","const uv=[];for(let i=0;i<vertices.length;i+=3)uv.push(vertices[i]/2,vertices[i+2]/2);geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;return mesh;")
js=js.replace("new THREE.MeshBasicMaterial({color:tint,side:THREE.DoubleSide})","key==='trail'?assembly.legacy.materials.flagstoneMat:new THREE.MeshStandardMaterial({color:tint,roughness:1,side:THREE.DoubleSide})")
js=js.replace("  for(const b of features.buildings){","  for(const b of features.buildings){\n    if(assembly.excludesBuilding(b))continue;")
js=js.replace("new THREE.SphereGeometry(3.2,8,6)","new THREE.SphereGeometry(.65,8,6)")
js=js.replace("new THREE.SphereGeometry(4,12,8)","new THREE.SphereGeometry(.35,12,8)")
js=js.replace("landmarkGroup.add(markers);","landmarkGroup.add(markers);landmarkGroup.visible=false;")
js=js.replace("const buildingGroup=new THREE.Group();scene.add(buildingGroup);","const buildingGroup=new THREE.Group();scene.add(buildingGroup);buildingGroup.visible=false;")
js=js.replace("color:0xff7146,depthTest:false","color:0xff7146,depthTest:true")
js=js.replace("  overview();","  overview();",1)
js=js.replace("  $('loading').remove();trace();","""  const walker=installWalking({camera,renderer,controls,ground,assembly,audio,onStart:()=>{walking=false;$('stop').disabled=true;}});
  for(const a of assembly.spatial.anchors){const option=document.createElement('option');option.value=a.id;option.textContent=a.label;$('place').append(option);}
  function visit(){
    walker.stop();walking=false;controls.enabled=true;
    const a=assembly.spatial.byId[$('place').value],near=nearestNode(graph,a.target,80)?.node.point??a.target;
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
    }else camera.position.set(near[0],ground(near[0],near[2])+2,near[2]);
    controls.update();
    $('position').textContent=`${a.label} · ${a.target[1].toFixed(1)} m s.n.m.`;
  }
  $('visit').onclick=visit;$('place').value='romon';visit();
  const hud=installExplorationHUD({camera,features,assembly,teleport:id=>{
    const anchor=assembly.spatial.byId[id],node=nearestNode(graph,anchor.target,80)?.node;
    if(!node)return;
    const main=assembly.spatial.main;
    let closest=0;for(let i=1;i<main.length;i++)if(Math.hypot(main[i][0]-node.point[0],main[i][2]-node.point[2])<Math.hypot(main[closest][0]-node.point[0],main[closest][2]-node.point[2]))closest=i;
    const point=id==='yotsu'||id==='chaya_s'?[801.414,163.85,-213.322]:id==='chaya_n'?[809.642,171.7,-245.871]:node.point;
    const target=id==='yotsu'?[812.443,166.1,-213.978]:['summit','chaya_n','chaya_s'].includes(id)?anchor.target:main[Math.min(closest+6,main.length-1)];
    if(walker.teleport(point,target)){
      $('place').value=id;$('position').textContent=`${anchor.label} · Listo para caminar`;
      document.body.dataset.checkpoint=id;
    }else $('position').textContent='No se encontró un acceso libre en este checkpoint.';
  }});
  const startGuided=$('walk').onclick;$('walk').onclick=()=>{walker.stop();startGuided();};
  $('panels').onclick=()=>{const hidden=document.body.classList.toggle('panels-hidden');$('panels').textContent=hidden?'Mostrar paneles':'Ocultar paneles';};
  $('audio').onclick=()=>{$('audio').textContent=audio.toggle()?'Sonido: encendido':'Sonido: apagado';document.getElementById('ambient-toggle').textContent=$('audio').textContent;};
  $('light').onchange=()=>{
    const mode=$('light').value;
    sun.intensity=mode==='night'?.18:mode==='gold'?2.8:2.3;
    sun.color.set(mode==='gold'?0xffba75:mode==='night'?0x7c9ad4:0xffebcd);
    hemi.intensity=mode==='night'?.4:1.6;sky.setMode(mode);
    for(const light of assembly.legacy.lanternPointLights){light.intensity=mode==='night'?2:0;light.visible=mode==='night';}
  };$('light').onchange();
  document.body.dataset.inventory=JSON.stringify(assembly.inventory);
  $('loading').remove();trace();
""")
js=js.replace("    }else controls.update();","""    }else if(!walker.update(dt))controls.update();
    sun.target.position.copy(camera.position);sun.target.position.y-=1.7;
    sun.position.copy(sun.target.position).add(new THREE.Vector3(-45,65,35));
    for(const flame of assembly.legacy.flickeringCandleMeshes)flame.scale.y=.88+.12*Math.sin(time*.006+(flame.userData.phase??0));
""")
js=js.replace("  $('overview').onclick=overview;","  $('overview').onclick=()=>{walker.stop();overview();};")
js=js.replace("chosen.splice(1,0,landmarks.find(p=>p.id==='node/6865347485'));","""const branch=features.paths.find(p=>p.id===$('branch').value);
      chosen.splice(1,0,branch?{id:branch.id,tags:{name:'Senbon · rama seleccionada'},point:branch.points[Math.floor(branch.points.length/2)]}:landmarks.find(p=>p.id==='node/6865347485'));""")
js=js.replace("shortestRoute(graph,snapped[i-1].node.id,snapped[i].node.id)","shortestRoute(graph,snapped[i-1].node.id,snapped[i].node.id,new Set($('branch').value?['way/260121328','way/377968455'].filter(id=>id!==$('branch').value):[]))")
js=js.replace("  $('itinerary').onchange=trace;","  $('itinerary').onchange=trace;$('branch').onchange=trace;")
js=js.replace("camera.lookAt(look[0],look[1]+1.7,look[2])","camera.lookAt(look[0],ground(look[0],look[2])+1.7,look[2])")
js=js.replace("y=ground(x,z);","y=assembly.walkHeight(x,z,camera.position.y-1.7);")
js=js.replace("    renderer.render(scene,camera);","""    renderer.render(scene,camera);
    document.body.dataset.drawCalls=renderer.info.render.calls;
    document.body.dataset.camera=[camera.position.x,camera.position.y,camera.position.z].map(v=>v.toFixed(2)).join(',');
    hud.update(time);audio.update(camera,$('light').value==='night');
""")
js="import {installSky} from './sky.mjs';\nimport {spatialMeshes} from './spatial-mesh.mjs';\nimport {renderStats} from './render-stats.mjs';\nimport {buildPathMeshes} from './path-meshes.mjs?v=10b';\n"+js
js=js.replace("  const controls=new OrbitControls", "  const sky=installSky(scene,camera);\n  const controls=new OrbitControls")
js=js.replace("    renderer.render(scene,camera);", "    sky.update();renderer.render(scene,camera);")
js=js.replace("  let mapTimer=0;","  const recordRender=renderStats(renderer);\n  let mapTimer=0;")
js=js.replace("lastTime=time;", "lastTime=time;if(document.hidden)return;")
js=js.replace("    sky.update();renderer.render(scene,camera);","    sky.update();const submitStart=performance.now();renderer.render(scene,camera);recordRender(time,performance.now()-submitStart);")
start=js.index("  const pathGroup=new THREE.Group();")
end=js.index("  // Footprints are sourced.",start)
js=js[:start]+"  const pathGroup=buildPathMeshes(assembly.surfaces,assembly.legacy);scene.add(pathGroup);\n\n"+js[end:]
js=js.replace("const terrainMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});","""const soilLoader=new THREE.TextureLoader();
  const soil=await soilLoader.loadAsync('../assets/textures/nanobanana/surface_forest_soil_leaves.png');
  soil.colorSpace=THREE.SRGBColorSpace;soil.wrapS=soil.wrapT=THREE.RepeatWrapping;soil.anisotropy=8;
  const soilNormal=await soilLoader.loadAsync('../assets/textures/nanobanana/surface_forest_soil_leaves_normal.png');
  soilNormal.wrapS=soilNormal.wrapT=THREE.RepeatWrapping;
  const groundUV=[];for(let i=0;i<pos.length;i+=3)groundUV.push(pos[i]/1.5,pos[i+2]/1.5);
  terrainGeo.setAttribute('uv',new THREE.Float32BufferAttribute(groundUV,2));
  const terrainMaterial=new THREE.MeshStandardMaterial({map:soil,normalMap:soilNormal,normalScale:new THREE.Vector2(.35,.35),roughness:1});""")
(out/"viewer.mjs").write_text(js,encoding="utf-8")
# Retain the original sound synthesis, with a working mute.
source=(root/"interactive_viewer/index.html").read_text(encoding="utf-8")
audio=source[source.index("    function initAmbientAudio()"):source.index("    btnAudio.addEventListener")]
(out/"audio.mjs").write_text("import {createAmbience} from './ambient-audio.mjs';\nexport function createAudio(){let audioCtx=null,audioEnabled=false,ambience=null;\n"+audio.replace("      whiteNoise.start();","      // Continuous legacy noise is replaced by intermittent breeze.\n      whiteNoise.disconnect();filter.disconnect();gain.disconnect();\n      ambience=createAmbience(audioCtx);")+"""
return {bell:()=>{if(audioEnabled)playBellChime();},water:()=>{if(audioEnabled)playWaterSplashSound();},
step:playFootstepTick,update:(camera,night)=>ambience?.update(camera,night),toggle(){initAmbientAudio();audioEnabled=!audioEnabled;ambience.setEnabled(audioEnabled);if(audioEnabled)audioCtx.resume();else audioCtx.suspend();return audioEnabled;}};
}
""",encoding="utf-8")
print("Built integrated explorer and preserved audio synthesis.")
