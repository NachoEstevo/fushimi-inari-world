import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import {bloom} from 'three/addons/tsl/display/BloomNode.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildKeihanStation} from './keihan-station.mjs';
import {createStationMaterialStudy} from './webgpu-station-materials.mjs';
import {createStationReflectionStudy} from './webgpu-station-reflections.mjs';

// One renderer and one Three namespace: the existing station imports `three`.
const forcedFallback=new URLSearchParams(location.search).get('backend')==='webgl';
const renderer=new THREE.WebGPURenderer({antialias:true,forceWebGL:forcedFallback});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
document.querySelector('#stage').append(renderer.domElement);
await renderer.init();
const nativeWebGPU=renderer.backend.isWebGPUBackend===true;
document.querySelector('#status').textContent=nativeWebGPU?'● WebGPU activo':'● WebGL2 · '+(forcedFallback?'fallback solicitado':'fallback automático');
renderer.domElement.dataset.backend=nativeWebGPU?'webgpu':'webgl2';

const response=await fetch('../geography/features.json');
if(!response.ok)throw new Error(`Mapa de estación: HTTP ${response.status}`);
const features=await response.json();
const scene=new THREE.Scene();
const station=buildKeihanStation(scene,{},features,{height:()=>30.03});
if(!station.built)throw new Error(station.reason||'No se pudo construir la estación');
scene.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
// Neutral studio IBL supplies readable metals without replacing the outdoor sun.
const room=new RoomEnvironment();
const pmrem=new THREE.PMREMGenerator(renderer);
await pmrem.compileCubemapShader();
const environment=pmrem.fromScene(room,.04);
scene.environment=environment.texture;
scene.environmentIntensity=.30;
room.dispose();pmrem.dispose();
const materialStudy=createStationMaterialStudy(station);
const reflectionStudy=await createStationReflectionStudy({renderer,scene,station});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:'#8b9380',roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.set(-310,29.65,-210);ground.receiveShadow=true;scene.add(ground);
const hemisphere=new THREE.HemisphereLight('#d7e8ff','#6f7462',2.0);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff0ce',3.2);sun.position.set(-270,85,-100);sun.target.position.set(-308,31,-178);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:220});
sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.001;sun.shadow.normalBias=.10;scene.add(sun,sun.target);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,1400);
const practicals=new THREE.Group();scene.add(practicals);
for(const z of [-163,-176,-189]){const light=new THREE.SpotLight('#fff1dc',18,11,1.25,.8,2);light.position.set(-302.4,33.65,z);light.target.position.set(-302.4,30.93,z);practicals.add(light,light.target);}
let enhancedLighting=false;
function studyLighting(){const look=looks[activeLook];practicals.visible=enhancedLighting&&activeSubject==='station';hemisphere.intensity=look.ambient*(enhancedLighting?.72:1);}
function refreshReflection(){if(!reflectionStudy.stats.enabled||activeSubject!=='station')return;try{reflectionStudy.capture();document.querySelector('#study-status').textContent='Reflejo local del andén · captura estática de 128 px';}catch(error){document.querySelector('#study-status').textContent=`Reflejo no disponible: ${error.message}`;}}
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2;controls.maxDistance=200;controls.maxPolarAngle=Math.PI*.49;
const views={entrance:{eye:[-282,36,-114],target:[-303,32,-142]},platform:{eye:[-303.7,32.6,-157],target:[-302,32.3,-182]},train:{eye:[-302.8,32.6,-171],target:[-309,32.4,-178]}};
function selectView(name){const view=views[name];camera.position.set(...view.eye);controls.target.set(...view.target);controls.update();document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===name)));}

