import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Mitsurugi panorama, Luke Hall, April 2018: miniature torii have open
// centers. Keep authored placements and dimensions; these are not surveyed.
export function refineShrineOfferings(object){
  if(object.userData.zone!=='mitsurugi')return;
  const targets=[];
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&p.width===.36&&p.height===.42&&p.depth===.06)targets.push(mesh);
  });
  if(!targets.length)return;
  const pieces=[
    new THREE.BoxGeometry(.04,.38,.06).translate(-.115,-.02,0),
    new THREE.BoxGeometry(.04,.38,.06).translate(.115,-.02,0),
    new THREE.BoxGeometry(.36,.04,.06).translate(0,.19,0),
    new THREE.BoxGeometry(.29,.035,.05).translate(0,.10,0),
  ];
  const geometry=mergeGeometries(pieces);
  pieces.forEach(p=>p.dispose());
  for(const mesh of targets)mesh.geometry=geometry;
}
