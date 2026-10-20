import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {heightAt} from '../geography/geo-core.mjs';

const status=document.querySelector('#status');
try {
  const [terrain,placement,features]=await Promise.all(['../geography/terrain.json','placement.json','../geography/features.json'].map(async url=>{
    const response=await fetch(url);if(!response.ok)throw Error(`${url}: ${response.status}`);return response.json();
  }));
  const scene=new THREE.Scene();scene.background=new THREE.Color('#adbcb7');
  scene.fog=new THREE.FogExp2('#adbcb7',.00018);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  document.body.prepend(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,6000);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=2;controls.maxDistance=2600;
  const datum=heightAt(terrain,placement.anchor.x,placement.anchor.z)-placement.gateTerraceAboveSourceDatum;
  const group=new THREE.Group();group.position.set(placement.anchor.x,datum,placement.anchor.z);
  group.rotation.y=placement.yawRadians;group.scale.setScalar(placement.scale);scene.add(group);group.updateMatrixWorld();
  const world=(x,y,z)=>group.localToWorld(new THREE.Vector3(x,y,z));
  scene.add(new THREE.HemisphereLight(0xe4edff,0x576047,2));
  const sun=new THREE.DirectionalLight(0xffe3bd,3.2);sun.position.copy(world(-55,90,40));sun.target.position.copy(world(0,3,0));
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-50,right:50,top:45,bottom:-45,near:1,far:220});
  sun.shadow.normalBias=.035;sun.shadow.bias=-.00012;scene.add(sun,sun.target);

  // Local earthwork is explicit and reversible; the source DEM is never edited.
  function ground(x,z){
    const h=heightAt(terrain,x,z),p=group.worldToLocal(new THREE.Vector3(x,datum,z));
    const outside=Math.max(-25-p.x,p.x-7,Math.abs(p.z)-27,0);
    const blend=THREE.MathUtils.smoothstep(outside,0,12);
    return THREE.MathUtils.lerp(datum-.65,h,blend);
  }
  const positions=[],indices=[],colors=[],color=new THREE.Color();
  for(let r=0;r<terrain.rows;r++)for(let c=0;c<terrain.cols;c++){
    const i=r*terrain.cols+c,x=terrain.xmin+c*terrain.step,z=terrain.zmin+r*terrain.step;
    const h=ground(x,z);positions.push(x,h,z);
    color.setHSL(.26,.22,.10+(h/240)*.055);colors.push(color.r,color.g,color.b);
    if(c<terrain.cols-1&&r<terrain.rows-1)indices.push(i,i+terrain.cols,i+1,i+1,i+terrain.cols,i+terrain.cols+1);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const land=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));land.receiveShadow=true;scene.add(land);
  // Same OSM paths/footprints as the geography explorer. Omit only this demo's
  // replacement zone; contextual volumes remain deliberately untextured.
  const context=new THREE.Group();scene.add(context);
  const inDemo=(x,z)=>{
    const p=group.worldToLocal(new THREE.Vector3(x,datum,z));
    return p.x>-26&&p.x<8&&Math.abs(p.z)<28;
  };
  const lines=[];
  for(const path of features.paths){
    if(path.tags.tunnel==='yes')continue;
    for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i];
      if(inDemo(a[0],a[2])||inDemo(b[0],b[2]))continue;
      lines.push(a[0],ground(a[0],a[2])+.12,a[2],b[0],ground(b[0],b[2])+.12,b[2]);
    }
  }
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  context.add(new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({color:0xbfb19a})));
  const vertices=[];
  for(const building of features.buildings){
    if(building.points.some(p=>inDemo(p[0],p[2])))continue;
    const ring=building.points.slice(0,-1);
    const base=Math.min(...ring.map(p=>ground(p[0],p[2])));
    const height=Number.parseFloat(building.tags.height)||Number.parseFloat(building.tags['building:levels'])*3||5;
    const top=Math.max(...ring.map(p=>ground(p[0],p[2])))+height;
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length];
      const corners=[[a[0],base,a[2]],[b[0],base,b[2]],[b[0],top,b[2]],[a[0],top,a[2]]];
      for(const j of [0,1,2,0,2,3])vertices.push(...corners[j]);
    }
    for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]))
      for(const j of tri)vertices.push(ring[j][0],top,ring[j][2]);
  }
  const contextGeo=new THREE.BufferGeometry();contextGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));contextGeo.computeVertexNormals();
  context.add(new THREE.Mesh(contextGeo,new THREE.MeshStandardMaterial({color:0x78867c,roughness:1,side:THREE.DoubleSide})));

  const loader=new THREE.TextureLoader(),cache=new Map(),texturePromises=[];
  function texture(name,srgb=false){
    if(cache.has(name))return cache.get(name);
    let loaded,failed;
    const promise=new Promise((resolve,reject)=>{loaded=resolve;failed=reject;});
    texturePromises.push(promise);
    // Attach a handler immediately; the aggregate below reports failures.
    promise.catch(()=>{});
    const tex=loader.load(`../assets/textures/nanobanana/${name}`,loaded,undefined,failed);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    if(srgb)tex.colorSpace=THREE.SRGBColorSpace;cache.set(name,tex);return tex;
  }
  function pbr(prefix,color,roughness,normalScale=1){
    return new THREE.MeshStandardMaterial({color,map:texture(`${prefix}_color.png`,true),
      normalMap:texture(`${prefix}_normal.png`),roughnessMap:texture(`${prefix}_roughness.png`),
      normalScale:new THREE.Vector2(normalScale,normalScale),roughness});
  }
  const stone=pbr('stone_ishigaki_moss_leaves',0xc8c6be,.84,1.45);
  const gravel=pbr('surface_courtyard_gravel',0x9e9fa4,.88,1.3);
  const paving=pbr('stone_flagstone_paving',0xd8d5ce,.78,1.25);
  const wood=new THREE.MeshPhysicalMaterial({color:0xffffff,map:texture('wood_vermilion_shuiro_color.png',true),
    normalMap:texture('wood_vermilion_shuiro_normal.png'),roughnessMap:texture('wood_vermilion_shuiro_roughness.png'),
    normalScale:new THREE.Vector2(.85,.85),roughness:.32,clearcoat:.55,clearcoatRoughness:.24});
  const materials=[
    ['Vermilion_ShuIro',wood],
    ['Hiwadabuki_Bark_Roof',pbr('roof_hiwadabuki_bark',0xd8cec4,.82,1.45)],
    ['Copper_Patina_Green',pbr('roof_copper_patina',0xffffff,.65)],
    ['Granite_Stone_Moss',stone],['Flagstone_Walkway',paving],['Courtyard_Gravel_Dark',gravel],
    ['Black_Lacquer_Nemaki',new THREE.MeshStandardMaterial({color:0x121215,roughness:.34,metalness:.25})],
    ['Gold_Kanagu_Leaf',new THREE.MeshStandardMaterial({color:0xd9b35b,roughness:.3,metalness:.75})]
  ];
  const model=await new GLTFLoader().loadAsync('romon-original.glb');
  let meshes=0;
  model.scene.traverse(obj=>{
    if(!obj.isMesh)return;meshes++;obj.castShadow=true;obj.receiveShadow=true;
    const replace=mat=>materials.find(([tag])=>mat.name.includes(tag))?.[1]??mat;
    obj.material=Array.isArray(obj.material)?obj.material.map(replace):replace(obj.material);
  });group.add(model.scene);
  // Continue the retained 1.6m terrace only as far as this demo's gate/wing zone.
  function box(size,position,material){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...position);
    mesh.receiveShadow=true;mesh.castShadow=true;group.add(mesh);
  }
  box([8.5,2.2,52],[1.75,.5,0],gravel);
  box([8.5,.04,7.6],[1.75,1.62,0],paving);
  const views={
    entry:[[-35,6,14],[-3,5,0]],
    gate:[[-18,7,1],[0,7,0]],
    side:[[-9,4.2,-11],[0,5,-3]],
    aerial:[[-500,620,650],[550,65,-60]]
  };
  function view(name){
    camera.fov=name==='gate'?65:48;camera.updateProjectionMatrix();
    const [eye,target]=views[name];camera.position.copy(world(...eye));controls.target.copy(world(...target));controls.update();
    document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===name)));
  }
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>view(button.dataset.view));
  view('entry');
  // GLTF and all requested PBR maps must resolve before hiding loading state.
  await Promise.all(texturePromises);
  status.remove();
  document.body.dataset.loadedMeshes=meshes;
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}catch(error){status.textContent=`No se pudo cargar la demo: ${error.message}`;console.error(error);}
