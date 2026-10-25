import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installSky,SKY_SUN_DIRECTIONS,skyDistanceScale} from './sky-nodes.mjs';

test('sun follows sunset horizon, clouds drift without repainting and night preserves stars',()=>{
  const previous=globalThis.document;
  const canvases=[];
  globalThis.document={createElement(){
    const context={paints:0,createLinearGradient(){return {addColorStop(){}};},fillRect(){this.paints++;},clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},ellipse(){},fill(){}};
    const canvas={getContext:()=>context,context};canvases.push(canvas);return canvas;
  }};
  try{
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
    const sky=installSky(scene,camera);
    const sun=scene.getObjectByName('Solar disc'),clouds=scene.getObjectByName('Drifting sky clouds');
    sky.setMode('gold');camera.position.set(40,20,-80);sky.update();
    const direction=sun.position.clone().sub(camera.position).normalize();
    assert.ok(direction.distanceTo(new THREE.Vector3(...SKY_SUN_DIRECTIONS.gold).normalize())<1e-10);
    assert.ok(direction.y>.05&&direction.y<.15,'sunset disc stays just above horizon');
    assert.ok(sun.visible);
    assert.deepEqual(clouds.position.toArray(),camera.position.toArray());
    const rotation=clouds.rotation.y,version=clouds.material.map.version;
    sky.update();assert.ok(clouds.rotation.y>=rotation);assert.equal(clouds.material.map.version,version);
    sky.setMode('night');assert.equal(sun.visible,false);
    assert.ok(scene.children.find(object=>object.isSprite&&object!==sun).visible);
    sky.setLook('sakura');sky.setLook('dreamcore');sky.setMode('day');sky.update();assert.ok(sun.visible);
    const dome=scene.children.find(object=>object.geometry?.parameters.radius===6000);
    for(const far of [700,1000,1400,12000]){
      camera.far=far;sky.update();const scale=skyDistanceScale(far);
      assert.equal(dome.scale.x,scale);assert.equal(clouds.scale.x,scale);
      assert.ok(6000*scale<far);assert.ok(5800*scale<far);
      assert.ok(sun.position.distanceTo(camera.position)+sun.scale.x/Math.sqrt(2)<far);
      assert.ok(5000*scale<far,'star positions remain inside the far plane');
      assert.ok(Math.abs(sun.scale.x/sun.position.distanceTo(camera.position)-350/5400)<1e-10,'solar angular size stays constant');
    }
    for(const object of scene.children)assert.equal(object.material.fog,false);
  }finally{globalThis.document=previous;}
});
