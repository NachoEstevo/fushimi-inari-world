import * as THREE from 'three';
import {float,mix,vec3,vec4,texture,materialReference} from 'three/tsl';

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
  beam.color.set(0xffffff);beam.normalScale.set(.12,.12);beam.roughness=.72;
  beam.metalness=0;beam.clearcoat=.02;beam.envMapIntensity=.25;
  if(separateInk){
    // The old column colour/normal maps contain baked, identical donor text.
    // Reuse the original unlettered timber maps below our separate curved ink.
    for(const mat of [fresh,weathered]){
      mat.map=legacy.materials.vermilionMat.map;
      mat.normalMap=legacy.materials.vermilionMat.normalMap;
      mat.roughnessMap=null;
    }
    fresh.color.set(0xffffff);weathered.color.set(0xffffff);
    fresh.normalScale.set(.14,.14);weathered.normalScale.set(.24,.24);
  }
  const paint=(material,pigment,wear)=>{
    const texel=material.map?texture(material.map):null;
    material.colorNode=vec4(materialReference('color','color').mul(mix(vec3(...pigment),texel?.rgb??vec3(1),wear)),texel?.a??float(1));
  };
  // Inari-nuri reads as a coat of vermilion paint. A small amount of the
  // original timber map survives beneath it rather than becoming dark ribs.
  if(separateInk)paint(fresh,[.68,.080,.018],.12);
  paint(weathered,[.60,.075,.018],.20);paint(beam,[.68,.075,.012],.10);
  // Three's node material applies vertex/instance colour after colorNode. Keep
  // the paint graph multiplicative and let that owner apply instance tint once.
  for(const material of [fresh,weathered,beam])material.userData={...material.userData,precinctLeafReceiver:true};
  return {fresh,weathered,beam};
}
