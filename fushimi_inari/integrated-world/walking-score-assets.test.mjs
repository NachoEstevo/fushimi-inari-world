import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WALKING_MUSIC} from './walking-music.mjs';

function opusDuration(bytes){
 const head=bytes.indexOf('OpusHead');assert.ok(head>=0);assert.equal(bytes[head+9],2,'retain the authored stereo image');
 const preSkip=bytes.readUInt16LE(head+10);let offset=0,last=0n;
 while(offset<bytes.length){
  assert.equal(bytes.toString('ascii',offset,offset+4),'OggS');const segments=bytes[offset+26];let payload=0;
  for(let i=0;i<segments;i++)payload+=bytes[offset+27+i];
  const granule=bytes.readBigUInt64LE(offset+6);if(granule!==0xffffffffffffffffn)last=granule;
  offset+=27+segments+payload;
 }
 assert.equal(offset,bytes.length);return (Number(last)-preSkip)/48000;
}

test('licensed walking recordings match their provenance hashes and stay within a four-megabyte release budget',()=>{
 const folder=new URL('../assets/audio/walking-score/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('manifest.json',folder),'utf8'));
 assert.equal(manifest.assets.length,3);let total=0;
 for(const asset of manifest.assets){
  assert.equal(asset.license,'CC0 1.0');assert.equal(asset.license_url,'https://creativecommons.org/publicdomain/zero/1.0/');
  assert.ok(['opengameart.org','freesound.org'].includes(new URL(asset.source).hostname));assert.match(asset.original_sha256,/^[a-f0-9]{64}$/);
  const bytes=readFileSync(new URL(asset.file,folder));total+=bytes.length;assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  const duration=opusDuration(bytes);assert.ok(Math.abs(duration-asset.duration_seconds)<.12);
  if(asset.id==='tottori-bamboo')assert.ok(Math.abs(duration-38)<.05,'use the prepared seamless excerpt, not a complete unbounded field recording');
  else assert.ok(duration>120&&duration<250,'retain complete tranquil pieces rather than short repetitive loops');
 }
 assert.ok(total<4_000_000);for(const track of WALKING_MUSIC)assert.ok(manifest.assets.some(asset=>track.url.endsWith(asset.file)));
});
