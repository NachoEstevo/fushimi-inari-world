import {Color, Mesh, MeshBasicMaterial, Scene} from 'three/webgpu';

// A small, interpretive reflection surrogate, never added to the world. Source
// geometry is borrowed, while material and scene ownership remain local.
export const STATION_PROXY_LIMITS=Object.freeze({meshes:40,triangles:30000,batch:8});
export async function createStationReflectionProxy(station,{yieldStage=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
 if(!station?.group?.traverse)throw new TypeError('Station proxy requires a station group');
 const scene=new Scene();scene.name='Station reflection surrogate';scene.background=new Color('#aabdc2');
 const materials=new Map(), candidates=[];
 const stats={meshes:0,triangles:0,skipped:0,sourceMeshes:0,method:'bounded station geometry surrogate'};
 station.group.updateWorldMatrix(true,true);
 station.group.traverse(object=>{if(object.isMesh)candidates.push(object);});
 stats.sourceMeshes=candidates.length;
 const visible=object=>{for(let p=object;p&&p!==station.group.parent;p=p.parent)if(!p.visible)return false;return true;};
 const materialFor=original=>{
  if(!materials.has(original))materials.set(original,new MeshBasicMaterial({color:original.color??0xffffff,side:original.side}));
  return materials.get(original);
 };
 try{
  for(let i=0;i<candidates.length;i++){
   const source=candidates[i], original=Array.isArray(source.material)?source.material:[source.material];
   const count=source.geometry?.index?.count??source.geometry?.attributes?.position?.count??0;
   const triangles=Math.ceil(count/3);
   if(!visible(source)||source.isSkinnedMesh||source.isInstancedMesh||!source.geometry?.attributes?.position||
      !original.length||original.some(m=>!m||m.transparent||m.opacity<1||m.transmission>0)||
      stats.meshes>=STATION_PROXY_LIMITS.meshes||stats.triangles+triangles>STATION_PROXY_LIMITS.triangles){stats.skipped++;}
   else{
    const mapped=original.map(materialFor), mesh=new Mesh(source.geometry,Array.isArray(source.material)?mapped:mapped[0]);
    mesh.matrixAutoUpdate=false;mesh.matrix.copy(source.matrixWorld);mesh.name=source.name;
    scene.add(mesh);stats.meshes++;stats.triangles+=triangles;
   }
   if((i+1)%STATION_PROXY_LIMITS.batch===0)await yieldStage();
  }
  return {scene,stats,dispose(){for(const material of materials.values())material.dispose();scene.clear();}};
 }catch(error){for(const material of materials.values())material.dispose();scene.clear();throw error;}
}
