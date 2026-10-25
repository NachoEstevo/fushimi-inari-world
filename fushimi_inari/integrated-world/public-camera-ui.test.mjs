import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {installExplorationMenu} from './exploration-menu.mjs';
import {installPhotoMode} from './photo-mode.mjs';
function fixture(){
 const original={document:globalThis.document,addEventListener:globalThis.addEventListener},elements=new Map(),keys=[];
 class Element{
  constructor(id){this.id=id;this.hidden=false;this.disabled=true;this.open=false;this.events={};this.dataset={};this.children=[];this.parentElement=this;this.classList={add(){},remove(){},toggle(){},contains:()=>false};}
  set innerHTML(html){this.html=html;for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element(match[1]));}
  get innerHTML(){return this.html;}
  setAttribute(){} append(...children){this.children.push(...children);for(const child of children)if(child.id)elements.set(child.id,child);} insertAdjacentHTML(){} querySelectorAll(){return [];} before(){} focus(){} blur(){}
  addEventListener(name,fn){this.events[name]=fn;}
  click(){this.onclick?.();} showModal(){this.open=true;} close(){this.open=false;this.events.close?.();}
 }
 const el=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
 globalThis.document={body:new Element('body'),getElementById:el,createElement:()=>new Element(),querySelector:el,pointerLockElement:null,exitPointerLock(){this.pointerLockElement=null;}};
 globalThis.addEventListener=(name,fn)=>{if(name==='keydown')keys.push(fn);};
 const controls={enabled:true},camera=new THREE.PerspectiveCamera(),walker={mode:'orbit',active:false,pace:'slow',setPace(v){this.pace=v;},pause(){},start(){this.mode='walk';this.active=true;},stop(){this.mode='orbit';this.active=false;},fly(){this.mode='fly';}};
 return {el,elements,keys,controls,camera,walker,restore(){Object.assign(globalThis,original);}};
}
for(const debug of [false,true])test(`menu exposes camera and full detail controls only for debug=${debug}`,()=>{
 const f=fixture();try{
 installExplorationMenu({walker:f.walker,controls:f.controls,camera:f.camera,assembly:{spatial:{anchors:[]}},places:f.el('places'),sound:{enabled:false,set(){}},allowDebugCamera:debug});
 assert.equal(f.elements.has('mode-fly'),debug);assert.equal(f.elements.has('mode-orbit'),debug);assert.equal(f.elements.has('detail-distance'),debug);assert.equal(f.el('overview').hidden,!debug);
 f.el('menu-open').click();f.el('menu-close').click();assert.equal(f.controls.enabled,debug);
 document.pointerLockElement={};const event={code:'Escape',preventDefault(){},stopImmediatePropagation(){}};f.keys[0](event);
 assert.equal(document.pointerLockElement,null);assert.equal(f.el('exploration-menu').open,false);
 }finally{f.restore();}
});
for(const debugCamera of [false,true])for(const fastTravel of [false,true])test(`menu fast travel=${fastTravel} is independent from debug camera=${debugCamera}`,()=>{
 const f=fixture();try{
 const places=f.el('places');
 installExplorationMenu({walker:f.walker,controls:f.controls,camera:f.camera,assembly:{spatial:{anchors:[]}},places,sound:{enabled:false,set(){}},allowDebugCamera:debugCamera,allowFastTravel:fastTravel});
 assert.equal(places.hidden,!fastTravel);
 assert.equal(f.el('pane-0').innerHTML.includes('Go to a place'),fastTravel);
 for(const id of ['walk','stop','speed'])assert.equal(f.el(id).hidden,!fastTravel);
 assert.equal(document.querySelector('label[for="speed"]').hidden,!fastTravel);
 assert.equal(f.elements.has('mode-fly'),debugCamera);
 assert.ok(f.el('pane-2').innerHTML.includes('Ultra · enhanced resolution and textures'));
 }finally{f.restore();}
});
test('menu disables fast travel by default while retaining route planning',()=>{
 const f=fixture();try{
 const places=f.el('places'),routePlanner=f.el('aside');
 installExplorationMenu({walker:f.walker,controls:f.controls,camera:f.camera,assembly:{spatial:{anchors:[]}},places,sound:{enabled:false,set(){}}});
 assert.equal(places.hidden,true);assert.equal(f.el('pane-0').innerHTML.includes('Go to a place'),false);
 assert.ok(f.el('pane-1').children.includes(routePlanner));assert.equal(routePlanner.hidden,false);
 assert.equal(f.el('route').hidden,false);assert.equal(f.el('itinerary').hidden,false);
 }finally{f.restore();}
});
for(const debug of [false,true])test(`photo restores only permitted controls and mode for debug=${debug}`,()=>{
 const f=fixture();try{
 const renderer={toneMappingExposure:1};f.el('stop').disabled=true;
 installPhotoMode({renderer,scene:{},camera:f.camera,walker:f.walker,controls:f.controls,overlays:()=>[],allowDebugCamera:debug});
 f.el('photo-open').click();assert.equal(f.controls.enabled,false);f.el('photo-close').click();
 assert.equal(f.controls.enabled,debug);assert.equal(f.walker.mode,debug?'orbit':'walk');
 }finally{f.restore();}
});

