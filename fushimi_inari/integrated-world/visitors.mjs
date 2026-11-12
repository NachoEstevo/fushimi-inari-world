import {bindVisitorRig,resetVisitorRig,captureVisitorPose,poseVisitorGait} from './visitor-rig.mjs?v=82';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {createVisitorClothTexture,prepareVisitorTemplate} from './visitor-appearance.mjs';
import {planVisitorRoutes,createVisitorState,stepVisitor} from './visitor-navigation.mjs';
import {createPersonInteraction,posePersonGreeting} from './person-interaction.mjs?v=living-20261105';
import {bindPersonPresence,personGazeTarget,updatePersonGaze,posePersonPresence} from './person-presence.mjs';

export function installVisitors(assembly){
 const routes=planVisitorRoutes(assembly),people=routes.map((route,i)=>{
  const root=new THREE.Group();root.name=`Visitor ${i+1} · ${route.zone}`;assembly.root.add(root);
  const state=createVisitorState(route,i),interaction=createPersonInteraction({seed:i,zone:route.zone});root.position.set(state.x,state.y+.03,state.z);
  root.userData.interactable=interaction.data;assembly.legacy?.interactables?.push(root);return {root,state,interaction,index:i};
 });
 document.body.dataset.visitors=JSON.stringify({count:people.length,zones:routes.map(r=>r.zone),mode:'validated paths; pause, stroll and yield',radius:.48});
 const loader=new GLTFLoader(),files=['Casual_Male','Kimono_Female','Casual_Female'];
 const clothTexture=createVisitorClothTexture(),preparedOwners=new Set(),sources=new Set();let disposed=false;
 const releaseSource=asset=>{const geometries=new Set(),materials=new Set();asset.scene.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of [o.material].flat())materials.add(m);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();};
 const templates=files.map(file=>loader.loadAsync(`../assets/models/visitors/${file}.glb`).then(asset=>{
  if(disposed){releaseSource(asset);return null;}
  sources.add(asset);const prepared=prepareVisitorTemplate(asset,{clothTexture});preparedOwners.add(prepared);return prepared;
 }));
 const ready=Promise.all(people.map((p,i)=>templates[i%3].then(asset=>{
  if(disposed||!asset)return;
  const model=clone(asset.scene),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=(i%2?1.64:1.76)/size.y;
  model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;p.root.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  p.mixer=new THREE.AnimationMixer(model);
  const idle=asset.animations.find(a=>/idle/i.test(a.name))??asset.animations[0];
  if(idle){const action=p.mixer.clipAction(idle);action.play();action.time=i*.63%idle.duration;action.timeScale=.9+i*.04;}
  p.mixer.update(0);
  p.bones=bindPersonPresence(bindVisitorRig(model),model);
 }).catch(error=>console.warn('Visitor asset unavailable',error))));
 const cameraBlocker={x:0,y:0,z:0};
 for(const p of people)p.blockers=people.filter(q=>q!==p).map(q=>q.state).concat(cameraBlocker);
 let lastTime=null,wasBlocked=false;
 return {update(camera,time,options){
  if(disposed)return;
  const blocked=options?.blocked??false;
  const dt=lastTime===null||blocked||wasBlocked?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;wasBlocked=blocked;
  for(const p of people)p.interaction.advance(dt,blocked);
  if(blocked)return;
  const eye=camera.position;cameraBlocker.x=eye.x;cameraBlocker.y=eye.y-1.7;cameraBlocker.z=eye.z;
  for(const p of people){
   const s=p.state,dx=eye.x-s.x,dz=eye.z-s.z,d=Math.hypot(dx,dz);
   p.root.visible=!!p.bones&&d<65&&Math.abs(eye.y-s.y-1.7)<26;if(!p.root.visible||!p.mixer)continue;
   const greeting=p.interaction.progress();
   if(greeting===null)stepVisitor(s,dt,p.blockers);
   else{s.travel=0;const angle=Math.atan2(dx,dz)-s.yaw;s.yaw+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*4);}
   p.root.position.set(s.x,s.y+.03,s.z);p.root.rotation.y=s.yaw;
   p.animationDebt=(p.animationDebt??0)+dt;
   if(p.animationDebt<=0||(d>=20&&p.animationDebt<1/15))continue;
   const animationDt=Math.min(.1,p.animationDebt);p.animationDebt=0;p.animationTime=(p.animationTime??0)+animationDt;
   // Restore the last mixer pose; static tracks may not be written again.
   resetVisitorRig(p.bones);p.mixer.update(animationDt);captureVisitorPose(p.bones);
   p.gait=THREE.MathUtils.damp(p.gait??0,s.travel>0?1:0,9,animationDt);
   poseVisitorGait(p.bones,s.phase,p.gait);
   const target=personGazeTarget(eye.x-s.x,eye.y-s.y-1.55,eye.z-s.z,s.yaw);
   p.gaze=updatePersonGaze(p.gaze??0,target,animationDt);
   posePersonPresence(p.bones,p.animationTime,p.index,p.gait,p.gaze);
   posePersonGreeting(p.bones,greeting,p.interaction.gesture);
  }
 },count:people.length,people,routes,ready,dispose(){
  if(disposed)return;disposed=true;
  for(const p of people){p.mixer?.stopAllAction();if(p.mixer)p.mixer.uncacheRoot(p.mixer.getRoot());const skeletons=new Set();p.root.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const skeleton of skeletons)skeleton.dispose();p.root.removeFromParent();}
  const roots=new Set(people.map(p=>p.root)),interactables=assembly.legacy?.interactables;
  if(interactables)for(let i=interactables.length-1;i>=0;i--)if(roots.has(interactables[i]))interactables.splice(i,1);
  for(const prepared of preparedOwners)prepared.dispose();for(const asset of sources)releaseSource(asset);clothTexture.dispose();
 }};
}
