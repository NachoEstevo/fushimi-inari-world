import test from 'node:test';
import assert from 'node:assert/strict';
import {createZenPhotoAlbum} from './zen-photo-album.mjs';

const encode=async()=>({blob:new Blob(['small actual thumbnail'],{type:'image/jpeg'}),width:640,height:360});
test('missing IndexedDB keeps a bounded session album and releases all owned URLs',async()=>{
 let time=1;const album=createZenPhotoAlbum({indexedDB:null,encode,now:()=>time++}),ids=[];
 for(let i=0;i<15;i++){const saved=await album.save(new Blob(['original'],{type:'image/png'}));ids.push(saved.id);assert.equal(saved.persistent,false);assert.match(saved.url,/^blob:/);}
 const records=await album.list();assert.equal(records.length,12);assert.equal(await album.get(ids[0]),null);assert.ok(await album.get(ids.at(-1)));assert.equal(records[0].width,640);
 album.dispose();assert.deepEqual(await album.list(),[]);assert.equal(await album.get(ids.at(-1)),null);await assert.rejects(album.save(new Blob()),/closed/);
});
test('unsupported image encoding rejects without keeping an original full resolution image',async()=>{
 const album=createZenPhotoAlbum({indexedDB:null,encode:async()=>({blob:new Blob(['PNG'],{type:'image/png'}),width:3840,height:2160})});
 await assert.rejects(album.save(new Blob()),/small JPEG/);assert.deepEqual(await album.list(),[]);album.dispose();
});
test('a failed encoding does not poison subsequent saves',async()=>{
 let count=0;const album=createZenPhotoAlbum({indexedDB:null,encode:async()=>{if(!count++)throw Error('encoding failed');return encode();}});
 await assert.rejects(album.save(new Blob()),/encoding failed/);assert.ok((await album.save(new Blob())).id);assert.equal((await album.list()).length,1);album.dispose();
});

function databaseFixture(){
 const data=new Map();let failWrites=false;
 const db={close(){},objectStoreNames:{contains:()=>true},transaction(name,mode){
  const tx={error:null};let failed=false;
  tx.objectStore=()=>({getAll(){const request={};queueMicrotask(()=>{request.result=[...data.values()];request.onsuccess?.();queueMicrotask(()=>{if(!failed)tx.oncomplete?.();});});return request;},
   put(record){if(failWrites&&mode==='readwrite'){failed=true;tx.error=Error('quota');queueMicrotask(()=>tx.onerror?.());}else data.set(record.id,{...record});},delete(id){if(!failed)data.delete(id);}});
  return tx;
 }};
 const indexedDB={open(){const request={};queueMicrotask(()=>{request.result=db;request.onsuccess?.();});return request;}};
 return {indexedDB,data,fillQuota(){failWrites=true;}};
}
test('IndexedDB reload restores actual thumbnails and concurrent owners retain a global cap',async()=>{
 const storage=databaseFixture();let time=100;const a=createZenPhotoAlbum({indexedDB:storage.indexedDB,encode,now:()=>time++}),b=createZenPhotoAlbum({indexedDB:storage.indexedDB,encode,now:()=>time++});
 await Promise.all([a.list(),b.list()]);
 for(let i=0;i<16;i++)assert.equal((await (i%2?a:b).save(new Blob())).persistent,true);
 assert.equal(storage.data.size,12);
 const restored=createZenPhotoAlbum({indexedDB:storage.indexedDB,encode});const records=await restored.list();assert.equal(records.length,12);assert.equal(records[0].persistent,true);assert.equal(await records[0].blob.text(),'small actual thumbnail');a.dispose();b.dispose();restored.dispose();
});
test('a storage quota failure keeps the new thumbnail for this visit',async()=>{
 const storage=databaseFixture(),album=createZenPhotoAlbum({indexedDB:storage.indexedDB,encode});await album.list();storage.fillQuota();
 const saved=await album.save(new Blob());assert.equal(saved.persistent,false);assert.equal((await album.get(saved.id)).persistent,false);assert.equal((await album.list()).length,1);album.dispose();
});
test('a stalled IndexedDB open falls back promptly and closes a late connection',async()=>{
 let request,closed=0;const album=createZenPhotoAlbum({indexedDB:{open(){return request={};}},encode,storageTimeout:5});
 const saved=await album.save(new Blob());assert.equal(saved.persistent,false);
 request.result={close(){closed++;}};request.onsuccess();assert.equal(closed,1);album.dispose();
});
test('stalled IndexedDB transactions abort and preserve a session thumbnail',async()=>{
 for(const stalledMode of ['readonly','readwrite']){
  let aborts=0;
  const db={close(){},transaction(name,mode){const tx={abort(){aborts++;tx.onabort?.();},objectStore(){return {getAll(){const request={};queueMicrotask(()=>{request.result=[];request.onsuccess?.();if(mode!==stalledMode)queueMicrotask(()=>tx.oncomplete?.());});return request;},put(){},delete(){}};}};return tx;}};
  const indexedDB={open(){const request={};queueMicrotask(()=>{request.result=db;request.onsuccess?.();});return request;}};
  const album=createZenPhotoAlbum({indexedDB,encode,storageTimeout:5});const saved=await album.save(new Blob());assert.equal(saved.persistent,false);assert.equal(aborts,1);assert.equal((await album.list()).length,1);album.dispose();
 }
});
