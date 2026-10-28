import * as THREE from 'three';
import {loadCompressedGLB} from './compressed-glb.mjs';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

const CAT_URL=new URL('../assets/models/cat/Mugi.glb',import.meta.url).href;
// byzmod3d's CC0 cat, converted offline to two meshes and one vertex-color coat.
// Model source and exact conversion changes live beside the local asset.
export function createZenCat({assembly,camera,journey,onAction=()=>{},loadAsset=()=>loadCompressedGLB(CAT_URL)}){
 const group=new THREE.Group();group.name='Mugi · station cat';group.userData.zenMoment='cat';
 const floor=assembly.keihanStation?.spec?.platformFloor,roots=[],materials=new Set(),geometries=new Set(),textures=new Set();
 let disposed=false,blocked=false,time=0,phase='watching',started=-Infinity,recorded=false,familiar=false,head=null,loaded=false;
 const stats={cats:0,loadedModels:0,batches:0,triangles:0,materials:0,lights:0,textures:0,loadError:null,get familiar(){return familiar;}};
 if(!Number.isFinite(floor))return {group,interactionRoots:roots,stats,ready:Promise.resolve(),update(){},dispose(){}};
 const recognize=state=>{if(state?.moments?.cat){familiar=true;recorded=true;}};recognize(journey?.snapshot?.());const unsubscribe=journey?.subscribe?.(recognize);
 // The molded seat's back is +Z; its open front and Mugi both face -Z.
 group.position.set(-300.4,floor+.54,-184.9);group.rotation.y=0;roots.push(group);
 const interaction={language:'en',title:'Mugi · station cat',proximity:true,reach:2.5,cooldownMs:700,
  get prompt(){return phase==='watching'?(familiar?'Say hello again to Mugi':'Offer your hand to Mugi'):phase==='greeting'?(familiar?'Gently stroke your familiar friend':'Gently stroke Mugi'):'Say hello to Mugi';},
  directAction(){
   if(disposed||!loaded||blocked||!withinZenInteractionReach(camera,group))return 'Mugi watches the platform.';
   if(phase==='watching'){phase='greeting';started=time;return familiar?'Mugi remembers your hand and leans close for another quiet hello.':'You offer your hand. Mugi leans forward to sniff.';}
   if(phase==='greeting'&&time-started<.8)return 'Let Mugi come to you.';
   if(phase==='purring'&&time-started<.8)return 'Mugi is still enjoying that gentle stroke.';
   const recognized=familiar;phase='purring';started=time;if(!recorded){recorded=true;onAction({type:'cat',site:'station',completed:true});}familiar=true;
   onAction({type:'cat.pet',site:'station',completed:true});
   return recognized?'A familiar stroke. Mugi settles beside you and purrs.':'A gentle stroke. Mugi relaxes and purrs.';
  }};
 function releaseModel(){for(const t of textures)t.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();textures.clear();geometries.clear();materials.clear();}
 const ready=(async()=>{
  const asset=await loadAsset();
  const model=asset?.scene;if(!model)throw new Error('Cat asset has no scene');
  model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;geometries.add(o.geometry);const list=Array.isArray(o.material)?o.material:[o.material];for(const material of list){if(!material)continue;materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}stats.batches++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  if(disposed){releaseModel();return;}
  head=model.getObjectByName('Mugi_head');if(!head||!model.getObjectByName('Mugi_body'))throw new Error('Cat asset is missing its authored parts');
  group.add(model);group.userData.interactable=interaction;assembly.root.add(group);assembly.legacy.interactables.push(group);group.updateMatrixWorld(true);loaded=true;
  stats.cats=1;stats.loadedModels=1;stats.materials=materials.size;stats.textures=textures.size;
 })().catch(error=>{releaseModel();stats.loadError=error?.message??String(error);});
 return {group,interactionRoots:roots,stats,ready,update(dt,now,{blocked:hold=false}={}){
  if(disposed)return;time=now;blocked=hold;if(!loaded)return;
  const distance=camera.position.distanceToSquared(group.position);group.visible=distance<3600;if(!group.visible||hold)return;
  const purring=phase==='purring'&&time-started<6,greeting=phase==='greeting',recognizing=familiar&&distance<16;
  if(greeting&&time-started>15)phase='watching';
  // Source has no rig or clips. Only its separate head turns at the neck;
  // the authored body, legs, tail and four supported paws stay completely still.
  const wanted=Math.atan2(group.position.x-camera.position.x,group.position.z-camera.position.z)-group.rotation.y;
  const yaw=greeting||recognizing?THREE.MathUtils.clamp(Math.atan2(Math.sin(wanted),Math.cos(wanted)),-.18,.18):0;
  const blend=1-Math.exp(-Math.min(Math.max(dt,0),.1)*3);head.rotation.y+= (yaw-head.rotation.y)*blend;
  head.rotation.x+=((purring?-.035:greeting?-.015:0)-head.rotation.x)*blend;
 },dispose(){if(disposed)return;disposed=true;unsubscribe?.();loaded=false;const index=assembly.legacy.interactables.indexOf(group);if(index>=0)assembly.legacy.interactables.splice(index,1);delete group.userData.interactable;group.removeFromParent();releaseModel();}};
}
