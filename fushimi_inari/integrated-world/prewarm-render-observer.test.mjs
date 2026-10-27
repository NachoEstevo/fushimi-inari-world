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
