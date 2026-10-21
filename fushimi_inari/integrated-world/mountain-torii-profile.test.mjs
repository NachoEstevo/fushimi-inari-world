import test from 'node:test';
import assert from 'node:assert/strict';
import {mountainToriiProfile,inscriptionVariant,inscriptionDate,dedicationTexts} from './mountain-torii-profile.mjs';
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
test('adjacent dedications differ and always address valid atlas tiles',()=>{
  assert.equal(dedicationTexts.length,8);
  assert.equal(new Set(Array.from({length:16},(_,i)=>`${inscriptionVariant(0,i)}:${inscriptionDate(0,i)}`)).size,16);
  for(let seed=0;seed<9;seed++)for(let i=0;i<100;i++){
    const variant=inscriptionVariant(seed,i);
    assert.ok(variant>=0&&variant<4);
    assert.notEqual(variant,inscriptionVariant(seed,i+1));
    assert.ok(dedicationTexts[variant]&&dedicationTexts[variant+4]);
    assert.ok(inscriptionDate(seed,i)>=4&&inscriptionDate(seed,i)<8);
  }
});
