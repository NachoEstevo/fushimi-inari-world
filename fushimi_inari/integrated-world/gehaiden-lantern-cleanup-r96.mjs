// Exact duplicate owner: legacy-builders buildMainTempleAndOkumiyaConnection
// Gehaiden lantern block. Collect before geographic mapping; commit only once
// the real R95 twelve square zodiac lanterns have successfully been built.
export const legacyGehaidenLanternStationsR96=Object.freeze([[-4.8,-8.3],[-1.8,-8.3],[1.8,-8.3],[4.8,-8.3],[-4.8,-16.7],[-1.8,-16.7],[1.8,-16.7],[4.8,-16.7],[-6.1,-10.5],[-6.1,-14.5],[6.1,-10.5],[6.1,-14.5]].map(Object.freeze));
export function prepareGehaidenLanternCleanupR96(legacy){
 const objects=[];legacy.scene.traverse(o=>{if(o.isMesh)objects.push(o);});
 const near=(a,b)=>Math.abs(a-b)<1e-6;
 const zone=o=>{while(o){if(o.userData.zone)return o.userData.zone;o=o.parent;}return null;};
 const bronze=m=>m?.color?.getHex()===0x24201c&&near(m.roughness,.35)&&near(m.metalness,.78);
 const definitions=[
  {kind:'cord',type:'CylinderGeometry',y:5.45,shape:{radiusTop:.015,radiusBottom:.015,height:.95,radialSegments:6},material:bronze},
  {kind:'cap',type:'ConeGeometry',y:4.98,shape:{radius:.28,height:.16,radialSegments:6},material:bronze},
  {kind:'body',type:'CylinderGeometry',y:4.78,shape:{radiusTop:.18,radiusBottom:.18,height:.30,radialSegments:6},material:m=>m===legacy.materials.lanternGlowMat},
 ];
 const matched=[];let reason=null;
 for(const [x,z]of legacyGehaidenLanternStationsR96)for(const d of definitions){
  const found=objects.filter(o=>zone(o)==='precinct'&&near(o.position.x,x)&&near(o.position.y,d.y)&&near(o.position.z,z)&&o.rotation.toArray().slice(0,3).every(v=>near(v,0))&&o.scale.toArray().every(v=>near(v,1))&&o.geometry.type===d.type&&Object.entries(d.shape).every(([k,v])=>near(o.geometry.parameters[k],v))&&d.material(o.material));
  if(found.length!==1){reason=`Legacy Gehaiden ${d.kind} signature missing or ambiguous`;break;}matched.push(found[0]);
 }
 let completed=null;
 return {retainedObjects:matched,prepared:!reason&&matched.length===36,matched:matched.length,reason,commit(replacement){
  if(completed)return completed;
  if(reason||matched.length!==36)return {built:false,reason:reason??'Incomplete legacy Gehaiden lantern signature',removedElements:[]};
  if(!replacement?.built||replacement.zone!=='gehaiden'||replacement.lanterns!==12)return {built:false,reason:'Real twelve Gehaiden zodiac lanterns not yet built',removedElements:[]};
  // Object identities survive rigid mapping/reparenting. Do not inspect world
  // proximity or remove any other district's emitting bodies or point lights.
  if(matched.some(o=>!o.parent))return {built:false,reason:'Prepared duplicate ownership changed',removedElements:[]};
  matched.forEach(o=>o.removeFromParent());
  // Support callers that expose animation arrays; production's legacy closure
  // does not export lanternEmissiveMeshes and creates no PointLights here.
  for(const key of ['lanternEmissiveMeshes','lanternPointLights','flickeringCandleMeshes'])if(Array.isArray(legacy[key]))for(let i=legacy[key].length-1;i>=0;i--)if(matched.includes(legacy[key][i]))legacy[key].splice(i,1);
  completed={built:true,revision:'R96',removedLanterns:12,removedMeshes:36,removedPointLights:0,removedElements:matched,ownership:'Only exact authored legacy Gehaiden cord/cap/emissive-body triplets; real R95 square lanterns and all other fixtures preserved'};return completed;
 }};
}
