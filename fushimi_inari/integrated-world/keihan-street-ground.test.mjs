import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {makeKeihanStreetGroundMask,blendKeihanStreetGround} from './keihan-street-ground.mjs';
import {blendCourtyardGround} from './courtyard-ground.mjs';
import {blendEntranceGround} from './entrance-ground.mjs';
import {clipMitsuTerrain} from './mitsu-frontage-aprons.mjs';
import {KEIHAN_CANAL_RING} from './keihan-approach.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));

test('mineral shoulder follows every mapped corner and fades at a bounded distance',()=>{
 const layout=makeKeihanStreetGroundMask(features);assert.equal(layout.segments.length,43);
 for(const s of layout.segments){assert.equal(layout.mask(...s.a),1);assert.equal(layout.mask(...s.b),1);}
 const s=layout.segments.find(s=>Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1])>30),dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],length=Math.hypot(dx,dz),x=(s.a[0]+s.b[0])/2,z=(s.a[1]+s.b[1])/2;
 const sample=offset=>layout.mask(x-dz/length*offset,z+dx/length*offset);
 assert.equal(sample(4.49),1);assert.ok(Math.abs(sample(5)-.5)<1e-8);assert.equal(sample(5.51),0);
 for(const point of [[0,0],[800,-220],[-300,-180],[-250,-60],[-400,-140],[-30,-40]])assert.equal(layout.mask(...point),0);
 assert.ok(layout.sourceIds.includes('way/1057050892'));assert.ok(layout.sourceIds.includes('way/297888106'));assert.ok(!layout.sourceIds.includes('way/105449676'));
});

test('missing or substantially expanded source trace leaves the material unchanged',()=>{
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,0,1],3));
 const material=new THREE.MeshStandardMaterial(),original=material.onBeforeCompile;
 for(const f of [{paths:[]},{...features,paths:features.paths.map(p=>p.id==='way/946510942'?{...p,points:[...p.points,...p.points,...p.points]}:p)}]){
  assert.equal(makeKeihanStreetGroundMask(f),null);assert.equal(blendKeihanStreetGround(geometry,material,f).built,false);assert.equal(material.onBeforeCompile,original);
 }
});

test('appearance hook preserves courtyard and entrance shader stages and uses one bounded loop',()=>{
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-300,30,-120,-290,30,-120,-300,30,-110],3));
 const material=new THREE.MeshStandardMaterial(),romon={target:[0,0,0],source:[0,0,0],yaw:0},gravel={map:new THREE.Texture()};
 blendCourtyardGround(material,gravel,romon);blendEntranceGround(geometry,material,gravel,romon,features);
 const before=[...geometry.attributes.position.array],attributes=Object.keys(geometry.attributes),report=blendKeihanStreetGround(geometry,material,features);
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <color_fragment>\n#include <normal_fragment_maps>'};material.onBeforeCompile(shader);
 assert.equal(report.segments,43);assert.equal(shader.uniforms.keihanStreetSegments.value.length,43);assert.equal(shader.uniforms.courtMap.value,gravel.map);assert.equal(shader.uniforms.entranceGravel.value,gravel.map);
 assert.match(shader.fragmentShader,/for\(int i=0;i<43;i\+\+\)/);assert.ok(shader.fragmentShader.indexOf('return 0.0')<shader.fragmentShader.indexOf('for(int'));
 assert.equal(shader.fragmentShader.match(/#include <normal_fragment_maps>/g).length,1);assert.match(shader.fragmentShader,/keihanBaseNormal,keihanGroundWeight/);assert.match(shader.fragmentShader,/entranceBaseNormal,entranceWeight/);assert.match(shader.fragmentShader,/untexturedNormal,max\(courtWeight/);
 assert.match(material.customProgramCacheKey(),/entrance-mineral-v2-keihan-street-mineral-v1-43/);
 assert.deepEqual([...geometry.attributes.position.array],before);assert.deepEqual(Object.keys(geometry.attributes),attributes);
});

test('blending cannot reintroduce terrain into the clipped canal or alter physical support',()=>{
 const positions=[-240,31,-160,-200,31,-160,-200,31,-30,-240,31,-160,-200,31,-30,-240,31,-30];
 const clipped=clipMitsuTerrain(positions,[KEIHAN_CANAL_RING]),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(clipped,3));geometry.computeVertexNormals();
 const before=geometry.attributes.position.array.slice(),normal=geometry.attributes.normal.array.slice(),material=new THREE.MeshStandardMaterial();
 blendKeihanStreetGround(geometry,material,features);assert.deepEqual(geometry.attributes.position.array,before);assert.deepEqual(geometry.attributes.normal.array,normal);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(-221,40,-100),new THREE.Vector3(0,-1,0),0,43);assert.equal(ray.intersectObject(mesh).length,0);
});

test('east-gate sidewalk and bridge-bank paving suppress forest soil without filling adjacent parcels',()=>{
 const layout=makeKeihanStreetGroundMask(features);
 for(const p of [[-301.277,-124.745],[-302.554,-117.219],[-230.98,-86.662],[-232.603,-77.245]])assert.equal(layout.mask(...p),1);
 for(const p of [[-307,-104],[-240,-81],[-242,-140],[-297,-180]])assert.equal(layout.mask(...p),0);
 for(const id of ['way/777222941','way/118027062','way/790920573'])assert.ok(layout.sourceIds.includes(id));
});

test('mapped southbound rail verge receives ballast only within its sourced corridor',()=>{
 const layout=makeKeihanStreetGroundMask(features);
 for(const point of [[-313,-104],[-312.406,-97.137],[-315.909,-80.996]])assert.equal(layout.mask(...point),1);
 for(const point of [[-307,-104],[-320,-104],[-313,-54]])assert.equal(layout.mask(...point),0);
 for(const id of ['way/30430501','way/335685468'])assert.ok(layout.sourceIds.includes(id));
});
