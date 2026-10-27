import {Box3,Sphere,Vector3,Object3D,Matrix4,WebGPUCoordinateSystem} from 'three';
const hasShear=matrix=>{
 const e=matrix.elements,a=e[0]**2+e[1]**2+e[2]**2,b=e[4]**2+e[5]**2+e[6]**2,c=e[8]**2+e[9]**2+e[10]**2;
 return Math.abs(e[0]*e[4]+e[1]*e[5]+e[2]*e[6])>1e-6*Math.sqrt(a*b)||Math.abs(e[0]*e[8]+e[1]*e[9]+e[2]*e[10])>1e-6*Math.sqrt(a*c)||Math.abs(e[4]*e[8]+e[5]*e[9]+e[6]*e[10])>1e-6*Math.sqrt(b*c);
};
// Sphere/plane frustum tests admit corner false positives. A sphere enclosing
// the entire view can safely reject some of them before shader construction.
// Only explicit static owners and the main camera qualify; never shadow views.
export function installStaticColorCull(renderer,camera,entries){
 const original=renderer.getRenderObjectFunction(),bounds=new Map(),seen=new Set(),center=new Vector3(),sphere=new Sphere(),box=new Box3(),matrix=new Matrix4(),corner=new Vector3();
 let radius=Infinity,skipped=0,submitted=0;
 for(const {object:root}of entries)root.traverse(object=>{
  if(seen.has(object)||!object.isMesh||object.isSkinnedMesh||object.morphTargetInfluences?.length)return;
  let shear=hasShear(object.matrixWorld);
  if(object.isInstancedMesh&&!shear)for(let i=0;i<object.count;i++){object.getMatrixAt(i,matrix);if(hasShear(matrix)){shear=true;break;}}
  if(object.onBeforeRender!==Object3D.prototype.onBeforeRender||[object.material].flat().some(m=>m?.positionNode||m?.vertexNode||m?.displacementMap))return;
  seen.add(object);let local;
  if(shear){
   local=object.isInstancedMesh?object.boundingBox:object.geometry?.boundingBox;
   if(!local&&object.geometry){if(object.isInstancedMesh)object.computeBoundingBox();else object.geometry.computeBoundingBox();local=object.isInstancedMesh?object.boundingBox:object.geometry.boundingBox;}
   if(local)box.copy(local).applyMatrix4(object.matrixWorld).getBoundingSphere(sphere);
  }else{
   local=object.isInstancedMesh?object.boundingSphere:object.geometry?.boundingSphere;
   if(!local&&object.geometry){if(object.isInstancedMesh)object.computeBoundingSphere();else object.geometry.computeBoundingSphere();local=object.isInstancedMesh?object.boundingSphere:object.geometry.boundingSphere;}
   if(local)sphere.copy(local).applyMatrix4(object.matrixWorld);
  }
  if(local){sphere.radius*=1.00001;if(Number.isFinite(sphere.radius)&&sphere.radius>=0&&[sphere.center.x,sphere.center.y,sphere.center.z].every(Number.isFinite))bounds.set(object,sphere.clone());}
 });
 function draw(object,scene,view,...rest){
  const bound=bounds.get(object);
  if(view===camera&&bound&&bound.center.distanceToSquared(center)>(radius+bound.radius+1e-3)**2){skipped++;return;}
  submitted++;return (original??renderer.renderObject).call(renderer,object,scene,view,...rest);
 }
 renderer.setRenderObjectFunction(draw);
 return {update(){camera.updateWorldMatrix(true,false);center.setFromMatrixPosition(camera.matrixWorld);const z=camera.reversedDepth?(camera.coordinateSystem===WebGPUCoordinateSystem?0:-1):1;radius=0;for(const x of [-1,1])for(const y of [-1,1])radius=Math.max(radius,corner.set(x,y,z).unproject(camera).distanceTo(center));},get stats(){return {skipped,submitted,radius,objects:bounds.size};},dispose(){if(renderer.getRenderObjectFunction()===draw)renderer.setRenderObjectFunction(original);bounds.clear();}};
}
