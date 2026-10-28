// A successful main draw already built this exact batch. Exclude compileAsync
// callbacks and shadow cameras; a drawn LOD leaf does not warm its whole owner.
export function observePrewarmRenders(entries,{camera,service,isRendering}){
 const callbacks=new Map();
 for(const {object}of entries){
  if(!object.isMesh||Array.isArray(object.material)||callbacks.has(object))continue;
  const original=object.onAfterRender,owned=Object.hasOwn(object,'onAfterRender');
  // Match Object3D's six draw arguments without allocating an array per draw.
  function after(renderer,scene,view,geometry,drawMaterial,group){
   const material=object.material,version=material?.version;
   const result=original.call(this,renderer,scene,view,geometry,drawMaterial,group);
   if(view===camera&&isRendering()&&object.material===material&&material?.version===version)service.markRendered(object);
   return result;
  }
  callbacks.set(object,{original,owned,after});object.onAfterRender=after;
 }
 return {dispose(){for(const [object,{original,owned,after}]of callbacks){
  if(object.onAfterRender===after){if(owned)object.onAfterRender=original;else delete object.onAfterRender;}
 }callbacks.clear();}};
}
