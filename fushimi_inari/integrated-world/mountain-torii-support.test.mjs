import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {mountainToriiFootSupports,mountainToriiSupportTriangles} from './mountain-torii.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';
import {integratedTerrainTriangles} from './terrain-triangles.mjs';
import {makePathSurfaces} from './path-surfaces.mjs';
import {heightAt} from '../geography/geo-core.mjs';
import {createHash} from 'node:crypto';

const transform=(x,y,z,yaw=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw),new THREE.Vector3(1.2,1.1,1.1));

test('empty post support skips terrain scanning entirely',()=>{
 const terrain=new Proxy([],{get:()=>{throw new Error('No posts require no terrain reads');}});
 assert.deepEqual(mountainToriiSupportTriangles(terrain,[]),[]);
});

test('support selection preserves original bytes at signed bin edges and wide spanning triangles',()=>{
 const positions=integratedTerrainTriangles({cols:5,rows:5,xmin:-12.3,zmin:-8.1,step:10},[],()=>({distance:0}),(x,z)=>x*.07-z*.11);
 const posts=[{x:-2.01,z:-.01,radius:.2},{x:0,z:0,radius:.01},{x:13.9,z:17.95,radius:.25},{x:1000,z:-1000,radius:1}];
 for(const input of [positions,new Float32Array(positions)]){
  const local=mountainToriiSupportTriangles(input,posts),hash=createHash('sha256').update(new Uint8Array(new Float64Array(local).buffer)).digest('hex');
  assert.equal(hash,Array.isArray(input)?'8f1aa5e87a95193b2b852cdbf936c9816745d0d3c8d9d6483db0c6cdd08d0e8a':'adbcdf5521dc6d853676ab6b4c2fa6d7dc94d6fb1c9b8b6e8a104fb9f748298d');
 }
});

test('support index retains triangles spanning a foot and excludes unrelated terrain',()=>{
 const near=[-3,4,-3,3,7,-3,0,6,3],far=[100,50,100,110,50,100,100,50,110],local=mountainToriiSupportTriangles([...near,...far],[{x:0,z:0,radius:.2}]);
 assert.deepEqual(local,near);
 const full=makeShoulderTriangleHeight([...near,...far]),bounded=makeShoulderTriangleHeight(local);
 for(const [x,z]of [[0,0],[.2,0],[-.2,0],[0,.2],[0,-.2]])assert.equal(bounded(x,z),full(x,z));
 assert.equal(bounded(101,101),null);
});

test('feet use actual rendered terrain beyond the walkway, not its axis or nonlinear DEM estimate',()=>{
 const matrix=transform(0,10,0),rendered=(x,z)=>6+x*.4+z*.2;
 const surfaces={sample:()=>null,height:()=>10,terrainHeight:()=>9};
 const feet=mountainToriiFootSupports(matrix,1.45,surfaces,rendered);
 assert.ok(feet[0].bottom<feet[1].bottom);
 for(const [i,side]of [-1,1].entries())for(let n=0;n<16;n++){
  const a=n*Math.PI/8,p=new THREE.Vector3(side*1.24+.144*1.45*Math.cos(a),0,.144*1.45*Math.sin(a)).applyMatrix4(matrix);
  assert.ok(feet[i].bottom<=rendered(p.x,p.z)-.079);
  assert.equal(feet[i].top,10.015);
 }
 assert.equal(matrix.elements[13],10,'support must not lower beams or inscription frame');
});

test('a pillar on a raised stair tread uses the tread and keeps a minimal overlap',()=>{
 const feet=mountainToriiFootSupports(transform(0,10,0,.65),1.22,{sample:()=>({height:10.025}),height:()=>10.025},()=>3);
 for(const foot of feet){assert.ok(Math.abs(foot.bottom-9.945)<1e-8);assert.equal(foot.top,10.015);}
});

test('Western trail Kyoto viewpoint low-side foot reaches the rendered hillside',()=>{
 const read=file=>JSON.parse(readFileSync(new URL(file,import.meta.url))),features=read('../geography/features.json'),terrain=read('../geography/terrain.json');
 const surfaces=makePathSurfaces(features,(x,z)=>heightAt(terrain,x,z)),x=731.11,z=-274.06,road=surfaces.sample(x,z);
 assert.equal(road.segment.id,'way/649037626');
 // Same renderer triangulation and offset in a bounded neighborhood of the
 // native checkpoint, using the real DEM and actual path roadbed cut.
 const triangles=integratedTerrainTriangles({cols:4,rows:4,xmin:720,zmin:-290,step:10},[],()=>({distance:0}),surfaces.terrainHeight),rendered=makeShoulderTriangleHeight(triangles);
 const a=road.segment.a,b=road.segment.b,matrix=transform(x,road.height-.025,z,Math.atan2(b[0]-a[0],b[2]-a[2]));
 const feet=mountainToriiFootSupports(matrix,1.22,surfaces,rendered);
 assert.ok(matrix.elements[13]-rendered(feet[0].x,feet[0].z)>.5,'regression needs the real floating downhill post');
 assert.ok(feet[0].bottom<rendered(feet[0].x,feet[0].z));
 assert.ok(feet[0].top>=matrix.elements[13],'extension meets existing black sleeve');
});
