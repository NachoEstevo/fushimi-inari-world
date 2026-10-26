import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root=new URL('../fushimi_inari/',import.meta.url), images=new Map();let oldBytes=0,newBytes=0,imageCount=0;
for(const id of ['romon','gehaiden','naihaiden','honden']){
 const file=new URL(`integrated-world/${id}.glb`,root),original=await readFile(file),length=original.readUInt32LE(12),json=JSON.parse(original.subarray(20,20+length)),bin=original.subarray(28+length);
 const imageViews=new Set();
 for(const image of json.images??[]){
  if(image.bufferView===undefined)throw Error('Expected embedded image');
  const view=json.bufferViews[image.bufferView],data=bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
  if(image.mimeType!=='image/png')throw Error('Expected lossless PNG');
  const hash=createHash('sha256').update(data).digest('hex');images.set(hash,data);imageViews.add(image.bufferView);imageCount++;
  delete image.bufferView;image.uri=`../assets/textures/precinct-shared/${hash}.png`;
 }
 const chunks=[];let offset=0;
 for(let i=0;i<json.bufferViews.length;i++){
  const view=json.bufferViews[i],data=imageViews.has(i)?Buffer.alloc(4):bin.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength);
  view.byteOffset=offset;view.byteLength=data.length;chunks.push(data);offset+=data.length;
  const padding=(4-offset%4)%4;if(padding){chunks.push(Buffer.alloc(padding));offset+=padding;}
 }
 json.buffers[0].byteLength=offset;
 const encoded=Buffer.from(JSON.stringify(json)),padded=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]),body=Buffer.concat(chunks);
 const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+body.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const binaryHeader=Buffer.alloc(8);binaryHeader.writeUInt32LE(body.length);binaryHeader.writeUInt32LE(0x004e4942,4);
 const compressed=gzipSync(Buffer.concat([header,padded,binaryHeader,body]),{level:9});oldBytes+=gzipSync(original,{level:9}).length;newBytes+=compressed.length;
 await writeFile(new URL(`integrated-world/${id}.glb.gz`,root),compressed);
}
await mkdir(new URL('assets/textures/precinct-shared/',root),{recursive:true});
for(const [hash,data] of images)await writeFile(new URL(`assets/textures/precinct-shared/${hash}.png`,root),data);
const sharedBytes=[...images.values()].reduce((sum,data)=>sum+data.length,0);
console.log(JSON.stringify({imageCount,uniqueImages:images.size,originalGzipBytes:oldBytes,sharedGzipBytes:newBytes,sharedPNGBytes:sharedBytes,totalBytes:newBytes+sharedBytes,savedBytes:oldBytes-newBytes-sharedBytes},null,2));
