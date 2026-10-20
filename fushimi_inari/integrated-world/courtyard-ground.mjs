import * as THREE from 'three';

// Blend by position per pixel, not by triangle centroid: rotated court edges
// otherwise expose a sawtooth pattern at the terrain's one-metre tessellation.
export function blendCourtyardGround(material,gravel,romon){
  material.onBeforeCompile=shader=>{
    shader.uniforms.courtMap={value:gravel.map};
    shader.uniforms.courtFrame={value:new THREE.Vector4(romon.target[0],romon.target[2],Math.cos(romon.yaw),Math.sin(romon.yaw))};
    shader.vertexShader='varying vec2 terrainXZ;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainXZ=position.xz;');
    shader.fragmentShader='varying vec2 terrainXZ;\nuniform sampler2D courtMap;\nuniform vec4 courtFrame;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 offset=terrainXZ-courtFrame.xy;
      vec2 local=vec2(courtFrame.z*offset.x-courtFrame.w*offset.y,courtFrame.w*offset.x+courtFrame.z*offset.y);
      float courtWeight=(1.0-smoothstep(29.7,30.3,abs(local.x)))
        *smoothstep(-55.3,-54.7,local.y)*(1.0-smoothstep(21.7,22.3,local.y));
      diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(courtMap,terrainXZ/1.5).rgb,courtWeight);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 untexturedNormal=normal;
      #include <normal_fragment_maps>
      normal=normalize(mix(normal,untexturedNormal,courtWeight));`);
  };
  material.customProgramCacheKey=()=> 'continuous-courtyard-r23';
}
