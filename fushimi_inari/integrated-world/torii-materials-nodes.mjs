import * as THREE from 'three';
import {mix,vec3,vec4,texture,materialReference} from 'three/tsl';

// Preserve source maps and PBR state while replacing the unsupported GLSL hook.
function nodeCopy(source){
  const material=source.isMeshPhysicalMaterial?new THREE.MeshPhysicalNodeMaterial():new THREE.MeshStandardNodeMaterial();
  const Type=source.isMeshPhysicalMaterial?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
  Type.prototype.copy.call(material,source);
  return material;
}

// Keep original maps while limiting their exaggerated bare-wood contrast at
// walking distance. Instance tint remains active (multiply, never overwrite).
export function toriiMaterials(legacy,{separateInk=false}={}){
  const fresh=nodeCopy(legacy.torii.fresh);
  fresh.normalScale.set(.45,.45);fresh.roughness=.68;fresh.clearcoat=.06;fresh.metalness=0;fresh.envMapIntensity=.3;
  const weathered=nodeCopy(legacy.torii.weathered);
  weathered.normalScale.set(.55,.55);weathered.roughness=.78;weathered.clearcoat=.02;weathered.metalness=0;weathered.envMapIntensity=.3;
  const beam=nodeCopy(legacy.materials.vermilionMat);
  // Painted timber is dielectric. Copied metallic/lacquer settings turn the
  // horizontal beam toward white under the bright studio environment.
  beam.color.set(0xffffff);beam.normalScale.set(.18,.18);beam.roughness=.72;
  beam.metalness=0;beam.clearcoat=.02;beam.envMapIntensity=.25;
  if(separateInk){
    // The old column colour/normal maps contain baked, identical donor text.
    // Reuse the original unlettered timber maps below our separate curved ink.
    for(const mat of [fresh,weathered]){
      mat.map=legacy.materials.vermilionMat.map;
      mat.normalMap=legacy.materials.vermilionMat.normalMap;
      mat.roughnessMap=null;
    }
    fresh.color.set(0xd94816);weathered.color.set(0xffffff);
    fresh.normalScale.set(.22,.22);weathered.normalScale.set(.38,.38);
  }
  weathered.colorNode=vec4(materialReference('color','color').mul(mix(vec3(.60,.075,.018),texture(weathered.map).rgb,.30)),texture(weathered.map).a);
  beam.colorNode=vec4(materialReference('color','color').mul(mix(vec3(.68,.075,.012),texture(beam.map).rgb,.10)),texture(beam.map).a);
  return {fresh,weathered,beam};
}
