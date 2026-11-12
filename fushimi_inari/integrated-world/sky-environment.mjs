import * as THREE from 'three/webgpu';
import {skyPalette,SKY_SUN_DIRECTIONS} from './sky-nodes.mjs';
import {normalizeVisualLook} from './visual-look.mjs';

// Tunables for the outdoor image-based light. Brightness is normalized here;
// scene.environmentIntensity and the daylight-energy scale stay the only gain.
// Cosine-weighted luminance seen by an up-facing surface (RoomEnvironment was ~1.6).
export const SKY_ENVIRONMENT_LUMINANCE=1.25;
// Hue retained from the painted sky; 1 keeps the full blue cast in shade.
export const SKY_ENVIRONMENT_SATURATION=.6;
// Ground bounce below the horizon, relative to the horizon's luminance.
export const SKY_ENVIRONMENT_GROUND_RATIO=.3;
// Broad lit-cloud glow around the sun direction, relative to the horizon. The
// directional light owns the disc itself, so the probe never doubles the sun.
export const SKY_ENVIRONMENT_CIRCUMSOLAR=Object.freeze({day:.35,gold:.9,night:0});
export const SKY_ENVIRONMENT_CIRCUMSOLAR_SHARPNESS=5;
// r187 PMREM rounds fromScene sizes below 256 up to 256.
export const SKY_ENVIRONMENT_SIZE=256;
export const SKY_ENVIRONMENT_SCENE_NAME='Sky environment source';

const luminance=c=>.2126*c.r+.7152*c.g+.0722*c.b;
const smoothstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const _dir=new THREE.Vector3();

// Directional sky radiance for one time of day and look, in linear sRGB. The
// gradient follows sky-nodes' canvas stops (zenith 0, middle .30, horizon .51).
export function createSkyRadiance({mode='day',look='natural',ground='#73755d'}={}){
  const palette=skyPalette(mode,look),color=hex=>new THREE.Color(hex);
  const zenith=color(palette.zenith),middle=color(palette.middle),horizon=color(palette.horizon),lit=color(palette.lit);
  const horizonLuminance=Math.max(1e-6,luminance(horizon));
  const floor=new THREE.Color(ground);floor.multiplyScalar(horizonLuminance*SKY_ENVIRONMENT_GROUND_RATIO/Math.max(1e-6,luminance(floor)));
  const glow=lit.clone().multiplyScalar(horizonLuminance/Math.max(1e-6,luminance(lit))*SKY_ENVIRONMENT_CIRCUMSOLAR[palette.mode]);
  const sun=new THREE.Vector3(...SKY_SUN_DIRECTIONS[palette.mode]).normalize();
  function raw(direction,target){
    const d=_dir.copy(direction).normalize(),elevation=Math.asin(Math.max(-1,Math.min(1,d.y)))*180/Math.PI,v=.5-elevation/180;
    if(v<=.3)target.copy(zenith).lerp(middle,v/.3);
    else if(v<=.51)target.copy(middle).lerp(horizon,(v-.3)/.21);
    else target.copy(horizon);
    if(elevation<0)target.lerp(floor,smoothstep(0,12,-elevation));
    const lobe=Math.exp((d.dot(sun)-1)*SKY_ENVIRONMENT_CIRCUMSOLAR_SHARPNESS)*(1-smoothstep(0,8,-elevation));
    return target.setRGB(target.r+glow.r*lobe,target.g+glow.g*lobe,target.b+glow.b*lobe);
  }
  function shaped(direction,target){
    raw(direction,target);const y=luminance(target);
    return target.set(y+(target.r-y)*SKY_ENVIRONMENT_SATURATION,y+(target.g-y)*SKY_ENVIRONMENT_SATURATION,y+(target.b-y)*SKY_ENVIRONMENT_SATURATION);
  }
  // Cosine-weighted mean over the upper hemisphere (stratified, deterministic).
  let sum=0;const sample=new THREE.Color(),direction=new THREE.Vector3();
  for(let i=0;i<24;i++)for(let j=0;j<48;j++){
    const u=(i+.5)/24,phi=(j+.5)/48*Math.PI*2,r=Math.sqrt(u);
    sum+=luminance(shaped(direction.set(r*Math.cos(phi),Math.sqrt(1-u),r*Math.sin(phi)),sample));
  }
  const scale=SKY_ENVIRONMENT_LUMINANCE/Math.max(1e-6,sum/(24*48));
  return {mode:palette.mode,scale,sample:(direction,target=new THREE.Color())=>shaped(direction,target).multiplyScalar(scale)};
}

// A small vertex-coloured dome is the only PMREM source: no world geometry,
// lights or textures are captured. One cube target is reused, so the shared
// environment texture keeps its identity and lit pipelines never rebuild.
export function createSkyEnvironment({renderer,createGenerator=value=>new THREE.PMREMGenerator(value)}){
  const geometry=new THREE.SphereGeometry(50,48,24),positions=geometry.attributes.position;
  const colors=new THREE.Float32BufferAttribute(new Float32Array(positions.count*3),3);geometry.setAttribute('color',colors);
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false});
  const scene=new THREE.Scene(),dome=new THREE.Mesh(geometry,material);
  scene.name=SKY_ENVIRONMENT_SCENE_NAME;dome.frustumCulled=false;scene.add(dome);
  let generator=null,target=null,key=null,disposed=false;
  const stats={generations:0,key:null,mode:null,look:null,scale:0,error:null};
  function update({mode='day',look='natural',ground='#73755d'}={}){
    if(disposed)return false;
    const radiance=createSkyRadiance({mode,look:normalizeVisualLook(look),ground});
    const groundHex=new THREE.Color(ground).getHexString(),next=`${radiance.mode}|${normalizeVisualLook(look)}|${groundHex}`;
    if(next===key)return false;
    const direction=new THREE.Vector3(),color=new THREE.Color();
    for(let i=0;i<positions.count;i++){radiance.sample(direction.fromBufferAttribute(positions,i),color);colors.setXYZ(i,color.r,color.g,color.b);}
    colors.needsUpdate=true;
    generator??=createGenerator(renderer);
    const result=generator.fromScene(scene,0,.1,100,{size:SKY_ENVIRONMENT_SIZE,renderTarget:target});
    if(target&&result!==target)target.dispose();
    target=result;key=next;
    Object.assign(stats,{generations:stats.generations+1,key,mode:radiance.mode,look:normalizeVisualLook(look),scale:radiance.scale,error:null});
    return true;
  }
  return {update,stats,get texture(){return target?.texture??null;},dispose(){
    if(disposed)return;disposed=true;
    geometry.dispose();material.dispose();target?.dispose();generator?.dispose();target=null;generator=null;
  }};
}
