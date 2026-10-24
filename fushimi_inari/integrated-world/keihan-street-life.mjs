import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {SpatialCollisionWorld} from './collision.mjs';
import {createVisitorState,stepVisitor} from './visitor-navigation.mjs';
import {bindVisitorRig,resetVisitorRig,captureVisitorPose,poseVisitorGait} from './visitor-rig.mjs';

export const STREET_PERSON_RADIUS=.36;
// Anchors select a short part of an existing mapped public street, not a new
// route across parcels. The railway crossing is deliberately not a patrol.
export const STREET_PATROLS=[
 ['west-food-street-1','way/946510942',-285,-111],
 ['west-food-street-2','way/946510942',-263,-102],
 ['west-food-street-3','way/946510942',-241,-94],
 ['east-food-street','way/79699849',-180,-85],
 ['hommachi-north','way/79699850',-157,-65],
 ['hommachi-middle','way/79699850',-157,-37],
 ['hommachi-south','way/79699850',-157,-10],
 ['omotesando-west','way/105449722',-133,10],
 ['omotesando-middle','way/105449722',-108,9],
 ['omotesando-torii','way/105449722',-83,7],
 ['urasando-street','way/297888106',-129,-85]
];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

export function streetPersonClearance(assembly){
 const world=new SpatialCollisionWorld(4);
 for(const c of assembly.colliders??[]){
  const a=c.args;if(a[0]<-345||a[0]>5||a[1]<-155||a[1]>45)continue;
  world[c.type==='box'?'addBox':'addCylinder'](...a);
 }
 return (x,z,radius=STREET_PERSON_RADIUS,floor)=>{
  const y=floor??assembly.walkHeight(x,z);
  if(!Number.isFinite(y))return false;
  const p=world.resolvePlayer(x,y+1.55,z,radius);
  const exactCylinder=(world.grid.get(world._key(Math.floor(x/4),Math.floor(z/4)))??[])
   .some(c=>Math.hypot(x-c.x,z-c.z)<1e-4&&y+1.7>=c.yMin&&y<=c.yMax);
  return !exactCylinder&&Math.hypot(p.x-x,p.z-z)<.001;
 };
}

export function planKeihanStreetLife(assembly,patrols=STREET_PATROLS){
 const routes=[],vendors=[],omitted=[];
 if(typeof assembly?.walkHeight!=='function')return {routes,vendors,omitted:['walking surfaces unavailable']};
 const clear=streetPersonClearance(assembly);
 for(const [zone,id,cx,cz]of patrols){
  const segments=(assembly.surfaces?.segments??[]).filter(s=>s.id===id&&!s.stair&&s.kind!=='restricted'&&s.width>=2.2).sort((a,b)=>a.distance-b.distance);
  let best=null;
  for(const offset of [1.2,-1.2,.65,-.65,0]){
   let run=[];
   const consider=()=>{
    // Each candidate is eight metres long and entirely sampled at <=20 cm.
    for(let i=0;i<run.length-1;i++){
     const points=[run[i]];let length=0,j=i;
     while(j+1<run.length&&length<8){length+=distance(run[j],run[j+1]);points.push(run[++j]);}
     if(length<7.5)break;
     const mid=points[Math.floor(points.length/2)],score=Math.hypot(mid[0]-cx,mid[2]-cz)+Math.abs(Math.abs(offset)-1.2)*2;
     if(score>6||routes.some(r=>distance(r.center,mid)<11&&r.points.some(a=>points.some(b=>distance(a,b)<1.4))))continue;
     if(!best||score<best.score)best={zone,id,points,score,offset,center:mid};
    }
    run=[];
   };
   for(const s of segments){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz);
    if(length<1e-6||Math.abs(offset)+STREET_PERSON_RADIUS>s.width/2-.08){consider();continue;}
    const steps=Math.ceil(length/.2),nx=-dz/length,nz=dx/length;
    for(let i=0;i<=steps;i++){
     const t=i/steps,x=s.a[0]+dx*t+nx*offset,z=s.a[2]+dz*t+nz*offset;
     if(Math.abs(x-cx)>11||Math.abs(z-cz)>11){consider();continue;}
     // No pedestrian simulation enters the JR tracks or the canal bridge.
     const y=assembly.walkHeight(x,z);
     if(x>-234&&x<-194||assembly.isWalkable&&!assembly.isWalkable(x,z)||!clear(x,z,STREET_PERSON_RADIUS,y)){consider();continue;}
     const p=[x,y,z],last=run.at(-1);
     if(last&&(distance(last,p)>.4||Math.abs(last[1]-y)>.12))consider();
     if(!run.length||distance(run.at(-1),p)>.01)run.push(p);
    }
   }
   consider();
   if(best)break;
  }
  if(best)routes.push(best);else omitted.push(zone);
 }
 for(const s of assembly.keihanFrontages?.storefronts??[]){
  if(!['senbei','soft-serve','grill'].includes(s.kind))continue;
  const a=s.points[s.edge],u=s.width/2,v=-1.12;
  const x=a[0]+s.t[0]*u+s.n[0]*v,z=a[2]+s.t[1]*u+s.n[1]*v;
  // The shop owner supplies this floor; public route sampling can deliberately
  // exclude the staff recess. Keep the narrow staff position behind the case.
  if(!clear(x,z,.20,s.floor)){omitted.push('vendor-'+s.id);continue;}
  vendors.push({id:s.id,kind:s.kind,x,y:s.floor,z,yaw:Math.atan2(s.n[0],s.n[1]),radius:.20});
 }
 return {routes,vendors,omitted};
}

