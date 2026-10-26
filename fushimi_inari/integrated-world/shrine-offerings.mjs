import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Mitsurugi panorama, Luke Hall, April 2018: miniature torii have open
// centers. All four legacy peak compounds reuse the same solid offering proxy.
// Keep authored placements and dimensions; these are not surveyed.
export function refineShrineOfferings(object){
  if(!['mitsurugi','sannomine','ninomine','summit'].includes(object.userData.zone))return;
  const targets=[];
  object.traverse(mesh=>{
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type==='BoxGeometry'&&p.width===.36&&p.height===.42&&p.depth===.06)targets.push(mesh);
    // Rounded stone heads visible in the same panorama. Preserve inscription
    // UVs, base, placement and bounding dimensions of the authored steles.
    if(object.userData.zone==='mitsurugi'&&mesh.geometry?.type==='BoxGeometry'&&p.depth===.26&&p.width>=.44&&p.width<=.65&&p.height>=.9&&p.height<=1.93){
      const geometry=new THREE.BoxGeometry(p.width,p.height,p.depth,8,8,1),v=geometry.attributes.position;
      const crown=Math.min(p.width*.48,p.height*.24);
      for(let i=0;i<v.count;i++){
        const x=v.getX(i)/(p.width/2),y=v.getY(i),blend=Math.max(0,(y-(p.height/2-crown))/crown);
        const n=geometry.attributes.normal,uv=geometry.attributes.uv;
        uv.setXY(i,Math.abs(n.getX(i))>.5?v.getZ(i):v.getX(i),Math.abs(n.getY(i))>.5?v.getZ(i):y);
        v.setY(i,y-blend*crown*(1-Math.sqrt(Math.max(0,1-x*x))));
      }
      geometry.computeVertexNormals();mesh.geometry=geometry;
    }
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
