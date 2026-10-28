import * as THREE from 'three/webgpu';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createStationMaterialStudy} from './webgpu-station-materials.mjs';
import {LIGHT_PRESETS} from './route-lighting.mjs';
import {createStationReflectionReadiness} from './station-reflection-readiness.mjs';
import {createMineralSurfaceFinish} from './mineral-surface-finish.mjs';
import {createSoftLightMotes} from './soft-light-motes.mjs';
import {normalizeVisualLook} from './visual-look.mjs';
import {compileSelectedVisuals} from './scoped-compilation.mjs';

// The caller owns renderer initialization, the render loop and time-of-day.
export async function installWorldAppearance({scene,renderer,assembly,camera,hemi,sun,quality}) {
  const previousEnvironment=scene.environment,previousIntensity=scene.environmentIntensity;
  const room=new RoomEnvironment(),generator=new THREE.PMREMGenerator(renderer);
  let environment;
  try {environment=generator.fromScene(room,.04);}
  finally {room.dispose();generator.dispose();}
  scene.environment=environment.texture;scene.environmentIntensity=.3;
  const station=assembly.keihanStation;
  const materials=station?.group?createStationMaterialStudy(station):null;
  materials?.setEnabled(true);
  const practicals=new THREE.Group();practicals.name='Station platform practical lights';
  for(const z of [-163,-176,-189]) {
    const light=new THREE.SpotLight('#fff1dc',18,11,1.25,.8,2);
    light.position.set(-302.4,33.65,z);light.target.position.set(-302.4,30.93,z);
    practicals.add(light,light.target);
  }
  // Distance-limited lights stay registered, avoiding pipeline rebuilds when
  // crossing the station radius; their physical range already limits their reach.
  scene.add(practicals);

  // Shrine paint is a dielectric finish, not exposed metal. The legacy red
  // multiplies a roughness map by .32 and adds .55 clearcoat, producing a second
  // sharp studio highlight. Keep its authored maps but give painted wood satin
  // response. Exact source identity/names preserve torii red paint, glass and gold;
  // shared black torii bases also receive the dielectric lacquer finish.
  const shrineMaterials=assembly.legacy?.materials??{};
  const shrineFinishes=new Map();
  if(shrineMaterials.vermilionMat)shrineFinishes.set(shrineMaterials.vermilionMat,'paint');
  if(shrineMaterials.blackNemakiMat)shrineFinishes.set(shrineMaterials.blackNemakiMat,'lacquer');
  const sourceFinishes=new Map([['MAT_Vermilion_ShuIro','paint'],['MAT_Black_Lacquer_Nemaki','lacquer'],['MAT_Blue_Hengaku_Plaque','plaque']]);
  // Only named, already-metallic plain finishes otherwise qualify outside the station.
  // Shared replacements retain sharing; unrelated mapped art keeps its finish.
  const replacements=new Map(),bindings=[];
  function finish(original) {
    if(original?.userData?.worldShrineFinish||original?.userData?.worldMineralFinish)return original;
    if(replacements.has(original))return replacements.get(original);
    // Calibrate only the known paving texture trio. Cloned steps, curbs and
    // podiums keep the same source maps and share one finish per source material.
    const mineral=createMineralSurfaceFinish(original,shrineMaterials.flagstoneMat);
    if(mineral){replacements.set(original,mineral);return mineral;}
    const shrineKind=shrineFinishes.get(original)??sourceFinishes.get(original?.name);
    if(original?.isMeshStandardMaterial&&shrineKind){
      if(!replacements.has(original)){
        const material=original.clone();
        material.userData={...material.userData,worldShrineFinish:shrineKind};
        material.metalness=0;
        material.roughness=Math.max(original.roughness,shrineKind==='paint'?.68:shrineKind==='lacquer'?.42:.5);
        if(material.isMeshPhysicalMaterial){
          // Painted timber uses one dielectric lobe, without a second coating graph.
        material.clearcoat=0;
          material.clearcoatRoughness=Math.max(material.clearcoatRoughness,.38);
        }
        replacements.set(original,material);
      }
      return replacements.get(original);
    }
    if(!original?.isMeshStandardMaterial||original.isMeshPhysicalMaterial||original.map||original.normalMap||original.bumpMap||
      original.metalness<.5||!/(metal|steel|iron|bronze|alumin)/i.test(original.name)||/torii|sign|label/i.test(original.name))return original;
    if(!replacements.has(original)) {
      const material=new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(material,original);
      material.defines={STANDARD:'',PHYSICAL:''};
      material.roughness=Math.max(.3,original.roughness);
      material.envMapIntensity=.55;
      replacements.set(original,material);
    }
    return replacements.get(original);
  }
  function applyTo(root) {
    if(disposed)return;
    root.traverse(object=>{
    if(!object.isMesh)return;
    // Station replacements already have their approved finish.
    const original=object.material,next=Array.isArray(original)?original.map(finish):finish(original);
    if(Array.isArray(original)?next.some((m,i)=>m!==original[i]):next!==original) {
      bindings.push({object,original,next});object.material=next;
    }
    });
  }
  const motion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const petalField=createSakuraPetalField(),petals=petalField.mesh;
  petals.name='Local sakura petals';petals.userData.environmentTransient=true;petals.frustumCulled=false;petals.visible=false;
  petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(petals);
  const motes=createSoftLightMotes();scene.add(motes.mesh);
  const center=new THREE.Vector3(-302.4,31,-176);
  let look='natural',disposed=false,near=false;
  applyTo(scene);
  const stats={look,nearStation:false,motes:motes.stats,petals:petals.count,reflectionError:null,prepared:false,localReflections:false,stationMaterials:materials?.stats??null};
  const lighting=createWorldLookLighting({scene,hemi,sun});
  function applyStationQuality(){
    lighting.setQuality(quality?.mode);motes.setQuality(quality?.mode);
    materials?.setQuality(quality?.mode);
    station?.fareGateDetail?.setQuality(quality?.mode);
    // The same three registered fixtures softly wash wall and platform in High.
    // Static shelter/contact occlusion attenuates indirect fill, preserving sun.
    const high=quality?.mode==='high'||quality?.mode==='ultra';
    stats.practicalIntensity=high?64:18;
    for(const light of practicals.children)if(light.isSpotLight){
      light.intensity=stats.practicalIntensity;light.color.set(high?'#fff0d8':'#fff1dc');
      light.position.x=high?-301.25:-302.4;light.target.position.x=high?-299.7:-302.4;
      light.target.position.y=high?31.6:30.93;light.penumbra=high?1:.8;
    }
  }
  applyStationQuality();
  const stationProbe=createStationReflectionReadiness({renderer,scene,station,quality,sun});
  const updateBaseLighting=callback=>{if(!disposed){lighting.updateBaseLighting(callback);stationProbe.sync();stats.localReflections=stationProbe.stats.enabled;}};
  // Retain the global environment. High prepares a station-only surrogate once
  // and binds it only to the station's selected finishes, never on proximity.
  async function prepare() {
    if(disposed)return;
    stats.prepared=true;
    applyStationQuality();
    await stationProbe.prepare();
    if(typeof quality?.compileAsync==='function')await compileSelectedVisuals(quality,scene,[motes.mesh,petals],camera,{batchSize:1,reuseRenderScene:true,includeHiddenRoots:true});
    stats.localReflections=stationProbe.stats.enabled;
    stats.reflectionError=stationProbe.stats.error;
    stats.stationProbe=stationProbe.stats;
  }
  function setLook(name) {
    if(disposed)return;
    const next=normalizeVisualLook(name);
    quality?.setLook(next);
    look=next;stats.look=next;petals.visible=look==='sakura'&&!motion?.matches;motes.setEnabled(look==='soft-light');motes.setReducedMotion(motion?.matches);
    lighting.setLook(next);
    stationProbe.sync();stats.localReflections=stationProbe.stats.enabled;
  }
  function update(time=0) {
    if(disposed)return;
    near=!!station?.group&&Math.hypot(camera.position.x-center.x,camera.position.z-center.z)<70;
    stats.nearStation=near;
    petals.visible=look==='sakura'&&!motion?.matches;
    motes.setReducedMotion(motion?.matches);motes.update(camera.position,time);
    if(petals.visible)petalField.update(camera.position,time);
  }
  function dispose() {
    if(disposed)return;disposed=true;
    stationProbe.dispose();
    materials?.dispose();
    for(const {object,original,next} of bindings)if(object.material===next)object.material=original;
    for(const material of replacements.values())material.dispose();
    scene.remove(practicals,petals);petalField.dispose();motes.dispose();
    practicals.traverse(object=>{if(object.isLight)object.dispose?.();});
    if(scene.environment===environment.texture)scene.environment=previousEnvironment;
    scene.environmentIntensity=previousIntensity;environment.dispose();
  }
  return {prepare,update,setLook,updateBaseLighting,applyTo,dispose,stats};
}

