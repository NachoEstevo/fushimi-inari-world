import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';

const sourceIds=['way/946510942','way/79699849','way/1057050892','way/297888106','way/79699850'],shoulder=2,fade=.5;
const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};

export function makeKeihanStreetGroundMask(features){
 const paths=sourceIds.map(id=>features.paths?.find(p=>p.id===id));
 if(paths.some(p=>!p||p.points.length<2||!p.points.flat().every(Number.isFinite)))return null;
 const segments=[];
 for(const path of paths){
  const radius=pathWidth(path.tags??{})/2+shoulder;
  for(let i=1;i<path.points.length;i++){
   const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2];
   if(dx*dx+dz*dz>1e-8)segments.push({a:[a[0],a[2]],b:[b[0],b[2]],radius});
  }
 }
 // The frozen street and Urasando source has twenty-three segments. Stop at the
 // stone-torii approach; way/105449676 beyond the garden is not included.
 // A substantially changed trace
 // needs review instead of silently increasing every terrain fragment's work.
 if(!segments.length||segments.length>32)return null;
 const bounds=[Math.min(...segments.flatMap(s=>[s.a[0]-s.radius-fade,s.b[0]-s.radius-fade])),Math.max(...segments.flatMap(s=>[s.a[0]+s.radius+fade,s.b[0]+s.radius+fade])),Math.min(...segments.flatMap(s=>[s.a[1]-s.radius-fade,s.b[1]-s.radius-fade])),Math.max(...segments.flatMap(s=>[s.a[1]+s.radius+fade,s.b[1]+s.radius+fade]))];
 const mask=(x,z)=>{
  if(x<bounds[0]||x>bounds[1]||z<bounds[2]||z>bounds[3])return 0;
  let weight=0;
  for(const s of segments){const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[1])*dz)/(dx*dx+dz*dz))),distance=Math.hypot(x-s.a[0]-dx*t,z-s.a[1]-dz*t);weight=Math.max(weight,1-smooth(s.radius-fade,s.radius+fade,distance));}
  return weight;
 };
 return {mask,segments,bounds,sourceIds:[...sourceIds],shoulder,fade};
}

// Appearance on existing terrain only. Call after the entrance blend and
// before spatialMeshes. Source street centre lines retain all their corners;
// the two-metre mineral shoulder is inferred from the supplied street views.
export function blendKeihanStreetGround(geometry,material,features){
 const layout=makeKeihanStreetGroundMask(features);
 if(!layout||!geometry.attributes?.position)return {built:false,reason:'Keihan street trace unavailable or changed'};
 const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey(),count=layout.segments.length;
 material.onBeforeCompile=shader=>{
  previous.call(material,shader);
  shader.uniforms.keihanStreetSegments={value:layout.segments.map(s=>new THREE.Vector4(...s.a,...s.b))};
  shader.uniforms.keihanStreetRadii={value:layout.segments.map(s=>s.radius)};
  shader.uniforms.keihanStreetBounds={value:new THREE.Vector4(...layout.bounds)};
  shader.vertexShader='varying vec2 keihanStreetXZ;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nkeihanStreetXZ=position.xz;');
  shader.fragmentShader=`varying vec2 keihanStreetXZ;
uniform vec4 keihanStreetSegments[${count}];
uniform float keihanStreetRadii[${count}];
uniform vec4 keihanStreetBounds;
float keihanStreetMask(vec2 p){
 if(p.x<keihanStreetBounds.x||p.x>keihanStreetBounds.y||p.y<keihanStreetBounds.z||p.y>keihanStreetBounds.w)return 0.0;
 float weight=0.0;
 for(int i=0;i<${count};i++){
  vec4 segment=keihanStreetSegments[i];vec2 direction=segment.zw-segment.xy;
  float along=clamp(dot(p-segment.xy,direction)/dot(direction,direction),0.0,1.0);
  float distanceToStreet=length(p-segment.xy-direction*along);
  weight=max(weight,1.0-smoothstep(keihanStreetRadii[i]-.5,keihanStreetRadii[i]+.5,distanceToStreet));
 }
 return weight;
}
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float keihanGroundWeight=keihanStreetMask(keihanStreetXZ);
 if(keihanGroundWeight>0.0){
  float keihanGrain=fract(sin(dot(floor(keihanStreetXZ*30.0),vec2(127.1,311.7)))*43758.5453);
  float keihanTextureLuma=dot(diffuseColor.rgb,vec3(.299,.587,.114));
  vec3 keihanMineral=vec3(.26,.275,.26)+vec3((keihanGrain-.5)*.026+(keihanTextureLuma-.5)*.015);
  diffuseColor.rgb=mix(diffuseColor.rgb,keihanMineral,keihanGroundWeight);
 }`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','vec3 keihanBaseNormal=normal;\n#include <normal_fragment_maps>\nnormal=normalize(mix(normal,keihanBaseNormal,keihanGroundWeight));');
 };
 material.customProgramCacheKey=()=>`${previousKey}-keihan-street-mineral-v1-${count}`;
 material.needsUpdate=true;
 return {built:true,segments:count,bounds:layout.bounds,sourceIds:layout.sourceIds,inferredShoulder:shoulder,fade,geometryUnchanged:true};
}
