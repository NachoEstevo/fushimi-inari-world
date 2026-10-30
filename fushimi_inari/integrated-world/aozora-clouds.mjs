// Painted volume, not a per-frame volumetric simulation. The decoded source is
// retained only after Aozora is selected; the sky reuses its existing GPU map.
export const AOZORA_CLOUD_ASSET=Object.freeze({
  url:new URL('../assets/textures/aozora/cumulonimbus-v1.webp',import.meta.url).href,
  width:2048,height:683,downloadBytes:260292,decodedBytes:2048*683*4
});

async function loadCloudBitmap(){
  const response=await fetch(AOZORA_CLOUD_ASSET.url);
  if(!response.ok)throw new Error(`Painted clouds: HTTP ${response.status}`);
  return createImageBitmap(await response.blob());
}

export function createPaintedClouds({loadBitmap=loadCloudBitmap,onReady=()=>{}}={}){
  let bitmap=null,pending=null,disposed=false,status='idle',error=null;
  function prepare(){
    if(disposed||bitmap)return Promise.resolve(bitmap);
    if(pending)return pending;
    status='loading';error=null;
    pending=Promise.resolve().then(loadBitmap).then(value=>{
      if(disposed){value.close?.();return null;}
      bitmap=value;status='ready';onReady();return bitmap;
    }).catch(reason=>{if(!disposed){status='error';error=String(reason.message??reason);}return null;})
      .finally(()=>{pending=null;});
    return pending;
  }
  return {prepare,
    paint(context){
      if(!bitmap||disposed)return false;
      // Preserve the painted proportions: squeezing a 3:1 atlas across the
      // whole 360-degree sky flattens the towers. Each bank spans 90 degrees.
      // Clear margins separate banks and hide the sphere's wrap seam.
      for(let bank=0;bank<4;bank++)context.drawImage(bitmap,bank*512,350+(bank%2)*6,512,171);
      return true;
    },
    get stats(){return {status,error,downloadBytes:status==='idle'?0:AOZORA_CLOUD_ASSET.downloadBytes,
      decodedSourceBytes:bitmap?AOZORA_CLOUD_ASSET.decodedBytes:0,extraGPUTextures:0,extraDraws:0};},
    dispose(){if(disposed)return;disposed=true;bitmap?.close?.();bitmap=null;status='disposed';}
  };
}
