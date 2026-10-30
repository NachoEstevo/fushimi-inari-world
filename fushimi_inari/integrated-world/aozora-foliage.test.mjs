import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

test('painted foliage keeps alpha, instance/season ownership, maps and stable graphs across selections',{skip:Number(THREE.REVISION)<180},async()=>{
  const {createAozoraFoliage}=await import('./aozora-foliage.mjs');
  const geometry=new THREE.SphereGeometry(1),map=new THREE.Texture();
  const original=new THREE.MeshStandardMaterial({map,alphaTest:.28,side:THREE.DoubleSide});
  const a=new THREE.InstancedMesh(geometry,original,2),b=new THREE.InstancedMesh(geometry,original,1);
  a.setColorAt(0,new THREE.Color('#ff9900'));const tint=a.instanceColor;
  const rock=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color:'gray'})),rockMaterial=rock.material;
  const root=new THREE.Group();root.add(a,b,rock);
  const foliage=createAozoraFoliage({foliage:[null,{geometry}]});foliage.applyTo(root);
  assert.equal(a.material,b.material);assert.notEqual(a.material,original);assert.equal(a.material.map,map);
  assert.equal(a.material.alphaTest,.28);assert.equal(a.material.side,THREE.DoubleSide);assert.equal(a.instanceColor,tint);
  assert.equal(rock.material,rockMaterial,'unrelated stone retains its original finish');
  const node=a.material.colorNode,version=a.material.version;
  for(let i=0;i<10;i++){foliage.setLook('aozora');foliage.setSeason('autumn');foliage.setTimeOfDay('gold');}
  assert.equal(foliage.stats.strength,.75);assert.equal(a.material.colorNode,node);assert.equal(a.material.version,version);
  foliage.setTimeOfDay('night');assert.equal(foliage.stats.strength,0);
  foliage.setTimeOfDay('day');foliage.setLook('natural');assert.equal(foliage.stats.strength,0);
  assert.equal(foliage.stats.extraTextures,0);assert.equal(foliage.stats.extraGeometryBytes,0);
  const later=new THREE.MeshBasicMaterial();b.material=later;
  foliage.dispose();assert.equal(a.material,original);assert.equal(b.material,later);assert.equal(rock.material,rockMaterial);
});

test('painted RGB cannot turn cutout cards opaque and shadow passes omit pigment work',async()=>{
 const {createAozoraFoliage}=await import('./aozora-foliage.mjs'),{vec3}=await import('three/tsl');
 const source=new THREE.MeshStandardNodeMaterial({map:new THREE.Texture(),alphaTest:.28});source.colorNode=vec3(.2,.5,.1);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(),source);mesh.userData.precinctCanopy=true;
 const foliage=createAozoraFoliage();foliage.applyTo(mesh);const call=mesh.material.colorNode;
 assert.equal(mesh.material.alphaTest,source.alphaTest,'cloning an existing node material retains its authored cutout threshold');
 const shader=call.shaderNode??call.node.shaderNode;
 const pigment=shader.jsFunc({material:mesh.material}),textures=[];pigment.traverse(node=>{if(node.isTextureNode)textures.push(node.value);});
 assert.ok(textures.includes(source.map),'even RGB-only source grades preserve the authored alpha texture');
 const builder=new THREE.NodeBuilder(null,{backend:{isWebGPUBackend:true},debug:{diagnostics:false}});builder.material={isShadowPassMaterial:true};builder.setShaderStage('fragment');
 const shadow=builder.flowStagesNode(call,'vec4');assert.doesNotMatch(shadow.code,/texture|normal|materialColor/);assert.equal(builder.uniforms.fragment.length,0);
 foliage.dispose();
});

test('leaf ownership excludes unrelated geometry and binds late/LOD leaves once',{skip:Number(THREE.REVISION)<180},async()=>{
  const {createAozoraFoliage}=await import('./aozora-foliage.mjs');
  const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(),new THREE.MeshLambertMaterial());leaves.userData.precinctCanopy=true;
  const rock=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());const original=rock.material;
  const root=new THREE.Group();root.add(leaves,rock);
  const foliage=createAozoraFoliage();foliage.applyTo(root);foliage.applyTo(root);
  assert.equal(foliage.stats.materials,1);assert.equal(foliage.stats.meshes,1);assert.equal(rock.material,original);
  assert.ok(leaves.material.isMeshLambertNodeMaterial);foliage.dispose();
});
