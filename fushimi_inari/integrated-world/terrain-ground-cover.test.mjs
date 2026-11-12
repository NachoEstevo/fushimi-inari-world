import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makePrecinctGroundCover,terrainGroundCoverAsync} from './ground-cover.mjs';
import {pathClearance} from './spatial.mjs';

const features=JSON.parse(fs.readFileSync(new URL('../geography/features.json',import.meta.url)));
const surfaceAreas=JSON.parse(fs.readFileSync(new URL('../geography/sources/entrance-surfaces-r54.json',import.meta.url)));
// The former viewer loop, kept verbatim as the byte-identity reference.
async function stringKeyed(pos,{ground,pathDistance,groundCover,checkpoint}){
  const cover=new Float32Array(pos.length/3),precinctGrass=new Float32Array(pos.length/3),coverCache=new Map();
  for(let i=0;i<pos.length;i+=3){
    if(i%192===0){const pause=checkpoint();if(pause)await pause;}
    const x=pos[i],y=pos[i+1],z=pos[i+2],key=`${x},${z}`;
    if(!coverCache.has(key)){
      const slope=Math.hypot(ground(x+1,z)-ground(x-1,z),ground(x,z+1)-ground(x,z-1))/2;
      const distance=pathDistance(x,z)?.distance??100;
      coverCache.set(key,[groundCover(x,y,z,slope,distance),groundCover.precinct(x,y,z,slope,distance)]);
    }
    cover[i/3]=coverCache.get(key)[0];precinctGrass[i/3]=coverCache.get(key)[1];
  }
  return {cover,precinctGrass};
}
function triangles(){
  // Precinct, woodland and repeated planimetric positions with distinct
  // heights (cut walls), plus signed zero and non-grid fractional vertices.
  const pos=[];
  for(let x=-160;x<=170;x+=7.5)for(let z=-120;z<=70;z+=6.25){
    const corner=(dx,dz,y=40+Math.sin(x*.07)*12+dz)=>pos.push(x+dx,y,z+dz);
    corner(0,0);corner(0,6.25);corner(7.5,0);corner(7.5,0,99);corner(0,6.25,12);corner(7.5,6.25);
  }
  for(const z of [-0,0,-0.1,1/3])pos.push(800.2,170,z,-0,60,z,0,61,z);
  return new Float32Array(pos);
}
test('numeric terrain cover cache reproduces the string-keyed vertex attributes exactly',async()=>{
  const pos=triangles(),calls=[[],[]],pathDistance=pathClearance(features.paths),groundCover=makePrecinctGroundCover(features,{surfaceAreas});
  const ground=log=>(x,z)=>{log.push(x,z);return 40+Math.sin(x*.05)*9+Math.cos(z*.04)*7;};
  let pauses=[0,0];const checkpoint=index=>()=>{pauses[index]++;return null;};
  const before=await stringKeyed(pos,{ground:ground(calls[0]),pathDistance,groundCover,checkpoint:checkpoint(0)});
  const after=await terrainGroundCoverAsync(pos,{ground:ground(calls[1]),pathDistance,cover:groundCover,checkpoint:checkpoint(1)});
  assert.deepEqual(Buffer.from(after.cover.buffer),Buffer.from(before.cover.buffer));
  assert.deepEqual(Buffer.from(after.precinctGrass.buffer),Buffer.from(before.precinctGrass.buffer));
  assert.deepEqual(calls[1],calls[0],'ground sampling order and count are unchanged');
  assert.deepEqual(pauses[1],pauses[0],'startup checkpoints keep their cadence');
  assert.ok(after.cover.some(v=>v>0)&&after.precinctGrass.some(v=>v>0),'fixture exercises both cover terms');
  assert.ok(after.samples<pos.length/3);
});
test('terrain cover awaits checkpoint pauses and falls back without a split cover function',async()=>{
  const pos=new Float32Array(Array.from({length:400*3},(_,i)=>i%3===1?50:Math.floor(i/3)%7));
  const cover=Object.assign((x,y,z,slope,distance)=>x/10,{precinct:()=>.25});let awaited=0;
  const result=await terrainGroundCoverAsync(pos,{ground:()=>0,pathDistance:()=>null,cover,checkpoint:()=>Promise.resolve().then(()=>{awaited++;})});
  assert.equal(awaited,Math.ceil(pos.length/192));
  assert.ok(Math.abs(result.cover[3]-.3)<1e-7);assert.equal(result.precinctGrass[3],.25);assert.equal(result.samples,7);
});
