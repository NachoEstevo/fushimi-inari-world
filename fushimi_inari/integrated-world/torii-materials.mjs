// Keep original maps while limiting their exaggerated bare-wood contrast at
// walking distance. Instance tint remains active (multiply, never overwrite).
export function toriiMaterials(legacy,{separateInk=false}={}){
  const fresh=legacy.torii.fresh.clone();
  fresh.normalScale.set(.45,.45);fresh.roughness=.4;fresh.clearcoat=.35;
  const weathered=legacy.torii.weathered.clone();
  weathered.normalScale.set(.55,.55);weathered.roughness=.78;
  weathered.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
      'diffuseColor.rgb *= mix(vec3(0.60,0.075,0.018), texture2D(map, vMapUv).rgb, 0.30);');
  };
  weathered.customProgramCacheKey=()=> 'original-torii-wear-r04';
  const beam=legacy.materials.vermilionMat.clone();
  beam.color.set(0xffffff);beam.normalScale.set(.18,.18);beam.roughness=.57;
  beam.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
      'diffuseColor.rgb *= mix(vec3(0.68,0.075,0.012), texture2D(map, vMapUv).rgb, 0.10);');
  };
  beam.customProgramCacheKey=()=> 'original-painted-beam-r04';
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
  return {fresh,weathered,beam};
}
