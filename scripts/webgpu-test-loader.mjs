// Test-only loader. Install three@0.187.0 under .tmp/three187-runtime first.
// Keep legacy geometry tests on their original runtime; the viewer pins r187.0.
const root=new URL('../.tmp/three187-runtime/node_modules/three/',import.meta.url).href;
export async function resolve(specifier,context,next){
 if(specifier==='three'||specifier==='three/webgpu')return {url:root+'build/three.webgpu.js',shortCircuit:true};
 if(specifier==='three/tsl')return {url:root+'build/three.tsl.js',shortCircuit:true};
 if(specifier.startsWith('three/addons/'))return {url:root+'examples/jsm/'+specifier.slice(13),shortCircuit:true};
 if(specifier.startsWith('three/src/'))return {url:root+'src/'+specifier.slice(10),shortCircuit:true};
 return next(specifier,context);
}
