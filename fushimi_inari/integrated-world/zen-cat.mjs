import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';
import {withinZenInteractionReach} from './zen-interaction-reach.mjs';

// An original station cat, perched on an existing molded platform seat.
export function createZenCat({assembly,camera,journey,onAction=()=>{}}){
 const group=new THREE.Group();group.name='Mugi · station cat';group.userData.zenMoment='cat';
 const floor=assembly.keihanStation?.spec?.platformFloor;
 const roots=[],materials=[],geometries=[];let disposed=false,blocked=false,time=0,phase='watching',started=-Infinity,recorded=false,familiar=false;
 const stats={cats:0,batches:0,triangles:0,lights:0,textures:0,get familiar(){return familiar;}};
 if(!Number.isFinite(floor))return {group,interactionRoots:roots,stats,update(){},dispose(){}};
 const recognize=state=>{if(state?.moments?.cat){familiar=true;recorded=true;}};recognize(journey?.snapshot?.());const unsubscribe=journey?.subscribe?.(recognize);
 const material=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.92});materials.push(m);return m;};
 const fur=material('#b68a56'),cream=material('#e5d7bb'),dark=material('#493c2b'),pink=material('#bf9180'),eye=material('#a4ad69');
 const body=new THREE.Group(),head=new THREE.Group(),tail=new THREE.Group(),leftEar=new THREE.Group(),rightEar=new THREE.Group();group.add(body,head,tail);
 const oval=(parts,m,x,y,z,sx,sy,sz)=>parts.put(new THREE.SphereGeometry(1,14,10).scale(sx,sy,sz).translate(x,y,z),m,false);
 const b=staticParts(body);
 oval(b,fur,0,.20,.025,.20,.23,.24);oval(b,cream,0,.23,-.135,.135,.19,.065);
 for(const side of [-1,1]){oval(b,fur,side*.145,.12,.08,.10,.13,.17);oval(b,cream,side*.085,.055,-.17,.065,.045,.105);}
 for(const z of [-.01,.07,.15])oval(b,dark,.185,.20,z,.014,.075,.025);
 b.flush();head.position.set(0,.43,-.12);const h=staticParts(head);
 oval(h,fur,0,0,0,.175,.15,.145);oval(h,cream,0,-.060,-.10,.12,.074,.078);
 for(const side of [-1,1]){oval(h,eye,side*.076,.015,-.127,.034,.024,.012);oval(h,dark,side*.076,.015,-.139,.006,.021,.003);oval(h,cream,side*.078,.026,-.140,.004,.004,.003);}
 oval(h,pink,0,-.038,-.170,.022,.013,.014);
 for(const side of [-1,1])for(const offset of [-1,0,1])h.beam([side*.06,-.064+offset*.012,-.160],[side*.224,-.05+offset*.035,-.145],.0015,cream,.001,4);
 h.flush();head.add(leftEar,rightEar);
 for(const [ear,side]of [[leftEar,-1],[rightEar,1]]){
  ear.position.set(side*.105,.095,.005);ear.rotation.z=-side*.20;const p=staticParts(ear);
  p.put(new THREE.ConeGeometry(.069,.17,4).scale(1,1,.55).translate(0,.07,0),fur);
  p.sheet([-.037,.01,-.039,.037,.01,-.039,0,.122,-.025],pink);p.flush();
 }
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.13,.08,.17),new THREE.Vector3(.30,.055,.23),new THREE.Vector3(.38,.06,.09),new THREE.Vector3(.31,.09,-.03)]);
 const t=staticParts(tail);t.put(new THREE.TubeGeometry(curve,16,.044,7,false),fur);t.flush();
 // The molded seat's back is +Z; its open front and Mugi both face -Z.
 group.position.set(-300.4,floor+.54,-184.9);group.rotation.y=0;
 group.userData.interactable={language:'en',title:'Mugi · station cat',proximity:true,reach:2.5,cooldownMs:700,
  get prompt(){return phase==='watching'?(familiar?'Say hello again to Mugi':'Offer your hand to Mugi'):phase==='greeting'?(familiar?'Gently stroke your familiar friend':'Gently stroke Mugi'):'Say hello to Mugi';},
  directAction(){
   if(disposed||blocked||!withinZenInteractionReach(camera,group))return 'Mugi watches the platform.';
   if(phase==='watching'){phase='greeting';started=time;return familiar?'Mugi remembers your hand and leans close for another quiet hello.':'You offer your hand. Mugi leans forward to sniff.';}
   if(phase==='greeting'&&time-started<.8)return 'Let Mugi come to you.';
   if(phase==='purring'&&time-started<.8)return 'Mugi is still enjoying that gentle stroke.';
   const recognized=familiar;phase='purring';started=time;if(!recorded){recorded=true;onAction({type:'cat',site:'station',completed:true});}familiar=true;
   onAction({type:'cat.pet',site:'station',completed:true});
   return recognized?'A familiar stroke. Mugi settles beside you and purrs.':'A gentle stroke. Mugi closes its eyes and purrs.';
  }};
 assembly.root.add(group);assembly.legacy.interactables.push(group);roots.push(group);group.updateMatrixWorld(true);
 group.traverse(o=>{if(o.isMesh){stats.batches++;stats.triangles+=o.geometry.attributes.position.count/3;geometries.push(o.geometry);}});stats.cats=1;
 return {group,interactionRoots:roots,stats,update(dt,now,{blocked:hold=false}={}){
  if(disposed)return;time=now;blocked=hold;const d=camera.position.distanceToSquared(group.position);group.visible=d<3600;if(!group.visible||hold)return;
  const purring=phase==='purring'&&time-started<6,greeting=phase==='greeting',recognizing=familiar&&d<16;
  if(greeting&&time-started>15)phase='watching';
  head.rotation.x=purring?-.12+Math.sin(time*3.5)*.018:greeting?-.08:Math.sin(time*.7)*.025;
  const wanted=Math.atan2(group.position.x-camera.position.x,group.position.z-camera.position.z)-group.rotation.y;
  head.rotation.y=greeting||recognizing?THREE.MathUtils.clamp(Math.atan2(Math.sin(wanted),Math.cos(wanted)),-.45,.45)*(greeting?1:.45):Math.sin(time*.24)*.10;
  body.scale.y=1+Math.sin(time*(purring?14:2))*(purring?.006:.004);
  tail.rotation.y=Math.sin(time*(purring?1.5:.7))*(purring?.10:familiar?.055:.035);leftEar.rotation.z=.20+Math.sin(time*1.1)*.025;rightEar.rotation.z=-.20+Math.sin(time*.8+1)*.035;
 },dispose(){if(disposed)return;disposed=true;unsubscribe?.();const index=assembly.legacy.interactables.indexOf(group);if(index>=0)assembly.legacy.interactables.splice(index,1);group.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
