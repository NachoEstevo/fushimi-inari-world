import * as THREE from 'three';
import {shinmeHorseForm} from './shinme-horse-form.mjs';

/** White carved horse in the south Shinme pavilion. Coordinates are pavilion-local. */
export function addShinmeHorse(parts,p,z){
  const oval=(material,x,y,zz,rx,ry,rz,segments=10,rings=6)=>parts.put(
    new THREE.SphereGeometry(1,segments,rings).scale(rx,ry,rz).translate(x,y,z+zz),material);
  // Unified offline from the editable source in scripts/shinme-horse/.
  parts.put(shinmeHorseForm(z),p.paper);
  for(const side of [-1,1]){
    const shift=side*.015,legZ=side*.14;
    for(const x of [-.51+shift,.57+shift])parts.put(
      new THREE.CylinderGeometry(.065,.092,.16,10,1).translate(x,.43,z+legZ),p.shaded);
    oval(p.dark,-.79,2.32,side*.145,.028,.033,.014,8,6);
    oval(p.dark,-1.04,2.06,side*.125,.022,.032,.009,8,6);
  }
  // Red and gold tack is a restrained interpretation of the photographed
  // statue, using the same palette as the rest of the pavilion.
  // https://www.kyoto.coop/musubi/vol08/post_27/
  oval(p.red,.10,1.88,0,.34,.075,.255,12,6);
  oval(p.dark,.11,1.96,0,.18,.045,.14,10,6);
  for(const side of [-1,1]){
    const sideZ=z+side*.205;
    parts.beam([-.61,2.32,z+side*.13],[-.82,2.25,z+side*.16],.014,p.metal,.014,6);
    parts.beam([-.82,2.25,z+side*.16],[-.99,2.10,z+side*.13],.014,p.red,.014,6);
    parts.beam([-.57,1.87,sideZ],[-.31,1.67,z+side*.265],.024,p.red,.024,6);
    parts.beam([-.31,1.67,z+side*.265],[-.07,1.61,z+side*.29],.024,p.red,.024,6);
    parts.beam([-.17,1.91,z+side*.205],[.35,1.91,z+side*.205],.009,p.metal,.009,6);
    for(const [x,y,zz] of [[-.45,1.77,.24],[-.25,1.65,.275],[-.07,1.61,.29]]){
      parts.put(new THREE.OctahedronGeometry(1).scale(.025,.025,.014).translate(x,y,z+side*zz),p.metal);
    }
  }
}