// A sparse shell leaves the immediate view clear. All petals share one small,
// gently folded silhouette and draw call; distance supplies the size variation.
export function createSakuraPetalField() {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([
    0,0,-.055, -.028,0,-.012, -.021,0,.035,
    0,.006,.052, .021,0,.035, .028,0,-.012
  ],3));
  geometry.setIndex([0,1,2,0,2,3,0,3,4,0,4,5]);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:'#f2d5df',roughness:.9,side:THREE.DoubleSide,
    transparent:true,opacity:.65,depthWrite:false});
  const mesh=new THREE.InstancedMesh(geometry,material,96),dummy=new THREE.Object3D();
  function update(position,time=0) {
    const t=Number.isFinite(time)?time:0;
    for(let i=0;i<mesh.count;i++) {
      const phase=i*2.3999632297,radius=8+(i*37%96)/96*25;
      const angle=phase+Math.sin(t*.12+phase)*.025;
      dummy.position.set(position.x+Math.cos(angle)*radius,
        position.y-3+(((i*31%96)/96*16-t*.32)%16+16)%16,
        position.z+Math.sin(angle)*radius);
      dummy.rotation.set(phase+t*.3,phase*.5,t*.2+phase);
      dummy.scale.setScalar(.75+(i*17%96)/96*.5);
      dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
  }
  return {mesh,update,dispose(){geometry.dispose();material.dispose();}};
}

