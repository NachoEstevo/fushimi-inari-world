import * as THREE from 'three/webgpu';
import {Fn,float,texture,materialColor,materialNormal,normalViewGeometry,normalWorldGeometry,positionWorld,sin,uniform,vec3,vec4,mix,smoothstep} from 'three/tsl';
import {SUN_DIRECTIONS} from './atmosphere-profile.mjs';

// One graph per existing material, shared by every instance and LOD using it.
// Look changes update uniforms, never geometry, maps or shader definitions.
export function createAozoraFoliage(legacy={}){
  const leafGeometry=new Set([1,2,3,5].map(i=>legacy.foliage?.[i]?.geometry).filter(Boolean));
  const amount=uniform(0),sun=uniform(new THREE.Vector3(...SUN_DIRECTIONS.day).normalize());
  const shadow=uniform(new THREE.Color('#175e64')),middle=uniform(new THREE.Color('#43a54d')),light=uniform(new THREE.Color('#c5e46e'));
  const replacements=new Map(),bindings=[];
  let look='natural',mode='day',season='spring',disposed=false;
  function sync(){
    amount.value=look==='aozora'&&mode!=='night'?(mode==='gold'?.75:.86):0;
    sun.value.fromArray(SUN_DIRECTIONS[mode]??SUN_DIRECTIONS.day).normalize();
    const autumn=season==='autumn';
    shadow.value.set(autumn?'#78585c':'#175e64');
    middle.value.set(autumn?'#d39a57':'#43a54d');
    light.value.set(autumn?'#ffe3a0':'#c5e46e');
  }
  function replace(original){
    if(replacements.has(original))return replacements.get(original);
    if(original?.userData?.aozoraFoliage)return original;
    let material;
    if(original?.isNodeMaterial)material=original.clone();
    else if(original?.isMeshStandardMaterial){
      material=new THREE.MeshStandardNodeMaterial();THREE.MeshStandardMaterial.prototype.copy.call(material,original);
    }else if(original?.isMeshLambertMaterial){
      material=new THREE.MeshLambertNodeMaterial();THREE.MeshLambertMaterial.prototype.copy.call(material,original);
    }else return original;
    // Node-material clones in r186 omit the numeric cutout threshold.
    material.alphaTest=original.alphaTest;
    const base=vec4(material.colorNode??materialColor);
    const energy=base.rgb.dot(vec3(.2126,.7152,.0722));
    // Broad warm/cool planes retain a little authored pigment and all alpha.
    // The real PBR/Lambert sun and shadow still illuminate this painted albedo.
    // Low-frequency pigment varies over crown-sized patches. It has no time
    // input, texture or world scan, so foliage never sparkles while walking.
    const patch=sin(positionWorld.x.mul(.43).add(positionWorld.z.mul(.31)))
      .mul(sin(positionWorld.y.mul(.67).sub(positionWorld.z.mul(.19)))).mul(.075);
    const facing=normalWorldGeometry.dot(sun).mul(.5).add(.5).add(patch);
    const low=smoothstep(.13,.5,facing),high=smoothstep(.55,.88,facing);
    const palette=mix(mix(shadow,middle,low),light,high);
    const painted=mix(base.rgb,palette.mul(energy.clamp(0,.8).mul(.65).add(.32)),.82);
    // Earlier RGB-only canopy grades have no alpha component. Always retain
    // the authored cutout, independently of the artistic pigment graph.
    const alpha=material.map?texture(material.map).a:base.a;
    material.colorNode=Fn(builder=>{
      // Native shadows already sample the source map's alpha. They need no
      // painted RGB, view normals or palette uniforms (and no second mask).
      if(builder.material.isShadowPassMaterial)return vec4(0,0,0,1);
      return vec4(mix(base.rgb,painted,amount),alpha);
    })();
    // Suppress high-frequency normal-map sparkle; retain crown normals and all
    // original maps so other looks remain reversible without a texture upload.
    if(material.isMeshStandardNodeMaterial)material.normalNode=mix(material.normalNode??materialNormal,normalViewGeometry,amount.mul(.64)).normalize();
    material.userData={...material.userData,aozoraFoliage:true};
    material.needsUpdate=true;replacements.set(original,material);return material;
  }
  function applyTo(root){
    if(disposed||!root)return;
    const owners=[];
    root.traverse(object=>{
      if(!object.isMesh||Array.isArray(object.material))return;
      const understory=object.parent?.name==='Forest understory · static fern/sedge LOD';
      if(leafGeometry.has(object.geometry)||object.userData.precinctCanopy||object.userData.seasonalMaple||object.userData.trees||understory)owners.push(object);
    });
    for(const object of owners)replace(object.material);
    // Far proxies often share a near material but have a different geometry.
    root.traverse(object=>{
      const next=replacements.get(object.material);
      if(!next||next===object.material)return;
      bindings.push({object,original:object.material,next});object.material=next;
    });
  }
  return {applyTo,
    setLook(value){if(!disposed){look=value;sync();}},
    setTimeOfDay(value){if(!disposed){mode=Object.hasOwn(SUN_DIRECTIONS,value)?value:'day';sync();}},
    setSeason(value){if(!disposed){season=value==='autumn'?'autumn':'spring';sync();}},
    get stats(){return {look,mode,season,strength:amount.value,materials:replacements.size,meshes:bindings.length,extraTextures:0,extraGeometryBytes:0,extraDraws:0,animated:false};},
    dispose(){
      if(disposed)return;disposed=true;
      for(const {object,original,next}of bindings)if(object.material===next)object.material=original;
      for(const material of replacements.values())material.dispose();replacements.clear();bindings.length=0;
    }
  };
}
