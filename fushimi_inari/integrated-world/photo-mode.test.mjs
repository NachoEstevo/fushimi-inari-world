import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installPhotoMode} from './photo-mode.mjs';

function fixture(callback,options={}){
 const previous={document:globalThis.document,addEventListener:globalThis.addEventListener},nodes=new Map();let encode;
 const node=()=>({hidden:false,disabled:false,value:'0',style:{},setAttribute(){},append(){},focus(){},addEventListener(){},click(){}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const body={append(element){if(element.id)nodes.set(element.id,element);},classList:{add(){},remove(){}}};
 globalThis.document={body,getElementById:get,createElement(tag){const e=node();if(tag==='canvas'){e.getContext=()=>({drawImage(){}});e.toBlob=fn=>{encode=fn;};}return e;}};
 globalThis.addEventListener=()=>{};
 const camera=new THREE.PerspectiveCamera(45,4/3,.1,100);camera.position.set(100,22,40);camera.lookAt(-800,22,-300);camera.updateMatrixWorld(true);
 let ratio=2,size=new THREE.Vector2(800,600);const renderer={toneMappingExposure:1,domElement:{},getSize:v=>v.copy(size),getPixelRatio:()=>ratio,setPixelRatio:v=>ratio=v,setSize:(x,y)=>size.set(x,y)};
 get('stop').disabled=true;get('photo-size').value='1920';
 installPhotoMode({renderer,scene:{},camera,walker:{mode:'walk',pause(){}},controls:{enabled:true},overlays:()=>[],render(){},onCaptured:callback,...options});
 get('photo-open').onclick();
 return {camera,get,encode:blob=>encode(blob),snapshot:()=>({ratio,size:size.toArray()}),cleanup(){const href=get('photo-result').href;if(href)URL.revokeObjectURL(href);globalThis.document=previous.document;globalThis.addEventListener=previous.addEventListener;}};
}

test('successful PNG reports its original pose and dimensions after encoding and restores the renderer',async()=>{
 const captures=[],f=fixture(data=>{captures.push(data);return 'Panorama added to your journal.';});
 try{
  const position=f.camera.position.toArray(),direction=f.camera.getWorldDirection(new THREE.Vector3()).toArray();
  const save=f.get('photo-save').onclick();assert.equal(captures.length,0);
  f.camera.position.set(0,99,0);f.camera.lookAt(100,99,0);
  f.encode(new Blob(['PNG'],{type:'image/png'}));await save;
  assert.deepEqual(captures,[{position,direction,width:1920,height:1440}]);
  assert.match(f.get('photo-status').textContent,/Saved 1920.*Panorama added/);
  assert.deepEqual(f.snapshot(),{ratio:2,size:[800,600]});assert.equal(f.get('photo-save').disabled,false);
 }finally{f.cleanup();}
});

test('failed PNG never reports a capture or awards an optional moment',async()=>{
 let captures=0;const f=fixture(()=>captures++);
 try{const save=f.get('photo-save').onclick();f.encode(null);await save;assert.equal(captures,0);assert.match(f.get('photo-status').textContent,/Could not save photo/);assert.deepEqual(f.snapshot(),{ratio:2,size:[800,600]});}
 finally{f.cleanup();}
});


test('journal capture supplies its actual image and snapshots world context before asynchronous encoding',async()=>{
 let context={mode:'walk',fov:55,weather:'drizzle',createdAt:123},captured;const f=fixture(async value=>{captured=value;return 'Kept in your journal.';},{includeImage:true,getCaptureContext:()=>({...context})});
 try{const task=f.get('photo-keep').onclick();context.weather='clear';const blob=new Blob(['photo'],{type:'image/png'});f.encode(blob);await task;assert.equal(captured.blob,blob);assert.equal(captured.weather,'drizzle');assert.equal(captured.mode,'walk');assert.equal(captured.fov,55);assert.match(f.get('photo-status').textContent,/Kept/);}finally{f.cleanup();}
});
test('closing photography preserves a surrounding seated camera pause',()=>{const pauses=[],controls={enabled:true};const f=fixture(()=>{},{walker:{mode:'walk',pause:value=>pauses.push(value)},controls,isCameraOwned:()=>true});try{f.get('photo-close').onclick();assert.equal(pauses.at(-1),true);assert.equal(controls.enabled,false);}finally{f.cleanup();}});
test('closing a photo during a return train leaves its temporary camera mode untouched',()=>{const starts=[],pauses=[],f=fixture(()=>{},{walker:{mode:'orbit',pause:v=>pauses.push(v),start:()=>starts.push('walk')},isCameraOwned:()=>true});try{f.get('photo-close').onclick();assert.deepEqual(starts,[]);assert.equal(pauses.at(-1),true);}finally{f.cleanup();}});
