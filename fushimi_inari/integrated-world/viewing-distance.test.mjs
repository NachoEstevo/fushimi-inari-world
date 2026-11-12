import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createViewingDistance,VIEW_DISTANCES,HORIZON_COLORS,HAZE_COLORS} from './viewing-distance.mjs';

test('quality changes clip world distance and blend the horizon before the far plane',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera});
 for(const [quality,far]of Object.entries(VIEW_DISTANCES)){
  const before=camera.projectionMatrix.clone();distance.setQuality(quality);
  assert.equal(camera.far,far);assert.equal(scene.fog.near,far*.65);assert.equal(scene.fog.far,far*.95);
  if(quality==='high')assert.equal(camera.projectionMatrix.equals(before),false);
 }
 for(const [time,color]of Object.entries(HAZE_COLORS)){distance.setTimeOfDay(time);assert.equal(scene.fog.color.getHexString(),color.slice(1));}
 distance.setQuality('invalid');distance.setTimeOfDay('invalid');assert.equal(camera.far,150);assert.equal(distance.stats.timeOfDay,'day');
});
test('walking and outlooks respect the requested quality cap',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera});
 distance.update(new THREE.Vector3(-300,32,-125),1);assert.equal(camera.far,150);
 distance.update(new THREE.Vector3(795,164,-216),.1);assert.equal(camera.far,150);
 for(let i=0;i<100;i++)distance.update(new THREE.Vector3(795,164,-216),.1);
 assert.equal(camera.far,150);assert.equal(distance.stats.outlook,true);
 distance.update(new THREE.Vector3(950,164,-216),.1);assert.equal(distance.stats.outlook,true);
 for(let i=0;i<100;i++)distance.update(new THREE.Vector3(-300,32,-125),.1);
 assert.equal(camera.far,150);assert.equal(distance.stats.outlook,false);
});

test('explicit debug camera retains the full world far plane across quality changes',()=>{
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera,debugCamera:true});
 for(const quality of Object.keys(VIEW_DISTANCES)){distance.setQuality(quality);assert.equal(camera.far,12000);assert.equal(scene.fog.far,11400);}
});


test('normal and outlook ranges gain fifty metres while Ultra remains the High alias',()=>{
 assert.deepEqual(VIEW_DISTANCES,{balanced:150,high:200,ultra:200});
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),distance=createViewingDistance({scene,camera});
 for(const quality of ['balanced','high','ultra']){
  distance.setQuality(quality);distance.setTimeOfDay('gold');distance.update(new THREE.Vector3(795,164,-216),1);
  assert.equal(camera.far,quality==='balanced'?150:200);assert.equal(scene.fog.near,camera.far*.65);assert.equal(scene.fog.far,camera.far*.95);
 }
 const horizon=parseInt(HAZE_COLORS.gold.slice(1),16),red=horizon>>16&255,green=horizon>>8&255;assert.ok(green/red<.7,'golden haze should lean toward warm red-orange');
});

test('fog takes the sun hue of each time of day at the horizon brightness, and the natural sky meets it',async()=>{
 const {LIGHT_PRESETS}=await import('./route-lighting-nodes.mjs'),{skyPalette}=await import('./sky-nodes.mjs');
 const Y=c=>.2126*c.r+.7152*c.g+.0722*c.b,hue=c=>new THREE.Color(c).getHSL({}).h;
 for(const mode of Object.keys(HORIZON_COLORS)){
  const horizon=new THREE.Color(HORIZON_COLORS[mode]),haze=new THREE.Color(HAZE_COLORS[mode]),sun=new THREE.Color(LIGHT_PRESETS[mode].color);
  assert.ok(Math.abs(Y(haze)-Y(horizon))/Y(horizon)<.02,`${mode} haze keeps the horizon luminance, preserving night readability`);
  const toward=(a,b)=>Math.abs(((a-b+1.5)%1)-.5);
  assert.ok(toward(hue(haze),hue(sun))<=toward(hue(horizon),hue(sun))+1e-6,`${mode} haze moves toward the sun hue`);
  assert.equal(skyPalette(mode,'natural').horizon,HAZE_COLORS[mode],'the dome horizon and fog share one colour');
 }
 assert.notEqual(HAZE_COLORS.day,HORIZON_COLORS.day,'daylight haze is no longer the fixed milky horizon');
});
