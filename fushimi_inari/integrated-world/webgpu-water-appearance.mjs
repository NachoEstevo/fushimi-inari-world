import * as THREE from 'three/webgpu';
import {uniform,positionWorld,positionLocal,normalWorldGeometry,faceDirection,normalView,cameraViewMatrix,positionViewDirection,materialColor,materialRoughness,materialOpacity,vec2,vec3,vec4,sin,cos,exp,normalize,dot,abs,clamp,mix,pow,transformNormalToView} from 'three/tsl';

const palettes={pond:{day:'#5a8171',gold:'#75846c',night:'#39555a'},lake:{day:'#4e7e87',gold:'#708b8d',night:'#314a58'},shinike:{day:'#4c563f',gold:'#67694b',night:'#383e34'}};

// Analytic gradients retain the authored water levels: only normals change.
export function createWaterAppearance({kind='pond'}={}){
 if(!palettes[kind])throw new RangeError('Water kind must be pond, lake or shinike');
 const shinike=kind==='shinike';
 const roughnessForMode=mode=>shinike?(mode==='night'?.17:mode==='gold'?.13:.14):mode==='night'?.34:kind==='pond'?.28:.24;
 const Material=shinike?THREE.MeshPhysicalNodeMaterial:THREE.MeshStandardNodeMaterial;
 const material=new Material({color:palettes[kind].day,roughness:roughnessForMode('day'),metalness:shinike?0:.08,side:THREE.DoubleSide,...(shinike?{ior:1.333,specularIntensity:1,clearcoat:0,transmission:0,opacity:.62,transparent:true,depthWrite:false,forceSinglePass:true}:{})});
 const time=uniform(0),strength=uniform(1);
 const a=vec4(...(shinike?[2.7,1.9,.014,.65]:kind==='pond'?[2.7,1.9,.008,.65]:[1.05,.73,.021,.48]));
 const b=vec4(...(shinike?[-1.5,3.1,.009,-.43]:kind==='pond'?[-1.5,3.1,.005,-.43]:[-.61,1.31,.012,-.31]));
 const xz=positionWorld.xz,wa=dot(xz,vec2(-.41,.67)).sub(time.mul(.11)),wb=dot(xz,vec2(.73,.29)).add(time.mul(.14));
 const pa=dot(xz,a.xy).add(time.mul(a.w)).add(sin(wa).mul(1.7)),pb=dot(xz,b.xy).add(time.mul(b.w)).add(sin(wb).mul(1.4));
 const pc=dot(xz,vec2(.53,-.37)).add(time.mul(.19)),pd=dot(xz,vec2(5.13,2.41)).sub(time.mul(.83));
 const slope=a.xy.add(vec2(-.41,.67).mul(cos(wa)).mul(1.7)).mul(a.z).mul(.4).mul(cos(pa))
  .add(b.xy.add(vec2(.73,.29).mul(cos(wb)).mul(1.4)).mul(b.z).mul(.4).mul(cos(pb)))
  .add(vec2(.53,-.37).mul(a.z).mul(.3).mul(cos(pc)))
  .add(vec2(5.13,2.41).mul(b.z).mul(.07).mul(cos(pd))).mul(strength);
 const worldSlope=vec3(slope.x,0,slope.y),tangentSlope=worldSlope.sub(normalWorldGeometry.mul(dot(worldSlope,normalWorldGeometry)));
 material.normalNode=cameraViewMatrix.transformDirection(normalize(normalWorldGeometry.sub(tangentSlope))).mul(faceDirection);
 material.colorNode=materialColor.mul(sin(dot(xz,vec2(.17,.11))).mul(.035).add(sin(pc).mul(.006)).add(.97));
 if(shinike){
  const patch=sin(dot(xz,vec2(.31,-.23)).add(sin(dot(xz,vec2(-.19,.37))).mul(.6)));
  material.roughnessNode=clamp(materialRoughness.add(patch.mul(.012)),.10,.20);
  material.opacityNode=mix(materialOpacity,.94,pow(clamp(abs(dot(normalView,positionViewDirection)),0,1).oneMinus(),5));
 }
 let mode='day';
 material.userData.waterAppearance={kind,uniforms:{uWaTime:time,uWaStrength:strength},get mode(){return mode;},update(seconds){if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('Water time must be finite nonnegative elapsed seconds');time.value=seconds;},setMode(value){if(!palettes[kind][value])throw new RangeError('Water mode must be day, gold or night');mode=value;material.color.set(palettes[kind][value]);material.roughness=roughnessForMode(value);strength.value=value==='night'?.78:1;}};
 return material;
}

export function createBasinWaterAppearance(environment){
 const material=new THREE.MeshStandardNodeMaterial({color:'#27372e',metalness:.15,roughness:.12,envMap:environment,envMapIntensity:1.25});
 const time=uniform(0),xy=positionLocal.xy;
 const phaseX=xy.x.mul(31).add(time.mul(2)),phaseY=xy.y.mul(24).sub(time.mul(1.6));
 material.positionNode=positionLocal.add(vec3(0,0,sin(phaseX).mul(cos(phaseY)).mul(.003)));
 const delta=xy.sub(vec2(.68,.17)),distance=delta.length();
 const ripple=normalize(delta.add(vec2(.0001))).mul(cos(distance.mul(95).sub(time.mul(4)))).mul(exp(distance.mul(-2.2))).mul(.16)
  .add(vec2(cos(xy.x.mul(43).add(time.mul(1.5))),sin(xy.y.mul(37).sub(time))).mul(.045));
 // Both the local vertex-normal waves and the impact ripples follow the basin.
 const localNormal=normalize(vec3(cos(phaseX).mul(.08).add(ripple.x),sin(phaseY).mul(.07).add(ripple.y),1));
 material.normalNode=transformNormalToView(localNormal);
 material.userData.waterAppearance={update(seconds){time.value=seconds;},setMode(mode){material.envMapIntensity=mode==='night'?.08:mode==='gold'?.85:1.25;}};
 return material;
}
