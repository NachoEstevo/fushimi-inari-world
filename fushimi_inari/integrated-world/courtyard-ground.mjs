import * as THREE from 'three';

// Blend by position per pixel, not by triangle centroid: rotated court edges
// otherwise expose a sawtooth pattern at the terrain's one-metre tessellation.
export function blendCourtyardGround(material,gravel,romon){
  material.onBeforeCompile=shader=>{
    shader.uniforms.courtMap={value:gravel.map};
    shader.uniforms.courtFrame={value:new THREE.Vector4(romon.target[0],romon.target[2],Math.cos(romon.yaw),Math.sin(romon.yaw))};
    shader.vertexShader='attribute float groundCover;\nvarying float coverWeight;\nvarying vec2 terrainXZ;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainXZ=position.xz;coverWeight=groundCover;');
    shader.fragmentShader='varying float coverWeight;\nvarying vec2 terrainXZ;\nuniform sampler2D courtMap;\nuniform vec4 courtFrame;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 offset=terrainXZ-courtFrame.xy;
      vec2 local=vec2(courtFrame.z*offset.x-courtFrame.w*offset.y,courtFrame.w*offset.x+courtFrame.z*offset.y);
      float courtWeight=(1.0-smoothstep(29.7,30.3,abs(local.x)))
        *smoothstep(-55.3,-54.7,local.y)*(1.0-smoothstep(21.7,22.3,local.y));
      float fleck=dot(diffuseColor.rgb,vec3(.299,.587,.114));
      float vegetationPatch=.5+.5*sin(terrainXZ.x*.17+sin(terrainXZ.y*.11))*sin(terrainXZ.y*.19);
      vec3 greens=mix(vec3(.055,.12,.024),vec3(.12,.21,.043),vegetationPatch)*(0.65+fleck*2.5);
      diffuseColor.rgb=mix(diffuseColor.rgb,greens,coverWeight*.88);
      diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(courtMap,terrainXZ/1.5).rgb,courtWeight);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 untexturedNormal=normal;
      #include <normal_fragment_maps>
      normal=normalize(mix(normal,untexturedNormal,courtWeight));`);
  };
  material.customProgramCacheKey=()=> 'continuous-courtyard-ground-cover-r33';
}
