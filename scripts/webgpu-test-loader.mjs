// Test-only loader. Install three@0.180.0 under .tmp/webgpu-runtime first.
// Keep legacy tests on their original runtime; the browser pins r180 via import map.
const root=new URL('../.tmp/webgpu-runtime/node_modules/three/',import.meta.url).href;
export async function resolve(specifier,context,next){
 if(specifier==='three'||specifier==='three/webgpu')return {url:root+'build/three.webgpu.js',shortCircuit:true};
 if(specifier==='three/tsl')return {url:root+'build/three.tsl.js',shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:root+'examples/jsm/'+specifier.slice(13),shortCircuit:true};
 if(specifier.startsWith('three/src/'))return {url:root+'src/'+specifier.slice(10),shortCircuit:true};
 return next(specifier,context);
}
