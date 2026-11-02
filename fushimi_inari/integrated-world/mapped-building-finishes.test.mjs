import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMappedBuildingFinishes} from './mapped-building-finishes.mjs';
import {createArchitecturalSurfaceLibrary} from './architectural-surface-library.mjs';
const building=(id,x=0,tags={})=>({id,tags:{building:'yes',...tags},points:[[x,0,0],[x+6,0,0],[x+6,0,4],[x,0,4],[x,0,0]]});
const options=buildings=>({buildings,segments:[{a:[-10,0,-2],b:[100,0,-2],kind:'stone',stair:false}],ground:(x,z)=>x*.1+z*.2,focusPoints:[[0,0]],focusRadius:80});
test('near anonymous context preserves exact source triangles and inferred height while walls receive finite metric UVs',()=>{
 const b=building('near'),result=createMappedBuildingFinishes(options([b]));
 assert.deepEqual([...result.detailedIds],['near']);assert.equal(result.stats.records[0].height,6);
 assert.equal(result.stats.records[0].heightSource,'inferred');assert.equal(result.stats.records[0].base,0);assert.equal(result.stats.records[0].roof,7.4);
 const actual=[];let nondegenerateWallUV=false;
 result.group.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,uv=mesh.geometry.attributes.uv,n=mesh.geometry.attributes.normal;
  for(let i=0;i<p.count;i+=3){actual.push(Array.from(p.array.slice(i*3,i*3+9)).join(','));if(Math.abs(n.getY(i))<.1){const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getY(i+1)-uv.getY(i))*(uv.getX(i+2)-uv.getX(i));if(Math.abs(area)>.01)nondegenerateWallUV=true;}}
  for(const value of uv.array)assert.ok(Number.isFinite(value));
 });assert.ok(nondegenerateWallUV);
 const expected=[],ring=b.points.slice(0,-1),roof=7.4;
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],q=[[a[0],0,a[2]],[b[0],0,b[2]],[b[0],roof,b[2]],[a[0],roof,a[2]]];for(const tri of [[0,1,2],[0,2,3]])expected.push(tri.flatMap(j=>q[j]).map(Math.fround).join(','));}
 for(const tri of THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]))expected.push(tri.flatMap(j=>[ring[j][0],roof,ring[j][2]]).map(Math.fround).join(','));
 assert.deepEqual(actual.sort(),expected.sort());result.dispose();
});
test('only bounded near-path ordinary buildings are selected; exclusion, omitted proxies and source objects stay untouched',()=>{
 const buildings=[building('near'),building('other',10),building('excluded',20),building('omitted',25),building('shrine',30,{building:'shrine'}),building('temple',35,{building:'temple'}),building('roof',40,{building:'roof'}),building('far',200)];
 const before=JSON.stringify(buildings),result=createMappedBuildingFinishes({...options(buildings),maxBuildings:2,excludesBuilding:b=>b.id==='excluded',omitBuilding:b=>b.id==='omitted'});
 assert.deepEqual([...result.detailedIds],['near','other']);assert.equal(JSON.stringify(buildings),before);assert.equal(result.stats.buildings,2);
 assert.equal(result.stats.extraLights,0);assert.equal(result.stats.perFrameWork,false);result.dispose();
});
test('batches share bounded texture owners and disposal releases only helper resources once',()=>{
 const result=createMappedBuildingFinishes(options([building('first'),building('second',12)])),materials=new Set(),maps=new Set();
 result.group.traverse(o=>{if(o.isMesh){materials.add(o.material);for(const key of ['map','bumpMap','roughnessMap'])if(o.material[key])maps.add(o.material[key]);}});
 assert.equal(materials.size,2);assert.ok(maps.size<=4);
 let disposed=0;for(const map of maps){assert.equal(map.image.width,256);assert.equal(map.generateMipmaps,true);map.addEventListener('dispose',()=>disposed++);}
 result.dispose();result.dispose();assert.equal(disposed,maps.size);
});

test('cell quotas spread detail across the real route and tiny envelopes never claim window openings',()=>{
 const buildings=[];for(let i=0;i<12;i++)buildings.push(building('station-'+i,i*8));
 buildings.push(building('mountain',520));
 const result=createMappedBuildingFinishes({...options(buildings),focusPoints:undefined,segments:[{a:[-10,0,-2],b:[550,0,-2]}],maxBuildings:4,maxPerCell:3});
 assert.equal(result.detailedIds.size,4);assert.ok(result.detailedIds.has('mountain'),'another route cell gets detail before the first cell consumes the budget');
 assert.equal([...result.detailedIds].filter(id=>id.startsWith('station')).length,3);result.dispose();
 const tiny=building('tiny');tiny.points=[[0,0,0],[1.5,0,0],[1.5,0,2],[0,0,2],[0,0,0]];
 const small=createMappedBuildingFinishes(options([tiny]));assert.equal(small.stats.records[0].windowFaces,0);
 small.group.traverse(o=>{if(!o.isMesh||o.material.name.endsWith('roof'))return;const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)assert.ok(Number.isFinite(uv.getX(i)));});assert.equal(small.stats.records[0].opaqueOnly,true);small.dispose();
});

