import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {planVisitorRoutes,createVisitorState,stepVisitor} from './visitor-navigation.mjs';

export function installVisitors(assembly){
 const routes=planVisitorRoutes(assembly),people=routes.map((route,i)=>{
  const root=new THREE.Group();root.name=`Visitor ${i+1} · ${route.zone}`;assembly.root.add(root);
  const state=createVisitorState(route,i);root.position.set(state.x,state.y+.03,state.z);return {root,state};
 });
 document.body.dataset.visitors=JSON.stringify({count:people.length,zones:routes.map(r=>r.zone),mode:'validated paths; pause, stroll and yield',radius:.48});
 const loader=new GLTFLoader(),files=['Casual_Male','Kimono_Female','Casual_Female'];
 const templates=files.map(file=>loader.loadAsync(`../assets/models/visitors/${file}.glb`));
 const ready=Promise.all(people.map((p,i)=>templates[i%3].then(asset=>{
  const model=clone(asset.scene),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=(i%2?1.64:1.76)/size.y;
  model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;p.root.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  p.mixer=new THREE.AnimationMixer(model);
  const idle=asset.animations.find(a=>/idle/i.test(a.name))??asset.animations[0];
  if(idle){const action=p.mixer.clipAction(idle);action.play();action.time=i*.63%idle.duration;action.timeScale=.9+i*.04;}
  p.bones=Object.fromEntries(['UpperLeg.L','UpperLeg.R','LowerLeg.L','LowerLeg.R','UpperArm.L','UpperArm.R','Head'].map(name=>{const bone=model.getObjectByName(name);return [name,bone?{bone,rest:bone.quaternion.clone()}:null];}));
 }).catch(error=>console.warn('Visitor asset unavailable',error))));
 let lastTime=null;
 return {update(camera,time){
  const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
  for(const p of people){
   const s=p.state;p.root.visible=Math.hypot(s.x-camera.position.x,s.z-camera.position.z)<65;if(!p.root.visible||!p.mixer)continue;
   const blockers=people.filter(q=>q!==p).map(q=>q.state);blockers.push({x:camera.position.x,y:camera.position.y-1.7,z:camera.position.z});
   stepVisitor(s,dt,blockers);p.root.position.set(s.x,s.y+.03,s.z);p.root.rotation.y=s.yaw;
   // Reset additive pose before the imported idle clip, avoiding accumulation.
   for(const rig of Object.values(p.bones))if(rig)rig.bone.quaternion.copy(rig.rest);
   p.mixer.update(dt);
   p.gait=THREE.MathUtils.damp(p.gait??0,s.travel>0?1:0,9,dt);
   const swing=Math.sin(s.phase)*.30*p.gait;
   for(const [name,angle]of [['UpperLeg.L',swing],['UpperLeg.R',-swing],['LowerLeg.L',Math.max(0,-Math.sin(s.phase))*.35*p.gait],['LowerLeg.R',Math.max(0,Math.sin(s.phase))*.35*p.gait],['UpperArm.L',-swing*.55],['UpperArm.R',swing*.55]])p.bones[name]?.bone.rotateX(angle);
   if(s.state!=='walk')p.bones.Head?.bone.rotateY(Math.sin(time*.45+people.indexOf(p))*.14);
  }
 },count:people.length,routes,ready};
}
