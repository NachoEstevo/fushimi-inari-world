import test from 'node:test';
import assert from 'node:assert/strict';
import {Texture,SRGBColorSpace,RepeatWrapping,ClampToEdgeWrapping} from 'three';
import {sharePrecinctImageSources} from './shared-precinct-images.mjs';
const uri=`../assets/textures/precinct-shared/${'a'.repeat(64)}.png`;
test('concurrent parsers decode once with independent sampler/color-space textures',async()=>{
 let loads=0;const original=new Texture({width:1,height:1});
 const parser=()=>({json:{images:[{uri}]},options:{path:'https://example.com/integrated-world/'},loadImageSource:async()=>{loads++;return original;}});
 const a=parser(),b=parser();sharePrecinctImageSources(a);sharePrecinctImageSources(b);
 const [x,y]=await Promise.all([a.loadImageSource(0,{}),b.loadImageSource(0,{})]);assert.equal(loads,1);assert.notEqual(x,y);assert.equal(x.source,y.source);
 x.colorSpace=SRGBColorSpace;x.wrapS=RepeatWrapping;y.wrapS=ClampToEdgeWrapping;
 assert.notEqual(x.colorSpace,y.colorSpace);assert.notEqual(x.wrapS,y.wrapS);
});
test('failed source loads can be retried',async()=>{
 let loads=0;const parser={json:{images:[{uri}]},options:{path:'https://retry.example/integrated-world/'},loadImageSource:async()=>{if(++loads===1)throw Error('offline');return new Texture();}};
 sharePrecinctImageSources(parser);await assert.rejects(parser.loadImageSource(0,{}));assert.ok(await parser.loadImageSource(0,{}));assert.equal(loads,2);
});
test('all four generated GLBs parse through Three with only twelve image loads',async()=>{
 const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
 const {readFile}=await import('node:fs/promises');const {gunzipSync}=await import('node:zlib');
 const previousSelf=globalThis.self;globalThis.self=globalThis;let loads=0;
 try{
  const imageLoader={load(url,resolve,_progress,reject){loads++;readFile(new URL(url)).then(data=>resolve(new Texture({byteLength:data.length})),reject);}};
  for(const [id,expected] of [['romon',15],['gehaiden',10],['naihaiden',8],['honden',7]]){
   const loader=new GLTFLoader();loader.manager.addHandler(/precinct-shared/,imageLoader);loader.register(sharePrecinctImageSources);
   const bytes=gunzipSync(await readFile(new URL(`${id}.glb.gz`,import.meta.url)));
   const asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),new URL('.',import.meta.url).href);
   let meshes=0;asset.scene.traverse(object=>{if(object.isMesh){meshes++;for(const material of [].concat(object.material))if(material.map)assert.ok(material.map.image.byteLength>0);}});assert.equal(meshes,expected);
  }
  assert.equal(loads,12);
 }finally{if(previousSelf===undefined)delete globalThis.self;else globalThis.self=previousSelf;}
});
