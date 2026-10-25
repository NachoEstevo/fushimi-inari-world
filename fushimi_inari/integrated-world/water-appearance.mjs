import * as THREE from 'three';

const palettes={pond:{day:'#5a8171',gold:'#75846c',night:'#39555a'},lake:{day:'#4e7e87',gold:'#708b8d',night:'#314a58'},shinike:{day:'#4c563f',gold:'#67694b',night:'#383e34'}};

// One material per desired kind, shared by all its water meshes. Standard
// lighting/shadows remain authoritative; ripples never move vertices or levels.
export function createWaterAppearance({kind='pond'}={}){
 if(!palettes[kind])throw new RangeError('Water kind must be pond, lake or shinike');
 const shinike=kind==='shinike';
 // Low roughness retains wooded reflection detail in the cached environment;
 // gentle normal variation breaks its edges without a frosted surface.
 const roughnessForMode=mode=>shinike?(mode==='night'?.17:mode==='gold'?.13:.14):mode==='night'?.34:kind==='pond'?.28:.24;
 // Water's dielectric Fresnel response is set by IOR, rather than metallic
 // tint. Static scene environment ownership/capture stays with the caller.
 const Material=shinike?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
 const material=new Material({color:palettes[kind].day,roughness:roughnessForMode('day'),metalness:shinike?0:.08,emissive:0x000000,side:THREE.DoubleSide,...(shinike?{ior:1.333,specularIntensity:1,clearcoat:0,transmission:0,opacity:.62,transparent:true,depthWrite:false,forceSinglePass:true}: {})});
 const uniforms={uWaTime:{value:0},uWaStrength:{value:1},uWaWaveA:{value:new THREE.Vector4(...(shinike?[2.7,1.9,.014,.65]:kind==='pond'?[2.7,1.9,.008,.65]:[1.05,.73,.021,.48]))},uWaWaveB:{value:new THREE.Vector4(...(shinike?[-1.5,3.1,.009,-.43]:kind==='pond'?[-1.5,3.1,.005,-.43]:[-.61,1.31,.012,-.31]))}};
 let mode='day';
 material.userData.waterAppearance={kind,uniforms,get mode(){return mode;},update(seconds){if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Water time must be finite nonnegative elapsed seconds');uniforms.uWaTime.value=seconds;},setMode(value){if(!palettes[kind][value])throw new RangeError('Water mode must be day, gold or night');mode=value;material.color.set(palettes[kind][value]);material.roughness=roughnessForMode(value);uniforms.uWaStrength.value=value==='night'?.78:1;}};
 material.customProgramCacheKey=()=> 'water-appearance-r100-pond-optics-v5';
 material.onBeforeCompile=shader=>{
  if(!shader.vertexShader.includes('#include <project_vertex>')||!shader.fragmentShader.includes('#include <normal_fragment_maps>')||!shader.fragmentShader.includes('#include <color_fragment>'))throw Error('Water appearance requires Three r164 standard shader hooks');
  if(shinike&&(!shader.fragmentShader.includes('#include <roughnessmap_fragment>')||!shader.fragmentShader.includes('#include <opaque_fragment>')))throw Error('Shin-ike optics requires Three r164 physical shader hooks');
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
   // Cross-axis phase modulation bends wavefronts into irregular patches.
   // Gradients include the chain rule so highlights follow the same surface.
   float waWarpA = dot( vWaWorldXZ, vec2( -0.41, 0.67 ) ) - uWaTime * 0.11;
   float waWarpB = dot( vWaWorldXZ, vec2( 0.73, 0.29 ) ) + uWaTime * 0.14;
   float waPhaseA = dot( vWaWorldXZ, uWaWaveA.xy ) + uWaTime * uWaWaveA.w + 1.7 * sin( waWarpA );
   float waPhaseB = dot( vWaWorldXZ, uWaWaveB.xy ) + uWaTime * uWaWaveB.w + 1.4 * sin( waWarpB );
   // Unequal wavelengths and headings break up the crossed-wave lattice.
   // Slow broad ripples and finer capillary detail drift independently.
   float waPhaseC = dot( vWaWorldXZ, vec2( 0.53, -0.37 ) ) + uWaTime * 0.19;
   float waPhaseD = dot( vWaWorldXZ, vec2( 5.13, 2.41 ) ) - uWaTime * 0.83;
   float waBroadTone = sin( dot( vWaWorldXZ, vec2( 0.17, 0.11 ) ) );
   diffuseColor.rgb *= 0.97 + 0.035 * waBroadTone + 0.006 * sin( waPhaseC );`);
  if(shinike){
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    // Two broad, non-aligned scales subtly vary gloss without adding
    // normal texture allocations or another reflection render.
    float waRoughPatch = sin( dot( vWaWorldXZ, vec2( 0.31, -0.23 ) ) + 0.6 * sin( dot( vWaWorldXZ, vec2( -0.19, 0.37 ) ) ) );
    roughnessFactor = clamp( roughnessFactor + 0.012 * waRoughPatch, 0.10, 0.20 );`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    // Alpha is a shallow-water visibility approximation, not transmission
    // or measured turbidity. Preserve bed visibility looking down while
    // distant grazing water carries the reflected wooded surroundings.
    float waFacing = clamp( abs( dot( normal, normalize( vViewPosition ) ) ), 0.0, 1.0 );
    float waGrazing = pow( 1.0 - waFacing, 5.0 );
    diffuseColor.a = mix( opacity, 0.94, waGrazing );
    #include <opaque_fragment>`);
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 waSlope = uWaStrength * (
    0.40 * uWaWaveA.z * ( uWaWaveA.xy + 1.7 * vec2( -0.41, 0.67 ) * cos( waWarpA ) ) * cos( waPhaseA )
    + 0.40 * uWaWaveB.z * ( uWaWaveB.xy + 1.4 * vec2( 0.73, 0.29 ) * cos( waWarpB ) ) * cos( waPhaseB )
    + 0.30 * uWaWaveA.z * vec2( 0.53, -0.37 ) * cos( waPhaseC )
    + 0.07 * uWaWaveB.z * vec2( 5.13, 2.41 ) * cos( waPhaseD ) );
   // Three's normal is view-space here. Transform the world-space analytic
   // gradient first, then project it onto this surface's actual tangent plane.
   vec3 waViewSlope = mat3( viewMatrix ) * vec3( waSlope.x, 0.0, waSlope.y );
   vec3 waTangentSlope = waViewSlope - normal * dot( waViewSlope, normal );
   normal = normalize( normal - faceDirection * waTangentSlope );`);
 };
 return material;
}

export function createBasinWaterAppearance(environment){
    const material=new THREE.MeshStandardMaterial({color:'#27372e',metalness:.15,roughness:.12,envMap:environment,envMapIntensity:1.25});
    const waterTime={value:0};
    material.userData.waterAppearance={
      update(seconds){waterTime.value=seconds;},
      setMode(mode){material.envMapIntensity=mode==='night'?.08:mode==='gold'?.85:1.25;}
    };
    material.customProgramCacheKey=()=> 'temizuya-water-r86';
    material.onBeforeCompile=shader=>{
      shader.uniforms.waterTime=waterTime;
      shader.vertexShader='varying vec2 basinUv;\nuniform float waterTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal.x+=.08*cos(position.x*31.0+waterTime*2.0);objectNormal.y+=.07*sin(position.y*24.0-waterTime*1.6);');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbasinUv=position.xy;transformed.z+=.003*sin(position.x*31.0+waterTime*2.0)*cos(position.y*24.0-waterTime*1.6);');
      shader.fragmentShader='varying vec2 basinUv;\nuniform float waterTime;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
        vec2 delta=basinUv-vec2(.68,.17);
        float dist=length(delta);
        vec2 ripple=normalize(delta+vec2(.0001))*cos(dist*95.0-waterTime*4.0)*exp(-dist*2.2)*.16;
        ripple+=vec2(cos(basinUv.x*43.0+waterTime*1.5),sin(basinUv.y*37.0-waterTime))*.045;
        normal=normalize(normal+vec3(ripple,0.0));`);
    };
    return material;
}
