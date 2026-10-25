import * as THREE from 'three';

export function textureTierURL(url,mode){
 const marker='/assets/textures/',at=url.indexOf(marker);
 return mode==='ultra'||at<0?url:url.slice(0,at)+marker+'balanced/'+url.slice(at+marker.length).replace(/\.png$/i,'.webp');
}

// Image ownership is separate from geometry/collision ownership. Shared maps
// download once; only maps used near the camera are requested. Ultra retains
// byte-identical original PNGs and swaps them in without replacing materials.
export function createTextureStreaming({loadImage=url=>new THREE.ImageLoader().loadAsync(url),report=()=>{},audit=false}={}){
 const records=new Map(),sources=new Map();let mode='balanced',users=[],elapsed=1,active=0,queue=[],revision=0;
 const cells=new Map(),largeUsers=[],ready=[];let lastPosition=null,timer=null,lastApply=-Infinity,lastReport=-Infinity,lastReportedPending=0;
 const tier=()=>mode==='ultra'?'ultra':'balanced';
 const pending=()=>queue.length+active+ready.length;
 // Reporting can serialize many texture clones in audit mode. Keep it off the
 // upload cadence; a transition to idle still publishes the final state.
 function emit(force=false){const now=performance.now(),outstanding=pending();
  if(!force&&now-lastReport<500&&!(outstanding===0&&lastReportedPending>0))return;
  lastReport=now;lastReportedPending=outstanding;
  report({mode,registered:records.size,loaded:[...records.values()].filter(r=>r.current).length,pending:pending(),failed:[...records.values()].filter(r=>r.error).map(r=>r.url),
  ...(audit?{diagnostics:[...records.values()].filter(r=>!r.current||/foliage/i.test(r.url)).map(r=>({file:r.url.split('/').pop(),tier:r.current??null,pending:r.pending??null,users:r.userCount??0,textures:[...r.textures].map(t=>({size:[t.image?.width??0,t.image?.height??0],source:t.source.id,sourceVersion:t.source.version,textureVersion:t.version}))}))}:{})});
 }
 function apply(r,image,tier){
  // WebGL2 storage is immutable after the placeholder's first upload. Release
  // every registered texture before mutating a shared Source so larger image
  // uploads (and quality tier changes) allocate storage at the new dimensions.
  const resized=[...r.textures].filter(t=>t.image?.width!==image.width||t.image?.height!==image.height);
  for(const texture of resized)texture.dispose();
  for(const texture of r.textures){texture.image=image;texture.needsUpdate=true;}r.current=tier;revision++;
 }
 // Decoding can complete together; pace texture invalidation as well as network
 // refill so resuming after arrival never uploads an entire completed batch.
 function schedule(){if(timer===null&&(queue.length||ready.length))timer=setTimeout(()=>{timer=null;drain();},50);}
 function drain(){
  if(ready.length&&performance.now()-lastApply>=50){
   const {r,image,tier:loadedTier}=ready.shift();r.ready=false;
   if(tier()===loadedTier&&r.current!==loadedTier){apply(r,image,loadedTier);lastApply=performance.now();}else if(tier()!==loadedTier)request(r);
  }
  if(active<2&&queue.length){const r=queue.shift(),requestedTier=tier();r.queued=false;
   if(r.current!==requestedTier&&!r.pending){
    if(r.images.has(requestedTier)){r.ready=true;ready.push({r,image:r.images.get(requestedTier),tier:requestedTier});}
    else {active++;r.pending=requestedTier;
     loadImage(textureTierURL(r.url,requestedTier)).then(image=>{r.images.set(requestedTier,image);r.error=null;
      if(tier()===requestedTier){r.ready=true;ready.push({r,image,tier:requestedTier});}
     }).catch(error=>{r.error=String(error);console.warn('Texture unavailable',r.url,error);}).finally(()=>{active--;r.pending=null;if(tier()!==requestedTier)request(r);schedule();emit();});
    }
   }
  }
  schedule();emit();
 }
 function request(r){if(r.current===tier()||r.pending||r.queued||r.ready||r.error)return;r.queued=true;queue.push(r);}
 function load(url){
  const absolute=new URL(url,import.meta.url).href;let r=records.get(absolute);
  if(!r){r={url:absolute,textures:new Set(),images:new Map()};records.set(absolute,r);}
  // These maps supply the painted wood color on otherwise white materials.
  // Keep that material identity while a nearby image loads (or fails), without
  // tinting stone gates or changing normal/roughness map semantics.
  const painted=/\/(?:wood_vermilion_shuiro_color|torii_weathered_kanji_color|Torii_Kanji_Column_BaseColor)\.png$/i.test(new URL(absolute).pathname);
  const rgba=/normal/i.test(url)?[128,128,255,255]:painted?[190,49,25,255]:[255,255,255,255];
  const canvas=typeof document==='undefined'?{width:1,height:1,data:new Uint8Array(rgba)}:document.createElement('canvas');
  canvas.width=canvas.height=1;
  const ctx=canvas.getContext?.('2d');if(ctx){ctx.fillStyle=`rgb(${rgba.slice(0,3).join(',')})`;ctx.fillRect(0,0,1,1);}
  const texture=new THREE.Texture(canvas);
  if(r.current)texture.image=r.images.get(r.current);
  texture.needsUpdate=true;r.textures.add(texture);sources.set(texture.source,r);return texture;
 }
 function index(scene){users=[];cells.clear();largeUsers.length=0;lastPosition=null;for(const r of records.values())r.userCount=0;scene.updateMatrixWorld(true);scene.traverse(o=>{
  if(!o.geometry)return;const used=new Set();
  for(const m of [o.material].flat().filter(Boolean))for(const t of Object.values(m)){if(!t?.isTexture)continue;const r=sources.get(t.source);if(r){r.textures.add(t);used.add(r);}}
  if(!used.size)return;
  if(o.isInstancedMesh)o.computeBoundingSphere();else if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
  const sphere=(o.boundingSphere??o.geometry.boundingSphere).clone().applyMatrix4(o.matrixWorld);
  const user={sphere,used};users.push(user);for(const r of used)r.userCount++;
  const minX=Math.floor((sphere.center.x-sphere.radius)/260),maxX=Math.floor((sphere.center.x+sphere.radius)/260);
  const minZ=Math.floor((sphere.center.z-sphere.radius)/260),maxZ=Math.floor((sphere.center.z+sphere.radius)/260);
  if((maxX-minX+1)*(maxZ-minZ+1)>64)largeUsers.push(user);
  else for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(user);}
 });}
 function update(position,dt=1){elapsed+=dt;if(elapsed<.5)return;elapsed=0;
  // Static worlds need another residency query only after camera movement,
  // reindexing, or a tier change. Query nearby cells, not every world mesh.
  if(!lastPosition||lastPosition.distanceToSquared(position)>=16){
   lastPosition=position.clone();const nearby=new Set(largeUsers);
   for(let x=Math.floor((position.x-264)/260);x<=Math.floor((position.x+264)/260);x++)
    for(let z=Math.floor((position.z-264)/260);z<=Math.floor((position.z+264)/260);z++)for(const u of cells.get(x+','+z)??[])nearby.add(u);
   for(const {sphere,used}of nearby)if(sphere.distanceToPoint(position)<264)for(const r of used)request(r);
  }
  drain();
 }
 return {load,index,update,setMode(next){mode=next;elapsed=1;lastPosition=null;for(const r of records.values())r.error=null;},async prepare(scene,position){index(scene);update(position);while(pending())await new Promise(resolve=>setTimeout(resolve,25));emit(true);},get stats(){return {registered:records.size,users:users.length,revision,pending:pending()};}};
}
export const textureStreaming=createTextureStreaming({audit:typeof location!=='undefined'&&(new URLSearchParams(location.search).has('audit')||new URLSearchParams(location.search).has('textureAudit')),report:value=>{if(typeof document!=='undefined')document.body.dataset.textureStreaming=JSON.stringify(value);}});
