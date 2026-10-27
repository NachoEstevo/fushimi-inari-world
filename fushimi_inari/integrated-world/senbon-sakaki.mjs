import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {evergreenCanopy} from './evergreen-canopy.mjs';

const near=(a,b)=>Math.abs(a-b)<1e-6;
const at=(object,x,y,z)=>near(object.position.x,x)&&near(object.position.y,y)&&near(object.position.z,z);

// 01_precinct_map_sign.jpg shows a narrow branched leafy shrub behind the
// bifurcation stone. Its inherited metre envelope remains an estimate, not a
// surveyed botanical reconstruction or a verified species identification.
export function refineSenbonSakaki(object){
 if(!object?.isGroup||object.userData.zone!=='senbon')return null;
 if(object.userData.senbonSakaki)return object.userData.senbonSakaki;
 const pillars=object.children.filter(child=>{
  const p=child.geometry?.parameters;
  return child.isMesh&&child.geometry.type==='BoxGeometry'&&near(p.width,.28)&&near(p.height,1.38)&&near(p.depth,.28)&&at(child,-.15,.69,-2.15);
 });
 const cones=object.children.filter(child=>{
  const p=child.geometry?.parameters;
  return child.isMesh&&child.geometry.type==='ConeGeometry'&&near(p.radius,.45)&&near(p.height,2.15)&&p.radialSegments===8&&at(child,-.15,1.15,-2.75)&&
   child.material?.color?.getHex()===0x244a26&&!child.material.map&&near(child.scale.x,1)&&near(child.scale.y,1)&&near(child.scale.z,1);
 });
 if(pillars.length!==1||cones.length!==1)return null;
 const source=cones[0],envelope=new THREE.Box3().setFromBufferAttribute(source.geometry.attributes.position);
 const foliage=evergreenCanopy(96),stem=new THREE.BufferGeometry();
 // Two crossed opaque twig strips share the leaf material's solid centre UV.
 stem.setAttribute('position',new THREE.Float32BufferAttribute([
  -.012,-.82,0,.012,-.82,0,.012,.24,0,-.012,-.82,0,.012,.24,0,-.012,.24,0,
  0,-.82,-.012,0,.24,.012,0,-.82,.012,0,-.82,-.012,0,.24,-.012,0,.24,.012
 ],3));
 const colors=[];for(let i=0;i<12;i++)colors.push(.15,.10,.055);
 stem.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 stem.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(24).fill(.5),2));stem.computeVertexNormals();
 const geometry=mergeGeometries([foliage.geometry,stem]);foliage.geometry.dispose();stem.dispose();
 geometry.computeBoundingBox();
 const center=geometry.boundingBox.getCenter(new THREE.Vector3()),size=geometry.boundingBox.getSize(new THREE.Vector3());
 const targetCenter=envelope.getCenter(new THREE.Vector3()),targetSize=envelope.getSize(new THREE.Vector3());
 geometry.translate(-center.x,-center.y,-center.z);geometry.scale(targetSize.x/size.x,targetSize.y/size.y,targetSize.z/size.z);geometry.translate(targetCenter.x,targetCenter.y,targetCenter.z);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // The old mesh and its transform stay put. Its old resources are borrowed;
 // another object may still share them, as with other legacy adapter inputs.
 source.geometry=geometry;source.material=foliage.material;source.name='Senbon fork leafy shrub';
 const report={refined:true,appearance:'Narrow branched broadleaf shrub visible behind the fork stone',
  source:'references/real_photos_precinct_map/01_precinct_map_sign.jpg',triangles:geometry.attributes.position.count/3,drawMeshes:1,extraLights:0,updateRequired:false,
  limits:'Leaf arrangement and original inferred envelope retained artistically; species and precise dimensions not verified'};
 object.userData.senbonSakaki=report;return report;
}
