import * as THREE from 'three';
import {staticParts,shide} from './mountain-landmarks-geometry.mjs';

export const kumatakaEntryDetailsSourceR101='https://fushimiinari-guide.com/wp-content/uploads/P3600730_20190210.jpg';

/** After the mapped R97 owner, before global batching. No route/water mutation. */
export function buildKumatakaDetailsR101(root){
  const owner=root.children.find(g=>g.userData.kumatakaRegistrationR97);
  const entry=owner?.getObjectByName('Kumataka southwest entry temizuya source-relative bay R97');
  if(!entry||entry.getObjectByName('Kumataka photographed entry fittings R101'))return null;
  const basin=entry.children.find(o=>{const p=o.geometry?.parameters;return p?.width===1.5&&p.height===.82&&p.depth===1.1&&Math.abs(o.position.y-.43)<1e-5;});
  const roof=entry.children.find(o=>o.isMesh&&o.geometry?.attributes.position.count===12&&o.material?.color?.getHexString()==='666e65');
  if(!basin||!roof)return null;
  const group=new THREE.Group();group.name='Kumataka photographed entry fittings R101';
  const p=staticParts(group),timber=new THREE.MeshStandardMaterial({color:'#726754',roughness:.98}),straw=new THREE.MeshStandardMaterial({color:'#b4a17a',roughness:1,side:THREE.DoubleSide}),paper=new THREE.MeshStandardMaterial({color:'#e8e3d6',roughness:1,side:THREE.DoubleSide});
  // Complete the photographed small gable under the accepted roof outline.
  p.box(.12,.14,1.70,.90,2.18,0,timber);
  p.box(.10,.36,.10,.99,2.42,0,timber);
  p.beam([-1.06,2.605,0],[1.06,2.605,0],.034,timber,.034,4);
  for(const side of [-1,1]){
    p.beam([1.06,2.275,side*.87],[1.06,2.605,0],.035,timber,.035,4);
    p.beam([-1.06,2.275,side*.87],[-1.06,2.605,0],.035,timber,.035,4);
    const path=[[.82,1.91,side*.61],[.82,2.045,side*.52],[.82,2.145,side*.31]];
    for(let i=1;i<path.length;i++)p.beam(path[i-1],path[i],.033,timber,.033,6);
  }
  // Source shows rope, folded pale paper and long straw bundles. No new label,
  // instruction text, crest, basin contents or uncertain ritual tool is added.
  const ropeY=z=>2.12-.08*(1-(z/.64)**2);
  for(let i=0;i<16;i++){
    const a=-.64+1.28*i/16,b=-.64+1.28*(i+1)/16;
    p.beam([.93,ropeY(a),a],[.93,ropeY(b),b],.024,straw,.024,6);
  }
  for(const z of [-.43,.43])shide(p,.96,ropeY(z)-.015,z,.23,paper,'x');
  for(const center of [-.23,.23])for(let j=0;j<18;j++){
    const t=j/17,z=center+(t-.5)*.15,top=ropeY(center)-.025,bottom=1.69+.055*((j*7)%11)/10,bend=.018*Math.sin(j*1.7),w=.005;
    p.sheet([.948,top,z-w,.948,top,z+w,.96+bend,bottom,z-w,.96+bend,bottom,z-w,.948,top,z+w,.96+bend,bottom,z+w],straw);
  }
  const stats=p.flush();
  group.userData={kumatakaDetailsR101:true,...stats,source:kumatakaEntryDetailsSourceR101,
    observed:'Small timber gable, front rope, pale folded paper and straw bundles in P3600730',
    inferred:'Joinery sections, hidden rear fascia, paper count, strand spacing and dimensions inside accepted entry roof',
    footprintOwner:'Existing R97 source-relative 2.2 x 1.8 m entry roof; no outer compound boundary inferred'};
  entry.add(group);return {group,...group.userData};
}
