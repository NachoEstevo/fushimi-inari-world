import * as THREE from 'three';
import {roofHeight} from './roof-profile.mjs';

export function refinePeakLanterns(object){
  if(!['ninomine','sannomine'].includes(object.userData.zone))return;
  const stonePost=object.userData.zone==='sannomine';
  const roofs=[];
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&p.width===.86&&p.height===.24&&p.depth===.86)roofs.push(mesh);
  });
  const dark=new THREE.MeshStandardMaterial({color:'#50443b',roughness:.88});
  const red=new THREE.MeshStandardMaterial({color:'#a83520',roughness:.86});
  const green=new THREE.MeshStandardMaterial({color:'#284839',roughness:.85});
  for(const roof of roofs){
    const geo=new THREE.BoxGeometry(.96,.055,.92,16,1,1),p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+roofHeight(p.getX(i)/.48,.27));
    geo.computeVertexNormals();roof.geometry=geo;roof.material=dark;roof.position.y=2.70;
    const parent=roof.parent;
    for(const m of [...parent.children]){
      if(m.geometry?.type==='ConeGeometry'){parent.remove(m);continue;}
      const d=m.geometry?.parameters;
      if(stonePost&&m.geometry?.type==='BoxGeometry'&&d.width===.22&&d.height===1.65){
        m.material=new THREE.MeshStandardMaterial({color:'#8b8981',roughness:.98});
      }
      if(m.geometry?.type==='BoxGeometry'&&d.width===.48&&d.height===.52){
        m.material=new THREE.MeshStandardMaterial({color:'#c2b99d',roughness:.9});
      }
    }
    const add=(w,h,d,x,y,z,mat)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);
      mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
    };
    for(const x of [-.245,.245])for(const z of [-.245,.245])add(.055,.56,.055,x,2.45,z,stonePost?dark:red);
    for(const side of [-1,1]){
      for(const y of [2.21,2.69]){add(.50,.045,.035,0,y,side*.255,green);add(.035,.045,.50,side*.255,y,0,green);}
      add(.025,.46,.035,0,2.45,side*.26,green);add(.035,.46,.025,side*.26,2.45,0,green);
    }
  }
}
