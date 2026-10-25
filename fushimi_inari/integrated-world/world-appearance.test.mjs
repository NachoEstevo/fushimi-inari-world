import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {LIGHT_PRESETS} from './route-lighting.mjs';

test('sakura field stays sparse and outside the immediate camera view',{skip:THREE.REVISION!=='180'},async()=>{
  const {createSakuraPetalField}=await import('./world-appearance.mjs');
  const field=createSakuraPetalField(),camera=new THREE.Vector3(100,20,-30),matrix=new THREE.Matrix4();
  try {
    assert.equal(field.mesh.count,64);
    assert.equal(field.mesh.geometry.attributes.position.count,6);
    assert.equal(field.mesh.material.depthWrite,false);
    for(const time of [0,50,10000,NaN]) {
      field.update(camera,time);
      const radii=[];
      for(let i=0;i<field.mesh.count;i++) {
        field.mesh.getMatrixAt(i,matrix);
        const point=new THREE.Vector3().setFromMatrixPosition(matrix);
        const radius=Math.hypot(point.x-camera.x,point.z-camera.z);radii.push(radius);
        assert.ok(radius>7.99&&radius<33.01);
        assert.ok(point.y>=camera.y-3.001&&point.y<=camera.y+13.001);
      }
      assert.ok(Math.max(...radii)-Math.min(...radii)>24,'near and far depths remain spread');
    }
  } finally {field.dispose();}
});

async function fixture(mode='day') {
  const {createWorldLookLighting}=await import('./world-appearance.mjs');
  const scene=new THREE.Scene(),hemi=new THREE.HemisphereLight(),sun=new THREE.DirectionalLight();
  function day(name) {
    const p=LIGHT_PRESETS[name];
    hemi.color.set(p.sky);hemi.groundColor.set(p.ground);hemi.intensity=p.fill;
    sun.color.set(p.color);sun.intensity=p.sun;
  }
  day(mode);
  return {scene,hemi,sun,day,lighting:createWorldLookLighting({scene,hemi,sun})};
}

test('night energy survives every look, and repeated selection never compounds',{skip:THREE.REVISION!=='180'},async()=>{
  const {scene,hemi,sun,day,lighting}=await fixture();
  lighting.setLook('sakura');lighting.updateBaseLighting(()=>day('night'));
  assert.equal(sun.intensity,LIGHT_PRESETS.night.sun*1.06);
  const intensity=scene.environmentIntensity,color=sun.color.clone();
  for(let i=0;i<10;i++)lighting.setLook('sakura');
  assert.equal(scene.environmentIntensity,intensity);assert.ok(sun.color.equals(color));
  assert.equal(hemi.intensity,LIGHT_PRESETS.night.fill*.88);
  for(const look of ['natural','sakura','dreamcore']) {
    lighting.setLook(look);
    assert.ok(scene.environmentIntensity<.14,'night studio IBL remains below half the natural day value');
    assert.ok(sun.intensity<.4,'creative look preserves night sun energy');
  }
  lighting.setLook('natural');
  assert.ok(sun.color.equals(new THREE.Color(LIGHT_PRESETS.night.color)));
  assert.ok(hemi.color.equals(new THREE.Color(LIGHT_PRESETS.night.sky)));
});

test('partial day updates restore raw colors before capture and preserve selected tint',{skip:THREE.REVISION!=='180'},async()=>{
  const {scene,hemi,sun,lighting}=await fixture('gold');
  const base=sun.color.clone();lighting.setLook('sakura');
  lighting.updateBaseLighting(()=>{sun.intensity=.1;hemi.intensity=.2;});
  assert.equal(sun.intensity,.1*1.06);
  assert.ok(sun.color.equals(base.clone().lerp(new THREE.Color('#ffbc91'),.35)));
  assert.ok(scene.environmentIntensity<.03);
  lighting.setLook('natural');
  assert.ok(sun.color.equals(base));assert.equal(sun.intensity,.1);
});

