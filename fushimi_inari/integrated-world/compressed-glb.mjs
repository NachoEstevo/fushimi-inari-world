import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export async function decodeGLBTransport(bytes){
 // Some hosts may advertise gzip and let the browser decode it already.
 if(new DataView(bytes).getUint32(0,true)===0x46546c67)return bytes;
 return new Response(new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
// Lossless transport compression: refinement and collisions receive the exact
// original geometry. A compressed transfer is not a simplified building mesh.
export async function loadCompressedGLB(url){
 const response=await fetch(url+'.gz');if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
 const bytes=await decodeGLBTransport(await response.arrayBuffer());
 return new GLTFLoader().parseAsync(bytes,new URL('.',new URL(url,location.href)).href);
}
