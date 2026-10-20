import * as THREE from 'three';
import {roofHeight} from './roof-profile.mjs';

function curvedRoof(width,depth,rise,acrossX=false){
  const geometry=new THREE.BoxGeometry(width,.16,depth,acrossX?24:8,1,acrossX?8:24);
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const t=acrossX?p.getX(i)/(width/2):p.getZ(i)/(depth/2);
    const corner=Math.pow(Math.abs(p.getX(i)/(width/2)),6)*.09;
    p.setY(i,p.getY(i)+roofHeight(t,rise)+corner);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}

function gableTrim(mesh,width,depth,rise,material){
  const group=new THREE.Group();group.position.copy(mesh.position);
  const up=new THREE.Vector3(0,1,0);
  for(let i=0;i<24;i++){
    const x0=-width/2+width*i/24,x1=-width/2+width*(i+1)/24;
    const height=x=>roofHeight(x/(width/2),rise)+Math.abs(x/(width/2))**6*.09;
    const a=new THREE.Vector3(x0,height(x0),depth/2+.035),b=new THREE.Vector3(x1,height(x1),depth/2+.035);
    const delta=b.clone().sub(a);
    const trim=new THREE.Mesh(new THREE.BoxGeometry(.075,delta.length()+.006,.11),material);
    trim.position.copy(a).add(b).multiplyScalar(.5);trim.quaternion.setFromUnitVectors(up,delta.normalize());
    trim.castShadow=true;trim.receiveShadow=true;group.add(trim);
  }
  mesh.parent.add(group);
}

export function refineShrineRoofs(object){
  // Adapt only the known canopy assembly, leaving plaques, ropes and altars intact.
  const roofs=[];
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&Math.abs(p.height-.42)<.001&&p.width>5.5&&p.width<6.8&&p.depth>4.4&&p.depth<5)roofs.push(mesh);
  });
  for(const roof of roofs){
    const p=roof.geometry.parameters,parent=roof.parent,base=roof.position.y-.18,rise=object.userData.zone==='summit'?.76:.94;
    roof.geometry=curvedRoof(p.width,p.depth,rise);roof.position.y=base;
    const authoredUpper=parent.children.find(m=>m.geometry?.type==='BoxGeometry'&&Math.abs(m.geometry.parameters.height-.36)<.001&&m.geometry.parameters.width>4.8);
    roof.material=(authoredUpper?.material??roof.material).clone();
    // Mitsurugi panorama shows a dark curved roof, not the green box canopy.
    roof.material.color.set(object.userData.zone==='mitsurugi'?'#555a59':'#96918a');roof.material.roughness=.92;
    const edgeMaterial=new THREE.MeshStandardMaterial({color:'#66584a',roughness:.94});
    for(const sibling of [...parent.children]){
      if(sibling===roof||sibling.geometry?.type!=='BoxGeometry')continue;
      const d=sibling.geometry.parameters;
      // Official Ichinomine view shows one broad canopy without the projecting
      // front gable used by the two lower peaks. Keep its hanging plaque.
      if(object.userData.zone==='summit'&&((Math.abs(d.width-2.35)<.001&&Math.abs(d.height-.52)<.001)||(Math.abs(d.width-.55)<.001&&Math.abs(d.height-.34)<.001))){parent.remove(sibling);continue;}
      if(Math.abs(d.height-.36)<.001&&d.width>4.8){parent.remove(sibling);continue;}
      if(Math.abs(d.height-.24)<.001&&d.width>4.8)sibling.position.y=base+rise+.13;
      if(Math.abs(d.width-.28)<.001&&Math.abs(d.height-.32)<.001)sibling.position.y=base+rise+.16;
      if(Math.abs(d.width-2.35)<.001&&Math.abs(d.height-.52)<.001){
        sibling.geometry=curvedRoof(d.width,d.depth,.65,true);
        sibling.position.y=base+.28;sibling.material=roof.material;
        gableTrim(sibling,d.width,d.depth,.65,edgeMaterial);
      }
    }
  }
}