test('return to daylight restores daylight environment and latest preset hue',{skip:THREE.REVISION!=='180'},async()=>{
  const {scene,sun,day,lighting}=await fixture('night');
  lighting.setLook('dreamcore');lighting.updateBaseLighting(()=>day('gold'));
  const gold=new THREE.Color(LIGHT_PRESETS.gold.color);
  assert.ok(sun.color.equals(gold.clone().lerp(new THREE.Color('#ffffe7'),.35)));
  lighting.updateBaseLighting(()=>day('day'));lighting.setLook('natural');
  assert.equal(scene.environmentIntensity,.3);
  assert.ok(sun.color.equals(new THREE.Color(LIGHT_PRESETS.day.color)));
});

test('station capture is prepared during loading and never initiated by frame updates',{skip:THREE.REVISION!=='180'},async()=>{
  const GPU=await import('three/webgpu');
  const {installWorldAppearance}=await import('./world-appearance.mjs');
  const original=GPU.PMREMGenerator.prototype.fromScene;
  let captures=0,appearance;
  GPU.PMREMGenerator.prototype.fromScene=function(scene,sigma,near,far,options){
    if(options?.renderTarget){captures++;return options.renderTarget;}
    return new GPU.RenderTarget(16,16);
  };
  const renderer={xr:{enabled:false},autoClear:true,getRenderTarget:()=>null,getActiveCubeFace:()=>0,
    getActiveMipmapLevel:()=>0,getClearColor:value=>value,getClearAlpha:()=>1,setClearColor(){},setRenderTarget(){}};
  try {
    const scene=new GPU.Scene(),group=new GPU.Group(),camera=new GPU.PerspectiveCamera();scene.add(group);
    camera.position.set(-302.4,32,-176);
    const quality={mode:'balanced',setLook(){}};
    appearance=await installWorldAppearance({scene,renderer,camera,quality,assembly:{keihanStation:{group}},
      hemi:new GPU.HemisphereLight(),sun:new GPU.DirectionalLight()});
    const deferred=new GPU.Group(),metal=new GPU.MeshStandardMaterial({metalness:.8});metal.name='Deferred steel';
    const first=new GPU.Mesh(new GPU.BoxGeometry(),metal),second=new GPU.Mesh(first.geometry,metal);
    deferred.add(first,second);scene.add(deferred);appearance.applyTo(deferred);
    const finish=first.material;
    assert.ok(finish.isMeshPhysicalMaterial);assert.equal(second.material,finish,'deferred meshes retain shared finishes');
    appearance.applyTo(deferred);assert.equal(first.material,finish,'repeated application keeps the same finish');
    for(let i=0;i<5;i++)appearance.update(i);
    assert.equal(captures,0,'arrival frames do not lazily capture');
    const globalEnvironment=scene.environment;
    appearance.prepare();appearance.prepare();assert.equal(captures,0,'Balanced loading avoids six-view captures');
    assert.equal(appearance.stats.prepared,true);assert.equal(scene.environment,globalEnvironment);
    appearance.setLook('sakura');assert.equal(captures,0,'Balanced look changes retain pending capture');
    quality.mode='high';appearance.prepare();appearance.prepare();assert.equal(captures,1,'High captures pending state once');
    for(let i=0;i<5;i++)appearance.update(i);
    camera.position.x=0;appearance.update(10);camera.position.x=-302.4;appearance.update(11);
    assert.equal(captures,1,'proximity changes reuse the prepared probe');
    appearance.setLook('dreamcore');assert.equal(captures,2,'an explicit look event refreshes before frames resume');
    appearance.setLook('dreamcore');appearance.update(12);assert.equal(captures,2);
    quality.mode='balanced';appearance.prepare();appearance.update(13);
    assert.equal(scene.environment,globalEnvironment);assert.equal(captures,2);
    quality.mode='ultra';appearance.prepare();appearance.update(14);
    assert.equal(captures,2,'Ultra reuses the clean cached probe');assert.notEqual(scene.environment,globalEnvironment);
    appearance.dispose();assert.equal(first.material,metal,'disposal restores deferred materials');
    first.geometry.dispose();metal.dispose();
  } finally {appearance?.dispose();GPU.PMREMGenerator.prototype.fromScene=original;}
});
