import test from 'node:test';
import assert from 'node:assert/strict';
import {createPaintedClouds,AOZORA_CLOUD_ASSET} from './aozora-clouds.mjs';

test('painted clouds load once on demand and reuse caller canvas without per-frame work',async()=>{
  let loads=0,ready=0,closed=0;const draws=[];
  const bitmap={close(){closed++;}};
  const clouds=createPaintedClouds({loadBitmap:async()=>{loads++;return bitmap;},onReady:()=>ready++});
  assert.equal(clouds.stats.status,'idle');assert.equal(loads,0);
  assert.equal(clouds.paint({}),false);
  await Promise.all([clouds.prepare(),clouds.prepare()]);
  assert.equal(loads,1);assert.equal(ready,1);
  assert.equal(clouds.stats.decodedSourceBytes,AOZORA_CLOUD_ASSET.width*AOZORA_CLOUD_ASSET.height*4);
  clouds.paint({drawImage(...args){draws.push(args);}});
  assert.deepEqual(draws,[[bitmap,0,350,512,171],[bitmap,512,356,512,171],[bitmap,1024,350,512,171],[bitmap,1536,356,512,171]]);
  await clouds.prepare();assert.equal(loads,1);assert.equal(clouds.stats.extraGPUTextures,0);
  clouds.dispose();clouds.dispose();assert.equal(closed,1);assert.equal(clouds.stats.decodedSourceBytes,0);
});

test('failed art load retains fallback and permits an explicit retry',async()=>{
  let attempts=0;
  const clouds=createPaintedClouds({loadBitmap:async()=>{if(++attempts===1)throw Error('offline');return {};}});
  assert.equal(await clouds.prepare(),null);assert.equal(clouds.stats.error,'offline');assert.equal(clouds.paint({}),false);
  await clouds.prepare();assert.equal(clouds.stats.status,'ready');assert.equal(attempts,2);clouds.dispose();
});

test('a late image after disposal cannot repaint or retain decoded memory',async()=>{
  let resolve,closed=0,ready=0;
  const clouds=createPaintedClouds({loadBitmap:()=>new Promise(done=>{resolve=done;}),onReady:()=>ready++});
  const pending=clouds.prepare();await Promise.resolve();clouds.dispose();resolve({close(){closed++;}});await pending;
  assert.equal(closed,1);assert.equal(ready,0);assert.equal(clouds.stats.status,'disposed');assert.equal(clouds.stats.decodedSourceBytes,0);
});