// Official r180 TSL bloom graph; strength is separate from exposure.
const post=new THREE.RenderPipeline(renderer);
const scenePass=pass(scene,camera),color=scenePass.getTextureNode('output');
const bloomPass=bloom(color,.2,.35,1.15);
post.outputNode=color.add(bloomPass);
const looks={
 natural:{sky:'#c3d7df',fog:'#c3d7df',sun:'#fff0ce',hemi:'#d7e8ff',floor:'#68725e',intensity:3.2,ambient:.85,exposure:1,bloom:.2,threshold:1.15,radius:.35,sunPosition:[-270,85,-100],environment:.3,description:'Luz de tarde · materiales y sombras suaves'},
 sakura:{sky:'#e9b9c6',fog:'#e9b9c6',sun:'#ffbc91',hemi:'#f4c7e4',floor:'#766278',intensity:3.6,ambient:.75,exposure:1.08,bloom:.36,threshold:1.05,radius:.5,sunPosition:[-250,48,-95],environment:.35,description:'Atardecer rosa · pétalos en suspensión'},
 dreamcore:{sky:'#dce8cf',fog:'#dce8cf',sun:'#ffffe7',hemi:'#d6dbff',floor:'#8c9e76',intensity:5,ambient:1,exposure:1.6,bloom:.85,threshold:.78,radius:.7,sunPosition:[-270,65,-100],environment:.5,description:'Dreamcore · blancos velados y halos intensos'}
};
let activeLook='natural',activeSubject='station',elapsed=0,romon=null,romonView=null,loadingRomon=false;
const motion=document.querySelector('#motion');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
motion.checked=!reducedMotion.matches;
reducedMotion.addEventListener('change',event=>{motion.checked=!event.matches;});
// A fixed, bounded batch: no growing particles or individual draw calls.
const petalGeometry=new THREE.SphereGeometry(1,6,4);
petalGeometry.scale(.075,.012,.135);
const petals=new THREE.InstancedMesh(petalGeometry,new THREE.MeshStandardMaterial({color:'#ffd9e7',roughness:.85,side:THREE.DoubleSide}),160);
petals.frustumCulled=false;petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(petals);
const dummy=new THREE.Object3D();
const seeds=Array.from({length:160},(_,i)=>({x:-326+((i*73)%100)/100*35,z:-202+((i*47)%100)/100*85,y:((i*31)%100)/100*12,phase:i*2.399}));
function updatePetals(){seeds.forEach((seed,i)=>{dummy.position.set(seed.x+Math.sin(elapsed*.4+seed.phase)*1.7,31+(seed.y-elapsed*.65%12+12)%12,seed.z+Math.sin(elapsed*.3+seed.phase)*1.4);dummy.rotation.set(seed.phase+elapsed*.7,seed.phase*.5,elapsed*.5+seed.phase);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);});petals.instanceMatrix.needsUpdate=true;}
function slider(id,value){const input=document.querySelector(`#${id}`);input.value=value;document.querySelector(`#${id}-value`).value=Number(value).toFixed(2);}
function selectLook(name){activeLook=name;const look=looks[name];scene.background=new THREE.Color(look.sky);scene.fog=new THREE.FogExp2(look.fog,name==='dreamcore'?.007:.0025);hemisphere.color.set(look.hemi);hemisphere.groundColor.set(look.floor);hemisphere.intensity=look.ambient;sun.color.set(look.sun);sun.intensity=look.intensity;sun.position.set(...look.sunPosition);scene.environmentIntensity=look.environment;renderer.toneMappingExposure=look.exposure;bloomPass.strength.value=look.bloom;bloomPass.threshold.value=look.threshold;bloomPass.radius.value=look.radius;petals.visible=name==='sakura';slider('exposure',look.exposure);slider('bloom',look.bloom);document.querySelector('#description').textContent=look.description;document.querySelectorAll('[data-look]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.look===name)));}
document.querySelector('#looks').addEventListener('click',event=>{if(event.target.dataset.look)selectLook(event.target.dataset.look);});
document.querySelector('#looks').addEventListener('click',()=>{studyLighting();refreshReflection();});
document.querySelector('#materials-study').addEventListener('change',event=>{materialStudy.setEnabled(event.target.checked);refreshReflection();});
document.querySelector('#lighting-study').addEventListener('change',event=>{enhancedLighting=event.target.checked;studyLighting();refreshReflection();});
document.querySelector('#reflection-study').addEventListener('change',event=>{try{reflectionStudy.setEnabled(event.target.checked&&activeSubject==='station');refreshReflection();}catch(error){event.target.checked=false;document.querySelector('#study-status').textContent=`Reflejo no disponible: ${error.message}`;}});
async function selectSubject(name){
 if(loadingRomon)return;
 if(name==='romon'&&!romon){
  loadingRomon=true;
  const button=document.querySelector('[data-subject="romon"]');button.disabled=true;button.textContent='Cargando…';
  try{
   const gltf=await new GLTFLoader().loadAsync('./romon.glb');
   romon=new THREE.Group();romon.name='Rōmon · original project GLB';romon.add(gltf.scene);
   const bounds=new THREE.Box3().setFromObject(romon),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
   if(bounds.isEmpty()||!Number.isFinite(size.length()))throw new Error('El GLB no tiene límites válidos');
   // Translation only: original materials, scale, rotation and mesh transforms stay intact.
   romon.position.set(-308-center.x,30.03-bounds.min.y,-160-center.z);
   romon.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
   const height=Math.max(size.y,1),distance=Math.max(size.x,size.y,size.z)*1.65;
   romonView={eye:[-308+distance*.48,30.03+height*.65,-160+distance],target:[-308,30.03+height*.43,-160]};
   romon.userData.sourceBounds={size:size.toArray(),center:center.toArray()};
   romon.visible=false;scene.add(romon);
  }catch(error){romon=null;const box=document.querySelector('#error');box.hidden=false;box.textContent=`No se pudo cargar Rōmon: ${error.message}`;return;}
  finally{loadingRomon=false;button.disabled=false;button.textContent='Rōmon';}
 }
 activeSubject=name;station.group.visible=name==='station';if(romon)romon.visible=name==='romon';
 reflectionStudy.setEnabled(name==='station'&&document.querySelector('#reflection-study').checked);studyLighting();
 document.querySelector('#study-controls').disabled=name!=='station';
 refreshReflection();
 ground.position.set(-310,29.65,name==='romon'?-160:-210);
 petals.visible=activeLook==='sakura';
 document.querySelectorAll('[data-subject]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.subject===name)));
 document.querySelectorAll('[data-view]').forEach(button=>{button.disabled=name==='romon';});
 if(name==='romon'){camera.position.set(...romonView.eye);controls.target.set(...romonView.target);controls.maxDistance=Math.max(200,camera.position.distanceTo(controls.target)*3);controls.update();}
 else{controls.maxDistance=200;selectView('entrance');}
}
document.querySelector('#subjects').addEventListener('click',event=>{if(event.target.dataset.subject)void selectSubject(event.target.dataset.subject);});
document.querySelector('#views').addEventListener('click',event=>{if(event.target.dataset.view&&activeSubject==='station')selectView(event.target.dataset.view);});
for(const id of ['exposure','bloom'])document.querySelector(`#${id}`).addEventListener('input',event=>{const value=Number(event.target.value);slider(id,value);if(id==='exposure')renderer.toneMappingExposure=value;else bloomPass.strength.value=value;});
document.querySelector('#reset').addEventListener('click',()=>{for(const id of ['materials-study','lighting-study','reflection-study'])document.querySelector(`#${id}`).checked=false;materialStudy.setEnabled(false);reflectionStudy.setEnabled(false);enhancedLighting=false;selectLook('natural');void selectSubject('station');elapsed=0;motion.checked=!reducedMotion.matches;updatePetals();document.querySelector('#study-status').textContent='Activá cada capa para comparar con la base.';});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);});
selectView('platform');selectLook('natural');updatePetals();studyLighting();
let previous=performance.now(),failed=false;
function frame(now){if(failed||document.hidden)return;const dt=Math.min((now-previous)/1000,.05);previous=now;controls.update();if(activeLook==='sakura'&&motion.checked){elapsed+=dt;updatePetals();}try{post.render();}catch(error){failed=true;renderer.setAnimationLoop(null);const box=document.querySelector('#error');box.hidden=false;box.textContent=`Error de renderizado: ${error.message}`;document.querySelector('#status').textContent='Error de renderizado';}}
document.addEventListener('visibilitychange',()=>{previous=performance.now();renderer.setAnimationLoop(document.hidden?null:frame);});
renderer.setAnimationLoop(document.hidden?null:frame);
