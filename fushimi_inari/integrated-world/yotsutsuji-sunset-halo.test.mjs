import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import {pass} from 'three/tsl';
import {createYotsutsujiSunsetHalo,projectSunDisc} from './yotsutsuji-sunset-halo.mjs';
import {SUN_CORE_RADIUS_UV} from './sky-nodes.mjs';
import {SUN_DIRECTIONS} from './atmosphere-profile.mjs';
import {outlooks} from './panorama-policy.mjs';

function sunsetView(){
  const camera=new THREE.PerspectiveCamera(56,16/9,.2,1400);
  camera.coordinateSystem=THREE.WebGPUCoordinateSystem;
  camera.position.set(...outlooks[0]);camera.updateProjectionMatrix();
  const sprite=new THREE.Sprite(),scale=camera.far/7500;
  sprite.scale.setScalar(740*scale);
  sprite.position.copy(camera.position).addScaledVector(new THREE.Vector3(...SUN_DIRECTIONS.gold).normalize(),5400*scale);
  camera.lookAt(sprite.position);
  return {camera,sprite,disc:new THREE.Vector4(),view:new THREE.Vector3()};
}

test('the footprint follows the real billboard through aspect, zoom and crop, and compares at its actual plane in either depth convention',()=>{
  const {camera,sprite,disc,view}=sunsetView();
  for(const reversed of [false,true]){
    camera._reversedDepth=reversed;
    for(const [aspect,zoom] of [[16/9,1],[.55,1],[1.2,2.6]]){
      camera.clearViewOffset();camera.aspect=aspect;camera.zoom=zoom;camera.updateProjectionMatrix();
      const z=projectSunDisc(camera,sprite,disc,view);
      assert.ok(Math.abs(disc.x-.5)+Math.abs(disc.y-.5)<1e-10);
      const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
      const limb=sprite.position.clone().addScaledVector(right,sprite.scale.x*SUN_CORE_RADIUS_UV).project(camera);
      assert.ok(Math.abs(disc.z-limb.x*.5)<1e-10);
      assert.ok(Math.abs(disc.z*aspect-disc.w)<1e-10);
      const d=camera.position.distanceTo(sprite.position);
      for(const [distance,open] of [[.5,false],[d*.99,false],[d*1.01,true],[camera.far,true]]){
        const depth=new THREE.Vector3(0,0,-distance).applyMatrix4(camera.projectionMatrix).z;
        assert.equal((depth-z)*(reversed?-1:1)>=0,open);
      }
    }
    camera.setViewOffset(1000,800,100,80,700,560);
    projectSunDisc(camera,sprite,disc,view);
    assert.ok(Math.abs(disc.x-400/700)+Math.abs(disc.y-320/560)<1e-10);
  }
});

test('a disc crossing the frame edge remains partially visible and a disc behind or fully outside the view is rejected',()=>{
  const {camera,sprite,disc,view}=sunsetView();
  camera.position.set(0,0,0);camera.quaternion.identity();
  const distance=100,edge=distance/camera.projectionMatrix.elements[0];
  const radius=sprite.scale.x*SUN_CORE_RADIUS_UV;
  sprite.position.set(edge+radius*.4,0,-distance);
  assert.notEqual(projectSunDisc(camera,sprite,disc,view),null);
  assert.ok(disc.x>1&&disc.x-disc.z<1);
  sprite.position.x=edge+radius*1.01;assert.equal(projectSunDisc(camera,sprite,disc,view),null);
  sprite.position.set(0,0,distance);assert.equal(projectSunDisc(camera,sprite,disc,view),null);
});

test('High natural sunset hands the sprite halo over gradually at the lookout and restores it outside or on mode changes',()=>{
  const {camera,sprite}=sunsetView(),scenePass=pass(new THREE.Scene(),camera);
  let spriteStrength=1;
  const sky={sunDisc:sprite,naturalSunset:true,setSpriteHaloStrength(value){spriteStrength=value;}};
  const halo=createYotsutsujiSunsetHalo({camera,sky,depth:scenePass.getTextureNode('depth')});
  halo.update(false);assert.equal(spriteStrength,1);
  halo.update(true);assert.equal(spriteStrength,0);
  camera.position.x+=34;halo.update(true);assert.equal(spriteStrength,.5);
  camera.position.x+=20;halo.update(true);assert.equal(spriteStrength,1);
  camera.position.set(...outlooks[0]);sky.naturalSunset=false;halo.update(true);assert.equal(spriteStrength,1);
  sky.naturalSunset=true;halo.update(true);halo.dispose();assert.equal(spriteStrength,1);
  scenePass.dispose();
});

test('r187 builds vertex-only fixed disk sampling for the actual multisampled scene depth and passes one flat visibility value to the composite',()=>{
  const renderer=new THREE.WebGPURenderer({antialias:true,canvas:{width:1,height:1}});
  renderer.hasFeature=()=>false;renderer.backend.renderer=renderer;
  renderer._bindings={getSharedBindGroup:group=>group};
  const {camera}=sunsetView(),scene=new THREE.Scene(),scenePass=pass(scene,camera);
  const depth=scenePass.getTextureNode('depth');
  const halo=createYotsutsujiSunsetHalo({camera,sky:{setSpriteHaloStrength(){}},depth});
  const material=new THREE.NodeMaterial(),quad=new THREE.QuadMesh(material);
  material.fragmentNode=halo.light;
  try{
    const builder=renderer.backend.createNodeBuilder(quad,renderer);
    builder.scene=scene;builder.camera=quad.camera;builder.build();
    assert.match(builder.vertexShader,/texture_depth_multisampled_2d/);
    assert.match(builder.vertexShader,/if [^\n]+\.z > 0\.0[^]*?for [^\n]+i < 48/);
    assert.equal((builder.vertexShader.match(/textureLoad\(/g)??[]).length,4);
    assert.match(builder.vertexShader,/textureDimensions\( \w+ \)/);
    assert.doesNotMatch(builder.fragmentShader,/texture(?:Load|Sample|Dimensions)\(/);
    assert.match(builder.fragmentShader,/@interpolate\( flat \) sunsetDiscCoverage/);
    assert.match(builder.fragmentShader,/if [^\n]+< 20\.0/);
    // Sweep a straight silhouette across the sample locations emitted by TSL.
    const disk=builder.vertexShader.match(/array< vec2<f32>, 48 >\((.*?)\)\[ i \]/)[1];
    const taps=[...disk.matchAll(/vec2<f32>\( ([-\d.]+), ([-\d.]+) \)/g)].map(match=>match.slice(1).map(Number));
    assert.equal(taps.length,48);
    for(const angle of [0,Math.PI/4,Math.PI/2]){
      const edges=taps.map(([x,y])=>x*Math.cos(angle)+y*Math.sin(angle));
      const open=f=>edges.filter(t=>t<=f).length/edges.length;
      assert.equal(open(-1),0);assert.equal(open(1),1);
      assert.ok(Math.abs(open(0)-.5)<.04);
      for(let edge=-1;edge<1;edge+=.02){
        const area=(Math.acos(-edge)+edge*Math.sqrt(1-edge*edge))/Math.PI;
        assert.ok(Math.abs(open(edge)-area)<.06,'visible fraction tracks a circular segment');
      }
    }
  }finally{halo.dispose();material.dispose();scenePass.dispose();}
});
