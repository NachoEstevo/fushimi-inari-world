// Only the shared flagstone texture trio qualifies; other stone, moss and
// already-tuned map sets retain their own material identity and appearance.
export function createMineralSurfaceFinish(material,flagstone){
 if(!material?.isMeshStandardMaterial||!flagstone?.map||!flagstone.normalMap||!flagstone.roughnessMap||
    material.map!==flagstone.map||material.normalMap!==flagstone.normalMap||material.roughnessMap!==flagstone.roughnessMap)return null;
 if(material.userData.worldMineralFinish)return material;
 const result=material.clone(),clamp=value=>Math.max(-.38,Math.min(.38,value));
 result.roughness=Math.max(.94,material.roughness);result.metalness=0;
 result.normalScale.set(clamp(material.normalScale.x),clamp(material.normalScale.y));
 result.userData={...result.userData,worldMineralFinish:true};return result;
}
