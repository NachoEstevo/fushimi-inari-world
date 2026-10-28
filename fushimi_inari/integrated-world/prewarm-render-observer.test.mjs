import test from 'node:test';
import assert from 'node:assert/strict';
import {observePrewarmRenders} from './prewarm-render-observer.mjs';
test('only completed main-camera draws warm exact registered meshes, preserving callbacks and ownership',()=>{
 let rendering=false,calls=0;const camera={},shadow={},seen=[],proto={onAfterRender(){calls++;return 7;}},mesh=Object.assign(Object.create(proto),{isMesh:true}),lod={isMesh:false};
 const observer=observePrewarmRenders([{object:mesh},{object:mesh},{object:lod}],{camera,service:{markRendered:o=>seen.push(o)},isRendering:()=>rendering});
 assert.equal(mesh.onAfterRender(null,null,camera),7);rendering=true;mesh.onAfterRender(null,null,shadow);mesh.onAfterRender(null,null,camera);
 assert.deepEqual(seen,[mesh]);assert.equal(calls,3);assert.equal(lod.onAfterRender,undefined);observer.dispose();assert.equal(Object.hasOwn(mesh,'onAfterRender'),false);observer.dispose();
});
test('multi-material draws and callback-invalidated materials do not mark a whole root ready',()=>{
 const camera={},seen=[],multi={isMesh:true,material:[{},{}],onAfterRender(){}},mesh={isMesh:true,material:{version:0},onAfterRender(){this.material.version++;}};
 const observer=observePrewarmRenders([{object:multi},{object:mesh}],{camera,service:{markRendered:o=>seen.push(o)},isRendering:()=>true});
 multi.onAfterRender(null,null,camera);mesh.onAfterRender(null,null,camera);assert.deepEqual(seen,[]);observer.dispose();
});
test('render callbacks retain the engine arguments, receiver and return value; thrown draws never warm',()=>{
 const camera={},renderer={},scene={},geometry={},material={version:0},group={},failure=new Error('draw failed'),seen=[];
 let fail=false;const mesh={isMesh:true,material,onAfterRender(...args){
  assert.equal(this,mesh);assert.deepEqual(args,[renderer,scene,camera,geometry,material,group]);
  if(fail)throw failure;return group;
 }};
 const original=mesh.onAfterRender,observer=observePrewarmRenders([{object:mesh}],{camera,service:{markRendered:o=>seen.push(o)},isRendering:()=>true});
 assert.equal(mesh.onAfterRender(renderer,scene,camera,geometry,material,group),group);assert.deepEqual(seen,[mesh]);
 fail=true;assert.throws(()=>mesh.onAfterRender(renderer,scene,camera,geometry,material,group),error=>error===failure);assert.deepEqual(seen,[mesh]);
 observer.dispose();assert.equal(mesh.onAfterRender,original);
});
test('a callback replacing its material cannot warm the new material with the old draw',()=>{
 const camera={},seen=[],drawn={version:0},replacement={version:0},mesh={isMesh:true,material:drawn,onAfterRender(){this.material=replacement;}};
 const observer=observePrewarmRenders([{object:mesh}],{camera,service:{markRendered:o=>seen.push(o)},isRendering:()=>true});
 mesh.onAfterRender(null,null,camera,null,drawn,null);assert.deepEqual(seen,[]);observer.dispose();
});
