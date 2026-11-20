import {MathUtils,Vector3,Vector4,WebGPUCoordinateSystem} from 'three/webgpu';
import {Fn,If,Loop,array,exp,float,ivec2,mix,smoothstep,textureLoad,textureSize,uniform,uv,varying,vec2,vec3} from 'three/tsl';
import {outlooks} from './panorama-policy.mjs';
import {SUN_CORE_RADIUS_UV} from './sky-nodes.mjs';

const lookout=new Vector3(...outlooks[0]);
const sampleCount=48;

// The disc is a camera-facing billboard at a finite distance. Use the same
// projection and size as the sprite, including optical zoom and view offsets.
export function projectSunDisc(camera,sprite,disc,viewPosition){
  camera.updateWorldMatrix(true,false);
  sprite.getWorldPosition(viewPosition).applyMatrix4(camera.matrixWorldInverse);
  const distance=-viewPosition.z;
  if(distance<=camera.near||distance>=camera.far)return null;
  const projection=camera.projectionMatrix;
  const radius=SUN_CORE_RADIUS_UV*sprite.scale.x/(2*distance);
  viewPosition.applyMatrix4(projection);
  disc.set(viewPosition.x*.5+.5,.5-viewPosition.y*.5,radius*projection.elements[0],radius*projection.elements[5]);
  if(disc.x+disc.z<=0||disc.x-disc.z>=1||disc.y+disc.w<=0||disc.y-disc.w>=1)return null;
  return camera.coordinateSystem===WebGPUCoordinateSystem?viewPosition.z:viewPosition.z*.5+.5;
}

// Each vertex of the final fullscreen triangle computes the same fraction.
// Bilinear interpolation of four binary visibility tests keeps subpixel
// camera movement continuous across hard silhouettes without frame history.
function visibleDiscArea(depth,disc,gate){
  const samples=array(Array.from({length:sampleCount},(_,i)=>{
    const radius=Math.sqrt((i+.5)/sampleCount),angle=i*Math.PI*(3-Math.sqrt(5));
    return vec2(radius*Math.cos(angle),radius*Math.sin(angle));
  }));
  return varying(Fn(()=>{
    const visible=float(0).toVar();
    If(gate.z.greaterThan(0),()=>{
      const size=ivec2(textureSize(depth,0)).toConst();
      Loop(sampleCount,({i})=>{
        const position=disc.xy.add(samples.element(i).mul(disc.zw)).mul(vec2(size)).sub(.5).toConst();
        const base=ivec2(position.floor()),fraction=position.fract();
        const open=(x,y)=>{
          const texel=base.add(ivec2(x,y));
          const inside=texel.greaterThanEqual(ivec2(0)).all().and(texel.lessThan(size).all());
          const z=textureLoad(depth,texel.clamp(ivec2(0),size.sub(1)),0).r;
          return float(inside.and(z.sub(gate.x).mul(gate.y).greaterThanEqual(0)));
        };
        visible.addAssign(mix(mix(open(0,0),open(1,0),fraction.x),mix(open(0,1),open(1,1),fraction.x),fraction.y));
      });
    });
    return visible.mul(gate.z.div(sampleCount));
  })(),'sunsetDiscCoverage').setInterpolation('flat');
}

export function createYotsutsujiSunsetHalo({camera,sky,depth}){
  const disc=uniform(new Vector4(.5,.5,1,1)),gate=uniform(new Vector3(1,1,0));
  const visible=visibleDiscArea(depth,disc,gate),viewPosition=new Vector3();
  const light=Fn(()=>{
    const radiance=vec3(0).toVar();
    If(visible.greaterThan(0),()=>{
      const delta=uv().sub(disc.xy).div(disc.zw);
      const radiusSq=delta.dot(delta).toConst();
      If(radiusSq.lessThan(20),()=>{
        const profile=exp(radiusSq.mul(-.24)).mul(smoothstep(12,20,radiusSq).oneMinus());
        radiance.assign(vec3(.38,.12,.035).mul(profile).mul(visible));
      });
    });
    return radiance;
  })();
  function update(high){
    const weight=high&&sky.naturalSunset?1-MathUtils.smoothstep(camera.position.distanceTo(lookout),20,48):0;
    sky.setSpriteHaloStrength(1-weight);
    gate.value.z=0;
    if(!weight)return;
    const z=projectSunDisc(camera,sky.sunDisc,disc.value,viewPosition);
    if(z!==null)gate.value.set(z,camera.reversedDepth?-1:1,weight);
  }
  return {light,update,dispose(){sky.setSpriteHaloStrength(1);}};
}
