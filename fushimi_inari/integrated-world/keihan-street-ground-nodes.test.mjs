import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {vec2,vec3} from 'three/tsl';
import {keihanStreetWeight,blendKeihanStreetGround,makeKeihanStreetGroundMask} from './keihan-street-ground-nodes.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));

test('terrain street distances compile inside a lazy bounds branch',()=>{
 const layout=makeKeihanStreetGroundMask(features);
 assert.equal(layout.segments.length,43);
 // Compile the actual TSL flow without a renderer, canvas or GPU device.
 const builder=new THREE.NodeBuilder(null,{backend:{isWebGPUBackend:true},debug:{diagnostics:false}});
 builder.setShaderStage('fragment');
 const flow=builder.flowStagesNode(keihanStreetWeight(layout,vec2(-300,-100)),'float');
 const start=flow.code.indexOf('if (');
 assert.ok(start>0);
 const opening=flow.code.indexOf('{',start),closing=flow.code.lastIndexOf('}');
 const condition=flow.code.slice(start,opening),branch=flow.code.slice(opening+1,closing);
 assert.equal((condition.match(/>=|<=/g)??[]).length,4,'all four inclusive bounds are checked');
 assert.equal((branch.match(/length\(/g)??[]).length,43,'every authored segment stays inside the branch');
 assert.equal((branch.match(/smoothstep\(/g)??[]).length,43);
 assert.doesNotMatch(flow.code.slice(0,start)+flow.code.slice(closing+1),/length\(|smoothstep\(|dot\(/,
  'distance work must not be hoisted before the branch or eagerly selected');
 assert.match(flow.code.slice(0,start),/= 0\.0;/,'outside fragments retain a zero weight');
 const [xmin,xmax,zmin,zmax]=layout.bounds;
 for(const point of [[xmin-1,zmin],[xmax+1,zmax],[xmin,zmin-1],[xmax,zmax+1]])assert.equal(layout.mask(...point),0);
});

test('bounded node blend preserves existing terrain geometry and composes its appearance',()=>{
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute([-300,30,-120,-290,30,-120,-300,30,-110],3));
 geometry.computeVertexNormals();
 const positions=geometry.attributes.position.array.slice(),normals=geometry.attributes.normal.array.slice();
 const material=new THREE.MeshStandardNodeMaterial(),previous=vec3(.3,.4,.2);material.colorNode=previous;
 const report=blendKeihanStreetGround(geometry,material,features);
 assert.equal(report.built,true);assert.equal(report.segments,43);
 assert.deepEqual(geometry.attributes.position.array,positions);assert.deepEqual(geometry.attributes.normal.array,normals);
 let retained=false;material.colorNode.traverse(node=>{if(node===previous)retained=true;});assert.ok(retained);
 const untouched=new THREE.MeshStandardNodeMaterial();untouched.colorNode=previous;
 assert.equal(blendKeihanStreetGround(geometry,untouched,{paths:[]}).built,false);
 assert.equal(untouched.colorNode,previous);
});
