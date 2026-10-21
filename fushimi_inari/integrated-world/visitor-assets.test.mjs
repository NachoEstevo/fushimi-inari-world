import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const name of ['Casual_Male','Casual_Female','Kimono_Female'])test(`${name} ships a bounded skinned model with a nonempty animated clip`,()=>{
  const buffer=readFileSync(new URL(`../assets/models/visitors/${name}.glb`,import.meta.url));
  assert.equal(buffer.readUInt32LE(0),0x46546c67);assert.ok(buffer.length<1024*1024);
  const length=buffer.readUInt32LE(12),gltf=JSON.parse(buffer.subarray(20,20+length).toString());
  assert.ok(gltf.skins?.[0]?.joints.length>10);
  const animation=gltf.animations?.[0];assert.ok(animation?.channels.length>10,'export must retain skeletal animation');
  for(const sampler of animation.samplers)assert.ok(gltf.accessors[sampler.input].count>1);
  assert.ok(gltf.meshes.every(m=>m.primitives.every(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
});
