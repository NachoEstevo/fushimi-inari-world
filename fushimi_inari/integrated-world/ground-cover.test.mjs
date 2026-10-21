import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {groundCover,makePrecinctGroundCover} from './ground-cover.mjs';
test('vegetation leaves urban entrance, trail tread and exposed banks bare',()=>{
  assert.equal(groundCover(30,42,-16,0,20),0);
  assert.equal(groundCover(795,164,-216,.1,2),0);
  assert.equal(groundCover(795,164,-216,1.5,20),0);
});
test('outlook and woodland margins retain green ground cover with bounded transitions',()=>{
  for(const [x,y,z] of [[795,164,-216],[793,180,-315],[730,140,-270]]){
    assert.ok(groundCover(x,y,z,.15,8)>.9);
    assert.ok(groundCover(x,y,z,.15,4)>0);
    assert.ok(groundCover(x,y,z,.15,4)<1);
  }
});
const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const surfaceAreas=JSON.parse(fs.readFileSync(new URL('../geography/sources/entrance-surfaces-r54.json',import.meta.url)));
test('bounded precinct ground keeps buildings, mapped full-width paths, water and parking bare',()=>{
  const cover=makePrecinctGroundCover(features,{surfaceAreas});
  for(const id of ['way/899425893','way/305214371']){
    const p=features.pois.find(p=>p.id===id).point;assert.equal(cover(p[0],p[1],p[2],0,20),0,id);
  }
  assert.equal(cover(-110,35,7,0,0),0,'Omotesando centre');
  assert.equal(cover(-110,35,10,0,3),0,'full avenue width');
  assert.equal(cover(-140,35,-10,0,20),0,'NPC asphalt');
  assert.equal(cover(-100,35,50,0,20),0,'large parking');
  assert.equal(cover(-140,35,-37,0,20),0,'dated brownfield');
  const fake=makePrecinctGroundCover({paths:[],buildings:[],water:[{points:[[90,0,30],[100,0,30],[100,0,40],[90,0,40],[90,0,30]]}]});
  assert.equal(fake(95,40,35,0,30),0,'water');
});
test('aesthetic vegetation is present near shrines but does not change distant city or summit',()=>{
  const cover=makePrecinctGroundCover({paths:[],buildings:[],water:[]});
  for(const [x,z]of [[-90,-25],[85,-30],[125,-35],[95,35]])assert.ok(cover(x,45,z,.1,20)>.8);
  for(const [x,y,z]of [[-200,35,20],[190,80,300],[950,200,0]])assert.equal(cover(x,y,z,.1,20),groundCover(x,y,z,.1,20));
  assert.equal(cover.precinct(950,200,0,.1,20),0,'new near-only attribute does not tint summit forest');
  assert.ok(cover.precinct(125,45,-35,.1,20)>.8);
  assert.equal(cover(85,45,-30,2,20),0,'steep exposed bank retained');
  assert.ok(cover(20,44,0,0,20)>.8,'central court shader owns its precise mineral boundary');
  const custom=makePrecinctGroundCover({paths:[],buildings:[],water:[]},{hardscapeAt:(x,z)=>x===85&&z===-30});
  assert.equal(custom(85,45,-30,0,20),0,'caller hardscape precedence');
});
