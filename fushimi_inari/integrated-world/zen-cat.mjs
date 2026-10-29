import * as THREE from 'three';
import {loadCompressedGLB} from './compressed-glb.mjs';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

const CAT_URL=new URL('../assets/models/cat/Mugi.glb?v=cat-natural-2',import.meta.url).href;
// One seated anatomical skin, with all paw IK baked offline.
// Runtime blends authored clips; it never deforms vertices or solves IK on CPU.
export function createZenCat({assembly,camera,journey,onAction=()=>{},loadAsset=()=>loadCompressedGLB(CAT_URL)}){
 const group=new THREE.Group();group.name='Mugi · station cat';group.userData.zenMoment='cat';
 const floor=assembly.keihanStation?.spec?.platformFloor,roots=[],materials=new Set(),geometries=new Set(),textures=new Set(),skeletons=new Set();
 let disposed=false,blocked=false,phase='watching',started=-Infinity,recorded=false,familiar=false,head=null,loaded=false;
 let modelRoot=null,mixer=null,actions=null,current=null,activeTime=0,poseSince=0,nextStretch=11.5,gazeYaw=0;
 const stats={cats:0,loadedModels:0,batches:0,triangles:0,materials:0,lights:0,textures:0,bones:0,clips:0,pose:'idle',loadError:null,get familiar(){return familiar;}};
 if(!Number.isFinite(floor))return {group,interactionRoots:roots,stats,ready:Promise.resolve(),update(){},dispose(){}};
 const recognize=state=>{if(state?.moments?.cat){familiar=true;recorded=true;}};recognize(journey?.snapshot?.());const unsubscribe=journey?.subscribe?.(recognize);
 // The molded seat's back is +Z; its open front and Mugi both face -Z.
 // Leave room for the animated tail in front of the backrest's inset ribs.
 group.position.set(-300.4,floor+.54,-184.975);group.rotation.y=0;roots.push(group);
 function pose(name){
  const next=actions?.[name];if(!next||current===next)return;
  current?.fadeOut(.3);next.reset().setLoop(name==='greet'||name==='groom'?THREE.LoopOnce:THREE.LoopRepeat,name==='greet'||name==='groom'?1:Infinity);
  next.clampWhenFinished=true;if(current)next.fadeIn(.3);else next.setEffectiveWeight(1);
  next.play();current=next;stats.pose=name;poseSince=activeTime;
 }
 const interaction={language:'en',title:'Mugi · station cat',proximity:true,reach:2.5,cooldownMs:700,
  get prompt(){return phase==='watching'?(familiar?'Say hello again to Mugi':'Offer your hand to Mugi'):phase==='greeting'?(familiar?'Gently stroke your familiar friend':'Gently stroke Mugi'):'Say hello to Mugi';},
  directAction(){
   if(disposed||!loaded||blocked||!withinZenInteractionReach(camera,group))return 'Mugi watches the platform.';
   if(phase==='watching'){phase='greeting';started=activeTime;pose('greet');nextStretch=activeTime+20;return familiar?'Mugi remembers your hand and leans close for another quiet hello.':'You offer your hand. Mugi leans forward to sniff.';}
   if(phase==='greeting'&&activeTime-started<.8)return 'Let Mugi come to you.';
   if(phase==='purring'&&activeTime-started<.8)return 'Mugi is still enjoying that gentle stroke.';
   const recognized=familiar;phase='purring';started=activeTime;pose('pet');nextStretch=activeTime+22;if(!recorded){recorded=true;onAction({type:'cat',site:'station',completed:true});}familiar=true;
   onAction({type:'cat.pet',site:'station',completed:true});
   return recognized?'A familiar stroke. Mugi settles beside you and purrs.':'A gentle stroke. Mugi relaxes and purrs.';
  }};
 function releaseModel(){
  mixer?.stopAllAction();if(modelRoot)mixer?.uncacheRoot(modelRoot);mixer=null;actions=null;current=null;
  for(const s of skeletons)s.dispose();for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
  skeletons.clear();textures.clear();geometries.clear();materials.clear();
 }
 const ready=(async()=>{
  const asset=await loadAsset();
  const model=asset?.scene;if(!model)throw new Error('Cat asset has no scene');
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);const list=Array.isArray(o.material)?o.material:[o.material];for(const material of list){if(!material)continue;materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}stats.batches++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  if(disposed){releaseModel();return;}
  head=model.getObjectByName('Mugi_head_gaze');const body=model.getObjectByName('Mugi_body');
  const clips=['idle','groom','greet','pet'].map(name=>asset.animations?.find(clip=>clip.name===`Mugi_${name}`));
  if(!head?.isBone||!body?.isSkinnedMesh||clips.some(clip=>!clip))throw new Error('Cat asset is missing its authored rig or clips');
  modelRoot=model;mixer=new THREE.AnimationMixer(model);actions=Object.fromEntries(clips.map(clip=>[clip.name.slice(5),mixer.clipAction(clip)]));pose('idle');mixer.update(0);model.updateMatrixWorld(true);
  body.computeBoundingSphere();body.boundingSphere.radius+=.045;
  group.add(model);group.userData.interactable=interaction;assembly.root.add(group);assembly.legacy.interactables.push(group);group.updateMatrixWorld(true);loaded=true;
  stats.cats=1;stats.loadedModels=1;stats.materials=materials.size;stats.textures=textures.size;stats.bones=body.skeleton.bones.length;stats.clips=clips.length;
 })().catch(error=>{releaseModel();stats.loadError=error?.message??String(error);});
 return {group,interactionRoots:roots,stats,ready,update(dt,_now,{blocked:hold=false}={}){
  if(disposed)return;blocked=hold;if(!loaded)return;
  const distance=camera.position.distanceToSquared(group.position);group.visible=distance<3600;if(!group.visible||hold)return;
  const step=Number.isFinite(dt)?Math.min(Math.max(dt,0),.1):0;activeTime+=step;
  if(phase==='greeting'&&activeTime-started>15)phase='watching';
  if(phase==='purring'&&activeTime-started>=6){phase='watching';pose('idle');}
  if((stats.pose==='groom'||stats.pose==='greet')&&activeTime-poseSince>=current.getClip().duration-.3){pose('idle');nextStretch=activeTime+25;}
  if(phase==='watching'&&stats.pose==='idle'&&activeTime>=nextStretch)pose('groom');
  mixer.update(step);
  const recognizing=familiar&&distance<16,wanted=Math.atan2(group.position.x-camera.position.x,group.position.z-camera.position.z)-group.rotation.y;
  const yaw=phase==='greeting'||recognizing?THREE.MathUtils.clamp(Math.atan2(Math.sin(wanted),Math.cos(wanted)),-.18,.18):0;
  gazeYaw+=(yaw-gazeYaw)*(1-Math.exp(-step*3));
  // This unkeyed gaze joint avoids accumulating rotations over a mixer track.
  head.rotation.y=gazeYaw;
 },dispose(){if(disposed)return;disposed=true;unsubscribe?.();loaded=false;const index=assembly.legacy.interactables.indexOf(group);if(index>=0)assembly.legacy.interactables.splice(index,1);delete group.userData.interactable;group.removeFromParent();releaseModel();}};
}
