import * as THREE from 'three';

// Blend by position per pixel, not by triangle centroid: rotated court edges
// otherwise expose a sawtooth pattern at the terrain's one-metre tessellation.
export function blendCourtyardGround(material,gravel,romon){
  material.onBeforeCompile=shader=>{
    shader.uniforms.courtMap={value:gravel.map};
    shader.uniforms.courtFrame={value:new THREE.Vector4(romon.target[0],romon.target[2],Math.cos(romon.yaw),Math.sin(romon.yaw))};
    shader.vertexShader='attribute float groundCover;\nattribute float precinctGrass;\nvarying float grassWeight;\nvarying float coverWeight;\nvarying vec2 terrainXZ;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainXZ=position.xz;coverWeight=groundCover;grassWeight=precinctGrass;');
    shader.fragmentShader=`varying float grassWeight;
      varying float coverWeight;varying vec2 terrainXZ;
      uniform sampler2D courtMap;uniform vec4 courtFrame;
      float grassHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float grassNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(grassHash(i),grassHash(i+vec2(1.,0.)),f.x),mix(grassHash(i+vec2(0.,1.)),grassHash(i+vec2(1.,1.)),f.x),f.y);}
      `+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec2 offset=terrainXZ-courtFrame.xy;
      vec2 local=vec2(courtFrame.z*offset.x-courtFrame.w*offset.y,courtFrame.w*offset.x+courtFrame.z*offset.y);
      float courtWeight=(1.0-smoothstep(29.7,30.3,abs(local.x)))
        *smoothstep(-55.3,-54.7,local.y)*(1.0-smoothstep(21.7,22.3,local.y));
      float fleck=dot(diffuseColor.rgb,vec3(.299,.587,.114));
      float vegetationPatch=.5+.5*sin(terrainXZ.x*.17+sin(terrainXZ.y*.11))*sin(terrainXZ.y*.19);
      vec3 greens=mix(vec3(.055,.12,.024),vec3(.12,.21,.043),vegetationPatch)*(0.65+fleck*2.5);
      diffuseColor.rgb=mix(diffuseColor.rgb,greens,coverWeight*.88);
      // User-requested precinct planting treatment, not a surveyed lawn map.
      // Multi-scale pigment avoids repeating the brown leaf-litter texture.
      float grassPatch=grassNoise(terrainXZ*.37)*.65+grassNoise(terrainXZ*1.13)*.35;
      float grassGrain=grassNoise(terrainXZ*24.0);
      vec3 precinctGreen=mix(vec3(.075,.145,.033),vec3(.17,.255,.073),grassPatch)*(.87+grassGrain*.23);
      diffuseColor.rgb=mix(diffuseColor.rgb,precinctGreen,grassWeight);
      diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(courtMap,terrainXZ/1.5).rgb,courtWeight);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 untexturedNormal=normal;
      #include <normal_fragment_maps>
      normal=normalize(mix(normal,untexturedNormal,max(courtWeight,grassWeight*.9)));`);
  };
  material.customProgramCacheKey=()=> 'continuous-courtyard-precinct-grass-r64';
}
