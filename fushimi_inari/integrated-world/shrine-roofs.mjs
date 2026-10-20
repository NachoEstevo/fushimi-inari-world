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

export function refineShrineRoofs(object){
  // Adapt only the known canopy assembly, leaving plaques, ropes and altars intact.
  const roofs=[];
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&Math.abs(p.height-.42)<.001&&p.width>5.5&&p.width<6.8&&p.depth>4.4&&p.depth<5)roofs.push(mesh);
  });
  for(const roof of roofs){
    const p=roof.geometry.parameters,parent=roof.parent,base=roof.position.y-.18,rise=.94;
    roof.geometry=curvedRoof(p.width,p.depth,rise);roof.position.y=base;
    roof.material=roof.material.clone();roof.material.color.set('#61594c');roof.material.roughness=.92;
    for(const sibling of [...parent.children]){
      if(sibling===roof||sibling.geometry?.type!=='BoxGeometry')continue;
      const d=sibling.geometry.parameters;
      if(Math.abs(d.height-.36)<.001&&d.width>4.8){parent.remove(sibling);continue;}
      if(Math.abs(d.height-.24)<.001&&d.width>4.8)sibling.position.y=base+rise+.13;
      if(Math.abs(d.width-.28)<.001&&Math.abs(d.height-.32)<.001)sibling.position.y=base+rise+.16;
      if(Math.abs(d.width-2.35)<.001&&Math.abs(d.height-.52)<.001){
        sibling.geometry=curvedRoof(d.width,d.depth,.65,true);
        sibling.position.y=base+.28;sibling.material=roof.material;
      }
    }
  }
}