export function streetPersonVisible(wasVisible,distance,verticalDistance=0){
 return distance<(wasVisible?64:54)&&verticalDistance<(wasVisible?26:22);
}

export function bindStreetPersonRig(model){
 const rig=bindVisitorRig(model);
 for(const side of ['L','R']){
  const bone=model.getObjectByName(`LowerArm${side}`);
  if(!bone?.isBone)throw Error(`Street visitor forearm missing: ${side}`);
  rig[`LowerArm.${side}`]={bone,rest:bone.quaternion.clone(),position:bone.position.clone(),scale:bone.scale.clone()};
 }
 return rig;
}

export function poseStreetVendor(rig,root,time,phase=0){
 // The source bones have oblique local axes. Rotate around the character's
 // lateral axis, transformed into each shoulder's parent frame, so the hands
 // reach forward above the counter instead of disappearing behind the body.
 const lateral=new THREE.Vector3(1,0,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
 for(const [side,angle]of [['R',-2.0+Math.sin(time*1.4+phase)*.05],['L',-1.96+Math.sin(time*.9+phase)*.04]]){
  const bone=rig[`UpperArm.${side}`].bone;
  const axis=lateral.clone().applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
  bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));
  // Lower the forearm independently: the source idle clip bends its elbow,
  // so rotating only the shoulder produces raised fists beside the face.
  const forearm=rig[`LowerArm.${side}`].bone;
  const forearmAxis=lateral.clone().applyQuaternion(forearm.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
  forearm.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(forearmAxis,.46));
 }
 rig.Head.bone.rotateY(Math.sin(time*.6+phase)*.18);
}

