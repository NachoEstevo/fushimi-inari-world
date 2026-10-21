import * as THREE from 'three';
import {createActivity} from './activity-state.mjs';
import {createKitsune,createAttendant} from './precinct-models.mjs?v=31';

const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.87});
function mesh(parent,geo,material,x,y,z){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(g,w,h,d,m,x,y,z){return mesh(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);}
export function sculptEntranceFoxes(g){
  for(const old of [...g.children]){
    const p=old.geometry?.parameters;
    if(old.geometry?.type!=='ConeGeometry'||p.radius!==.42||p.height!==1.35)continue;
    const fox=createKitsune();fox.position.copy(old.position);fox.position.y-=.66;
    const previousBib=g.children.find(o=>o.geometry?.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop===.30&&Math.abs(o.position.x-old.position.x)<.01);
    previousBib?.removeFromParent();old.removeFromParent();g.add(fox);fox.userData.foxStatue=true;
  }
}

export function installPrecinctLife(root,legacy,callbacks){
  const updates=[],world=new THREE.Vector3();
  const register=(object,data)=>{object.userData.interactable={...data,language:'en',note:'Interpretive activity in a reconstructed shrine.'};legacy.interactables.push(object);};
  const foxes=[];root.traverse(o=>{if(o.userData.foxStatue)foxes.push(o);});
  for(const fox of foxes)register(fox,{title:'Kitsune · fox messenger',description:'These fox figures represent messengers associated with Inari. The seated silhouette and orange bib follow the walking-video reference; this placement retains the earlier scene layout.'});
  const reception=root.getObjectByName('Mapped shrine reception');
  if(reception){
    const person=createAttendant();person.position.set(2.2,.12,11.83);reception.add(person);
    const paper=box(reception,.36,.012,.25,mat('#eee5d2'),2.2,1.275,12.03);
    const stamp=box(reception,.07,.12,.07,mat('#6e3826'),2.25,1.36,12.04);
    const seal=box(reception,.065,.002,.065,mat('#b53c32'),2.2,1.283,12.03);seal.visible=false;
    const activity=createActivity(1800);let stamped=false;
    const action={label:'Request a commemorative stamp',run(){
      if(!activity.start(performance.now()))return 'The attendant is preparing your page.';
      stamped=true;seal.visible=false;return 'The attendant stamps a commemorative page on the counter.';
    }};
    const data={title:'Shrine reception',description:'A commemorative stamp demonstration. This is a virtual souvenir, not an official goshuin.',actions:[action]};
    register(person,data);register(paper,data);register(stamp,data);register(seal,data);
    updates.push({object:person,run:()=>{const t=activity.progress(performance.now());stamp.position.y=1.36-.07*Math.sin(Math.PI*t);person.rotation.x=.05*Math.sin(Math.PI*t);if(stamped&&t>.6)seal.visible=true;}});
  }
  const ladles=[];root.traverse(o=>{if(o.userData.ladle)ladles.push(o);});
  for(const ladle of ladles){
    const activity=createActivity(2400),origin=ladle.position.clone();
    const data={title:'Temizu · water ladle',description:'Lift the ladle, pour gently and return it to its rest. The basin is for purification, not drinking directly from the ladle.',actions:[{label:'Lift and pour water',run(){if(!activity.start(performance.now()))return 'Returning the ladle to its rest…';callbacks.water?.();return 'Lifting the ladle and pouring water.';}}]};
    register(ladle,data);
    updates.push({object:ladle,run:()=>{const t=activity.progress(performance.now()),lift=Math.sin(Math.PI*t);ladle.position.copy(origin);ladle.position.y+=lift*.22;ladle.rotation.z=lift*.55;}});
    // The basin is easier to aim at than the narrow handle.
    for(const target of legacy.interactables){if(target!==ladle&&target.parent===ladle.parent&&target.userData.interactable?.title.startsWith('Temizuya'))target.userData.interactable={...data,language:'en',note:'Interpretive activity in a reconstructed shrine.'};}
  }
  // Existing summit bell/rope meshes already belong to the original pavilions.
  const bells=[];root.traverse(o=>{if(o.geometry?.type==='SphereGeometry'&&o.geometry.parameters.radius===.22&&o.parent.children.some(c=>c.geometry?.parameters?.radiusTop===.055))bells.push(o);});
  for(const bell of bells){
    const activity=createActivity(1800);
    const data={title:'Suzu · shrine bell',description:'A gentle ring at the prayer front.',actions:[{label:'Ring the bell',run(){if(!activity.start(performance.now()))return 'The bell is still ringing.';callbacks.bell?.();return 'The bell rings gently.';}}]};
    register(bell,data);
    const rope=bell.parent.children.find(c=>c.geometry?.parameters?.radiusTop===.055),x=rope.position.x;
    register(rope,data);
    updates.push({object:bell,run:()=>{const t=activity.progress(performance.now()),sway=.14*Math.sin(t*Math.PI*8)*(1-t);bell.rotation.z=sway;rope.rotation.z=sway;rope.position.x=x+sway*.6;}});
  }
  return {update(camera){for(const update of updates){update.object.getWorldPosition(world);if(camera.position.distanceToSquared(world)<4900)update.run();}},stats:{foxes:foxes.length,attendants:reception?1:0,ladles:ladles.length,bells:bells.length}};
}
