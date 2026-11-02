import {REVISION} from 'three/webgpu';

// Takeya sits beside the existing Shin-ike probe. Borrow its prefiltered
// environment for local opaque glazing; this creates no camera, target or map.
export function createPondGlazingReflections(root){
 const meshes=[],originals=new Map();let disposed=false;
 const shop=root.getObjectByName('Takeya mapped timber and open frontage R89');
 shop?.traverse(object=>{
  if(!object.isMesh)return;
  const materials=[object.material].flat().filter(material=>material?.userData.architecturalGlazing===true);
  if(!materials.length)return;meshes.push(object);
  for(const material of materials)if(!originals.has(material))originals.set(material,{map:material.envMap,intensity:material.envMapIntensity});
 });
 function setEnvironment(texture){
  if(disposed)return;
  for(const [material,original]of originals){
   const next=texture??original.map;if(material.envMap===next)continue;
   const equivalent=material.envMap?.isPMREMTexture&&material.envMap?.isCubeTexture&&next?.isPMREMTexture&&next?.isCubeTexture;
   material.envMap=next;material.envMapIntensity=texture?.isTexture ? .65 : original.intensity;
   if(REVISION!=='187'||!equivalent)material.needsUpdate=true;
  }
 }
 return {meshes,setEnvironment,get stats(){return {meshes:meshes.length,materials:originals.size,extraCaptures:0,extraTargets:0};},
  dispose(){if(disposed)return;setEnvironment(null);disposed=true;originals.clear();}};
}
