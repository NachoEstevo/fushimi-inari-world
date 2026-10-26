import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {sharePrecinctImageSources} from './shared-precinct-images.mjs';
export async function decodeGLBTransport(bytes){
 // Some hosts may advertise gzip and let the browser decode it already.
 if(new DataView(bytes).getUint32(0,true)===0x46546c67)return bytes;
 return new Response(new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
// Lossless transport compression: refinement and collisions receive the exact
// original geometry. Embedded PNGs are shared as byte-identical external files.
export async function loadCompressedGLB(url){
 const response=await fetch(url+'.gz');if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
 const bytes=await decodeGLBTransport(await response.arrayBuffer());
 return new GLTFLoader().register(sharePrecinctImageSources).parseAsync(bytes,new URL('.',new URL(url,location.href)).href);
}
