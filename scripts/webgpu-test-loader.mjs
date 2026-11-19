// Match the production WebGPU import map while legacy WebGL tests keep three.
export async function resolve(specifier,context,next){
 if(specifier==='three')return next('three-runtime/webgpu',context);
 if(specifier.startsWith('three/'))return next('three-runtime/'+specifier.slice(6),context);
 return next(specifier,context);
}
