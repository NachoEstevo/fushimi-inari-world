import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeGLBTransport} from './compressed-glb.mjs';
for(const id of ['romon','gehaiden','naihaiden','honden'])test(`${id} compressed transport preserves every original GLB byte`,async()=>{
 const original=await readFile(new URL(`${id}.glb`,import.meta.url)),compressed=await readFile(new URL(`${id}.glb.gz`,import.meta.url));
 const array=compressed.buffer.slice(compressed.byteOffset,compressed.byteOffset+compressed.byteLength);
 assert.deepEqual(Buffer.from(await decodeGLBTransport(array)),original);
 const plain=original.buffer.slice(original.byteOffset,original.byteOffset+original.byteLength);assert.equal(await decodeGLBTransport(plain),plain);
});