test('no nearby candidates allocate no geometry or GPU texture owners',()=>{
 const result=createMappedBuildingFinishes({...options([building('far',500)]),focusPoints:undefined});
 assert.equal(result.detailedIds.size,0);assert.equal(result.stats.materials,0);assert.equal(result.stats.textures,0);assert.equal(result.stats.batches,0);result.dispose();
});

test('mapped buildings borrow shared materials without disposing resources used elsewhere',()=>{
 const surfaces=createArchitecturalSurfaceLibrary(),wood=surfaces.get('timber');
 const result=createMappedBuildingFinishes({...options([building('wood',0,{'building:material':'wood'})]),surfaceLibrary:surfaces});
 let wall;result.group.traverse(mesh=>{if(mesh.isMesh&&mesh.material===wood)wall=mesh;});
 assert.ok(wall,'the facade uses the library material');
 const uv=wall.geometry.attributes.uv;
 assert.equal(Math.max(...Array.from(uv.array).filter((_,i)=>i%2===0)),6,'six metre wall spans six one-metre tiles');
 let disposed=0;wood.map.addEventListener('dispose',()=>disposed++);
 result.dispose();assert.equal(disposed,0);assert.strictEqual(surfaces.get('timber'),wood);
 surfaces.dispose();assert.equal(disposed,1);
});

test('referenced cafe opens only its facing wall above the supported grade',()=>{
 const cafe=building('way/626313740'),shrine={id:'way/626313736',tags:{building:'shrine'},points:[[-1,0,-3],[7,0,-3],[7,0,-2],[-1,0,-2],[-1,0,-3]]};
 const result=createMappedBuildingFinishes({...options([cafe,shrine]),ground:x=>x*.1});
 const record=result.stats.records[0],frontFloor=record.upperCafe.frontFloor;
 assert.equal(record.upperCafe.edge,0);assert.ok(frontFloor>record.base);
 const wallTriangles=[];
 result.group.traverse(mesh=>{if(!mesh.isMesh||mesh.material.name!=='Mapped context plaster')return;
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i+=3)wallTriangles.push(Array.from({length:3},(_,j)=>[p.getX(i+j),p.getY(i+j),p.getZ(i+j)]));
 });
 const near=(a,b)=>Math.abs(a-b)<1e-5;
 const front=wallTriangles.filter(tri=>tri.every(p=>near(p[2],0)));
 assert.equal(front.length,2,'only the foundation remains in the original facing plane');
 assert.ok(front.flat().every(p=>p[1]<=frontFloor+1e-5));
 assert.equal(wallTriangles.filter(tri=>tri.every(p=>near(p[2],4))&&tri.some(p=>near(p[1],record.roof))).length,2,'opposite wall remains closed');
 result.dispose();
});

test('referenced shell stays closed when its frontage cannot be built',()=>{
 const cafe=building('way/626313740',0,{height:'1'}),shrine={id:'way/626313736',tags:{building:'shrine'},points:[[-1,0,-3],[7,0,-3],[7,0,-2],[-1,0,-2],[-1,0,-3]]};
 const result=createMappedBuildingFinishes({...options([cafe,shrine]),ground:()=>0});
 assert.equal(result.stats.records[0].inferredFacade,false);
 let facing=0;result.group.traverse(mesh=>{if(!mesh.isMesh||mesh.material.name!=='Mapped context plaster')return;
  const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i+=3)if([0,1,2].every(j=>p.getZ(i+j)===0))facing++;
 });
 assert.equal(facing,2,'no uncovered opening is left in a low envelope');result.dispose();
});

test('unreferenced context stays opaque with unshadowed plaster and subtle roof seams',()=>{
 const result=createMappedBuildingFinishes(options([building('finish')]));
 const materials=new Map();result.group.traverse(o=>{if(o.isMesh)materials.set(o.material.name,o.material);});
 const wall=materials.get('Mapped context plaster'),roof=materials.get('Mapped context roof');
 const pixel=(m,u,v)=>{const i=(Math.floor(v*256)*256+Math.floor(u*256))*4;return Array.from(m.map.image.data.slice(i,i+3));};
 const mean=(m,x0,x1,y)=>{let sum=0;for(let x=x0;x<x1;x++)sum+=pixel(m,x/256,y/256)[0];return sum/(x1-x0);};
 assert.ok(Math.abs(mean(wall,0,256,4)-mean(wall,0,256,252))<4,'no repeated painted plinth or shadow');
 assert.equal(result.stats.records[0].windowFaces,0);assert.equal(result.stats.records[0].opaqueOnly,true);
 const packed=wall.roughnessMap.image.data;for(let i=0;i<packed.length;i+=4)assert.ok(packed[i+1]>200,'no low-roughness invented glass panes');
 assert.ok(pixel(wall,.4,.5)[0]>160,'former window area remains opaque plaster');
 assert.ok(Math.abs(mean(roof,1,2,30)-mean(roof,8,16,30))>2,'roof seam differs subtly from broad sheet');
 assert.equal(result.stats.textures,4);assert.equal(result.stats.textureBytes,1048576);result.dispose();
});
