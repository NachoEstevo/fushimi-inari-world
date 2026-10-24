import * as THREE from 'three';
import {staticParts,stonePalette,shide,simpleOfferingTorii} from './mountain-landmarks-geometry.mjs';

// The apparent dead end is the mapped entrance to Osugi, not an extra trail.
// Footprint and entrance are OSM; timber pavilion, curtains and offering cases
// are photo-informed. Heights and small details are estimates, not a survey.
export function buildOsugiShrine(root,features,surfaces,materials,colliders){
  const id='way/342401488',path=features.paths.find(p=>p.id==='way/1268937960');
  const building=features.buildings.find(b=>b.id===id);
  if(!building||!path||root.getObjectByName('Osugi mapped shrine'))return null;
  const entrance=path.points.at(-1),ring=building.points.slice(0,-1);
  const cx=(Math.min(...ring.map(p=>p[0]))+Math.max(...ring.map(p=>p[0])))/2;
  const cz=(Math.min(...ring.map(p=>p[2]))+Math.max(...ring.map(p=>p[2])))/2;
  const yaw=Math.atan2(entrance[0]-cx,entrance[2]-cz),floor=surfaces.height(...[entrance[0],entrance[2]]);
  const group=new THREE.Group();group.name='Osugi mapped shrine';group.position.set(cx,floor,cz);group.rotation.y=yaw;
  group.userData.sourceFeature=id;root.add(group);
  const p=staticParts(group),m=stonePalette(materials),world=(x,z)=>[cx+Math.cos(yaw)*x+Math.sin(yaw)*z,cz-Math.sin(yaw)*x+Math.cos(yaw)*z];
  const solid=(x,z,w,d,low,high)=>{const [wx,wz]=world(x,z);colliders.push({type:'box',args:[wx,wz,w/2,d/2,yaw,floor+low,floor+high,'osugi_shrine']});};
  // Keep the open front at the mapped path endpoint. No new walkable platform
  // projects into the trail; each footing extends down to the local terrain.
  for(const x of [-1.10,1.10])for(const z of [-1.02,.98]){
    const [wx,wz]=world(x,z),bottom=Math.min(-.12,surfaces.terrainHeight(wx,wz)-floor-.12);
    p.box(.35,.12-bottom,.35,x,(bottom+.12)/2,z,m.stone);
    p.box(.19,2.48,.19,x,1.28,z,m.wood);solid(x,z,.35,.35,bottom,2.52);
  }
  for(const z of [-1.02,.98]){p.box(2.65,.20,.24,0,2.40,z,m.wood);p.box(2.40,.12,.18,0,.36,z===.98?-.97:z,m.wood);}
  for(const x of [-1.10,1.10])p.box(.18,.17,2.55,x,2.43,0,m.wood);
  for(const side of [-1,1]){
    p.sheet([0,3.20,-1.38,0,3.20,1.42,side*1.52,2.48,-1.38,side*1.52,2.48,-1.38,0,3.20,1.42,side*1.52,2.48,1.42],m.roof);
    p.beam([0,3.20,1.42],[side*1.52,2.48,1.42],.065,m.wood);
    for(let z=-1.25;z<1.4;z+=.3)p.beam([0,3.14,z],[side*1.47,2.43,z],.035,m.wood);
    // Gathered cloth rises toward the middle, retaining a clear offering view.
    p.sheet([side*.04,2.23,1.02,side*1.04,2.23,1.02,side*1.04,1.35,1.02,side*.04,2.23,1.02,side*1.04,1.35,1.02,side*.04,1.91,1.02],m.paper);
    for(let n=0;n<7;n++)p.beam([side*(.13+n*.13),2.23,1.045],[side*(.13+n*.13),1.91-n*.08,1.045],.008,m.straw);
    shide(p,side*.82,2.24,1.10,.36,m.paper);
  }
  p.box(.14,.14,2.94,0,3.22,.02,m.roof);
  p.box(.38,.52,.06,0,2.54,1.13,m.straw);
  p.box(.31,.44,.07,0,2.54,1.15,m.wood);
  p.box(1.28,.36,.68,0,.18,-.36,m.shaded);
  p.put(new THREE.IcosahedronGeometry(.52,1).scale(.65,1.30,.45).translate(0,.92,-.52),m.shaded);
  for(const x of [-.80,.80]){
    p.box(.52,.38,.48,x,.20,.16,m.stone);
    for(const s of [-1,1])p.box(.035,.44,.42,x+s*.23,.59,.16,m.dark);
    p.box(.61,.08,.58,x,.84,.16,m.dark);
    for(const dx of [-.10,.10])p.box(.032,.19,.032,x+dx,.48,.27,m.paper);
  }
  for(const x of [-.36,.36])simpleOfferingTorii(p,x,.36,-.30,.60,m.red,m.dark);
  p.box(.90,.30,.43,0,.20,.61,m.wood);
  for(let x=-.38;x<.4;x+=.10)p.box(.035,.025,.41,x,.365,.61,m.dark);
  solid(0,0,2.1,1.5,-.1,1.1);
  const stats=p.flush();group.userData.photo='https://jinjafan.jp/img/shrine/kyoto/2601658/2601658_160.jpg';
  return {built:true,id,entrance:[...entrance],center:[cx,floor,cz],stats,source:group.userData.photo,limits:'Mapped footprint and access; pavilion dimensions and details estimated from photograph. No invented trail or surveyed-height claim.'};
}
