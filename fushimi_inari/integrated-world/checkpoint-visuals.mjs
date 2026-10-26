import * as THREE from 'three';

// Static residency metadata is already in world space. Inspect dormant roots
// without activating them; callers keep the live world as the sole owner.
export async function collectCheckpointVisuals({scene,position,residencyRoots=new Set(),residencyBounds=new Map(),radius=180,
 yieldWork=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0)),now=()=>performance.now()}){
 const stack=[{object:scene,bounds:null}],selected=[],sphere=new THREE.Sphere();
 let visited=0,skippedLarge=0,sliceStart=now();
 const boundsDistance=bounds=>typeof bounds?.distanceToPoint==='function'?bounds.distanceToPoint(position):Infinity;
 while(stack.length){
  if(++visited%128===0||now()-sliceStart>=4){await yieldWork();sliceStart=now();}
  const {object,bounds:inherited}=stack.pop(),bounds=residencyBounds.get(object)??inherited;
  if(!object.visible&&!residencyRoots.has(object)&&!object.parent?.isLOD)continue;
  if(residencyBounds.has(object)&&boundsDistance(bounds)>radius)continue;
  if(object.isMesh||object.isLine||object.isPoints||object.isSprite){
   const geometry=object.geometry;
   let local=object.isInstancedMesh?object.boundingSphere:geometry?.boundingSphere;
   if(!local&&!bounds&&geometry&&geometry.attributes.position?.count<=30000&&!object.isInstancedMesh){geometry.computeBoundingSphere();local=geometry.boundingSphere;}
   if(local){sphere.copy(local).applyMatrix4(object.matrixWorld);if(sphere.distanceToPoint(position)<=radius)selected.push(object);}
   else if(boundsDistance(bounds)<=radius)selected.push(object);
   else if(geometry)skippedLarge++;
  }
  for(let i=object.children.length-1;i>=0;i--)stack.push({object:object.children[i],bounds});
 }
 // A selected visual can own nested visuals. Borrow its hierarchy once.
 const selectedSet=new Set(selected),objects=selected.filter(object=>{for(let parent=object.parent;parent;parent=parent.parent)if(selectedSet.has(parent))return false;return true;});
 return {objects,visited,skippedLarge,radius};
}