// Synchronous composition is separate from GPU resources and never owns day presets.
export function createWorldLookLighting({scene,hemi,sun,onChange=()=>{}}) {
  const baseline={hemi:hemi.color.clone(),floor:hemi.groundColor.clone(),ambient:hemi.intensity,sun:sun.color.clone(),intensity:sun.intensity};
  const looks={
    sakura:{hemi:'#f4c7e4',floor:'#766278',sun:'#ffbc91',ambient:.88,intensity:1.06,environment:.35},
    'soft-light':{hemi:'#f0eadf',floor:'#68735f',sun:'#fff2cf',ambient:.98,intensity:1.04,environment:.34}
  };
  let look='natural',high=false;
  function restoreBaseLighting() {
    hemi.color.copy(baseline.hemi);hemi.groundColor.copy(baseline.floor);sun.color.copy(baseline.sun);
    hemi.intensity=baseline.ambient;sun.intensity=baseline.intensity;
  }
  function applyLookLighting() {
    restoreBaseLighting();
    const values=looks[look];
    if(values) {
      hemi.color.lerp(new THREE.Color(values.hemi),.35);
      hemi.groundColor.lerp(new THREE.Color(values.floor),.35);sun.color.lerp(new THREE.Color(values.sun),.35);
      hemi.intensity*=values.ambient;sun.intensity*=values.intensity;
    }
    // Slightly less uniform skylight gives sunlit paving and timber separation
    // in High. Keep night readable and never compound the saved day presets.
    const daylightLook=high&&baseline.intensity>1;
    if(daylightLook){hemi.intensity*=.88;sun.intensity*=1.04;}
    // The studio probe must follow daylight energy rather than lighting night as day.
    const daylight=LIGHT_PRESETS.day.sun+LIGHT_PRESETS.day.fill;
    const energy=THREE.MathUtils.clamp((baseline.intensity+baseline.ambient)/daylight,0,1);
    scene.environmentIntensity=(values?.environment??.3)*energy*(daylightLook ? .9 : 1);
  }
  // Wrap the caller's synchronous day setter. Restoring before it runs also
  // supports setters that change only intensities, without saving tinted colors
  // or multiplying an already-styled intensity into the new baseline.
  function updateBaseLighting(applyBaseLighting) {
    if(typeof applyBaseLighting!=='function')throw new TypeError('updateBaseLighting requires a synchronous day-lighting callback');
    restoreBaseLighting();
    try {
      applyBaseLighting();
      baseline.hemi.copy(hemi.color);baseline.floor.copy(hemi.groundColor);baseline.sun.copy(sun.color);
      baseline.ambient=hemi.intensity;baseline.intensity=sun.intensity;
      onChange();
    } finally {applyLookLighting();}
  }
  applyLookLighting();
  return {updateBaseLighting,setQuality(mode){high=mode==='high'||mode==='ultra';applyLookLighting();},setLook(name){look=normalizeVisualLook(name);applyLookLighting();}};
}
