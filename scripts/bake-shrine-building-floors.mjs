import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {refineShrineBuilding} from '../fushimi_inari/integrated-world/shrine-building-refinements.mjs';
import {shrineBuildingIds} from '../fushimi_inari/integrated-world/deferred-shrine-buildings.mjs';

// Bake the same upward, near-level material-owned triangles publicFloorQuery
// indexes. Keep source coordinates so integration applies the live anchor matrix.
export async function bakeShrineBuildingFloors(){
 // The curtain's painted canvas has no influence on geometry or floor ownership.
 const previousDocument=globalThis.document;
 globalThis.document??={createElement:()=>({getContext:()=>new Proxy({},{get:()=>()=>{}})})};
 try{
 const buildings={},sourceHashes={};
 for(const id of shrineBuildingIds){
  const bytes=await readFile(new URL(`../fushimi_inari/integrated-world/${id}.glb`,import.meta.url));
  sourceHashes[id]=createHash('sha256').update(bytes).digest('hex');
  const materials=new Proxy({}, {get:(target,key)=>target[key]??=(new THREE.MeshStandardMaterial({name:String(key)}))});
  const loader=new GLTFLoader().register(()=>({name:'floor-bake-no-images',loadTexture:()=>Promise.resolve(new THREE.Texture())}));
  const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  refineShrineBuilding(gltf.scene,id,materials);gltf.scene.updateMatrixWorld(true);
  const allowed=['stoneMat','flagstoneMat','gravelMat','entryStoneMat','precinctPaving','precinctCobbles','sanctuaryApronMat'].map(key=>materials[key]);
  const vertices=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3();
  gltf.scene.traverse(object=>{
   if(!object.isMesh||object.isInstancedMesh||![object.material].flat().every(m=>allowed.includes(m)))return;
   const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld),position=geometry.attributes.position,index=geometry.index;
   for(let i=0;i<(index?index.count:position.count);i+=3){
    a.fromBufferAttribute(position,index?index.getX(i):i);b.fromBufferAttribute(position,index?index.getX(i+1):i+1);c.fromBufferAttribute(position,index?index.getX(i+2):i+2);
    normal.crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
    if(normal.y>.75&&Math.max(a.y,b.y,c.y)-Math.min(a.y,b.y,c.y)<.3)vertices.push(...a.toArray(),...b.toArray(),...c.toArray());
   }
   geometry.dispose();
  });
  buildings[id]=Array.from(new Float32Array(vertices));
 }
 return {revision:1,sourceHashes,buildings};
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 await writeFile(new URL('../fushimi_inari/integrated-world/shrine-building-floors.json',import.meta.url),JSON.stringify(await bakeShrineBuildingFloors()));
}
