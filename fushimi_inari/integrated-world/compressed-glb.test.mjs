import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeGLBTransport} from './compressed-glb.mjs';
const parse=b=>{const length=b.readUInt32LE(12);return {json:JSON.parse(b.subarray(20,20+length)),bin:b.subarray(28+length)};};
const view=(asset,index)=>{const v=asset.json.bufferViews[index];return asset.bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);};
for(const id of ['romon','gehaiden','naihaiden','honden'])test(`${id} transport preserves geometry, materials, and lossless image bytes`,async()=>{
 const original=await readFile(new URL(`${id}.glb`,import.meta.url)),compressed=await readFile(new URL(`${id}.glb.gz`,import.meta.url));
 const a=parse(original),b=parse(Buffer.from(await decodeGLBTransport(compressed.buffer.slice(compressed.byteOffset,compressed.byteOffset+compressed.byteLength))));
 const imageViews=new Set(a.json.images.map(image=>image.bufferView));
 for(let i=0;i<a.json.bufferViews.length;i++)if(!imageViews.has(i))assert.deepEqual(view(a,i),view(b,i));
 for(let i=0;i<a.json.images.length;i++){
  const expected=a.json.images[i],actual=b.json.images[i];assert.equal(actual.bufferView,undefined);
  assert.deepEqual(await readFile(new URL(actual.uri,import.meta.url)),view(a,expected.bufferView));
  assert.deepEqual({...actual,uri:undefined,bufferView:expected.bufferView},{...expected,uri:undefined});
 }
 for(const key of Object.keys(a.json).filter(key=>!['images','bufferViews','buffers'].includes(key)))assert.deepEqual(b.json[key],a.json[key],key);
 const plain=original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength);assert.equal(await decodeGLBTransport(plain),plain);
});