export function installKeihanStreetLife(assembly,{loadAsset,plan=planKeihanStreetLife(assembly),onStats}={}){
 const owner=new THREE.Group();owner.name='Keihan street pedestrians and food attendants';assembly.root.add(owner);
 const people=plan.routes.map((route,i)=>{
  const state=createVisitorState(route,i),start=Math.min(route.points.length-2,Math.floor(route.points.length*((i%3)/3)));
  [state.x,state.y,state.z]=route.points[start];state.target=start+1;state.pause=.4+i*.21;
  return {state,vendor:false,index:i};
 });
 for(const vendor of plan.vendors)people.push({state:{...vendor,travel:0,phase:0},vendor:true,index:people.length});
 for(const p of people){
  p.root=new THREE.Group();p.root.name=p.vendor?`Food attendant · ${p.state.id}`:`Street visitor · ${p.state.route.zone}`;
  p.root.position.set(p.state.x,p.state.y+.015,p.state.z);p.root.rotation.y=p.state.yaw;p.root.visible=false;
  p.root.matrixAutoUpdate=false;p.root.updateMatrix();owner.add(p.root);
 }
 const stats={pedestrians:plan.routes.length,attendants:plan.vendors.length,omitted:plan.omitted,active:0,animated:0,loadedModels:0,assetRequests:0,loadErrors:0,loading:false};
 const loader=new GLTFLoader(),files=['Casual_Male','Casual_Female','Kimono_Female'];
 let loading=null,lastTime=null,lastReport=-Infinity,disposed=false;
 function beginLoading(){
  if(loading||disposed)return loading;
  stats.loading=true;stats.assetRequests=files.length;
  const templates=files.map(file=>Promise.resolve().then(()=>loadAsset?loadAsset(file):loader.loadAsync(`../assets/models/visitors/${file}.glb`)).catch(error=>({error})));
  loading=Promise.all(people.map(async p=>{
   try{
    const asset=await templates[p.index%files.length];if(disposed)return;if(asset.error)throw asset.error;
    const model=clone(asset.scene),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),scale=(p.vendor?1.65:p.index%2?1.64:1.76)/size.y;
    if(!Number.isFinite(scale)||scale<=0)throw Error('Invalid street visitor dimensions');
    model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;p.root.add(model);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    p.mixer=new THREE.AnimationMixer(model);
    const idle=asset.animations.find(a=>/idle/i.test(a.name))??asset.animations[0];
    if(idle){const action=p.mixer.clipAction(idle);action.play();action.time=p.index*.63%idle.duration;action.timeScale=.85+(p.index%3)*.05;}
    p.mixer.update(0);p.bones=bindStreetPersonRig(model);p.model=model;stats.loadedModels++;
   }catch(error){stats.loadErrors++;p.root.visible=false;p.mixer=null;console.warn('Street visitor unavailable',error);}
  })).then(()=>{stats.loading=false;return stats;});
  return loading;
 }
 return {group:owner,groups:people.map(p=>p.root),people,plan,stats,get ready(){return loading??Promise.resolve(stats);},
  update(camera,time){
   if(disposed)return;
   const dt=lastTime===null?0:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
   const eye=camera.position,blockers=people.map(p=>p.state);blockers.push({x:eye.x,y:eye.y-1.7,z:eye.z});
   stats.active=0;stats.animated=0;
   for(const p of people){
    const s=p.state,d=Math.hypot(s.x-eye.x,s.z-eye.z),dy=Math.abs(s.y+1.7-eye.y);
    if(d<72&&dy<26)beginLoading();
    p.root.visible=streetPersonVisible(p.root.visible,d,dy)&&!!p.bones;
    if(!p.root.visible)continue;stats.active++;
    if(!p.vendor){stepVisitor(s,dt,blockers.filter(b=>b!==s));p.root.position.set(s.x,s.y+.015,s.z);p.root.rotation.y=s.yaw;p.root.updateMatrix();}
    // The animation clock advances only nearby. Far bodies update at 15 Hz,
    // close faces at 30 Hz; movement remains frame-rate independent.
    p.animationDebt=(p.animationDebt??0)+dt;
    if(p.animationDebt<(d<20?1/30:1/15))continue;
    const animationDt=Math.min(.1,p.animationDebt);p.animationDebt=0;stats.animated++;
    resetVisitorRig(p.bones);p.mixer.update(animationDt);captureVisitorPose(p.bones);
    if(p.vendor){
     poseStreetVendor(p.bones,p.root,time,p.index);
    }else{
     p.gait=THREE.MathUtils.damp(p.gait??0,s.travel>0?1:0,9,animationDt);poseVisitorGait(p.bones,s.phase,p.gait);
     if(s.state!=='walk')p.bones.Head.bone.rotateY(Math.sin(time*.45+p.index)*.14);
    }
   }
   if(time-lastReport>1){lastReport=time;onStats?.({...stats});}
  },dispose(){disposed=true;owner.removeFromParent();for(const p of people){p.mixer?.stopAllAction();if(p.model)p.mixer?.uncacheRoot(p.model);} }
 };
}
