const DATABASE='inari-quiet-photo-album-v1',STORE='thumbnails',CAP=12,MAX_BYTES=512*1024,STORAGE_TIMEOUT=2500;

async function makeThumbnail(blob){
 if(!(blob instanceof Blob)||!blob.type.startsWith('image/')||blob.size>32*1024*1024)throw Error('Choose a captured image smaller than 32 MB.');
 let source,sourceURL;
 try{
  if(globalThis.createImageBitmap)source=await createImageBitmap(blob);
  else{
   if(!globalThis.Image)throw Error('Image previews are unavailable in this browser.');
   sourceURL=URL.createObjectURL(blob);source=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not read this image.'));image.src=sourceURL;});
  }
  const scale=Math.min(1,640/source.width,360/source.height),width=Math.max(1,Math.round(source.width*scale)),height=Math.max(1,Math.round(source.height*scale));
  const canvas=globalThis.OffscreenCanvas?new OffscreenCanvas(width,height):globalThis.document?.createElement('canvas');
  if(!canvas)throw Error('Image previews are unavailable in this browser.');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');if(!context)throw Error('Image previews are unavailable in this browser.');
  context.drawImage(source,0,0,width,height);
  const thumbnail=canvas.convertToBlob?await canvas.convertToBlob({type:'image/jpeg',quality:.82}):await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Could not create a photo preview.')),'image/jpeg',.82));
  if(thumbnail.type!=='image/jpeg'||thumbnail.size>MAX_BYTES)throw Error('This browser could not create a small JPEG preview.');
  return {blob:thumbnail,width,height};
 }finally{source?.close?.();if(sourceURL)URL.revokeObjectURL(sourceURL);}
}
function openDatabase(indexedDB,timeout){
 return new Promise((resolve,reject)=>{
  if(!indexedDB){resolve(null);return;}
  const request=indexedDB.open(DATABASE,1);let settled=false;
  const timer=setTimeout(()=>{settled=true;resolve(null);},timeout),finish=(value,error)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(value);};
  request.onupgradeneeded=()=>{const db=request.result;if(settled){request.transaction?.abort();db.close();return;}if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
  request.onsuccess=()=>{if(settled){request.result.close();return;}finish(request.result);};
  request.onerror=()=>finish(null,request.error??Error('Photo storage is unavailable.'));
  request.onblocked=()=>finish(null);
 });
}
function transactionResult(tx,timeout,read){
 return new Promise((resolve,reject)=>{
  let settled=false;const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);if(error)reject(error);else resolve(read());};
  const timer=setTimeout(()=>{finish(Error('Photo storage took too long.'));try{tx.abort();}catch{}},timeout);
  tx.oncomplete=()=>finish();tx.onerror=tx.onabort=()=>finish(tx.error??Error('Photo storage is unavailable.'));
 });
}
function readAll(db,timeout){
 const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();let records=[];request.onsuccess=()=>{records=request.result;};return transactionResult(tx,timeout,()=>records);
}
function writeRecord(db,record,timeout){
  const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.getAll();let removed=[];
  request.onsuccess=()=>{
   const all=[...request.result.filter(r=>r.id!==record.id),record].sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id));
   removed=all.slice(0,Math.max(0,all.length-CAP)).map(r=>r.id);store.put(record);for(const id of removed)store.delete(id);
  };
  return transactionResult(tx,timeout,()=>removed);
}

// Only small JPEG previews enter IndexedDB. Original PNGs belong to Photo mode.
// Optional adapters make capability and quota failures testable without a GPU.
export function createZenPhotoAlbum({indexedDB:providedIndexedDB,encode=makeThumbnail,now=()=>Date.now(),storageTimeout=STORAGE_TIMEOUT}={}){
 let indexedDB;try{indexedDB=providedIndexedDB===undefined?globalThis.indexedDB:providedIndexedDB;}catch{indexedDB=null;}
 let db=null,persistent=false,disposed=false,queue=Promise.resolve(),serial=0;const records=new Map(),urls=new Map();
 const valid=r=>r&&typeof r.id==='string'&&r.blob instanceof Blob&&r.blob.type==='image/jpeg'&&r.blob.size<=MAX_BYTES&&Number.isFinite(r.createdAt)&&r.width>0&&r.width<=640&&r.height>0&&r.height<=360;
 function trim(){const sorted=[...records.values()].sort((a,b)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id)),removed=sorted.slice(0,Math.max(0,sorted.length-CAP)).map(r=>r.id);for(const id of removed){records.delete(id);if(urls.has(id))URL.revokeObjectURL(urls.get(id));urls.delete(id);}return removed;}
 const ready=openDatabase(indexedDB,storageTimeout).then(async value=>{
  if(disposed){value?.close();return;}db=value;if(!db)return;
  try{const saved=await readAll(db,storageTimeout);if(disposed)return;for(const record of saved)if(valid(record))records.set(record.id,{...record,persistent:true});persistent=true;trim();}
  catch{db?.close();db=null;}
 }).catch(()=>{});
 function presented(record){
  if(!record)return null;
  if(!urls.has(record.id))urls.set(record.id,URL.createObjectURL(record.blob));
  return {id:record.id,url:urls.get(record.id),blob:record.blob,width:record.width,height:record.height,createdAt:record.createdAt,persistent:record.persistent===true};
 }
 const serialized=fn=>{const operation=queue.then(fn);queue=operation.catch(()=>{});return operation;};
 return {
  save(blob){return serialized(async()=>{
   await ready;if(disposed)throw Error('This photo album is closed.');
   const image=await encode(blob);if(disposed)throw Error('This photo album is closed.');
   const createdAt=now(),id=`photo-${createdAt}-${++serial}-${Math.random().toString(36).slice(2,8)}`,record={...image,id,createdAt,persistent:false};
   if(!valid(record))throw Error('Could not create a small JPEG preview.');
   records.set(id,record);trim();
   if(db&&persistent)try{const removed=await writeRecord(db,record,storageTimeout);for(const key of removed){records.delete(key);if(urls.has(key))URL.revokeObjectURL(urls.get(key));urls.delete(key);}record.persistent=!removed.includes(id);}catch{persistent=false;db?.close();db=null;}
   if(disposed)throw Error('This photo album is closed.');
   return presented(record);
  });},
  list(){return serialized(async()=>{await ready;if(disposed)return [];return [...records.values()].sort((a,b)=>b.createdAt-a.createdAt||b.id.localeCompare(a.id)).map(presented);});},
  get(id){return serialized(async()=>{await ready;return disposed?null:presented(records.get(id));});},
  dispose(){disposed=true;db?.close();db=null;for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();records.clear();}
 };
}
