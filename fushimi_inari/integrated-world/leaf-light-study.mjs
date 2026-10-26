import * as THREE from 'three/webgpu';
import {float,materialColor,positionWorld,texture,uniform,vec4} from 'three/tsl';

// Static artistic approximation, not a projection of the actual canopy.
export function createLeafLightStudy({strength=.08,size=128,enabled=false,sunSlope=[-800/1400,-600/1400]}={}){
  if(!Number.isFinite(strength)||strength<0||strength>.1)throw new RangeError('Strength must be between 0 and 0.1');
  if(!Number.isInteger(size)||size<16||size>128)throw new RangeError('Mask size must be an integer from 16 to 128');
  const validSlope=value=>Array.isArray(value)&&value.length===2&&value.every(n=>Number.isFinite(n)&&Math.abs(n)<=4);
  if(!validSlope(sunSlope))throw new RangeError('Sun slope must contain two finite values between -4 and 4');
  const pixels=new Uint8Array(size*size);
  // Periodic soft ellipses make a repeatable, seamless mask without an image asset.
  let seed=173;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const leaves=Array.from({length:32},()=>{
    const x=random(),y=random(),rx=.025+random()*.035,ry=.012+random()*.025,angle=random()*Math.PI;
    return {x,y,rx,ry,c:Math.cos(angle),s:Math.sin(angle)};
  });
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let shade=0;
    for(const leaf of leaves){
      const dx=((x+.5)/size-leaf.x+.5+1)%1-.5,dy=((y+.5)/size-leaf.y+.5+1)%1-.5;
      const {c,s}=leaf;
      const u=(dx*c+dy*s)/leaf.rx,v=(-dx*s+dy*c)/leaf.ry;
      shade=Math.max(shade,Math.max(0,Math.min(1,(1-u*u-v*v)*3)));
    }
    pixels[y*size+x]=Math.round(shade*255);
  }
  const mask=new THREE.DataTexture(pixels,size,size,THREE.RedFormat);
  mask.colorSpace=THREE.NoColorSpace;mask.wrapS=mask.wrapT=THREE.RepeatWrapping;
  mask.magFilter=THREE.LinearFilter;mask.minFilter=THREE.LinearMipmapLinearFilter;
  mask.generateMipmaps=true;mask.needsUpdate=true;
  const amount=uniform(enabled?strength:0),slope=uniform(new THREE.Vector2(...sunSlope)),attached=new Map();
  let mipBytes=0;
  for(let side=size;side>=1;side=Math.floor(side/2))mipBytes+=side*side;
  let active=enabled,mode='day',disposed=false;
  function sync(){amount.value=active&&mode!=='night'?strength:0;}
  return {
    texture:mask,
    get stats(){return {enabled:active,timeOfDay:mode,strength:amount.value,sunSlope:slope.value.toArray(),sourceBytes:pixels.byteLength,mipBytes,materials:attached.size,disposed};},
    attach(material){
      if(disposed)throw new Error('Study is disposed');
      if(!material?.isNodeMaterial)throw new TypeError('A node material is required');
      if(attached.has(material))return;
      const original=material.colorNode,base=vec4(original??materialColor);
      // Project along the chosen sun direction, including world height. The
      // static mask still does not represent individual foliage or occlusion.
      const projected=positionWorld.xz.sub(slope.mul(positionWorld.y));
      const coverage=texture(mask,projected.mul(.23)).r;
      const node=vec4(base.rgb.mul(float(1).sub(coverage.mul(amount))),base.a);
      attached.set(material,{original,node});material.colorNode=node;material.needsUpdate=true;
    },
    setEnabled(value){if(disposed)return;active=Boolean(value);sync();},
    setTimeOfDay(value){if(disposed)return;mode=value;sync();},
    setSunSlope(value){
      if(disposed)return;
      if(!validSlope(value))throw new RangeError('Sun slope must contain two finite values between -4 and 4');
      slope.value.set(...value);
    },
    dispose(){
      if(disposed)return;
      disposed=true;
      for(const [material,{original,node}] of attached){
        // Do not overwrite a later owner's replacement.
        if(material.colorNode===node){material.colorNode=original;material.needsUpdate=true;}
      }
      attached.clear();mask.dispose();
    }
  };
}
