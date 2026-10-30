import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installSky,SKY_SUN_DIRECTIONS,skyDistanceScale} from './sky-nodes.mjs';
import {LIGHT_PRESETS} from './route-lighting-nodes.mjs';
import {HORIZON_COLORS} from './viewing-distance.mjs';
import {GOLDEN_ATMOSPHERE} from './atmosphere-profile.mjs';

test('sun follows sunset horizon, clouds drift without repainting and night preserves stars',()=>{
  const previous=globalThis.document;
  const canvases=[];
  globalThis.document={createElement(){
    const context={paints:0,gradients:[],createLinearGradient(){const stops=[];this.gradients.push(stops);return {addColorStop(at,color){stops.push([at,color]);}};},fillRect(){this.paints++;},clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},ellipse(){},fill(){}};
    const canvas={getContext:()=>context,context};canvases.push(canvas);return canvas;
  }};
  try{
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
    const sky=installSky(scene,camera);
    const sun=scene.getObjectByName('Solar disc'),clouds=scene.getObjectByName('Drifting sky clouds');
    sky.setMode('gold');camera.position.set(40,20,-80);sky.update();
    const direction=sun.position.clone().sub(camera.position).normalize();
    assert.ok(direction.distanceTo(new THREE.Vector3(...SKY_SUN_DIRECTIONS.gold).normalize())<1e-10);
    const elevation=THREE.MathUtils.radToDeg(Math.asin(direction.y));assert.ok(elevation>=3&&elevation<=4,'sunset disc stays three to four degrees above the true horizon');
    const angularDiameter=THREE.MathUtils.radToDeg(2*Math.atan(sun.scale.x*.22/(2*sun.position.distanceTo(camera.position))));
    assert.ok(angularDiameter>1.5&&angularDiameter<2,'the warm sunset core remains legible as a broad cinematic disc, rather than only enlarging its transparent halo');
    assert.ok(direction.distanceTo(new THREE.Vector3(...LIGHT_PRESETS.gold.offset).normalize())<1e-10,'visible disc and directional shadows share one solar direction');
    for(const look of ['natural','sakura','dreamcore','aozora']){sky.setLook(look);const gradient=canvases[0].context.gradients.at(-1);assert.equal(gradient.find(([at])=>at===.51)[1],HORIZON_COLORS.gold,'golden sky meets the same haze as the scene fog');}
    const tints=[];sun.material.colorNode.traverse(node=>{if(node.isUniformNode&&node.value?.isColor)tints.push(node.value.getHexString());});
    assert.ok(tints.includes(GOLDEN_ATMOSPHERE.disc.slice(1)),'the rendered solar disc uses the shared red-orange tint');
    assert.equal(sun.material.toneMapped,false);
    assert.ok(sun.visible);
    assert.deepEqual(clouds.position.toArray(),camera.position.toArray());
    const rotation=clouds.rotation.y,version=clouds.material.map.version;
    sky.update();assert.ok(clouds.rotation.y>=rotation);assert.equal(clouds.material.map.version,version);
    sky.setMode('night');assert.equal(sun.visible,false);
    assert.ok(scene.children.find(object=>object.isSprite&&object!==sun).visible);
    sky.setLook('sakura');sky.setLook('dreamcore');sky.setMode('day');sky.update();assert.ok(sun.visible);
    sky.setLook('aozora');const textureCount=scene.children.filter(o=>o.material.map).length,cloudMap=clouds.material.map;
    const blue=canvases[0].context.gradients.at(-1);assert.equal(blue[0][1],'#0754bb');
    const paintCount=canvases[0].context.paints;for(let i=0;i<60;i++)sky.update();
    assert.equal(canvases[0].context.paints,paintCount);assert.equal(clouds.material.map,cloudMap);
    assert.equal(scene.children.filter(o=>o.material.map).length,textureCount);

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
