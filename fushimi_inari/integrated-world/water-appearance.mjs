import * as THREE from 'three';

const palettes={pond:{day:'#5a8171',gold:'#75846c',night:'#39555a'},lake:{day:'#4e7e87',gold:'#708b8d',night:'#314a58'},shinike:{day:'#626950',gold:'#79785a',night:'#383e34'}};

// One material per desired kind, shared by all its water meshes. Standard
// lighting/shadows remain authoritative; ripples never move vertices or levels.
export function createWaterAppearance({kind='pond'}={}){
 if(!palettes[kind])throw new RangeError('Water kind must be pond, lake or shinike');
 const material=new THREE.MeshStandardMaterial({color:palettes[kind].day,roughness:kind==='shinike'?.34:kind==='pond'?.28:.24,metalness:kind==='shinike'?.04:.08,emissive:0x000000,side:THREE.DoubleSide});
 const uniforms={uWaTime:{value:0},uWaStrength:{value:1},uWaWaveA:{value:new THREE.Vector4(...(kind!=='lake'?[2.7,1.9,.008,.65]:[1.05,.73,.021,.48]))},uWaWaveB:{value:new THREE.Vector4(...(kind!=='lake'?[-1.5,3.1,.005,-.43]:[-.61,1.31,.012,-.31]))}};
 let mode='day';
 material.userData.waterAppearance={kind,uniforms,get mode(){return mode;},update(seconds){if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Water time must be finite nonnegative elapsed seconds');uniforms.uWaTime.value=seconds;},setMode(value){if(!palettes[kind][value])throw new RangeError('Water mode must be day, gold or night');mode=value;material.color.set(palettes[kind][value]);material.roughness=value==='night'?(kind==='shinike'?.38:.34):kind==='shinike'?.34:kind==='pond'?.28:.24;uniforms.uWaStrength.value=value==='night'?.78:1;}};
 material.customProgramCacheKey=()=> 'water-appearance-r86-v1';
 material.onBeforeCompile=shader=>{
  if(!shader.vertexShader.includes('#include <project_vertex>')||!shader.fragmentShader.includes('#include <normal_fragment_maps>')||!shader.fragmentShader.includes('#include <color_fragment>'))throw Error('Water appearance requires Three r164 standard shader hooks');
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec2 vWaWorldXZ;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
   vec4 waWorldPosition = vec4( transformed, 1.0 );
   #ifdef USE_BATCHING
    waWorldPosition = batchingMatrix * waWorldPosition;
   #endif
   #ifdef USE_INSTANCING
    waWorldPosition = instanceMatrix * waWorldPosition;
   #endif
   vWaWorldXZ = ( modelMatrix * waWorldPosition ).xz;`);
  shader.fragmentShader=`varying vec2 vWaWorldXZ;
   uniform float uWaTime;
   uniform float uWaStrength;
   uniform vec4 uWaWaveA;
   uniform vec4 uWaWaveB;
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float waPhaseA = dot( vWaWorldXZ, uWaWaveA.xy ) + uWaTime * uWaWaveA.w;
   float waPhaseB = dot( vWaWorldXZ, uWaWaveB.xy ) + uWaTime * uWaWaveB.w;
   float waBroadTone = sin( dot( vWaWorldXZ, vec2( 0.17, 0.11 ) ) );
   diffuseColor.rgb *= 0.97 + 0.035 * waBroadTone + 0.018 * sin( waPhaseA ) * sin( waPhaseB );`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 waSlope = uWaStrength * ( uWaWaveA.z * uWaWaveA.xy * cos( waPhaseA ) + uWaWaveB.z * uWaWaveB.xy * cos( waPhaseB ) );
   // Three's normal is view-space here. Transform the world-space analytic
   // gradient first, then project it onto this surface's actual tangent plane.
   vec3 waViewSlope = mat3( viewMatrix ) * vec3( waSlope.x, 0.0, waSlope.y );
   vec3 waTangentSlope = waViewSlope - normal * dot( waViewSlope, normal );
   normal = normalize( normal - faceDirection * waTangentSlope );`);
 };
 return material;
}
