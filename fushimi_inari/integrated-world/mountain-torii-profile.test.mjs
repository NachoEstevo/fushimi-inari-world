import test from 'node:test';
import assert from 'node:assert/strict';
import {mountainToriiProfile,inscriptionVariant,toriiInscriptionProfile,toriiInscriptionVariantCount} from './mountain-torii-profile.mjs';
import {toriiVariation} from './torii-variation.mjs';
test('mountain sections mix three stable size cohorts with safe clear widths',()=>{
  for(let section=0;section<9;section++){
    const profiles=Array.from({length:100},(_,i)=>mountainToriiProfile(section,i));
    assert.equal(new Set(profiles.map(p=>p.height)).size,3);
    profiles.forEach((p,i)=>{
      assert.deepEqual(p,mountainToriiProfile(section,i));
      const v=toriiVariation(771+section*509,i),scale=1.08*.965;
      const sx=scale*v.width*p.width,sz=scale*v.depth;
      const radius=.144*p.thickness*Math.max(sx,sz);
      assert.ok(2*1.24*sx-2*radius>2,'pillar thickening must retain walking clearance');
      assert.ok(3.4*1.16*1.035*.96*v.height*p.height<5.3);
    });
  }
});
test('adjacent inscriptions select whole sourced records and distribute every record before cycling',async()=>{
  const {toriiInscriptionRecords}=await import('./torii-inscription-records.mjs');
  assert.equal(toriiInscriptionVariantCount,24);
  for(let seed=-2;seed<20;seed++){
    assert.equal(new Set(Array.from({length:24},(_,i)=>inscriptionVariant(seed,i))).size,24);
    for(let i=0;i<100;i++){
      const profile=toriiInscriptionProfile(seed,i),record=toriiInscriptionRecords[profile.recordIndex];
      assert.ok(record);assert.ok(record.source.startsWith('https://'));
      assert.notEqual(profile.recordIndex,toriiInscriptionProfile(seed,i+1).recordIndex);
      assert.deepEqual(profile,toriiInscriptionProfile(seed,i));
      assert.ok(profile.inkStyle>=0&&profile.inkStyle<8);
      if(record.donorLines.length&&record.date)assert.equal(record.pairing,'same-gate-visible');
    }
  }
});
