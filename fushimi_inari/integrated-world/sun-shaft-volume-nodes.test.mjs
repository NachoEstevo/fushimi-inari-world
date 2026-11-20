import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {texture} from 'three/tsl';
import {createLocalSunShafts} from './local-sun-shafts.mjs';

function buildVolumeFragment(){
 const scene=new THREE.Scene(),depth=new THREE.DepthTexture(1,1);
 const effect=createLocalSunShafts({scene,depthTexture:texture(depth)});
 // Generate production WGSL without initializing a GPU device.
 const renderer=new THREE.WebGPURenderer({canvas:{width:1,height:1}});
 renderer.hasFeature=()=>false;
 renderer.backend.renderer=renderer;
 renderer._bindings={getSharedBindGroup:group=>group};
 try{
  const builder=renderer.backend.createNodeBuilder(effect.mesh,renderer);
  builder.scene=scene;builder.camera=new THREE.PerspectiveCamera();
  builder.build();
  return builder.fragmentShader;
 }finally{effect.dispose();depth.dispose();}
}

test('volume scattering has a soft shoulder and a tight, bounded peak toward the sun',()=>{
 const shader=buildVolumeFragment();
 const phase=shader.match(/fn shaftForwardScattering\s*\([^)]*\)[^{]*\{([^}]+)\}/)?.[1];
 assert.ok(phase,'the production volume shader has a forward phase function');
 const lobes=[...phase.matchAll(/smoothstep\(\s*(-?[\d.]+),\s*(-?[\d.]+),\s*\w+\s*\)\s*\*\s*([\d.]+)/g)];
 assert.equal(lobes.length,2);
 const floor=Number(phase.match(/\+\s*([\d.]+)\s*\)\s*;/)?.[1]);
 const gain=cosine=>lobes.reduce((sum,[,lo,hi,weight])=>{
  const u=Math.min(1,Math.max(0,(cosine-Number(lo))/(Number(hi)-Number(lo))));
  return sum+Number(weight)*u*u*(3-2*u);
 },floor);
 assert.ok(gain(-1)>=.85&&gain(-1)<=1);
 assert.ok(gain(0)>gain(-1)+.15);
 assert.ok(gain(.7)>gain(0)+.25);
 assert.ok(gain(1)>gain(.7)+.3&&gain(1)<=2);
 for(let i=1;i<=100;i++)assert.ok(gain(i/50-1)>=gain((i-1)/50-1));
});

test('only the aerial integral uses the signed camera-to-sun angle and retains its sampling budget',()=>{
 const shader=buildVolumeFragment();
 const groundStart=shader.search(/if\s*\(\s*\(\s*\(\s*\w+\.z\s*>\s*0\.5/);
 assert.ok(groundStart>0,'the ground opening remains a separate optional contribution');
 const air=shader.slice(0,groundStart),ground=shader.slice(groundStart);
 const delta=air.match(/let (\w+) = \( v_positionWorld - render.cameraPosition \);/)?.[1];
 assert.ok(delta);
 const ray=air.match(new RegExp(`let (\\w+) = \\( ${delta} / vec3<f32>\\( max\\( length\\( ${delta} \\),`))?.[1];
 assert.ok(ray);
 const cosine=air.match(new RegExp(`let (\\w+) = dot\\( ${ray}, object\\.\\w+ \\);`))?.[1];
 assert.ok(cosine);
 assert.ok(new RegExp(`shaftForwardScattering\\(\\s*${cosine}\\s*\\)`).test(air),'the volume uses the existing signed ray-axis dot');
 assert.doesNotMatch(ground,/shaftForwardScattering/);
 assert.equal([...shader.matchAll(/textureLoad\(/g)].length,1);
 assert.equal([...air.matchAll(/smoothstep\(\s*0\.35,\s*1\.0,/g)].length,3);
 assert.equal([...ground.matchAll(/smoothstep\(\s*0\.35,\s*1\.0,/g)].length,1);
});
